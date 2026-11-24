import React, { useState } from 'react'
import {
  Database,
  Search,
  Trash2,
  FileText,
  Activity,
  Clock,
  User,
  ChevronRight
} from 'lucide-react'

export default function EncounterHistory({
  encounters = [],
  onSelectEncounter,
  onDeleteEncounter,
  isLoading = false,
  isOffline = false,
  firestoreConnected = false
}) {
  const [searchTerm, setSearchTerm] = useState('')

  const filteredEncounters = encounters.filter((enc) => {
    if (!searchTerm) return true
    const term = searchTerm.toLowerCase()
    const summaryMatch = (enc.summary || enc.clinical_summary || '').toLowerCase().includes(term)
    const soapMatch = (enc.soapNote || '').toLowerCase().includes(term)
    const codeMatch = enc.icd10_codes?.some(
      (c) =>
        c.code?.toLowerCase().includes(term) || c.description?.toLowerCase().includes(term)
    )
    const patientMatch = (enc.patient?.label || enc.patient?.name || '')
      .toLowerCase()
      .includes(term)
    return summaryMatch || soapMatch || codeMatch || patientMatch
  })

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Just now'
    try {
      if (timestamp.toDate) {
        return timestamp.toDate().toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
      }
      if (timestamp.seconds) {
        return new Date(timestamp.seconds * 1000).toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
      }
      return new Date(timestamp).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch (e) {
      return 'Recent'
    }
  }

  const streamHealthy = firestoreConnected && !isOffline

  return (
    <div className="bg-navy-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col h-full space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-teal-500/10 text-teal-400 border border-teal-500/20">
            <Database className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white tracking-tight flex items-center gap-2">
              Cloud Firestore Patient Encounters
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                  streamHealthy
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                }`}
              >
                {streamHealthy ? 'Live Synced' : 'Local Cache Mode'}
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              De-identified clinical records secured with Firebase App Check.
            </p>
          </div>
        </div>

        {/* Realtime Status Indicator */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800 border border-slate-700 text-xs text-slate-300">
          <span
            className={`w-2 h-2 rounded-full ${
              streamHealthy ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
            }`}
          />
          <span>{streamHealthy ? 'Firestore Stream: Active' : 'Firestore Stream: Paused'}</span>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Filter encounters by diagnosis, specialty, or ICD-10 code..."
          className="w-full bg-navy-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-teal-500 transition"
        />
      </div>

      {/* Encounters List */}
      <div className="flex-1 overflow-y-auto space-y-3 min-h-[300px] pr-1">
        {isLoading && (
          <div className="h-48 flex flex-col items-center justify-center text-slate-400 text-xs">
            <Activity className="w-6 h-6 animate-spin text-teal-400 mb-2" />
            <span>Fetching encounters from Cloud Firestore...</span>
          </div>
        )}

        {!isLoading && filteredEncounters.length === 0 && (
          <div className="h-48 flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-slate-800/80 rounded-xl">
            <FileText className="w-8 h-8 text-slate-600 mb-2" />
            <p className="text-xs font-semibold text-slate-300">No Patient Encounters Found</p>
            <p className="text-[11px] text-slate-500 mt-1 max-w-xs">
              {searchTerm
                ? 'No encounters match your search query.'
                : 'Generate a SOAP note and finalize billing to persist de-identified documentation to Firestore.'}
            </p>
          </div>
        )}

        {!isLoading &&
          filteredEncounters.map((enc) => (
            <div
              key={enc.id}
              className="p-4 rounded-xl bg-navy-950/70 border border-slate-800 hover:border-slate-700 transition group"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-xs text-slate-100 flex items-center gap-1">
                      <User className="w-3 h-3 text-teal-400" />
                      {enc.patient?.label || enc.patient?.name || 'De-Identified Patient'}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5" />
                      {formatDate(enc.createdAt)}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-teal-300 font-mono border border-slate-700">
                      ID: {String(enc.id).slice(0, 8)}
                    </span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-mono border ${
                        enc.syncedToCloud !== false
                          ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                          : 'bg-amber-500/10 text-amber-300 border-amber-500/20'
                      }`}
                    >
                      {enc.syncedToCloud !== false ? 'Cloud Synced' : 'Local Queue'}
                    </span>
                  </div>

                  {/* Summary snippet */}
                  <p className="text-xs text-slate-300 mt-2 leading-relaxed line-clamp-2">
                    {enc.summary || enc.clinical_summary || enc.soapNote?.slice(0, 140) + '...'}
                  </p>

                  {/* Badges: ICD-10 codes and actual engine metadata */}
                  <div className="flex flex-wrap items-center gap-1.5 mt-3">
                    {enc.icd10_codes?.slice(0, 3).map((code, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] font-mono px-2 py-0.5 rounded bg-teal-500/10 text-teal-300 border border-teal-500/20"
                      >
                        {code.code}
                      </span>
                    ))}
                    {enc.icd10_codes?.length > 3 && (
                      <span className="text-[10px] text-slate-500 font-mono">
                        +{enc.icd10_codes.length - 3} more
                      </span>
                    )}

                    <span className="ml-auto text-[10px] font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                      {enc.inferenceStats?.cloudEngine || 'Firebase AI Logic'}
                    </span>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => onSelectEncounter(enc)}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-teal-500 hover:text-slate-950 text-slate-300 transition"
                    title="Load encounter into active view"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  {onDeleteEncounter && (
                    <button
                      onClick={() => onDeleteEncounter(enc.id)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-500 hover:text-white text-slate-400 transition"
                      title="Delete encounter record"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
      </div>
    </div>
  )
}
