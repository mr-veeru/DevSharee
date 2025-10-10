"""
Feed Routes

Handles retrieving posts for the main feed and individual post details.

Endpoints:
- GET /feed - List all posts with pagination and search
- GET /feed/<post_id> - Get single post by ID with full details
"""

from flask import request
from flask_restx import Namespace, Resource, fields
from flask_jwt_extended import jwt_required
from src.extensions import mongo
from src.logger import logger
from bson import ObjectId

# Namespace
feed_ns = Namespace("feed", description="Posts feed operations")

# Swagger models
post_response_model = feed_ns.model("PostResponse", {
    "id": fields.String(description="Post ID"),
    "title": fields.String(description="Project title"),
    "description": fields.String(description="Project description"),
    "tech_stack": fields.List(fields.String),
    "github_link": fields.String,
    "files": fields.List(fields.Nested(feed_ns.model("FileInfo", {
        "file_id": fields.String(description="File ID in GridFS"),
        "filename": fields.String(description="Original filename"),
        "content_type": fields.String(description="File MIME type"),
        "size": fields.Integer(description="File size in bytes")
    }))),
    "user_id": fields.String(description="User who created the post"),
    "likes_count": fields.Integer(description="Number of likes"),
    "comments_count": fields.Integer(description="Number of comments"),
    "created_at": fields.String(description="Post creation time")
})

# ---------- Routes ----------
@feed_ns.route("")
class FeedList(Resource):
    @jwt_required()
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
            page = int(request.args.get('page', 1))
            limit = min(int(request.args.get('limit', 10)), 50)
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
            
            # Sort options
            sort_options = {
                'created_at_desc': [("created_at", -1)],
                'created_at_asc': [("created_at", 1)],
                'title_asc': [("title", 1)],
                'title_desc': [("title", -1)]
            }
            
            sort_criteria = sort_options.get(sort, [("created_at", -1)])
            
            posts = []
            total_posts = mongo.db.posts.count_documents(query)
            
            for post in mongo.db.posts.find(query).sort(sort_criteria).skip(skip).limit(limit):
                # Convert ObjectId and datetime to strings
                post["id"] = str(post["_id"])
                post["user_id"] = str(post["user_id"])
                post["created_at"] = post["created_at"].isoformat()
                
                # Convert updated_at if exists
                if "updated_at" in post and post["updated_at"]:
                    post["updated_at"] = post["updated_at"].isoformat()
                
                # Remove internal fields
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
            
            # Convert updated_at if exists
            if "updated_at" in post and post["updated_at"]:
                post["updated_at"] = post["updated_at"].isoformat()
            
            # Get all likes for this post with user information
            likes = []
            for like in mongo.db.likes.find({"post_id": ObjectId(post_id)}).sort("created_at", -1):
                user = mongo.db.users.find_one({"_id": like["user_id"]})
                likes.append({
                    "id": str(like["_id"]),
                    "user": {
                        "id": str(user["_id"]),
                        "username": user["username"],
                        "email": user["email"]
                    },
                    "created_at": like["created_at"].isoformat()
                })
            
            # Get all comments for this post with user information and replies
            comments = []
            for comment in mongo.db.comments.find({"post_id": ObjectId(post_id)}).sort("created_at", -1):
                user = mongo.db.users.find_one({"_id": comment["user_id"]})
                
                # Get replies for this comment
                replies = []
                for reply in mongo.db.replies.find({"comment_id": comment["_id"]}).sort("created_at", -1):
                    reply_user = mongo.db.users.find_one({"_id": reply["user_id"]})
                    replies.append({
                        "id": str(reply["_id"]),
                        "content": reply["content"],
                        "user": {
                            "id": str(reply_user["_id"]),
                            "username": reply_user["username"],
                            "email": reply_user["email"]
                        },
                        "comment_id": str(reply["comment_id"]),
                        "post_id": str(reply["post_id"]),
                        "created_at": reply["created_at"].isoformat(),
                        "updated_at": reply["updated_at"].isoformat()
                    })
                
                comments.append({
                    "id": str(comment["_id"]),
                    "content": comment["content"],
                    "user": {
                        "id": str(user["_id"]),
                        "username": user["username"],
                        "email": user["email"]
                    },
                    "post_id": str(comment["post_id"]),
                    "replies": replies,
                    "replies_count": len(replies),
                    "created_at": comment["created_at"].isoformat(),
                    "updated_at": comment["updated_at"].isoformat()
                })
            
            # Add social data to post
            post["likes"] = likes
            post["comments"] = comments
            
            # Remove internal fields
            del post["_id"]
            
            return post, 200
            
        except Exception as e:
            logger.error(f"Error fetching post {post_id}: {str(e)}")
            return {"message": "Internal server error"}, 500
