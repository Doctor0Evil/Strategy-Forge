/**
 * Strategy-Forge Core Utility Module
 *
 * FILE: 7527-bad5f-5c5ec2cf.js
 * PURPOSE:
 *   - Provide stable utility functions for:
 *       • Input validation (strings, numbers, arrays).
 *       • Deterministic hashing (for IDs and cache keys, non-crypto).
 *       • Simple event bus for in-browser coordination.
 *
 *   This module is framework-agnostic (no React/Vue/Node-only APIs)
 *   so it can be shared across browser, Node, and tooling builds.
 */

/* -----------------------------
 * Type-safe guards and checks
 * ----------------------------- */

/**
 * Check if value is a non-empty string after trimming whitespace.
 */
export function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

/**
 * Check if value is a finite number.
 */
export function isFiniteNumber(value) {
  return typeof value === "number" && Number.isFinite(value);
}

/**
 * Check if value is a non-empty array.
 */
export function isNonEmptyArray(value) {
  return Array.isArray(value) && value.length > 0;
}

/**
 * Safely clamp a number between min and max.
 */
export function clamp(value, min, max) {
  if (!isFiniteNumber(value) || !isFiniteNumber(min) || !isFiniteNumber(max)) {
    throw new Error("clamp: value, min, and max must be finite numbers");
  }
  if (min > max) {
    throw new Error("clamp: min cannot be greater than max");
  }
  return Math.min(max, Math.max(min, value));
}

/* -----------------------------
 * Deterministic, non-crypto hash
 * ----------------------------- */

/**
 * Simple deterministic hash for strings.
 * NOTE: This is NOT cryptographically secure; use only for IDs/cache keys.
 */
export function simpleHash(input) {
  if (!isNonEmptyString(input)) {
    return "0";
  }
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const chr = input.charCodeAt(i);
    hash = (hash << 5) - hash + chr;
    hash |= 0; // Convert to 32-bit integer
  }
  // Normalize to positive integer string
  return String(hash >>> 0);
}

/**
 * Build a stable key from mixed values (e.g. for maps/cache).
 */
export function buildStableKey(parts) {
  if (!Array.isArray(parts)) {
    throw new Error("buildStableKey: parts must be an array");
  }
  const normalized = parts.map((p) => {
    if (p === null || p === undefined) return "null";
    if (typeof p === "object") {
      return JSON.stringify(p);
    }
    return String(p);
  });
  return simpleHash(normalized.join("|"));
}

/* -----------------------------
 * Minimal event bus
 * ----------------------------- */

/**
 * Simple in-memory event bus for decoupled components.
 * Example:
 *   const bus = createEventBus();
 *   const unsub = bus.on("ready", (payload) => { ... });
 *   bus.emit("ready", { foo: 1 });
 *   unsub();
 */
export function createEventBus() {
  const listeners = new Map(); // eventName -> Set<fn>

  function on(eventName, handler) {
    if (!isNonEmptyString(eventName)) {
      throw new Error("EventBus.on: eventName must be a non-empty string");
    }
    if (typeof handler !== "function") {
      throw new Error("EventBus.on: handler must be a function");
    }
    let set = listeners.get(eventName);
    if (!set) {
      set = new Set();
      listeners.set(eventName, set);
    }
    set.add(handler);
    // Return unsubscribe
    return () => {
      set.delete(handler);
      if (set.size === 0) {
        listeners.delete(eventName);
      }
    };
  }

  function emit(eventName, payload) {
    const set = listeners.get(eventName);
    if (!set || set.size === 0) {
      return;
    }
    for (const handler of Array.from(set)) {
      try {
        handler(payload);
      } catch (err) {
        // Fail-safe: never let listeners crash the bus
        // eslint-disable-next-line no-console
        console.error("EventBus listener error:", err);
      }
    }
  }

  function clear() {
    listeners.clear();
  }

  return { on, emit, clear };
}
