CREATE TABLE IF NOT EXISTS neuromorphic_module (
    id                      UUID PRIMARY KEY,
    module_name             TEXT NOT NULL,
    module_type             TEXT NOT NULL, -- 'biodegradable_chipset','headset_interface','xr_bridge'
    substrate_material      TEXT NOT NULL,
    conductive_material     TEXT NOT NULL,
    encapsulation_material  TEXT NOT NULL,
    compatible_chipset      TEXT NOT NULL,
    max_power_mW            NUMERIC(8,3) NOT NULL,
    max_surface_temp_c      NUMERIC(5,2) NOT NULL,
    iso10993_5_cytotox      BOOLEAN NOT NULL,
    iso10993_10_sens        BOOLEAN NOT NULL,
    degradation_half_life_d NUMERIC(6,2) NOT NULL,
    full_resorption_days    NUMERIC(6,2) NOT NULL,
    immune_activation_score NUMERIC(4,2) NOT NULL,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bci_sampling_profile (
    id                      UUID PRIMARY KEY,
    profile_name            TEXT NOT NULL,
    eeg_channels            INTEGER NOT NULL,
    sample_rate_hz          INTEGER NOT NULL,
    window_ms               INTEGER NOT NULL,
    overlap_ms              INTEGER NOT NULL,
    max_latency_ms          NUMERIC(6,2) NOT NULL,
    max_packet_loss_pct     NUMERIC(5,2) NOT NULL,
    min_snr_db              NUMERIC(5,2) NOT NULL,
    xr_device_model         TEXT NOT NULL,
    chipset_model           TEXT NOT NULL
);
