import { json, erro, fetchComCache, IBGE_PADRAO } from "../../../../lib/util.js";

// Lista de cidades de uma UF com o código IBGE (usado pelo filtro de cidade).
export async function onRequestGet({ params, env }) {
  const uf = String(params.uf || "").toUpperCase();
  if (!/^[A-Z]{2}$/.test(uf)) return erro("UF inválida.");
  const base = env.IBGE_URL || IBGE_PADRAO;
  const resp = await fetchComCache(`${base}/api/v1/localidades/estados/${uf}/municipios`, 60 * 60 * 24 * 30);
  if (!resp.ok) return erro("Não foi possível carregar as cidades.", 502);
  const lista = await resp.json();
  return json(lista.map((m) => ({ id: m.id, nome: m.nome })), 200, {
    "cache-control": "public, max-age=86400",
  });
}
