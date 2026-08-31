from enum import Enum
from typing import List, Optional
from pydantic import BaseModel, Field


class Discipline(str, Enum):
    MATHEMATICS = "Mathématiques"
    PHYSICS = "Physique"
    CHEMISTRY = "Chimie"
    BIOLOGY = "Biologie"
    COMPUTER_SCIENCE = "Informatique"
    GEOGRAPHY = "Géographie scientifique"
    GEOLOGY = "Géologie"
    STATISTICS = "Statistiques"
    ENGINEERING = "Sciences de l'ingénieur"


class LearningLevel(str, Enum):
    PRIMARY = "Primaire"
    SECONDARY = "Secondaire"
    COLLEGE = "Collégial"
    UNIVERSITY = "Universitaire"
    SPECIALIZED = "Formations spécialisées"


class ContentType(str, Enum):
    FORMULA = "Formule"
    EQUATION = "Équation"
    THEOREM = "Théorème"
    HYPOTHESIS = "Hypothèse"
    DEFINITION = "Définition"


class EntryStatus(str, Enum):
    DRAFT = "draft"
    PENDING_REVIEW = "pending_review"
    ACTIVE = "active"
    ARCHIVED = "archived"
    DELETED = "deleted"


class EntryOrigin(str, Enum):
    MANUAL = "manual"
    AI = "ai"


class Exercise(BaseModel):
    id: str
    type: str  # "guided" | "autonomous"
    question: str
    steps: Optional[List[str]] = None
    solution: str
    difficulty: str  # "easy" | "medium" | "hard"


class EntryDocument(BaseModel):
    """Represents a scientific entry document in MongoDB."""
    id: Optional[str] = Field(default=None, alias="_id")
    title: str
    discipline: Discipline
    sub_discipline: Optional[str] = None
    level: LearningLevel
    type: ContentType
    definition: str
    statement: str        # LaTeX formatted
    context: str = ""
    examples: List[str] = Field(default_factory=list)
    exercises: List[Exercise] = Field(default_factory=list)
    keywords: List[str] = Field(default_factory=list)
    references: List[str] = Field(default_factory=list)
    related_ids: List[str] = Field(default_factory=list)
    last_modified_by: Optional[str] = None   # user ID
    created_by: Optional[str] = None          # user ID
    created_at: int = 0    # Unix ms
    updated_at: int = 0    # Unix ms
    status: EntryStatus = EntryStatus.DRAFT
    origin: EntryOrigin = EntryOrigin.MANUAL
    version: int = 1

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
