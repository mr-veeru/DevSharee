"""
File Upload Utilities

Shared file upload functionality using MongoDB GridFS.
Used by both posts.py and profile.py to avoid code duplication.
"""

import uuid
from werkzeug.utils import secure_filename
from src.extensions import mongo
from src.logger import logger
from gridfs import GridFS
import datetime

# File upload configuration
ALLOWED_EXTENSIONS = {'txt', 'pdf', 'png', 'jpg', 'jpeg', 'gif', 'zip', 'rar', 'doc', 'docx', 'py', 'js', 'html', 'css', 'json', 'xml'}
MAX_FILE_SIZE = 16 * 1024 * 1024  # 16MB

def allowed_file(filename):
    """Check if file extension is allowed"""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def validate_file(file):
    """
    Validate a single file upload.
    
    Args:
        file: The uploaded file object
    
    Returns:
        tuple: (is_valid, error_message, file_data)
    """
    if not file or not file.filename:
        return True, None, None  # Skip empty files
    
    # Check file extension
    if not allowed_file(file.filename):
        return False, f"File type not allowed: {file.filename}", None
    
    # Check file size
    file.seek(0, 2)  # Seek to end
    file_size = file.tell()
    file.seek(0)  # Reset to beginning
    
    if file_size == 0:
        return False, f"Empty file not allowed: {file.filename}", None
    
    if file_size > MAX_FILE_SIZE:
        return False, f"File too large: {file.filename} ({file_size // (1024*1024)}MB). Maximum size: {MAX_FILE_SIZE // (1024*1024)}MB", None
    
    # Secure filename
    filename = secure_filename(file.filename)
    if not filename:
        return False, f"Invalid filename: {file.filename}", None
    
    return True, None, {
        'file': file,
        'filename': filename,
        'file_size': file_size
    }

def upload_files_to_gridfs(files, user_id, max_files=10):
    """
    Upload multiple files to MongoDB GridFS.
    
    Args:
        files: List of uploaded file objects
        user_id: ID of the user uploading files
        max_files: Maximum number of files allowed (default: 10)
    
    Returns:
        tuple: (success, error_message, uploaded_files)
    """
    try:
        # Limit number of files
        if len(files) > max_files:
            return False, f"Cannot upload more than {max_files} files at once", []
        
        # Initialize GridFS
        fs = GridFS(mongo.cx.devshare)
        uploaded_files = []
        
        for i, file in enumerate(files):
            # Validate file
            is_valid, error_msg, file_data = validate_file(file)
            
            if not is_valid:
                return False, error_msg, []
            
            if file_data is None:  # Skip empty files
                continue
            
            try:
                # Create unique filename
                unique_filename = f"{uuid.uuid4()}_{file_data['filename']}"
                
                # Store file in GridFS
                file_id = fs.put(
                    file_data['file'].read(),
                    filename=unique_filename,
                    content_type=file_data['file'].content_type,
                    metadata={
                        "original_name": file_data['filename'],
                        "user_id": user_id,
                        "uploaded_at": datetime.datetime.utcnow()
                    }
                )
                
                # Store file reference
                uploaded_files.append({
                    "file_id": str(file_id),
                    "filename": unique_filename,
                    "original_name": file_data['filename'],
                    "content_type": file_data['file'].content_type,
                    "size": file_data['file_size']
                })
                
                logger.info(f"File uploaded successfully: {file_data['filename']} by user {user_id}")
                
            except Exception as e:
                logger.error(f"Failed to upload file {file_data['filename']}: {str(e)}")
                return False, f"Failed to save file {file_data['filename']}: {str(e)}", []
        
        return True, None, uploaded_files
        
    except Exception as e:
        logger.error(f"Error in file upload process: {str(e)}")
        return False, f"File upload failed: {str(e)}", []

def get_file_from_gridfs(file_id):
    """
    Retrieve a file from GridFS.
    
    Args:
        file_id: The GridFS file ID
    
    Returns:
        tuple: (success, error_message, file_object)
    """
    try:
        from bson import ObjectId
        
        if not ObjectId.is_valid(file_id):
            return False, "Invalid file ID format", None
        
        fs = GridFS(mongo.cx.devshare)
        file_obj = fs.get(ObjectId(file_id))
        
        if not file_obj:
            return False, "File not found", None
        
        return True, None, file_obj
        
    except Exception as e:
        logger.error(f"Error retrieving file {file_id}: {str(e)}")
        return False, f"Error retrieving file: {str(e)}", None
