// Nomes e preenchimento dos modelos de mensagem. A grafia dos nomes (maiúsculas, acentos, siglas)
// vem de public/nomes.js, o mesmo arquivo que a tela usa.

import { titulo, semSufixo, semAcento, comparavel } from "../public/nomes.js";

export { titulo, semAcento };

export const primeiroNome = (s) => titulo(String(s || "").trim().split(/\s+/)[0] || "");

const nomeWhatsApp = (s) => {
  const t = String(s || "").trim();
  return t && t === t.toUpperCase() ? titulo(t) : t;
};

// Nome da empresa para as mensagens: nome fantasia (ou razão social) sem "LTDA", "ME"...
// Quando o nome comercial do WhatsApp é o mesmo, ignorando acentos, usa a grafia dele ("Padaria Pão Bom").
function nomeDaEmpresa(r, neg) {
  const base = semSufixo((r.nome_fantasia || "").trim() || r.razao_social || "");
  const wa = nomeWhatsApp(neg?.wa_nome);
  if (base) return wa && comparavel(semSufixo(wa)) === comparavel(base) ? semSufixo(wa) : titulo(base);
  return wa || titulo(neg?.contato_nome || "") || "sua empresa";
}

// Dados para os campos {variaveis}: empresa (Receita) e/ou contato (site).
export function variaveis(neg, empresa) {
  const r = empresa || {};
  const socio = (r.qsa || []).find((s) => s.nome_socio && !/\d/.test(s.nome_socio));
  const socioNome = socio ? primeiroNome(socio.nome_socio) : "";
  const nome = neg?.contato_nome ? primeiroNome(neg.contato_nome) : socioNome;
  return {
    empresa: nomeDaEmpresa(r, neg),
    razao_social: titulo(r.razao_social || ""),
    cidade: titulo(r.municipio || ""),
    segmento: r.cnae_fiscal_descricao || "",
    socio: socioNome,
    nome,
    saudacao: nome ? `Olá, ${nome}` : "Olá",
  };
}

export function preencher(texto, neg, empresa) {
  const v = variaveis(neg, empresa);
  return String(texto || "")
    .replace(/\{(\w+)\}/g, (inteiro, chave) => (chave in v ? v[chave] : inteiro))
    .replace(/[ \t]+([,.!?])/g, "$1")
    .replace(/\s{3,}/g, "\n\n")
    .trim();
}

export function comRodape(texto, rodape) {
  const r = String(rodape || "").trim();
  if (!r || String(texto).includes(r)) return texto;
  return `${texto}\n\n${r}`;
}

export const fmtTelefone = (numero) => {
  let d = String(numero || "").replace(/\D/g, "");
  if (d.startsWith("55") && d.length >= 12) d = d.slice(2);
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return d;
};
