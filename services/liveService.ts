
import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";
import { AudioUtils } from "../utils/audioUtils";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const SYSTEM_INSTRUCTION = `
You are Semsa, a witty, sassy, and competitive Ugandan card player playing "Matatu". 
You are playing against a human. 
Your personality: Fun, loud, confident, slightly mocking but friendly.
Language: English with some Ugandan slang (e.g., "Eh!", "Bambi", "Wamma", "Nedda").
Goal: Banter with the user while they play. React to what they say. If they say they are winning, tell them to dream on.
Keep your responses relatively short and spoken naturally.
`;

export class LiveService {
    private session: any = null;
    private inputContext: AudioContext | null = null;
    private outputContext: AudioContext | null = null;
    private processor: ScriptProcessorNode | null = null;
    private source: MediaStreamAudioSourceNode | null = null;
    private nextStartTime: number = 0;
    private isConnected: boolean = false;

    async connect(onStatusChange: (status: boolean) => void) {
        if (this.isConnected) return;

        try {
            // 1. Setup Audio Contexts
            // Input: 16kHz for Gemini
            this.inputContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
            // Output: 24kHz for Gemini response
            this.outputContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });

            // 2. Get User Media
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

            // 3. Connect to Gemini Live
            const sessionPromise = ai.live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-09-2025',
                callbacks: {
                    onopen: () => {
                        console.log("Gemini Live Connected");
                        this.isConnected = true;
                        onStatusChange(true);
                        this.startAudioInput(stream, sessionPromise);
                    },
                    onmessage: async (message: LiveServerMessage) => {
                        this.handleServerMessage(message);
                    },
                    onclose: () => {
                        console.log("Gemini Live Closed");
                        this.disconnect(onStatusChange);
                    },
                    onerror: (err) => {
                        console.error("Gemini Live Error", err);
                        this.disconnect(onStatusChange);
                    }
                },
                config: {
                    responseModalities: [Modality.AUDIO],
                    speechConfig: {
                        voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } }
                    },
                    systemInstruction: SYSTEM_INSTRUCTION,
                }
            });
            
            this.session = await sessionPromise;

        } catch (error) {
            console.error("Failed to connect to Live Service", error);
            onStatusChange(false);
        }
    }

    private startAudioInput(stream: MediaStream, sessionPromise: Promise<any>) {
        if (!this.inputContext) return;

        this.source = this.inputContext.createMediaStreamSource(stream);
        this.processor = this.inputContext.createScriptProcessor(4096, 1, 1);

        this.processor.onaudioprocess = (e) => {
            const inputData = e.inputBuffer.getChannelData(0);
            // Convert Float32 to Int16 PCM
            const pcmData = AudioUtils.floatTo16BitPCM(inputData);
            const base64Data = AudioUtils.arrayBufferToBase64(pcmData.buffer);

            // Send to Gemini
            sessionPromise.then(session => {
                 session.sendRealtimeInput({
                    media: {
                        mimeType: 'audio/pcm;rate=16000',
                        data: base64Data
                    }
                });
            });
        };

        this.source.connect(this.processor);
        this.processor.connect(this.inputContext.destination);
    }

    private async handleServerMessage(message: LiveServerMessage) {
        const audioData = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
        if (audioData && this.outputContext) {
            const audioBytes = AudioUtils.base64ToUint8Array(audioData);
            const audioBuffer = await this.decodeAudioData(audioBytes);
            this.playAudioBuffer(audioBuffer);
        }
    }

    private async decodeAudioData(data: Uint8Array): Promise<AudioBuffer> {
        if (!this.outputContext) throw new Error("No output context");

        // Raw PCM decoding (1 channel, 24kHz)
        const dataInt16 = new Int16Array(data.buffer);
        const buffer = this.outputContext.createBuffer(1, dataInt16.length, 24000);
        const channelData = buffer.getChannelData(0);

        for (let i = 0; i < dataInt16.length; i++) {
            channelData[i] = dataInt16[i] / 32768.0;
        }
        return buffer;
    }

    private playAudioBuffer(buffer: AudioBuffer) {
        if (!this.outputContext) return;

        const source = this.outputContext.createBufferSource();
        source.buffer = buffer;
        source.connect(this.outputContext.destination);

        const currentTime = this.outputContext.currentTime;
        // Schedule next chunk
        const startTime = Math.max(currentTime, this.nextStartTime);
        source.start(startTime);
        this.nextStartTime = startTime + buffer.duration;
    }

    disconnect(onStatusChange?: (status: boolean) => void) {
        if (this.processor) {
            this.processor.disconnect();
            this.processor = null;
        }
        if (this.source) {
            this.source.disconnect();
            this.source = null;
        }
        if (this.inputContext) {
            this.inputContext.close();
            this.inputContext = null;
        }
        if (this.outputContext) {
            this.outputContext.close();
            this.outputContext = null;
        }
        // No explicit session.close method in SDK types provided, usually close via connection logic or just drop it.
        // Assuming connection drops when media stops or we can just reset state.
        
        this.session = null;
        this.isConnected = false;
        this.nextStartTime = 0;
        if (onStatusChange) onStatusChange(false);
    }
}
