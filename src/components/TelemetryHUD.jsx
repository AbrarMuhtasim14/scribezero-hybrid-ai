import React from 'react'
import {
  Zap,
  Cloud,
  ShieldCheck,
  ShieldAlert,
  Clock,
  ArrowUpRight,
  Database,
  Cpu,
  Lock,
  Radio
} from 'lucide-react'

export default function TelemetryHUD({
  activeEngine = 'Hybrid Router Standby',
  inferenceMode = 'PREFER_ON_DEVICE',
  inferenceSource = null,
  latencyMs = 0,
  egressBytes = 0,
  tokenCost = '$0.0000',
  appCheckVerified = false,
  appCheckMode = 'checking',
  isProcessing = false,
  isOffline = false,
  phiScrubbedCount = 0,
  modelCapabilities = null
}) {
  const ranOnDevice = inferenceSource === 'on_device'
  const ranInCloud = inferenceSource === 'in_cloud'
  const onDeviceReady = Boolean(modelCapabilities?.onDeviceAvailable)

  return (
    <div className="bg-navy-900 border border-slate-800 rounded-2xl p-4 shadow-xl relative overflow-hidden">
      {/* Dynamic ambient background glow */}
      <div
        className={`absolute -right-20 -top-20 w-64 h-64 rounded-full blur-3xl opacity-20 pointer-events-none transition-all duration-700 ${
          ranOnDevice ? 'bg-teal-500' : 'bg-cyan-500'
        }`}
      />

      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Cpu className={`w-4 h-4 ${ranOnDevice ? 'text-teal-400' : 'text-cyan-400'}`} />
            {isProcessing && (
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-teal-400 animate-ping" />
            )}
          </div>
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
            Hybrid Inference Telemetry & Egress Monitor
          </span>
        </div>

        {/* Real-time Status Badges */}
        <div className="flex flex-wrap items-center gap-2">
          {ranOnDevice ? (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-300 text-xs font-medium">
              <Zap className="w-3.5 h-3.5 text-teal-400 fill-teal-400" />
              <span>ON-DEVICE: {activeEngine}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse ml-1" />
            </div>
          ) : ranInCloud ? (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-medium">
              <Cloud className="w-3.5 h-3.5 text-cyan-400" />
              <span>CLOUD: {activeEngine}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse ml-1" />
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-300 text-xs font-medium">
              <Cpu className="w-3.5 h-3.5 text-teal-400" />
              <span>
                {isOffline
                  ? onDeviceReady
                    ? 'OFFLINE READY: Gemini Nano'
                    : 'OFFLINE: Local PII Scrub Ready'
                  : onDeviceReady
                  ? 'HYBRID READY: On-Device Nano Available'
                  : `HYBRID READY: ${activeEngine}`}
              </span>
            </div>
          )}

          {/* Genuine App Check Verification Status */}
          <div
            className="flex items-center gap-1 px-2 py-1 rounded-full bg-slate-800 border border-slate-700 text-[11px] text-slate-300"
            title={`App Check mode: ${appCheckMode}`}
          >
            {appCheckVerified ? (
              <>
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                <span className="hidden sm:inline">App Check:</span>
                <span className="text-emerald-400 font-medium">Verified</span>
              </>
            ) : (
              <>
                <ShieldAlert className="w-3 h-3 text-amber-400" />
                <span className="hidden sm:inline">App Check:</span>
                <span className="text-amber-400 font-medium">
                  {isOffline ? 'Offline' : appCheckMode === 'checking' ? 'Checking' : 'Unverified'}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Telemetry Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 pt-3">
        {/* Metric 1: Processing Latency */}
        <div className="bg-navy-950/60 border border-slate-800/80 rounded-xl p-2.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-[11px]">
            <span>Latency</span>
            <Clock className="w-3.5 h-3.5 text-slate-500" />
          </div>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-lg font-mono font-bold text-white tracking-tight">
              {latencyMs > 0 ? latencyMs : '--'}
            </span>
            <span className="text-xs text-slate-400 font-mono">ms</span>
          </div>
          <span className="text-[10px] text-teal-400/90 font-mono mt-0.5">
            {ranOnDevice
              ? 'Zero network hop'
              : ranInCloud
              ? 'Live Firebase AI Logic'
              : 'Measured on run'}
          </span>
        </div>

        {/* Metric 2: Measured Payload Network Egress */}
        <div
          className={`border rounded-xl p-2.5 flex flex-col justify-between transition-colors ${
            ranOnDevice || egressBytes === 0
              ? 'bg-teal-950/20 border-teal-500/30'
              : 'bg-navy-950/60 border-slate-800/80'
          }`}
        >
          <div className="flex items-center justify-between text-slate-400 text-[11px]">
            <span>Network Egress</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-slate-500" />
          </div>
          <div className="mt-1 flex items-baseline gap-1">
            <span
              className={`text-lg font-mono font-bold tracking-tight ${
                ranOnDevice || egressBytes === 0 ? 'text-teal-300' : 'text-slate-100'
              }`}
            >
              {ranOnDevice || egressBytes === 0 ? '0' : (egressBytes / 1024).toFixed(1)}
            </span>
            <span className="text-xs text-slate-400 font-mono">KB</span>
          </div>
          <span
            className={`text-[10px] font-mono mt-0.5 font-medium ${
              ranOnDevice || egressBytes === 0 ? 'text-teal-400' : 'text-cyan-400'
            }`}
          >
            {ranOnDevice
              ? 'Zero network egress'
              : egressBytes === 0
              ? '0 KB Raw PHI Sent'
              : 'De-identified payload only'}
          </span>
        </div>

        {/* Metric 3: Token Inference Cost */}
        <div className="bg-navy-950/60 border border-slate-800/80 rounded-xl p-2.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-[11px]">
            <span>Est. API Cost</span>
            <Radio className="w-3.5 h-3.5 text-slate-500" />
          </div>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-lg font-mono font-bold text-emerald-400 tracking-tight">
              {ranOnDevice ? '$0.0000' : tokenCost}
            </span>
          </div>
          <span className="text-[10px] text-slate-400 font-mono mt-0.5">
            {ranOnDevice ? '100% free on-device' : 'Free-tier Gemini AI Logic'}
          </span>
        </div>

        {/* Metric 4: Pre-Cloud PII Scrubbing */}
        <div className="bg-navy-950/60 border border-slate-800/80 rounded-xl p-2.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-[11px]">
            <span>PHI Scrubbed Locally</span>
            <Lock className="w-3.5 h-3.5 text-amber-400/80" />
          </div>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-lg font-mono font-bold text-amber-300 tracking-tight">
              {phiScrubbedCount > 0 ? phiScrubbedCount : 'Ready'}
            </span>
          </div>
          <span className="text-[10px] text-slate-400 font-mono mt-0.5">
            Scrubbed before cloud call
          </span>
        </div>

        {/* Metric 5: Honest Architecture Route & InferenceSource */}
        <div className="col-span-2 md:col-span-1 bg-navy-950/60 border border-slate-800/80 rounded-xl p-2.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-[11px]">
            <span>Hybrid Route</span>
            <Database className="w-3.5 h-3.5 text-slate-500" />
          </div>
          <div className="mt-1">
            <span className="text-xs font-mono font-semibold text-slate-200">
              {inferenceSource
                ? `Source: ${inferenceSource.toUpperCase()}`
                : `Mode: ${inferenceMode.toUpperCase()}`}
            </span>
          </div>
          <span className="text-[10px] text-slate-400 font-mono mt-0.5 truncate">
            {isOffline
              ? onDeviceReady
                ? 'Offline (Nano Ready)'
                : 'Offline (Cloud Paused)'
              : onDeviceReady
              ? 'Nano + Cloud Fallback'
              : 'Nano absent -> Cloud'}
          </span>
        </div>
      </div>
    </div>
  )
}
