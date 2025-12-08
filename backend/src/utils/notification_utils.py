"""
Notification Utilities

Helper functions for creating and managing notifications.
"""

from src.extensions import mongo
from src.logger import logger
from bson import ObjectId
import datetime


def get_actor_username(actor_id):
    """
    Get username for an actor ID.
    
    Args:
        actor_id: ObjectId of the user
    
    Returns:
        Username string or "Someone" if not found
    """
    try:
        actor_user = mongo.db.users.find_one({"_id": ObjectId(actor_id)}, {"username": 1})
        return actor_user.get("username", "Someone") if actor_user else "Someone"
    except Exception as e:
        logger.error(f"Error getting actor username: {str(e)}")
        return "Someone"


def create_notification(recipient_id, actor_id, notif_type, message, post_id=None, comment_id=None, reply_id=None):
    """
    Create a notification for a user. Prevents duplicates by checking for existing
    unread notification with same actor, type, and target within the last hour.
    
    Args:
        recipient_id: ObjectId of the user receiving the notification
        actor_id: ObjectId of the user who triggered the notification
        notif_type: Type of notification (e.g., "like", "comment", "reply")
        message: Human-readable notification message
        post_id: Optional ObjectId of related post
        comment_id: Optional ObjectId of related comment
        reply_id: Optional ObjectId of related reply
    
    Returns:
        ObjectId of created notification or None if creation failed or duplicate exists
    """
    try:
        # Don't create notification if user is notifying themselves
        if recipient_id == actor_id:
            return None
        
        # Check for duplicate notification (same actor, type, and target within last hour)
        one_hour_ago = datetime.datetime.utcnow() - datetime.timedelta(hours=1)
        duplicate_query = {
            "recipient_id": recipient_id,
            "actor_id": actor_id,
            "type": notif_type,
            "read": False,
            "created_at": {"$gte": one_hour_ago}
        }
        
        if post_id:
            duplicate_query["post_id"] = post_id
        if comment_id:
            duplicate_query["comment_id"] = comment_id
        if reply_id:
            duplicate_query["reply_id"] = reply_id
        
        # Check if duplicate exists
        existing = mongo.db.notifications.find_one(duplicate_query)
        if existing:
            logger.debug(f"Duplicate notification prevented for user {recipient_id} from actor {actor_id}")
            return None
        
        notification_data = {
            "recipient_id": recipient_id,
            "actor_id": actor_id,
            "type": notif_type,
            "message": message,
            "read": False,
            "created_at": datetime.datetime.utcnow()
        }
        
        if post_id:
            notification_data["post_id"] = post_id
        if comment_id:
            notification_data["comment_id"] = comment_id
        if reply_id:
            notification_data["reply_id"] = reply_id
        
        result = mongo.db.notifications.insert_one(notification_data)
        logger.info(f"Created notification {result.inserted_id} for user {recipient_id}")
        return result.inserted_id
    except Exception as e:
        logger.error(f"Error creating notification: {str(e)}")
        return None

