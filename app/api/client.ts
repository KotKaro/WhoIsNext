import { text } from '../text';

// Same origin unless VITE_API_BASE points elsewhere.
const apiBase = import.meta.env.VITE_API_BASE || window.location.origin;

export async function callApi<Result>(method: string, path: string, body?: unknown): Promise<Result> {
  let response: Response;
  try {
    response = await fetch(new URL(path, apiBase), body === undefined
      ? { method }
      : { method, headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
  } catch {
    throw new Error(text.errors.offline);
  }
  const result: unknown = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(errorOf(result) ?? text.errors.unknown);
  }
  return result as Result;
}

// The Worker explains every refusal in `error`, already written for people.
function errorOf(result: unknown): string | undefined {
  if (typeof result === 'object' && result !== null && 'error' in result && typeof result.error === 'string') {
    return result.error;
  }
  return undefined;
}
