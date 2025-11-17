"""
Profile Models

Flask-RESTx models for profile endpoints.
"""

from flask_restx import fields


def create_post_edit_model(namespace):
    """Create post edit model for profile namespace."""
    return namespace.model("PostEdit", {
        "title": fields.String(required=False, description="Project title", min_length=1, max_length=200),
        "description": fields.String(required=False, description="Project description", min_length=1, max_length=2000),
        "tech_stack": fields.List(fields.String, required=False, description="Technologies used (array of strings)", min_items=1, max_items=20),
        "github_link": fields.String(required=False, description="Optional GitHub link", pattern="^https://github\\.com/.*"),
        "files": fields.List(fields.Raw, required=False, description="New files to add (max 10 files, 16MB each)")
    })

