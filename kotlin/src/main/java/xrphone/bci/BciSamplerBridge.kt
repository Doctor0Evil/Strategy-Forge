package xrphone.bci

import android.webkit.JavascriptInterface
import xrphone.bci.metrics.XrPhoneBciMetrics

interface SamplerController {
    fun start()
    fun stop()
}

class BciSamplerBridge(
    private val controller: SamplerController,
    private val jsEmitter: (String) -> Unit
) {

    @JavascriptInterface
    fun startSampling() {
        controller.start()
    }

    @JavascriptInterface
    fun stopSampling() {
        controller.stop()
    }

    fun publishMetrics(metrics: XrPhoneBciMetrics) {
        val payload = """window.onBciSamplerMetricsUpdate(${metrics.toJson()});"""
        jsEmitter(payload)
    }
}
