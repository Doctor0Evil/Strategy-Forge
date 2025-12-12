package xrphone.bci.metrics

data class XrPhoneBciMetrics(
    val state: String,
    val eegSnrDb: Float,
    val artifactRatePct: Float,
    val medianLatencyMs: Float,
    val p99LatencyMs: Float,
    val packetLossPct: Float
) {
    fun toJson(): String {
        return """{
          "state":"$state",
          "eegSnrDb":$eegSnrDb,
          "artifactRatePct":$artifactRatePct,
          "medianLatencyMs":$medianLatencyMs,
          "p99LatencyMs":$p99LatencyMs,
          "packetLossPct":$packetLossPct
        }""".trimIndent()
    }
}
