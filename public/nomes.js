// Grafia dos nomes que vêm da Receita (tudo maiúsculo e sem acento), usada na tela e nas mensagens.
// Este arquivo é usado pelo navegador (app.js) e pelo servidor (lib/textos.js): a regra é uma só.

const MINUSC = new Set(["de", "da", "do", "das", "dos", "e", "em", "na", "no", "nas", "nos", "para", "com", "a", "o", "ao", "as", "os"]);
const MAIUSC = new Set(["ltda", "me", "epp", "eireli", "s/a", "sa", "s.a", "s.a.", "cia", "mei", "ii", "iii", "iv", "slu", "ss", "lp", "tv", "sp", "rj", "mg", "pr", "sc", "rs", "ti"]);
const DUAS_LETRAS = new Set(["de", "da", "do", "em", "na", "no", "os", "as", "ao", "ou", "um", "se", "eu", "la", "le", "li", "lu", "ki", "bi", "jo"]);

// Palavras comuns em nomes de empresa que a Receita grava sem acento.
const ACENTOS = Object.fromEntries(
  `servico:serviço servicos:serviços comercio:comércio mecanica:mecânica mecanicas:mecânicas mecanico:mecânico automoveis:automóveis
  automovel:automóvel automotivo:automotivo eletrica:elétrica eletricas:elétricas eletrico:elétrico eletricos:elétricos eletronica:eletrônica
  eletronicos:eletrônicos eletrodomesticos:eletrodomésticos industria:indústria industrias:indústrias construcao:construção construcoes:construções
  comunicacao:comunicação distribuicao:distribuição informatica:informática clinica:clínica clinicas:clínicas odontologica:odontológica
  estetica:estética medica:médica medicas:médicas medico:médico medicos:médicos saude:saúde farmacia:farmácia acougue:açougue cafe:café
  pao:pão paes:pães alimentacao:alimentação alimenticios:alimentícios logistica:logística imoveis:imóveis imobiliaria:imobiliária
  educacao:educação colegio:colégio cristao:cristão tecnico:técnico tecnica:técnica tecnicos:técnicos otica:ótica moveis:móveis
  decoracao:decoração decoracoes:decorações veiculos:veículos pecas:peças acessorios:acessórios cambio:câmbio automatico:automático
  automatica:automática mecatronica:mecatrônica mecatronicas:mecatrônicas agropecuaria:agropecuária veterinaria:veterinária
  veterinario:veterinário vestuario:vestuário calcados:calçados relogios:relógios grafica:gráfica solucoes:soluções gestao:gestão
  administracao:administração contabil:contábil musica:música atelie:ateliê importacao:importação exportacao:exportação
  metalurgica:metalúrgica plasticos:plásticos quimica:química hidraulica:hidráulica combustiveis:combustíveis conveniencia:conveniência
  sao:são joao:joão jose:josé antonio:antônio conceicao:conceição perfeicao:perfeição inovacao:inovação producao:produção
  producoes:produções salao:salão irmaos:irmãos familia:família uniao:união america:américa academico:acadêmico estudio:estúdio
  organizacao:organização organizacoes:organizações assistencia:assistência tecnologica:tecnológica analise:análise laboratorio:laboratório
  pericia:perícia fisioterapia:fisioterapia psicologia:psicologia nutricao:nutrição engenharia:engenharia ceramica:cerâmica vidracaria:vidraçaria
  marmoraria:marmoraria serralheria:serralheria funilaria:funilaria lanchonete:lanchonete sorveteria:sorveteria pizzaria:pizzaria
  confeccao:confecção confeccoes:confecções papelaria:papelaria livraria:livraria brinquedos:brinquedos instalacoes:instalações
  manutencao:manutenção reparacao:reparação locacao:locação locacoes:locações seguranca:segurança limpeza:limpeza
  terraplenagem:terraplenagem incorporacao:incorporação participacoes:participações empreendimentos:empreendimentos
  rapido:rápido rapida:rápida rapidos:rápidos rapidas:rápidas pratico:prático pratica:prática unico:único unica:única
  otimo:ótimo otima:ótima basico:básico basica:básica classico:clássico classica:clássica tropico:trópico`
    .split(/\s+/)
    .filter(Boolean)
    .map((par) => par.split(":"))
);

// Sigla: sem vogal (WD, CRF), com três consoantes seguidas (AGRF) ou duas letras que não são palavra (UQ).
function ehSigla(p) {
  if (!/^[a-z]{2,5}$/.test(p)) return false;
  if (!/[aeiouy]/.test(p)) return true;
  if (p.length <= 4 && /[^aeiouy]{3}/.test(p)) return true;
  return p.length === 2 && !DUAS_LETRAS.has(p);
}

export function titulo(s) {
  if (!s) return "";
  return String(s)
    .toLowerCase()
    .split(/(\s+|-|\/)/)
    .map((p, i) => {
      const limpo = p.replace(/[.,()&'"]/g, "");
      if (!limpo || /^\s+$/.test(p) || p === "-" || p === "/") return p;
      if (MAIUSC.has(limpo)) return p.toUpperCase();
      if (i > 0 && MINUSC.has(limpo)) return p;
      if (ehSigla(limpo)) return p.toUpperCase();
      const acentuada = ACENTOS[limpo] ? p.replace(limpo, ACENTOS[limpo]) : p;
      return acentuada.charAt(0).toUpperCase() + acentuada.slice(1);
    })
    .join("");
}

// Tira o tipo de empresa do fim do nome ("WD CENTRO AUTOMOTIVO LTDA" → "WD CENTRO AUTOMOTIVO").
export function semSufixo(nome) {
  const limpo = String(nome || "")
    .replace(/(\s*[-–,]?\s*\b(ltda|eireli|epp|me|mei|s\/a|s\.a\.?|sa|slu|ss|sociedade simples|microempresa)\b\.?)+\s*$/i, "")
    .trim();
  return limpo || String(nome || "").trim();
}

export const semAcento = (s) => String(s ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
export const comparavel = (s) => semAcento(s).replace(/[^a-z0-9]+/g, " ").trim();
