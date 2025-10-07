"""
Social Utilities

Common helper functions for social interactions including likes, comments, and replies.
This module provides shared utilities across social modules.
"""

from src.extensions import mongo
from bson import ObjectId


def get_user_info(user_id):
    """Get user information by user ID"""
    user = mongo.cx.devshare.users.find_one({"_id": ObjectId(user_id)})
    if user:
        return {
            "id": str(user["_id"]),
            "username": user["username"],
            "email": user["email"]
        }
    return None


def check_post_exists(post_id):
    """Check if post exists and return error message with status code"""
    if not ObjectId.is_valid(post_id):
        return "Invalid post ID format", 400
    
    # Use count_documents for better performance - only checks existence
    count = mongo.cx.devshare.posts.count_documents({"_id": ObjectId(post_id)})
    if count == 0:
        return "Post not found", 404
    
    return None, None  # No error means post exists


def check_comment_exists(comment_id):
    """Check if comment exists and return it with status code"""
    if not ObjectId.is_valid(comment_id):
        return None, "Invalid comment ID format", 400
    
    comment = mongo.cx.devshare.comments.find_one({"_id": ObjectId(comment_id)})
    if not comment:
        return None, "Comment not found", 404
    
    return comment, None, None


def check_reply_exists(reply_id):
    """Check if reply exists and return it with status code"""
    if not ObjectId.is_valid(reply_id):
        return None, "Invalid reply ID format", 400
    
    reply = mongo.cx.devshare.replies.find_one({"_id": ObjectId(reply_id)})
    if not reply:
        return None, "Reply not found", 404
    
    return reply, None, None


def format_reply(reply):
    """Format a reply document for API response"""
    # Store original IDs before conversion
    original_id = reply["_id"]
    original_user_id = reply["user_id"]
    
    # Convert fields for API response
    reply["id"] = str(original_id)
    reply["user"] = get_user_info(original_user_id)
    reply["comment_id"] = str(reply["comment_id"])
    reply["post_id"] = str(reply["post_id"])
    reply["created_at"] = reply["created_at"].isoformat()
    reply["updated_at"] = reply["updated_at"].isoformat()
    
    # Remove MongoDB internal fields
    del reply["_id"]
    del reply["user_id"]
    return reply


def format_comment(comment, include_replies=True):
    """Format a comment document for API response"""
    # Store original IDs before conversion
    original_id = comment["_id"]
    original_user_id = comment["user_id"]
    
    # Convert fields for API response
    comment["id"] = str(original_id)
    comment["user"] = get_user_info(original_user_id)
    comment["post_id"] = str(comment["post_id"])
    comment["created_at"] = comment["created_at"].isoformat()
    comment["updated_at"] = comment["updated_at"].isoformat()
    
    # Remove MongoDB internal fields
    del comment["_id"]
    del comment["user_id"]
    
    if include_replies:
        # Get replies for this comment using original ObjectId
        replies = []
        for reply in mongo.cx.devshare.replies.find({"comment_id": original_id}).sort("created_at", -1):
            replies.append(format_reply(reply))
        
        comment["replies"] = replies
        comment["replies_count"] = len(replies)
    else:
        # New comment has no replies yet
        comment["replies"] = []
        comment["replies_count"] = 0
    
    return comment
