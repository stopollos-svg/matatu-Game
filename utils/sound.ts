
export class SoundManager {
    private static ctx: AudioContext | null = null;
    private static noiseBuffer: AudioBuffer | null = null;
    private static _muted: boolean = false;

    static set muted(value: boolean) {
        this._muted = value;
        if (value && this.ctx && this.ctx.state === 'running') {
            this.ctx.suspend();
        } else if (!value && this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    private static init() {
        if (!this.ctx) {
            this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        if (this.ctx.state === 'suspended' && !this._muted) {
            this.ctx.resume();
        }
        if (!this.noiseBuffer) {
            const bufferSize = this.ctx.sampleRate * 2; // 2 seconds of noise
            this.noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
            const data = this.noiseBuffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                data[i] = Math.random() * 2 - 1;
            }
        }
    }

    // Generic synthesis helper
    private static playTone(freqStart: number, freqEnd: number, duration: number, type: OscillatorType = 'sine', vol: number = 0.1) {
        if (this._muted) return;
        this.init();
        if (!this.ctx) return;
        const t = this.ctx.currentTime;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(freqStart, t);
        osc.frequency.exponentialRampToValueAtTime(freqEnd, t + duration);

        gain.gain.setValueAtTime(vol, t);
        gain.gain.linearRampToValueAtTime(0, t + duration);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(t);
        osc.stop(t + duration);
    }

    // "Goat Bleating" for Player Move
    static playPlayerMoveSound() {
        if (this._muted) return;
        this.init();
        if (!this.ctx) return;
        const t = this.ctx.currentTime;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const lfo = this.ctx.createOscillator();
        const lfoGain = this.ctx.createGain();

        // High pitch goat
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(220, t); // A3
        osc.frequency.linearRampToValueAtTime(180, t + 0.4); 

        // Vibrato LFO
        lfo.type = 'sine';
        lfo.frequency.setValueAtTime(7, t); 
        lfoGain.gain.setValueAtTime(15, t); 

        lfo.connect(lfoGain);
        lfoGain.connect(osc.frequency);

        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.2, t + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.4);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(t);
        lfo.start(t);
        osc.stop(t + 0.5);
        lfo.stop(t + 0.5);
    }

    // "Rhino/Hippo Grunt" for Computer Move
    static playComputerMoveSound() {
        if (this._muted) return;
        this.init();
        if (!this.ctx) return;
        const t = this.ctx.currentTime;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const lfo = this.ctx.createOscillator();
        const lfoGain = this.ctx.createGain();

        // Low pitch square wave for "grunt" texture
        osc.type = 'square';
        osc.frequency.setValueAtTime(110, t); // A2 (Lower)
        osc.frequency.linearRampToValueAtTime(80, t + 0.3); 

        // Slower, deeper vibrato
        lfo.type = 'triangle';
        lfo.frequency.setValueAtTime(5, t); 
        lfoGain.gain.setValueAtTime(10, t); 

        lfo.connect(lfoGain);
        lfoGain.connect(osc.frequency);

        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.15, t + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.3);

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 600;

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(t);
        lfo.start(t);
        osc.stop(t + 0.4);
        lfo.stop(t + 0.4);
    }

    // "Swish/Wing Flap" for Drag
    static playDragSound() {
        if (this._muted) return;
        this.init();
        if (!this.ctx || !this.noiseBuffer) return;
        const t = this.ctx.currentTime;

        const source = this.ctx.createBufferSource();
        source.buffer = this.noiseBuffer;
        
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(400, t);
        filter.frequency.linearRampToValueAtTime(1000, t + 0.1);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.1, t);
        gain.gain.linearRampToValueAtTime(0, t + 0.15);

        source.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);

        source.start(t);
        source.stop(t + 0.15);
    }

    // "Hoof Thud" for Drop
    static playDropSound() {
        if (this._muted) return;
        this.init();
        if (!this.ctx) return;
        const t = this.ctx.currentTime;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(100, t);
        osc.frequency.exponentialRampToValueAtTime(40, t + 0.1);

        gain.gain.setValueAtTime(0.5, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.15);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(t);
        osc.stop(t + 0.15);
    }

    // "Card Snap" for Reveal/Flip
    static playFlipSound() {
        if (this._muted) return;
        this.init();
        if (!this.ctx || !this.noiseBuffer) return;
        const t = this.ctx.currentTime;

        // White noise burst for the "snap"
        const source = this.ctx.createBufferSource();
        source.buffer = this.noiseBuffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.setValueAtTime(2000, t);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.25, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);

        source.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);
        source.start(t);
        source.stop(t + 0.05);

        // Underlying tone - subtle snap
        this.playTone(1200, 600, 0.05, 'sine', 0.1);
    }

    // Distinct "Slide" for Draw
    static playDrawSound() {
        if (this._muted) return;
        this.init();
        if (!this.ctx || !this.noiseBuffer) return;
        const t = this.ctx.currentTime;

        // Slide noise
        const source = this.ctx.createBufferSource();
        source.buffer = this.noiseBuffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(800, t);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.15, t);
        gain.gain.linearRampToValueAtTime(0, t + 0.15); // Longer duration than flip

        source.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);
        source.start(t);
        source.stop(t + 0.15);
    }

    // "Lion Roar" for Win
    static playWinSound() {
        if (this._muted) return;
        this.init();
        if (!this.ctx || !this.noiseBuffer) return;
        const t = this.ctx.currentTime;
        
        const duration = 2.5;

        // Roar Layer 1: Filtered Noise
        const source = this.ctx.createBufferSource();
        source.buffer = this.noiseBuffer;
        source.loop = true;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.Q.value = 5;
        filter.frequency.setValueAtTime(200, t);
        filter.frequency.linearRampToValueAtTime(800, t + 1);
        filter.frequency.linearRampToValueAtTime(100, t + duration);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.8, t + 0.5);
        gain.gain.linearRampToValueAtTime(0, t + duration);

        source.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);

        source.start(t);
        source.stop(t + duration);

        // Roar Layer 2: Sub-bass rumble (growl)
        const osc = this.ctx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(50, t);
        osc.frequency.linearRampToValueAtTime(40, t + duration);

        const oscGain = this.ctx.createGain();
        oscGain.gain.setValueAtTime(0, t);
        oscGain.gain.linearRampToValueAtTime(0.3, t + 0.5);
        oscGain.gain.linearRampToValueAtTime(0, t + duration);

        osc.connect(oscGain);
        oscGain.connect(this.ctx.destination);
        
        osc.start(t);
        osc.stop(t + duration);
    }

    static speak(text: string) {
        if (this._muted) return;
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            
            const utterance = new SpeechSynthesisUtterance(text);
            const voices = window.speechSynthesis.getVoices();
            const femaleVoice = voices.find(v => v.name.includes('Female') || v.name.includes('Google US English'));
            if (femaleVoice) utterance.voice = femaleVoice;
            
            utterance.pitch = 1.1; 
            utterance.rate = 1.0;
            window.speechSynthesis.speak(utterance);
        }
    }
}
