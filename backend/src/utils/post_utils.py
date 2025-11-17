"""
Post Utilities

Helper functions for post-related operations (pagination, sorting, user fetching).
"""

from bson import ObjectId
from src.extensions import mongo

# Sort options for post queries
POST_SORT_OPTIONS = {
    'created_at_desc': [("created_at", -1)],
    'created_at_asc': [("created_at", 1)],
    'title_asc': [("title", 1)],
    'title_desc': [("title", -1)],
    'updated_at_desc': [("updated_at", -1)]
}


def validate_pagination(page, limit, max_limit=50):
    """Validate and normalize pagination parameters."""
    page = max(int(page) if page else 1, 1)
    limit = min(max(int(limit) if limit else 10, 1), max_limit)
    return page, limit


def get_sort_criteria(sort_key, default='created_at_desc'):
    """Get MongoDB sort criteria from sort key."""
    return POST_SORT_OPTIONS.get(sort_key, POST_SORT_OPTIONS[default])


def batch_fetch_users(user_ids):
    """Batch fetch users by IDs to avoid N+1 queries."""
    if not user_ids:
        return {}
    oids = [ObjectId(uid) if not isinstance(uid, ObjectId) else uid for uid in user_ids]
    users = list(mongo.db.users.find({"_id": {"$in": oids}}))
    return {str(u["_id"]): u for u in users}

