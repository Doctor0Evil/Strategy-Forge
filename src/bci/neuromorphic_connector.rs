// Neuromorphic / BCI connector for Strategy-Forge
// FILE: src/bci/neuromorphic_connector.rs

use std::time::Duration;
use std::io;
use std::sync::Arc;

/// Minimal EEG/BCI sample frame in decoded form.
#[derive(Clone, Debug)]
pub struct EegSample {
    pub channel_index: u16,
    pub timestamp_ns: u64,
    pub microvolts: f32,
}

/// High-level events emitted to Strategy-Forge.
#[derive(Clone, Debug)]
pub enum BciEvent {
    Connected { unique_id: String },
    Disconnected { reason: String },
    SignalFrame(Vec<EegSample>),
    Error(String),
}

/// Trait for any platform-specific adapter (Windows, Linux, custom neuromorphic bus).
pub trait BciAdapter: Send + Sync {
    fn start_stream(&self) -> io::Result<()>;
    fn stop_stream(&self) -> io::Result<()>;
    fn poll_events(&self, timeout: Duration) -> io::Result<Vec<BciEvent>>;
}

/// Windows10 disk-class based connector metadata.
#[derive(Clone, Debug)]
pub struct Win10DiskBasedBciConfig {
    pub pnp_class_guid: String,
    pub instance_suffix: String,
    pub kernel_device_path: String,
    pub require_unique_id: bool,
}

/// High-level connector object Strategy-Forge will use.
pub struct BciConnector {
    adapter: Arc<dyn BciAdapter>,
}

impl BciConnector {
    pub fn new(adapter: Arc<dyn BciAdapter>) -> Self {
        Self { adapter }
    }

    pub fn start(&self) -> io::Result<()> {
        self.adapter.start_stream()
    }

    pub fn stop(&self) -> io::Result<()> {
        self.adapter.stop_stream()
    }

    pub fn next_events(&self, timeout_ms: u64) -> io::Result<Vec<BciEvent>> {
        self.adapter.poll_events(Duration::from_millis(timeout_ms))
    }
}
