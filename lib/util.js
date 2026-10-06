// Utilitários compartilhados pelas Functions (não é rota).

export const RECEITA_PADRAO = "https://minhareceita.org";
export const IBGE_PADRAO = "https://servicodados.ibge.gov.br";

export function json(data, status = 200, extra = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", ...extra },
  });
}

export function erro(mensagem, status = 400) {
  return json({ erro: mensagem }, status);
}

export async function corpo(request) {
  try {
    return await request.json();
  } catch {
    return {};
  }
}

export const soDigitos = (v) => String(v ?? "").replace(/\D/g, "");

// Busca com cache na borda da Cloudflare (Cache API). Fora da Cloudflare, segue sem cache.
export async function fetchComCache(url, segundos) {
  const cache = typeof caches !== "undefined" && caches.default ? caches.default : null;
  const chave = new Request(url);
  if (cache) {
    const hit = await cache.match(chave);
    if (hit) return hit;
  }
  const resp = await fetch(url, { headers: { accept: "application/json" } });
  if (!resp.ok) return resp;
  const texto = await resp.text();
  const pronto = new Response(texto, {
    status: 200,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": `public, max-age=${segundos}`,
    },
  });
  if (cache) await cache.put(chave, pronto.clone());
  return pronto;
}
