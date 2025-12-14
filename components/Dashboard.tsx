import React, { useState, useEffect, useRef } from 'react';
import VideoMonitor from './VideoMonitor';
import { GeminiLiveService } from '../services/geminiLiveService';
import { IncidentLog, GuardianMode, CallInfo } from '../types';

const Dashboard: React.FC = () => {
  const [mode, setMode] = useState<GuardianMode>(GuardianMode.IDLE);
  const [logs, setLogs] = useState<IncidentLog[]>([]);
  const [callInfo, setCallInfo] = useState<CallInfo>({ isActive: false, recipient: '', status: 'DIALING' });
  const [locationInfo, setLocationInfo] = useState<string>("Locating...");
  
  const geminiService = useRef<GeminiLiveService | null>(null);
  const callTimeoutRef = useRef<number | null>(null);

  const addLog = (message: string, isAlert: boolean, type: IncidentLog['type'] = 'INFO') => {
    const newLog: IncidentLog = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date(),
      type: type,
      message
    };
    setLogs(prev => [newLog, ...prev].slice(0, 50)); 
  };

  const handleCallTrigger = (recipient: string) => {
    // Activate the Dialing UI
    setCallInfo({
      isActive: true,
      recipient: recipient,
      status: 'DIALING'
    });

    // Simulate call duration of 15 seconds to allow for the "Talk to Hospital" script to play out
    if (callTimeoutRef.current) clearTimeout(callTimeoutRef.current);
    callTimeoutRef.current = window.setTimeout(() => {
      setCallInfo(prev => ({ ...prev, isActive: false }));
    }, 15000); 
  };

  const handleWhatsAppTrigger = (name: string) => {
    addLog(`WhatsApp sent to: ${name}`, false, 'WHATSAPP');
  };

  const getLocation = (): Promise<string> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve("Unknown Location (No GPS)");
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          resolve(`Lat: ${latitude.toFixed(4)}, Long: ${longitude.toFixed(4)}`);
        },
        (error) => {
          console.error("Geo error:", error);
          resolve("Location Access Denied");
        }
      );
    });
  };

  const handleStart = async () => {
    if (!process.env.API_KEY) {
      alert("API_KEY not found in environment variables.");
      return;
    }

    try {
      addLog("Acquiring GPS Location...", false, 'INFO');
      const location = await getLocation();
      setLocationInfo(location);
      addLog(`Location Acquired: ${location}`, false, 'INFO');

      setMode(GuardianMode.MONITORING);
      geminiService.current = new GeminiLiveService(
        process.env.API_KEY, 
        addLog,
        handleCallTrigger,
        handleWhatsAppTrigger
      );
      // Connect with the acquired location
      await geminiService.current.connect(location);
    } catch (e) {
      console.error(e);
      setMode(GuardianMode.IDLE);
      addLog("Failed to initialize Guardian system", true, 'INFO');
    }
  };

  const handleStop = async () => {
    if (geminiService.current) {
      await geminiService.current.disconnect();
      geminiService.current = null;
    }
    setMode(GuardianMode.IDLE);
    setCallInfo({ isActive: false, recipient: '', status: 'DIALING' });
    addLog("System disarmed", false, 'INFO');
  };

  const handleFrameCapture = (base64: string) => {
    if (geminiService.current && mode === GuardianMode.MONITORING) {
      geminiService.current.sendVideoFrame(base64);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-6">
      <header className="mb-8 flex justify-between items-center max-w-6xl mx-auto">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
            AI Lifetime Guardian
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Advanced Elderly & Child Safety Monitoring
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-right hidden sm:block">
            <div className="text-xs text-slate-500 uppercase tracking-wider">GPS Coordinates</div>
            <div className="font-mono text-slate-300 text-xs">{locationInfo}</div>
          </div>
          <div className="text-right">
            <div className="text-xs text-slate-500 uppercase tracking-wider">Status</div>
            <div className={`font-mono font-bold ${mode === GuardianMode.MONITORING ? 'text-green-400' : 'text-slate-300'}`}>
              {mode}
            </div>
          </div>
          <button
            onClick={mode === GuardianMode.IDLE ? handleStart : handleStop}
            className={`px-6 py-2 rounded-lg font-semibold transition-all ${
              mode === GuardianMode.IDLE
                ? 'bg-blue-600 hover:bg-blue-500 shadow-[0_0_20px_rgba(37,99,235,0.3)]'
                : 'bg-red-600 hover:bg-red-500 shadow-[0_0_20px_rgba(220,38,38,0.3)]'
            }`}
          >
            {mode === GuardianMode.IDLE ? 'ACTIVATE GUARDIAN' : 'DISARM SYSTEM'}
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Video Feed Section */}
        <div className="lg:col-span-2 space-y-4">
          <div className={`p-1 rounded-xl border backdrop-blur-sm transition-colors duration-500 ${callInfo.isActive ? 'bg-red-900/30 border-red-500' : 'bg-slate-800/50 border-slate-700/50'}`}>
            <VideoMonitor 
              isActive={mode === GuardianMode.MONITORING} 
              onFrameCapture={handleFrameCapture}
              callInfo={callInfo}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
              <h3 className="text-sm font-semibold text-slate-400 mb-2 uppercase">Vision Engine</h3>
              <p className="text-xs text-slate-500">Gemini 2.5 Flash Multimodal</p>
              <div className="mt-3 space-y-2">
                <div className="flex items-center space-x-2">
                   <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                   <span className="text-[10px] text-slate-300 uppercase tracking-wide">Object Classification (Comb vs Knife)</span>
                </div>
                <div className="flex items-center space-x-2">
                   <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                   <span className="text-[10px] text-slate-300 uppercase tracking-wide">Fall & Emergency Logic</span>
                </div>
              </div>
            </div>
            <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
              <h3 className="text-sm font-semibold text-slate-400 mb-2 uppercase">Intervention</h3>
              <p className="text-xs text-slate-500">Real-time PCM Audio Stream</p>
              <div className="mt-2 flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${callInfo.isActive ? 'bg-red-500 animate-ping' : 'bg-blue-500'}`}></div>
                <span className={`text-xs ${callInfo.isActive ? 'text-red-400 font-bold' : 'text-blue-400'}`}>
                  {callInfo.isActive ? 'EMERGENCY LINE ACTIVE' : 'Voice Synthesis & Dialing Sim'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Event Log Section */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 flex flex-col h-[600px]">
          <div className="p-4 border-b border-slate-700 bg-slate-800/80 rounded-t-xl">
            <h2 className="font-semibold text-lg flex items-center">
              <svg className="w-5 h-5 mr-2 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Incident Log
            </h2>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3 font-mono text-sm">
            {logs.length === 0 && (
              <div className="text-center text-slate-500 mt-10">
                System Initialized.<br/>Waiting for events...
              </div>
            )}
            {logs.map((log) => (
              <div 
                key={log.id} 
                className={`p-3 rounded border-l-2 ${
                  log.type === 'CALL' 
                    ? 'bg-red-900/40 border-red-500 text-white animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.2)]'
                    : log.type === 'HAZARD' || log.type === 'MEDICAL' || log.type === 'FALL'
                    ? 'bg-red-900/20 border-red-500 text-red-200' 
                    : log.type === 'WHATSAPP'
                    ? 'bg-green-900/20 border-green-500 text-green-200'
                    : 'bg-slate-700/30 border-blue-400 text-slate-300'
                }`}
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs opacity-60">{log.timestamp.toLocaleTimeString()}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                     log.type === 'CALL' ? 'bg-red-600 text-white' :
                     log.type === 'HAZARD' || log.type === 'FALL' ? 'bg-red-500/20 text-red-400' : 
                     log.type === 'WHATSAPP' ? 'bg-green-500/20 text-green-400' :
                     'bg-blue-500/20 text-blue-400'
                  }`}>
                    {log.type === 'CALL' ? 'EMERGENCY CALL' : log.type}
                  </span>
                </div>
                <div className={log.type === 'CALL' ? 'font-bold' : ''}>{log.message}</div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;