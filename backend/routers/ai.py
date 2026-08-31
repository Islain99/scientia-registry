from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from middleware.auth import get_current_user, require_permission
from models.user import UserDocument, Permission
from services import gemini_service

router = APIRouter()


# ── Request schemas ────────────────────────────────────────────────────────────

class ExplainRequest(BaseModel):
    title: str
    entry_type: str
    discipline: str
    definition: str
    statement: str
    user_level: str
    detail: str = "Détaillé"


class GenerateRequest(BaseModel):
    raw_input: str
    discipline: Optional[str] = None
    level: Optional[str] = None


class SuggestRequest(BaseModel):
    title: str
    definition: str
    all_titles: List[str]


# ── Routes ─────────────────────────────────────────────────────────────────────

@router.post("/explain")
async def explain(
    body: ExplainRequest,
    current_user: UserDocument = Depends(get_current_user),
):
    """
    Generate an AI explanation for a concept.
    Available to all authenticated users.
    """
    try:
        text = await gemini_service.get_ai_explanation(
            title=body.title,
            entry_type=body.entry_type,
            discipline=body.discipline,
            definition=body.definition,
            statement=body.statement,
            user_level=body.user_level,
            detail=body.detail,
        )
        return {"explanation": text}
    except RuntimeError as e:
        raise HTTPException(status_code=502, detail=str(e))


@router.post("/generate")
async def generate(
    body: GenerateRequest,
    current_user: UserDocument = Depends(require_permission(Permission.AI_ADVANCED)),
):
    """
    Generate a full ScientificEntry structure from raw text.
    Requires AI_ADVANCED permission (Teacher / Admin).
    """
    try:
        result = await gemini_service.generate_scientific_entry(
            raw_input=body.raw_input,
            discipline=body.discipline,
            level=body.level,
        )
        if result is None:
            raise HTTPException(
                status_code=422,
                detail="L'IA n'a pas pu structurer ce concept — vérifiez le contenu scientifique.",
            )
        return result
    except RuntimeError as e:
        raise HTTPException(status_code=502, detail=str(e))


@router.post("/suggest-related")
async def suggest_related(
    body: SuggestRequest,
    current_user: UserDocument = Depends(get_current_user),
):
    """
    Suggest related concept titles for a given entry.
    Available to all authenticated users.
    """
    try:
        suggestions = await gemini_service.suggest_related_concepts(
            title=body.title,
            definition=body.definition,
            all_titles=body.all_titles,
        )
        return {"suggestions": suggestions}
    except RuntimeError as e:
        raise HTTPException(status_code=502, detail=str(e))
