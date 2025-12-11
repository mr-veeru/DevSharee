"""
Health Check Routes

Industry-standard health check endpoints for monitoring and load balancers.
Implements liveness and readiness checks following Kubernetes best practices.
"""

from datetime import datetime, timezone
import sys
from flask import current_app as app
from flask_restx import Namespace, Resource, fields
from src.extensions import mongo
from src.config import Config
from src.logger import logger

# Namespace
health_ns = Namespace("health", description="Health check operations")

# Response models for Swagger documentation
health_check_model = health_ns.model('HealthCheck', {
    'status': fields.String(description='Overall health status (healthy/unhealthy)'),
    'timestamp': fields.String(description='UTC timestamp of the check'),
    'service': fields.String(description='Service name'),
    'version': fields.String(description='API version'),
    'checks': fields.Raw(description='Individual component check results'),
    'system': fields.Raw(description='System information')
})


@health_ns.route("/")
class HealthStatus(Resource):
    @health_ns.marshal_with(health_check_model, code=200)
    def get(self):
        """
        Comprehensive health check endpoint.
        
        Returns detailed status of all system components including:
        - Database connectivity
        - JWT configuration
        - Flask configuration
        - Redis connectivity (optional, for rate limiting)
        - System information
        
        Used by monitoring tools and load balancers.
        """
        health_status = {
            "status": "healthy",
            "timestamp": datetime.now(timezone.utc).isoformat() + "Z",
            "service": "DevShare",
            "version": "1.0.0",
            "checks": {},
            "system": {
                "python_version": f"{sys.version_info.major}.{sys.version_info.minor}.{sys.version_info.micro}",
                "environment": app.config.get("FLASK_ENV", "development"),
                "debug_mode": app.config.get("DEBUG", False)
            }
        }
        
        overall_healthy = True
        
        # Check database connectivity
        try:
            mongo.db.command('ping')
            health_status["checks"]["database"] = {
                "status": "healthy",
                "message": "Database connection successful"
            }
        except Exception as e:
            logger.error(f"Database connection failed: {str(e)}")
            health_status["checks"]["database"] = {
                "status": "unhealthy",
                "message": f"Database connection failed: {str(e)}"
            }
            overall_healthy = False
        
        # Check JWT configuration
        jwt_secret = app.config.get("JWT_SECRET_KEY")
        if not jwt_secret:
            overall_healthy = False
        health_status["checks"]["jwt"] = {
            "status": "healthy" if jwt_secret else "unhealthy",
            "message": "JWT configuration valid" if jwt_secret else "JWT secret key not configured"
        }
        
        # Check Flask configuration
        secret_key = app.config.get("SECRET_KEY")
        if not secret_key:
            overall_healthy = False
        health_status["checks"]["flask"] = {
            "status": "healthy" if secret_key else "unhealthy",
            "message": "Flask configuration valid" if secret_key else "Flask secret key not configured"
        }
        
        # Check Redis connectivity (optional - doesn't affect overall health)
        storage_url = Config.RATELIMIT_STORAGE_URL
        if storage_url and storage_url.startswith("redis://"):
            try:
                import redis
                from urllib.parse import urlparse
                parsed = urlparse(storage_url)
                r = redis.Redis(
                    host=parsed.hostname or "localhost",
                    port=parsed.port or 6379,
                    db=int(parsed.path.lstrip('/')) if parsed.path else 0,
                    password=parsed.password,
                    socket_connect_timeout=2,
                    socket_timeout=2
                )
                r.ping()
                health_status["checks"]["redis"] = {
                    "status": "healthy",
                    "message": "Redis connection successful (using Redis for rate limiting)",
                    "storage": "redis"
                }
            except ImportError:
                health_status["checks"]["redis"] = {
                    "status": "unhealthy",
                    "message": "Redis package not installed",
                    "storage": "fallback to memory"
                }
            except Exception as e:
                health_status["checks"]["redis"] = {
                    "status": "unhealthy",
                    "message": f"Redis connection failed: {str(e)}",
                    "storage": "fallback to memory"
                }
        else:
            health_status["checks"]["redis"] = {
                "status": "healthy",
                "message": "Using in-memory storage for rate limiting (Redis not configured)",
                "storage": "memory"
            }
        
        # Set overall status
        health_status["status"] = "healthy" if overall_healthy else "unhealthy"
        
        # Return appropriate status code (503 for unhealthy)
        status_code = 200 if overall_healthy else 503
        logger.info(f"Health status: {health_status['status']}")
        return health_status, status_code
