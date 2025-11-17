"""
Feed Routes

Handles retrieving posts for the main feed and individual post details.

Endpoints:
- GET /feed - List all posts with pagination and search
- GET /feed/<post_id> - Get single post by ID with full details
"""

from flask import request, Response
from flask_restx import Namespace, Resource, fields
from flask_jwt_extended import jwt_required
from src.extensions import mongo, limiter
from src.logger import logger
from bson import ObjectId
from src.utils import download_file_from_post, validate_pagination, get_sort_criteria, batch_fetch_users
from src.models import create_post_model

# Namespace
feed_ns = Namespace("feed", description="Posts feed operations")

# Swagger models
post_response_model = create_post_model(feed_ns, include_updated_at=False)

# ---------- Routes ----------
@feed_ns.route("")
class FeedList(Resource):
    @jwt_required()
    @limiter.limit("200 per minute")  # Feed browsing limit
    def get(self):
        """
        List all project posts with pagination and search functionality.
        
        Query parameters:
        - page: Page number (default: 1)
        - limit: Posts per page (default: 10, max: 50)
        - sort: Sort order (default: created_at_desc)
        - tech_stack: Filter by technology (optional)
        - search: Search in title and description (optional)
        """
        try:
            page, limit = validate_pagination(request.args.get('page', 1), request.args.get('limit', 10))
            sort = request.args.get('sort', 'created_at_desc')
            tech_filter = request.args.get('tech_stack', '').strip()
            search_query = request.args.get('search', '').strip()
            
            skip = (page - 1) * limit
            
            # Build query
            query = {}
            
            # Tech stack filter
            if tech_filter:
                query["tech_stack"] = {"$in": [tech_filter]}
            
            # Search filter
            if search_query:
                query["$or"] = [
                    {"title": {"$regex": search_query, "$options": "i"}},
                    {"description": {"$regex": search_query, "$options": "i"}}
                ]
            
            sort_criteria = get_sort_criteria(sort)
            
            raw_posts = list(mongo.db.posts.find(query).sort(sort_criteria).skip(skip).limit(limit))
            total_posts = mongo.db.posts.count_documents(query)
            user_ids = [ObjectId(p["user_id"]) if not isinstance(p["user_id"], ObjectId) else p["user_id"] for p in raw_posts]
            users_dict = batch_fetch_users(user_ids)
            
            posts = []
            for post in raw_posts:
                # Convert ObjectId and datetime to strings
                post["id"] = str(post["_id"])
                user_id_str = str(post["user_id"])
                post["user_id"] = user_id_str
                post["created_at"] = post["created_at"].isoformat()
                
                # Convert updated_at if exists
                if "updated_at" in post and post["updated_at"]:
                    post["updated_at"] = post["updated_at"].isoformat()
                
                # Get user information from batch lookup
                user = users_dict.get(user_id_str)
                username = user.get("username", f"User{user_id_str[-4:]}") if user else f"User{user_id_str[-4:]}"
                post["author"] = {"username": username, "id": user_id_str}
                del post["_id"]
                posts.append(post)
            
            return {
                "posts": posts,
                "pagination": {
                    "page": page,
                    "limit": limit,
                    "total": total_posts,
                    "pages": (total_posts + limit - 1) // limit
                },
                "filters": {
                    "tech_stack": tech_filter,
                    "search": search_query,
                    "sort": sort
                }
            }, 200
            
        except Exception as e:
            logger.error(f"Error fetching feed: {str(e)}")
            return {"message": "Internal server error"}, 500


@feed_ns.route("/<string:post_id>")
class FeedDetail(Resource):
    @jwt_required()
    @feed_ns.marshal_with(post_response_model, code=200)
    def get(self, post_id):
        """
        Get single post by ID with full details including social data.
        
        This endpoint provides complete post information for detailed view:
        - Post details (title, description, tech_stack, files)
        - Social metrics (likes count, comments count)
        - All likes with user information
        - All comments with user information and replies
        - User information
        - Creation timestamp
        - File information for downloads
        """
        try:
            if not ObjectId.is_valid(post_id):
                return {"message": "Invalid post ID format"}, 400
                
            post = mongo.db.posts.find_one({"_id": ObjectId(post_id)})
            if not post:
                return {"message": "Post not found"}, 404
                
            # Convert ObjectId and datetime to strings
            post["id"] = str(post["_id"])
            post["user_id"] = str(post["user_id"])
            post["created_at"] = post["created_at"].isoformat()
            
            if "updated_at" in post and post["updated_at"]:
                post["updated_at"] = post["updated_at"].isoformat()
            
            user = mongo.db.users.find_one({"_id": ObjectId(post["user_id"])})
            username = user.get("username", f"User{str(post['user_id'])[-4:]}") if user else f"User{str(post['user_id'])[-4:]}"
            post["author"] = {"username": username, "id": str(user["_id"]) if user else str(post["user_id"])}

            # Get likes with batch user fetch
            like_docs = list(mongo.db.likes.find({"post_id": ObjectId(post_id)}).sort("created_at", -1))
            like_user_ids = [l["user_id"] for l in like_docs]
            like_users_dict = batch_fetch_users(like_user_ids)
            likes = [{
                "id": str(l["_id"]),
                "user": {
                    "id": str(u["_id"]),
                    "username": u.get("username", "Unknown"),
                    "email": u.get("email", "")
                },
                "created_at": l["created_at"].isoformat()
            } for l in like_docs if (u := like_users_dict.get(str(l["user_id"])))]
            
            # Get comments with batch user/reply fetch
            comment_docs = list(mongo.db.comments.find({"post_id": ObjectId(post_id)}).sort("created_at", -1))
            comment_user_ids = [c["user_id"] for c in comment_docs]
            comment_users_dict = batch_fetch_users(comment_user_ids)
            
            comment_ids = [c["_id"] for c in comment_docs]
            all_replies = list(mongo.db.replies.find({"comment_id": {"$in": comment_ids}}).sort("created_at", -1)) if comment_ids else []
            reply_user_ids = [r["user_id"] for r in all_replies]
            reply_users_dict = batch_fetch_users(reply_user_ids)
            
            replies_by_comment = {}
            for r in all_replies:
                cid = str(r["comment_id"])
                if cid not in replies_by_comment:
                    replies_by_comment[cid] = []
                if ru := reply_users_dict.get(str(r["user_id"])):
                    replies_by_comment[cid].append({
                        "id": str(r["_id"]),
                        "content": r["content"],
                        "user": {"id": str(ru["_id"]), "username": ru.get("username", "Unknown"), "email": ru.get("email", "")},
                        "comment_id": cid,
                        "post_id": str(r["post_id"]),
                        "created_at": r["created_at"].isoformat(),
                        "updated_at": r["updated_at"].isoformat()
                    })
            
            comments = [{
                "id": str(c["_id"]),
                "content": c["content"],
                "user": {"id": str(u["_id"]), "username": u.get("username", "Unknown"), "email": u.get("email", "")},
                "post_id": str(c["post_id"]),
                "replies": replies_by_comment.get(str(c["_id"]), []),
                "replies_count": len(replies_by_comment.get(str(c["_id"]), [])),
                "created_at": c["created_at"].isoformat(),
                "updated_at": c["updated_at"].isoformat()
            } for c in comment_docs if (u := comment_users_dict.get(str(c["user_id"])))]
            
            # Add social data to post
            post["likes"] = likes
            post["comments"] = comments
            
            # Remove internal fields
            del post["_id"]
            
            return post, 200
            
        except Exception as e:
            logger.error(f"Error fetching post {post_id}: {str(e)}")
            return {"message": "Internal server error"}, 500

@feed_ns.route("/posts/<string:post_id>/files/<string:file_id>")
class FeedFileDownload(Resource):
    @jwt_required()
    @limiter.limit("200 per hour")  # Allow more file downloads
    def get(self, post_id, file_id):
        """
        Download a file from a post (public access for authenticated users)
        """
        try:
            # Use the centralized file download function
            success, error_msg, file_data, file_info = download_file_from_post(post_id, file_id)
            
            if not success:
                return {"message": error_msg}, 404
            
            # Return file with appropriate headers
            return Response(
                file_data,
                mimetype=file_info["content_type"],
                headers={
                    "Content-Disposition": f"attachment; filename={file_info['filename']}",
                    "Content-Length": str(len(file_data))
                }
            )
            
        except Exception as e:
            logger.error(f"Error in file download endpoint: {str(e)}")
            return {"message": "Internal server error"}, 500
