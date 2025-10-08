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
from flask_restx import Namespace, Resource, fields
from flask_jwt_extended import jwt_required, get_jwt_identity
from src.extensions import mongo
from src.logger import logger
from src.utils import check_post_exists, check_comment_exists, format_comment
from bson import ObjectId
import datetime

# Namespace
comments_ns = Namespace("comments", description="Post comments management")

# Swagger Models
comment_model = comments_ns.model("Comment", {
    "content": fields.String(required=True, description="Comment content", min_length=1, max_length=1000)
})

reply_model = comments_ns.model("Reply", {
    "id": fields.String(description="Reply ID"),
    "content": fields.String(description="Reply content"),
    "user": fields.Nested(comments_ns.model("UserInfo", {
        "id": fields.String(description="User ID"),
        "username": fields.String(description="Username"),
        "email": fields.String(description="Email")
    })),
    "comment_id": fields.String(description="Comment ID"),
    "post_id": fields.String(description="Post ID"),
    "created_at": fields.String(description="Reply creation time"),
    "updated_at": fields.String(description="Reply update time")
})

comment_response_model = comments_ns.model("CommentResponse", {
    "id": fields.String(description="Comment ID"),
    "content": fields.String(description="Comment content"),
    "user": fields.Nested(comments_ns.model("UserInfo", {
        "id": fields.String(description="User ID"),
        "username": fields.String(description="Username"),
        "email": fields.String(description="Email")
    })),
    "post_id": fields.String(description="Post ID"),
    "replies": fields.List(fields.Nested(reply_model), description="List of replies"),
    "replies_count": fields.Integer(description="Number of replies"),
    "created_at": fields.String(description="Comment creation time"),
    "updated_at": fields.String(description="Comment update time")
})


# Routes
@comments_ns.route("/posts/<string:post_id>/comments")
class PostComments(Resource):
    @jwt_required()
    @comments_ns.expect(comment_model)
    @comments_ns.marshal_with(comment_response_model, code=201)
    @comments_ns.doc(description="Add a new comment to a post")
    @comments_ns.response(400, "Bad Request")
    @comments_ns.response(404, "Post Not Found")
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
            
            logger.info(f"User {user_id} commented on post {post_id}")
            return comment_data, 201
            
        except Exception as e:
            logger.error(f"Error adding comment to post {post_id}: {str(e)}")
            return {"message": "Internal server error"}, 500

    @jwt_required()
    @comments_ns.doc(description="Get all comments for a specific post")
    @comments_ns.marshal_with(comment_response_model, as_list=True)
    @comments_ns.response(400, "Bad Request")
    @comments_ns.response(404, "Post Not Found")
    def get(self, post_id):
        """Get all comments for a post"""
        try:
            # Check if post exists
            error, status_code = check_post_exists(post_id)
            if error:
                return {"message": error}, status_code
            
            # Get comments for the post (returns empty list if no comments)
            comments = []
            for comment in mongo.db.comments.find({"post_id": ObjectId(post_id)}).sort("created_at", -1):
                # Format comment with all replies for complete social data
                formatted_comment = format_comment(comment, include_replies=True)
                comments.append(formatted_comment)
            
            return comments, 200
            
        except Exception as e:
            logger.error(f"Error fetching comments for post {post_id}: {str(e)}")
            return {"message": "Internal server error"}, 500

@comments_ns.route("/<string:comment_id>")
class CommentModify(Resource):
    @jwt_required()
    @comments_ns.expect(comment_model)
    @comments_ns.marshal_with(comment_response_model)
    @comments_ns.doc(description="Edit an existing comment. Only the comment owner can edit.")
    @comments_ns.response(200, "Success")
    @comments_ns.response(400, "Bad Request")
    @comments_ns.response(403, "Forbidden")
    @comments_ns.response(404, "Comment Not Found")
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
    @comments_ns.doc(description="Delete an existing comment and its associated replies. Only the comment owner or post owner can delete.")
    @comments_ns.response(204, "No Content")
    @comments_ns.response(400, "Bad Request")
    @comments_ns.response(403, "Forbidden")
    @comments_ns.response(404, "Comment Not Found")
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
            replies_count = mongo.db.replies.count_documents({"comment_id": ObjectId(comment_id)})
            
            # Cascade delete all replies to this comment
            mongo.db.replies.delete_many({"comment_id": ObjectId(comment_id)})
            
            # Delete the comment itself
            mongo.db.comments.delete_one({"_id": ObjectId(comment_id)})
            
            # Update post comments count (comment + all its replies)
            total_deleted = 1 + replies_count  # 1 comment + all replies
            mongo.db.posts.update_one(
                {"_id": comment["post_id"]},
                {"$inc": {"comments_count": -total_deleted}}
            )
            
            logger.info(f"User {user_id} deleted comment {comment_id}")
            return "", 204
            
        except Exception as e:
            logger.error(f"Error deleting comment {comment_id}: {str(e)}")
            return {"message": "Internal server error"}, 500
