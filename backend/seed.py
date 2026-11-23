"""
Script de seed — Scientia Registry
===================================
Insère les entrées de référence (issues de constants.tsx) dans MongoDB.

Usage (depuis le dossier backend/) :
    python seed.py                    # insère en base, ne touche pas aux doublons
    python seed.py --reset            # vide la collection entries avant d'insérer
    python seed.py --admin-only       # crée/confirme seulement le compte admin
"""

import asyncio
import sys
import time
import argparse
from typing import Optional

from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
import bcrypt

# ── Configuration ──────────────────────────────────────────────────────────────
# On réutilise directement les settings de l'application.
import os
os.chdir(os.path.dirname(os.path.abspath(__file__)))   # garantit que .env est trouvé

from config import settings   # noqa: E402  (import après chdir)

# ── Données source (transcription de constants.tsx) ────────────────────────────
NOW_MS = int(time.time() * 1000)

# Clés : ID temporaire utilisé pour construire related_ids (résolu après insertion)
RAW_ENTRIES = [
    {
        "_seed_id": "1",
        "title": "Théorème de Pythagore",
        "discipline": "Mathématiques",
        "sub_discipline": "Géométrie Euclidienne",
        "level": "Secondaire",
        "type": "Théorème",
        "definition": (
            "Dans un triangle rectangle, le carré de la longueur de l'hypoténuse "
            "est égal à la somme des carrés des longueurs des deux autres côtés."
        ),
        "statement": "a^2 + b^2 = c^2",
        "context": "Utilisé pour calculer des distances dans un espace euclidien bidimensionnel.",
        "examples": [
            "Calcul de la diagonale d'un écran de 15×20 cm.",
            "Vérification de l'orthogonalité d'un mur lors d'une construction.",
        ],
        "exercises": [
            {
                "id": "ex1-1",
                "type": "guided",
                "question": (
                    "Soit un triangle rectangle ABC en A. "
                    "Si AB = 3 et AC = 4, calculez BC."
                ),
                "steps": [
                    "Identifiez l'hypoténuse (BC).",
                    r"Appliquez la formule : $BC^2 = AB^2 + AC^2$",
                    r"Remplacez les valeurs : $BC^2 = 3^2 + 4^2 = 9 + 16 = 25$",
                    "Extrayez la racine carrée.",
                ],
                "solution": "BC = 5",
                "difficulty": "easy",
            }
        ],
        "keywords": ["Triangle", "Hypoténuse", "Géométrie"],
        "references": ["Éléments d'Euclide, Livre I"],
        "_related_seed_ids": ["3"],
        "status": "active",
        "origin": "manual",
        "version": 1,
    },
    {
        "_seed_id": "2",
        "title": "Loi de la Gravitation Universelle",
        "discipline": "Physique",
        "sub_discipline": "Mécanique Classique",
        "level": "Collégial",
        "type": "Formule",
        "definition": (
            "Deux corps massifs s'attirent avec une force proportionnelle au produit "
            "de leurs masses et inversement proportionnelle au carré de la distance "
            "qui les sépare."
        ),
        "statement": r"F = G \frac{m_1 m_2}{r^2}",
        "context": "Indispensable en astrophysique pour calculer les orbites planétaires.",
        "examples": [
            "Calcul de la force d'attraction entre la Terre et la Lune.",
            "Explication de la chute libre d'un objet à la surface terrestre.",
        ],
        "exercises": [
            {
                "id": "ex2-1",
                "type": "autonomous",
                "question": "Comment la force varie-t-elle si la distance entre deux corps est doublée ?",
                "steps": None,
                "solution": "La force est divisée par 4 (loi en carré inverse).",
                "difficulty": "medium",
            }
        ],
        "keywords": ["Gravité", "Newton", "Masse"],
        "references": ["Philosophiae Naturalis Principia Mathematica (1687)"],
        "_related_seed_ids": ["4"],
        "status": "active",
        "origin": "manual",
        "version": 1,
    },
    {
        "_seed_id": "7",
        "title": "Système Linéaire 2×2",
        "discipline": "Mathématiques",
        "sub_discipline": "Algèbre Linéaire",
        "level": "Secondaire",
        "type": "Équation",
        "definition": (
            "Un ensemble d'équations linéaires partageant les mêmes variables. "
            "La solution est le point d'intersection des droites correspondantes."
        ),
        "statement": r"\begin{cases} ax + by = e \\ cx + dy = f \end{cases}",
        "context": (
            "Utilisé pour modéliser des problèmes de collision, "
            "d'équilibre économique ou de mélanges chimiques."
        ),
        "examples": [
            "Détermination du point de rencontre de deux mobiles.",
            "Calcul des quantités de réactifs dans une solution tampon.",
        ],
        "exercises": [
            {
                "id": "ex7-1",
                "type": "guided",
                "question": r"Résolvez le système : $\begin{cases} x + y = 10 \\ x - y = 2 \end{cases}$",
                "steps": [
                    "Additionnez les deux lignes pour éliminer y.",
                    "Obtenez 2x = 12 donc x = 6.",
                    "Substituez x dans la première ligne pour trouver y.",
                ],
                "solution": "x = 6, y = 4",
                "difficulty": "medium",
            }
        ],
        "keywords": ["Algèbre", "Système", "Linéaire"],
        "references": ["Algèbre de base"],
        "_related_seed_ids": [],
        "status": "active",
        "origin": "manual",
        "version": 1,
    },
    {
        "_seed_id": "8",
        "title": "Synthèse de l'Eau",
        "discipline": "Chimie",
        "sub_discipline": "Thermodynamique Chimique",
        "level": "Secondaire",
        "type": "Équation",
        "definition": (
            "Réaction d'oxydo-réduction exothermique produisant de l'eau "
            "à partir de dihydrogène et de dioxygène."
        ),
        "statement": r"2\,\text{H}_2 + \text{O}_2 \rightarrow 2\,\text{H}_2\text{O}",
        "context": (
            "Réaction fondamentale utilisée dans les piles à combustible "
            "pour produire de l'énergie propre."
        ),
        "examples": [
            "Combustion du dihydrogène dans un moteur à fusée.",
            "Production d'électricité dans une cellule de propulsion spatiale.",
        ],
        "exercises": [
            {
                "id": "ex8-1",
                "type": "guided",
                "question": "Équilibrez la réaction de combustion du méthane.",
                "steps": [
                    "Écrivez les réactifs : CH₄ + O₂.",
                    "Écrivez les produits : CO₂ + H₂O.",
                    "Comptez les atomes de Carbone, puis d'Hydrogène, puis d'Oxygène.",
                ],
                "solution": r"\ce{CH4 + 2O2 -> CO2 + 2H2O}",
                "difficulty": "medium",
            }
        ],
        "keywords": ["Chimie", "Réaction", "H₂O"],
        "references": ["Principes de Chimie Moderne"],
        "_related_seed_ids": [],
        "status": "active",
        "origin": "manual",
        "version": 1,
    },
    {
        "_seed_id": "9",
        "title": "Intégrale de Gauss",
        "discipline": "Mathématiques",
        "sub_discipline": "Analyse Mathématique",
        "level": "Universitaire",
        "type": "Formule",
        "definition": (
            "L'intégrale de la fonction gaussienne sur toute la droite réelle. "
            "C'est un résultat fondamental en statistique et en théorie des probabilités."
        ),
        "statement": r"\int_{-\infty}^{+\infty} e^{-x^2} \, \mathrm{d}x = \sqrt{\pi}",
        "context": (
            "Utilisée pour normaliser la loi normale (courbe en cloche) "
            "et dans de nombreux domaines de la physique (diffusion, chaleur)."
        ),
        "examples": [
            "Calcul de la constante de normalisation d'une distribution normale.",
            "Calcul des amplitudes de transition en mécanique quantique.",
        ],
        "exercises": [
            {
                "id": "ex9-1",
                "type": "autonomous",
                "question": r"Calculez l'intégrale de Gauss pour $e^{-ax^2}$ où $a > 0$.",
                "steps": None,
                "solution": (
                    r"En effectuant le changement de variable $u = \sqrt{a}\,x$, "
                    r"on obtient $\sqrt{\pi / a}$."
                ),
                "difficulty": "hard",
            }
        ],
        "keywords": ["Gauss", "Analyse", "Intégrale", "Probabilités"],
        "references": ["Euler, L. (1729)", "Gauss, C.F. (1809)"],
        "_related_seed_ids": ["6"],   # entrée future (non insérée ici, related_id ignoré)
        "status": "active",
        "origin": "manual",
        "version": 1,
    },
]


# ── Helpers ────────────────────────────────────────────────────────────────────

def build_doc(raw: dict, admin_id: str, seed_id_to_mongo: dict) -> dict:
    """Construit le document MongoDB final à partir de la définition brute."""
    related = [
        seed_id_to_mongo[sid]
        for sid in raw.get("_related_seed_ids", [])
        if sid in seed_id_to_mongo
    ]
    exercises = []
    for ex in raw.get("exercises", []):
        exercises.append({
            "id": ex["id"],
            "type": ex["type"],
            "question": ex["question"],
            "steps": ex.get("steps"),
            "solution": ex["solution"],
            "difficulty": ex["difficulty"],
        })
    return {
        "title": raw["title"],
        "discipline": raw["discipline"],
        "sub_discipline": raw.get("sub_discipline"),
        "level": raw["level"],
        "type": raw["type"],
        "definition": raw["definition"],
        "statement": raw["statement"],
        "context": raw.get("context", ""),
        "examples": raw.get("examples", []),
        "exercises": exercises,
        "keywords": raw.get("keywords", []),
        "references": raw.get("references", []),
        "related_ids": related,
        "last_modified_by": admin_id,
        "created_by": admin_id,
        "created_at": NOW_MS,
        "updated_at": NOW_MS,
        "status": raw["status"],
        "origin": raw["origin"],
        "version": raw["version"],
    }


async def ensure_admin(db) -> Optional[str]:
    """Crée un compte admin de seed s'il n'existe pas. Retourne l'ID string."""
    coll = db["users"]
    existing = await coll.find_one({"email": "seed@scientia.app"})
    if existing:
        print(f"[seed] Admin de seed déjà présent (_id={existing['_id']})")
        return str(existing["_id"])

    hashed = bcrypt.hashpw(b"SeedAdmin2024!", bcrypt.gensalt()).decode()
    doc = {
        "name": "Seed Admin",
        "email": "seed@scientia.app",
        "hashed_password": hashed,
        "role": "admin",
        "favorites": [],
        "progress": {},
        "created_at": NOW_MS,
        "updated_at": NOW_MS,
        "is_active": True,
    }
    result = await coll.insert_one(doc)
    print(f"[seed] Admin de seed créé (_id={result.inserted_id})")
    return str(result.inserted_id)


async def seed(reset: bool = False, admin_only: bool = False) -> None:
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    db = client[settings.MONGODB_DB]

    try:
        # 1. Compte admin
        admin_id = await ensure_admin(db)

        if admin_only:
            print("[seed] Mode --admin-only : terminé.")
            return

        entries_coll = db["entries"]

        # 2. Reset optionnel
        if reset:
            deleted = await entries_coll.delete_many({})
            print(f"[seed] Collection 'entries' vidée ({deleted.deleted_count} docs supprimés).")

        # 3. Première passe : insertion sans related_ids (pour obtenir les _id Mongo)
        seed_id_to_mongo: dict[str, str] = {}
        inserted_ids: list[str] = []

        for raw in RAW_ENTRIES:
            sid = raw["_seed_id"]
            # Vérifie doublon sur le titre pour éviter de réinsérer
            existing = await entries_coll.find_one({"title": raw["title"]})
            if existing:
                mongo_id = str(existing["_id"])
                print(f"[seed] Doublon ignoré : «{raw['title']}» (_id={mongo_id})")
                seed_id_to_mongo[sid] = mongo_id
                continue

            doc = build_doc(raw, admin_id, {})   # related_ids vide en première passe
            result = await entries_coll.insert_one(doc)
            mongo_id = str(result.inserted_id)
            seed_id_to_mongo[sid] = mongo_id
            inserted_ids.append(mongo_id)
            print(f"[seed] Inséré : «{raw['title']}» (_id={mongo_id})")

        # 4. Deuxième passe : mise à jour des related_ids
        for raw in RAW_ENTRIES:
            sid = raw["_seed_id"]
            related = [
                seed_id_to_mongo[rsid]
                for rsid in raw.get("_related_seed_ids", [])
                if rsid in seed_id_to_mongo
            ]
            if related and sid in seed_id_to_mongo:
                await entries_coll.update_one(
                    {"_id": ObjectId(seed_id_to_mongo[sid])},
                    {"$set": {"related_ids": related}},
                )
                print(f"[seed] related_ids mis à jour pour «{raw['title']}» → {related}")

        print(f"\n[seed] ✅ Terminé — {len(inserted_ids)} entrée(s) insérée(s).")

    finally:
        client.close()


# ── Point d'entrée ─────────────────────────────────────────────────────────────

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Seed Scientia Registry")
    parser.add_argument(
        "--reset",
        action="store_true",
        help="Vide la collection 'entries' avant d'insérer.",
    )
    parser.add_argument(
        "--admin-only",
        action="store_true",
        dest="admin_only",
        help="Crée/confirme uniquement le compte admin de seed.",
    )
    args = parser.parse_args()

    asyncio.run(seed(reset=args.reset, admin_only=args.admin_only))
