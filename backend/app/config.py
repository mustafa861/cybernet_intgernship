from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        populate_by_name=True,
    )

    database_url: str = Field(
        default="postgresql://postgres:postgres@db:5432/accounting",
        validation_alias="DATABASE_URL",
    )
    jwt_secret: str = Field(
        default="change-me-in-production",
        validation_alias="JWT_SECRET",
    )
    jwt_algorithm: str = Field(default="HS256", validation_alias="JWT_ALGORITHM")
    jwt_expiry_minutes: int = Field(
        default=1440, validation_alias="JWT_EXPIRY_MINUTES"
    )

    ai_api_key: str = Field(default="", validation_alias="AI_API_KEY")
    ai_api_url: str = Field(
        default="https://api.openai.com/v1/chat/completions",
        validation_alias="AI_API_URL",
    )
    ai_model: str = Field(default="gpt-4o-mini", validation_alias="AI_MODEL")


settings = Settings()
