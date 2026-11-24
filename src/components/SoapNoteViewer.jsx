import React, { useState } from 'react'
import {
  FileText,
  ShieldCheck,
  Copy,
  Check,
  CloudLightning,
  Edit3,
  Lock,
  Sparkles,
  Activity,
  AlertCircle,
  Eye,
  EyeOff,
  Stethoscope
} from 'lucide-react'

export default function SoapNoteViewer({
  soapNote,
  setSoapNote,
  soapStats = null,
  soapError = null,
  sanitizedPreview = '',
  isGenerating,
  onFinalizeBilling,
  isBillingLoading,
  isOffline,
  billingCompleted
}) {
  const [copied, setCopied] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [showSanitizationPreview, setShowSanitizationPreview] = useState(true)

  const handleCopy = () => {
    if (!soapNote) return
    navigator.clipboard.writeText(soapNote)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Parse SOAP sections cleanly whether formatted as "# SUBJECTIVE" or "SUBJECTIVE:"
  const parseSections = (text) => {
    if (!text) return null
    const subjective = text
      .match(/(?:^|\n)\s*#*\s*\*{0,2}SUBJECTIVE\*{0,2}:?\s*(?:\n|$)([\s\S]*?)(?=(?:^|\n)\s*#*\s*\*{0,2}OBJECTIVE\*{0,2}:?\s*(?:\n|$)|$)/i)?.[1]
      ?.trim() || ''
    const objective = text
      .match(/(?:^|\n)\s*#*\s*\*{0,2}OBJECTIVE\*{0,2}:?\s*(?:\n|$)([\s\S]*?)(?=(?:^|\n)\s*#*\s*\*{0,2}ASSESSMENT\*{0,2}:?\s*(?:\n|$)|$)/i)?.[1]
      ?.trim() || ''
    const assessment = text
      .match(/(?:^|\n)\s*#*\s*\*{0,2}ASSESSMENT\*{0,2}:?\s*(?:\n|$)([\s\S]*?)(?=(?:^|\n)\s*#*\s*\*{0,2}PLAN\*{0,2}:?\s*(?:\n|$)|$)/i)?.[1]
      ?.trim() || ''
    const plan = text
      .match(/(?:^|\n)\s*#*\s*\*{0,2}PLAN\*{0,2}:?\s*(?:\n|$)([\s\S]*?)$/i)?.[1]
      ?.trim() || ''

    if (subjective || objective || assessment || plan) {
      return { subjective, objective, assessment, plan }
    }
    return null
  }

  const sections = parseSections(soapNote)

  // Highlight redacted tokens in sanitized view
  const renderHighlightedText = (content) => {
    if (!content) return <span className="text-slate-500 italic">No notes recorded yet.</span>

    if (!showSanitizationPreview) {
      return <div className="whitespace-pre-wrap leading-relaxed text-slate-200">{content}</div>
    }

    const parts = content.split(/(\[[A-Z0-9_\-\s]+\])/g)
    return (
      <div className="whitespace-pre-wrap leading-relaxed text-slate-200">
        {parts.map((part, index) => {
          if (part.startsWith('[') && part.endsWith(']')) {
            return (
              <span
                key={index}
                className="inline-flex items-center gap-1 mx-0.5 px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-mono text-xs font-semibold"
                title="Protected Health Information (PHI) scrubbed strictly locally before inference"
              >
                <Lock className="w-2.5 h-2.5" />
                {part}
              </span>
            )
          }
          return <span key={index}>{part}</span>
        })}
      </div>
    )
  }

  const badgeLabel = soapStats?.onDevice
    ? 'On-Device Executed (0 KB Egress)'
    : soapStats
    ? 'Pre-Scrubbed Hybrid Route'
    : 'PHI-Protected Output'

  const subtitleText = soapStats?.onDevice
    ? 'Synthesized locally on-device by Chrome Gemini Nano.'
    : soapStats
    ? `Raw PHI scrubbed locally first; formatted via ${soapStats.engine}.`
    : 'PII is redacted locally prior to Firebase AI Logic inference.'

  return (
    <div className="bg-navy-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-teal-500/10 text-teal-400 border border-teal-500/20">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white tracking-tight flex items-center gap-2">
              Clinical SOAP Note
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-400 border border-teal-500/20">
                {badgeLabel}
              </span>
            </h2>
            <p className="text-xs text-slate-400">{subtitleText}</p>
          </div>
        </div>

        {/* Controls: PII toggle, edit toggle, copy */}
        <div className="flex items-center gap-2">
          {soapNote && (
            <>
              <button
                onClick={() => setShowSanitizationPreview(!showSanitizationPreview)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition ${
                  showSanitizationPreview
                    ? 'bg-amber-500/15 border-amber-500/30 text-amber-300'
                    : 'bg-navy-950 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
                title="Highlight locally redacted PII tags"
              >
                {showSanitizationPreview ? (
                  <>
                    <Eye className="w-3.5 h-3.5 text-amber-400" />
                    <span>PHI Badges: ON</span>
                  </>
                ) : (
                  <>
                    <EyeOff className="w-3.5 h-3.5" />
                    <span>Raw Text</span>
                  </>
                )}
              </button>

              <button
                onClick={() => setIsEditing(!isEditing)}
                className={`p-1.5 rounded-lg border transition ${
                  isEditing
                    ? 'bg-teal-500/20 border-teal-500/40 text-teal-300'
                    : 'bg-navy-950 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
                title="Edit SOAP note"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={handleCopy}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-navy-950 border border-slate-800 text-slate-300 hover:text-white text-xs transition"
                title="Copy note to clipboard"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Note Content Area */}
      <div className="mt-4 flex-1 overflow-y-auto min-h-[300px] pr-1">
        {isGenerating && !soapNote && (
          <div className="h-full flex flex-col items-center justify-center p-8 text-center">
            <div className="relative mb-3">
              <Activity className="w-8 h-8 text-teal-400 animate-spin" />
              <Sparkles className="w-4 h-4 text-emerald-400 absolute -top-1 -right-1 animate-pulse" />
            </div>
            <p className="text-sm font-medium text-slate-200">
              Scrubbing PHI Locally & Running Hybrid AI...
            </p>
            <p className="text-xs text-slate-400 mt-1 max-w-sm">
              Using Firebase AI Logic (PREFER_ON_DEVICE). Raw identifiers never leave the browser.
            </p>
          </div>
        )}

        {!isGenerating && soapError && !soapNote && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-200 text-xs space-y-2">
              <div className="flex items-center gap-2 font-semibold text-rose-300">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>AI SOAP Synthesis Unavailable</span>
              </div>
              <p className="leading-relaxed">{soapError}</p>
            </div>

            {sanitizedPreview && (
              <div className="bg-navy-950/70 border border-slate-800 rounded-xl p-3.5">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-400 uppercase tracking-wider mb-2">
                  <Lock className="w-3.5 h-3.5" />
                  <span>Locally Sanitized Transcript (0 KB Network Egress)</span>
                </div>
                <div className="text-xs">{renderHighlightedText(sanitizedPreview)}</div>
              </div>
            )}
          </div>
        )}

        {!isGenerating && !soapError && !soapNote && (
          <div className="h-full flex flex-col items-center justify-center p-8 text-center border-2 border-dashed border-slate-800/80 rounded-xl">
            <Stethoscope className="w-10 h-10 text-slate-600 mb-3" />
            <p className="text-sm font-medium text-slate-300">No SOAP Note Generated Yet</p>
            <p className="text-xs text-slate-500 mt-1 max-w-md">
              Speak consultation into the microphone or load one of the clinical case studies, then click "Process SOAP Note (Hybrid AI)".
            </p>
          </div>
        )}

        {isEditing ? (
          <textarea
            value={soapNote}
            onChange={(e) => setSoapNote(e.target.value)}
            className="w-full h-full min-h-[300px] bg-navy-950 border border-slate-700 rounded-xl p-4 text-sm text-slate-100 font-sans focus:outline-none focus:border-teal-500 resize-none leading-relaxed"
          />
        ) : sections ? (
          <div className="space-y-4">
            {/* Subjective */}
            <div className="bg-navy-950/70 border border-slate-800 rounded-xl p-3.5">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-teal-400 uppercase tracking-wider mb-2">
                <span className="w-2 h-2 rounded-full bg-teal-400" />
                SUBJECTIVE (Chief Complaint & HPI)
              </div>
              <div className="text-xs sm:text-sm">{renderHighlightedText(sections.subjective)}</div>
            </div>

            {/* Objective */}
            <div className="bg-navy-950/70 border border-slate-800 rounded-xl p-3.5">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-teal-400 uppercase tracking-wider mb-2">
                <span className="w-2 h-2 rounded-full bg-teal-400" />
                OBJECTIVE (Vitals, Physical Exam & Diagnostics)
              </div>
              <div className="text-xs sm:text-sm">{renderHighlightedText(sections.objective)}</div>
            </div>

            {/* Assessment */}
            <div className="bg-navy-950/70 border border-slate-800 rounded-xl p-3.5">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-teal-400 uppercase tracking-wider mb-2">
                <span className="w-2 h-2 rounded-full bg-teal-400" />
                ASSESSMENT (Primary & Differential Diagnoses)
              </div>
              <div className="text-xs sm:text-sm">{renderHighlightedText(sections.assessment)}</div>
            </div>

            {/* Plan */}
            <div className="bg-navy-950/70 border border-slate-800 rounded-xl p-3.5">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-teal-400 uppercase tracking-wider mb-2">
                <span className="w-2 h-2 rounded-full bg-teal-400" />
                PLAN (Prescriptions, Diagnostics, Referrals & Follow-Up)
              </div>
              <div className="text-xs sm:text-sm">{renderHighlightedText(sections.plan)}</div>
            </div>
          </div>
        ) : soapNote ? (
          <div className="bg-navy-950/70 border border-slate-800 rounded-xl p-4 text-xs sm:text-sm">
            {renderHighlightedText(soapNote)}
          </div>
        ) : null}
      </div>

      {/* Cloud Handoff Footer Action */}
      {soapNote && (
        <div className="pt-4 mt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Ready for sanitized cloud cross-referencing</span>
          </div>

          <button
            onClick={onFinalizeBilling}
            disabled={isBillingLoading || isOffline || isGenerating}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-xs transition shadow-lg ${
              isOffline || isGenerating
                ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                : billingCompleted
                ? 'bg-slate-800 hover:bg-slate-700 border border-teal-500/40 text-teal-300'
                : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-cyan-500/20'
            }`}
          >
            {isGenerating ? (
              <>
                <Activity className="w-4 h-4 animate-spin text-slate-400" />
                <span>Waiting for SOAP Stream...</span>
              </>
            ) : isBillingLoading ? (
              <>
                <Activity className="w-4 h-4 animate-spin text-white" />
                <span>Cloud Gemini Coding...</span>
              </>
            ) : isOffline ? (
              <>
                <AlertCircle className="w-4 h-4 text-slate-500" />
                <span>Cloud Coding Disabled in Offline Mode</span>
              </>
            ) : (
              <>
                <CloudLightning className="w-4 h-4" />
                <span>
                  {billingCompleted ? 'Re-Code with Cloud Gemini' : 'Finalize & Cross-Reference Billing (Cloud)'}
                </span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  )
}
