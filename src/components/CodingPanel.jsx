import React from 'react'
import {
  CloudLightning,
  Tag,
  AlertTriangle,
  CheckCircle2,
  ShieldCheck,
  Save,
  Pill,
  Sparkles,
  DollarSign,
  AlertCircle,
  HardDrive
} from 'lucide-react'

export default function CodingPanel({
  billingData,
  billingError = null,
  isLoading,
  onSaveToFirestore,
  isSaving,
  savedDocId,
  savedSyncedToCloud = false,
  isOffline
}) {
  if (isLoading) {
    return (
      <div className="bg-navy-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col items-center justify-center min-h-[300px] text-center">
        <div className="relative mb-3">
          <CloudLightning className="w-10 h-10 text-cyan-400 animate-bounce" />
          <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-cyan-400 animate-ping" />
        </div>
        <h3 className="text-sm font-semibold text-slate-100">
          Firebase AI Logic: PREFER_IN_CLOUD
        </h3>
        <p className="text-xs text-slate-400 mt-1 max-w-sm">
          Cloud Gemini is analyzing the de-identified note for ICD-10 medical diagnostics, CPT billing codes, and pharmacology contraindications...
        </p>
        <div className="mt-4 flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-[11px] text-slate-300">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Secured via Firebase App Check</span>
        </div>
      </div>
    )
  }

  if (billingError && !billingData) {
    return (
      <div className="bg-navy-900 border border-rose-500/30 rounded-2xl p-6 shadow-xl flex flex-col items-center justify-center min-h-[260px] text-center">
        <AlertCircle className="w-10 h-10 text-rose-400 mb-3" />
        <h3 className="text-sm font-semibold text-rose-200">
          Cloud Medical Coding Failed
        </h3>
        <p className="text-xs text-rose-300/90 mt-1.5 max-w-md leading-relaxed">
          {billingError}
        </p>
      </div>
    )
  }

  if (!billingData) {
    return (
      <div className="bg-navy-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col items-center justify-center min-h-[300px] text-center border-2 border-dashed border-slate-800/80">
        <Tag className="w-10 h-10 text-slate-600 mb-3" />
        <h3 className="text-sm font-semibold text-slate-300">
          Cloud Coding & Pharmacology Intelligence
        </h3>
        <p className="text-xs text-slate-500 mt-1 max-w-sm">
          Once the sanitized SOAP note is reviewed, click "Finalize & Cross-Reference Billing" to execute cloud clinical coding and contraindication checks.
        </p>
      </div>
    )
  }

  const {
    icd10_codes = [],
    cpt_codes = [],
    drug_interactions = [],
    summary = '',
    clinical_summary = '',
    stats = null
  } = billingData
  const displaySummary = summary || clinical_summary
  const modelLabel = stats?.modelName || stats?.engine || 'Firebase AI Logic'

  return (
    <div className="bg-navy-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <CloudLightning className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white tracking-tight flex items-center gap-2">
              Cloud Medical Coding & Drug Safety
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                {modelLabel}
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Cross-referenced ICD-10-CM, CPT Evaluation & Management, and pharmacology alerts.
            </p>
          </div>
        </div>

        {/* Firestore Save Action */}
        <div className="flex items-center gap-2">
          {savedDocId ? (
            savedSyncedToCloud ? (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-mono font-medium">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Synced to Firestore: {savedDocId.slice(0, 8)}...</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-mono font-medium">
                <HardDrive className="w-4 h-4 text-amber-400" />
                <span>Saved Locally: {savedDocId.slice(0, 10)}...</span>
              </div>
            )
          ) : (
            <button
              onClick={onSaveToFirestore}
              disabled={isSaving || isOffline}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-semibold transition shadow-md shadow-teal-500/20 disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaving ? 'Syncing...' : 'Save Encounter (Firestore)'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Summary Box */}
      {displaySummary && (
        <div className="bg-navy-950/80 border border-slate-800 rounded-xl p-3.5 text-xs text-slate-300 leading-relaxed">
          <div className="text-[11px] font-semibold text-cyan-400 uppercase tracking-wider mb-1 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5" />
            Executive Clinical Summary
          </div>
          {displaySummary}
        </div>
      )}

      {/* Main Grid: ICD-10 & CPT Billing */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* ICD-10 Diagnoses */}
        <div className="bg-navy-950/60 border border-slate-800 rounded-xl p-3.5 flex flex-col">
          <div className="flex items-center justify-between mb-2.5 pb-2 border-b border-slate-800/80">
            <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-teal-400" />
              ICD-10-CM Diagnoses
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              {icd10_codes.length} mapped
            </span>
          </div>

          <div className="space-y-2 flex-1">
            {icd10_codes.length > 0 ? (
              icd10_codes.map((item, index) => (
                <div key={index} className="p-2.5 rounded-lg bg-navy-900 border border-slate-800/90 flex items-start justify-between gap-2">
                  <div>
                    <span className="font-mono text-xs font-bold text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded border border-teal-500/20">
                      {item.code}
                    </span>
                    <p className="text-xs text-slate-300 mt-1.5 leading-snug">
                      {item.description}
                    </p>
                  </div>
                  {item.confidence != null && (
                    <span className="text-[10px] text-slate-400 font-mono bg-slate-800 px-1.5 py-0.5 rounded shrink-0">
                      {(Number(item.confidence) * 100).toFixed(0)}%
                    </span>
                  )}
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-500 italic p-2">No ICD-10 codes returned.</p>
            )}
          </div>
        </div>

        {/* CPT Procedure Billing */}
        <div className="bg-navy-950/60 border border-slate-800 rounded-xl p-3.5 flex flex-col">
          <div className="flex items-center justify-between mb-2.5 pb-2 border-b border-slate-800/80">
            <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-cyan-400" />
              CPT Procedure & E/M Codes
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              {cpt_codes.length} recommended
            </span>
          </div>

          <div className="space-y-2 flex-1">
            {cpt_codes.length > 0 ? (
              cpt_codes.map((item, index) => (
                <div key={index} className="p-2.5 rounded-lg bg-navy-900 border border-slate-800/90 flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                        {item.code}
                      </span>
                      {item.level && (
                        <span className="text-[10px] text-cyan-300 font-medium">
                          {item.level}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-300 mt-1.5 leading-snug">
                      {item.description}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-500 italic p-2">No CPT codes returned.</p>
            )}
          </div>
        </div>
      </div>

      {/* Drug Interactions Safety Alert Section */}
      <div className="bg-navy-950/60 border border-slate-800 rounded-xl p-3.5">
        <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-800/80">
          <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
            <Pill className="w-3.5 h-3.5 text-amber-400" />
            Pharmacology Cross-Reference & Contraindications
          </span>
          <span className="text-[10px] font-mono text-amber-400">Safety Guardrail</span>
        </div>

        <div className="space-y-2">
          {drug_interactions.length > 0 ? (
            drug_interactions.map((alert, index) => {
              const isHigh =
                alert.severity?.toLowerCase() === 'high' ||
                alert.severity?.toLowerCase() === 'severe'
              const medsDisplay = Array.isArray(alert.medications)
                ? alert.medications.join(' + ')
                : alert.medications || 'Medication Notice'

              return (
                <div
                  key={index}
                  className={`p-3 rounded-lg border text-xs leading-relaxed ${
                    isHigh
                      ? 'bg-rose-500/10 border-rose-500/30 text-rose-200'
                      : 'bg-amber-500/10 border-amber-500/30 text-amber-200'
                  }`}
                >
                  <div className="flex items-center gap-2 font-semibold mb-1">
                    <AlertTriangle className={`w-3.5 h-3.5 ${isHigh ? 'text-rose-400' : 'text-amber-400'}`} />
                    <span>{medsDisplay}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded font-mono uppercase ${
                        isHigh ? 'bg-rose-500/20 text-rose-300' : 'bg-amber-500/20 text-amber-300'
                      }`}
                    >
                      {alert.severity || 'Caution'}
                    </span>
                  </div>
                  <p className="text-slate-300 text-[11px] pl-5">
                    {alert.warning || alert.description}
                  </p>
                </div>
              )
            })
          ) : (
            <div className="flex items-center gap-2 text-xs text-emerald-400/90 p-2 bg-emerald-500/5 rounded-lg border border-emerald-500/20">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>No severe drug-drug contraindications flagged for current regimen.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
