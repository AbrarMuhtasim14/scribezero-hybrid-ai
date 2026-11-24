import React from 'react'
import {
  ShieldCheck,
  Wifi,
  WifiOff,
  PlusCircle,
  History,
  FileText,
  ChevronDown,
  Stethoscope
} from 'lucide-react'
import { CLINICAL_CASES } from '../data/clinicalCases'

export default function Navbar({
  activeCaseId,
  onSelectCase,
  isOfflineSimulated,
  onToggleOffline,
  onNewEncounter,
  activeTab,
  setActiveTab,
  encounterCount = 0,
  isProcessing = false
}) {
  return (
    <header className="bg-navy-900/90 backdrop-blur-md border-b border-slate-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand & Mission Badge */}
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-teal-500 to-emerald-400 p-0.5 flex items-center justify-center shadow-lg shadow-teal-500/20">
              <div className="h-full w-full bg-navy-950 rounded-[10px] flex items-center justify-center">
                <ShieldCheck className="h-5 w-5 text-teal-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg text-white tracking-tight flex items-center gap-1.5">
                  Scribe<span className="text-teal-400">Zero</span>
                </span>
                <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-400 border border-teal-500/20">
                  Zero-PHI-Egress Hybrid AI
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Pre-Scrubbed Hybrid Clinical Scribe & Cloud Billing Intelligence
              </p>
            </div>
          </div>

          {/* Clinical Case Quick Loader Dropdown */}
          <div className="hidden md:flex items-center gap-2">
            <label className="text-xs text-slate-400 font-medium flex items-center gap-1">
              <Stethoscope className="w-3.5 h-3.5 text-teal-400" />
              Case Study:
            </label>
            <div className="relative">
              <select
                value={activeCaseId || ''}
                onChange={(e) => onSelectCase(e.target.value)}
                disabled={isProcessing}
                className="bg-navy-800 border border-slate-700 text-xs text-slate-200 rounded-lg px-3 py-1.5 pr-8 focus:outline-none focus:border-teal-500 appearance-none cursor-pointer transition hover:border-slate-600 disabled:opacity-50"
              >
                <option value="">-- Blank Clinical Encounter --</option>
                {CLINICAL_CASES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.specialty.split('/')[0]} • {c.title}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Action Controls & Offline Circuit Breaker */}
          <div className="flex items-center gap-3">
            <button
              onClick={onToggleOffline}
              type="button"
              title={
                isOfflineSimulated
                  ? 'Restore cloud connectivity'
                  : 'Cut cloud connectivity (Offline guard)'
              }
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
                isOfflineSimulated
                  ? 'bg-rose-500/15 border-rose-500/40 text-rose-300 shadow-sm shadow-rose-900/30 animate-pulse'
                  : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
              }`}
            >
              {isOfflineSimulated ? (
                <>
                  <WifiOff className="w-3.5 h-3.5 text-rose-400" />
                  <span>Wi-Fi: Disconnected (Offline Mode)</span>
                </>
              ) : (
                <>
                  <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Wi-Fi: Online</span>
                </>
              )}
            </button>

            {/* Nav Tabs: Scribe vs Encounters */}
            <div className="bg-navy-800/80 p-0.5 rounded-lg border border-slate-700/80 flex items-center">
              <button
                onClick={() => setActiveTab('scribe')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition ${
                  activeTab === 'scribe'
                    ? 'bg-teal-500 text-slate-950 font-semibold shadow'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Active Scribe</span>
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition ${
                  activeTab === 'history'
                    ? 'bg-teal-500 text-slate-950 font-semibold shadow'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <History className="w-3.5 h-3.5" />
                <span>Encounters</span>
                {encounterCount > 0 && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      activeTab === 'history'
                        ? 'bg-slate-950 text-teal-400'
                        : 'bg-slate-700 text-slate-200'
                    }`}
                  >
                    {encounterCount}
                  </span>
                )}
              </button>
            </div>

            {/* New Encounter Button */}
            <button
              onClick={onNewEncounter}
              disabled={isProcessing}
              className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-medium rounded-lg transition disabled:opacity-50"
              title="Reset encounter workspace"
            >
              <PlusCircle className="w-3.5 h-3.5 text-teal-400" />
              <span>New Patient</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}
