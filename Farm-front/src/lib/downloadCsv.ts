import type { AxiosResponse } from 'axios';

function parseFilenameFromDisposition(cd: string | undefined, fallback: string): string {
  if (!cd) return fallback;
  const star = /filename\*\s*=\s*UTF-8''([^;\s]+)/i.exec(cd);
  if (star) {
    try {
      return decodeURIComponent(star[1].replace(/["']/g, ''));
    } catch {
      return fallback;
    }
  }
  const plain = /filename\s*=\s*("?)([^";\n]+)\1/i.exec(cd);
  if (plain) return plain[2].trim();
  return fallback;
}

async function saveCsvBlobResponse(res: AxiosResponse<Blob>, fallbackFilename: string): Promise<void> {
  const blob = res.data;
  const ct = (res.headers['content-type'] as string | undefined) || '';
  if (ct.includes('application/json')) {
    const text = await blob.text();
    const j = JSON.parse(text) as { message?: string };
    throw new Error(j.message || 'Export failed');
  }
  const name = parseFilenameFromDisposition(
    res.headers['content-disposition'] as string | undefined,
    fallbackFilename
  );
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

/** Runs a blob GET and saves as CSV; parses JSON error bodies from failed responses. */
export async function saveCsvFromApi(
  request: () => Promise<AxiosResponse<Blob>>,
  fallbackFilename: string
): Promise<void> {
  try {
    const res = await request();
    await saveCsvBlobResponse(res, fallbackFilename);
  } catch (e: unknown) {
    const err = e as { response?: { data?: Blob } };
    if (err.response?.data instanceof Blob) {
      const text = await err.response.data.text();
      try {
        const j = JSON.parse(text) as { message?: string };
        throw new Error(j.message || 'Export failed');
      } catch (parseErr) {
        if (parseErr instanceof SyntaxError) {
          throw new Error(text.slice(0, 200) || 'Export failed');
        }
        throw parseErr;
      }
    }
    throw e;
  }
}
