import os


class Config:
    gemini_api_key = os.getenv("GEMINI_API_KEY", "")

config_obj = Config()
