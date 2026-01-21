import React, { useState, useRef, useMemo } from 'react';

// --- Sound Effects System (Hook) ---
const useSound = () => {
    const ctxRef = useRef(null);
    const [isMuted, setIsMuted] = useState(false);
    const isMutedRef = useRef(false);

    const toggleMute = () => {
      setIsMuted(prev => {
          const next = !prev;
          isMutedRef.current = next;
          return next;
      });
    };

    // Initialize Audio Context lazily
    const getCtx = () => {
        if (isMutedRef.current) return null;
        
        if (!ctxRef.current) {
             const AudioContext = window.AudioContext || window.webkitAudioContext;
             if (AudioContext) ctxRef.current = new AudioContext();
        }
        if (ctxRef.current?.state === 'suspended') {
            ctxRef.current.resume();
        }
        return ctxRef.current;
    };


    // --- Sound Generators (Premium Glass/Stone Aesthetic) ---
    
    const playTone = (freq, type, duration, vol = 0.1) => {
        const ctx = getCtx();
        if (!ctx) return;
        const t = ctx.currentTime;
        
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.type = type;
        osc.frequency.setValueAtTime(freq, t);
        
        // Soft Attack/Release Envelope
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(vol, t + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.start();
        osc.stop(t + duration);
    };

    const playGlide = () => {
        const ctx = getCtx();
        if (!ctx) return;
        const t = ctx.currentTime;
        
        const bufferSize = ctx.sampleRate * 0.15; // Short swoosh
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noise = ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.Q.value = 1;

        // Frequency Sweep for "Whoosh"
        filter.frequency.setValueAtTime(200, t);
        filter.frequency.linearRampToValueAtTime(600, t + 0.1);

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.03, t + 0.05); // Very subtle
        gain.gain.linearRampToValueAtTime(0, t + 0.15);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        noise.start();
    };

    const playClink = () => {
        const ctx = getCtx();
        if (!ctx) return;
        const t = ctx.currentTime;
        
        // Dual Oscillator for "Crystal" resonance
        const createBell = (freq, detune) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, t);
            osc.detune.setValueAtTime(detune, t);
            
            gain.gain.setValueAtTime(0, t);
            gain.gain.linearRampToValueAtTime(0.1, t + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5); // Long tail
            
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(t + 0.5);
        };

        createBell(800, 0);
        createBell(1200, 5); // Harmonic overtone
    };
    
    const playChord = () => {
       // C Major 7 Add 9 (Ethereal)
       [523.25, 659.25, 783.99, 987.77, 1174.66].forEach((f, i) => {
           setTimeout(() => playTone(f, 'sine', 0.8, 0.05), i * 80);
       });
    };

    // Haptic Helper
    const vibrate = (ms) => {
        if (navigator.vibrate) navigator.vibrate(ms);
    };

    return useMemo(() => ({
        isMuted,
        toggleMute,
        playSelect: () => vibrate(5), // Tiny tick
        playMove: () => { playGlide(); vibrate(10); },
        playCapture: () => { playGlide(); vibrate(20); }, 
        playClick: () => vibrate(5), 
        playWin: () => { playChord(); vibrate([50, 50, 50]); },
        playError: () => { playTone(150, 'triangle', 0.2, 0.05); vibrate(50); },
        // Additions for Editor
        playPop: () => { playTone(600, 'sine', 0.05, 0.05); vibrate(5); },
        playSlide: () => { playGlide(); vibrate(10); },
        playTrash: () => { playTone(100, 'sawtooth', 0.1, 0.05); vibrate(15); }
    }), [isMuted]);
};

export default useSound;
