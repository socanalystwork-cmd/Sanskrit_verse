"""End-to-end API tests for Sanskrit Verse Teacher backend.

Covers:
- /api/health smoke
- /api/analyze happy paths (Devanagari + IAST)
- /api/analyze validation (empty, >500 chars)
- Verse-level IPA determinism spot-check (namaḥ)
- /api/tts error paths (missing key, invalid key)
"""
import os
import pytest
import requests

BASE_URL = os.environ['REACT_APP_BACKEND_URL'].rstrip('/')
API = f"{BASE_URL}/api"

# LLM calls can take 15-60s per the review request
LLM_TIMEOUT = 120


@pytest.fixture(scope="module")
def session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


# -------- Health --------
class TestHealth:
    def test_health_ok(self, session):
        r = session.get(f"{API}/health", timeout=15)
        assert r.status_code == 200
        assert r.json() == {"status": "ok"}


# -------- Analyze happy paths --------
class TestAnalyze:
    def test_analyze_devanagari(self, session):
        r = session.post(f"{API}/analyze", json={"text": "धर्मो रक्षति रक्षितः"}, timeout=LLM_TIMEOUT)
        assert r.status_code == 200, r.text
        data = r.json()
        # top-level shape
        assert data["script"] == "devanagari"
        assert isinstance(data["ipa"], str) and len(data["ipa"]) > 0
        assert isinstance(data["iast"], str) and len(data["iast"]) > 0
        assert isinstance(data["translation"], str) and len(data["translation"]) > 0
        assert 0.0 <= data["overall_confidence"] <= 1.0
        assert isinstance(data["words"], list) and len(data["words"]) > 0
        # per-word shape
        w = data["words"][0]
        for key in ("surface", "iast", "sandhi_split", "meaning", "grammar",
                    "confidence", "low_confidence", "ipa"):
            assert key in w, f"missing key {key} in word: {w}"
        assert isinstance(w["sandhi_split"], list)
        for key in ("pos", "tags", "root"):
            assert key in w["grammar"]
        assert isinstance(w["grammar"]["tags"], list)
        assert 0.0 <= w["confidence"] <= 1.0
        assert isinstance(w["low_confidence"], bool)
        assert isinstance(w["ipa"], str)

    def test_analyze_iast(self, session):
        r = session.post(f"{API}/analyze", json={"text": "asato mā sad gamaya"}, timeout=LLM_TIMEOUT)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["script"] == "iast"
        assert isinstance(data["translation"], str) and len(data["translation"]) > 0
        assert isinstance(data["words"], list) and len(data["words"]) > 0


# -------- Analyze validation --------
class TestAnalyzeValidation:
    def test_empty_text_rejected(self, session):
        r = session.post(f"{API}/analyze", json={"text": ""}, timeout=15)
        assert r.status_code == 422

    def test_over_500_chars_rejected(self, session):
        r = session.post(f"{API}/analyze", json={"text": "a" * 501}, timeout=15)
        assert r.status_code == 422


# -------- IPA determinism spot-check (does NOT invoke LLM directly, uses /analyze->ipa field) --------
class TestIpaDeterminism:
    def test_namah_verse_ipa(self, session):
        # spot-check per review request: verse-level ipa for 'नमः' should be 'n̪ɐmɐhɐ'
        r = session.post(f"{API}/analyze", json={"text": "नमः"}, timeout=LLM_TIMEOUT)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["script"] == "devanagari"
        assert data["ipa"] == "n̪ɐmɐhɐ", f"got ipa={data['ipa']!r}"
        assert data["iast"] == "namaḥ"


# -------- TTS error paths (no real ElevenLabs key available) --------
class TestTTS:
    def test_tts_missing_key_returns_400(self, session):
        # No X-ElevenLabs-Key header
        r = requests.post(
            f"{API}/tts",
            json={"text": "namaḥ"},
            headers={"Content-Type": "application/json"},
            timeout=30,
        )
        assert r.status_code == 400
        detail = r.json().get("detail", "")
        assert "key" in detail.lower()

    def test_tts_invalid_key_returns_401(self, session):
        r = requests.post(
            f"{API}/tts",
            json={"text": "namaḥ"},
            headers={
                "Content-Type": "application/json",
                "X-ElevenLabs-Key": "sk_fake123",
            },
            timeout=60,
        )
        assert r.status_code == 401, f"got {r.status_code}: {r.text}"
        assert r.json().get("detail") == "Invalid ElevenLabs API key"
