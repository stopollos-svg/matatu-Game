
import { GoogleGenAI } from "@google/genai";
import { Card, Suit, Rank } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const COMMENTARY_SYSTEM_INSTRUCTION = `
You are an expert player of the Ugandan card game "Matatu". 
Rules:
- 2 is a "Kick Back" (Next player draws 2).
- 8 is "Skip" (Next player loses turn).
- Jack is "Wild" (Changes suit).
- The goal is to finish cards first.

Persona:
You are "Semsa", a witty, slightly sassy, but friendly Ugandan card shark commentator. 
You use short, punchy sentences. 
You occasionally use Ugandan slang like "Eh!", "Bambi", or "Wamma".
Your job is to react to the player's moves or the game state.
Keep responses under 15 words.
`;

const HINT_SYSTEM_INSTRUCTION = `
You are a strategic "Matatu" coach.
Analyze the hand and the top card to suggest the best move.
Strategy:
- If valid moves list is provided, ONLY recommend a card from that list.
- If no valid moves, recommend drawing.
- Save Jacks for when you can't match suit/rank to change the flow.
- Use 8s to skip opponent if you have a combo.
- Use 2s to penalize opponent or stack penalties.
- Otherwise match suit or rank.
Keep the hint extremely concise (under 20 words).
`;

export const getAICommentary = async (
  action: 'play' | 'draw' | 'win' | 'lose' | 'penalty' | 'skip',
  card?: Card,
  playerHandSize?: number
): Promise<string> => {
  try {
    let prompt = "";
    
    if (action === 'win') {
      prompt = "The player just won the game against you. React with shock or begrudging respect.";
    } else if (action === 'lose') {
      prompt = "You (the AI) just won the game. Gloat playfully.";
    } else if (action === 'penalty') {
      prompt = "The player just had to draw penalty cards because of a Two. Mock them gently.";
    } else if (action === 'play' && card) {
      if (card.rank === Rank.Two) prompt = "The player just played a Two (Draw 2) on you. React with indignation.";
      else if (card.rank === Rank.Eight) prompt = "The player just played an Eight (Skip) on you. Complain about waiting.";
      else if (card.rank === Rank.Jack) prompt = "The player played a Jack to change the suit. Comment on their strategy.";
      else if (playerHandSize === 1) prompt = "The player has only one card left! Panic!";
      else return ""; // Don't comment on every normal move
    } else if (action === 'draw') {
        prompt = "The player had to draw a card because they had no moves. Tease them.";
    }

    if (!prompt) return "";

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: COMMENTARY_SYSTEM_INSTRUCTION,
        temperature: 0.9,
      }
    });

    return response.text || "";
  } catch (error) {
    console.error("AI Commentary Error", error);
    return "";
  }
};

export const getAIHint = async (
  hand: Card[],
  topCard: Card,
  activeSuit: Suit | null,
  validMoves?: Card[]
): Promise<string> => {
  try {
    const handDesc = hand.map(c => `${c.rank} of ${c.suit}`).join(', ');
    const topDesc = `${topCard.rank} of ${topCard.suit}`;
    const suitDesc = activeSuit ? `Active suit is ${activeSuit}` : "No active suit override";
    
    let validMovesDesc = "Not calculated";
    if (validMoves) {
        if (validMoves.length === 0) validMovesDesc = "None (Must Draw)";
        else validMovesDesc = validMoves.map(c => `${c.rank} of ${c.suit}`).join(', ');
    }

    const prompt = `
    Current Game State:
    - Top of Discard Pile: ${topDesc}
    - ${suitDesc}
    - My Hand: ${handDesc}
    - Legal Moves: ${validMovesDesc}

    Task: Suggest the ONE best move for me from the Legal Moves. If Legal Moves is "None", tell me to draw.
    Explain strategy briefly (e.g. "Save the Jack", "Stack the Two", "Change suit to Hearts").
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: HINT_SYSTEM_INSTRUCTION,
        temperature: 0.5, 
      }
    });

    return response.text || "Try drawing a card if you're stuck.";
  } catch (error) {
    return "The spirits are silent. Trust your gut.";
  }
};
