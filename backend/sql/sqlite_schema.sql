CREATE TABLE IF NOT EXISTS game_state (
    user_id    TEXT PRIMARY KEY,
    resources  TEXT NOT NULL,
    units      TEXT NOT NULL,
    faction    TEXT,
    leaderboard TEXT NOT NULL,
    auctions   TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS errors (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id   TEXT,
    message   TEXT NOT NULL,
    timestamp TEXT DEFAULT (datetime('now'))
);
