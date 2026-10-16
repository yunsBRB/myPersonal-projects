import subprocess
from .conftest import project, signup


def test_ffmpeg_video_input(client, tmp_path):
    from yomo.worker import process_one
    path = tmp_path / 'sample.mp4'
    subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-y','-f','lavfi','-i','testsrc=size=640x480:rate=10','-t','3','-c:v','mpeg4','-q:v','8',str(path)], check=True, timeout=30)
    csrf = signup(client)
    p = project(client, csrf)
    with path.open('rb') as source:
        result = client.post(f'/api/projects/{p}/assets', files={'file': ('walkthrough.mp4', source, 'video/mp4')}, headers={'X-CSRF-Token':csrf})
    assert result.status_code == 201, result.text
    assert result.json()['kind'] == 'video'
    assert client.post(f'/api/projects/{p}/jobs',headers={'X-CSRF-Token':csrf}).status_code == 202
    assert process_one()
    last = client.get(f'/api/projects/{p}/jobs').json()[0]
    assert last['status'] == 'needs_media' and 2 <= last['frame_count'] <= 4, last
