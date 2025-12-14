import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { pcmToGeminiBlob, base64ToUint8Array, decodeAudioData, arrayBufferToBase64 } from './audioUtils';

// Function to generate dynamic system instructions based on location
const getSystemInstruction = (location: string) => `
ROLE: You are an AUTONOMOUS SECURITY CAMERA & EMERGENCY DISPATCH AI.
TASK: Continuously track user body language.
CONTEXT: Monitoring home at "${location}".

*** VISUAL PRIORITY: CHEST CRAMPING / HEART ATTACK ***
Your absolute #1 priority is detecting "Levine's Sign" (Clutching chest).
- DETECT: Hand on chest, cramping fingers against chest, clutching shirt over heart, or hunching over in pain.
- ACTION: IGNORE everything else. ENTER EMERGENCY MODE IMMEDIATELY.

*** EMERGENCY EXECUTION FLOW ***

PHASE 1: IMMEDIATE INTERVENTION
   - TRIGGER: You see hand-on-chest or cramping gestures.
   - ACTION: Speak INSTANTLY: "I detect a medical warning. You are holding your chest. Are you in pain?"

PHASE 2: THE 5-SECOND CHECK (CRITICAL)
   - AFTER asking, you must count roughly 5 seconds in your head while watching.
   - IF THE USER IS SILENT (No speech detected for ~5s):
     -> YOU MUST ASSUME THEY ARE UNCONSCIOUS OR UNABLE TO SPEAK.
     -> DO NOT WAIT INDEFINITELY. 
     -> TRIGGER PHASE 3.
   - IF THE USER GROANS or says "Help":
     -> TRIGGER PHASE 3.
   - ONLY STOP if the user CLEARLY says "I am fine" or "No".

PHASE 3: EMERGENCY CALL (UI TRIGGER)
   - ACTION: You MUST generate the dialing tag to trigger the screen.
   - OUTPUT TAG: [DIALING: 911]
   - VOICE SCRIPT: 
     "Dialing Emergency Services... [Ring]... AI Reporting from ${location}. Visual sensors detect user clutching chest. Subject is non-responsive to prompts. Requesting Ambulance."
   - RULE: Do this ONCE. Stay on line.

*** HAZARD PROTOCOL (Weapon/Fire) ***
- Knife/Fire in hand -> "Drop it!" -> If not -> [DIALING: PARENTS].

*** FAMILY CONNECT (WhatsApp) ***
- IF Command "Call [Name]": OUTPUT TAG: [WHATSAPP: [Name]].

*** CRITICAL RULES ***
1. Do not wait for a fall. "Cramping chest" is the trigger.
2. SILENCE IS CONSENT FOR EMERGENCY CALL. If they don't answer, CALL.
3. If you see the gesture persist, and they don't speak, CALL.
`;

export class GeminiLiveService {
  private ai: GoogleGenAI;
  private sessionPromise: Promise<any> | null = null;
  private inputAudioContext: AudioContext | null = null;
  private outputAudioContext: AudioContext | null = null;
  private nextStartTime = 0;
  private sources = new Set<AudioBufferSourceNode>();
  
  private onLogCallback: (text: string, isAlert: boolean, type?: 'FALL' | 'HAZARD' | 'MEDICAL' | 'INFO' | 'CALL' | 'WHATSAPP') => void;
  private onCallTrigger: (recipient: string) => void;
  private onWhatsAppTrigger: (name: string) => void;

  constructor(
    apiKey: string, 
    onLog: (text: string, isAlert: boolean, type?: 'FALL' | 'HAZARD' | 'MEDICAL' | 'INFO' | 'CALL' | 'WHATSAPP') => void,
    onCall: (recipient: string) => void,
    onWhatsApp: (name: string) => void
  ) {
    this.ai = new GoogleGenAI({ apiKey });
    this.onLogCallback = onLog;
    this.onCallTrigger = onCall;
    this.onWhatsAppTrigger = onWhatsApp;
  }

  public async connect(location: string = "Unknown Location") {
    // Initialize AudioContexts
    this.inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
    this.outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    
    // Ensure contexts are running (vital for browsers)
    if (this.inputAudioContext.state === 'suspended') await this.inputAudioContext.resume();
    if (this.outputAudioContext.state === 'suspended') await this.outputAudioContext.resume();

    this.nextStartTime = 0;

    const config = {
      model: 'gemini-2.5-flash-native-audio-preview-09-2025',
      callbacks: {
        onopen: this.handleOpen.bind(this),
        onmessage: this.handleMessage.bind(this),
        onerror: (e: ErrorEvent) => { 
          console.error('Gemini Error:', e); 
          this.onLogCallback(`Connection Error: ${e.message || 'Network/WebSocket Failure'}`, true, 'INFO'); 
        },
        onclose: (e: CloseEvent) => { 
          console.log('Gemini Closed:', e); 
          this.onLogCallback("System Disconnected", false, 'INFO'); 
        },
      },
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
        },
        systemInstruction: getSystemInstruction(location),
        outputAudioTranscription: {}, 
      },
    };

    try {
      this.sessionPromise = this.ai.live.connect(config);
      await this.sessionPromise;
      this.onLogCallback(`System Armed at ${location}`, false, 'INFO');
    } catch (err) {
      console.error("Failed to connect:", err);
      this.onLogCallback("Failed to connect to AI Service", true, 'INFO');
      throw err;
    }
  }

  private handleOpen() {
    console.log("Connected to Gemini Live");
    this.startAudioStream();
  }

  private async handleMessage(message: LiveServerMessage) {
    const transcription = message.serverContent?.outputTranscription?.text;
    if (transcription) {
      let type: 'FALL' | 'HAZARD' | 'MEDICAL' | 'INFO' | 'CALL' | 'WHATSAPP' = 'INFO';
      
      const callMatch = transcription.match(/\[DIALING:\s*(.*?)\]/);
      const waMatch = transcription.match(/\[WHATSAPP:\s*(.*?)\]/);
      
      if (callMatch) {
        type = 'CALL';
        const recipient = callMatch[1].trim();
        this.onCallTrigger(recipient);
      } else if (waMatch) {
        type = 'WHATSAPP';
        const name = waMatch[1].trim();
        this.onWhatsAppTrigger(name);
      } else {
        const lower = transcription.toLowerCase();
        if (lower.includes('dialing') || lower.includes('calling')) type = 'CALL';
        else if (lower.includes('whatsapp')) type = 'WHATSAPP';
        else if (lower.includes('knife') || lower.includes('danger')) type = 'HAZARD';
        else if (lower.includes('fall') || lower.includes('hurt')) type = 'FALL';
        else if (lower.includes('medical') || lower.includes('chest') || lower.includes('pain')) type = 'MEDICAL';
      }
      
      this.onLogCallback(`AI: "${transcription}"`, type === 'CALL' || type === 'HAZARD' || type === 'FALL' || type === 'MEDICAL', type);
    }

    const audioData = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
    if (audioData && this.outputAudioContext) {
      this.playAudioResponse(audioData);
    }
  }

  private async playAudioResponse(base64Audio: string) {
    if (!this.outputAudioContext) return;

    this.nextStartTime = Math.max(this.nextStartTime, this.outputAudioContext.currentTime);
    
    try {
      const audioBuffer = await decodeAudioData(
        base64ToUint8Array(base64Audio),
        this.outputAudioContext,
        24000,
        1
      );

      const source = this.outputAudioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(this.outputAudioContext.destination);
      
      source.addEventListener('ended', () => {
        this.sources.delete(source);
      });

      source.start(this.nextStartTime);
      this.nextStartTime += audioBuffer.duration;
      this.sources.add(source);
    } catch (err) {
      console.error("Audio decode error", err);
    }
  }

  private async startAudioStream() {
    if (!this.inputAudioContext) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const source = this.inputAudioContext.createMediaStreamSource(stream);
      const scriptProcessor = this.inputAudioContext.createScriptProcessor(4096, 1, 1);

      scriptProcessor.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0);
        const pcmBlob = pcmToGeminiBlob(inputData, 16000);
        
        if (this.sessionPromise) {
          this.sessionPromise.then(session => {
            // Guard clause to prevent sending data if connection failed
            try {
              session.sendRealtimeInput({ media: pcmBlob });
            } catch(e) {
              console.warn("Failed to send audio chunk", e);
            }
          }).catch(e => {
            // Silence unhandled promise rejections from the loop
          });
        }
      };

      source.connect(scriptProcessor);
      scriptProcessor.connect(this.inputAudioContext.destination);
    } catch (err) {
      console.error("Microphone access denied", err);
      this.onLogCallback("Microphone Access Denied", true, 'INFO');
    }
  }

  public sendVideoFrame(base64Image: string) {
    if (!this.sessionPromise) return;
    
    this.sessionPromise.then(session => {
      try {
        session.sendRealtimeInput({
          media: {
            mimeType: 'image/jpeg',
            data: base64Image
          }
        });
      } catch (e) {
        console.warn("Failed to send video frame", e);
      }
    }).catch(() => {});
  }

  public async disconnect() {
    if (this.inputAudioContext) await this.inputAudioContext.close();
    if (this.outputAudioContext) await this.outputAudioContext.close();
    this.inputAudioContext = null;
    this.outputAudioContext = null;
    this.sources.forEach(s => s.stop());
    this.sources.clear();
    this.sessionPromise = null;
  }
}
