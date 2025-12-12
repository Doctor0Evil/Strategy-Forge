/**
 * StrategyForge ALN / Bit.Hub / Secure-Boot Chat Profile
 *
 * Destination: frontend/src/ai_strategyforge_aln_profile.js
 *
 * Purpose:
 *  - Encode stable, non-fictional system doctrines extracted from paste.txt:
 *      • Local-first asset economy (.bit-like) with classes: item, spell, avatar, lore, gear, badge.
 *      • Trades with auctions/gifting/barter and strict logging + parental controls.
 *      • Self-hosted, non-blockchain, non-EVM, no external cloud authority.
 *      • Compliance-focused secure boot / audit / AI orchestration patterns (Rust bootstrap snippet).
 *  - Provide:
 *      • buildSystemContextBlock() – injects system-level constraints around assets, trades, infra.
 *      • buildOpsContextBlock() – injects infra/CI/secure-boot expectations for ops conversations.
 *      • enrichPrompt(userText, options) – wraps a user message in this context.
 *
 * Notes:
 *  - This module does not include any vendor names or copyrighted text; it encodes
 *    only normalized, factual constraints and roles derived from the artifact.
 */

/**
 * Static profile derived from artifact, kept in plain data for auditability.
 */
const ALN_PROFILE = {
  assetEconomy: {
    portableAssetFormat: ".bit",
    assetClasses: ["item", "spell", "avatar", "lore", "gear", "badge"],
    storage: "local-first",
    network: ["P2P", "LAN", "portable-sync"],
    trading: {
      marketplace: true,
      gifting: true,
      barter: true,
      auctions: true,
      tradeLedger: "local-tamper-evident",
      parentalControls: true,
      matureContentHandling: "strict-flagging-tagging",
      auditability: "persistent-event-log"
    }
  },
  governance: {
    authority: "self-hosted-self-governed",
    externalIntegration: false,
    blockchain: false,
    evmVm: false,
    registry: "optional-portable-private-by-default"
  },
  roles: {
    architect: "designs world, asset taxonomy, and rules",
    copilot: "explains, audits, scaffolds, but does not override local authority",
    languageFounders: "provide core language semantics, not operational control"
  },
  secureBootPattern: {
    hardwareAttestation: true,
    dnaMfa: true,
    encryptedFilesystem: "quantum-512-like strong symmetric",
    auditLog: "real-time, append-only, user-auditable",
    complianceChecks: ["data-protection", "jurisdictional-privacy"],
    chainSync: "consensus-on-state-before-activation",
    aiModel: {
      name: "governed_core_model",
      maxContextTokens: 4_000_000,
      securityLevel: "high-assurance"
    },
    operationalLoop: [
      "accept_command",
      "validate_against_policy",
      "invoke_module",
      "log_event",
      "monitor_health"
    ]
  },
  cicdPatterns: {
    tools: ["git", "VSCode", "ALNCore", "ALN_Net"],
    workflows: [
      "auto-sync scripts to repo",
      "log sessions with timestamps",
      "bridge shell/PowerShell to ALN",
      "enforce compliance checks before deploy"
    ]
  }
};

/**
 * Build a system-economy context block for chat prompts.
 */
export function buildSystemContextBlock() {
  const a = ALN_PROFILE.assetEconomy;
  const g = ALN_PROFILE.governance;

  const lines = [];

  lines.push("[CONTEXT: STRATEGYFORGE ASSET ECONOMY]");
  lines.push(
    `Assets are treated as portable entries (format: ${a.portableAssetFormat}) in a local-first economy.`
  );
  lines.push(
    `Supported asset classes: ${a.assetClasses.join(", ")}.`
  );
  lines.push(
    `Networking focuses on ${a.network.join(", ")} with no dependence on external public blockchains or virtual machines.`
  );
  lines.push(
    "Trades (marketplace, gifting, barter, auctions) must be logged in a tamper-evident local ledger with persistent audit trails."
  );
  lines.push(
    "Parental controls and mature-content flags must be honored when generating or transforming assets."
  );
  lines.push("");
  lines.push("[GOVERNANCE CONSTRAINTS]");
  lines.push(
    `Authority is ${g.authority}; no external cloud or chain defines truth for this system.`
  );
  lines.push(
    "External integration, public blockchain deployment, and EVM-based execution are disabled unless explicitly re-architected."
  );

  return lines.join("\n");
}

/**
 * Build an ops/infra context block for chat prompts.
 */
export function buildOpsContextBlock() {
  const s = ALN_PROFILE.secureBootPattern;
  const lines = [];

  lines.push("[CONTEXT: SECURE BOOT / OPS DOCTRINE]");
  if (s.hardwareAttestation) {
    lines.push(
      "Any proposed automation that affects critical systems must assume hardware attestation at startup."
    );
  }
  if (s.dnaMfa) {
    lines.push(
      "User-level critical operations are gated by strong multi-factor authentication; never assume anonymous superuser access."
    );
  }
  lines.push(
    `Filesystems and stateful stores should be considered encrypted (e.g. ${s.encryptedFilesystem}-strength) and auditable.`
  );
  lines.push(
    "Real-time audit logs are mandatory; when suggesting commands, prefer idempotent, logged actions."
  );
  lines.push(
    "Compliance checks must pass before enabling high-risk features; highlight any assumption that would violate data-protection or jurisdictional privacy constraints."
  );
  lines.push(
    "The AI runtime is treated as a governed module that must log decisions and respect local policies."
  );
  lines.push("");
  lines.push("[CI/CD PRACTICES]");
  lines.push(
    "When proposing pipelines or scripts, prefer: explicit git steps, reproducible builds, and logged deployments with rollback plans."
  );

  return lines.join("\n");
}

/**
 * Enrich a user prompt with system + ops context.
 *
 * @param {string} userText
 * @param {{includeOps?:boolean}} options
 * @returns {string}
 */
export function enrichPromptWithALNProfile(userText, options = {}) {
  const includeOps = options.includeOps !== false;
  const blocks = [];

  blocks.push(buildSystemContextBlock());

  if (includeOps) {
    blocks.push("");
    blocks.push(buildOpsContextBlock());
  }

  blocks.push("");
  blocks.push("[ASSISTANT BEHAVIOR]");
  blocks.push(
    "- Treat the local asset economy and audit rules as canonical; do not suggest external chains or unlogged side channels."
  );
  blocks.push(
    "- For trading or asset operations, be explicit about logging, parental controls, and auditability."
  );
  blocks.push(
    "- For infrastructure or CI/CD questions, emphasize secure boot, attestation, and compliance checkpoints."
  );
  blocks.push("");
  blocks.push("[USER MESSAGE]");
  blocks.push(userText);

  return blocks.join("\n");
}
