import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

from ipa_engine import to_ipa, iast_word_to_ipa, devanagari_to_iast, detect_script


def test_namah_iast():
    assert iast_word_to_ipa("namaḥ") == "n̪ɐmɐhɐ"


def test_namah_devanagari():
    r = to_ipa("नमः")
    assert r["script"] == "devanagari"
    assert r["iast"] == "namaḥ"
    assert r["ipa"] == "n̪ɐmɐhɐ"


def test_schwa_retention_yoga():
    assert to_ipa("योग")["ipa"] == "joːɡɐ"


def test_dharma():
    assert iast_word_to_ipa("dharma") == "d̪hɐɾmɐ"


def test_visarga_echo_after_i():
    assert iast_word_to_ipa("śāntiḥ") == "ɕɑːn̪t̪ihi"


def test_conjunct_virama():
    assert devanagari_to_iast("धर्मो रक्षति रक्षितः") == "dharmo rakṣati rakṣitaḥ"


def test_anusvara():
    assert iast_word_to_ipa("saṃsāra") == "sɐm̐sɑːɾɐ"


def test_diphthongs():
    assert iast_word_to_ipa("gau") == "ɡɐu"
    assert iast_word_to_ipa("vai") == "ʋɐi"


def test_retroflex():
    assert iast_word_to_ipa("kṛṣṇa") == "kr̩ʂɳɐ"


def test_script_detection():
    assert detect_script("namaḥ śivāya") == "iast"
    assert detect_script("नमः शिवाय") == "devanagari"


def test_danda_stripped():
    r = to_ipa("नमः शिवाय ॥")
    assert "॥" not in r["ipa"]
    assert r["iast"] == "namaḥ śivāya"


def test_iast_no_devanagari_roundtrip():
    r = to_ipa("asato mā sad gamaya")
    assert r["script"] == "iast"
    assert r["iast"] == "asato mā sad gamaya"
