FROM python:3.11-slim

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

COPY requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

COPY rag_service.py /app/rag_service.py
COPY game_analytics.py /app/game_analytics.py
COPY did_client.py /app/did_client.py

ENV POSTGRES_HOST=postgres
ENV POSTGRES_PORT=5432
ENV POSTGRES_DB=strategyforge
ENV POSTGRES_USER=strategyforge
ENV POSTGRES_PASSWORD=

EXPOSE 8001

CMD ["uvicorn", "rag_service:app", "--host", "0.0.0.0", "--port", "8001"]
