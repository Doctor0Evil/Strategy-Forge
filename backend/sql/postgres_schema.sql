CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS game_state (
    user_id    TEXT PRIMARY KEY,
    resources  JSONB NOT NULL,
    units      JSONB NOT NULL,
    faction    TEXT,
    leaderboard JSONB NOT NULL,
    auctions   JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS errors (
    id        BIGSERIAL PRIMARY KEY,
    user_id   TEXT,
    message   TEXT NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS rag_context (
    user_id   TEXT PRIMARY KEY,
    embedding VECTOR(384) NOT NULL,
    metadata  JSONB NOT NULL DEFAULT '{}'::JSONB
);
