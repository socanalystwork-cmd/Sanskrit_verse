# PRD — Sanskrit Verse Teacher / Translator ("Chandas")

## Original Problem Statement
Web app that takes a Sanskrit verse (Devanagari or IAST, 500-char cap), produces word-by-word grammatical analysis with English translation, and a chanting-accurate IPA phonetic guide with audio playback. LLM: GPT 5.6 Sol via Universal Key. TTS: ElevenLabs (user's own key at runtime, header-only, memory-only, never logged) with browser SpeechSynthesis fallback. Deterministic Python IPA engine with full schwa retention; no Devanagari roundtrip for IAST inputs. Low-confidence flagging per word + overall confidence. LLM failure: one stricter-prompt retry, then "Analysis unavailable". Stateless MVP: no auth, no persistence (MongoDB reserved for v2).

## User Choices
- GPT 5.6 Sol via Universal Key
- ElevenLabs: user pastes API key + optional Voice ID (default deep voice: Adam pNInz6obpgDQGcFmaJgB)
- Design: designer's choice → "Scholarly Obsidian" dark theme (Cormorant Garamond / Manrope / JetBrains Mono, terracotta accent)

## Architecture
- **Backend** (FastAPI, /app/backend):
  - `ipa_engine.py` — deterministic Devanagari→IAST→IPA and direct IAST→IPA; full schwa retention, visarga echo vowel (namaḥ → n̪ɐmɐhɐ), anusvāra, retroflex/dental distinctions, diphthongs, danda stripping
  - `server.py` — `GET /api/health`, `POST /api/analyze` (gpt-5.6-sol via emergentintegrations, strict JSON schema, 1 retry with stricter prompt → 502 "Analysis unavailable"), `POST /api/tts` (ElevenLabs proxy, key via `X-ElevenLabs-Key` header, never logged/persisted)
  - Tests: `tests/test_ipa.py` (12), `tests/test_api.py` (8) — all passing
- **Frontend** (React CRA, /app/frontend/src):
  - `App.js` — orchestration, translation, IPA line, confidence meter, error/loading states
  - `components/VerseInput.jsx` (500-char cap, script auto-detect badge, sample chips), `WordCard.jsx` (grammar tags, sandhi split, per-word IPA, low-confidence badge), `SettingsDialog.jsx` (ElevenLabs key + voice ID, React state only), `AudioControls.jsx` (ElevenLabs playback + SpeechSynthesis fallback)
- **MongoDB**: connected but unused (reserved v2)

## Implemented (June 2026 — MVP)
- [x] Deterministic IPA engine + 12 unit tests
- [x] /api/analyze with GPT 5.6 Sol, retry logic, confidence flags
- [x] /api/tts ElevenLabs proxy (memory-only key) + browser fallback
- [x] Full dark UI: input, word cards, IPA guide, audio controls, error states
- [x] E2E tested (iteration_1.json — 100% pass)

## Backlog
- P1: Verse history persistence (MongoDB) — v2
- P1: User accounts — v2
- P2: Per-word audio playback / highlight currently-spoken word
- P2: Verse meter (chandas) detection
- P2: Export analysis as PDF/image
