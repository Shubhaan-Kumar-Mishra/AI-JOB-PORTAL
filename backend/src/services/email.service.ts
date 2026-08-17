import { Resend } from 'resend';
import { config } from '../config/env.js';
import { ApplicationStatus } from '../models/Application.js';
import {
  applicationSubmittedHtml,
  applicationSubmittedText,
  ApplicationSubmittedTemplateData,
} from '../emails/applicationSubmitted.js';
import {
  applicationStatusUpdatedHtml,
  applicationStatusUpdatedText,
  StatusUpdatedTemplateData,
} from '../emails/applicationStatusUpdated.js';

// ─── Email Send Result ────────────────────────────────────────────────────────
export interface EmailSendResult {
  sent: boolean;
  reason?: string; // Non-sensitive reason for logging. Never exposed to frontend.
}

// ─── Resend Client (lazy initialization) ─────────────────────────────────────
let resendClient: Resend | null = null;

function getResendClient(): Resend | null {
  if (!config.resendApiKey) {
    return null;
  }
  if (!resendClient) {
    resendClient = new Resend(config.resendApiKey);
  }
  return resendClient;
}

// ─── Validate email configuration ────────────────────────────────────────────
function isEmailConfigured(): boolean {
  return !!(config.resendApiKey && config.resendFromEmail);
}

// ─── Format date for emails ───────────────────────────────────────────────────
function formatEmailDate(date: Date): string {
  return date.toLocaleDateString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Kolkata',
  });
}

// ─── Safe log — never logs API key or user data content ──────────────────────
function safeLog(event: string, reason: string): void {
  console.warn(`[EmailService] ${event}: ${reason}`);
}

// ─── Send Application Confirmation Email ──────────────────────────────────────
/**
 * Sends a transactional application confirmation email.
 *
 * Idempotency key: application-created:{applicationId}
 * Email failure MUST NOT break the application creation — caller handles gracefully.
 *
 * Never sends to a recipient provided by the frontend — recipient comes only from
 * the authenticated user's MongoDB document.
 */
export async function sendApplicationConfirmationEmail(params: {
  recipientEmail: string;
  candidateName: string;
  applicationId: string;
  jobTitle: string;
  companyName: string;
  location: string;
  appliedAt: Date;
}): Promise<EmailSendResult> {
  if (!isEmailConfigured()) {
    safeLog('sendApplicationConfirmationEmail', 'Email service not configured (missing RESEND_API_KEY or RESEND_FROM_EMAIL)');
    return { sent: false, reason: 'email_not_configured' };
  }

  if (!params.recipientEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(params.recipientEmail)) {
    safeLog('sendApplicationConfirmationEmail', 'Skipped: no valid recipient email on user account');
    return { sent: false, reason: 'invalid_recipient' };
  }

  const client = getResendClient();
  if (!client) {
    safeLog('sendApplicationConfirmationEmail', 'Resend client unavailable');
    return { sent: false, reason: 'client_unavailable' };
  }

  const templateData: ApplicationSubmittedTemplateData = {
    candidateName: params.candidateName,
    jobTitle: params.jobTitle,
    companyName: params.companyName,
    location: params.location,
    appliedAt: formatEmailDate(params.appliedAt),
    applicationId: params.applicationId,
    frontendUrl: config.frontendUrl,
  };

  try {
    const result = await client.emails.send({
      from: `${config.resendFromName} <${config.resendFromEmail}>`,
      to: [params.recipientEmail],
      subject: `Application Submitted — ${params.jobTitle}`,
      html: applicationSubmittedHtml(templateData),
      text: applicationSubmittedText(templateData),
      headers: {
        'X-Idempotency-Key': `application-created:${params.applicationId}`,
      },
    });

    if (result.error) {
      safeLog('sendApplicationConfirmationEmail', `Resend API error: ${result.error.name}`);
      return { sent: false, reason: `resend_error:${result.error.name}` };
    }

    return { sent: true };
  } catch (err: any) {
    const reason = classifyResendError(err);
    safeLog('sendApplicationConfirmationEmail', `Exception: ${reason}`);
    return { sent: false, reason };
  }
}

// ─── Send Application Status Update Email ─────────────────────────────────────
/**
 * Sends a transactional status-change notification email.
 * Only called when oldStatus !== newStatus.
 *
 * Idempotency key: application-status:{applicationId}:{oldStatus}:{newStatus}
 * Email failure MUST NOT prevent the status update from being returned to the user.
 *
 * Never sends to a recipient provided by the frontend.
 */
export async function sendApplicationStatusEmail(params: {
  recipientEmail: string;
  candidateName: string;
  applicationId: string;
  jobTitle: string;
  companyName: string;
  oldStatus: ApplicationStatus;
  newStatus: ApplicationStatus;
  updatedAt: Date;
}): Promise<EmailSendResult> {
  if (!isEmailConfigured()) {
    safeLog('sendApplicationStatusEmail', 'Email service not configured');
    return { sent: false, reason: 'email_not_configured' };
  }

  if (!params.recipientEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(params.recipientEmail)) {
    safeLog('sendApplicationStatusEmail', 'Skipped: no valid recipient email on user account');
    return { sent: false, reason: 'invalid_recipient' };
  }

  // Guard: no email if status has not changed (belt-and-suspenders — caller should also check)
  if (params.oldStatus === params.newStatus) {
    return { sent: false, reason: 'status_unchanged' };
  }

  const client = getResendClient();
  if (!client) {
    safeLog('sendApplicationStatusEmail', 'Resend client unavailable');
    return { sent: false, reason: 'client_unavailable' };
  }

  const templateData: StatusUpdatedTemplateData = {
    candidateName: params.candidateName,
    jobTitle: params.jobTitle,
    companyName: params.companyName,
    oldStatus: params.oldStatus,
    newStatus: params.newStatus,
    updatedAt: formatEmailDate(params.updatedAt),
    applicationId: params.applicationId,
    frontendUrl: config.frontendUrl,
  };

  try {
    const result = await client.emails.send({
      from: `${config.resendFromName} <${config.resendFromEmail}>`,
      to: [params.recipientEmail],
      subject: `Application Status Updated — ${params.jobTitle}`,
      html: applicationStatusUpdatedHtml(templateData),
      text: applicationStatusUpdatedText(templateData),
      headers: {
        'X-Idempotency-Key': `application-status:${params.applicationId}:${params.oldStatus}:${params.newStatus}`,
      },
    });

    if (result.error) {
      safeLog('sendApplicationStatusEmail', `Resend API error: ${result.error.name}`);
      return { sent: false, reason: `resend_error:${result.error.name}` };
    }

    return { sent: true };
  } catch (err: any) {
    const reason = classifyResendError(err);
    safeLog('sendApplicationStatusEmail', `Exception: ${reason}`);
    return { sent: false, reason };
  }
}

// ─── Error classifier — surfaces non-sensitive descriptions ───────────────────
function classifyResendError(err: any): string {
  const msg: string = (err?.message || err?.toString() || '').toLowerCase();
  const status = err?.statusCode || err?.status || err?.response?.status;

  if (status === 401 || msg.includes('api key') || msg.includes('unauthorized')) {
    return 'resend_auth_error';
  }
  if (status === 422 || msg.includes('unverified') || msg.includes('not verified') || msg.includes('invalid sender') || msg.includes('sender')) {
    return 'resend_sender_unverified';
  }
  if (status === 429 || msg.includes('rate limit') || msg.includes('too many')) {
    return 'resend_rate_limited';
  }
  if (msg.includes('timeout') || msg.includes('etimedout')) {
    return 'resend_timeout';
  }
  if (msg.includes('network') || msg.includes('econnrefused') || msg.includes('fetch')) {
    return 'resend_network_error';
  }
  return 'resend_unknown_error';
}
