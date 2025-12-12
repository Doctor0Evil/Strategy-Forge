use serde::{Serialize, Deserialize};
use uuid::Uuid;
use std::time::{Instant, SystemTime};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct BciSample {
    pub timestamp_unix_ns: u64,
    pub eeg: Vec<f32>,   // length = eeg_channels
    pub emg: Vec<f32>,   // length = 4
    pub eog: Vec<f32>,   // length = 2
    pub ppg: Vec<f32>,   // length = 2
    pub eda: Vec<f32>,   // length = 1
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct SamplerMetrics {
    pub session_id: String,
    pub state: String,
    pub eeg_snr_db: f32,
    pub artifact_rate_pct: f32,
    pub median_latency_ms: f32,
    pub p99_latency_ms: f32,
    pub packet_loss_pct: f32,
}

pub struct XrBciSamplerConfig {
    pub eeg_channels: usize,
    pub sample_rate_hz: u32,
    pub window_ms: u32,
    pub overlap_ms: u32,
    pub max_latency_ms: f32,
}

pub struct XrBciSampler {
    pub config: XrBciSamplerConfig,
    pub session_id: String,
    start_time: Instant,
}

impl XrBciSampler {
    pub fn new(config: XrBciSamplerConfig) -> Self {
        XrBciSampler {
            config,
            session_id: Uuid::new_v4().to_string(),
            start_time: Instant::now(),
        }
    }

    // Hook to actual XR-phone + BCI hardware driver
    pub fn acquire_window(&self) -> Vec<BciSample> {
        // In production, this calls the MT6883 + headset driver.
        // Here only the type and flow are defined; no random behavior is used.
        Vec::new()
    }

    pub fn compute_metrics(&self, window: &[BciSample]) -> SamplerMetrics {
        // Placeholder deterministic metrics; in deployment, compute from window.
        SamplerMetrics {
            session_id: self.session_id.clone(),
            state: "acquiring".to_string(),
            eeg_snr_db: 22.5,
            artifact_rate_pct: 3.5,
            median_latency_ms: 30.0,
            p99_latency_ms: 55.0,
            packet_loss_pct: 1.0,
        }
    }

    pub fn now_unix_ns() -> u64 {
        SystemTime::now()
            .duration_since(SystemTime::UNIX_EPOCH)
            .unwrap()
            .as_nanos() as u64
    }
}
