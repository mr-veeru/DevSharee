"""
Social Interaction Models

Flask-RESTx models for social interactions (likes, comments, replies).
"""

from flask_restx import fields


def create_social_models(namespace):
    """Create social interaction models for a namespace."""
    # User info model (used in multiple social models)
    user_info_model = namespace.model("UserInfo", {
        "id": fields.String(description="User ID"),
        "username": fields.String(description="Username"),
        "email": fields.String(description="Email")
    })
    
    user_info_like_model = namespace.model("UserInfoLike", {
        "id": fields.String(description="User ID"),
        "username": fields.String(description="Username"),
        "email": fields.String(description="Email")
    })
    
    # Like models
    like_model = namespace.model("Like", {
        "user_id": fields.String(description="ID of the user who liked the post"),
        "created_at": fields.String(description="Timestamp of the like")
    })
    
    like_response_model = namespace.model("LikeResponse", {
        "id": fields.String(description="Like ID"),
        "user": fields.Nested(user_info_model),
        "post_id": fields.String(description="Post ID"),
        "created_at": fields.String(description="Like creation time")
    })
    
    # Comment models
    comment_model = namespace.model("Comment", {
        "content": fields.String(required=True, description="Comment content", min_length=1, max_length=1000)
    })
    
    reply_model = namespace.model("Reply", {
        "id": fields.String(description="Reply ID"),
        "content": fields.String(description="Reply content"),
        "user": fields.Nested(user_info_model),
        "comment_id": fields.String(description="Comment ID"),
        "post_id": fields.String(description="Post ID"),
        "created_at": fields.String(description="Reply creation time"),
        "updated_at": fields.String(description="Reply update time"),
        "likes_count": fields.Integer(description="Number of likes for reply"),
        "liked": fields.Boolean(description="Whether current user liked this reply")
    })
    
    comment_response_model = namespace.model("CommentResponse", {
        "id": fields.String(description="Comment ID"),
        "content": fields.String(description="Comment content"),
        "user": fields.Nested(user_info_model),
        "post_id": fields.String(description="Post ID"),
        "replies": fields.List(fields.Nested(reply_model), description="List of replies"),
        "replies_count": fields.Integer(description="Number of replies"),
        "likes_count": fields.Integer(description="Number of likes for comment"),
        "liked": fields.Boolean(description="Whether current user liked this comment"),
        "created_at": fields.String(description="Comment creation time"),
        "updated_at": fields.String(description="Comment update time")
    })
    
    # Reply input model
    reply_input_model = namespace.model("ReplyInput", {
        "content": fields.String(required=True, description="Reply content", min_length=1, max_length=1000)
    })
    
    # Reply response model
    reply_response_model = namespace.model("ReplyResponse", {
        "id": fields.String(description="Reply ID"),
        "content": fields.String(description="Reply content"),
        "user": fields.Nested(user_info_model),
        "comment_id": fields.String(description="Comment ID"),
        "post_id": fields.String(description="Post ID"),
        "created_at": fields.String(description="Reply creation time"),
        "updated_at": fields.String(description="Reply update time"),
        "likes_count": fields.Integer(description="Number of likes for reply"),
        "liked": fields.Boolean(description="Whether current user liked this reply")
    })
    
    # Like response models
    comment_like_response_model = namespace.model("CommentLikeResponse", {
        "id": fields.String(description="Like ID"),
        "user": fields.Nested(user_info_like_model),
        "comment_id": fields.String(description="Comment ID"),
        "created_at": fields.String(description="Like creation time")
    })
    
    reply_like_response_model = namespace.model("ReplyLikeResponse", {
        "id": fields.String(description="Like ID"),
        "user": fields.Nested(user_info_like_model),
        "reply_id": fields.String(description="Reply ID"),
        "created_at": fields.String(description="Like creation time")
    })
    
    return {
        "like_model": like_model,
        "like_response_model": like_response_model,
        "comment_model": comment_model,
        "comment_response_model": comment_response_model,
        "reply_model": reply_model,
        "reply_input_model": reply_input_model,
        "reply_response_model": reply_response_model,
        "comment_like_response_model": comment_like_response_model,
        "reply_like_response_model": reply_like_response_model
    }

