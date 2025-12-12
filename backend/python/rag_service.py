from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer
import os
import psycopg
from pgvector.psycopg import register_vector

DB_HOST = os.getenv("POSTGRES_HOST", "postgres")
DB_PORT = int(os.getenv("POSTGRES_PORT", "5432"))
DB_NAME = os.getenv("POSTGRES_DB", "strategyforge")
DB_USER = os.getenv("POSTGRES_USER", "strategyforge")
DB_PASS = os.getenv("POSTGRES_PASSWORD", "")

app = FastAPI(title="StrategyForge RAG Service")

model = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")

class EmbedRequest(BaseModel):
    user_id: str

class EmbedResponse(BaseModel):
    user_id: str
    embedding_dim: int

def get_conn():
    conn = psycopg.connect(
        host=DB_HOST,
        port=DB_PORT,
        dbname=DB_NAME,
        user=DB_USER,
        password=DB_PASS,
        autocommit=True,
    )
    register_vector(conn)
    return conn

@app.post("/embed", response_model=EmbedResponse)
def embed(req: EmbedRequest):
    if not req.user_id or len(req.user_id) < 3 or len(req.user_id) > 128:
        raise HTTPException(status_code=400, detail="Invalid user_id")
    text = f"strategyforge-user:{req.user_id}"
    vec = model.encode([text])[0]
    dim = len(vec)
    if dim != 384:
        raise HTTPException(status_code=500, detail="Unexpected embedding dimension")

    conn = get_conn()
    with conn.cursor() as cur:
        cur.execute(
            """
            INSERT INTO rag_context (user_id, embedding, metadata)
            VALUES (%s, %s, %s)
            ON CONFLICT (user_id) DO UPDATE SET
              embedding = EXCLUDED.embedding,
              metadata  = EXCLUDED.metadata
            """,
            (req.user_id, vec.tolist(), {"source": "rag_service", "model": "all-MiniLM-L6-v2"}),
        )
    conn.close()

    return EmbedResponse(user_id=req.user_id, embedding_dim=dim)
