# main.py
import uvicorn
import os
from dotenv import load_dotenv


# Load environment variables from .env file
load_dotenv()

if __name__ == "__main__":
    is_dev = os.getenv("DEV_MODE") == "true"
    port = int(os.getenv("PORT", 8000))
    workers = os.cpu_count() * 2 + 1 if not is_dev else 1
    print(
        f"Running in {'development' if is_dev else 'production'} mode on port {port} with {workers} workers")
    uvicorn.run(
        "server:app",  # Pass the app as an import string
        host="localhost" if is_dev else "0.0.0.0",
        port=port,
        reload=is_dev,
        workers=workers
    )
