from app.core.config import settings

def test_settings_load():
    assert settings.PROJECT_NAME == "Quant Research Dashboard"
    assert settings.VERSION == "0.1.0"
    assert settings.API_V1_STR == "/api/v1"
    assert len(settings.CORS_ORIGINS) > 0
