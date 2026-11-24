import React, { useState, useEffect, useRef } from 'react'
import { 
  Mic, 
  MicOff, 
  Sparkles, 
  RotateCcw, 
  Play, 
  FileText, 
  AlertCircle, 
  Volume2, 
  Activity,
  Check,
  Stethoscope
} from 'lucide-react'
import { CLINICAL_CASES } from '../data/clinicalCases'

export default function DictationConsole({
  transcript,
  setTranscript,
  onGenerateSOAP,
  isProcessingSOAP,
  isOffline,
  activeCaseId,
  onSelectCase
}) {
  const [isListening, setIsListening] = useState(false)
  const [speechSupported, setSpeechSupported] = useState(true)
  const [speechError, setSpeechError] = useState(null)
  const recognitionRef = useRef(null)

  // Initialize Web Speech API for genuine microphone transcription
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      setSpeechSupported(false)
      return
    }

    const recognition = new SpeechRecognition()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'en-US'

    recognition.onresult = (event) => {
      let currentSessionTranscript = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const item = event.results[i]
        if (item.isFinal) {
          setTranscript((prev) => (prev ? prev + ' ' : '') + item[0].transcript)
        } else {
          currentSessionTranscript += item[0].transcript
        }
      }
    }

    recognition.onerror = (event) => {
      console.warn('Speech recognition error:', event.error)
      if (event.error !== 'no-speech') {
        setSpeechError(`Microphone notice: ${event.error}`)
      }
      setIsListening(false)
    }

    recognition.onend = () => {
      setIsListening(false)
    }

    recognitionRef.current = recognition

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort()
        } catch (e) {
          // ignore
        }
      }
    }
  }, [setTranscript])

  const toggleMic = () => {
    if (!recognitionRef.current) return
    setSpeechError(null)

    if (isListening) {
      try {
        recognitionRef.current.stop()
      } catch (err) {
        console.error(err)
      }
      setIsListening(false)
    } else {
      try {
        recognitionRef.current.start()
        setIsListening(true)
      } catch (err) {
        console.error('Failed to start speech recognition:', err)
        setSpeechError('Microphone could not start. Please ensure mic permissions are granted.')
        setIsListening(false)
      }
    }
  }

  const handleClear = () => {
    setTranscript('')
    setSpeechError(null)
  }

  const wordCount = transcript.trim() ? transcript.trim().split(/\s+/).length : 0
  const charCount = transcript.length

  return (
    <div className="bg-navy-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col h-full">
      {/* Console Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-teal-500/10 text-teal-400 border border-teal-500/20">
              <Stethoscope className="w-4 h-4" />
            </div>
            <h2 className="text-sm font-semibold text-white tracking-tight">
              Clinician Consultation Audio & Notes
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Dictate via Web Speech API or select an authentic multi-specialty clinical scenario.
          </p>
        </div>

        {/* Quick Scenario Chips */}
        <div className="flex flex-wrap items-center gap-1.5">
          {CLINICAL_CASES.map((scenario) => {
            const isSelected = activeCaseId === scenario.id
            return (
              <button
                key={scenario.id}
                onClick={() => onSelectCase(scenario.id)}
                disabled={isProcessingSOAP}
                className={`text-[11px] px-2.5 py-1 rounded-lg font-medium transition border ${
                  isSelected
                    ? 'bg-teal-500 text-slate-950 border-teal-400 font-semibold shadow-sm'
                    : 'bg-navy-950 border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white'
                }`}
              >
                {scenario.specialty.split('/')[0].trim()}
              </button>
            )
          })}
        </div>
      </div>

      {/* Microphone status alert if any */}
      {speechError && (
        <div className="mt-3 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{speechError}</span>
        </div>
      )}

      {/* Live Transcript Area */}
      <div className="relative mt-4 flex-1 flex flex-col min-h-[220px]">
        <textarea
          value={transcript}
          onChange={(e) => setTranscript(e.target.value)}
          placeholder="Dictate consultation or paste clinical examination notes here... E.g., 'Patient presents with severe lower back pain radiating down left leg...'"
          disabled={isProcessingSOAP}
          className="w-full flex-1 bg-navy-950 border border-slate-800 rounded-xl p-4 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-teal-500/80 font-sans resize-none transition leading-relaxed"
        />

        {/* Live Audio Visualizer Bar when listening */}
        {isListening && (
          <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs font-mono animate-pulse">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            <span>LISTENING LIVE...</span>
          </div>
        )}
      </div>

      {/* Transcript Stats & Clear Controls */}
      <div className="flex items-center justify-between text-xs text-slate-400 pt-3 pb-4">
        <div className="flex items-center gap-3 font-mono text-[11px]">
          <span>{wordCount} words</span>
          <span>•</span>
          <span>{charCount} characters</span>
        </div>
        {transcript && (
          <button
            onClick={handleClear}
            disabled={isProcessingSOAP}
            className="flex items-center gap-1 text-slate-400 hover:text-rose-400 transition text-xs"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Clear Transcript</span>
          </button>
        )}
      </div>

      {/* Action Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800/80">
        
        {/* Real Mic Dictation Button */}
        <button
          onClick={toggleMic}
          disabled={!speechSupported || isProcessingSOAP}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-xs transition shadow-md ${
            isListening
              ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-rose-900/30 animate-pulse'
              : 'bg-navy-950 hover:bg-slate-800 border border-slate-700 text-slate-200 hover:text-white'
          } disabled:opacity-40 disabled:cursor-not-allowed`}
        >
          {isListening ? (
            <>
              <MicOff className="w-4 h-4 text-white" />
              <span>Stop Dictating</span>
            </>
          ) : (
            <>
              <Mic className="w-4 h-4 text-teal-400" />
              <span>{speechSupported ? 'Start Voice Dictation' : 'Speech API Not Available'}</span>
            </>
          )}
        </button>

        {/* Generate SOAP Note CTA */}
        <button
          onClick={onGenerateSOAP}
          disabled={!transcript.trim() || isProcessingSOAP}
          className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-xs bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 transition shadow-lg shadow-teal-500/20 disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
        >
          {isProcessingSOAP ? (
            <>
              <Activity className="w-4 h-4 animate-spin text-slate-950" />
              <span>Streaming Hybrid SOAP...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 text-slate-950" />
              <span>Process SOAP Note (Hybrid AI)</span>
            </>
          )}
        </button>

      </div>
    </div>
  )
}
