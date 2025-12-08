"""
Post Likes Management Module

This module provides comprehensive like management functionality for posts.
It handles the core social interaction of users liking and unliking posts.

Features:
- Toggle like/unlike functionality (users can only like once)
- Retrieve all likes for a specific post
- User information display for each like
"""

from flask_restx import Resource, fields
from flask_jwt_extended import jwt_required, get_jwt_identity
from src.extensions import mongo, limiter
from src.logger import logger
from src.utils import get_user_info, check_post_exists, create_notification, get_actor_username
from bson import ObjectId
import datetime
from . import social_ns

# Swagger Models
from src.models import create_social_models
social_models = create_social_models(social_ns)
like_model = social_models["like_model"]
like_response_model = social_models["like_response_model"]


# Routes
@social_ns.route("/posts/<string:post_id>/like")
class PostLike(Resource):
    @jwt_required()
    @limiter.limit("100 per minute")  # Allow rapid like/unlike
    @social_ns.doc(description="Toggle like/unlike for a post.")
    @social_ns.response(200, "Success")
    @social_ns.response(400, "Bad Request")
    @social_ns.response(404, "Post Not Found")
    def post(self, post_id):
        """Toggle like/unlike for a post"""
        try:
            user_id = get_jwt_identity()
            
            # Check if post exists
            error, status_code = check_post_exists(post_id)
            if error:
                return {"message": error}, status_code
            
            # Check if user already liked the post
            existing_like = mongo.db.likes.find_one({
                "user_id": ObjectId(user_id),
                "post_id": ObjectId(post_id)
            })
            
            if existing_like:
                # Unlike the post
                mongo.db.likes.delete_one({
                    "user_id": ObjectId(user_id),
                    "post_id": ObjectId(post_id)
                })
                
                # Decrement likes count
                mongo.db.posts.update_one(
                    {"_id": ObjectId(post_id)},
                    {"$inc": {"likes_count": -1}}
                )
                
                # Get updated likes count
                updated_post = mongo.db.posts.find_one({"_id": ObjectId(post_id)})
                likes_count = updated_post.get("likes_count", 0)
                
                logger.info(f"User {user_id} unliked post {post_id}")
                return {
                    "message": "Post unliked successfully",
                    "liked": False,
                    "likes_count": likes_count
                }, 200
            else:
                # Like the post
                like_data = {
                    "user_id": ObjectId(user_id),
                    "post_id": ObjectId(post_id),
                    "created_at": datetime.datetime.utcnow()
                }
                
                mongo.db.likes.insert_one(like_data)
                
                # Increment likes count
                mongo.db.posts.update_one(
                    {"_id": ObjectId(post_id)},
                    {"$inc": {"likes_count": 1}}
                )
                
                # Get updated likes count and post owner
                updated_post = mongo.db.posts.find_one({"_id": ObjectId(post_id)})
                likes_count = updated_post.get("likes_count", 0)
                post_owner_id = updated_post.get("user_id")
                
                # Create notification for post owner
                if post_owner_id:
                    actor_username = get_actor_username(ObjectId(user_id))
                    create_notification(
                        recipient_id=post_owner_id,
                        actor_id=ObjectId(user_id),
                        notif_type="like",
                        message=f"{actor_username} liked your post",
                        post_id=ObjectId(post_id)
                    )

                logger.info(f"User {user_id} liked post {post_id}")
                return {
                    "message": "Post liked successfully",
                    "liked": True,
                    "likes_count": likes_count
                }, 200
                
        except Exception as e:
            logger.error(f"Error toggling like on post {post_id}: {str(e)}")
            return {"message": "Internal server error"}, 500

@social_ns.route("/posts/<string:post_id>/likes")
class PostLikes(Resource):
    @jwt_required()
    @limiter.limit("200 per minute")  # Allow more reads than writes
    @social_ns.doc(description="Get all likes for a specific post")
    @social_ns.marshal_with(like_response_model, as_list=True)
    @social_ns.response(400, "Bad Request")
    @social_ns.response(404, "Post Not Found")
    def get(self, post_id):
        """Get all likes for a post"""
        try:
            # Check if post exists
            error, status_code = check_post_exists(post_id)
            if error:
                return {"message": error}, status_code
            
            # Get likes for the post (returns empty list if no likes)
            likes = []
            for like in mongo.db.likes.find({"post_id": ObjectId(post_id)}).sort("created_at", -1):
                # Store original IDs before conversion
                original_id = like["_id"]
                original_user_id = like["user_id"]
                
                # Convert fields for API response
                like["id"] = str(original_id)
                like["user"] = get_user_info(original_user_id)
                like["post_id"] = str(like["post_id"])
                like["created_at"] = like["created_at"].isoformat()
                
                # Remove MongoDB internal fields
                del like["_id"]
                del like["user_id"]
                likes.append(like)
            
            return likes, 200
            
        except Exception as e:
            logger.error(f"Error fetching likes for post {post_id}: {str(e)}")
            return {"message": "Internal server error"}, 500
