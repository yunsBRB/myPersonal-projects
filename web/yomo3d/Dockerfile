FROM python:3.13-slim
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1
RUN apt-get update && apt-get install -y --no-install-recommends ffmpeg && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY yomo ./yomo
COPY templates ./templates
COPY static ./static
RUN useradd -u 10001 -m yomo && mkdir -p /app/data && chown -R yomo:yomo /app/data
USER yomo
EXPOSE 8000
CMD ["uvicorn", "yomo.app:app", "--host", "0.0.0.0", "--port", "8000"]
