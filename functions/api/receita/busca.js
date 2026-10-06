import { json, erro, RECEITA_PADRAO } from "../../../lib/util.js";

// Repassa a busca paginada para o Minha Receita.
// Aceita: uf, municipio (código IBGE), cnae, cnae_fiscal, natureza_juridica, limit, cursor.
const PERMITIDOS = ["uf", "municipio", "cnae", "cnae_fiscal", "natureza_juridica", "limit", "cursor"];

export async function onRequestGet({ request, env }) {
  const entrada = new URL(request.url).searchParams;
  const saida = new URLSearchParams();
  for (const k of PERMITIDOS) {
    const v = entrada.get(k);
    if (v) saida.set(k, v);
  }
  if (!["uf", "municipio", "cnae", "cnae_fiscal", "natureza_juridica"].some((k) => saida.has(k))) {
    return erro("Informe ao menos UF, cidade ou segmento.");
  }
  const limite = Math.min(Math.max(parseInt(saida.get("limit") || "300", 10) || 300, 1), 1024);
  saida.set("limit", String(limite));

  const base = env.RECEITA_URL || RECEITA_PADRAO;
  let resp;
  try {
    resp = await fetch(`${base}/?${saida.toString()}`, { headers: { accept: "application/json" } });
  } catch (e) {
    return erro("Não foi possível falar com a base da Receita agora. Tente de novo em instantes.", 502);
  }
  const texto = await resp.text();
  if (!resp.ok) {
    let msg = "A base da Receita respondeu com erro.";
    try {
      msg = JSON.parse(texto).message || msg;
    } catch {}
    return erro(msg, resp.status === 404 ? 404 : 502);
  }
  let dados;
  try {
    dados = JSON.parse(texto);
  } catch {
    return erro("Resposta inesperada da base da Receita.", 502);
  }
  return json({ data: dados.data || [], cursor: dados.cursor || null });
}
