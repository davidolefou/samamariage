export function buildBudgetSystemPrompt(): string {
  return `Tu es expert en organisation de mariages au Sénégal avec 20 ans d'expérience.
Tu connais les prix réels du marché dakarois et des villes secondaires (Thiès, Saint-Louis, Ziguinchor).

RÈGLES STRICTES :
1. Postes obligatoires : lieu, traiteur, décoration, tenues mariés, tenues groupe (ndaxal), photo/vidéo, animations, papeterie/invitations, transport, cola/dot
2. Garde toujours 10% du budget pour les imprévus (contingency)
3. Donne une fourchette basse-haute réaliste par poste
4. Justifie chaque ventilation en 1 phrase concrète
5. Si budget < 3 000 000 FCFA : optimise pour le strict nécessaire, pas de postes luxe
6. Si budget > 15 000 000 FCFA : ajoute drone, wedding planner, fleurs importées, photobooth
7. Haute saison (décembre-février) : majore traiteur +15%, lieu +10%
8. Pour Dakar : lieu = 20-25% du budget
9. Pour Thiès/Saint-Louis : lieu = 15-18% du budget
10. Calcul traiteur : budget_traiteur = nb_invités × (2500 à 5000 FCFA selon standing)

RÉPONDS UNIQUEMENT EN JSON VALIDE. Pas de texte avant ou après le JSON.`
}

export function buildBudgetUserPrompt(params: {
  budgetTotal: number
  guestCount: number
  city: string
  style: string
  ceremonies: string[]
}): string {
  return `Génère une ventilation budgétaire détaillée pour ce mariage :

- Budget total : ${params.budgetTotal.toLocaleString('fr-SN')} FCFA
- Nombre d'invités : ${params.guestCount}
- Ville : ${params.city}
- Style : ${params.style}
- Cérémonies : ${params.ceremonies.join(', ')}

Réponds avec ce JSON exact :
{
  "categories": [
    {
      "name": "Lieu de réception",
      "amount_min": 2000000,
      "amount_max": 3000000,
      "amount_recommended": 2500000,
      "percentage": 25,
      "justification": "Une salle aux Almadies pour 400 invités tourne autour de 2.5M",
      "tips": ["Réserver 8 mois à l'avance", "Demander si nappes et chaises incluses"]
    }
  ],
  "total_planned": 10000000,
  "contingency": 1000000,
  "warnings": ["Budget serré pour 500 invités, considère réduire à 400"]
}`
}

export function buildBudgetInsightsPrompt(params: {
  categories: Array<{ name: string; amountRecommended: number; amountSpent: number }>
  totalPlanned: number
  totalSpent: number
}): string {
  const lines = params.categories.map(c =>
    `- ${c.name}: prévu ${c.amountRecommended.toLocaleString()} FCFA, dépensé ${c.amountSpent.toLocaleString()} FCFA`
  ).join('\n')

  return `Voici le budget actuel de la mariée :

${lines}
Total prévu: ${params.totalPlanned.toLocaleString()} FCFA
Total dépensé: ${params.totalSpent.toLocaleString()} FCFA

Donne 5 conseils d'optimisation personnalisés et concrets pour ce budget.
Réponds en JSON : { "insights": ["conseil 1", "conseil 2", ...] }`
}
