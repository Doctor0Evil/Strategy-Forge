/**
 * StrategyForge Hardware Health & Anchorage Telemetry
 *
 * Destination: frontend/src/strategyforge_hardware_bridge.ts
 *
 * Purpose:
 *  - Transform low-level hardware/OS events into:
 *      • Health classification (OK / FAULT).
 *      • Recommended action (monitor / escalate / candidate_for_anchorage).
 *      • Optional Web5 anchorage request message (pure metadata, no keys).
 *
 * This is an operationally realistic bridge: it does NOT perform Web3/Web5
 * transitions itself, it only prepares the data and recommended actions.
 */

/** Generic hardware event as seen by StrategyForge. */
export interface HardwareEvent {
  /** Provider / subsystem, e.g. "Kernel-PnP" */
  provider: string;
  /** Event identifier, e.g. 410 */
  eventId: number;
  /** Hostname or logical terminal name */
  terminal: string;
  /** Unique device identifier (e.g. PnP instance path) */
  deviceId: string;
  /** Driver that handled this event */
  driverName: string;
  /** Hex status code, 0x0 for success */
  statusHex: string;
  /** Raw payload for audit/debugging (sanitized before logging) */
  raw?: unknown;
}

/** Health classification result. */
export type HardwareHealthStatus = "OK" | "FAULT" | "UNKNOWN";

/** What StrategyForge should do next. */
export type HardwareRecommendedAction =
  | "monitor"
  | "escalate"
  | "candidate_for_anchorage";

/** Normalized interpretation of a hardware event. */
export interface HardwareEventInterpretation {
  health: HardwareHealthStatus;
  recommendedAction: HardwareRecommendedAction;
  message: string;
}

/** Web5 anchorage request payload (to hand off to a backend). */
export interface AnchorageRequest {
  hardwareId: string;
  terminal: string;
  driverName: string;
  riskScore: number; // 0.0–1.0, lower is safer
  reason: string;
  timestamp: string;
}

/**
 * Parse a low-level event object into a HardwareEvent.
 * Defensive: tolerates missing fields and returns UNKNOWN when insufficient.
 */
export function parseHardwareEvent(input: any): HardwareEvent | null {
  if (!input || typeof input !== "object") return null;

  const provider = String(input.provider || input.Provider || "");
  const eventId = Number(input.eventId || input.EventID || 0);
  const terminal = String(input.terminal || input.Computer || "");
  const deviceId = String(input.deviceId || input.DeviceInstanceId || "");
  const driverName = String(input.driverName || input.DriverName || "");
  const statusHex = String(input.statusHex || input.Status || "0x0");

  if (!provider || !terminal || !deviceId || !driverName) {
    return null;
  }

  return {
    provider,
    eventId,
    terminal,
    deviceId,
    driverName,
    statusHex,
    raw: input
  };
}

/**
 * Interpret hardware status into a health classification and recommended action.
 * - 0x0          → OK, candidate_for_anchorage
 * - non-zero     → FAULT, escalate
 * - unparsable   → UNKNOWN, monitor
 */
export function interpretHardwareEvent(event: HardwareEvent): HardwareEventInterpretation {
  const normalizedStatus = event.statusHex.toLowerCase().trim();

  // Simple status parsing (0x0 = success).
  const isSuccess =
    normalizedStatus === "0x0" ||
    normalizedStatus === "0" ||
    normalizedStatus === "success";

  if (isSuccess) {
    return {
      health: "OK",
      recommendedAction: "candidate_for_anchorage",
      message:
        `Device ${event.deviceId} on ${event.terminal} started successfully with driver ${event.driverName}.`
    };
  }

  // Try to parse hex as number to classify severity (optional).
  let numeric = 0;
  try {
    const clean = normalizedStatus.replace(/^0x/i, "");
    numeric = parseInt(clean, 16);
  } catch {
    // ignore
  }

  const severe = numeric !== 0 && numeric > 0x100;

  return {
    health: "FAULT",
    recommendedAction: severe ? "escalate" : "monitor",
    message:
      `Device ${event.deviceId} on ${event.terminal} reported status ${event.statusHex}; ` +
      (severe ? "treat as critical fault." : "monitor for recurrence.")
  };
}

/**
 * Compute a simple risk score for using this hardware event as a root of trust.
 * Lower is safer; this is purely heuristic and non-cryptographic.
 */
export function computeAnchorageRisk(event: HardwareEvent): number {
  const base = 0.2; // baseline risk

  // Penalize unknown providers.
  let risk = base;
  if (!event.provider.toLowerCase().includes("kernel")) {
    risk += 0.2;
  }

  // Penalize non-success status.
  const normalizedStatus = event.statusHex.toLowerCase().trim();
  const isSuccess =
    normalizedStatus === "0x0" ||
    normalizedStatus === "0" ||
    normalizedStatus === "success";
  if (!isSuccess) {
    risk += 0.4;
  }

  // Mild bonus if driver is audio/endpoint (stable subsystem in most clients).
  if (event.driverName.toLowerCase().includes("audio")) {
    risk -= 0.05;
  }

  // Clamp to [0, 1].
  return Math.min(1, Math.max(0, risk));
}

/**
 * Prepare an anchorage request payload (no keys, no on-chain behavior).
 * Return null if health is not OK or risk is too high.
 */
export function buildAnchorageRequest(
  event: HardwareEvent,
  interpretation: HardwareEventInterpretation,
  maxRiskThreshold: number = 0.5
): AnchorageRequest | null {
  if (interpretation.health !== "OK") return null;
  const risk = computeAnchorageRisk(event);
  if (risk > maxRiskThreshold) return null;

  return {
    hardwareId: event.deviceId,
    terminal: event.terminal,
    driverName: event.driverName,
    riskScore: risk,
    reason: "Stable hardware event used as root-of-trust candidate.",
    timestamp: new Date().toISOString()
  };
}
