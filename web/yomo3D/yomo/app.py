import re
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Annotated
from fastapi import Depends, FastAPI, File, HTTPException, Request, Response, UploadFile
from fastapi.responses import FileResponse, HTMLResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from sqlalchemy.orm import Session as DBSession
from .auth import COOKIE, authenticate, create_session, find_session, hasher, require_csrf, require_session, set_auth_cookie
from .config import settings
from .db import init_db, session_dep
from .media import delete_project_files, private_path, receive_upload, safe_name
from .models import Asset, Job, Project, Session as UserSession, User, uid
from .schemas import Login, ProjectCreate, Signup

ROOT = Path(__file__).resolve().parent.parent


@asynccontextmanager
async def lifespan(_app):
    settings.storage_dir.mkdir(parents=True, exist_ok=True)
    init_db()
    yield


app = FastAPI(title="YOMO 3D", version="0.1.0", lifespan=lifespan)
app.mount("/static", StaticFiles(directory=ROOT / "static"), name="static")
templates = Jinja2Templates(directory=ROOT / "templates")


@app.middleware("http")
async def security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Content-Security-Policy"] = "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; object-src 'none'"
    if settings.env == "production":
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    return response


def current_user_and_session(request: Request, db: DBSession):
    sess = find_session(db, request.cookies.get(COOKIE))
    return (sess.user, sess) if sess else (None, None)


def html(request: Request, db: DBSession, name: str, **ctx):
    user, sess = current_user_and_session(request, db)
    return templates.TemplateResponse(request, name, {"user": user, "csrf": sess.csrf_token if sess else "", **ctx})


def owned(db: DBSession, owner_id: str, project_id: str) -> Project:
    project = db.get(Project, project_id)
    if project is None or project.owner_id != owner_id:
        raise HTTPException(404, "Projet introuvable")
    return project


def project_json(project: Project):
    return {"id": project.id, "title": project.title, "sector": project.sector, "description": project.description, "created_at": project.created_at.isoformat()}


def job_json(job: Job):
    return {"id": job.id, "status": job.status, "stage": job.stage, "error": job.error, "frame_count": job.frame_count, "created_at": job.created_at.isoformat(), "has_scene": bool(job.artifact_key)}


@app.get("/", response_class=HTMLResponse)
def home(request: Request, db: Annotated[DBSession, Depends(session_dep)]):
    return html(request, db, "home.html")


@app.get("/login", response_class=HTMLResponse)
def login_page(request: Request, db: Annotated[DBSession, Depends(session_dep)]):
    return html(request, db, "auth.html", mode="login")


@app.get("/signup", response_class=HTMLResponse)
def signup_page(request: Request, db: Annotated[DBSession, Depends(session_dep)]):
    return html(request, db, "auth.html", mode="signup")


@app.get("/app", response_class=HTMLResponse)
def dashboard(request: Request, db: Annotated[DBSession, Depends(session_dep)]):
    user, sess = current_user_and_session(request, db)
    if not user:
        return RedirectResponse("/login", status_code=303)
    projects = db.query(Project).filter(Project.owner_id == user.id).order_by(Project.created_at.desc()).all()
    return html(request, db, "dashboard.html", projects=projects)


@app.get("/app/projects/{project_id}", response_class=HTMLResponse)
def project_page(request: Request, project_id: str, db: Annotated[DBSession, Depends(session_dep)]):
    user, sess = current_user_and_session(request, db)
    if not user:
        return RedirectResponse("/login", status_code=303)
    project = owned(db, user.id, project_id)
    assets = db.query(Asset).filter(Asset.project_id == project_id).order_by(Asset.created_at.desc()).all()
    jobs = db.query(Job).filter(Job.project_id == project_id).order_by(Job.created_at.desc()).all()
    return html(request, db, "project.html", project=project, assets=assets, jobs=jobs)


@app.get("/api/me")
def me(sess: Annotated[UserSession, Depends(require_session)]):
    return {"id": sess.user.id, "email": sess.user.email, "csrf_token": sess.csrf_token}


@app.post("/api/signup", status_code=201)
def signup(body: Signup, response: Response, db: Annotated[DBSession, Depends(session_dep)]):
    email = body.email.lower().strip()
    if not re.fullmatch(r"[^@\s]+@[^@\s]+\.[^@\s]+", email):
        raise HTTPException(422, "Adresse e-mail invalide")
    if db.query(User).filter(User.email == email).first():
        raise HTTPException(409, "Cette adresse est déjà utilisée")
    user = User(email=email, password_hash=hasher.hash(body.password))
    db.add(user)
    db.commit()
    token, sess = create_session(db, user)
    set_auth_cookie(response, token)
    return {"id": user.id, "email": user.email, "csrf_token": sess.csrf_token}


@app.post("/api/login")
def login(body: Login, response: Response, db: Annotated[DBSession, Depends(session_dep)]):
    user = authenticate(db, body.email, body.password)
    if not user:
        raise HTTPException(401, "Identifiants invalides")
    token, sess = create_session(db, user)
    set_auth_cookie(response, token)
    return {"id": user.id, "email": user.email, "csrf_token": sess.csrf_token}


@app.post("/api/logout", status_code=204)
def logout(response: Response, db: Annotated[DBSession, Depends(session_dep)], sess: Annotated[UserSession, Depends(require_csrf)]):
    db.delete(sess)
    db.commit()
    response.delete_cookie(COOKIE, path="/")


@app.get("/api/projects")
def projects_list(db: Annotated[DBSession, Depends(session_dep)], sess: Annotated[UserSession, Depends(require_session)]):
    result = db.query(Project).filter(Project.owner_id == sess.user_id).order_by(Project.created_at.desc()).all()
    return [project_json(p) for p in result]


@app.post("/api/projects", status_code=201)
def projects_create(body: ProjectCreate, db: Annotated[DBSession, Depends(session_dep)], sess: Annotated[UserSession, Depends(require_csrf)]):
    if not body.title.strip():
        raise HTTPException(422, "Nom de projet requis")
    project = Project(owner_id=sess.user_id, title=body.title.strip(), sector=body.sector, description=body.description.strip())
    db.add(project)
    db.commit()
    return project_json(project)


@app.get("/api/projects/{project_id}")
def projects_get(project_id: str, db: Annotated[DBSession, Depends(session_dep)], sess: Annotated[UserSession, Depends(require_session)]):
    return project_json(owned(db, sess.user_id, project_id))


@app.delete("/api/projects/{project_id}", status_code=204)
def projects_delete(project_id: str, db: Annotated[DBSession, Depends(session_dep)], sess: Annotated[UserSession, Depends(require_csrf)]):
    project = owned(db, sess.user_id, project_id)
    if any(j.status in ("queued", "running") for j in project.jobs):
        raise HTTPException(409, "Attends la fin du traitement avant de supprimer")
    db.delete(project)
    db.commit()
    delete_project_files(project_id)


@app.get("/api/projects/{project_id}/assets")
def assets_list(project_id: str, db: Annotated[DBSession, Depends(session_dep)], sess: Annotated[UserSession, Depends(require_session)]):
    owned(db, sess.user_id, project_id)
    assets = db.query(Asset).filter(Asset.project_id == project_id).all()
    return [{"id": a.id, "filename": a.filename, "kind": a.kind, "size_bytes": a.size_bytes} for a in assets]


@app.post("/api/projects/{project_id}/assets", status_code=201)
async def assets_upload(project_id: str, db: Annotated[DBSession, Depends(session_dep)], sess: Annotated[UserSession, Depends(require_csrf)], file: UploadFile = File(...)):
    owned(db, sess.user_id, project_id)
    if db.query(Job).filter(Job.project_id == project_id, Job.status.in_(["queued", "running"])).first():
        raise HTTPException(409, "Import impossible pendant la reconstruction")
    asset_id = uid()
    rel_base = f"{project_id}/media/{asset_id}"
    target = private_path(rel_base)
    size, digest, kind, mime, final_name = await receive_upload(file, target)
    rel = f"{project_id}/media/{final_name}"
    if db.query(Asset).filter(Asset.project_id == project_id, Asset.sha256 == digest).first():
        private_path(rel).unlink(missing_ok=True)
        raise HTTPException(409, "Ce média est déjà présent dans le projet")
    asset = Asset(id=asset_id, project_id=project_id, filename=safe_name(file.filename), storage_key=rel, kind=kind, mime_type=mime, size_bytes=size, sha256=digest)
    try:
        db.add(asset)
        db.commit()
    except Exception:
        db.rollback()
        private_path(rel).unlink(missing_ok=True)
        raise
    return {"id": asset.id, "filename": asset.filename, "size_bytes": asset.size_bytes, "kind": asset.kind}


@app.get("/api/projects/{project_id}/assets/{asset_id}/file")
def assets_download(project_id: str, asset_id: str, db: Annotated[DBSession, Depends(session_dep)], sess: Annotated[UserSession, Depends(require_session)]):
    owned(db, sess.user_id, project_id)
    asset = db.get(Asset, asset_id)
    if not asset or asset.project_id != project_id:
        raise HTTPException(404, "Média introuvable")
    return FileResponse(private_path(asset.storage_key), media_type=asset.mime_type, headers={"Cache-Control": "private, no-store", "Content-Disposition": "inline"})


@app.delete("/api/projects/{project_id}/assets/{asset_id}", status_code=204)
def assets_delete(project_id: str, asset_id: str, db: Annotated[DBSession, Depends(session_dep)], sess: Annotated[UserSession, Depends(require_csrf)]):
    owned(db, sess.user_id, project_id)
    if db.query(Job).filter(Job.project_id == project_id, Job.status.in_(["queued", "running"])).first():
        raise HTTPException(409, "Traitement en cours ou en attente")
    asset = db.get(Asset, asset_id)
    if not asset or asset.project_id != project_id:
        raise HTTPException(404, "Média introuvable")
    filepath = private_path(asset.storage_key)
    db.delete(asset)
    db.commit()
    filepath.unlink(missing_ok=True)


@app.post("/api/projects/{project_id}/jobs", status_code=202)
def jobs_create(project_id: str, db: Annotated[DBSession, Depends(session_dep)], sess: Annotated[UserSession, Depends(require_csrf)]):
    owned(db, sess.user_id, project_id)
    if not db.query(Asset).filter(Asset.project_id == project_id).first():
        raise HTTPException(422, "Importe d'abord des photos ou une vidéo")
    if db.query(Job).filter(Job.project_id == project_id, Job.status.in_(["queued", "running", "waiting_gpu"])).first():
        raise HTTPException(409, "Un traitement est déjà en attente ou actif")
    job = Job(project_id=project_id)
    db.add(job)
    db.commit()
    return job_json(job)


@app.get("/api/projects/{project_id}/jobs")
def jobs_list(project_id: str, db: Annotated[DBSession, Depends(session_dep)], sess: Annotated[UserSession, Depends(require_session)]):
    owned(db, sess.user_id, project_id)
    return [job_json(j) for j in db.query(Job).filter(Job.project_id == project_id).order_by(Job.created_at.desc()).all()]


@app.get("/api/projects/{project_id}/jobs/{job_id}")
def jobs_get(project_id: str, job_id: str, db: Annotated[DBSession, Depends(session_dep)], sess: Annotated[UserSession, Depends(require_session)]):
    owned(db, sess.user_id, project_id)
    job = db.get(Job, job_id)
    if not job or job.project_id != project_id:
        raise HTTPException(404, "Traitement introuvable")
    return job_json(job)


@app.post("/api/projects/{project_id}/jobs/{job_id}/retry", status_code=202)
def jobs_retry(project_id: str, job_id: str, db: Annotated[DBSession, Depends(session_dep)], sess: Annotated[UserSession, Depends(require_csrf)]):
    owned(db, sess.user_id, project_id)
    job = db.get(Job, job_id)
    if not job or job.project_id != project_id:
        raise HTTPException(404, "Traitement introuvable")
    if job.status not in ("needs_media", "failed", "waiting_gpu"):
        raise HTTPException(409, "Ce traitement ne peut pas être relancé")
    if job.status == "waiting_gpu" and not settings.enable_gpu:
        raise HTTPException(409, "Le moteur GPU n'est pas configuré")
    if db.query(Job).filter(Job.project_id == project_id, Job.status.in_(["queued", "running"])).first():
        raise HTTPException(409, "Un autre traitement est actif")
    job.status, job.stage, job.error = "queued", "queued", None
    db.commit()
    return job_json(job)


@app.get("/api/health")
def health():
    import shutil
    tools = ("colmap", "ns-process-data", "ns-train", "ns-export")
    available = settings.enable_gpu and all(shutil.which(tool) for tool in tools)
    return {"status": "ok", "gpu_enabled": settings.enable_gpu, "reconstruction_tools_installed": bool(available), "gpu_validation": "not_checked"}
