# MIGRATION — repo GitHub & prod Vercel (sans downtime)

## Situation (corrigée après inspection du repo)

- **Repo GitHub** `davidolefou/samamariage` = ce n'est PAS l'ancienne landing HTML.
  C'est un Next.js 16 **Supabase + Drizzle + tRPC + PayDunya/Stripe**, déployé sur
  `samamariage.vercel.app`. Seul le **Sprint 0 (setup)** est fait, 0 feature métier.
- **Décision (David)** : basculer sur **izikit** (Prisma + Neon + Bictorys + 43 routes
  déjà câblées). On abandonne la base Supabase/Drizzle/tRPC actuelle.
- **Objectif** : remplacer le contenu du repo par izikit, sans casser la prod.

> ⚠️ **Piège Vercel** : l'app actuelle a son `next` à la racine ; izikit le met dans
> `frontend/`. Avant le cutover, règle **Vercel → Settings → Build → Root Directory =
> `frontend`**. Et remplace les env vars Supabase par celles d'izikit (Neon).

## Principe de sécurité

On **réutilise le repo existant** (on garde son historique et son lien Vercel),
mais izikit part sur une **nouvelle branche** `migrate-izikit`. `main` reste la
prod tant qu'on n'a pas validé. Vercel déploie automatiquement un **preview** pour
la branche → on teste sur l'URL `*.vercel.app` sans toucher au site live.

## Procédure

### 1. Pousser izikit sur une branche (preview)

Sur ton Mac, dans `~/Desktop/samamariage-app` :

```bash
chmod +x scripts/migrate-to-existing-repo.sh
./scripts/migrate-to-existing-repo.sh <URL_DE_TON_REPO>
# ex : git@github.com:tonuser/samamariage.git
```

Le script clone le repo, crée la branche `migrate-izikit`, remplace le contenu par
izikit, et la pousse. **`main`/prod non touchée.**

### 2. Configurer les variables Vercel

Les secrets ne sont jamais poussés sur GitHub. Dans **Vercel → Settings →
Environment Variables**, ajoute (depuis `frontend/.env.local`) :
`DATABASE_URL`, `DIRECT_URL`, `JWT_SECRET`, `ENCRYPTION_KEY`, `CRON_SECRET`,
`APP_URL`, `COOKIE_PREFIX`, et les `BICTORYS_*` quand tu actives les paiements.

### 3. Valider le preview

Ouvre l'URL preview que Vercel génère pour la branche. Vérifie la landing + l'app.

### 4. Cutover (quand tu valides) — la SEULE étape qui touche la prod

```bash
git checkout main
git merge migrate-izikit
git push origin main
```

Vercel redéploie `main` avec izikit → le domaine sert la nouvelle version.
Si Vercel exige un changement de framework (Static → Next.js), fais-le dans les
Project Settings avant le merge.

### 5. Après cutover réussi

- Archiver l'ancienne landing locale : `~/Desktop/SAMA MARIAGE/Samamariage.com/`
  (la garder en backup jusque-là).
- Une seule source de vérité : ce repo ↔ `~/Desktop/samamariage-app`.

## Anti-doublons : qui garde quoi

| Emplacement | Rôle | Action |
|---|---|---|
| `~/Desktop/samamariage-app/` | LE projet (code) | source de vérité ↔ repo GitHub |
| `~/Desktop/SAAS/izikit/` | starter maître réutilisable | garder (template) |
| `~/Desktop/SAMA MARIAGE/SamaMariage-Kit-Complet/` | stratégie / briefing | garder (référence) |
| `~/Desktop/SAMA MARIAGE/Samamariage.com/` | ancienne landing | backup → archiver après cutover |
