package xrphone.bci.bridge

import android.webkit.JavascriptInterface
import xrphone.bci.metrics.XrPhoneBciMetrics

class BciSamplerBridge(
    private val samplerController: SamplerController,
    private val metricsPublisher: (XrPhoneBciMetrics) -> Unit
) {

    @JavascriptInterface
    fun startSampling() {
        samplerController.start()
    }

    @JavascriptInterface
    fun stopSampling() {
        samplerController.stop()
    }

    fun onMetricsUpdated(metrics: XrPhoneBciMetrics) {
        metricsPublisher(metrics)
    }
}
