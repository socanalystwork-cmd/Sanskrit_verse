import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "../components/ui/dialog";
import { GearSix } from "@phosphor-icons/react";

export const SettingsDialog = ({ elKey, elVoice, onSave }) => {
  const [open, setOpen] = useState(false);
  const [keyDraft, setKeyDraft] = useState(elKey);
  const [voiceDraft, setVoiceDraft] = useState(elVoice);

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (o) { setKeyDraft(elKey); setVoiceDraft(elVoice); } }}>
      <DialogTrigger asChild>
        <button
          data-testid="elevenlabs-settings"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm text-[#A1A1AA] hover:text-[#F3F1E7] hover:border-white/25 transition-colors duration-150"
        >
          <GearSix size={16} />
          Voice settings
          <span className={`w-1.5 h-1.5 rounded-full ${elKey ? "bg-[#4ADE80]" : "bg-[#A1A1AA]/50"}`} />
        </button>
      </DialogTrigger>
      <DialogContent className="bg-black/70 backdrop-blur-xl border-white/10 text-[#F3F1E7] sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif-display text-2xl font-medium">ElevenLabs Voice</DialogTitle>
          <DialogDescription className="text-[#A1A1AA] text-sm">
            Your key lives only in this browser tab's memory — never stored, never logged. Without a key, the browser's built-in voice is used.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div>
            <label className="text-xs font-mono-ipa uppercase tracking-wider text-[#A1A1AA]">API Key</label>
            <input
              data-testid="elevenlabs-key-input"
              type="password"
              value={keyDraft}
              onChange={(e) => setKeyDraft(e.target.value)}
              placeholder="sk_…"
              className="mt-1.5 w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm font-mono-ipa focus:border-[#E27B58]/60 focus:ring-2 focus:ring-[#E27B58]/30"
            />
          </div>
          <div>
            <label className="text-xs font-mono-ipa uppercase tracking-wider text-[#A1A1AA]">Voice ID (optional)</label>
            <input
              data-testid="elevenlabs-voice-input"
              type="text"
              value={voiceDraft}
              onChange={(e) => setVoiceDraft(e.target.value)}
              placeholder="Defaults to a deep, calm voice"
              className="mt-1.5 w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm font-mono-ipa focus:border-[#E27B58]/60 focus:ring-2 focus:ring-[#E27B58]/30"
            />
          </div>
          <button
            data-testid="save-settings-btn"
            onClick={() => { onSave(keyDraft.trim(), voiceDraft.trim()); setOpen(false); }}
            className="w-full py-2.5 rounded-full bg-[#E27B58] hover:bg-[#C96544] text-white text-sm font-semibold transition-colors duration-150"
          >
            Save for this session
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
