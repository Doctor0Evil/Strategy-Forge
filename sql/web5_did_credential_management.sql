-- Web5-style DID registry for BCI/XR-phone identities
CREATE TABLE IF NOT EXISTS did_identity (
    id                  UUID PRIMARY KEY,
    did_uri             TEXT UNIQUE NOT NULL,
    public_key_jwk      JSONB NOT NULL,
    controller          TEXT NOT NULL,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    tpm_attested        BOOLEAN NOT NULL DEFAULT FALSE,
    tpm_quote_hash      BYTEA,
    tpm_quote_algo      TEXT,
    xr_device_model     TEXT NOT NULL,
    bci_board_model     TEXT NOT NULL,
    compliance_profile  TEXT NOT NULL
);

-- Permissionless, tokenless verifiable credentials bound to EEG/XR session
CREATE TABLE IF NOT EXISTS did_credential (
    id                  UUID PRIMARY KEY,
    subject_did         TEXT NOT NULL REFERENCES did_identity(did_uri),
    issuer_did          TEXT NOT NULL,
    vc_type             TEXT NOT NULL,
    vc_payload          JSONB NOT NULL,
    proof_jws           TEXT NOT NULL,
    issued_at           TIMESTAMPTZ NOT NULL,
    expires_at          TIMESTAMPTZ,
    session_eeg_hash    BYTEA NOT NULL,
    session_window_s    INTEGER NOT NULL,
    eeg_snr_db          NUMERIC(6,2) NOT NULL,
    packet_loss_pct     NUMERIC(5,2) NOT NULL,
    median_latency_ms   NUMERIC(6,2) NOT NULL,
    vc_status           TEXT NOT NULL CHECK (vc_status IN ('active','revoked','expired')),
    revocation_reason   TEXT,
    anchored_ledger_id  TEXT,
    anchored_tx_hash    BYTEA
);

-- Blood type table (for clinical profile linkage)
INSERT INTO blood_type (id, abo_group, rh_factor, is_universal_donor, is_universal_recipient, loinc_code, snomed_ct_code)
VALUES
('11111111-1111-4111-8111-111111111111','O','NEG', TRUE,  FALSE,'77397-8','278148006'),
('22222222-2222-4222-8222-222222222222','O','POS', FALSE, FALSE,'77397-8','278147001'),
('33333333-3333-4333-8333-333333333333','A','NEG', FALSE, FALSE,'77397-8','278152006'),
('44444444-4444-4444-8444-444444444444','A','POS', FALSE, FALSE,'77397-8','278149003'),
('55555555-5555-4555-8555-555555555555','B','NEG', FALSE, FALSE,'77397-8','278153001'),
('66666666-6666-4666-8666-666666666666','B','POS', FALSE, FALSE,'77397-8','278150003'),
('77777777-7777-4777-8777-777777777777','AB','NEG',FALSE, FALSE,'77397-8','278154007'),
('88888888-8888-4888-8888-888888888888','AB','POS',FALSE, TRUE, '77397-8','278151004')
ON CONFLICT (abo_group, rh_factor) DO NOTHING;
