from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_prefix="YOMO_", env_file=".env", extra="ignore")
    env: str = "development"
    database_url: str = "sqlite:///./data/yomo.db"
    storage_dir: Path = Path("./data/private")
    max_image_mb: int = 20
    max_video_mb: int = 250
    session_days: int = 7
    enable_gpu: bool = False
    gpu_timeout_seconds: int = 14400


settings = Settings()
