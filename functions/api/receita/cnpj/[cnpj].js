import { json, erro, soDigitos, fetchComCache, RECEITA_PADRAO } from "../../../../lib/util.js";

// Consulta de um CNPJ (dados completos e atualizados).
export async function onRequestGet({ params, env }) {
  const cnpj = soDigitos(params.cnpj);
  if (cnpj.length !== 14) return erro("CNPJ inválido.");
  const base = env.RECEITA_URL || RECEITA_PADRAO;
  let resp;
  try {
    resp = await fetchComCache(`${base}/${cnpj}`, 60 * 60 * 24);
  } catch {
    return erro("Não foi possível falar com a base da Receita agora.", 502);
  }
  if (resp.status === 404) return erro("CNPJ não encontrado.", 404);
  if (!resp.ok) return erro("A base da Receita respondeu com erro.", 502);
  return json(await resp.json());
}
