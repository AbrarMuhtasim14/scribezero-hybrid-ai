import React, { useState, useEffect } from 'react'
import Navbar from './components/Navbar'
import TelemetryHUD from './components/TelemetryHUD'
import DictationConsole from './components/DictationConsole'
import SoapNoteViewer from './components/SoapNoteViewer'
import CodingPanel from './components/CodingPanel'
import EncounterHistory from './components/EncounterHistory'
import { CLINICAL_CASES } from './data/clinicalCases'
import { isFirebaseConfigured } from './services/firebase'
import { scrubLocalPII, buildSanitizedPatientMetadata } from './services/piiScrubber'
import {
  streamLocalSOAPNote,
  generateBillingAndInteractions,
  checkModelCapabilities
} from './services/aiLogic'
import {
  saveEncounter,
  subscribeEncounters,
  deleteEncounter
} from './services/firestoreService'

export default function App() {
  // Navigation & View State
  const [activeTab, setActiveTab] = useState('scribe') // 'scribe' | 'history'
  const [activeCaseId, setActiveCaseId] = useState(CLINICAL_CASES[0].id)
  const [isOfflineSimulated, setIsOfflineSimulated] = useState(false)
  const [isBrowserOnline, setIsBrowserOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  )

  const isOffline = isOfflineSimulated || !isBrowserOnline

  // Clinical Consultation & Scribe State
  const [transcript, setTranscript] = useState(CLINICAL_CASES[0].rawTranscript)
  const [soapNote, setSoapNote] = useState('')
  const [soapStats, setSoapStats] = useState(null)
  const [soapError, setSoapError] = useState(null)
  const [sanitizedPreview, setSanitizedPreview] = useState('')
  const [isProcessingSOAP, setIsProcessingSOAP] = useState(false)

  // Cloud Billing & Coding State
  const [billingData, setBillingData] = useState(null)
  const [billingError, setBillingError] = useState(null)
  const [isBillingLoading, setIsBillingLoading] = useState(false)
  const [savedDocId, setSavedDocId] = useState(null)
  const [savedSyncedToCloud, setSavedSyncedToCloud] = useState(false)
  const [isSavingEncounter, setIsSavingEncounter] = useState(false)

  // Capabilities & Real-Time Telemetry HUD State
  const [modelCapabilities, setModelCapabilities] = useState(null)
  const [activeEngine, setActiveEngine] = useState('Hybrid Router Standby')
  const [inferenceMode, setInferenceMode] = useState('PREFER_ON_DEVICE')
  const [inferenceSource, setInferenceSource] = useState(null) // 'on_device' | 'in_cloud' | null
  const [latencyMs, setLatencyMs] = useState(0)
  const [egressBytes, setEgressBytes] = useState(0)
  const [tokenCost, setTokenCost] = useState('$0.0000')
  const [phiScrubbedCount, setPhiScrubbedCount] = useState(0)
  const [appCheckVerified, setAppCheckVerified] = useState(false)
  const [appCheckMode, setAppCheckMode] = useState('checking')

  // Encounters Database State
  const [encounters, setEncounters] = useState([])
  const [isLoadingEncounters, setIsLoadingEncounters] = useState(true)
  const [firestoreConnected, setFirestoreConnected] = useState(false)

  // Track real browser online/offline transitions
  useEffect(() => {
    const handleOnline = () => setIsBrowserOnline(true)
    const handleOffline = () => setIsBrowserOnline(false)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Probe real browser Nano availability & App Check status (never downloads local models)
  useEffect(() => {
    let active = true
    checkModelCapabilities(isOffline).then((caps) => {
      if (!active) return
      setModelCapabilities(caps)
      setAppCheckVerified(Boolean(caps.appCheckVerified))
      setAppCheckMode(caps.appCheckMode || 'unconfigured')
      if (!soapNote && !billingData) {
        setActiveEngine(caps.deviceEngine)
      }
    })
    return () => {
      active = false
    }
  }, [isOffline])

  // Real-time Firestore subscription
  useEffect(() => {
    let unsubscribe = () => {}
    try {
      unsubscribe = subscribeEncounters(
        (data) => {
          setEncounters(data || [])
          setIsLoadingEncounters(false)
        },
        (error) => {
          console.warn('Firestore subscription notice (offline or cache):', error)
          setIsLoadingEncounters(false)
        },
        (connected) => {
          setFirestoreConnected(connected)
        }
      )
    } catch (err) {
      console.warn('Firestore subscription init warning:', err)
      setIsLoadingEncounters(false)
    }

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe()
    }
  }, [])

  const activeCase = CLINICAL_CASES.find((c) => c.id === activeCaseId) || null

  // Load selected scenario
  const handleSelectCase = (caseId) => {
    setActiveCaseId(caseId)
    setSoapNote('')
    setSoapStats(null)
    setSoapError(null)
    setSanitizedPreview('')
    setBillingData(null)
    setBillingError(null)
    setSavedDocId(null)
    setSavedSyncedToCloud(false)
    setLatencyMs(0)
    setEgressBytes(0)
    setTokenCost('$0.0000')
    setPhiScrubbedCount(0)
    setInferenceSource(null)

    if (!caseId) {
      setTranscript('')
      return
    }

    const selected = CLINICAL_CASES.find((c) => c.id === caseId)
    if (selected) {
      setTranscript(selected.rawTranscript)
    }
  }

  // Action: Generate SOAP Note via Firebase AI Logic Hybrid Router (Pre-Scrubbed Locally)
  const handleGenerateSOAP = async () => {
    if (!transcript.trim()) return

    setIsProcessingSOAP(true)
    setSoapNote('')
    setSoapStats(null)
    setSoapError(null)
    setSanitizedPreview('')
    setBillingData(null)
    setBillingError(null)
    setSavedDocId(null)
    setSavedSyncedToCloud(false)
    setInferenceMode('PREFER_ON_DEVICE')
    setInferenceSource(null)
    setLatencyMs(0)
    setEgressBytes(0)
    setTokenCost('$0.0000')

    const startTime = performance.now()

    try {
      let accumulated = ''
      const result = await streamLocalSOAPNote(
        transcript,
        (chunk, fullText) => {
          accumulated = fullText
          setSoapNote(fullText)
        },
        {
          isOffline,
          knownPatient: activeCase?.patient || null,
          onScrubbed: ({ scrubbedCount, sanitizedTranscript }) => {
            setPhiScrubbedCount(scrubbedCount)
            setSanitizedPreview(sanitizedTranscript)
          }
        }
      )

      const finalLatency = Math.round(performance.now() - startTime)
      const stats = result?.stats || {}

      if (result?.text && !accumulated) {
        setSoapNote(result.text)
      }
      setSoapStats(stats)
      setSanitizedPreview(result?.sanitizedTranscript || '')
      setActiveEngine(stats.engine || 'Firebase AI Logic')
      setInferenceMode(stats.mode || 'PREFER_ON_DEVICE')
      setInferenceSource(stats.inferenceSource || null)
      setLatencyMs(stats.latencyMs || finalLatency)
      setEgressBytes(stats.egressBytes ?? 0)
      setTokenCost(stats.estimatedCost || '$0.0000')
      setPhiScrubbedCount(stats.phiScrubbedCount ?? 0)
      if (typeof stats.appCheckVerified === 'boolean') {
        setAppCheckVerified(stats.appCheckVerified)
      }
    } catch (err) {
      console.error('SOAP note generation failed:', err)
      setSoapError(err.message || 'Inference engine unavailable')
      if (err.sanitizedTranscript) {
        setSanitizedPreview(err.sanitizedTranscript)
      }
      if (typeof err.scrubbedCount === 'number') {
        setPhiScrubbedCount(err.scrubbedCount)
      }
      setLatencyMs(Math.round(performance.now() - startTime))
      setEgressBytes(0)
      setTokenCost('$0.0000')
      setInferenceSource(null)
      setActiveEngine(err.isOfflineBlocked ? 'Offline (Local PII Scrub Only)' : 'AI Request Failed')
    } finally {
      setIsProcessingSOAP(false)
    }
  }

  // Action: Finalize & Cross-Reference Billing with Cloud Gemini via Firebase AI Logic
  const handleFinalizeBilling = async () => {
    if (!soapNote || isOffline) return

    setIsBillingLoading(true)
    setBillingError(null)
    setInferenceMode('PREFER_IN_CLOUD')

    const startTime = performance.now()

    try {
      const data = await generateBillingAndInteractions(soapNote, {
        isOffline,
        knownPatient: activeCase?.patient || null
      })
      const finalLatency = Math.round(performance.now() - startTime)
      const stats = data?.stats || {}

      setBillingData(data)
      setActiveEngine(stats.engine || 'Firebase AI Logic Cloud')
      setInferenceMode(stats.mode || 'PREFER_IN_CLOUD')
      setInferenceSource(stats.inferenceSource || 'in_cloud')
      setLatencyMs(stats.latencyMs || finalLatency)
      setEgressBytes(stats.egressBytes ?? 0)
      setTokenCost(stats.estimatedCost || '$0.0001')
      if (typeof stats.appCheckVerified === 'boolean') {
        setAppCheckVerified(stats.appCheckVerified)
      }

      // Automatically persist strictly de-identified encounter to Firestore
      await handleSaveToFirestore(data)
    } catch (err) {
      console.error('Cloud billing coding error:', err)
      setBillingData(null)
      setBillingError(err.message || 'Cloud model inference failed.')
      setActiveEngine('Cloud Coding Failed')
    } finally {
      setIsBillingLoading(false)
    }
  }

  // Action: Save Strictly De-Identified Encounter to Cloud Firestore
  const handleSaveToFirestore = async (dataToSave = billingData) => {
    if (!soapNote) return

    setIsSavingEncounter(true)

    // Guarantee zero raw PHI ever enters Cloud Firestore
    const soapScrub = scrubLocalPII(soapNote, activeCase?.patient || null)
    const sanitizedPatient = buildSanitizedPatientMetadata(activeCase)
    const cleanSummaryScrub = scrubLocalPII(
      dataToSave?.clinical_summary || dataToSave?.summary || '',
      activeCase?.patient || null
    )

    const encounterPayload = {
      icd10_codes: dataToSave?.icd10_codes || [],
      cpt_codes: dataToSave?.cpt_codes || [],
      drug_interactions: dataToSave?.drug_interactions || [],
      clinical_summary: cleanSummaryScrub.sanitizedText,
      soapNote: soapScrub.sanitizedText,
      patient: sanitizedPatient,
      createdAt: new Date().toISOString(),
      inferenceStats: {
        soapEngine: soapStats?.engine || activeEngine,
        soapSource: soapStats?.inferenceSource || inferenceSource || 'unknown',
        cloudEngine: dataToSave?.stats?.engine || 'Pending',
        cloudSource: dataToSave?.stats?.inferenceSource || 'none',
        mode: isOffline ? 'OFFLINE_QUEUED' : 'HYBRID',
        appCheckVerified,
        preCloudScrubbed: true
      }
    }

    try {
      const result = await saveEncounter(encounterPayload, { isOffline })
      const savedId = result?.id || result
      setSavedDocId(savedId)
      setSavedSyncedToCloud(Boolean(result?.syncedToCloud))
      setEncounters((prev) => [result, ...prev.filter((e) => e.id !== savedId)])
    } catch (err) {
      console.error('Failed to save encounter to Firestore:', err)
    } finally {
      setIsSavingEncounter(false)
    }
  }

  // Load an existing encounter from history
  const handleSelectEncounter = (enc) => {
    setSoapNote(enc.soapNote || '')
    setSoapStats(enc.inferenceStats ? { engine: enc.inferenceStats.soapEngine, inferenceSource: enc.inferenceStats.soapSource, onDevice: enc.inferenceStats.soapSource === 'on_device' } : null)
    setSoapError(null)
    setBillingData(enc)
    setBillingError(null)
    setSavedDocId(enc.id)
    setSavedSyncedToCloud(Boolean(enc.syncedToCloud))
    setActiveTab('scribe')
  }

  // Delete an encounter
  const handleDeleteEncounter = async (id) => {
    try {
      await deleteEncounter(id)
      setEncounters((prev) => prev.filter((e) => e.id !== id))
    } catch (err) {
      console.error('Failed to delete encounter:', err)
    }
  }

  // New Encounter Reset
  const handleNewEncounter = () => {
    handleSelectCase('')
  }

  return (
    <div className="min-h-screen bg-navy-950 text-slate-100 flex flex-col font-sans selection:bg-teal-500 selection:text-slate-950">
      {/* Top Navbar */}
      <Navbar
        activeCaseId={activeCaseId}
        onSelectCase={handleSelectCase}
        isOfflineSimulated={isOffline}
        onToggleOffline={() => setIsOfflineSimulated(!isOfflineSimulated)}
        onNewEncounter={handleNewEncounter}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        encounterCount={encounters.length}
        isProcessing={isProcessingSOAP || isBillingLoading}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Missing Firebase Env Warning Banner (for open-source clones without .env.local) */}
        {!isFirebaseConfigured && (
          <div className="p-3 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-200 text-xs">
            <span className="font-semibold">Firebase Config Missing:</span> Copy <code>.env.example</code> to <code>.env.local</code> and add your Firebase Web App credentials to enable live AI Logic and Cloud Firestore sync.
          </div>
        )}

        {/* Offline Mode Warning Banner */}
        {isOffline && (
          <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs flex items-center justify-between shadow-lg shadow-rose-950/20">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
              <span className="font-semibold uppercase tracking-wide">
                Offline Mode Active:
              </span>
              <span>
                Local PII scrubbing and encounter caching remain active with 0 KB egress. Cloud Gemini calls and Firestore remote sync are paused until connection returns.
              </span>
            </div>
            {isOfflineSimulated && isBrowserOnline && (
              <button
                onClick={() => setIsOfflineSimulated(false)}
                className="text-[11px] underline hover:text-white font-medium shrink-0 ml-3"
              >
                Restore Connection
              </button>
            )}
          </div>
        )}

        {/* Real-Time Telemetry & Egress HUD */}
        <TelemetryHUD
          activeEngine={activeEngine}
          inferenceMode={inferenceMode}
          inferenceSource={inferenceSource}
          latencyMs={latencyMs}
          egressBytes={egressBytes}
          tokenCost={tokenCost}
          appCheckVerified={appCheckVerified}
          appCheckMode={appCheckMode}
          isProcessing={isProcessingSOAP || isBillingLoading}
          isOffline={isOffline}
          phiScrubbedCount={phiScrubbedCount}
          modelCapabilities={modelCapabilities}
        />

        {/* View Switcher: Active Scribe vs History */}
        {activeTab === 'history' ? (
          <div className="grid grid-cols-1 gap-6">
            <EncounterHistory
              encounters={encounters}
              onSelectEncounter={handleSelectEncounter}
              onDeleteEncounter={handleDeleteEncounter}
              isLoading={isLoadingEncounters}
              isOffline={isOffline}
              firestoreConnected={firestoreConnected}
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column: Dictation Console */}
            <div className="h-full">
              <DictationConsole
                transcript={transcript}
                setTranscript={setTranscript}
                onGenerateSOAP={handleGenerateSOAP}
                isProcessingSOAP={isProcessingSOAP}
                isOffline={isOffline}
                activeCaseId={activeCaseId}
                onSelectCase={handleSelectCase}
              />
            </div>

            {/* Right Column: SOAP Note Viewer & Cloud Coding Stack */}
            <div className="space-y-6">
              <SoapNoteViewer
                soapNote={soapNote}
                setSoapNote={setSoapNote}
                soapStats={soapStats}
                soapError={soapError}
                sanitizedPreview={sanitizedPreview}
                isGenerating={isProcessingSOAP}
                onFinalizeBilling={handleFinalizeBilling}
                isBillingLoading={isBillingLoading}
                isOffline={isOffline}
                billingCompleted={!!billingData}
              />

              {/* Coding & Pharmacology Panel */}
              <CodingPanel
                billingData={billingData}
                billingError={billingError}
                isLoading={isBillingLoading}
                onSaveToFirestore={() => handleSaveToFirestore(billingData)}
                isSaving={isSavingEncounter}
                savedDocId={savedDocId}
                savedSyncedToCloud={savedSyncedToCloud}
                isOffline={isOffline}
              />
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-navy-950/80 py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-400">ScribeZero</span>
            <span>•</span>
            <span>Zero-PHI-Egress Hybrid AI Clinical Consultation Scribe</span>
          </div>
          <div>
            Built with <span className="text-teal-400 font-medium">Firebase AI Logic</span> (Gemini Nano / Gemini 3.5 Flash-Lite) for #BuildHybridAI 2026
          </div>
        </div>
      </footer>
    </div>
  )
}
