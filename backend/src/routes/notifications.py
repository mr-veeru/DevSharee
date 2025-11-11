"""
Notifications Routes

Provides endpoints to fetch and manage user notifications.

Endpoints:
- GET /notifications              → list notifications (pagination)
- GET /notifications/unread_count → unread notifications count
- POST /notifications/mark_all_read → mark all as read
- POST /notifications/<id>/read   → mark single as read
"""

from flask_restx import Namespace
from src.logger import logger


notifications_ns = Namespace("notifications", description="User notifications management")
