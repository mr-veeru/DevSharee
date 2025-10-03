# DevShare

A simple Flask API for developer social platform.

## Setup

1. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

2. Set up MongoDB Atlas:
   - Create a free cluster at [MongoDB Atlas](https://cloud.mongodb.com)
   - Create a database user with read/write permissions
   - Get your connection string

3. Create `.env` file:
   ```bash
   copy .env.example .env
   ```
   Then update `.env` with your actual values:
   ```
   SECRET_KEY=your_secret_key
   MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/?retryWrites=true&w=majority&appName=AppName
   JWT_SECRET_KEY=your_jwt_secret
   ```

4. Run the application:
   ```bash
   python app.py
   ```

The API will be available at `http://localhost:5000`

## API Endpoints

- `GET /` - Health check and API information

## Project Structure

```
DevSharee/
├── app.py              # Main Flask application
├── requirements.txt    # Python dependencies
├── .env               # Environment variables
├── .gitignore         # Git ignore rules
└── src/
    ├── config.py      # Configuration
    ├── extensions.py  # Flask extensions
    └── logger.py      # Logging setup
```
