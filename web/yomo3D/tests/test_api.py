from pathlib import Path
from .conftest import jpg, project, signup, upload


def test_pages_and_auth(client):
    home = client.get('/')
    assert home.status_code == 200
    assert 'Vos espaces' in home.text
    assert client.get('/app', follow_redirects=False).status_code == 303
    csrf = signup(client)
    assert client.get('/app').status_code == 200
    assert client.get('/api/me').json()['csrf_token'] == csrf
    assert client.post('/api/logout', headers={'X-CSRF-Token': csrf}).status_code == 204
    assert client.get('/api/me').status_code == 401
    assert client.post('/api/login', json={"email":"a@example.com", "password":"incorrect"}).status_code == 401
    assert client.post('/api/login', json={"email":"a@example.com", "password":"long-password-123"}).status_code == 200
    assert client.post('/api/signup', json={"email":"a@example.com", "password":"long-password-123"}).status_code == 409


def test_project_isolation_and_csrf(client):
    csrf_a = signup(client)
    own = project(client, csrf_a)
    assert client.post('/api/projects', json={'title':'Bad', 'sector':'BNB'}).status_code == 403
    assert client.get(f'/api/projects/{own}').status_code == 200
    client.cookies.clear()
    csrf_b = signup(client, 'b@example.com')
    assert client.get('/api/projects').json() == []
    for method, url in [('get',f'/api/projects/{own}'), ('get',f'/api/projects/{own}/assets'), ('get',f'/api/projects/{own}/jobs')]:
        assert getattr(client, method)(url).status_code == 404
    assert client.delete(f'/api/projects/{own}', headers={'X-CSRF-Token': csrf_b}).status_code == 404
    assert client.post(f'/api/projects/{own}/jobs', headers={'X-CSRF-Token': csrf_b}).status_code == 404


def test_upload_validation_privacy_and_deletion(client, tmp_path):
    csrf = signup(client)
    p = project(client, csrf)
    ok = upload(client, csrf, p)
    assert ok.status_code == 201, ok.text
    asset_id = ok.json()['id']
    file_url = f'/api/projects/{p}/assets/{asset_id}/file'
    assert client.get(file_url).status_code == 200
    assert client.get(file_url).headers['cache-control'] == 'private, no-store'
    assert upload(client, csrf, p).status_code == 409
    invalid = client.post(f'/api/projects/{p}/assets', files={'file':('fake.jpg',b'this is not an image','image/jpeg')}, headers={'X-CSRF-Token':csrf})
    assert invalid.status_code == 415
    assert client.post(f'/api/projects/{p}/assets', files={'file':('bad.txt',b'', 'text/plain')}, headers={'X-CSRF-Token':csrf}).status_code == 422
    assert client.delete(f'/api/projects/{p}/assets/{asset_id}').status_code == 403
    assert client.delete(f'/api/projects/{p}/assets/{asset_id}', headers={'X-CSRF-Token':csrf}).status_code == 204
    assert client.get(file_url).status_code == 404
    upload(client, csrf, p)
    assert client.delete(f'/api/projects/{p}', headers={'X-CSRF-Token':csrf}).status_code == 204
    assert client.get(f'/api/projects/{p}').status_code == 404


def test_job_preprocessing_and_gpu_boundary(client):
    from yomo.worker import process_one
    csrf = signup(client)
    p = project(client, csrf)
    assert client.post(f'/api/projects/{p}/jobs',headers={'X-CSRF-Token':csrf}).status_code == 422
    assert upload(client, csrf, p).status_code == 201
    start = client.post(f'/api/projects/{p}/jobs', headers={'X-CSRF-Token':csrf})
    assert start.status_code == 202
    assert client.post(f'/api/projects/{p}/jobs', headers={'X-CSRF-Token':csrf}).status_code == 409
    assert process_one() is True
    result = client.get(f'/api/projects/{p}/jobs').json()[0]
    assert result['status'] == 'needs_media' and result['frame_count'] == 1
    assert result['has_scene'] is False
    # Different content to avoid duplicate SHA-256
    for i in range(1,8):
        assert upload(client, csrf, p, jpg((i*25, 80, 120))).status_code == 201
    second = client.post(f'/api/projects/{p}/jobs', headers={'X-CSRF-Token':csrf})
    assert second.status_code == 202
    assert process_one() is True
    job = client.get(f'/api/projects/{p}/jobs').json()[0]
    assert job['status'] == 'waiting_gpu' and job['frame_count'] == 8 and job['has_scene'] is False
    assert 'aucune reconstruction' in job['error']
    assert client.post(f'/api/projects/{p}/jobs', headers={'X-CSRF-Token':csrf}).status_code == 409


def test_upload_rejects_oversize(client, monkeypatch):
    from yomo.config import settings
    csrf = signup(client)
    p = project(client,csrf)
    monkeypatch.setattr(settings, 'max_image_mb', 0)
    assert upload(client, csrf, p).status_code == 413


def test_retry_guard_without_gpu(client):
    from yomo.worker import process_one
    csrf = signup(client)
    p = project(client, csrf)
    for i in range(8):
        assert upload(client, csrf, p, jpg((i*22, 80, 100))).status_code == 201
    start = client.post(f'/api/projects/{p}/jobs', headers={'X-CSRF-Token':csrf})
    assert start.status_code == 202
    assert process_one()
    job_id = start.json()['id']
    retry = client.post(f'/api/projects/{p}/jobs/{job_id}/retry', headers={'X-CSRF-Token':csrf})
    assert retry.status_code == 409
    assert 'GPU' in retry.json()['detail']


def test_media_is_private_between_users(client):
    first = signup(client, 'alice@example.com')
    p = project(client, first)
    a = upload(client, first, p).json()['id']
    url = f'/api/projects/{p}/assets/{a}/file'
    assert client.get(url).status_code == 200
    client.cookies.clear()
    second = signup(client, 'bob@example.com')
    assert client.get(url).status_code == 404
    assert client.delete(f'/api/projects/{p}/assets/{a}', headers={'X-CSRF-Token':second}).status_code == 404
    assert client.post(f'/api/projects/{p}/assets',files={'file':('x.jpg',jpg(),'image/jpeg')},headers={'X-CSRF-Token':second}).status_code == 404
