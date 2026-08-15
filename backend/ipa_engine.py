"""Deterministic Sanskrit -> IPA engine with full schwa retention (chanting style)."""
import unicodedata
import re

DEVA_INDEP_VOWELS = {'अ': 'a', 'आ': 'ā', 'इ': 'i', 'ई': 'ī', 'उ': 'u', 'ऊ': 'ū',
                     'ऋ': 'ṛ', 'ॠ': 'ṝ', 'ऌ': 'ḷ', 'ॡ': 'ḹ', 'ए': 'e', 'ऐ': 'ai',
                     'ओ': 'o', 'औ': 'au'}
DEVA_MATRAS = {'ा': 'ā', 'ि': 'i', 'ी': 'ī', 'ु': 'u', 'ू': 'ū', 'ृ': 'ṛ', 'ॄ': 'ṝ',
               'ॢ': 'ḷ', 'ॣ': 'ḹ', 'े': 'e', 'ै': 'ai', 'ो': 'o', 'ौ': 'au'}
DEVA_CONSONANTS = {'क': 'k', 'ख': 'kh', 'ग': 'g', 'घ': 'gh', 'ङ': 'ṅ',
                   'च': 'c', 'छ': 'ch', 'ज': 'j', 'झ': 'jh', 'ञ': 'ñ',
                   'ट': 'ṭ', 'ठ': 'ṭh', 'ड': 'ḍ', 'ढ': 'ḍh', 'ण': 'ṇ',
                   'त': 't', 'थ': 'th', 'द': 'd', 'ध': 'dh', 'न': 'n',
                   'प': 'p', 'फ': 'ph', 'ब': 'b', 'भ': 'bh', 'म': 'm',
                   'य': 'y', 'र': 'r', 'ल': 'l', 'व': 'v',
                   'श': 'ś', 'ष': 'ṣ', 'स': 's', 'ह': 'h', 'ळ': 'ḻ'}
VIRAMA, ANUSVARA, VISARGA, CANDRABINDU, AVAGRAHA = '्', 'ं', 'ः', 'ँ', 'ऽ'

VOWELS_IPA = {'a': 'ɐ', 'ā': 'ɑː', 'i': 'i', 'ī': 'iː', 'u': 'u', 'ū': 'uː',
              'ṛ': 'r̩', 'ṝ': 'r̩ː', 'ḷ': 'l̩', 'ḹ': 'l̩ː', 'e': 'eː', 'ai': 'ɐi',
              'o': 'oː', 'au': 'ɐu'}
CONS_IPA = {'kh': 'kʰ', 'gh': 'ɡʱ', 'ch': 't͡ɕʰ', 'jh': 'd͡ʑʱ', 'ṭh': 'ʈʰ',
            'ḍh': 'ɖʱ', 'th': 't̪ʰ', 'dh': 'd̪ʱ', 'ph': 'pʰ', 'bh': 'bʱ',
            'k': 'k', 'g': 'ɡ', 'ṅ': 'ŋ', 'c': 't͡ɕ', 'j': 'd͡ʑ', 'ñ': 'ɲ',
            'ṭ': 'ʈ', 'ḍ': 'ɖ', 'ṇ': 'ɳ', 't': 't̪', 'd': 'd̪', 'n': 'n̪',
            'p': 'p', 'b': 'b', 'm': 'm', 'y': 'j', 'r': 'ɾ', 'l': 'l',
            'v': 'ʋ', 'ś': 'ɕ', 'ṣ': 'ʂ', 's': 's', 'h': 'ɦ', 'ḻ': 'ɭ'}
ECHO_VOWEL = {'a': 'ɐ', 'ā': 'ɑ', 'i': 'i', 'ī': 'i', 'u': 'u', 'ū': 'u',
              'ṛ': 'r̩', 'ṝ': 'r̩', 'e': 'e', 'ai': 'i', 'o': 'o', 'au': 'u',
              'ḷ': 'l̩', 'ḹ': 'l̩'}

DEVA_RANGE = re.compile(r'[\u0900-\u097F]')
STRIP_CHARS = re.compile(r"[।॥|,.;:!?\"()\[\]0-9०-९‘’“”-]")


def detect_script(text: str) -> str:
    return 'devanagari' if DEVA_RANGE.search(text) else 'iast'


def devanagari_to_iast(text: str) -> str:
    text = unicodedata.normalize('NFC', text)
    out, pending = [], None

    def flush_a():
        nonlocal pending
        if pending is not None:
            out.append(pending + 'a')
            pending = None

    for ch in text:
        if ch in DEVA_CONSONANTS:
            flush_a()
            pending = DEVA_CONSONANTS[ch]
        elif ch in DEVA_MATRAS:
            if pending is not None:
                out.append(pending + DEVA_MATRAS[ch])
                pending = None
            else:
                out.append(DEVA_MATRAS[ch])
        elif ch in DEVA_INDEP_VOWELS:
            flush_a()
            out.append(DEVA_INDEP_VOWELS[ch])
        elif ch == VIRAMA:
            if pending is not None:
                out.append(pending)
                pending = None
        elif ch in (ANUSVARA, CANDRABINDU):
            flush_a()
            out.append('ṃ')
        elif ch == VISARGA:
            flush_a()
            out.append('ḥ')
        elif ch == AVAGRAHA:
            flush_a()
            out.append("'")
        elif ch in '।॥':
            flush_a()
        else:
            flush_a()
            out.append(ch)
    flush_a()
    return ''.join(out)


def iast_word_to_ipa(word: str) -> str:
    word = unicodedata.normalize('NFC', word.strip().lower())
    ipa, i, last_vowel = [], 0, None
    while i < len(word):
        two = word[i:i + 2]
        if two in ('ai', 'au'):
            ipa.append(VOWELS_IPA[two])
            last_vowel = two
            i += 2
            continue
        if two in CONS_IPA:
            ipa.append(CONS_IPA[two])
            i += 2
            continue
        ch = word[i]
        if ch in VOWELS_IPA:
            ipa.append(VOWELS_IPA[ch])
            last_vowel = ch
        elif ch in CONS_IPA:
            ipa.append(CONS_IPA[ch])
        elif ch == 'ḥ':
            ipa.append('h' + ECHO_VOWEL.get(last_vowel, 'ɐ'))
        elif ch in ('ṃ', 'ṁ'):
            ipa.append('m̐')
        i += 1
    return ''.join(ipa)


def to_ipa(text: str) -> dict:
    script = detect_script(text)
    iast = devanagari_to_iast(text) if script == 'devanagari' else unicodedata.normalize('NFC', text)
    clean = STRIP_CHARS.sub(' ', iast)
    words = [w for w in clean.split() if w]
    ipa = ' '.join(iast_word_to_ipa(w) for w in words)
    return {'script': script, 'iast': ' '.join(words), 'ipa': ipa}
