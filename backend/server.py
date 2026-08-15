from fastapi import FastAPI, APIRouter, HTTPException, Header
from fastapi.responses import Response
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import json
import uuid
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ValidationError
from typing import List, Optional

from ipa_engine import to_ipa, iast_word_to_ipa

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

from emergentintegrations.llm.chat import LlmChat, UserMessage, TextDelta, StreamDone

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

DEFAULT_VOICE_ID = "pNInz6obpgDQGcFmaJgB"

SYSTEM_PROMPT = """You are an expert Sanskrit philologist. Analyze the given Sanskrit verse and return ONLY a valid JSON object (no markdown, no commentary) with this exact schema:
{
  "translation": "fluent English translation of the full verse",
  "overall_confidence": 0.0-1.0,
  "words": [
    {
      "surface": "word exactly as it appears in the verse",
      "iast": "IAST transliteration of the surface word (lowercase, standard diacritics)",
      "sandhi_split": ["component1", "component2"] (IAST, empty array if no sandhi),
      "meaning": "concise English meaning in this context",
      "grammar": {
        "pos": "noun|verb|adjective|pronoun|indeclinable|participle|etc",
        "tags": ["case", "number", "gender", "tense/person as applicable"],
        "root": "verbal/nominal root in IAST or null"
      },
      "confidence": 0.0-1.0,
      "low_confidence": true if the sandhi split or analysis is ambiguous
    }
  ]
}
Rules: split the verse into its surface words in order. Confidence below 0.7 means low_confidence true. Do not guess wildly; mark ambiguity honestly."""

STRICT_SYSTEM_PROMPT = SYSTEM_PROMPT + """
CRITICAL: Your previous response failed JSON validation. Return ONLY the raw JSON object starting with { and ending with }. No code fences, no explanation, every field present with correct types."""


class WordGrammar(BaseModel):
    pos: str = ""
    tags: List[str] = Field(default_factory=list)
    root: Optional[str] = None


class WordAnalysis(BaseModel):
    surface: str
    iast: str
    sandhi_split: List[str] = Field(default_factory=list)
    meaning: str
    grammar: WordGrammar = Field(default_factory=WordGrammar)
    confidence: float = 1.0
    low_confidence: bool = False
    ipa: str = ""


class VerseAnalysis(BaseModel):
    translation: str
    overall_confidence: float
    words: List[WordAnalysis]


class AnalyzeRequest(BaseModel):
    text: str = Field(min_length=1, max_length=500)


class TTSRequest(BaseModel):
    text: str = Field(min_length=1, max_length=600)
    voice_id: Optional[str] = None


async def call_llm(verse: str, system_message: str) -> str:
    chat = LlmChat(
        api_key=os.environ['EMERGENT_LLM_KEY'],
        session_id=str(uuid.uuid4()),
        system_message=system_message,
    ).with_model("openai", "gpt-5.6-sol")
    parts = []
    async for ev in chat.stream_message(UserMessage(text=f"Analyze this Sanskrit verse:\n{verse}")):
        if isinstance(ev, TextDelta):
            parts.append(ev.content)
        elif isinstance(ev, StreamDone):
            break
    return "".join(parts)


def parse_analysis(raw: str) -> VerseAnalysis:
    raw = raw.strip()
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
    start, end = raw.find("{"), raw.rfind("}")
    if start == -1 or end == -1:
        raise ValueError("no JSON object found")
    data = json.loads(raw[start:end + 1])
    return VerseAnalysis(**data)


@api_router.get("/health")
async def health():
    return {"status": "ok"}


@api_router.post("/analyze")
async def analyze(req: AnalyzeRequest):
    phonetics = to_ipa(req.text)
    analysis = None
    for attempt, system in enumerate([SYSTEM_PROMPT, STRICT_SYSTEM_PROMPT]):
        try:
            raw = await call_llm(req.text, system)
            analysis = parse_analysis(raw)
            break
        except (ValueError, ValidationError, json.JSONDecodeError) as e:
            logger.warning(f"LLM analysis attempt {attempt + 1} failed: {type(e).__name__}")
        except Exception as e:
            logger.error(f"LLM call error on attempt {attempt + 1}: {type(e).__name__}")
    if analysis is None:
        raise HTTPException(status_code=502, detail="Analysis unavailable")

    for w in analysis.words:
        w.confidence = max(0.0, min(1.0, w.confidence))
        if w.confidence < 0.7:
            w.low_confidence = True
        w.ipa = iast_word_to_ipa(w.iast)
    analysis.overall_confidence = max(0.0, min(1.0, analysis.overall_confidence))

    return {
        "script": phonetics["script"],
        "iast": phonetics["iast"],
        "ipa": phonetics["ipa"],
        "translation": analysis.translation,
        "overall_confidence": analysis.overall_confidence,
        "words": [w.model_dump() for w in analysis.words],
    }


def _el_error_message(e) -> Optional[str]:
    body = getattr(e, "body", None)
    if isinstance(body, dict):
        detail = body.get("detail")
        if isinstance(detail, dict):
            return detail.get("message") or detail.get("status")
        if isinstance(detail, str):
            return detail
    return None


@api_router.post("/tts")
async def tts(req: TTSRequest, x_elevenlabs_key: Optional[str] = Header(None)):
    if not x_elevenlabs_key:
        raise HTTPException(status_code=400, detail="ElevenLabs API key required")
    from elevenlabs.client import AsyncElevenLabs
    try:
        el_client = AsyncElevenLabs(api_key=x_elevenlabs_key)
        stream = el_client.text_to_speech.convert(
            text=req.text,
            voice_id=req.voice_id or DEFAULT_VOICE_ID,
            model_id="eleven_multilingual_v2",
        )
        audio = b""
        async for chunk in stream:
            audio += chunk
        if not audio:
            raise HTTPException(status_code=502, detail="TTS returned no audio")
        return Response(content=audio, media_type="audio/mpeg")
    except HTTPException:
        raise
    except Exception as e:
        status = getattr(e, "status_code", None)
        msg = _el_error_message(e)
        if not msg:
            msg = {401: "Invalid ElevenLabs API key", 403: "ElevenLabs key lacks permission",
                   422: "Invalid voice ID or request", 429: "ElevenLabs rate limit reached"}.get(status, "TTS generation failed")
        raise HTTPException(status_code=status if status and 400 <= status < 600 else 502, detail=msg)


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
