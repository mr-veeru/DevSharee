"""
Routes for the API with Global Error Handling
"""

from flask import jsonify
from pymongo.errors import PyMongoError, DuplicateKeyError, OperationFailure
from bson.errors import InvalidId
from src.logger import logger

# Import all route namespaces
from .auth import auth_ns
from .health import health_ns
from .posts import posts_ns

def register_error_handlers(app):
    """
    Register global error handlers for the Flask application.
    This provides consistent error responses across all routes.
    """
    
    @app.errorhandler(400)
    def handle_bad_request(error):
        """Handle 400 Bad Request errors"""
        logger.warning(f"Bad Request: {str(error)}")
        return jsonify({
            "error": "Bad Request",
            "message": "Invalid request data",
            "status_code": 400
        }), 400
    
    @app.errorhandler(401)
    def handle_unauthorized(error):
        """Handle 401 Unauthorized errors"""
        logger.warning(f"Unauthorized: {str(error)}")
        return jsonify({
            "error": "Unauthorized",
            "message": "Authentication required",
            "status_code": 401
        }), 401
    
    @app.errorhandler(403)
    def handle_forbidden(error):
        """Handle 403 Forbidden errors"""
        logger.warning(f"Forbidden: {str(error)}")
        return jsonify({
            "error": "Forbidden",
            "message": "Access denied",
            "status_code": 403
        }), 403
    
    @app.errorhandler(404)
    def handle_not_found(error):
        """Handle 404 Not Found errors"""
        logger.warning(f"Not Found: {str(error)}")
        return jsonify({
            "error": "Not Found",
            "message": "Resource not found",
            "status_code": 404
        }), 404
    
    @app.errorhandler(422)
    def handle_unprocessable_entity(error):
        """Handle 422 Unprocessable Entity errors"""
        logger.warning(f"Unprocessable Entity: {str(error)}")
        return jsonify({
            "error": "Unprocessable Entity",
            "message": "Request data validation failed",
            "status_code": 422
        }), 422
    
    @app.errorhandler(500)
    def handle_internal_server_error(error):
        """Handle 500 Internal Server Error"""
        logger.error(f"Internal Server Error: {str(error)}")
        return jsonify({
            "error": "Internal Server Error",
            "message": "An unexpected error occurred",
            "status_code": 500
        }), 500
    
    # MongoDB specific error handlers
    @app.errorhandler(DuplicateKeyError)
    def handle_duplicate_key(error):
        """Handle MongoDB duplicate key errors"""
        logger.warning(f"Duplicate Key Error: {str(error)}")
        return jsonify({
            "error": "Conflict",
            "message": "Resource already exists",
            "status_code": 409
        }), 409
    
    @app.errorhandler(OperationFailure)
    def handle_operation_failure(error):
        """Handle MongoDB operation failures"""
        logger.error(f"MongoDB Operation Failure: {str(error)}")
        return jsonify({
            "error": "Database Error",
            "message": "Database operation failed",
            "status_code": 500
        }), 500
    
    @app.errorhandler(PyMongoError)
    def handle_pymongo_error(error):
        """Handle general PyMongo errors"""
        logger.error(f"PyMongo Error: {str(error)}")
        return jsonify({
            "error": "Database Error",
            "message": "Database connection or operation failed",
            "status_code": 500
        }), 500
    
    @app.errorhandler(InvalidId)
    def handle_invalid_id(error):
        """Handle invalid ObjectId errors"""
        logger.warning(f"Invalid ObjectId: {str(error)}")
        return jsonify({
            "error": "Bad Request",
            "message": "Invalid ID format",
            "status_code": 400
        }), 400
    
    # Generic exception handler
    @app.errorhandler(Exception)
    def handle_generic_exception(error):
        """Handle any unhandled exceptions"""
        logger.error(f"Unhandled Exception: {str(error)}", exc_info=True)
        return jsonify({
            "error": "Internal Server Error",
            "message": "An unexpected error occurred",
            "status_code": 500
        }), 500

__all__ = ["auth_ns", "health_ns", "posts_ns", "register_error_handlers"]