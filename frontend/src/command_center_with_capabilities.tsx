import React, { useEffect, useState } from "react";
import {
  getClientCapabilityProfile,
  getRecommendedRenderingMode,
  createComplianceEvent,
  hashComplianceEvent
} from "./strategyforge_client_capabilities";

export const CommandCenterWithCapabilities: React.FC = () => {
  const [profile, setProfile] = useState<any | null>(null);
  const [renderMode, setRenderMode] = useState<string>("detecting");
  const [complianceEvent, setComplianceEvent] = useState<any | null>(null);

  useEffect(() => {
    (async () => {
      const p = await getClientCapabilityProfile();
      setProfile(p);
      setRenderMode(getRecommendedRenderingMode(p));

      const baseEvent = createComplianceEvent({
        LawID: "Law[1.01]",
        FunctionName: "ClientCapabilityDiscovery",
        Operator: p.platform || "UnknownPlatform",
        AssetID: "StrategyForge-Client",
        EventType: "Audit",
        Enforcement: "Client Self-Assessment",
        Outcome: "Success",
        ComplianceResult: "Capabilities Recorded"
      });
      const sig = await hashComplianceEvent(baseEvent);
      const eventWithSig = { ...baseEvent, HashedSignature: sig };
      setComplianceEvent(eventWithSig);

      // Optional: POST to backend audit endpoint
      // fetch("/api/v1/compliance/log", {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify(eventWithSig)
      // }).catch(() => {});
    })();
  }, []);

  return (
    <div className="space-y-3">
      <div className="bg-slate-900/70 border border-slate-700 rounded-xl p-3 text-xs">
        <h2 className="text-sm font-semibold text-slate-200 mb-2">
          Client Capabilities
        </h2>
        {!profile ? (
          <p className="text-slate-500">Detecting capabilities…</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div>
              <h3 className="font-semibold text-cyan-300 mb-1">Graphics</h3>
              <ul className="space-y-0.5">
                <li>WebGL2: {profile.graphics.webgl2 ? "yes" : "no"}</li>
                <li>WebGPU: {profile.graphics.webgpu ? "yes" : "no"}</li>
                <li>OffscreenCanvas: {profile.graphics.offscreenCanvas ? "yes" : "no"}</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-emerald-300 mb-1">XR / ML</h3>
              <ul className="space-y-0.5">
                <li>WebXR: {profile.xr.webxr ? "yes" : "no"}</li>
                <li>XR Layers: {profile.xr.projectionLayers ? "yes" : "no"}</li>
                <li>WebNN: {profile.ml.webnn ? "yes" : "no"}</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-amber-300 mb-1">Privacy</h3>
              <ul className="space-y-0.5">
                <li>Partitioned Cookies: {profile.privacy.partitionedCookies ? "yes" : "no"}</li>
                <li>Storage Access API: {profile.privacy.storageAccessAPI ? "yes" : "no"}</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-fuchsia-300 mb-1">Form Factor</h3>
              <ul className="space-y-0.5">
                <li>Device Posture API: {profile.formFactor.devicePosture ? "yes" : "no"}</li>
                <li>Viewport Segments: {profile.formFactor.viewportSegments ? "yes" : "no"}</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-slate-200 mb-1">Rendering Mode</h3>
              <p className="text-slate-300">{renderMode}</p>
            </div>
          </div>
        )}
      </div>

      <div className="bg-slate-900/70 border border-slate-700 rounded-xl p-3 text-xs">
        <h2 className="text-sm font-semibold text-slate-200 mb-2">
          Compliance Event (Client)
        </h2>
        {!complianceEvent ? (
          <p className="text-slate-500">Preparing audit record…</p>
        ) : (
          <pre className="whitespace-pre-wrap break-all text-[11px] bg-slate-950/60 p-2 rounded border border-slate-800">
{JSON.stringify(complianceEvent, null, 2)}
          </pre>
        )}
      </div>
    </div>
  );
};
