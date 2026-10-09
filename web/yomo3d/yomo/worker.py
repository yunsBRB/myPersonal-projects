"""Worker à processus séparé. Exécuter: python -m yomo.worker --once"""
import argparse
import logging
import shutil
import subprocess
import time
from pathlib import Path
from PIL import Image, ImageOps
from sqlalchemy import update
from .config import settings
from .db import SessionLocal, init_db
from .media import private_path
from .models import Asset, Job, Project

logger = logging.getLogger("yomo.worker")


def run(args: list[str], seconds: int = 1800):
    logger.info("Démarrage: %s", args[0])
    result = subprocess.run(args, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, timeout=seconds, check=False)
    if result.returncode != 0:
        raise RuntimeError(f"{args[0]} code {result.returncode}: {result.stdout[-1500:]}")
    return result.stdout


def mark(db, job: Job, status: str, stage: str, error: str | None = None):
    job.status, job.stage, job.error = status, stage, error
    db.commit()


def preprocess(assets: list[Asset], destination: Path) -> int:
    destination.mkdir(parents=True, exist_ok=True)
    saved = 0
    for asset in assets:
        src = private_path(asset.storage_key)
        if asset.kind == "image":
            with Image.open(src) as source:
                im = ImageOps.exif_transpose(source).convert("RGB")
                im.thumbnail((1600, 1600))
                target = destination / f"frame-{saved:05d}.jpg"
                im.save(target, "JPEG", quality=90)
                saved += 1
        elif asset.kind == "video":
            video_dir = destination / f"video-{asset.id}"
            video_dir.mkdir(exist_ok=True)
            run(["ffmpeg", "-hide_banner", "-nostdin", "-loglevel", "error", "-i", str(src), "-vf", "fps=1,scale='min(1600,iw)':-2", "-frames:v", "300", str(video_dir / "%05d.jpg")], seconds=600)
            for video_frame in sorted(video_dir.glob("*.jpg")):
                video_frame.rename(destination / f"frame-{saved:05d}.jpg")
                saved += 1
            video_dir.rmdir()
    return saved


def train_splat(data_dir: Path, job_dir: Path) -> Path:
    """Adaptateur Nerfstudio : non exécuté dans les environnements sans GPU/outils."""
    for executable in ("colmap", "ns-process-data", "ns-train", "ns-export"):
        if not shutil.which(executable):
            raise RuntimeError(f"Outil GPU requis absent : {executable}")
    processed = job_dir / "processed"
    results = job_dir / "training"
    exported = job_dir / "exports"
    run(["ns-process-data", "images", "--data", str(data_dir), "--output-dir", str(processed)], 3600)
    run(["ns-train", "splatfacto", "--output-dir", str(results), "--data", str(processed), "--vis", "tensorboard"], settings.gpu_timeout_seconds)
    configs = sorted(results.rglob("config.yml"), key=lambda p: p.stat().st_mtime)
    if not configs:
        raise RuntimeError("Nerfstudio n'a produit aucun config.yml")
    run(["ns-export", "gaussian-splat", "--load-config", str(configs[-1]), "--output-dir", str(exported)], 3600)
    splats = list(exported.rglob("*.ply"))
    if not splats or not any(p.stat().st_size > 1000 for p in splats):
        raise RuntimeError("Nerfstudio n'a pas produit de splat .ply valide")
    return max(splats, key=lambda x: x.stat().st_size)


def process_one() -> bool:
    """Acquisition atomique d'un job; un worker local recommandé pour SQLite."""
    with SessionLocal() as db:
        job = db.query(Job).filter(Job.status == "queued").order_by(Job.created_at).first()
        if job is None:
            return False
        acquired = db.execute(update(Job).where(Job.id == job.id, Job.status == "queued").values(status="running", stage="preprocessing"))
        db.commit()
        if not acquired.rowcount:
            return True
        job = db.get(Job, job.id)
        project = db.get(Project, job.project_id)
        if not project:
            mark(db, job, "failed", "failed", "Projet supprimé")
            return True
        workspace = private_path(f"{project.id}/jobs/{job.id}")
        frames = workspace / "frames"
        try:
            count = preprocess(db.query(Asset).filter(Asset.project_id == project.id).all(), frames)
            job.frame_count = count
            if count < 8:
                mark(db, job, "needs_media", "quality_check", f"{count} vues obtenues ; 8 minimum pour tenter l'alignement")
                return True
            if not settings.enable_gpu:
                mark(db, job, "waiting_gpu", "gpu_required", "Prétraitement terminé. Worker GPU non activé ; aucune reconstruction effectuée.")
                return True
            mark(db, job, "running", "reconstruction")
            splat = train_splat(frames, workspace)
            target = private_path(f"{project.id}/jobs/{job.id}/scene.ply")
            shutil.copyfile(splat, target)
            job.artifact_key = f"{project.id}/jobs/{job.id}/scene.ply"
            mark(db, job, "completed", "export_ready")
        except (OSError, RuntimeError, subprocess.TimeoutExpired, ValueError) as exc:
            logger.exception("Échec job %s", job.id)
            mark(db, job, "failed", "failed", str(exc)[:600])
    return True


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--once", action="store_true")
    parser.add_argument("--recover", action="store_true", help="Signaler les travaux interrompus ; un seul worker autorisé")
    args = parser.parse_args()
    logging.basicConfig(level=logging.INFO)
    init_db()
    if args.recover:
        with SessionLocal() as db:
            from sqlalchemy import update
            changed = db.execute(update(Job).where(Job.status == "running").values(status="failed", stage="failed", error="Worker interrompu ; relance nécessaire")).rowcount
            db.commit()
            logger.info("Jobs interrompus signalés : %s", changed)
    if args.once:
        process_one()
        return
    while True:
        if not process_one():
            time.sleep(3)


if __name__ == "__main__":
    main()
