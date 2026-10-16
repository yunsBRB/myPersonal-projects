import hashlib
import json
import re
import shutil
import subprocess
from pathlib import Path
from typing import BinaryIO
from fastapi import HTTPException, UploadFile
from PIL import Image, UnidentifiedImageError
from .config import settings

MIME_EXT = {"JPEG": ("image/jpeg", ".jpg"), "PNG": ("image/png", ".png"), "WEBP": ("image/webp", ".webp")}
VIDEO_FORMATS = {"mov", "mp4", "matroska,webm"}


def safe_name(name: str | None) -> str:
    if not name:
        return "media"
    base = name.replace("\\", "/").rsplit("/", 1)[-1]
    return re.sub(r"[^\w. -]", "_", base)[:180] or "media"


def private_path(storage_key: str) -> Path:
    root = settings.storage_dir.resolve()
    candidate = (root / storage_key).resolve()
    if not candidate.is_relative_to(root):
        raise ValueError("Chemin de stockage invalide")
    return candidate


def inspect_file(file_path: Path, filename: str) -> tuple[str, str, str]:
    """Retourne kind, MIME et extension après inspection des octets."""
    try:
        with Image.open(file_path) as im:
            fmt = im.format
            im.verify()
        if fmt in MIME_EXT:
            with Image.open(file_path) as im:
                w, h = im.size
            if w < 320 or h < 240 or w * h > 80_000_000:
                raise HTTPException(422, "Photo trop petite ou résolution excessive")
            return "image", *MIME_EXT[fmt]
    except (UnidentifiedImageError, OSError, ValueError, Image.DecompressionBombError):
        pass

    try:
        p = subprocess.run(
            ["ffprobe", "-v", "error", "-show_entries", "format=format_name,duration:stream=codec_type,width,height", "-of", "json", str(file_path)],
            capture_output=True, text=True, timeout=20, check=True,
        )
        info = json.loads(p.stdout)
        fmt = info.get("format", {}).get("format_name", "")
        videos = [s for s in info.get("streams", []) if s.get("codec_type") == "video"]
        duration = float(info.get("format", {}).get("duration", 0))
        if videos and 0 < duration <= 300 and any(x in fmt.split(",") for x in ("mov", "mp4", "webm", "matroska")):
            mime_ext = ("video/webm", ".webm") if "webm" in fmt or filename.lower().endswith(".webm") else ("video/mp4", ".mp4")
            return "video", *mime_ext
    except (FileNotFoundError, subprocess.CalledProcessError, subprocess.TimeoutExpired, ValueError, json.JSONDecodeError):
        pass
    raise HTTPException(415, "Média non pris en charge : JPEG, PNG, WebP, MP4/MOV ou WebM valide")


async def receive_upload(file: UploadFile, destination: Path) -> tuple[int, str, str, str, str]:
    """Stream borné vers un fichier temporaire, inspection avant déplacement définitif."""
    temp = destination.with_suffix(".upload")
    temp.parent.mkdir(parents=True, exist_ok=True)
    size = 0
    digest = hashlib.sha256()
    max_size = max(settings.max_image_mb, settings.max_video_mb) * 1024 * 1024
    try:
        with temp.open("wb") as stream:
            while block := await file.read(1024 * 1024):
                size += len(block)
                if size > max_size:
                    raise HTTPException(413, "Fichier trop volumineux")
                stream.write(block)
                digest.update(block)
        if not size:
            raise HTTPException(422, "Fichier vide")
        kind, mime, extension = inspect_file(temp, file.filename or "")
        allowed = (settings.max_image_mb if kind == "image" else settings.max_video_mb) * 1024 * 1024
        if size > allowed:
            raise HTTPException(413, "Limite de taille dépassée pour ce format")
        final = destination.with_suffix(extension)
        temp.replace(final)
        return size, digest.hexdigest(), kind, mime, final.name
    finally:
        temp.unlink(missing_ok=True)
        await file.close()


def delete_project_files(project_id: str):
    root = private_path(project_id)
    if root.is_dir():
        shutil.rmtree(root)
