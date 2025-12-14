import React, { useEffect, useRef } from 'react';
import { CallInfo } from '../types';

interface VideoMonitorProps {
  isActive: boolean;
  onFrameCapture: (base64: string) => void;
  callInfo: CallInfo;
}

const VideoMonitor: React.FC<VideoMonitorProps> = ({ isActive, onFrameCapture, callInfo }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { width: 640, height: 480, facingMode: 'user' } 
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Camera error:", err);
      }
    };

    startCamera();

    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach(track => track.stop());
      }
    };
  }, []);

  useEffect(() => {
    if (!isActive) {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      return;
    }

    let lastFrameTime = 0;
    const FRAME_RATE = 3; 
    const interval = 1000 / FRAME_RATE;

    const processFrame = (timestamp: number) => {
      if (!lastFrameTime) lastFrameTime = timestamp;
      const elapsed = timestamp - lastFrameTime;

      if (elapsed > interval) {
        if (videoRef.current && canvasRef.current) {
          const video = videoRef.current;
          const canvas = canvasRef.current;
          const ctx = canvas.getContext('2d');

          if (ctx && video.readyState === 4) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            
            // Standard Recording Overlay
            ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)';
            ctx.lineWidth = 4;
            ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40);

            const base64 = canvas.toDataURL('image/jpeg', 0.7).split(',')[1];
            onFrameCapture(base64);
          }
        }
        lastFrameTime = timestamp;
      }

      requestRef.current = requestAnimationFrame(processFrame);
    };

    requestRef.current = requestAnimationFrame(processFrame);

    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isActive, onFrameCapture]);

  return (
    <div className="relative w-full max-w-2xl mx-auto rounded-lg overflow-hidden border-2 border-slate-700 bg-black shadow-2xl transition-all duration-500">
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        className={`w-full h-auto object-cover transition-opacity duration-500 ${callInfo.isActive ? 'opacity-30' : 'opacity-100'}`}
      />
      <canvas ref={canvasRef} className="hidden" />
      
      {/* Standard Status Overlay */}
      <div className="absolute top-4 left-4 flex items-center space-x-2 bg-black/60 px-3 py-1 rounded-full z-10">
        <div className={`w-3 h-3 rounded-full ${isActive ? 'bg-red-500 animate-pulse' : 'bg-gray-500'}`} />
        <span className="text-xs font-mono text-white tracking-widest uppercase">
          {isActive ? 'Live Monitor' : 'Standby'}
        </span>
      </div>

      {/* EMERGENCY DIALING OVERLAY */}
      {callInfo.isActive && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-900/60 backdrop-blur-sm z-20 animate-in fade-in duration-300">
          <div className="w-24 h-24 bg-red-600 rounded-full flex items-center justify-center animate-bounce shadow-[0_0_50px_rgba(220,38,38,0.8)]">
            <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
          </div>
          <div className="mt-6 text-center">
            <h2 className="text-3xl font-bold text-white tracking-widest uppercase animate-pulse">
              DIALING...
            </h2>
            <p className="text-xl text-red-200 font-mono mt-2 uppercase">
              RECIPIENT: {callInfo.recipient}
            </p>
            <div className="mt-4 flex space-x-2 justify-center">
               <span className="w-2 h-2 bg-white rounded-full animate-ping"></span>
               <span className="w-2 h-2 bg-white rounded-full animate-ping delay-75"></span>
               <span className="w-2 h-2 bg-white rounded-full animate-ping delay-150"></span>
            </div>
          </div>
        </div>
      )}

      <div className="absolute bottom-4 right-4 bg-black/60 px-3 py-1 rounded text-xs font-mono text-green-400 z-10">
        GEMINI-VISION-V2.5
      </div>
    </div>
  );
};

export default VideoMonitor;