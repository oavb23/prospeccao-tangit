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
export function nomeDaEmpresa(r, neg) {
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

// extra: campos a mais, como { relatorio: "https://tangit.com.br/…" }. Campo sem valor fica como está ({relatorio}).
export function preencher(texto, neg, empresa, extra = {}) {
  const v = { ...variaveis(neg, empresa), ...extra };
  return String(texto || "")
    .replace(/\{(\w+)\}/g, (inteiro, chave) => (chave in v ? v[chave] : inteiro))
    .replace(/[ \t]+([,.!?])/g, "$1")
    .replace(/\s{3,}/g, "\n\n")
    .trim();
}

// O aviso de descadastro vai no fim. Se a mensagem termina num link (ex.: o pré-relatório), o aviso entra
// antes dele: com o link no fim, a mensagem sai com o cartão de prévia no WhatsApp.
export function comRodape(texto, rodape) {
  const r = String(rodape || "").trim();
  const t = String(texto || "");
  if (!r || t.includes(r)) return texto;
  const m = t.match(/^([\s\S]*?)\n[ \t]*(https?:\/\/\S+|\{relatorio\})\s*$/);
  if (m && m[1].trim()) return `${m[1].trim()}\n\n${r}\n\n${m[2]}`;
  return `${t}\n\n${r}`;
}

// Link sozinho na última linha: separa o texto e o link (para mandar com o cartão de prévia).
export function linkNoFim(texto, link) {
  const t = String(texto || "").trim();
  if (!link || !t.endsWith(link)) return null;
  const antes = t.slice(0, -link.length);
  if (antes && !/\n[ \t]*$/.test(antes)) return null;
  return { legenda: antes.trim(), link };
}

export const fmtTelefone = (numero) => {
  let d = String(numero || "").replace(/\D/g, "");
  if (d.startsWith("55") && d.length >= 12) d = d.slice(2);
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return d;
};
