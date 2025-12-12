use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Serialize, Deserialize)]
pub struct NanoswarmNodePerf {
    pub node_id: String,
    pub ops_threshold_tops: f32,          // e.g. 12.0 TOPS minimum
    pub mesh_size: u32,                   // QPU/accelerator mesh size
    pub thermal_headroom_c: f32,          // allowed delta to throttle
    pub snr_db: f32,                      // EEG SNR in dB
    pub median_latency_ms: f32,
    pub packet_loss_pct: f32,
    pub artifact_rate_pct: f32,
    pub eeg_channels_active: u8,
    pub did_issue_tps: f32,
    pub did_verify_tps: f32,
    pub vc_validity_pct: f32,
    pub topology_matrix: Vec<f32>,
    pub compliance_level: String,
    pub ai_firmware_version: String,
}

pub fn default_bci_xrphone_node() -> NanoswarmNodePerf {
    NanoswarmNodePerf {
        node_id: Uuid::new_v4().to_string(),
        ops_threshold_tops: 12.0,
        mesh_size: 32,
        thermal_headroom_c: 8.0,
        snr_db: 22.5,
        median_latency_ms: 30.0,
        packet_loss_pct: 1.0,
        artifact_rate_pct: 3.5,
        eeg_channels_active: 10,
        did_issue_tps: 20.0,
        did_verify_tps: 50.0,
        vc_validity_pct: 99.0,
        topology_matrix: vec![0.98,0.97,0.96,0.95,0.97,0.96,0.95,0.94],
        compliance_level: "surgical-grade".to_string(),
        ai_firmware_version: "ALN-BCI-XRPHONE-1.0.0".to_string(),
    }
}
