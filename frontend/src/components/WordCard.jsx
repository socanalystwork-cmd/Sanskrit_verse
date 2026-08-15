import { motion } from "framer-motion";

export const WordCard = ({ word, index }) => {
  const lowConf = word.low_confidence;
  return (
    <motion.div
      data-testid={`word-card-${index}`}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4 }}
      className={`relative bg-[#121215] border rounded-lg p-6 hover:-translate-y-1 hover:border-white/30 transition-[transform,border-color] duration-200 ${
        lowConf ? "border-t-2 border-t-[#F59E0B] border-x-[#27272A] border-b-[#27272A]" : "border-[#27272A]"
      }`}
    >
      {lowConf && (
        <span
          data-testid={`low-confidence-badge-${index}`}
          className="absolute top-4 right-4 inline-flex items-center gap-1.5 text-[10px] font-mono-ipa uppercase tracking-wider text-[#F59E0B]"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B]" />
          uncertain
        </span>
      )}
      <p className="font-serif-display font-deva text-2xl text-[#F3F1E7] leading-relaxed">{word.surface}</p>
      {word.sandhi_split && word.sandhi_split.length > 1 && (
        <p className="mt-1 font-mono-ipa text-xs text-[#E27B58] tracking-wide">
          {word.sandhi_split.join(" + ")}
        </p>
      )}
      <p className="mt-3 text-sm text-[#A1A1AA] leading-relaxed">{word.meaning}</p>
      {word.ipa && (
        <p className="mt-3 font-mono-ipa text-sm text-[#F3F1E7]/80">/{word.ipa}/</p>
      )}
      <div className="mt-4 flex flex-wrap gap-1.5">
        {word.grammar?.pos && (
          <span className="text-[11px] font-mono-ipa tracking-wider uppercase px-2 py-0.5 rounded-full bg-[#4ADE80]/10 border border-[#4ADE80]/25 text-[#4ADE80]">
            {word.grammar.pos}
          </span>
        )}
        {(word.grammar?.tags || []).map((t, i) => (
          <span
            key={i}
            className="text-[11px] font-mono-ipa tracking-wider uppercase px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[#A1A1AA]"
          >
            {t}
          </span>
        ))}
        {word.grammar?.root && (
          <span className="text-[11px] font-mono-ipa tracking-wider uppercase px-2 py-0.5 rounded-full bg-[#60A5FA]/10 border border-[#60A5FA]/25 text-[#60A5FA]">
            √{word.grammar.root}
          </span>
        )}
      </div>
    </motion.div>
  );
};
