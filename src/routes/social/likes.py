"""
Post Likes Management Module

This module provides comprehensive like management functionality for posts.
It handles the core social interaction of users liking and unliking posts.

Features:
- Toggle like/unlike functionality (users can only like once)
- Retrieve all likes for a specific post
- User information display for each like
"""

from flask_restx import Namespace, Resource, fields
from flask_jwt_extended import jwt_required, get_jwt_identity
from src.extensions import mongo
from src.logger import logger
from src.utils import get_user_info, check_post_exists
from bson import ObjectId
import datetime

# Namespace
likes_ns = Namespace("likes", description="Post likes management")

# Swagger Models
like_model = likes_ns.model("Like", {
    "user_id": fields.String(description="ID of the user who liked the post"),
    "created_at": fields.String(description="Timestamp of the like")
})

like_response_model = likes_ns.model("LikeResponse", {
    "id": fields.String(description="Like ID"),
    "user": fields.Nested(likes_ns.model("UserInfo", {
        "id": fields.String(description="User ID"),
        "username": fields.String(description="Username"),
        "email": fields.String(description="Email")
    })),
    "post_id": fields.String(description="Post ID"),
    "created_at": fields.String(description="Like creation time")
})


# Routes
@likes_ns.route("/posts/<string:post_id>/like")
class PostLike(Resource):
    @jwt_required()
    @likes_ns.doc(description="Toggle like/unlike for a post.")
    @likes_ns.response(200, "Success")
    @likes_ns.response(400, "Bad Request")
    @likes_ns.response(404, "Post Not Found")
    def post(self, post_id):
        """Toggle like/unlike for a post"""
        try:
            user_id = get_jwt_identity()
            
            # Check if post exists
            error, status_code = check_post_exists(post_id)
            if error:
                return {"message": error}, status_code
            
            # Check if user already liked the post
            existing_like = mongo.cx.devshare.likes.find_one({
                "user_id": ObjectId(user_id),
                "post_id": ObjectId(post_id)
            })
            
            if existing_like:
                # Unlike the post
                mongo.cx.devshare.likes.delete_one({
                    "user_id": ObjectId(user_id),
                    "post_id": ObjectId(post_id)
                })
                
                # Decrement likes count
                mongo.cx.devshare.posts.update_one(
                    {"_id": ObjectId(post_id)},
                    {"$inc": {"likes_count": -1}}
                )
                
                # Get updated likes count
                updated_post = mongo.cx.devshare.posts.find_one({"_id": ObjectId(post_id)})
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
                
                mongo.cx.devshare.likes.insert_one(like_data)
                
                # Increment likes count
                mongo.cx.devshare.posts.update_one(
                    {"_id": ObjectId(post_id)},
                    {"$inc": {"likes_count": 1}}
                )
                
                # Get updated likes count
                updated_post = mongo.cx.devshare.posts.find_one({"_id": ObjectId(post_id)})
                likes_count = updated_post.get("likes_count", 0)
                
                logger.info(f"User {user_id} liked post {post_id}")
                return {
                    "message": "Post liked successfully",
                    "liked": True,
                    "likes_count": likes_count
                }, 200
                
        except Exception as e:
            logger.error(f"Error toggling like on post {post_id}: {str(e)}")
            raise

@likes_ns.route("/posts/<string:post_id>/likes")
class PostLikes(Resource):
    @jwt_required()
    @likes_ns.doc(description="Get all likes for a specific post")
    @likes_ns.marshal_with(like_response_model, as_list=True)
    @likes_ns.response(400, "Bad Request")
    @likes_ns.response(404, "Post Not Found")
    def get(self, post_id):
        """Get all likes for a post"""
        try:
            # Check if post exists
            error, status_code = check_post_exists(post_id)
            if error:
                return {"message": error}, status_code
            
            # Get likes for the post (returns empty list if no likes)
            likes = []
            for like in mongo.cx.devshare.likes.find({"post_id": ObjectId(post_id)}).sort("created_at", -1):
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
            raise
