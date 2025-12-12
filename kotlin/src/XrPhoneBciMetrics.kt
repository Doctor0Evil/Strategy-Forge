package xrphone.bci.metrics

data class XrPhoneBciMetrics(
    val sessionId: String,
    val didUri: String,
    val eegSnrDb: Double,
    val packetLossPct: Double,
    val medianLatencyMs: Double,
    val p99LatencyMs: Double,
    val artifactRatePct: Double,
    val eegChannelsActive: Int,
    val didIssueTps: Double,
    val didVerifyTps: Double,
    val vcValidityPct: Double,
    val opsThresholdTops: Double,
    val meshSize: Int,
    val thermalHeadroomC: Double,
    val complianceLevel: String,
    val aiFirmwareVersion: String,
    val hexProfile: String
)
