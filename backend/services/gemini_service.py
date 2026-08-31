"""
Gemini AI service — runs entirely server-side.
The API key never reaches the browser.
"""
from typing import Optional
import google.generativeai as genai
from config import settings

# Configure once at import time
genai.configure(api_key=settings.GEMINI_API_KEY)
_MODEL = "gemini-2.0-flash"


def _get_model() -> genai.GenerativeModel:
    return genai.GenerativeModel(_MODEL)


async def get_ai_explanation(
    title: str,
    entry_type: str,
    discipline: str,
    definition: str,
    statement: str,
    user_level: str,
    detail: str,
) -> str:
    detail_instructions = {
        "Simple": "Vulgarisez au maximum. Utilisez des analogies simples et évitez le jargon.",
        "Détaillé": "Fournissez une explication complète avec contexte historique et analyse étape par étape.",
        "Expert": "Analyse rigoureuse incluant preuves mathématiques abrégées, cas limites et liens avec la recherche avancée.",
    }
    instruction = detail_instructions.get(detail, detail_instructions["Détaillé"])

    prompt = f"""En tant qu'expert en pédagogie scientifique, expliquez ce concept à un étudiant de niveau {user_level}.
Niveau de détail : {detail}
Instruction : {instruction}

Concept : {title} ({entry_type})
Discipline : {discipline}
Définition : {definition}
Énoncé formel : {statement}

RÈGLES :
1. RIGUEUR ABSOLUE — refusez si le concept n'est pas scientifique.
2. Utilisez LaTeX pour toute formule mathématique.
3. Répondez en Français avec du Markdown."""

    try:
        model = _get_model()
        response = model.generate_content(prompt)
        return response.text or ""
    except Exception as e:
        raise RuntimeError(f"Gemini explanation error: {e}") from e


async def generate_scientific_entry(
    raw_input: str,
    discipline: Optional[str] = None,
    level: Optional[str] = None,
) -> Optional[dict]:
    prompt = f"""En tant qu'architecte de la connaissance scientifique, transformez l'entrée suivante en objet JSON structuré.

ENTRÉE : "{raw_input}"
DISCIPLINE SUGGÉRÉE : {discipline or "À identifier"}
NIVEAU CIBLE : {level or "À identifier"}

INSTRUCTIONS :
1. Générez définitions et énoncés exacts. Utilisez LaTeX pour les maths.
2. Remplissez : title, discipline, level, type, definition, statement, context, examples, exercises, keywords.
3. Exercices : au moins un exercice guidé avec étapes et solution.
4. Si non-scientifique, renvoyez null.

Répondez UNIQUEMENT avec un objet JSON valide."""

    try:
        model = genai.GenerativeModel(
            _MODEL,
            generation_config={"response_mime_type": "application/json"},
        )
        response = model.generate_content(prompt)
        import json
        return json.loads(response.text)
    except Exception as e:
        raise RuntimeError(f"Gemini generation error: {e}") from e


async def suggest_related_concepts(
    title: str,
    definition: str,
    all_titles: list[str],
) -> list[str]:
    prompt = f"""En tant qu'architecte de la connaissance scientifique, analysez ce concept :
Titre : {title}
Définition : {definition}

Parmi cette liste de titres, lesquels sont les plus pertinents ?
{", ".join(all_titles)}

Renvoyez UNIQUEMENT un tableau JSON de titres (max 3)."""

    try:
        model = genai.GenerativeModel(
            _MODEL,
            generation_config={"response_mime_type": "application/json"},
        )
        response = model.generate_content(prompt)
        import json
        result = json.loads(response.text)
        return result if isinstance(result, list) else []
    except Exception as e:
        raise RuntimeError(f"Gemini suggestion error: {e}") from e
