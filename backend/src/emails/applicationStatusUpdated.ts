import { ApplicationStatus } from '../models/Application.js';

export interface StatusUpdatedTemplateData {
  candidateName: string;
  jobTitle: string;
  companyName: string;
  oldStatus: ApplicationStatus;
  newStatus: ApplicationStatus;
  updatedAt: string;
  applicationId: string;
  frontendUrl: string;
}

const STATUS_LABEL: Record<ApplicationStatus, string> = {
  applied: 'Applied',
  under_review: 'Under Review',
  interview: 'Interview',
  offer: 'Offer',
  rejected: 'Rejected',
};

const STATUS_COLOR: Record<ApplicationStatus, { bg: string; text: string; border: string }> = {
  applied:      { bg: '#3b82f61a', text: '#60a5fa', border: '#3b82f64d' },
  under_review: { bg: '#f59e0b1a', text: '#fbbf24', border: '#f59e0b4d' },
  interview:    { bg: '#8b5cf61a', text: '#a78bfa', border: '#8b5cf64d' },
  offer:        { bg: '#22c55e1a', text: '#4ade80', border: '#22c55e4d' },
  rejected:     { bg: '#ef44441a', text: '#f87171', border: '#ef44444d' },
};

/**
 * Generates a professional HTML email for application status change.
 * Contains NO sensitive data: no resume, no AI analysis, no API credentials.
 */
export function applicationStatusUpdatedHtml(data: StatusUpdatedTemplateData): string {
  const viewUrl = `${data.frontendUrl}/applications/${data.applicationId}`;
  const oldLabel = STATUS_LABEL[data.oldStatus] || data.oldStatus;
  const newLabel = STATUS_LABEL[data.newStatus] || data.newStatus;
  const newColor = STATUS_COLOR[data.newStatus] || STATUS_COLOR.applied;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Application Status Updated — ${escapeHtml(data.jobTitle)}</title>
  <style>
    body { margin: 0; padding: 0; background: #0f172a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #e2e8f0; }
    .wrapper { max-width: 560px; margin: 40px auto; padding: 0 16px; }
    .card { background: #1e293b; border: 1px solid #334155; border-radius: 16px; overflow: hidden; }
    .header { background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 32px 40px; text-align: center; }
    .logo { color: #ffffff; font-size: 20px; font-weight: 800; letter-spacing: -0.5px; margin: 0; }
    .logo span { color: #c4b5fd; }
    .body { padding: 40px; }
    .icon-wrap { text-align: center; margin-bottom: 24px; }
    .icon { display: inline-block; width: 56px; height: 56px; background: #6366f11a; border: 1px solid #6366f14d; border-radius: 50%; line-height: 56px; font-size: 28px; }
    h1 { color: #f8fafc; font-size: 22px; font-weight: 700; text-align: center; margin: 0 0 8px; }
    .subtitle { color: #94a3b8; font-size: 14px; text-align: center; margin: 0 0 32px; }
    .field-group { background: #0f172a; border: 1px solid #1e293b; border-radius: 12px; padding: 20px 24px; margin-bottom: 20px; }
    .field { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #1e293b4d; }
    .field:last-child { border-bottom: none; padding-bottom: 0; }
    .field-label { color: #64748b; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
    .field-value { color: #f1f5f9; font-size: 13px; font-weight: 600; text-align: right; max-width: 60%; }
    .status-row { display: flex; align-items: center; justify-content: center; gap: 16px; margin: 28px 0; }
    .status-badge { display: inline-block; padding: 5px 14px; border-radius: 20px; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
    .status-old { background: #1e293b; color: #94a3b8; border: 1px solid #334155; }
    .arrow { color: #6366f1; font-size: 18px; font-weight: 700; }
    .cta-wrap { text-align: center; margin: 32px 0 8px; }
    .cta { display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: #ffffff; text-decoration: none; border-radius: 10px; font-weight: 700; font-size: 14px; letter-spacing: 0.3px; }
    .footer { padding: 24px 40px; border-top: 1px solid #1e293b; text-align: center; }
    .footer-text { color: #475569; font-size: 12px; line-height: 1.6; margin: 0; }
    .footer-note { color: #334155; font-size: 11px; margin-top: 12px; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="card">
      <div class="header">
        <p class="logo">AI<span>JobPortal</span></p>
      </div>
      <div class="body">
        <div class="icon-wrap"><span class="icon">🔔</span></div>
        <h1>Application Status Updated</h1>
        <p class="subtitle">Hi ${escapeHtml(data.candidateName)}, your application status has changed.</p>

        <div class="field-group">
          <div class="field">
            <span class="field-label">Job</span>
            <span class="field-value">${escapeHtml(data.jobTitle)}</span>
          </div>
          <div class="field">
            <span class="field-label">Company</span>
            <span class="field-value">${escapeHtml(data.companyName)}</span>
          </div>
          <div class="field">
            <span class="field-label">Updated</span>
            <span class="field-value">${escapeHtml(data.updatedAt)}</span>
          </div>
        </div>

        <div class="status-row">
          <span class="status-badge status-old">${escapeHtml(oldLabel)}</span>
          <span class="arrow">→</span>
          <span class="status-badge" style="background:${newColor.bg};color:${newColor.text};border:1px solid ${newColor.border}">${escapeHtml(newLabel)}</span>
        </div>

        <div class="cta-wrap">
          <a href="${viewUrl}" class="cta">View Application</a>
        </div>
      </div>
      <div class="footer">
        <p class="footer-text">
          This is an automated notification from AI Job Portal.<br />
          Track and manage all your applications in one place.
        </p>
        <p class="footer-note">AI Job Portal — AI-powered career management</p>
      </div>
    </div>
  </div>
</body>
</html>`;
}

export function applicationStatusUpdatedText(data: StatusUpdatedTemplateData): string {
  const viewUrl = `${data.frontendUrl}/applications/${data.applicationId}`;
  const oldLabel = STATUS_LABEL[data.oldStatus] || data.oldStatus;
  const newLabel = STATUS_LABEL[data.newStatus] || data.newStatus;

  return `AI Job Portal — Application Status Updated

Hi ${data.candidateName},

Your application status has been updated.

Job:             ${data.jobTitle}
Company:         ${data.companyName}
Previous Status: ${oldLabel}
New Status:      ${newLabel}
Updated:         ${data.updatedAt}

View your application:
${viewUrl}

—
AI Job Portal | AI-powered career management`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
