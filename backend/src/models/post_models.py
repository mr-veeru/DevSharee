"""
Post Models

Flask-RESTx models for post-related endpoints (posts, feed).
"""

from flask_restx import fields

# File info model (used in multiple post models)
FILE_INFO_MODEL = {
    "file_id": fields.String(description="File ID in GridFS"),
    "filename": fields.String(description="Original filename"),
    "content_type": fields.String(description="File MIME type"),
    "size": fields.Integer(description="File size in bytes")
}


def create_post_model(namespace, include_updated_at=False):
    """Create a post response model for a given namespace."""
    fields_dict = {
        "id": fields.String(description="Post ID"),
        "title": fields.String(description="Project title"),
        "description": fields.String(description="Project description"),
        "tech_stack": fields.List(fields.String),
        "github_link": fields.String,
        "files": fields.List(fields.Nested(namespace.model("FileInfo", FILE_INFO_MODEL))),
        "user_id": fields.String(description="User who created the post"),
        "likes_count": fields.Integer(description="Number of likes"),
        "comments_count": fields.Integer(description="Number of comments"),
        "created_at": fields.String(description="Post creation time")
    }
    if include_updated_at:
        fields_dict["updated_at"] = fields.String(description="Post last update time")
    return namespace.model("PostResponse", fields_dict)

