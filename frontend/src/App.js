import { useState, useMemo } from "react";
import "@/App.css";
import axios from "axios";
import { Toaster } from "sonner";
import { BookOpenText, Warning } from "@phosphor-icons/react";
import { VerseInput } from "./components/VerseInput";
import { WordCard } from "./components/WordCard";
import { SettingsDialog } from "./components/SettingsDialog";
import { AudioControls } from "./components/AudioControls";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const detectScript = (t) => (/[\u0900-\u097F]/.test(t) ? "devanagari" : "iast");

const ConfidenceMeter = ({ value }) => {
  const pct = Math.round(value * 100);
  const color = value >= 0.8 ? "#4ADE80" : value >= 0.6 ? "#F59E0B" : "#EF4444";
  return (
    <div data-testid="overall-confidence" className="flex items-center gap-3">
      <span className="text-xs font-mono-ipa uppercase tracking-wider text-[#A1A1AA]">Confidence</span>
      <div className="w-28 h-1.5 rounded-full bg-white/10 overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
      <span className="text-xs font-mono-ipa" style={{ color }}>{pct}%</span>
    </div>
  );
};

function App() {
  const [verse, setVerse] = useState("");
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [elKey, setElKey] = useState("");
  const [elVoice, setElVoice] = useState("");

  const script = useMemo(() => detectScript(verse), [verse]);

  const analyze = async () => {
    setLoading(true);
    setError(null);
    setAnalysis(null);
    try {
      const res = await axios.post(`${API}/analyze`, { text: verse.trim() });
      setAnalysis(res.data);
    } catch (e) {
      setError(e.response?.data?.detail === "Analysis unavailable" ? "unavailable" : "generic");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-[#0A0A0C]">
      <img src="https://images.unsplash.com/photo-1648717008621-ee7e6acfe270" alt="" className="paper-texture" />
      <Toaster theme="dark" position="bottom-right" />

      <div className="relative z-10 max-w-5xl mx-auto px-6 md:px-12 py-12 md:py-20">
        <header className="flex flex-wrap items-start justify-between gap-6 mb-14 fade-up">
          <div>
            <div className="flex items-center gap-3 text-[#E27B58]">
              <BookOpenText size={22} weight="duotone" />
              <span className="text-xs font-mono-ipa uppercase tracking-[0.3em]">Chandas</span>
            </div>
            <h1 className="mt-3 font-serif-display font-light tracking-tight text-4xl sm:text-5xl lg:text-6xl text-[#F3F1E7]">
              Sanskrit Verse Teacher
            </h1>
            <p className="mt-3 text-base text-[#A1A1AA] max-w-lg">
              Paste a verse in Devanagari or IAST — get word-by-word grammar, an English translation, and a chanting-accurate phonetic guide.
            </p>
          </div>
          <SettingsDialog elKey={elKey} elVoice={elVoice} onSave={(k, v) => { setElKey(k); setElVoice(v); }} />
        </header>

        <div className="fade-up" style={{ animationDelay: "0.1s" }}>
          <VerseInput value={verse} onChange={setVerse} onAnalyze={analyze} loading={loading} script={script} />
        </div>

        {loading && (
          <div data-testid="loading-state" className="mt-16 flex flex-col items-start gap-3">
            <div className="h-8 w-2/3 bg-white/5 rounded animate-pulse" />
            <div className="h-4 w-1/2 bg-white/5 rounded animate-pulse" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full mt-6">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-44 bg-white/5 rounded-lg animate-pulse" />
              ))}
            </div>
          </div>
        )}

        {error && (
          <div data-testid="error-state" className="mt-16 relative overflow-hidden rounded-xl border border-[#27272A]">
            <img
              src="https://images.unsplash.com/photo-1463134836706-8bcc60f7d78b"
              alt=""
              className="absolute inset-0 w-full h-full object-cover opacity-20"
              style={{ maskImage: "linear-gradient(to bottom, black, transparent)" }}
            />
            <div className="relative p-10 md:p-14">
              <Warning size={28} className="text-[#F59E0B]" />
              <h2 className="mt-4 font-serif-display text-3xl font-light text-[#F3F1E7]">
                {error === "unavailable" ? "Analysis unavailable" : "Something went wrong"}
              </h2>
              <p className="mt-2 text-sm text-[#A1A1AA] max-w-md">
                {error === "unavailable"
                  ? "The verse could not be reliably analyzed — rather than guess, we stopped. Try simplifying the verse or checking the transliteration."
                  : "Please check your connection and try again."}
              </p>
            </div>
          </div>
        )}

        {analysis && (
          <section data-testid="analysis-result" className="mt-16 space-y-12">
            <div className="fade-up">
              <p className="font-serif-display font-deva text-3xl md:text-4xl lg:text-5xl leading-loose text-[#F3F1E7]">
                {verse.trim()}
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-6">
                <AudioControls text={verse.trim()} elKey={elKey} elVoice={elVoice} />
                <ConfidenceMeter value={analysis.overall_confidence} />
              </div>
            </div>

            <div className="fade-up border-l-2 border-[#E27B58]/50 pl-6">
              <span className="text-xs font-mono-ipa uppercase tracking-[0.2em] text-[#A1A1AA]">Translation</span>
              <p data-testid="translation-text" className="mt-2 font-serif-display text-2xl md:text-3xl font-light leading-relaxed text-[#F3F1E7]">
                {analysis.translation}
              </p>
            </div>

            <div className="fade-up bg-[#121215] border border-[#27272A] rounded-xl p-6 md:p-8">
              <span className="text-xs font-mono-ipa uppercase tracking-[0.2em] text-[#A1A1AA]">
                Chanting guide · IPA · full schwa retention
              </span>
              <p data-testid="ipa-line" className="mt-3 font-mono-ipa text-lg md:text-xl text-[#E27B58] leading-relaxed break-words">
                /{analysis.ipa}/
              </p>
              {analysis.script === "devanagari" && (
                <p className="mt-2 font-mono-ipa text-sm text-[#A1A1AA]">{analysis.iast}</p>
              )}
            </div>

            <div>
              <span className="text-xs font-mono-ipa uppercase tracking-[0.2em] text-[#A1A1AA]">Word by word</span>
              <div data-testid="word-grid" className="mt-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {analysis.words.map((w, i) => (
                  <WordCard key={i} word={w} index={i} />
                ))}
              </div>
            </div>
          </section>
        )}

        {!analysis && !loading && !error && (
          <p className="mt-16 text-sm text-[#A1A1AA]/60 fade-up" style={{ animationDelay: "0.2s" }}>
            Try one of the sample verses above, or paste your own — up to 500 characters.
          </p>
        )}
      </div>
    </div>
  );
}

export default App;
