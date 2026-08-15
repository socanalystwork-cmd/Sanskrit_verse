import { PenNib } from "@phosphor-icons/react";

const SAMPLES = [
  { label: "धर्मो रक्षति रक्षितः", text: "धर्मो रक्षति रक्षितः" },
  { label: "asato mā sad gamaya", text: "asato mā sad gamaya tamaso mā jyotir gamaya" },
  { label: "योगश्चित्तवृत्तिनिरोधः", text: "योगश्चित्तवृत्तिनिरोधः" },
];

export const VerseInput = ({ value, onChange, onAnalyze, loading, script }) => (
  <div className="bg-[#121215] border border-[#27272A] rounded-xl p-6 md:p-8">
    <div className="flex items-center justify-between mb-4">
      <span className="text-xs font-mono-ipa uppercase tracking-[0.2em] text-[#A1A1AA]">Enter a verse</span>
      <span
        data-testid="script-badge"
        className="text-[11px] font-mono-ipa uppercase tracking-wider px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-[#E27B58]"
      >
        {value.trim() ? (script === "devanagari" ? "Devanagari" : "IAST") : "auto-detect"}
      </span>
    </div>
    <textarea
      data-testid="verse-input"
      value={value}
      onChange={(e) => onChange(e.target.value.slice(0, 500))}
      placeholder={"धर्मो रक्षति रक्षितः  ·  or  ·  dharmo rakṣati rakṣitaḥ"}
      rows={4}
      className="w-full resize-y min-h-[120px] bg-transparent font-serif-display font-deva text-2xl md:text-3xl leading-loose text-[#F3F1E7] placeholder:text-[#A1A1AA]/40 placeholder:text-xl focus:outline-none"
    />
    <div className="flex flex-wrap items-center justify-between gap-4 mt-4 pt-4 border-t border-[#27272A]">
      <div className="flex flex-wrap gap-2">
        {SAMPLES.map((s, i) => (
          <button
            key={i}
            data-testid={`sample-verse-${i}`}
            onClick={() => onChange(s.text)}
            className="text-xs font-deva px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-[#A1A1AA] hover:text-[#F3F1E7] hover:border-white/25 transition-colors duration-150"
          >
            {s.label}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-4">
        <span data-testid="char-counter" className={`text-xs font-mono-ipa ${value.length >= 500 ? "text-[#EF4444]" : "text-[#A1A1AA]"}`}>
          {value.length}/500
        </span>
        <button
          data-testid="analyze-btn"
          onClick={onAnalyze}
          disabled={loading || !value.trim()}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#E27B58] hover:bg-[#C96544] disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold transition-[background-color,transform] duration-150 hover:scale-[1.03] focus:ring-2 focus:ring-[#E27B58]/60"
        >
          <PenNib size={16} weight="fill" />
          {loading ? "Analyzing…" : "Analyze"}
        </button>
      </div>
    </div>
  </div>
);
