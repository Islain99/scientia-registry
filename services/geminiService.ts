
import { GoogleGenAI, Type } from "@google/genai";
import { ScientificEntry, LearningLevel, DetailLevel, Discipline, ContentType, EntryStatus, EntryOrigin } from "../types";

/**
 * Pedagogical AI Service
 */

export const getAIExplanation = async (entry: ScientificEntry, userLevel: LearningLevel, detail: DetailLevel) => {
const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });
  
  const detailInstruction = {
    [DetailLevel.SIMPLE]: "Vulgarisez au maximum. Utilisez des analogies simples et évitez le jargon complexe. Concentrez-vous sur l'intuition.",
    [DetailLevel.DETAILED]: "Fournissez une explication complète avec le contexte historique, les implications et une analyse étape par étape de l'énoncé.",
    [DetailLevel.EXPERT]: "Proposez une analyse rigoureuse, incluant des preuves mathématiques abrégées, des cas limites et des liens avec des concepts de recherche avancés."
  }[detail];

  const prompt = `
    En tant qu'expert en pédagogie scientifique, expliquez le concept suivant à un étudiant de niveau ${userLevel}.
    Niveau de détail souhaité : ${detail}
    Instruction spécifique : ${detailInstruction}

    Concept: ${entry.title} (${entry.type})
    Discipline: ${entry.discipline}
    Définition: ${entry.definition}
    Énoncé formel: ${entry.statement}
    
    RÈGLES CRITIQUES :
    1. RIGUEUR ABSOLUE : Si le concept n'est pas scientifique, refusez poliment d'expliquer.
    2. NOTATION : Utilisez LaTeX pour toute formule mathématique.
    3. PAS DE SPÉCULATION : Restez dans le cadre des faits scientifiques établis.

    Fournissez une explication claire et rigoureuse. Répondez en Français et formatez avec du Markdown.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt,
    });
    const text = response.text || "";

    if (text.toLowerCase().includes("non-scientifique") || text.toLowerCase().includes("désolé") && text.length < 100) {
      console.warn("AI rejected the query based on safety/scientific scope guidelines.");
    }

    return text;
  } catch (error: any) {
    console.error("AI Explanation Error:", error);
    return "Une erreur technique est survenue lors de la génération de l'explication IA.";
  }
};

/**
 * Generate a complete ScientificEntry structure from raw input
 */
export const generateScientificEntry = async (input: string, discipline?: Discipline, level?: LearningLevel): Promise<Partial<ScientificEntry> | null> => {
  const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });
  
  const prompt = `
    En tant qu'architecte de la connaissance scientifique, transformez l'entrée suivante en un objet structuré conforme au registre Scientia.
    
    ENTRÉE BRUTE: "${input}"
    DISCIPLINE SUGGÉRÉE: ${discipline || "À identifier"}
    NIVEAU CIBLE: ${level || "À identifier"}

    INSTRUCTIONS:
    1. RIGUEUR: Générez des définitions et énoncés exacts. Utilisez LaTeX pour les mathématiques.
    2. STRUCTURE: Remplissez tous les champs requis (titre, discipline, level, type, definition, statement, context, examples, exercises, keywords).
    3. EXERCICES: Générez au moins un exercice guidé avec des étapes claires et une solution.
    4. SÉCURITÉ: Si l'entrée est non-scientifique ou inappropriée, renvoyez null.

    Répondez UNIQUEMENT avec un objet JSON.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            discipline: { type: Type.STRING },
            subDiscipline: { type: Type.STRING },
            level: { type: Type.STRING },
            type: { type: Type.STRING },
            definition: { type: Type.STRING },
            statement: { type: Type.STRING },
            context: { type: Type.STRING },
            examples: { type: Type.ARRAY, items: { type: Type.STRING } },
            exercises: { 
              type: Type.ARRAY, 
              items: { 
                type: Type.OBJECT,
                properties: {
                  type: { type: Type.STRING },
                  question: { type: Type.STRING },
                  steps: { type: Type.ARRAY, items: { type: Type.STRING } },
                  solution: { type: Type.STRING },
                  difficulty: { type: Type.STRING }
                }
              }
            },
            keywords: { type: Type.ARRAY, items: { type: Type.STRING } },
            references: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["title", "discipline", "level", "type", "definition", "statement", "context", "examples", "exercises", "keywords"]
        }
      }
    });

    const data = JSON.parse(response.text);
    return {
      ...data,
      origin: EntryOrigin.AI,
      status: EntryStatus.PENDING_REVIEW,
      version: 1,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
  } catch (error) {
    console.error("AI Generation Error:", error);
    return null;
  }
};

export const suggestRelatedConcepts = async (entry: ScientificEntry, allTitles: string[]) => {
  const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });
  
  const prompt = `
    En tant qu'architecte de la connaissance scientifique, analysez le concept suivant :
    Titre: ${entry.title}
    Définition: ${entry.definition}
    
    Parmi cette liste de titres disponibles dans notre base, lesquels sont les plus pertinents à lier ?
    Liste des titres: ${allTitles.join(", ")}
    
    Renvoyez uniquement un tableau JSON contenant les titres les plus pertinents. Maximum 3 suggestions.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      }
    });
    const jsonStr = response.text || "[]";
    return JSON.parse(jsonStr) as string[];
  } catch (error) {
    console.error("AI Suggestion Error:", error);
    return [];
  }
};
