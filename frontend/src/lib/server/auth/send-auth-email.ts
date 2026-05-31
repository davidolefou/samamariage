// SamaMariage — envoi SYNCHRONE des emails d'authentification (code de vérif,
// reset de mot de passe).
//
// Pourquoi synchrone : ces emails sont bloquants pour l'utilisateur et doivent
// arriver en quelques secondes. L'architecture outbox → cron de drain convient
// au non-urgent (confirmations de paiement, notifications), mais sur Vercel
// Hobby les crons sont quotidiens : un code de vérif n'attend pas 24h. On
// envoie donc directement via Resend ici, et on garde l'outbox pour le reste.
//
// Inerte sans RESEND_API_KEY / EMAIL_FROM : retourne `false` (loggé) au lieu de
// lever, pour que l'inscription réussisse même si l'email n'est pas configuré
// (l'utilisateur peut demander un renvoi une fois Resend posé).
import 'server-only';
import { createMailer } from '@/lib/server/email';
import { verificationEmail, resetPasswordEmail } from './email-templates';
import { log } from '@/lib/server/observability/log';

function getMailer() {
  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  const EMAIL_FROM = process.env.EMAIL_FROM;
  if (!RESEND_API_KEY || !EMAIL_FROM) return null;
  try {
    return createMailer({ RESEND_API_KEY, EMAIL_FROM });
  } catch {
    return null;
  }
}

export interface AuthEmailArgs {
  to: string;
  code: string;
  /** ISO-8601 d'expiration (pour le wording du TTL dans le template). */
  expiresAt: string;
}

/** Envoie le code de vérification d'email. Retourne true si envoyé. */
export async function sendVerificationCodeNow(args: AuthEmailArgs): Promise<boolean> {
  const mailer = getMailer();
  if (!mailer) {
    log.warn('auth email skipped (RESEND not configured)', { kind: 'verification_code' });
    return false;
  }
  const tpl = verificationEmail({ code: args.code, email: args.to, expiresAt: args.expiresAt });
  try {
    await mailer.send({ to: args.to, subject: tpl.subject, html: tpl.html, text: tpl.text });
    return true;
  } catch (err) {
    log.error('auth email send failed', {
      kind: 'verification_code',
      err: err instanceof Error ? err.message : String(err),
    });
    return false;
  }
}

/** Envoie le code de reset de mot de passe. Retourne true si envoyé. */
export async function sendPasswordResetNow(args: AuthEmailArgs): Promise<boolean> {
  const mailer = getMailer();
  if (!mailer) {
    log.warn('auth email skipped (RESEND not configured)', { kind: 'password_reset' });
    return false;
  }
  const tpl = resetPasswordEmail({ code: args.code, email: args.to, expiresAt: args.expiresAt });
  try {
    await mailer.send({ to: args.to, subject: tpl.subject, html: tpl.html, text: tpl.text });
    return true;
  } catch (err) {
    log.error('auth email send failed', {
      kind: 'password_reset',
      err: err instanceof Error ? err.message : String(err),
    });
    return false;
  }
}
