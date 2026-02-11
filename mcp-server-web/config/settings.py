import os
from dotenv import load_dotenv

load_dotenv()


class Settings:
    database_url: str = os.getenv("DATABASE_URL")
    jwt_secret: str = os.getenv("JWT_SECRET")
    refresh_token_secret: str = os.getenv("REFRESH_TOKEN_SECRET")
    access_token_secret: str = os.getenv("ACCESS_TOKEN_SECRET")
    algorithm: str = os.getenv("ALGORITHM", "HS256")
    access_token_expire_minutes: int = int(
        os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))
    refresh_token_expire_days: int = int(
        os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "7"))
    domain: str = os.getenv("DOMAIN", "localhost")
    domain_address: str = os.getenv("DOMAIN_ADDRESS", "http://localhost:5173")
    email_address: str = os.getenv("EMAIL_ADDRESS")


settings = Settings()
