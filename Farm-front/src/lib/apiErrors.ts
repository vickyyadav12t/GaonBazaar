/**
 * User-facing message from axios/fetch errors (prefers server JSON `message`).
 */
export function getApiErrorMessage(err: unknown, fallback: string): string {
  const ax = err as { code?: string; message?: string };
  if (
    ax?.code === 'ECONNABORTED' ||
    (typeof ax?.message === 'string' && /timeout/i.test(ax.message))
  ) {
    return 'Request timed out. The server may be starting up — wait 30 seconds and try again. If it keeps happening, check your connection.';
  }
  if (err && typeof err === 'object' && 'response' in err) {
    const r = err as { response?: { data?: { message?: string }; status?: number } };
    const m = r.response?.data?.message;
    if (typeof m === 'string' && m.trim()) return m.trim();
    const status = r.response?.status;
    if (status === 429) {
      return 'Too many attempts. Please wait a few minutes and try again.';
    }
    if (status === 503) {
      return 'The server could not send email right now. If this continues, the host may need SMTP settings (SMTP_HOST, SMTP_USER, SMTP_PASS).';
    }
  }
  if (err instanceof Error && err.message && err.message !== 'Network Error') {
    return err.message;
  }
  if (err instanceof Error && err.message === 'Network Error') {
    return 'Network error. Check your connection and try again.';
  }
  return fallback;
}
