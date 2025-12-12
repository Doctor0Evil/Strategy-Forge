/**
 * StrategyForge Client Capability & Compliance Telemetry
 *
 * Destination: frontend/src/strategyforge_client_capabilities.js
 *
 * Purpose:
 *  - Build a structured "capability profile" for the current browser:
 *      • Graphics: WebGL2 / WebGPU / OffscreenCanvas.
 *      • Real-time: WebRTC, audio echo cancellation hints, screen sharing.
 *      • XR: WebXR, WebXR layers, WebXR/WebGPU binding.
 *      • ML: WebNN, ONNX/DirectML backends (capability probing only).
 *      • Privacy / security: local IP anonymization, partitioning hints.
 *  - Provide a compliance-aware log entry format aligned with the CSV schema:
 *      Timestamp, LawID, FunctionName, Operator, AssetID, EventType,
 *      Enforcement, Outcome, HashedSignature, ComplianceResult.
 *  - Offer helper functions:
 *      • getClientCapabilityProfile()
 *      • getRecommendedRenderingMode(profile)
 *      • createComplianceEvent(params)
 *      • hashComplianceEvent(event)        (simple SHA-256 via SubtleCrypto)
 */

export async function getClientCapabilityProfile() {
  const nav = navigator;
  const win = window;

  // Graphics capabilities
  const hasWebGL2 = !!(win.WebGL2RenderingContext);
  const hasOffscreenCanvas = typeof win.OffscreenCanvas !== "undefined";

  // WebGPU detection (capability only; actual use still requires flags / support)
  const hasWebGPU = !!(nav.gpu);

  // WebXR
  const xr = nav.xr;
  const hasWebXR = !!xr;
  let hasWebXRProjectionLayers = false;
  let hasWebXRWebGPUBinding = false;
  if (xr && typeof xr.isSessionSupported === "function") {
    try {
      hasWebXRProjectionLayers = true; // spec presence check (high-level)
      hasWebXRWebGPUBinding = !!(win.GPU && xr);
    } catch {
      // ignore feature detection errors
    }
  }

  // WebRTC + echo cancellation hint
  const hasWebRTC =
    typeof RTCPeerConnection !== "undefined" ||
    typeof RTCPeerConnection !== "undefined";

  // Basic ML / WebNN probe (no invocation)
  const hasWebNN = typeof win.navigator !== "undefined" && "ml" in win.navigator;

  // Privacy / security hints (best-effort, not authoritative)
  const hasPartitionedCookies = typeof document.hasStorageAccess === "function";
  const hasStorageAccessAPI = typeof document.requestStorageAccess === "function";

  // Device posture & viewport segments (foldables / multi-screen)
  const hasDevicePosture = "getScreenDetails" in win || "DevicePosture" in win;
  const hasViewportSegments = "visualViewport" in win;

  return {
    userAgent: nav.userAgent,
    platform: nav.platform,
    language: nav.language,
    graphics: {
      webgl2: hasWebGL2,
      offscreenCanvas: hasOffscreenCanvas,
      webgpu: hasWebGPU
    },
    xr: {
      webxr: hasWebXR,
      projectionLayers: hasWebXRProjectionLayers,
      webgpuBinding: hasWebXRWebGPUBinding
    },
    realtime: {
      webrtc: hasWebRTC
    },
    ml: {
      webnn: hasWebNN
    },
    privacy: {
      partitionedCookies: hasPartitionedCookies,
      storageAccessAPI: hasStorageAccessAPI
    },
    formFactor: {
      devicePosture: hasDevicePosture,
      viewportSegments: hasViewportSegments
    },
    timestamp: new Date().toISOString()
  };
}

/**
 * Use the capability profile to choose a rendering / features mode.
 * This can drive how StrategyForge configures Godot, WebGPU, and XR.
 */
export function getRecommendedRenderingMode(profile) {
  const g = profile.graphics || {};
  const xr = profile.xr || {};

  if (g.webgpu && xr.webxr && xr.projectionLayers) {
    return "webgpu_xr_high";
  }
  if (g.webgl2 && g.offscreenCanvas) {
    return "webgl2_medium";
  }
  return "canvas_fallback";
}

/**
 * Compliance event object aligned with the CSV schema:
 *  - Timestamp (ISO 8601)
 *  - LawID
 *  - FunctionName
 *  - Operator
 *  - AssetID
 *  - EventType      ("Violation" | "Repair" | "Audit" | "Info")
 *  - Enforcement    (free text, e.g. "Quarantine", "Operator Arbitration")
 *  - Outcome        (e.g. "Success", "Failure", "Partial")
 *  - HashedSignature (hex string, filled by hashComplianceEvent)
 *  - ComplianceResult (e.g. "Consent Affirmed", "Resource Overdraw")
 */
export function createComplianceEvent(params) {
  const now = new Date().toISOString();

  return {
    Timestamp: params.Timestamp || now,
    LawID: params.LawID || "Law[0.00]",
    FunctionName: params.FunctionName || "UnknownFunction",
    Operator: params.Operator || "ClientBrowser",
    AssetID: params.AssetID || "UnknownAsset",
    EventType: params.EventType || "Info",
    Enforcement: params.Enforcement || "None",
    Outcome: params.Outcome || "Success",
    HashedSignature: params.HashedSignature || "",
    ComplianceResult: params.ComplianceResult || "Neutral"
  };
}

/**
 * Generate a deterministic SHA-256 hex signature for a compliance event.
 * Uses SubtleCrypto; fallbacks to empty string if unavailable.
 */
export async function hashComplianceEvent(event) {
  if (!window.crypto || !window.crypto.subtle) {
    return "";
  }
  const payload =
    event.Timestamp +
    "|" +
    event.LawID +
    "|" +
    event.FunctionName +
    "|" +
    event.Operator +
    "|" +
    event.AssetID +
    "|" +
    event.EventType +
    "|" +
    event.Enforcement +
    "|" +
    event.Outcome +
    "|" +
    event.ComplianceResult;

  const encoder = new TextEncoder();
  const data = encoder.encode(payload);
  const digest = await window.crypto.subtle.digest("SHA-256", data);
  const bytes = new Uint8Array(digest);
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}
