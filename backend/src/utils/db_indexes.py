"""
Database Indexes Setup

This module creates all necessary MongoDB indexes to optimize query performance.
Indexes are created automatically when the application starts.
"""

from src.extensions import mongo
from src.logger import logger
from pymongo import ASCENDING, DESCENDING, TEXT
from pymongo.errors import DuplicateKeyError
from bson import ObjectId


def cleanup_duplicate_jtis():
    """Remove duplicate jti entries from token_blacklist, keeping the most recent one."""
    try:
        db = mongo.db
        collection = db.token_blacklist
        
        # Use aggregation to find duplicates
        pipeline = [
            {"$group": {
                "_id": "$jti",
                "count": {"$sum": 1},
                "docs": {"$push": {"id": "$_id", "revoked_at": "$revoked_at"}}
            }},
            {"$match": {"count": {"$gt": 1}}}
        ]
        
        duplicates = list(collection.aggregate(pipeline))
        duplicates_removed = 0
        
        for dup in duplicates:
            jti = dup["_id"]
            docs = dup["docs"]
            
            # Sort by revoked_at (most recent first), or by _id if revoked_at is missing
            docs.sort(key=lambda x: x.get("revoked_at") or x["id"], reverse=True)
            
            # Keep the first (most recent), delete the rest
            for doc in docs[1:]:
                collection.delete_one({"_id": doc["id"]})
                duplicates_removed += 1
        
        if duplicates_removed > 0:
            logger.info(f"Cleaned up {duplicates_removed} duplicate jti entries from token_blacklist")
        return duplicates_removed
    except Exception as e:
        logger.warning(f"Error cleaning up duplicate jtis: {str(e)}")
        return 0


def create_indexes():
    """
    Create all necessary indexes for optimal query performance.
    This function should be called during application initialization.
    Handles existing indexes gracefully - skips if index with same keys already exists.
    """
    try:
        db = mongo.db
        
        def safe_create_index(collection, keys, unique=False, name=None, **kwargs):
            """Safely create index, handling conflicts with existing indexes."""
            try:
                # Check if index with same keys already exists
                existing_indexes = list(collection.list_indexes())
                for idx in existing_indexes:
                    idx_keys = idx.get('key', {})
                    # Compare keys (handle both dict and list formats)
                    if isinstance(keys, list):
                        keys_dict = {k[0]: k[1] for k in keys}
                    else:
                        keys_dict = keys
                    
                    if idx_keys == keys_dict:
                        logger.debug(f"  - Index on {list(keys_dict.keys())} already exists as '{idx.get('name', 'unnamed')}'")
                        return False
                
                # Create index if it doesn't exist
                collection.create_index(keys, unique=unique, name=name, **kwargs)
                return True
            except (DuplicateKeyError, Exception) as e:
                if isinstance(e, DuplicateKeyError):
                    # Collection has duplicate data, can't create unique index
                    logger.warning(f"  - Cannot create unique index: collection has duplicate values. {str(e)}")
                    return False
                elif "already exists" in str(e).lower() or "IndexOptionsConflict" in str(e):
                    logger.debug(f"  - Index already exists (different name): {str(e)}")
                    return False
                raise
        
        # ========== USERS COLLECTION ==========
        logger.info("Creating indexes for 'users' collection...")
        
        # Email index (unique, for login/registration lookups)
        if safe_create_index(db.users, [("email", ASCENDING)], unique=True, name="email_unique"):
            logger.info("  ✓ Created index: email (unique)")
        
        # Username index (unique, for login/registration lookups)
        if safe_create_index(db.users, [("username", ASCENDING)], unique=True, name="username_unique"):
            logger.info("  ✓ Created index: username (unique)")
        
        # Status index (for filtering active users)
        if safe_create_index(db.users, [("status", ASCENDING)], name="status"):
            logger.info("  ✓ Created index: status")
        
        # ========== POSTS COLLECTION ==========
        logger.info("Creating indexes for 'posts' collection...")
        
        # User ID index (for finding user's posts)
        if safe_create_index(db.posts, [("user_id", ASCENDING)], name="user_id"):
            logger.info("  ✓ Created index: user_id")
        
        # Created at index (for sorting posts by date)
        if safe_create_index(db.posts, [("created_at", DESCENDING)], name="created_at_desc"):
            logger.info("  ✓ Created index: created_at (descending)")
        
        # Tech stack index (for filtering by technology)
        if safe_create_index(db.posts, [("tech_stack", ASCENDING)], name="tech_stack"):
            logger.info("  ✓ Created index: tech_stack")
        
        # Compound index: user_id + created_at (for user's posts sorted by date)
        if safe_create_index(db.posts, [("user_id", ASCENDING), ("created_at", DESCENDING)], name="user_id_created_at"):
            logger.info("  ✓ Created compound index: user_id + created_at")
        
        # Text search index for title and description (for search functionality)
        if safe_create_index(db.posts, [("title", TEXT), ("description", TEXT)], name="title_description_text"):
            logger.info("  ✓ Created text index: title + description")
        
        # ========== LIKES COLLECTION ==========
        logger.info("Creating indexes for 'likes' collection...")
        
        # Post ID index (for finding likes on a post)
        if safe_create_index(db.likes, [("post_id", ASCENDING)], name="post_id"):
            logger.info("  ✓ Created index: post_id")
        
        # User ID index (for finding user's likes)
        if safe_create_index(db.likes, [("user_id", ASCENDING)], name="user_id"):
            logger.info("  ✓ Created index: user_id")
        
        # Compound unique index: user_id + post_id (prevents duplicate likes)
        if safe_create_index(db.likes, [("user_id", ASCENDING), ("post_id", ASCENDING)], unique=True, name="user_post_unique"):
            logger.info("  ✓ Created compound unique index: user_id + post_id")
        
        # Created at index (for sorting likes by date)
        if safe_create_index(db.likes, [("created_at", DESCENDING)], name="created_at_desc"):
            logger.info("  ✓ Created index: created_at (descending)")
        
        # ========== COMMENTS COLLECTION ==========
        logger.info("Creating indexes for 'comments' collection...")
        
        # Post ID index (for finding comments on a post)
        if safe_create_index(db.comments, [("post_id", ASCENDING)], name="post_id"):
            logger.info("  ✓ Created index: post_id")
        
        # User ID index (for finding user's comments)
        if safe_create_index(db.comments, [("user_id", ASCENDING)], name="user_id"):
            logger.info("  ✓ Created index: user_id")
        
        # Created at index (for sorting comments by date)
        if safe_create_index(db.comments, [("created_at", DESCENDING)], name="created_at_desc"):
            logger.info("  ✓ Created index: created_at (descending)")
        
        # Compound index: post_id + created_at (for comments on a post sorted by date)
        if safe_create_index(db.comments, [("post_id", ASCENDING), ("created_at", DESCENDING)], name="post_id_created_at"):
            logger.info("  ✓ Created compound index: post_id + created_at")
        
        # ========== REPLIES COLLECTION ==========
        logger.info("Creating indexes for 'replies' collection...")
        
        # Comment ID index (for finding replies to a comment)
        if safe_create_index(db.replies, [("comment_id", ASCENDING)], name="comment_id"):
            logger.info("  ✓ Created index: comment_id")
        
        # User ID index (for finding user's replies)
        if safe_create_index(db.replies, [("user_id", ASCENDING)], name="user_id"):
            logger.info("  ✓ Created index: user_id")
        
        # Post ID index (for finding replies on a post)
        if safe_create_index(db.replies, [("post_id", ASCENDING)], name="post_id"):
            logger.info("  ✓ Created index: post_id")
        
        # Created at index (for sorting replies by date)
        if safe_create_index(db.replies, [("created_at", DESCENDING)], name="created_at_desc"):
            logger.info("  ✓ Created index: created_at (descending)")
        
        # Compound index: comment_id + created_at (for replies to a comment sorted by date)
        if safe_create_index(db.replies, [("comment_id", ASCENDING), ("created_at", DESCENDING)], name="comment_id_created_at"):
            logger.info("  ✓ Created compound index: comment_id + created_at")
        
        # ========== COMMENT_LIKES COLLECTION ==========
        logger.info("Creating indexes for 'comment_likes' collection...")
        
        # Comment ID index (for finding likes on a comment)
        if safe_create_index(db.comment_likes, [("comment_id", ASCENDING)], name="comment_id"):
            logger.info("  ✓ Created index: comment_id")
        
        # User ID index (for finding user's comment likes)
        if safe_create_index(db.comment_likes, [("user_id", ASCENDING)], name="user_id"):
            logger.info("  ✓ Created index: user_id")
        
        # Compound unique index: user_id + comment_id (prevents duplicate likes)
        if safe_create_index(db.comment_likes, [("user_id", ASCENDING), ("comment_id", ASCENDING)], unique=True, name="user_comment_unique"):
            logger.info("  ✓ Created compound unique index: user_id + comment_id")
        
        # Created at index (for sorting likes by date)
        if safe_create_index(db.comment_likes, [("created_at", DESCENDING)], name="created_at_desc"):
            logger.info("  ✓ Created index: created_at (descending)")
        
        # ========== REPLY_LIKES COLLECTION ==========
        logger.info("Creating indexes for 'reply_likes' collection...")
        
        # Reply ID index (for finding likes on a reply)
        if safe_create_index(db.reply_likes, [("reply_id", ASCENDING)], name="reply_id"):
            logger.info("  ✓ Created index: reply_id")
        
        # User ID index (for finding user's reply likes)
        if safe_create_index(db.reply_likes, [("user_id", ASCENDING)], name="user_id"):
            logger.info("  ✓ Created index: user_id")
        
        # Compound unique index: user_id + reply_id (prevents duplicate likes)
        if safe_create_index(db.reply_likes, [("user_id", ASCENDING), ("reply_id", ASCENDING)], unique=True, name="user_reply_unique"):
            logger.info("  ✓ Created compound unique index: user_id + reply_id")
        
        # Created at index (for sorting likes by date)
        if safe_create_index(db.reply_likes, [("created_at", DESCENDING)], name="created_at_desc"):
            logger.info("  ✓ Created index: created_at (descending)")
        
        # ========== NOTIFICATIONS COLLECTION ==========
        logger.info("Creating indexes for 'notifications' collection...")
        
        # Recipient ID index (for finding user's notifications)
        if safe_create_index(db.notifications, [("recipient_id", ASCENDING)], name="recipient_id"):
            logger.info("  ✓ Created index: recipient_id")
        
        # Read status index (for filtering read/unread notifications)
        if safe_create_index(db.notifications, [("read", ASCENDING)], name="read"):
            logger.info("  ✓ Created index: read")
        
        # Created at index (for sorting notifications by date)
        if safe_create_index(db.notifications, [("created_at", DESCENDING)], name="created_at_desc"):
            logger.info("  ✓ Created index: created_at (descending)")
        
        # Compound index: recipient_id + created_at (for user's notifications sorted by date)
        if safe_create_index(db.notifications, [("recipient_id", ASCENDING), ("created_at", DESCENDING)], name="recipient_id_created_at"):
            logger.info("  ✓ Created compound index: recipient_id + created_at")
        
        # Compound index: recipient_id + read (for filtering unread notifications)
        if safe_create_index(db.notifications, [("recipient_id", ASCENDING), ("read", ASCENDING)], name="recipient_id_read"):
            logger.info("  ✓ Created compound index: recipient_id + read")
        
        # Actor ID index (for finding notifications by actor)
        if safe_create_index(db.notifications, [("actor_id", ASCENDING)], name="actor_id"):
            logger.info("  ✓ Created index: actor_id")
        
        # Post ID index (for finding notifications by post)
        if safe_create_index(db.notifications, [("post_id", ASCENDING)], name="post_id"):
            logger.info("  ✓ Created index: post_id")
        
        # Comment ID index (for finding notifications by comment)
        if safe_create_index(db.notifications, [("comment_id", ASCENDING)], name="comment_id"):
            logger.info("  ✓ Created index: comment_id")
        
        # Reply ID index (for finding notifications by reply)
        if safe_create_index(db.notifications, [("reply_id", ASCENDING)], name="reply_id"):
            logger.info("  ✓ Created index: reply_id")
        
        # ========== TOKEN_BLACKLIST COLLECTION ==========
        logger.info("Creating indexes for 'token_blacklist' collection...")
        
        # Clean up duplicate jtis before creating unique index
        cleanup_duplicate_jtis()
        
        # JTI index (unique, for finding blacklisted tokens)
        if safe_create_index(db.token_blacklist, [("jti", ASCENDING)], unique=True, name="jti_unique"):
            logger.info("  ✓ Created index: jti (unique)")
        
        # User ID index (for finding user's blacklisted tokens)
        if safe_create_index(db.token_blacklist, [("user_id", ASCENDING)], name="user_id"):
            logger.info("  ✓ Created index: user_id")
        
        # Expires at index (for cleanup operations)
        if safe_create_index(db.token_blacklist, [("expires_at", ASCENDING)], name="expires_at"):
            logger.info("  ✓ Created index: expires_at")
        
        logger.info("✓ All database indexes created successfully!")
        return True
        
    except Exception as e:
        logger.error(f"Error creating database indexes: {str(e)}", exc_info=True)
        return False

