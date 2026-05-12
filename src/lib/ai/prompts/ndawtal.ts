export function buildNdawtalParsingPrompt(message: string): string {
  return `Tu reçois un message court d'une mariée pour enregistrer un don ndawtal.

Message : "${message}"

Variations possibles à reconnaître :
- "Tata Bineta 50k" → 50 000 FCFA
- "Khadija 100k Diop" → Khadija Diop, 100 000 FCFA
- "Mamadou 25 000" → 25 000 FCFA
- "Cousin Ousmane 1 million" → 1 000 000 FCFA
- "Tata Awa 2M" → 2 000 000 FCFA
- "1 sac de riz de Fatou" → cadeau, pas cash

RÈGLES :
- "k" ou "K" = milliers (50k = 50 000)
- "m" ou "M" = millions (2M = 2 000 000)
- Si aucun montant détectable : type = "cadeau"
- confidence < 0.7 si le message est ambigu

Réponds UNIQUEMENT en JSON valide :
{
  "donor_name": "Tata Bineta",
  "amount_fcfa": 50000,
  "type": "cash",
  "gift_description": null,
  "confidence": 0.95,
  "needs_clarification": false,
  "clarification_question": null
}`
}
