# CONTEXT — SamaMariage (migration vers izikit)

> Dossier de passation. À lire au début de toute nouvelle session de build.
> Décisions prises avec David, mai 2026.

## Le projet

**SamaMariage** — l'IA qui organise le mariage sénégalais (budget, prestataires,
ndawtal, tenues, invités). Marché : Afrique francophone (FCFA, mobile money, TVA 18 %).
Stratégie complète + briefing dans `~/Desktop/SAMA MARIAGE/SamaMariage-Kit-Complet/`.

## État actuel (point de départ) — CORRIGÉ après inspection du repo

- **EN PRODUCTION sur Vercel** (`samamariage.vercel.app`) : le repo GitHub
  `davidolefou/samamariage` = un Next.js 16 **Supabase + Drizzle + tRPC +
  PayDunya/Stripe**. Sprint 0 (setup) fait, 0 feature métier. **Décision : on
  l'abandonne au profit d'izikit** (cf. ci-dessous).
- Une vieille landing HTML statique existe aussi dans
  `~/Desktop/SAMA MARIAGE/Samamariage.com/` (artefact antérieur, pas la prod).
- **Design** : David a refait le design sur **Claude design**. Il fournira un
  lien / un export. C'est LA source de vérité visuelle pour la nouvelle version.

## Décision d'architecture

**Tout migrer vers izikit** : un seul projet Next.js 16 (ce dossier) qui contient
À LA FOIS la landing marketing ET l'app (auth, dashboard, modules). izikit
remplacera à terme la landing HTML actuelle.

- Base : fork propre d'izikit (43 routes API câblées : auth cookie/JWT/CSRF,
  admin, paiements Bictorys, webhooks, cron, uploads, notifications).
- **Paiements : Bictorys activé dès le MVP** (mobile money Sénégal — Wave,
  Orange Money). Env-gated, inerte tant que les clés ne sont pas remplies.

## Plan de migration SANS downtime

1. Construire izikit en local (landing depuis le design Claude + app + modules).
2. Déployer sur un **NOUVEAU projet Vercel** (preview `*.vercel.app`).
   → La landing HTML actuelle reste en ligne, intacte.
3. Valider la nouvelle version sur l'URL de preview.
4. **Cutover** (déclenché par David) : re-pointer samamariage.com vers le nouveau
   projet Vercel. Seule étape qui touche la prod. Zéro downtime.

## À faire par David (comptes — je ne peux pas les créer)

- [ ] Projet Neon (neon.tech) → remplir `DATABASE_URL` + `DIRECT_URL` dans
      `frontend/.env.local`.
- [ ] Sur le Mac : `pnpm install` → `pnpm db:migrate:deploy` → `pnpm dev`.
- [ ] Compte marchand Bictorys (sandbox d'abord) → remplir les `BICTORYS_*`.
- [ ] Fournir le lien / export du design Claude.
- [ ] Plus tard : nouveau projet Vercel + cutover du domaine.

## Déjà fait (par Claude)

- [x] Fork izikit copié ici, renommé `samamariage` dans `package.json`.
- [x] Secrets générés (`JWT_SECRET`, `ENCRYPTION_KEY`, `CRON_SECRET`) dans
      `frontend/.env.local`. Cookies préfixés `samamariage`. Bloc Bictorys en place.

## Prochaine étape

David fournit le design Claude → reproduire les écrans dans le stack izikit
(mobile-first), brancher sur l'auth/data/paiements existants, puis ajouter les
modèles Prisma métier (mariées, prestataires, budget, ndawtal, invités).
