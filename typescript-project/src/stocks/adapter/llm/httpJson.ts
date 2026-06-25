/** Minimal JSON POST helper shared by the LLM adapters (Node 18+ global fetch). */
export async function postJson(
  url: string,
  body: unknown,
  headers: Record<string, string>,
  providerLabel: string,
): Promise<any> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${providerLabel} ${res.status}: ${text.slice(0, 300)}`);
  }
  return res.json();
}
