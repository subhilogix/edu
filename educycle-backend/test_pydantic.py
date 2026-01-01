from pydantic_settings import BaseSettings, SettingsConfigDict
import os

class Settings(BaseSettings):
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

s = Settings()
print(f"PWD: {os.getcwd()}")
print(f"File exists: {os.path.exists('.env')}")
print(f"SMTP_USER: '{s.SMTP_USER}'")
print(f"Has PWD: {bool(s.SMTP_PASSWORD)}")
