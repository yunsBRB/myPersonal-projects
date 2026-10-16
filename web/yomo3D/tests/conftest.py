from io import BytesIO
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import sessionmaker
from yomo.app import app
from yomo.db import make_engine, session_dep
from yomo.models import Base
from yomo.config import settings
from yomo import worker


@pytest.fixture
def client(tmp_path, monkeypatch):
    engine = make_engine(f"sqlite:///{tmp_path}/test.sqlite")
    Base.metadata.create_all(engine)
    Local = sessionmaker(bind=engine, expire_on_commit=False)
    monkeypatch.setattr(settings, "storage_dir", tmp_path / "private")
    monkeypatch.setattr(settings, "enable_gpu", False)
    monkeypatch.setattr(worker, "SessionLocal", Local)
    def override():
        with Local() as session:
            yield session
    app.dependency_overrides[session_dep] = override
    with TestClient(app) as client:
        yield client
    app.dependency_overrides.clear()
    engine.dispose()


def signup(client, email="a@example.com"):
    response = client.post('/api/signup', json={"email": email, "password": "long-password-123"})
    assert response.status_code == 201, response.text
    return response.json()['csrf_token']


def project(client, csrf, name="La Maison"):
    response = client.post('/api/projects', json={"title": name, "sector": "BNB", "description": "Pièce lumineuse"}, headers={"X-CSRF-Token": csrf})
    assert response.status_code == 201, response.text
    return response.json()['id']


def jpg(color="green"):
    from PIL import Image
    f = BytesIO()
    Image.new('RGB', (640, 480), color).save(f, format='JPEG')
    return f.getvalue()


def upload(client, csrf, project_id, contents=None):
    return client.post(f'/api/projects/{project_id}/assets', files={"file": ("capture.jpg", contents or jpg(), "image/jpeg")}, headers={"X-CSRF-Token": csrf})
