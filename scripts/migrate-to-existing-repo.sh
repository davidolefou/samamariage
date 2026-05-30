#!/usr/bin/env bash
# =============================================================================
# SamaMariage — migration vers le repo GitHub existant SANS casser la prod
# -----------------------------------------------------------------------------
# Réutilise ton repo actuel (garde son historique + son lien Vercel), mais
# pousse izikit sur une NOUVELLE branche. `main` (= prod) reste intacte.
# Vercel créera un déploiement PREVIEW pour cette branche.
#
# Usage (sur ton Mac, dans un terminal) :
#   chmod +x scripts/migrate-to-existing-repo.sh
#   ./scripts/migrate-to-existing-repo.sh git@github.com:TON_USER/TON_REPO.git
# =============================================================================
set -euo pipefail

# Repo par défaut = ton repo SamaMariage. Surcharge possible : passe une autre URL en argument.
REPO_URL="${1:-https://github.com/davidolefou/samamariage.git}"
BRANCH="migrate-izikit"
WORK="$HOME/Desktop/samamariage-app"
TMP="$(mktemp -d)"

echo "▶ Clonage du repo existant (historique + lien Vercel préservés)…"
git clone "$REPO_URL" "$TMP/repo"
cd "$TMP/repo"

echo "▶ Création de la branche '$BRANCH' (jamais main → prod intacte)…"
git checkout -b "$BRANCH"

echo "▶ Suppression de l'ancien contenu (sauf .git)…"
find . -mindepth 1 -maxdepth 1 ! -name '.git' -exec rm -rf {} +

echo "▶ Copie du projet izikit (sans node_modules / .next / secrets)…"
rsync -a \
  --exclude='node_modules' \
  --exclude='.next' \
  --exclude='.git' \
  --exclude='frontend/.env.local' \
  "$WORK"/ ./

echo "▶ Commit + push de la BRANCHE…"
git add -A
git commit -m "Migrate SamaMariage to izikit stack (landing + app)"
git push -u origin "$BRANCH"

echo ""
echo "✅ Terminé."
echo "   - Branche '$BRANCH' poussée → Vercel va créer un déploiement PREVIEW."
echo "   - La prod (main) reste INTACTE."
echo "   - ⚠️ VERCEL ROOT DIRECTORY : izikit met l'app dans frontend/. Règle"
echo "     Vercel → Settings → Build → Root Directory = 'frontend' (sinon build KO)."
echo "   - ⚠️ Les secrets (.env.local) ne sont PAS poussés : configure-les dans"
echo "     Vercel → Settings → Environment Variables (DATABASE_URL Neon, JWT_SECRET,"
echo "     ENCRYPTION_KEY, CRON_SECRET, APP_URL... PAS les vars Supabase de l'ancienne app)."
echo "   - Cutover plus tard = merge '$BRANCH' → main, puis re-pointer le domaine."
echo ""
echo "   Dossier temporaire de travail : $TMP/repo"
