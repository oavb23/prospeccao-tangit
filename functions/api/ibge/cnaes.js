import { json, erro, fetchComCache, IBGE_PADRAO } from "../../../lib/util.js";

// O IBGE devolve as descrições em CAIXA ALTA; deixamos em formato de frase.
const frase = (t) => {
  const x = String(t || "").toLowerCase();
  return x.charAt(0).toUpperCase() + x.slice(1);
};

// Lista completa de CNAEs (subclasses) com descrição e seção, para o filtro de segmento.
export async function onRequestGet({ env }) {
  const base = env.IBGE_URL || IBGE_PADRAO;
  const resp = await fetchComCache(`${base}/api/v2/cnae/subclasses`, 60 * 60 * 24 * 30);
  if (!resp.ok) return erro("Não foi possível carregar os segmentos.", 502);
  const lista = await resp.json();
  const saida = lista.map((s) => ({
    id: String(s.id),
    descricao: frase(s.descricao),
    secao: s?.classe?.grupo?.divisao?.secao?.descricao || "",
    divisao: s?.classe?.grupo?.divisao?.descricao || "",
  }));
  return json(saida, 200, { "cache-control": "public, max-age=86400" });
}
