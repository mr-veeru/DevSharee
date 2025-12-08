"""
Post Comments Management Module

This module provides comprehensive comment management functionality for posts.
It handles the core social interaction of users commenting on posts.

Features:
- Create, read, update, delete comments
- User information display for each comment
- Reply count tracking and management
- Authorization controls (users can edit/delete their own comments)
"""

from flask import request
from flask_restx import Resource, fields
from flask_jwt_extended import jwt_required, get_jwt_identity
from src.extensions import mongo, limiter
from src.logger import logger
from src.utils import check_post_exists, check_comment_exists, format_comment, get_user_info, create_notification, get_actor_username
from bson import ObjectId
import datetime

# Import the shared social namespace
from . import social_ns

# Swagger Models
from src.models import create_social_models
social_models = create_social_models(social_ns)
comment_model = social_models["comment_model"]
reply_model = social_models["reply_model"]
comment_response_model = social_models["comment_response_model"]
comment_like_response_model = social_models["comment_like_response_model"]


# Routes
@social_ns.route("/posts/<string:post_id>/comments")
class PostComments(Resource):
    @jwt_required()
    @limiter.limit("20 per minute")  # Prevent comment spam
    @social_ns.expect(comment_model)
    @social_ns.marshal_with(comment_response_model, code=201)
    @social_ns.doc(description="Add a new comment to a post")
    @social_ns.response(400, "Bad Request")
    @social_ns.response(404, "Post Not Found")
    def post(self, post_id):
        """Add a comment to a post"""
        try:
            user_id = get_jwt_identity()
            data = request.get_json()
            content = data.get("content", "").strip()
            
            if not content:
                return {"message": "Comment content cannot be empty"}, 400
            
            # Check if post exists
            error, status_code = check_post_exists(post_id)
            if error:
                return {"message": error}, status_code
            
            # Create comment
            comment_data = {
                "user_id": ObjectId(user_id),
                "post_id": ObjectId(post_id),
                "content": content,
                "replies_count": 0,
                "created_at": datetime.datetime.utcnow(),
                "updated_at": datetime.datetime.utcnow()
            }
            
            mongo.db.comments.insert_one(comment_data)
            
            # Update post comments count
            mongo.db.posts.update_one(
                {"_id": ObjectId(post_id)},
                {"$inc": {"comments_count": 1}}
            )
            
            # Format comment for response (new comment has no replies)
            comment_data = format_comment(comment_data, include_replies=False)
            
            # Create notification for post owner
            post = mongo.db.posts.find_one({"_id": ObjectId(post_id)}, {"user_id": 1})
            if post and post.get("user_id"):
                actor_username = get_actor_username(ObjectId(user_id))
                create_notification(
                    recipient_id=post["user_id"],
                    actor_id=ObjectId(user_id),
                    notif_type="comment",
                    message=f"{actor_username} commented on your post",
                    post_id=ObjectId(post_id),
                    comment_id=ObjectId(comment_data["id"])
                )
            
            logger.info(f"User {user_id} commented on post {post_id}")
            return comment_data, 201
            
        except Exception as e:
            logger.error(f"Error adding comment to post {post_id}: {str(e)}")
            return {"message": "Internal server error"}, 500

    @jwt_required()
    @social_ns.doc(description="Get all comments for a specific post")
    @social_ns.marshal_with(comment_response_model, as_list=True)
    @social_ns.response(400, "Bad Request")
    @social_ns.response(404, "Post Not Found")
    def get(self, post_id):
        """Get all comments for a post"""
        try:
            user_id = get_jwt_identity()
            # Check if post exists
            error, status_code = check_post_exists(post_id)
            if error:
                return {"message": error}, status_code
            
            # Get comments for the post (returns empty list if no comments)
            comments = []
            for comment in mongo.db.comments.find({"post_id": ObjectId(post_id)}).sort("created_at", -1):
                # Format comment with all replies for complete social data
                formatted_comment = format_comment(comment, include_replies=True)
                # Add liked flag for current user on comment
                try:
                    liked_doc = mongo.db.comment_likes.find_one({
                        "user_id": ObjectId(user_id),
                        "comment_id": ObjectId(formatted_comment["id"]) 
                    }) if user_id else None
                    formatted_comment["liked"] = bool(liked_doc)
                except Exception:
                    formatted_comment["liked"] = False

                # Add liked flag for each reply
                if "replies" in formatted_comment:
                    for r in formatted_comment["replies"]:
                        try:
                            liked_r = mongo.db.reply_likes.find_one({
                                "user_id": ObjectId(user_id),
                                "reply_id": ObjectId(r["id"]) 
                            }) if user_id else None
                            r["liked"] = bool(liked_r)
                        except Exception:
                            r["liked"] = False
                comments.append(formatted_comment)
            
            return comments, 200
            
        except Exception as e:
            logger.error(f"Error fetching comments for post {post_id}: {str(e)}")
            return {"message": "Internal server error"}, 500

@social_ns.route("/comments/<string:comment_id>")
class CommentModify(Resource):
    @jwt_required()
    @social_ns.expect(comment_model)
    @social_ns.marshal_with(comment_response_model)
    @social_ns.doc(description="Edit an existing comment. Only the comment owner can edit.")
    @social_ns.response(200, "Success")
    @social_ns.response(400, "Bad Request")
    @social_ns.response(403, "Forbidden")
    @social_ns.response(404, "Comment Not Found")
    def put(self, comment_id):
        """Edit a comment. Only the comment owner can edit."""
        try:
            user_id = get_jwt_identity()
            data = request.get_json()
            content = data.get("content", "").strip()
            
            if not content:
                return {"message": "Comment content cannot be empty"}, 400
            
            # Check if comment exists
            comment, error, status_code = check_comment_exists(comment_id)
            if error:
                return {"message": error}, status_code
            
            # Check if user owns the comment
            if str(comment["user_id"]) != user_id:
                return {"message": "You can only edit your own comments"}, 403
            
            # Update the comment
            mongo.db.comments.update_one(
                {"_id": ObjectId(comment_id)},
                {"$set": {
                    "content": content,
                    "updated_at": datetime.datetime.utcnow()
                }}
            )
            
            # Get updated comment and format with replies
            updated_comment = mongo.db.comments.find_one({"_id": ObjectId(comment_id)})
            formatted_comment = format_comment(updated_comment, include_replies=True)
            
            logger.info(f"User {user_id} edited comment {comment_id}")
            return formatted_comment, 200
            
        except Exception as e:
            logger.error(f"Error editing comment {comment_id}: {str(e)}")
            return {"message": "Internal server error"}, 500

    @jwt_required()
    @social_ns.doc(description="Delete an existing comment and its associated replies. Only the comment owner or post owner can delete.")
    @social_ns.response(200, "Success")
    @social_ns.response(400, "Bad Request")
    @social_ns.response(403, "Forbidden")
    @social_ns.response(404, "Comment Not Found")
    def delete(self, comment_id):
        """Delete a comment and its associated replies. Only the comment owner or post owner can delete."""
        try:
            user_id = get_jwt_identity()
            
            # Check if comment exists
            comment, error, status_code = check_comment_exists(comment_id)
            if error:
                return {"message": error}, status_code
            
            # Check if user owns the comment or the post
            post = mongo.db.posts.find_one({"_id": comment["post_id"]})
            if str(comment["user_id"]) != user_id and str(post["user_id"]) != user_id:
                return {"message": "You can only delete your own comments or comments on your posts"}, 403
            
            # Count replies before deletion for proper post count update
            replies = list(mongo.db.replies.find({"comment_id": ObjectId(comment_id)}))
            replies_count = len(replies)
            reply_ids = [reply["_id"] for reply in replies]
            
            # Cascade delete all related data:
            # 1. Delete all reply likes (likes on replies to this comment)
            if reply_ids:
                mongo.db.reply_likes.delete_many({"reply_id": {"$in": reply_ids}})
            
            # 2. Delete all comment likes (likes on this comment)
            mongo.db.comment_likes.delete_many({"comment_id": ObjectId(comment_id)})
            
            # 3. Delete all notifications related to this comment
            mongo.db.notifications.delete_many({"comment_id": ObjectId(comment_id)})
            
            # 4. Delete all replies to this comment (and their notifications)
            if reply_ids:
                # Delete notifications for all replies to this comment
                mongo.db.notifications.delete_many({"reply_id": {"$in": reply_ids}})
            mongo.db.replies.delete_many({"comment_id": ObjectId(comment_id)})
            
            # 5. Delete the comment itself
            mongo.db.comments.delete_one({"_id": ObjectId(comment_id)})
            
            # Update post comments count (comment + all its replies)
            total_deleted = 1 + replies_count  # 1 comment + all replies
            mongo.db.posts.update_one(
                {"_id": comment["post_id"]},
                {"$inc": {"comments_count": -total_deleted}}
            )
            
            logger.info(f"User {user_id} deleted comment {comment_id}")
            return {"message": "Comment deleted successfully"}, 200
            
        except Exception as e:
            logger.error(f"Error deleting comment {comment_id}: {str(e)}")
            return {"message": "Internal server error"}, 500

@social_ns.route("/comments/<string:comment_id>/likes")
class CommentLikes(Resource):
    @jwt_required()
    @limiter.limit("200 per minute")
    @social_ns.marshal_with(comment_like_response_model, as_list=True)
    def get(self, comment_id):
        try:
            comment, error, status = check_comment_exists(comment_id)
            if error:
                return {"message": error}, status

            likes = []
            for like in mongo.db.comment_likes.find({"comment_id": ObjectId(comment_id)}).sort("created_at", -1):
                original_id = like["_id"]
                original_user_id = like["user_id"]
                like["id"] = str(original_id)
                like["user"] = get_user_info(original_user_id)
                like["comment_id"] = str(like["comment_id"])
                like["created_at"] = like["created_at"].isoformat()
                del like["_id"]
                del like["user_id"]
                likes.append(like)
            return likes, 200
        except Exception as e:
            logger.error(f"Error fetching likes for comment {comment_id}: {str(e)}")
            return {"message": "Internal server error"}, 500

    @jwt_required()
    @limiter.limit("100 per minute")
    @social_ns.doc(description="Toggle like/unlike for a comment")
    def post(self, comment_id):
        try:
            user_id = get_jwt_identity()
            comment, error, status = check_comment_exists(comment_id)
            if error:
                return {"message": error}, status

            existing = mongo.db.comment_likes.find_one({
                "user_id": ObjectId(user_id),
                "comment_id": ObjectId(comment_id)
            })

            if existing:
                mongo.db.comment_likes.delete_one({
                    "user_id": ObjectId(user_id),
                    "comment_id": ObjectId(comment_id)
                })
                mongo.db.comments.update_one({"_id": ObjectId(comment_id)}, {"$inc": {"likes_count": -1}})
                updated = mongo.db.comments.find_one({"_id": ObjectId(comment_id)})
                
                return {"liked": False, "likes_count": updated.get("likes_count", 0)}, 200
            else:
                mongo.db.comment_likes.insert_one({
                    "user_id": ObjectId(user_id),
                    "comment_id": ObjectId(comment_id),
                    "post_id": comment["post_id"],
                    "created_at": datetime.datetime.utcnow()
                })
                mongo.db.comments.update_one({"_id": ObjectId(comment_id)}, {"$inc": {"likes_count": 1}})
                updated = mongo.db.comments.find_one({"_id": ObjectId(comment_id)})
                
                # Create notifications for comment owner and post owner
                actor_username = get_actor_username(ObjectId(user_id))
                comment_owner_id = comment.get("user_id")
                post_id_obj = comment.get("post_id")
                
                # Notify comment owner
                if comment_owner_id:
                    create_notification(
                        recipient_id=comment_owner_id,
                        actor_id=ObjectId(user_id),
                        notif_type="like",
                        message=f"{actor_username} liked your comment",
                        post_id=post_id_obj,
                        comment_id=ObjectId(comment_id)
                    )
                
                # Notify post owner (if different from comment owner)
                post = mongo.db.posts.find_one({"_id": post_id_obj}, {"user_id": 1})
                post_owner_id = post.get("user_id") if post else None
                if post_owner_id and post_owner_id != comment_owner_id:
                    create_notification(
                        recipient_id=post_owner_id,
                        actor_id=ObjectId(user_id),
                        notif_type="like",
                        message=f"{actor_username} liked a comment on your post",
                        post_id=post_id_obj,
                        comment_id=ObjectId(comment_id)
                    )
                
                return {"liked": True, "likes_count": updated.get("likes_count", 0)}, 200
        except Exception as e:
            logger.error(f"Error toggling like on comment {comment_id}: {str(e)}")
            return {"message": "Internal server error"}, 500
