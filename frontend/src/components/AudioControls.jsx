import { useRef, useState, useEffect, useCallback } from "react";
import { Play, Pause, SpeakerHigh, CircleNotch, Timer } from "@phosphor-icons/react";
import { toast } from "sonner";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export const AudioControls = ({ text, elKey, elVoice }) => {
  const audioRef = useRef(null);
  const [state, setState] = useState("idle");
  const [source, setSource] = useState(null);
  const [slow, setSlow] = useState(false);
  const slowRef = useRef(false);

  const toggleSlow = () => {
    const next = !slow;
    setSlow(next);
    slowRef.current = next;
    if (audioRef.current) audioRef.current.playbackRate = next ? 0.8 : 1.0;
  };

  useEffect(() => {
    return () => {
      if (audioRef.current) audioRef.current.pause();
      window.speechSynthesis?.cancel();
    };
  }, []);

  useEffect(() => {
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    window.speechSynthesis?.cancel();
    setState("idle");
    setSource(null);
  }, [text]);

  const speakFallback = useCallback(() => {
    if (!window.speechSynthesis) {
      toast.error("No speech synthesis available in this browser");
      setState("idle");
      return;
    }
    const utter = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    const hi = voices.find((v) => v.lang?.startsWith("hi") || v.lang?.startsWith("sa"));
    if (hi) utter.voice = hi;
    utter.rate = slowRef.current ? 0.6 : 0.75;
    utter.onend = () => setState("idle");
    utter.onerror = () => setState("idle");
    window.speechSynthesis.speak(utter);
    setSource("browser");
    setState("playing");
  }, [text]);

  const play = async () => {
    if (state === "playing") {
      if (source === "browser") { window.speechSynthesis.cancel(); setState("idle"); }
      else { audioRef.current?.pause(); setState("paused"); }
      return;
    }
    if (state === "paused" && audioRef.current) {
      audioRef.current.play();
      setState("playing");
      return;
    }
    if (!elKey) {
      toast.info("No ElevenLabs key set — using browser voice", { duration: 3000 });
      speakFallback();
      return;
    }
    setState("loading");
    try {
      const res = await fetch(`${API}/tts`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-ElevenLabs-Key": elKey },
        body: JSON.stringify({ text, voice_id: elVoice || null }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "TTS failed");
      }
      const blob = await res.blob();
      const audio = new Audio(URL.createObjectURL(blob));
      audio.playbackRate = slowRef.current ? 0.8 : 1.0;
      audio.onended = () => setState("idle");
      audioRef.current = audio;
      audio.play();
      setSource("elevenlabs");
      setState("playing");
    } catch (e) {
      toast.warning(`ElevenLabs failed (${e.message}) — falling back to browser voice`);
      speakFallback();
    }
  };

  return (
    <div className="flex items-center gap-3">
      <button
        data-testid="play-audio-btn"
        onClick={play}
        disabled={state === "loading"}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#E27B58] hover:bg-[#C96544] disabled:opacity-60 text-white text-sm font-semibold transition-[background-color,transform] duration-150 hover:scale-[1.03] focus:ring-2 focus:ring-[#E27B58]/60"
      >
        {state === "loading" ? (
          <CircleNotch size={16} className="animate-spin" />
        ) : state === "playing" ? (
          <Pause size={16} weight="fill" />
        ) : (
          <Play size={16} weight="fill" />
        )}
        {state === "playing" ? "Pause" : state === "paused" ? "Resume" : "Chant"}
      </button>
      <button
        data-testid="slow-toggle"
        onClick={toggleSlow}
        aria-pressed={slow}
        className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full border text-xs font-mono-ipa uppercase tracking-wider transition-colors duration-150 focus:ring-2 focus:ring-[#E27B58]/60 ${
          slow
            ? "bg-[#E27B58]/15 border-[#E27B58]/60 text-[#E27B58]"
            : "bg-white/5 border-white/10 text-[#A1A1AA] hover:text-[#F3F1E7] hover:border-white/25"
        }`}
      >
        <Timer size={14} weight={slow ? "fill" : "regular"} />
        Slow
      </button>
      <span data-testid="tts-source-indicator" className="inline-flex items-center gap-1.5 text-xs font-mono-ipa text-[#A1A1AA]">
        <SpeakerHigh size={14} />
        {source === "elevenlabs" ? "ElevenLabs" : source === "browser" ? "Browser voice" : elKey ? "ElevenLabs ready" : "Browser fallback"}
      </span>
    </div>
  );
};
