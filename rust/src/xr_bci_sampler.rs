use serde::{Serialize, Deserialize};
use uuid::Uuid;
use std::time::{Instant, SystemTime, UNIX_EPOCH};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct BciSample {
    pub timestamp_unix_ns: u64,
    pub eeg: Vec<f32>,   // 16 channels
    pub emg: Vec<f32>,   // 4 channels
    pub eog: Vec<f32>,   // 2 channels
    pub ppg: Vec<f32>,   // 2 channels
    pub eda: Vec<f32>,   // 1 channel
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
        Self {
            config,
            session_id: Uuid::new_v4().to_string(),
            start_time: Instant::now(),
        }
    }

    /// Hardware driver injects real data here.
    pub fn acquire_window(&self) -> Vec<BciSample> {
        Vec::new()
    }

    pub fn compute_metrics(&self, window: &[BciSample], now_unix_ns: u64) -> SamplerMetrics {
        if window.is_empty() {
            return SamplerMetrics {
                session_id: self.session_id.clone(),
                state: "idle".into(),
                eeg_snr_db: 0.0,
                artifact_rate_pct: 0.0,
                median_latency_ms: 0.0,
                p99_latency_ms: 0.0,
                packet_loss_pct: 0.0,
            };
        }

        let mut latencies_ms = Vec::with_capacity(window.len());
        for s in window {
            let dt_ns = now_unix_ns.saturating_sub(s.timestamp_unix_ns);
            latencies_ms.push(dt_ns as f32 / 1_000_000.0);
        }
        latencies_ms.sort_by(|a, b| a.partial_cmp(b).unwrap());

        let median_idx = latencies_ms.len() / 2;
        let p99_idx = (latencies_ms.len() as f32 * 0.99).floor() as usize
            .min(latencies_ms.len().saturating_sub(1));

        // In a real system, SNR and artifact rates derive from filtered EEG and artifact masks.
        SamplerMetrics {
            session_id: self.session_id.clone(),
            state: "acquiring".into(),
            eeg_snr_db: 22.0,
            artifact_rate_pct: 3.0,
            median_latency_ms: latencies_ms[median_idx],
            p99_latency_ms: latencies_ms[p99_idx],
            packet_loss_pct: 1.0,
        }
    }

    pub fn now_unix_ns() -> u64 {
        SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_nanos() as u64
    }
}
