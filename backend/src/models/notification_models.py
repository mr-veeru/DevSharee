"""
Notification Models

Flask-RESTx models for notifications.
"""

from flask_restx import fields


def create_notification_models(namespace):
    """Create notification models for a namespace."""
    actor_model = namespace.model("Actor", {
        "id": fields.String(description="Actor user ID"),
        "username": fields.String(description="Actor username"),
        "email": fields.String(description="Actor email")
    })
    
    notification_model = namespace.model("Notification", {
        "id": fields.String(description="Notification ID"),
        "type": fields.String(description="Notification type"),
        "message": fields.String(description="Human-friendly message"),
        "actor": fields.Nested(actor_model, allow_null=True, description="User who triggered the notification"),
        "post_id": fields.String(allow_null=True, description="Related post ID"),
        "post_title": fields.String(allow_null=True, description="Related post title"),
        "comment_id": fields.String(allow_null=True, description="Related comment ID"),
        "reply_id": fields.String(allow_null=True, description="Related reply ID"),
        "comment_content": fields.String(allow_null=True, description="Comment or reply content"),
        "read": fields.Boolean(description="Whether notification is read"),
        "created_at": fields.String(description="Creation time (ISO)")
    })
    
    return {
        "notification_model": notification_model,
        "actor_model": actor_model
    }

