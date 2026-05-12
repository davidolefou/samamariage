# DECISIONS TECHNIQUES

## 2026-05-12 — Choix Drizzle over Prisma
**Contexte** : Choisir un ORM pour Supabase/Postgres
**Décision** : Drizzle
**Raison** : Plus léger (pas de runtime generator), meilleur DX TypeScript, migrations SQL transparentes
**Impact** : Schemas TypeScript dans /lib/db/schema, migrations dans /supabase/migrations

## 2026-05-12 — Stack AI Gateway
**Contexte** : Centraliser les appels IA
**Décision** : Gateway maison (src/lib/ai/gateway.ts) avec cache Upstash Redis
**Raison** : Permet de switcher de modèle, cacher, logger les coûts par user
**Impact** : Tous les appels IA passent par ai.complete({task, ...})

## 2026-05-12 — Paiements : PayDunya pour local, Stripe pour diaspora
**Contexte** : Accepter Wave + Orange Money + carte
**Décision** : PayDunya (Wave, OM, Visa local) + Stripe (Visa international diaspora)
**Impact** : lib/payments/paydunya.ts + lib/payments/stripe.ts

## 2026-05-12 — Routing : tRPC pour app, REST uniquement pour webhooks
**Contexte** : Architecture API
**Décision** : tRPC v11 pour toutes les mutations/queries, API Route uniquement pour webhooks Stripe/PayDunya/Twilio
**Impact** : src/lib/trpc/ pour les routers
