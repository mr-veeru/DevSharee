"""
Profile Post Management Routes

Handles user post operations including viewing, editing, deleting own posts, and viewing public profiles.

Endpoints:
- GET /profile/posts - Get user's own posts (with pagination)
- GET /profile/posts/<post_id> - Get specific post details
- PUT /profile/posts/<post_id> - Edit user's own post
- DELETE /profile/posts/<post_id> - Delete user's own post
- GET /profile/posts/<post_id>/files/<file_id> - Download files from posts
- GET /profile/users/<user_id> - Get any user's profile information
- GET /profile/users/<user_id>/posts - Get any user's posts (with pagination)
"""

from flask import request, Response
from flask_restx import Resource
from flask_jwt_extended import jwt_required, get_jwt_identity
from src.extensions import mongo
from src.logger import logger
from src.utils import upload_files_to_gridfs, get_file_from_gridfs
import datetime
from bson import ObjectId
from gridfs import GridFS
from src.utils import validate_pagination, get_sort_criteria, batch_fetch_users
from .profile import profile_ns, post_edit_model, post_response_model


# ---------- Routes ----------
@profile_ns.route("/posts")
class UserPosts(Resource):
    @jwt_required()
    def get(self):
        """
        Get current user's own posts with pagination.
        
        Query parameters:
        - page: Page number (default: 1)
        - limit: Posts per page (default: 10, max: 50)
        - sort: Sort order (default: created_at_desc)
        """
        try:
            user_id = get_jwt_identity()
            page, limit = validate_pagination(request.args.get('page', 1), request.args.get('limit', 10))
            sort = request.args.get('sort', 'created_at_desc')
            
            skip = (page - 1) * limit
            sort_criteria = get_sort_criteria(sort)
            
            posts = []
            total_posts = mongo.db.posts.count_documents({"user_id": ObjectId(user_id)})
            
            # Fetch posts first
            raw_posts = list(mongo.db.posts.find({"user_id": ObjectId(user_id)}).sort(sort_criteria).skip(skip).limit(limit))
            
            # Batch user lookup (single query instead of N+1)
            user = mongo.db.users.find_one({"_id": ObjectId(user_id)})
            user_id_str = str(user_id)
            
            # Process posts and attach user info
            posts = []
            for post in raw_posts:
                # Convert ObjectId to string
                post["id"] = str(post["_id"])
                post["user_id"] = user_id_str
                
                post["created_at"] = post["created_at"].isoformat()
                if "updated_at" in post:
                    post["updated_at"] = post["updated_at"].isoformat()
                
                # Use pre-fetched user information
                if user:
                    post["author"] = {
                        "username": user.get("username", f"User{user_id_str[-4:]}"),
                        "id": user_id_str
                    }
                else:
                    post["author"] = {
                        "username": f"User{user_id_str[-4:]}",
                        "id": user_id_str
                    }
                
                # Remove the _id field to avoid confusion
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
                "sort": sort
            }, 200
            
        except Exception as e:
            logger.error(f"Error fetching user posts: {str(e)}")
            return {"message": "Internal server error"}, 500


@profile_ns.route("/posts/<string:post_id>")
class UserPostDetail(Resource):
    @jwt_required()
    def get(self, post_id):
        """
        Get specific post details by ID.
        
        Only returns posts that belong to the current user.
        """
        try:
            if not ObjectId.is_valid(post_id):
                return {"message": "Invalid post ID format"}, 400
                
            user_id = get_jwt_identity()
            
            # Find post that belongs to user
            post = mongo.db.posts.find_one({
                "_id": ObjectId(post_id),
                "user_id": ObjectId(user_id)
            })
            
            if not post:
                return {"message": "Post not found or you don't have permission to view it"}, 404
            
            # Prepare response
            post["id"] = str(post["_id"])
            post["user_id"] = str(post["user_id"])
            post["created_at"] = post["created_at"].isoformat()
            
            if "updated_at" in post:
                post["updated_at"] = post["updated_at"].isoformat()
            
            # Batch fetch likes with user information
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
            
            # Batch fetch comments with user information
            comment_docs = list(mongo.db.comments.find({"post_id": ObjectId(post_id)}).sort("created_at", -1))
            comment_user_ids = [c["user_id"] for c in comment_docs]
            comment_users_dict = batch_fetch_users(comment_user_ids)
            
            # Batch fetch replies with user information
            comment_ids = [c["_id"] for c in comment_docs]
            all_replies = list(mongo.db.replies.find({"comment_id": {"$in": comment_ids}}).sort("created_at", -1)) if comment_ids else []
            reply_user_ids = [r["user_id"] for r in all_replies]
            reply_users_dict = batch_fetch_users(reply_user_ids)
            
            # Group replies by comment
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
            
            # Remove _id field
            if "_id" in post:
                del post["_id"]
            
            return post, 200
            
        except Exception as e:
            logger.error(f"Error fetching post {post_id}: {str(e)}")
            return {"message": "Internal server error"}, 500

    @jwt_required()
    @profile_ns.expect(post_edit_model)
    @profile_ns.marshal_with(post_response_model, code=200)
    def put(self, post_id):
        """
        Edit user's own post.
        
        This endpoint allows users to update their own posts:
        - Update title, description, tech_stack, github_link
        - Add new files (existing files are preserved)
        - Remove files (by not including them in the request)
        - All validations from post creation apply
        """
        try:
            if not ObjectId.is_valid(post_id):
                return {"message": "Invalid post ID format"}, 400
                
            user_id = get_jwt_identity()
            
            # Check if post exists and belongs to user
            post = mongo.db.posts.find_one({
                "_id": ObjectId(post_id),
                "user_id": ObjectId(user_id)
            })
            
            if not post:
                return {"message": "Post not found or you don't have permission to edit it"}, 404
            
            # Get form data
            title = request.form.get("title", "").strip()
            description = request.form.get("description", "").strip()
            tech_stack = request.form.getlist("tech_stack")  # Get as list of strings
            github_link = request.form.get("github_link", "").strip()
            
            # Handle tech_stack if sent as comma-separated string
            if tech_stack and len(tech_stack) == 1 and ',' in tech_stack[0]:
                tech_stack = [tech.strip() for tech in tech_stack[0].split(',') if tech.strip()]
            
            # Prepare update data
            update_data = {}
            
            # Update title if provided
            if title:
                if len(title) > 200:
                    return {"message": "Title must be 200 characters or less"}, 400
                update_data["title"] = title
            
            # Update description if provided
            if description:
                if len(description) > 2000:
                    return {"message": "Description must be 2000 characters or less"}, 400
                update_data["description"] = description
            
            # Update tech_stack if provided
            if tech_stack:
                # Validate each tech stack item
                for i, tech in enumerate(tech_stack):
                    if not tech or not tech.strip():
                        return {"message": f"Tech stack item at index {i} must be a non-empty string"}, 400
                        
                if len(tech_stack) > 20:
                    return {"message": "Tech stack cannot have more than 20 technologies"}, 400
                    
                update_data["tech_stack"] = tech_stack
            
            # Update GitHub link if provided
            if github_link:
                if not github_link.startswith("https://github.com/"):
                    return {"message": "GitHub link must be a valid GitHub repository URL (https://github.com/...)"}, 400
                    
                if len(github_link.split('/')) < 5:
                    return {"message": "GitHub link must include repository path (e.g., https://github.com/username/repo)"}, 400
                update_data["github_link"] = github_link
            # Handle file removal and new file uploads
            current_files = post.get("files", [])
            files_to_keep = current_files
            new_files = []
            
            if 'existing_files' in request.form:
                # Get list of file IDs to keep, filter out empty strings
                existing_files_to_keep = request.form.getlist('existing_files')
                existing_files_to_keep = [fid for fid in existing_files_to_keep if fid and fid.strip()]
                
                # Filter current files to only include those in the keep list
                files_to_keep = [f for f in current_files if f["file_id"] in existing_files_to_keep]
                update_data["files"] = files_to_keep + new_files
            
            # Handle new file uploads
            if 'files' in request.files:
                files = request.files.getlist('files')
                
                # Check if there are actual files with names
                if files and any(f.filename and f.filename.strip() for f in files):
                    success, error_msg, uploaded_files = upload_files_to_gridfs(files, user_id, max_files=10)
                    if not success:
                        return {"message": error_msg}, 400
                    
                    new_files = uploaded_files
                    update_data["files"] = files_to_keep + new_files
            
            # Add updated timestamp
            update_data["updated_at"] = datetime.datetime.utcnow()
            
            # Update the post
            if update_data:
                result = mongo.db.posts.update_one(
                    {"_id": ObjectId(post_id)},
                    {"$set": update_data}
                )
                
                # Check if any data was actually changed (not just timestamp)
                if result.modified_count == 0 and len(update_data) > 1:
                    return {"message": "No changes made to the post"}, 400
                
                logger.info(f"Post {post_id} updated by user {user_id}")
                
                # Return updated post (strip non-serializable fields)
                updated_post = mongo.db.posts.find_one({"_id": ObjectId(post_id)})
                updated_post["id"] = str(updated_post["_id"])
                updated_post["user_id"] = str(updated_post["user_id"])
                
                # Get user information for this post
                user = mongo.db.users.find_one({"_id": ObjectId(user_id)})
                if user:
                    updated_post["author"] = {
                        "username": user.get("username", f"User{str(updated_post['user_id'])[-4:]}"),
                        "id": str(user["_id"])
                    }
                else:
                    updated_post["author"] = {
                        "username": f"User{str(updated_post['user_id'])[-4:]}",
                        "id": str(updated_post["user_id"])
                    }
                
                # Remove internal and social fields
                if "_id" in updated_post:
                    del updated_post["_id"]
                updated_post.pop("likes", None)
                updated_post.pop("comments", None)
                
                # Timestamps
                if "created_at" in updated_post and isinstance(updated_post["created_at"], datetime.datetime):
                    updated_post["created_at"] = updated_post["created_at"].isoformat()
                if "updated_at" in updated_post and isinstance(updated_post["updated_at"], datetime.datetime):
                    updated_post["updated_at"] = updated_post["updated_at"].isoformat()
                
                return updated_post, 200
            else:
                return {"message": "No valid fields provided for update"}, 400
            
        except Exception as e:
            logger.error(f"Error updating post {post_id}: {str(e)}")
            return {"message": "Internal server error"}, 500

    @jwt_required()
    def delete(self, post_id):
        """
        Delete user's own post.
        
        This will permanently delete the post and all associated data:
        - All uploaded files (GridFS)
        - All likes on the post
        - All comments and their replies
        - All likes on comments and replies
        """
        try:
            if not ObjectId.is_valid(post_id):
                return {"message": "Invalid post ID format"}, 400
                
            user_id = get_jwt_identity()
            
            # Check if post exists and belongs to user
            post = mongo.db.posts.find_one({
                "_id": ObjectId(post_id),
                "user_id": ObjectId(user_id)
            })
            
            if not post:
                return {"message": "Post not found or you don't have permission to delete it"}, 404
            
            # ===== CASCADE DELETE ALL RELATED DATA =====
            
            # 0. Collect all file IDs from post for GridFS deletion
            fs = GridFS(mongo.db)
            file_ids_to_delete = []
            for file_info in post.get("files", []):
                file_id = file_info.get("file_id")
                if file_id and ObjectId.is_valid(file_id):
                    file_ids_to_delete.append(ObjectId(file_id))
            
            # Delete all files from GridFS
            files_deleted_count = 0
            for file_id in file_ids_to_delete:
                try:
                    fs.delete(file_id)
                    files_deleted_count += 1
                except Exception as e:
                    logger.warning(f"Failed to delete GridFS file {file_id} for post {post_id}: {str(e)}")
            
            # 1. Delete all likes for this post
            likes_deleted = mongo.db.likes.delete_many({"post_id": ObjectId(post_id)})
            
            # 2. Get all comments for this post to delete their replies and likes
            comments = list(mongo.db.comments.find({"post_id": ObjectId(post_id)}))
            comment_ids = [comment["_id"] for comment in comments]
            
            # 3. Delete all comment likes
            comment_likes_deleted = 0
            if comment_ids:
                comment_likes_result = mongo.db.comment_likes.delete_many({"comment_id": {"$in": comment_ids}})
                comment_likes_deleted = comment_likes_result.deleted_count
            
            # 4. Get all replies to comments on this post
            replies = list(mongo.db.replies.find({"comment_id": {"$in": comment_ids}})) if comment_ids else []
            reply_ids = [reply["_id"] for reply in replies]
            
            # 5. Delete all reply likes
            reply_likes_deleted = 0
            if reply_ids:
                reply_likes_result = mongo.db.reply_likes.delete_many({"reply_id": {"$in": reply_ids}})
                reply_likes_deleted = reply_likes_result.deleted_count
            
            # 6. Delete all replies to comments on this post
            if comment_ids:
                replies_deleted = mongo.db.replies.delete_many({"comment_id": {"$in": comment_ids}})
            else:
                class EmptyResult:
                    deleted_count = 0
                replies_deleted = EmptyResult()
            
            # 7. Delete all comments for this post
            comments_deleted = mongo.db.comments.delete_many({"post_id": ObjectId(post_id)})
            
            # 8. Delete all notifications related to this post
            notifications_deleted = mongo.db.notifications.delete_many({"post_id": ObjectId(post_id)})
            
            # 9. Finally, delete the post itself
            result = mongo.db.posts.delete_one({"_id": ObjectId(post_id)})
            
            if result.deleted_count == 0:
                return {"message": "Post not found"}, 404
            
            logger.info(f"Post {post_id} deleted by user {user_id} - removed {files_deleted_count} files, {likes_deleted.deleted_count} post likes, {comments_deleted.deleted_count} comments ({comment_likes_deleted} comment likes), {replies_deleted.deleted_count} replies ({reply_likes_deleted} reply likes), {notifications_deleted.deleted_count} notifications")
            return {"message": "Post deleted successfully"}, 200
            
        except Exception as e:
            logger.error(f"Error deleting post {post_id}: {str(e)}")
            return {"message": "Internal server error"}, 500


@profile_ns.route("/posts/<string:post_id>/files/<string:file_id>")
class PostFileDownload(Resource):
    @jwt_required()
    def get(self, post_id, file_id):
        """
        Download a file from a user's own post.
        
        Args:
            post_id: The post ID (must belong to current user)
            file_id: The GridFS file ID
        """
        try:
            if not ObjectId.is_valid(post_id) or not ObjectId.is_valid(file_id):
                return {"message": "Invalid post ID or file ID format"}, 400
                
            user_id = get_jwt_identity()
            
            # Verify the post belongs to the user
            post = mongo.db.posts.find_one({
                "_id": ObjectId(post_id),
                "user_id": ObjectId(user_id)
            })
            
            if not post:
                return {"message": "Post not found or you don't have permission to access it"}, 404
            
            # Check if the file belongs to this post
            files = post.get("files", [])
            file_found = False
            for file_info in files:
                if file_info.get("file_id") == file_id:
                    file_found = True
                    break
            
            if not file_found:
                return {"message": "File not found in this post"}, 404
            
            # Get file from GridFS
            success, error_msg, file_obj = get_file_from_gridfs(file_id)
            if not success:
                return {"message": error_msg}, 404
            
            # Return file as response
            return Response(
                file_obj.read(),
                mimetype=file_obj.content_type,
                headers={
                    'Content-Disposition': f'attachment; filename="{file_obj.filename}"',
                    'Content-Length': str(file_obj.length)
                }
            )
            
        except Exception as e:
            logger.error(f"Error downloading file {file_id} from post {post_id}: {str(e)}")
            return {"message": "Internal server error"}, 500


@profile_ns.route("/users/<string:user_id>")
class PublicUserProfile(Resource):
    @jwt_required()
    def get(self, user_id):
        """
        Get any user's profile information including post count.
        
        Args:
            user_id: The user ID of the profile to view
        """
        try:
            if not ObjectId.is_valid(user_id):
                return {"message": "Invalid user ID format"}, 400
            
            # Get user information
            user = mongo.db.users.find_one({"_id": ObjectId(user_id)})
            if not user:
                return {"message": "User not found"}, 404
            
            # Count user's posts
            posts_count = mongo.db.posts.count_documents({"user_id": ObjectId(user_id)})
            
            # Calculate total likes received across all user posts
            user_posts = mongo.db.posts.find({"user_id": ObjectId(user_id)}, {"_id": 1})
            post_ids = [post["_id"] for post in user_posts]
            likes_received = mongo.db.likes.count_documents({"post_id": {"$in": post_ids}})
            
            # Prepare response (exclude email for privacy)
            profile = {
                "id": str(user["_id"]),
                "username": user["username"],
                "fullname": user.get("fullname", ""),
                "bio": user.get("bio", ""),
                "posts_count": posts_count,
                "likes_received": likes_received,
                "created_at": user["created_at"].isoformat() + "Z"
            }
            
            return profile, 200
            
        except Exception as e:
            logger.error(f"Error fetching user profile {user_id}: {str(e)}")
            return {"message": "Internal server error"}, 500


@profile_ns.route("/users/<string:user_id>/posts")
class PublicUserPosts(Resource):
    @jwt_required()
    def get(self, user_id):
        """
        Get any user's posts with pagination.
        
        Args:
            user_id: The user ID whose posts to retrieve
        
        Query parameters:
        - page: Page number (default: 1)
        - limit: Posts per page (default: 10, max: 50)
        - sort: Sort order (default: created_at_desc)
        """
        try:
            if not ObjectId.is_valid(user_id):
                return {"message": "Invalid user ID format"}, 400
            
            # Verify user exists
            user = mongo.db.users.find_one({"_id": ObjectId(user_id)})
            if not user:
                return {"message": "User not found"}, 404
            
            page, limit = validate_pagination(request.args.get('page', 1), request.args.get('limit', 10))
            sort = request.args.get('sort', 'created_at_desc')
            
            skip = (page - 1) * limit
            sort_criteria = get_sort_criteria(sort)
            
            posts = []
            total_posts = mongo.db.posts.count_documents({"user_id": ObjectId(user_id)})
            
            for post in mongo.db.posts.find({"user_id": ObjectId(user_id)}).sort(sort_criteria).skip(skip).limit(limit):
                # Convert ObjectId to string
                post["id"] = str(post["_id"])
                post["user_id"] = str(post["user_id"])
                
                post["created_at"] = post["created_at"].isoformat()
                if "updated_at" in post:
                    post["updated_at"] = post["updated_at"].isoformat()
                
                # Get user information for this post
                if user:
                    post["author"] = {
                        "username": user.get("username", f"User{str(post['user_id'])[-4:]}"),
                        "id": str(user["_id"])
                    }
                else:
                    post["author"] = {
                        "username": f"User{str(post['user_id'])[-4:]}",
                        "id": str(post["user_id"])
                    }
                
                # Remove the _id field to avoid confusion
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
                "sort": sort
            }, 200
            
        except Exception as e:
            logger.error(f"Error fetching user posts for {user_id}: {str(e)}")
            return {"message": "Internal server error"}, 500

