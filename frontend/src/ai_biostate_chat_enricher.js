/**
 * StrategyForge BioState → AI Chat Enricher
 *
 * Destination: frontend/src/ai_biostate_chat_enricher.js
 *
 * Purpose:
 * - Consume normalized biometric indices derived from raw Galea/OpenBCI data:
 *   arousal_index, cognitive_load_index, blink_rate_hz, heart_rate_bpm,
 *   stress_index, focus_index.
 * - Maintain a rolling window of states with exponential smoothing.
 * - Provide:
 *    - buildAugmentedPrompt(userText) → enriched prompt context for the LLM.
 *    - getUiRecommendations() → deterministic UI hints (e.g. slow mode).
 *    - getTelemetrySnapshot() → anonymized, dimensionless metrics for logging.
 *
 * Assumptions:
 * - A backend service reads the OpenBCI raw stream, computes indices per window,
 *   and pushes JSON messages over WebSocket/Socket.IO:
 *
 *     {
 *       type: "biostate",
 *       user_id: "<pseudonymous-id>",
 *       payload: {
 *         arousal_index: 0.0–1.0,
 *         cognitive_load_index: 0.0–1.0,
 *         blink_rate_hz: 0.0–4.0,
 *         heart_rate_bpm: 40–180,
 *         stress_index: 0.0–1.0,
 *         focus_index: 0.0–1.0
 *       }
 *     }
 *
 * - No raw EEG/EMG/EOG/PPG/EDA samples are handled here; this module only
 *   deals with bounded, non-identifiable metrics.
 */

export class BioStateChatEnricher {
  constructor(options = {}) {
    this.alpha = typeof options.alpha === "number" ? options.alpha : 0.25; // smoothing factor
    this.windowSize = options.windowSize || 60; // seconds for trends
    this._state = {
      arousal_index: 0.0,
      cognitive_load_index: 0.0,
      blink_rate_hz: 0.0,
      heart_rate_bpm: 70.0,
      stress_index: 0.0,
      focus_index: 0.0
    };
    this._history = [];
    this._lastUpdateTs = 0;
  }

  /**
   * Ingest a new bio-state payload.
   * @param {Object} payload
   */
  ingest(payload) {
    const ts = Date.now();
    const clamped = this._clampPayload(payload);

    // Exponential smoothing for each metric.
    Object.keys(this._state).forEach((k) => {
      const prev = this._state[k];
      const next = clamped[k];
      this._state[k] = this.alpha * next + (1 - this.alpha) * prev;
    });

    // History for simple trend analysis.
    this._history.push({ ts, ...this._state });
    this._lastUpdateTs = ts;
    this._trimHistory();
  }

  /**
   * Build an augmented prompt for the AI chat backend.
   * This does not expose raw data, only a qualitative summary.
   * @param {string} userText
   * @returns {string}
   */
  buildAugmentedPrompt(userText) {
    const summary = this._buildQualitativeSummary();
    const contextBlock = [
      "[CONTEXT: USER NEUROPHYSIOLOGICAL STATE]",
      `Arousal: ${summary.arousal_level}`,
      `Cognitive load: ${summary.cognitive_load_level}`,
      `Stress: ${summary.stress_level}`,
      `Focus: ${summary.focus_level}`,
      `Interaction mode: ${summary.recommended_mode}`,
      "",
      "[INSTRUCTIONS TO ASSISTANT]",
      "1. Maintain medically safe, calming language when stress or arousal are elevated.",
      "2. Avoid rapid topic shifts when cognitive load is high; use concise, clear steps.",
      "3. If focus is low, structure responses with short bullet points and explicit headings.",
      "",
      "[USER MESSAGE]"
    ].join("\n");

    return `${contextBlock}\n${userText}`;
  }

  /**
   * Recommend UI adaptations: slow mode, highlight key actions, etc.
   * @returns {{slowMode:boolean,highlightKeyActions:boolean,showBreathingHint:boolean,maxTokens:number}}
   */
  getUiRecommendations() {
    const { arousal_index, cognitive_load_index, stress_index } = this._state;

    const slowMode = stress_index > 0.7 || arousal_index > 0.75;
    const highlightKeyActions = cognitive_load_index > 0.6;
    const showBreathingHint = stress_index > 0.8;

    // Bound LLM output length based on cognitive load and stress.
    let maxTokens = 600;
    if (cognitive_load_index > 0.7 || stress_index > 0.7) {
      maxTokens = 250;
    } else if (cognitive_load_index > 0.5) {
      maxTokens = 400;
    }

    return {
      slowMode,
      highlightKeyActions,
      showBreathingHint,
      maxTokens
    };
  }

  /**
   * Get current smoothed state for telemetry/logging.
   * @returns {{state:Object,lastUpdateMs:number}}
   */
  getTelemetrySnapshot() {
    return {
      state: { ...this._state },
      lastUpdateMs: this._lastUpdateTs
    };
  }

  // ----------------- Internal helpers -----------------

  _clampPayload(payload) {
    return {
      arousal_index: this._clamp(payload.arousal_index, 0.0, 1.0),
      cognitive_load_index: this._clamp(payload.cognitive_load_index, 0.0, 1.0),
      blink_rate_hz: this._clamp(payload.blink_rate_hz, 0.0, 4.0),
      heart_rate_bpm: this._clamp(payload.heart_rate_bpm, 40.0, 180.0),
      stress_index: this._clamp(payload.stress_index, 0.0, 1.0),
      focus_index: this._clamp(payload.focus_index, 0.0, 1.0)
    };
  }

  _clamp(value, min, max) {
    const v = typeof value === "number" && Number.isFinite(value) ? value : min;
    return Math.min(Math.max(v, min), max);
  }

  _trimHistory() {
    const cutoff = Date.now() - this.windowSize * 1000;
    this._history = this._history.filter((entry) => entry.ts >= cutoff);
  }

  _buildQualitativeSummary() {
    const s = this._state;
    return {
      arousal_level: this._bucket(s.arousal_index, ["low", "moderate", "high"]),
      cognitive_load_level: this._bucket(s.cognitive_load_index, ["low", "moderate", "high"]),
      stress_level: this._bucket(s.stress_index, ["low", "moderate", "high"]),
      focus_level: this._bucket(s.focus_index, ["low", "moderate", "high"]),
      recommended_mode: this._recommendMode()
    };
  }

  _bucket(x, labels) {
    if (x < 0.33) return labels[0];
    if (x < 0.66) return labels[1];
    return labels[2];
  }

  _recommendMode() {
    const { arousal_index, stress_index, cognitive_load_index, focus_index } = this._state;
    if (stress_index > 0.8 || arousal_index > 0.8) {
      return "calming-short";
    }
    if (cognitive_load_index > 0.7 && focus_index < 0.5) {
      return "step-by-step";
    }
    if (focus_index > 0.7 && cognitive_load_index < 0.5) {
      return "high-detail";
    }
    return "balanced";
  }
}
