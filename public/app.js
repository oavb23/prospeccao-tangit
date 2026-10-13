/* Prospecção — interface (HTML/JS puro, sem dependências).
   Dados: Minha Receita (via /api/receita), cidades e CNAEs do IBGE (via /api/ibge),
   listas e funil no D1 da Cloudflare (via /api/data), automação de WhatsApp (via /api/automacao). */

import { titulo, semSufixo, comparavel } from "./nomes.js";
import { paginaRelatorio } from "./relatorio-pagina.js";
import { analisarHtml, montarResultadoSite, precisaGtag } from "./coleta-site.js";

// ============================================================ ícones
const SVG = (p) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${p}</svg>`;
const ICONES = {
  busca: SVG('<circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4.2-4.2"/>'),
  listas: SVG('<path d="M9 6h11M9 12h11M9 18h11"/><circle cx="4.5" cy="6" r="1"/><circle cx="4.5" cy="12" r="1"/><circle cx="4.5" cy="18" r="1"/>'),
  funil: SVG('<rect x="3" y="4" width="5" height="16" rx="1.5"/><rect x="10" y="4" width="5" height="11" rx="1.5"/><rect x="17" y="4" width="4" height="7" rx="1.5"/>'),
  ajustes: SVG('<path d="M4 7h10M18 7h2M4 17h4M12 17h8"/><circle cx="16" cy="7" r="2"/><circle cx="10" cy="17" r="2"/>'),
  lista: SVG('<path d="M4 6h16M4 12h16M4 18h16"/>'),
  grade: SVG('<rect x="4" y="4" width="7" height="7" rx="1.5"/><rect x="13" y="4" width="7" height="7" rx="1.5"/><rect x="4" y="13" width="7" height="7" rx="1.5"/><rect x="13" y="13" width="7" height="7" rx="1.5"/>'),
  telefone: SVG('<path d="M5 4h3.5l1.7 4.3-2.2 1.4a11 11 0 0 0 6.3 6.3l1.4-2.2L20 15.5V19a1.5 1.5 0 0 1-1.6 1.5A16 16 0 0 1 3.5 5.6 1.5 1.5 0 0 1 5 4z"/>'),
  whats: SVG('<path d="M4.5 19.5l1.2-3.6A8 8 0 1 1 8.4 18.5z"/><path d="M9.2 9.3c.3 2.3 2.2 4.2 4.5 4.6l.9-1.1 1.8.8-.4 1.6c-3.7.2-7.4-3.4-7.3-7.2l1.6-.4.8 1.8z" stroke-width="1.3"/>'),
  mapa: SVG('<path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.3"/>'),
  email: SVG('<rect x="3.5" y="5.5" width="17" height="13" rx="2"/><path d="M4 7l8 6 8-6"/>'),
  mais: SVG('<path d="M12 5v14M5 12h14"/>'),
  fechar: SVG('<path d="M6 6l12 12M18 6L6 18"/>'),
  copiar: SVG('<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5.5A1.5 1.5 0 0 0 14.5 4h-9A1.5 1.5 0 0 0 4 5.5v9A1.5 1.5 0 0 0 5.5 16H8"/>'),
  baixar: SVG('<path d="M12 4v11M7 10.5l5 5 5-5M5 20h14"/>'),
  semelhantes: SVG('<circle cx="8" cy="8" r="3.5"/><circle cx="16" cy="16" r="3.5"/><path d="M11 11l2 2"/>'),
  atualizar: SVG('<path d="M20 11a8 8 0 0 0-14.3-4.6M4 5v4h4M4 13a8 8 0 0 0 14.3 4.6M20 19v-4h-4"/>'),
  alca: SVG('<circle cx="9" cy="6" r="1.2" fill="currentColor"/><circle cx="15" cy="6" r="1.2" fill="currentColor"/><circle cx="9" cy="12" r="1.2" fill="currentColor"/><circle cx="15" cy="12" r="1.2" fill="currentColor"/><circle cx="9" cy="18" r="1.2" fill="currentColor"/><circle cx="15" cy="18" r="1.2" fill="currentColor"/>'),
  alvo: SVG('<path d="M5 12h14M13 6l6 6-6 6"/>'),
  filtro: SVG('<path d="M4 5h16l-6 7.5V19l-4-2v-4.5z"/>'),
  nota: SVG('<path d="M5 4h10l4 4v12H5z"/><path d="M14 4v5h5M8 13h8M8 17h5"/>'),
  reuniao: SVG('<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M4 10h16M9 3v4M15 3v4"/>'),
  sistema: SVG('<circle cx="12" cy="12" r="8"/><path d="M12 8v4l2.5 2"/>'),
  lixo: SVG('<path d="M5 7h14M10 7V4.5h4V7M7 7l1 13h8l1-13"/>'),
  google: SVG('<path d="M14 4h6v6M20 4l-8 8M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>'),
  vazio: SVG('<path d="M4 7l8-4 8 4-8 4z"/><path d="M4 7v10l8 4 8-4V7M12 11v10"/>'),
  aprovar: SVG('<path d="M20.5 3.5L10 14"/><path d="M20.5 3.5l-6.3 17-4.2-6.5-6.5-4.2z"/>'),
  robo: SVG('<rect x="5" y="8" width="14" height="11" rx="3"/><path d="M12 4.5V8M9.5 13h.01M14.5 13h.01M10 16.2h4"/>'),
  alerta: SVG('<path d="M12 4l9 16H3z"/><path d="M12 10v4.5M12 17.4h.01"/>'),
  check: SVG('<path d="M5 12.5l4.5 4.5L19 7.5"/>'),
  pausa: SVG('<path d="M9 6v12M15 6v12"/>'),
  play: SVG('<path d="M8 5.5v13l10.5-6.5z"/>'),
  pessoa: SVG('<circle cx="12" cy="8.5" r="3.5"/><path d="M5 20a7 7 0 0 1 14 0"/>'),
  site: SVG('<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c2.6 2.6 2.6 14.4 0 17M12 3.5c-2.6 2.6-2.6 14.4 0 17"/>'),
};
const ico = (n) => `<span class="ico">${ICONES[n] || ""}</span>`;
document.querySelectorAll("[data-ico]").forEach((el) => (el.innerHTML = ICONES[el.dataset.ico]));

// ============================================================ utilidades
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = (v) =>
  String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const norm = (s) => String(s ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const digitos = (v) => String(v ?? "").replace(/\D/g, "");

function ler(chave, padrao = null) {
  try {
    const v = localStorage.getItem(chave);
    return v === null ? padrao : JSON.parse(v);
  } catch {
    return padrao;
  }
}
function gravar(chave, valor) {
  try {
    localStorage.setItem(chave, JSON.stringify(valor));
  } catch {}
}


const fmtCNPJ = (c) => {
  const d = digitos(c).padStart(14, "0");
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`;
};
const fmtData = (s) => (s ? String(s).slice(0, 10).split("-").reverse().join("/") : "");
const fmtMoeda = (v) =>
  v === null || v === undefined || v === ""
    ? ""
    : Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: Number(v) % 1 ? 2 : 0 });
const fmtMoedaCurta = (v) => {
  const n = Number(v) || 0;
  if (n >= 1e9) return `R$ ${(n / 1e9).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} bi`;
  if (n >= 1e6) return `R$ ${(n / 1e6).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} mi`;
  if (n >= 1e3) return `R$ ${(n / 1e3).toLocaleString("pt-BR", { maximumFractionDigits: 0 })} mil`;
  return fmtMoeda(n);
};
const hojeISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
function dataHora(s) {
  if (!s) return "";
  const d = new Date(String(s).replace(" ", "T") + (String(s).includes("Z") ? "" : "Z"));
  if (isNaN(d)) return s;
  return d.toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" });
}
const plural = (n, um, varios) => `${n.toLocaleString("pt-BR")} ${n === 1 ? um : varios}`;

// ---------- leitura dos registros da Receita ----------
const nomeDe = (r) => titulo(semSufixo((r.nome_fantasia || "").trim() || r.razao_social || "")) || "Sem nome";
const ativa = (r) => r.situacao_cadastral === 2 || norm(r.descricao_situacao_cadastral) === "ativa";
const ehMatriz = (r) => r.identificador_matriz_filial === 1;
const anoAbertura = (r) => (r.data_inicio_atividade ? parseInt(String(r.data_inicio_atividade).slice(0, 4), 10) : null);
const emailDe = (r) => String(r.email || r.correio_eletronico || "").trim().toLowerCase();
const cnae7 = (v) => String(v ?? "").replace(/\D/g, "").padStart(7, "0");

function porteDe(r) {
  if (r.opcao_pelo_mei) return { cod: "MEI", nome: "MEI" };
  switch (Number(r.codigo_porte)) {
    case 1: return { cod: "ME", nome: "Microempresa" };
    case 3: return { cod: "EPP", nome: "Pequeno porte" };
    case 5: return { cod: "DEMAIS", nome: "Demais" };
    default: {
      const p = norm(r.porte);
      if (p.includes("micro")) return { cod: "ME", nome: "Microempresa" };
      if (p.includes("pequeno")) return { cod: "EPP", nome: "Pequeno porte" };
      if (p.includes("demais")) return { cod: "DEMAIS", nome: "Demais" };
      return { cod: "NI", nome: "Não informado" };
    }
  }
}

function telefonesDe(r) {
  const brutos = [r.ddd_telefone_1, r.ddd_telefone_2].map(digitos).filter((d) => d.length >= 10 && d.length <= 11);
  return [...new Set(brutos)].map((d) => {
    // a Receita ainda guarda muito celular no formato antigo, sem o 9 (ex.: 15 9149-5729)
    const antigo = d.length === 10 && /[6-9]/.test(d[2]);
    return {
      digitos: d,
      celular: (d.length === 11 && d[2] === "9") || antigo,
      whats: antigo ? d.slice(0, 2) + "9" + d.slice(2) : d,
      exib: d.length === 11 ? `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}` : `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`,
    };
  });
}

function enderecoDe(r) {
  const rua = titulo([r.descricao_tipo_de_logradouro, r.logradouro].filter(Boolean).join(" "));
  const num = r.numero && r.numero !== "S/N" ? r.numero : r.numero ? "s/n" : "";
  const l1 = [rua, num].filter(Boolean).join(", ") + (r.complemento ? ` — ${titulo(r.complemento)}` : "");
  const l2 = [titulo(r.bairro), [titulo(r.municipio), r.uf].filter(Boolean).join(" - ")].filter(Boolean).join(", ");
  const cep = digitos(r.cep);
  return { l1, l2, cep: cep ? `${cep.slice(0, 5)}-${cep.slice(5)}` : "", completo: [l1, l2, cep ? `CEP ${cep}` : ""].filter(Boolean).join(", ") };
}

const linkMapsEndereco = (r) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(enderecoDe(r).completo + ", Brasil")}`;
const linkMapsNome = (r) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${nomeDe(r)}, ${titulo(r.municipio)} - ${r.uf}`)}`;

function preencherModelo(texto, r) {
  const socio = (r.qsa || []).find((s) => s.nome_socio && !/\d/.test(s.nome_socio));
  return String(texto)
    .replaceAll("{empresa}", nomeDe(r))
    .replaceAll("{razao_social}", titulo(r.razao_social))
    .replaceAll("{cidade}", titulo(r.municipio))
    .replaceAll("{segmento}", r.cnae_fiscal_descricao || "")
    .replaceAll("{socio}", socio ? titulo(socio.nome_socio.split(" ")[0]) : "");
}

// ============================================================ estado
const FILTROS_PADRAO = {
  uf: "SP",
  cidades: [],
  cnaes: [],
  secundario: false,
  portes: [],
  capMin: "",
  capMax: "",
  anoDe: "",
  anoAte: "",
  soAtivas: true,
  tipo: "todas",
  comTelefone: false,
  comEmail: false,
  nome: "",
};
const E = {
  resumo: { listas: [], etapas: [], modelos: [], marcadores: {} },
  busca: {
    filtros: { ...FILTROS_PADRAO, ...(ler("prosp.filtros") || {}) },
    resultados: [],
    vistos: new Set(),
    brutos: 0,
    cursor: null,
    buscou: false,
    carregando: false,
    erro: null,
  },
  vista: ler("prosp.vista", "lista"),
  ordem: "padrao",
  ctx: "busca",
  selecao: new Map(),
  cnaes: null,
  municipios: {},
  lista: { id: null, empresas: [], carregando: false, filtro: "" },
  funil: { negocios: [], carregando: false, filtro: "" },
  aprovar: { fila: null, painel: null },
  gaveta: null,
  rel: null,
};

const UFS = ["AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO"];

// ============================================================ API
async function api(caminho, opcoes = {}) {
  const headers = { accept: "application/json" };
  const chave = ler("prosp.chave");
  if (chave) headers["x-access-key"] = chave;
  let body;
  if (opcoes.body !== undefined) {
    headers["content-type"] = "application/json";
    body = JSON.stringify(opcoes.body);
  }
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), opcoes.timeout || 60000);
  let resp;
  try {
    resp = await fetch(`/api/${caminho}`, { method: opcoes.method || "GET", headers, body, signal: ctrl.signal });
  } catch (e) {
    throw new Error(e.name === "AbortError" ? "A consulta demorou demais. Tente de novo." : "Sem conexão com o servidor.");
  } finally {
    clearTimeout(t);
  }
  if (resp.status === 401 && !caminho.startsWith("automacao/tick")) {
    if (opcoes.silencioso) throw new Error("Acesso negado.");
    const ok = await pedirChave();
    if (ok) return api(caminho, opcoes);
    throw new Error("Acesso negado.");
  }
  const dados = await resp.json().catch(() => null);
  if (resp.status === 503 && dados?.erro === "chave_nao_configurada") {
    semChaveConfigurada();
    throw new Error("Falta configurar a chave de acesso (ACCESS_KEY) no Cloudflare.");
  }
  if (!resp.ok) throw new Error(dados?.erro || `Erro ${resp.status}`);
  return dados;
}

// O sistema só funciona com a chave de acesso ativada (dados pessoais + envio pelo seu WhatsApp).
let avisouSemChave = false;
function semChaveConfigurada() {
  if (avisouSemChave) return;
  avisouSemChave = true;
  $("#conteudo").innerHTML = `<div class="vazio" style="max-width:560px">${ico("alerta")}<h3>Falta ativar a chave de acesso</h3>
    <p>Por segurança, o sistema só abre com a chave de acesso ligada: ele guarda dados de pessoas (LGPD) e envia mensagens pelo seu WhatsApp.</p>
    <p>No Safari, em <strong>dash.cloudflare.com</strong>: menu <strong>Compute (Workers)</strong> → <strong>Workers &amp; Pages</strong> → projeto <strong>prospeccao-tangit</strong> → aba <strong>Settings</strong> → seção <strong>Variables and Secrets</strong> → <strong>Add</strong> → Type <strong>Secret</strong>, Variable name <code>ACCESS_KEY</code>, Value = uma senha longa → <strong>Save</strong>. Depois, aba <strong>Deployments</strong> → <strong>⋯</strong> no deploy mais recente → <strong>Retry deployment</strong>.</p></div>`;
}

async function carregarResumo() {
  try {
    E.resumo = await api("data/resumo");
    atualizarBadges(E.resumo.pendentes, E.resumo.com_respostas);
  } catch (e) {
    aviso(e.message, true);
  }
}

// ============================================================ novidades (badges, alerta do WhatsApp, telas abertas)
const NOV = { mudou_em: null };
function atualizarBadges(pendentes, respostas) {
  const b1 = $("#badge-aprovar");
  const b2 = $("#badge-funil");
  if (b1 && pendentes !== undefined) {
    b1.hidden = !pendentes;
    b1.textContent = pendentes > 99 ? "99+" : String(pendentes || "");
  }
  if (b2 && respostas !== undefined) {
    b2.hidden = !respostas;
    b2.textContent = respostas > 99 ? "99+" : String(respostas || "");
  }
}
function atualizarFaixa(alerta) {
  const f = $("#faixa");
  if (!f) return;
  f.hidden = !alerta;
  if (alerta) f.innerHTML = `${ico("alerta")}<span><strong>WhatsApp parado:</strong> ${esc(alerta)}. Os envios automáticos voltam sozinhos quando a conexão voltar. <a href="#/ajustes" data-ir="aj-whatsapp">Ver conexão</a></span>`;
}
async function checarNovidades(forcar = false) {
  if (!forcar && document.visibilityState !== "visible") return;
  let r;
  try {
    r = await api(`automacao/novidades?desde=${encodeURIComponent(NOV.mudou_em ?? "")}`, { silencioso: true, timeout: 15000 });
  } catch {
    return;
  }
  atualizarFaixa(r.gowa_alerta);
  if (!r.mudou) return;
  const primeira = NOV.mudou_em === null;
  NOV.mudou_em = r.mudou_em;
  atualizarBadges(r.pendentes, r.com_respostas);
  if (primeira) return;
  // algo mudou (resposta, envio, verificação): atualiza o que está aberto sem atrapalhar a digitação
  if (E.ctx === "funil" && !arrastando) carregarFunil();
  if (E.ctx === "aprovar") atualizarPainelAprovar();
  if (E.gaveta?.negId) recarregarGaveta();
}
setInterval(checarNovidades, 20000);
document.addEventListener("visibilitychange", () => document.visibilityState === "visible" && checarNovidades());

async function carregarCnaes() {
  if (E.cnaes) return E.cnaes;
  const cache = ler("prosp.cnaes.v1");
  if (cache && cache.length > 100) return (E.cnaes = cache);
  E.cnaes = await api("ibge/cnaes");
  gravar("prosp.cnaes.v1", E.cnaes);
  return E.cnaes;
}

async function carregarMunicipios(uf) {
  if (E.municipios[uf]) return E.municipios[uf];
  E.municipios[uf] = await api(`ibge/municipios/${uf}`);
  return E.municipios[uf];
}

// ============================================================ avisos, modal, menu
function aviso(texto, erro = false) {
  const el = document.createElement("div");
  el.className = "aviso" + (erro ? " erro" : "");
  el.textContent = texto;
  $("#avisos").append(el);
  setTimeout(() => el.remove(), erro ? 5000 : 2600);
}

let fecharModalAtual = null;
function abrirModal({ titulo: tit, texto, corpo = "", botoes = [] }) {
  return new Promise((resolve) => {
    const fundo = $("#modal-fundo");
    const m = $("#modal");
    m.innerHTML = `
      <header><h2>${esc(tit)}</h2>${texto ? `<p>${texto}</p>` : ""}</header>
      <div class="corpo-m">${corpo}</div>
      <footer>${botoes
        .map((b, i) => `<button class="btn ${b.classe || ""}" data-i="${i}" type="button">${esc(b.rotulo)}</button>`)
        .join("")}</footer>`;
    fundo.hidden = false;
    const fechar = (valor) => {
      fundo.hidden = true;
      m.innerHTML = "";
      fecharModalAtual = null;
      resolve(valor);
    };
    fecharModalAtual = () => fechar(null);
    $$("footer button", m).forEach((btn) =>
      btn.addEventListener("click", async () => {
        const b = botoes[Number(btn.dataset.i)];
        if (b.acao) {
          const r = await b.acao(m);
          if (r === false) return;
          fechar(r === undefined ? true : r);
        } else fechar(b.valor ?? null);
      })
    );
    fundo.onclick = (ev) => {
      if (ev.target === fundo) fechar(null);
    };
    setTimeout(() => $("input, textarea, select", m)?.focus(), 30);
  });
}

async function confirmar(tit, texto, rotulo = "Confirmar", perigo = false) {
  const r = await abrirModal({
    titulo: tit,
    texto: esc(texto),
    botoes: [
      { rotulo: "Cancelar", valor: false },
      { rotulo, classe: perigo ? "prim perigo" : "prim", valor: true },
    ],
  });
  return !!r;
}

async function pedirTexto(tit, rotulo, valor = "", placeholder = "") {
  return abrirModal({
    titulo: tit,
    corpo: `<div class="campo"><label for="m-txt">${esc(rotulo)}</label>
      <input id="m-txt" class="entrada" value="${esc(valor)}" placeholder="${esc(placeholder)}" maxlength="80"></div>`,
    botoes: [
      { rotulo: "Cancelar", valor: null },
      {
        rotulo: "Salvar",
        classe: "prim",
        acao: (m) => {
          const v = $("#m-txt", m).value.trim();
          if (!v) return false;
          return v;
        },
      },
    ],
  });
}

let pedindoChave = null;
function pedirChave() {
  if (pedindoChave) return pedindoChave;
  pedindoChave = abrirModal({
    titulo: "Chave de acesso",
    texto: "Esta ferramenta está protegida. Digite a chave definida no projeto da Cloudflare.",
    corpo: `<div class="campo"><label for="m-chave">Chave</label><input id="m-chave" type="password" class="entrada" autocomplete="current-password"></div>`,
    botoes: [
      { rotulo: "Cancelar", valor: false },
      {
        rotulo: "Entrar",
        classe: "prim",
        acao: (m) => {
          const v = $("#m-chave", m).value.trim();
          if (!v) return false;
          gravar("prosp.chave", v);
          return true;
        },
      },
    ],
  }).finally(() => (pedindoChave = null));
  return pedindoChave;
}

function abrirMenu(ancora, html, aoClicar) {
  const menu = $("#menu-flutuante");
  menu.innerHTML = html;
  menu.hidden = false;
  const r = ancora.getBoundingClientRect();
  const w = menu.offsetWidth;
  const h = menu.offsetHeight;
  let left = Math.min(r.left, window.innerWidth - w - 8);
  let top = r.bottom + 6;
  if (top + h > window.innerHeight - 8) top = Math.max(8, r.top - h - 6);
  menu.style.left = `${Math.max(8, left)}px`;
  menu.style.top = `${top}px`;
  const fora = (ev) => {
    if (!menu.contains(ev.target)) fechar();
  };
  const fechar = () => {
    menu.hidden = true;
    document.removeEventListener("pointerdown", fora, true);
  };
  setTimeout(() => document.addEventListener("pointerdown", fora, true), 0);
  menu.onclick = (ev) => {
    const alvo = ev.target.closest("[data-v]");
    if (!alvo) return;
    if (alvo.tagName !== "A") ev.preventDefault();
    fechar();
    aoClicar?.(alvo.dataset.v);
  };
}

document.addEventListener("keydown", (ev) => {
  if (ev.key !== "Escape") return;
  if (fecharModalAtual) return fecharModalAtual();
  if (!$("#menu-flutuante").hidden) return ($("#menu-flutuante").hidden = true);
  if (E.gaveta) return fecharGaveta();
});

// ============================================================ autocompletar
function autocompletar(input, { fonte, item, escolher, vazio = "Nada encontrado" }) {
  const caixa = document.createElement("div");
  caixa.className = "auto-lista";
  caixa.hidden = true;
  input.parentElement.append(caixa);
  let itens = [];
  let ativo = -1;
  let seq = 0;

  async function atualizar() {
    const meu = ++seq;
    let lista;
    try {
      lista = await fonte(input.value);
    } catch (e) {
      caixa.innerHTML = `<div class="auto-vazio">${esc(e.message)}</div>`;
      caixa.hidden = false;
      return;
    }
    if (meu !== seq) return;
    itens = lista || [];
    ativo = itens.length ? 0 : -1;
    caixa.innerHTML = itens.length
      ? itens.map((it, i) => `<div class="auto-item" data-i="${i}" aria-selected="${i === ativo}">${item(it)}</div>`).join("")
      : `<div class="auto-vazio">${esc(vazio)}</div>`;
    caixa.hidden = false;
  }
  function marcar() {
    $$(".auto-item", caixa).forEach((el, i) => el.setAttribute("aria-selected", String(i === ativo)));
    $$(".auto-item", caixa)[ativo]?.scrollIntoView({ block: "nearest" });
  }
  function pegar(i) {
    const it = itens[i];
    if (!it) return;
    escolher(it);
    input.value = "";
    caixa.hidden = true;
  }
  input.addEventListener("input", atualizar);
  input.addEventListener("focus", atualizar);
  input.addEventListener("keydown", (ev) => {
    if (caixa.hidden) return;
    if (ev.key === "ArrowDown") { ativo = Math.min(itens.length - 1, ativo + 1); marcar(); ev.preventDefault(); }
    else if (ev.key === "ArrowUp") { ativo = Math.max(0, ativo - 1); marcar(); ev.preventDefault(); }
    else if (ev.key === "Enter") { if (ativo >= 0) { pegar(ativo); ev.preventDefault(); } }
    else if (ev.key === "Escape") { caixa.hidden = true; ev.stopPropagation(); }
  });
  input.addEventListener("blur", () => setTimeout(() => (caixa.hidden = true), 160));
  caixa.addEventListener("pointerdown", (ev) => {
    const el = ev.target.closest(".auto-item");
    if (el) {
      ev.preventDefault();
      pegar(Number(el.dataset.i));
    }
  });
}

function buscarTexto(lista, q, campos, limite = 40) {
  const termos = norm(q).split(/\s+/).filter(Boolean);
  if (!termos.length) return lista.slice(0, limite);
  const saida = [];
  for (const it of lista) {
    const alvo = campos.map((c) => norm(it[c])).join(" ");
    if (termos.every((t) => alvo.includes(t))) {
      saida.push(it);
      if (saida.length >= limite) break;
    }
  }
  return saida;
}

// ============================================================ roteamento
function rota() {
  const h = location.hash.replace(/^#\/?/, "");
  const [pag, id] = h.split("/");
  return { pag: pag || "busca", id };
}

async function renderizar() {
  const { pag, id } = rota();
  if (E.ctx === "relatorio" && E.rel) {
    salvarRelPendente();
    salvarManualAgora();
  }
  $$(".nav a").forEach((a) => a.classList.toggle("ativo", a.dataset.rota === (pag === "relatorio" ? "aprovar" : pag)));
  limparSelecao(false);
  const main = $("#conteudo");
  if (pag === "listas") {
    E.ctx = "lista";
    await telaListas(main, id ? Number(id) : null);
  } else if (pag === "funil") {
    E.ctx = "funil";
    await telaFunil(main);
  } else if (pag === "aprovar") {
    E.ctx = "aprovar";
    await telaAprovar(main);
  } else if (pag === "relatorio") {
    E.ctx = "relatorio";
    await telaRelatorio(main, id);
  } else if (pag === "ajustes") {
    E.ctx = "ajustes";
    await telaAjustes(main, id);
  } else {
    E.ctx = "busca";
    telaBusca(main);
  }
  atualizarBarraSelecao();
}
window.addEventListener("hashchange", renderizar);
document.addEventListener("click", (ev) => {
  const a = ev.target.closest("a[data-ir]");
  if (!a) return;
  ev.preventDefault();
  irParaAjuste(a.dataset.ir);
});
function irParaAjuste(secao) {
  if (rota().pag === "ajustes") return $(`#${secao}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  location.hash = `#/ajustes/${secao}`;
}

// ============================================================ componente: resultados
function selos(r) {
  const p = porteDe(r);
  const m = E.resumo.marcadores[r.cnpj];
  const ano = anoAbertura(r);
  const s = [];
  s.push(`<span class="selo">${esc(p.cod === "DEMAIS" ? "Demais" : p.cod === "NI" ? "Porte n/i" : p.cod)}</span>`);
  if (ano) s.push(`<span class="selo num">desde ${ano}</span>`);
  if (!ativa(r)) s.push(`<span class="selo perigo">${esc(titulo(r.descricao_situacao_cadastral || "Inativa"))}</span>`);
  if (!ehMatriz(r)) s.push(`<span class="selo">Filial</span>`);
  if (m?.negocio) {
    const et = E.resumo.etapas.find((e) => e.id === m.negocio.etapa_id);
    s.push(`<span class="selo acento"><span class="bola" style="background:${esc(et?.cor || "#888")}"></span>${esc(et?.nome || "No funil")}</span>`);
  }
  if (m?.listas?.length) {
    s.push(`<span class="selo" title="${esc(m.listas.map((id) => E.resumo.listas.find((l) => l.id === id)?.nome).filter(Boolean).join(", "))}">${plural(m.listas.length, "lista", "listas")}</span>`);
  }
  return s.join("");
}

function htmlEmpresas(registros) {
  if (E.vista === "grade") {
    return `<div class="grade-empresas">${registros
      .map((r) => {
        const sel = E.selecao.has(r.cnpj);
        const tel = telefonesDe(r).length;
        return `<article class="cartao ${sel ? "sel" : ""}" data-cnpj="${r.cnpj}">
          <div class="topo-c">
            <input type="checkbox" class="marcar" aria-label="Selecionar" ${sel ? "checked" : ""}>
            <div style="min-width:0">
              <div class="nome">${esc(nomeDe(r))}</div>
            </div>
          </div>
          <div class="sub">${esc(r.cnae_fiscal_descricao || "")}</div>
          <div class="meta" style="display:flex;flex-wrap:wrap;gap:5px">${selos(r)}</div>
          <div class="rodape-c"><span>${esc(titulo(r.municipio))} - ${esc(r.uf)}</span>
            <span>${tel ? ico("telefone") : ""}${emailDe(r) ? ico("email") : ""}</span></div>
        </article>`;
      })
      .join("")}</div>`;
  }
  return `<div class="lista-empresas">${registros
    .map((r) => {
      const sel = E.selecao.has(r.cnpj);
      const tel = telefonesDe(r)[0];
      return `<article class="item ${sel ? "sel" : ""}" data-cnpj="${r.cnpj}">
        <input type="checkbox" class="marcar" aria-label="Selecionar" ${sel ? "checked" : ""}>
        <div style="min-width:0">
          <div class="nome">${esc(nomeDe(r))}</div>
          <div class="sub">${esc(titulo(r.razao_social))} · ${esc(r.cnae_fiscal_descricao || "")}</div>
          <div class="meta">${selos(r)}</div>
        </div>
        <div class="lado">
          <span class="local">${esc(titulo(r.municipio))} - ${esc(r.uf)}</span>
          ${tel ? `<span class="num">${esc(tel.exib)}</span>` : ""}
          <span class="num">${fmtCNPJ(r.cnpj)}</span>
        </div>
      </article>`;
    })
    .join("")}</div>`;
}

function ligarEmpresas(container, registros, aoAbrir) {
  const mapa = new Map(registros.map((r) => [r.cnpj, r]));
  container.onclick = (ev) => {
    const el = ev.target.closest("[data-cnpj]");
    if (!el) return;
    const r = mapa.get(el.dataset.cnpj);
    if (!r) return;
    if (ev.target.classList.contains("marcar")) {
      alternarSelecao(r, ev.target.checked);
      el.classList.toggle("sel", ev.target.checked);
      return;
    }
    if (ev.metaKey || ev.shiftKey) {
      const marcado = !E.selecao.has(r.cnpj);
      alternarSelecao(r, marcado);
      el.classList.toggle("sel", marcado);
      $(".marcar", el).checked = marcado;
      return;
    }
    (aoAbrir || abrirEmpresa)(r);
  };
}

function ordenar(lista) {
  const l = [...lista];
  switch (E.ordem) {
    case "nome": return l.sort((a, b) => nomeDe(a).localeCompare(nomeDe(b), "pt-BR"));
    case "antigas": return l.sort((a, b) => String(a.data_inicio_atividade || "9").localeCompare(String(b.data_inicio_atividade || "9")));
    case "novas": return l.sort((a, b) => String(b.data_inicio_atividade || "").localeCompare(String(a.data_inicio_atividade || "")));
    case "capital": return l.sort((a, b) => (Number(b.capital_social) || 0) - (Number(a.capital_social) || 0));
    default: return l;
  }
}

function controlesVista(total) {
  return `
    <label class="chk" title="Selecionar todos"><input type="checkbox" class="marcar" id="sel-todos" ${total && E.selecao.size >= total ? "checked" : ""}></label>
    <select class="entrada" id="ordem" style="width:auto;height:32px" aria-label="Ordenar">
      <option value="padrao">Ordem da base</option>
      <option value="nome">Nome (A–Z)</option>
      <option value="antigas">Abertura mais antiga</option>
      <option value="novas">Abertura mais recente</option>
      <option value="capital">Maior capital social</option>
    </select>
    <div class="alternar" role="group" aria-label="Visualização">
      <button type="button" data-vista="lista" aria-pressed="${E.vista === "lista"}" title="Lista">${ico("lista")}</button>
      <button type="button" data-vista="grade" aria-pressed="${E.vista === "grade"}" title="Grade">${ico("grade")}</button>
    </div>`;
}

function ligarControlesVista(raiz, visiveis, redesenhar) {
  const ord = $("#ordem", raiz);
  if (ord) {
    ord.value = E.ordem;
    ord.onchange = () => {
      E.ordem = ord.value;
      redesenhar();
    };
  }
  $$("[data-vista]", raiz).forEach(
    (b) =>
      (b.onclick = () => {
        E.vista = b.dataset.vista;
        gravar("prosp.vista", E.vista);
        redesenhar();
      })
  );
  const todos = $("#sel-todos", raiz);
  if (todos)
    todos.onchange = () => {
      if (todos.checked) visiveis().forEach((r) => E.selecao.set(r.cnpj, r));
      else E.selecao.clear();
      redesenhar();
      atualizarBarraSelecao();
    };
}

// ============================================================ seleção em massa
function alternarSelecao(r, marcado) {
  if (marcado) E.selecao.set(r.cnpj, r);
  else E.selecao.delete(r.cnpj);
  atualizarBarraSelecao();
  const todos = $("#sel-todos");
  if (todos && !marcado) todos.checked = false;
}
function limparSelecao(redesenhar = true) {
  E.selecao.clear();
  atualizarBarraSelecao();
  if (redesenhar) {
    $$(".marcar").forEach((c) => (c.checked = false));
    $$(".sel").forEach((c) => c.classList.remove("sel"));
  }
}

function atualizarBarraSelecao() {
  const barra = $("#selecao");
  const n = E.selecao.size;
  if (!n || !["busca", "lista"].includes(E.ctx)) {
    barra.hidden = true;
    return;
  }
  barra.hidden = false;
  const naLista = E.ctx === "lista";
  barra.innerHTML = `
    <span class="qtd">${plural(n, "empresa selecionada", "empresas selecionadas")}</span>
    <button class="btn prim" data-a="lista">${ico("listas")}<span>${naLista ? "Copiar p/ lista" : "Adicionar à lista"}</span></button>
    <button class="btn" data-a="funil">${ico("funil")}<span>Funil</span></button>
    <button class="btn" data-a="exportar">${ico("baixar")}<span class="rot-longo">Exportar</span></button>
    ${naLista ? `<button class="btn" data-a="remover">${ico("lixo")}<span class="rot-longo">Tirar da lista</span></button>` : ""}
    <button class="btn fant ico-btn" data-a="limpar" title="Limpar seleção">${ico("fechar")}</button>`;
  barra.onclick = async (ev) => {
    const a = ev.target.closest("[data-a]")?.dataset.a;
    if (!a) return;
    const regs = [...E.selecao.values()];
    if (a === "limpar") return limparSelecao();
    if (a === "lista") return escolherListas(regs);
    if (a === "funil") return enviarFunil(regs);
    if (a === "exportar") return exportarCSV(regs, "empresas-selecionadas");
    if (a === "remover") {
      if (!(await confirmar("Tirar da lista", `Remover ${plural(regs.length, "empresa", "empresas")} desta lista?`, "Remover", true))) return;
      await api(`data/listas/${E.lista.id}/empresas`, { method: "DELETE", body: { cnpjs: regs.map((r) => r.cnpj) } });
      aviso("Removidas da lista");
      await carregarResumo();
      renderizar();
    }
  };
}

// ---------- adicionar a listas ----------
async function escolherListas(registros, unico = false) {
  const atuais = unico ? new Set(E.resumo.marcadores[registros[0].cnpj]?.listas || []) : new Set();
  const listas = E.resumo.listas;
  const corpo = `
    <div class="opcoes-lista">
      ${listas.length
        ? listas
            .map(
              (l) => `<label class="chk"><input type="checkbox" value="${l.id}" ${atuais.has(l.id) ? "checked" : ""}>
                <span class="selo"><span class="bola" style="background:${esc(l.cor)}"></span></span>${esc(l.nome)}
                <span class="muted peq" style="margin-left:auto">${l.total}</span></label>`
            )
            .join("")
        : `<p class="muted" style="margin:0">Você ainda não tem listas. Crie a primeira abaixo.</p>`}
    </div>
    <div class="campo"><label for="m-nova">Nova lista</label>
      <input id="m-nova" class="entrada" placeholder="Ex.: Indústrias — Sorocaba" maxlength="80"></div>`;
  const r = await abrirModal({
    titulo: unico ? "Listas desta empresa" : `Adicionar ${plural(registros.length, "empresa", "empresas")}`,
    corpo,
    botoes: [
      { rotulo: "Cancelar", valor: null },
      {
        rotulo: "Salvar",
        classe: "prim",
        acao: (m) => ({
          marcadas: $$(".opcoes-lista input:checked", m).map((i) => Number(i.value)),
          nova: $("#m-nova", m).value.trim(),
        }),
      },
    ],
  });
  if (!r) return;
  try {
    const alvo = new Set(r.marcadas);
    if (r.nova) {
      const nl = await api("data/listas", { method: "POST", body: { nome: r.nova, cor: corAleatoria() } });
      alvo.add(nl.id);
    }
    const adicionar = [...alvo].filter((id) => !atuais.has(id));
    const remover = unico ? [...atuais].filter((id) => !alvo.has(id)) : [];
    for (const id of adicionar) await api(`data/listas/${id}/empresas`, { method: "POST", body: { empresas: registros } });
    for (const id of remover) await api(`data/listas/${id}/empresas`, { method: "DELETE", body: { cnpjs: [registros[0].cnpj] } });
    await carregarResumo();
    aviso(adicionar.length || remover.length ? "Listas atualizadas" : "Nada mudou");
    if (!unico) limparSelecao();
    redesenharAtual();
  } catch (e) {
    aviso(e.message, true);
  }
}

const CORES = ["#3b6ea5", "#2e7d4f", "#a8700f", "#b23b3b", "#6a5acd", "#d0662d", "#1f8a8a", "#8a4f9e", "#5b6b2f"];
const corAleatoria = () => CORES[Math.floor(Math.random() * CORES.length)];

// ---------- enviar ao funil ----------
async function enviarFunil(registros, unico = false) {
  const etapas = E.resumo.etapas;
  if (!etapas.length) await carregarResumo();
  const origemPadrao = E.ctx === "lista" ? `Lista: ${E.resumo.listas.find((l) => l.id === E.lista.id)?.nome || ""}` : "Busca";
  const r = await abrirModal({
    titulo: unico ? "Enviar ao funil" : `Enviar ${plural(registros.length, "empresa", "empresas")} ao funil`,
    texto: unico ? "" : "Empresas que já estão no funil ficam onde estão.",
    corpo: `
      <div class="campo"><label for="m-etapa">Etapa</label>
        <select id="m-etapa" class="entrada">${E.resumo.etapas
          .filter((e) => e.tipo === "aberta")
          .map((e) => `<option value="${e.id}">${esc(e.nome)}</option>`)
          .join("")}</select></div>
      <div class="campo"><label for="m-origem">Origem (opcional)</label>
        <input id="m-origem" class="entrada" value="${esc(origemPadrao)}" maxlength="80"></div>`,
    botoes: [
      { rotulo: "Cancelar", valor: null },
      { rotulo: "Enviar", classe: "prim", acao: (m) => ({ etapa: $("#m-etapa", m).value, origem: $("#m-origem", m).value.trim() }) },
    ],
  });
  if (!r) return;
  try {
    const res = await api("data/negocios", { method: "POST", body: { empresas: registros, etapa_id: r.etapa, origem: r.origem } });
    await carregarResumo();
    aviso(
      res.ja_estavam
        ? `${plural(res.adicionados, "nova no funil", "novas no funil")} · ${res.ja_estavam} já estavam`
        : `${plural(res.adicionados, "empresa enviada", "empresas enviadas")} ao funil`
    );
    if (!unico) limparSelecao();
    redesenharAtual();
  } catch (e) {
    aviso(e.message, true);
  }
}

// ---------- exportar ----------
function exportarCSV(registros, nomeArquivo, extras = null) {
  const cab = [
    "CNPJ", "Razão social", "Nome fantasia", "Situação", "Abertura", "Porte", "MEI", "Capital social",
    "Natureza jurídica", "Matriz/Filial", "CNAE principal", "Descrição CNAE", "Endereço", "Bairro", "Cidade", "UF", "CEP",
    "Telefone 1", "Telefone 2", "E-mail", "Sócios",
  ];
  if (extras) cab.push(...extras.cabecalho);
  const linhas = registros.map((r) => {
    const tel = telefonesDe(r);
    const end = enderecoDe(r);
    const base = [
      fmtCNPJ(r.cnpj), r.razao_social, r.nome_fantasia, r.descricao_situacao_cadastral, fmtData(r.data_inicio_atividade),
      porteDe(r).nome, r.opcao_pelo_mei ? "Sim" : "Não", r.capital_social ?? "", r.natureza_juridica,
      ehMatriz(r) ? "Matriz" : "Filial", cnae7(r.cnae_fiscal), r.cnae_fiscal_descricao, end.l1, titulo(r.bairro),
      titulo(r.municipio), r.uf, end.cep, tel[0]?.exib || "", tel[1]?.exib || "", emailDe(r),
      (r.qsa || []).map((s) => `${titulo(s.nome_socio)} (${s.qualificacao_socio || ""})`).join(" | "),
    ];
    if (extras) base.push(...extras.valores(r));
    return base;
  });
  baixarCSV([cab, ...linhas], nomeArquivo);
  aviso(`${plural(registros.length, "empresa exportada", "empresas exportadas")}`);
}

// CSV com ; e BOM (abre direto no Excel e no Numbers com acentos)
function baixarCSV(linhas, nomeArquivo) {
  const csv = linhas.map((l) => l.map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`).join(";")).join("\r\n");
  const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `${nomeArquivo}-${hojeISO()}.csv`;
  document.body.append(a);
  a.click();
  setTimeout(() => {
    URL.revokeObjectURL(a.href);
    a.remove();
  }, 1000);
}

function redesenharAtual() {
  if (E.ctx === "busca") desenharResultados();
  else if (E.ctx === "lista") desenharLista();
  else if (E.ctx === "funil") desenharQuadro();
  if (E.gaveta) desenharGaveta();
}

// ============================================================ tela: BUSCA
function telaBusca(main) {
  const f = E.busca.filtros;
  main.innerHTML = `
    <div class="busca">
      <aside class="filtros" id="filtros" aria-label="Filtros">
        <div class="linha"><h2 style="margin-right:auto">Filtros</h2>
          <button class="btn fant ico-btn btn-filtros" id="fechar-filtros" aria-label="Fechar filtros">${ico("fechar")}</button></div>

        <div class="campo">
          <label for="f-uf">Estado</label>
          <select id="f-uf" class="entrada">${UFS.map((u) => `<option ${u === f.uf ? "selected" : ""}>${u}</option>`).join("")}</select>
        </div>
        <div class="campo">
          <label for="f-cidade">Cidade</label>
          <div class="auto"><input id="f-cidade" class="entrada" placeholder="Digite a cidade" autocomplete="off"></div>
          <div class="fichas" id="f-cidades"></div>
          <p class="dica">Sem cidade, a busca percorre o estado inteiro.</p>
        </div>
        <div class="campo">
          <label for="f-cnae">Segmento (CNAE)</label>
          <div class="auto"><input id="f-cnae" class="entrada" placeholder="Ex.: restaurante, 4744, construção" autocomplete="off"></div>
          <div class="fichas" id="f-cnaes"></div>
          <label class="chk peq"><input type="checkbox" id="f-sec" ${f.secundario ? "checked" : ""}> Incluir atividades secundárias</label>
        </div>
        <div class="campo">
          <span class="rotulo">Tamanho (porte na Receita)</span>
          <div class="pilulas" id="f-portes">
            ${[["MEI", "MEI"], ["ME", "Micro"], ["EPP", "Pequena"], ["DEMAIS", "Demais"], ["NI", "Não informado"]]
              .map(([c, n]) => `<button type="button" class="pilula" data-p="${c}" aria-pressed="${f.portes.includes(c)}">${n}</button>`)
              .join("")}
          </div>
          <p class="dica">Nenhum marcado = todos os portes.</p>
        </div>
        <div class="campo">
          <span class="rotulo">Capital social (R$)</span>
          <div class="grade-2">
            <input id="f-capmin" class="entrada num" inputmode="numeric" placeholder="Mínimo" value="${esc(f.capMin)}">
            <input id="f-capmax" class="entrada num" inputmode="numeric" placeholder="Máximo" value="${esc(f.capMax)}">
          </div>
        </div>
        <div class="campo">
          <span class="rotulo">Ano de abertura</span>
          <div class="grade-2">
            <input id="f-anode" class="entrada num" inputmode="numeric" maxlength="4" placeholder="De" value="${esc(f.anoDe)}">
            <input id="f-anoate" class="entrada num" inputmode="numeric" maxlength="4" placeholder="Até" value="${esc(f.anoAte)}">
          </div>
        </div>
        <div class="campo">
          <span class="rotulo">Cadastro</span>
          <label class="chk"><input type="checkbox" id="f-ativas" ${f.soAtivas ? "checked" : ""}> Somente ativas</label>
          <select id="f-tipo" class="entrada">
            <option value="todas" ${f.tipo === "todas" ? "selected" : ""}>Matriz e filiais</option>
            <option value="matriz" ${f.tipo === "matriz" ? "selected" : ""}>Somente matriz</option>
            <option value="filial" ${f.tipo === "filial" ? "selected" : ""}>Somente filiais</option>
          </select>
        </div>
        <div class="campo">
          <span class="rotulo">Contato disponível</span>
          <label class="chk"><input type="checkbox" id="f-tel" ${f.comTelefone ? "checked" : ""}> Com telefone</label>
          <label class="chk"><input type="checkbox" id="f-mail" ${f.comEmail ? "checked" : ""}> Com e-mail</label>
        </div>
        <div class="campo">
          <label for="f-nome">Nome contém</label>
          <input id="f-nome" class="entrada" placeholder="Parte do nome ou razão social" value="${esc(f.nome)}">
        </div>
        <div class="acoes">
          <button class="btn" id="f-limpar" type="button">Limpar</button>
          <button class="btn prim" id="f-buscar" type="button">${ico("busca")} Pesquisar</button>
        </div>
      </aside>
      <section>
        <div class="resultados-topo" id="res-topo"></div>
        <div class="resultados" id="res"></div>
      </section>
    </div>`;

  const desenharFichas = () => {
    $("#f-cidades").innerHTML = f.cidades
      .map((c, i) => `<span class="ficha"><span>${esc(c.nome)} - ${esc(c.uf)}</span><button data-i="${i}" aria-label="Remover">×</button></span>`)
      .join("");
    $("#f-cnaes").innerHTML = f.cnaes
      .map((c, i) => `<span class="ficha" title="${esc(c.descricao)}"><span>${esc(c.id)} · ${esc(c.descricao)}</span><button data-i="${i}" aria-label="Remover">×</button></span>`)
      .join("");
  };
  desenharFichas();
  $("#f-cidades").onclick = (ev) => {
    const b = ev.target.closest("button");
    if (b) { f.cidades.splice(Number(b.dataset.i), 1); desenharFichas(); }
  };
  $("#f-cnaes").onclick = (ev) => {
    const b = ev.target.closest("button");
    if (b) { f.cnaes.splice(Number(b.dataset.i), 1); desenharFichas(); }
  };

  autocompletar($("#f-cidade"), {
    fonte: async (q) => buscarTexto(await carregarMunicipios($("#f-uf").value), q, ["nome"], 30).filter((m) => !f.cidades.some((c) => c.id === m.id)),
    item: (m) => esc(m.nome),
    escolher: (m) => {
      f.cidades.push({ id: m.id, nome: m.nome, uf: $("#f-uf").value });
      desenharFichas();
    },
    vazio: "Nenhuma cidade com esse nome nesta UF",
  });
  autocompletar($("#f-cnae"), {
    fonte: async (q) => {
      const lista = await carregarCnaes();
      const d = digitos(q);
      if (d.length >= 2 && d.length === q.replace(/[\s.\-/]/g, "").length) {
        return lista.filter((c) => c.id.startsWith(d) || c.id.startsWith(d.padStart(7, "0"))).slice(0, 40);
      }
      return buscarTexto(lista, q, ["descricao", "id", "divisao"], 40);
    },
    item: (c) => `${esc(c.descricao)}<small>${esc(c.id)} · ${esc(titulo(c.divisao))}</small>`,
    escolher: (c) => {
      if (!f.cnaes.some((x) => x.id === c.id)) f.cnaes.push({ id: c.id, descricao: c.descricao });
      desenharFichas();
    },
    vazio: "Nenhum segmento encontrado",
  });

  $("#f-portes").onclick = (ev) => {
    const b = ev.target.closest(".pilula");
    if (!b) return;
    const on = b.getAttribute("aria-pressed") !== "true";
    b.setAttribute("aria-pressed", String(on));
  };

  const lerFiltros = () => {
    f.uf = $("#f-uf").value;
    f.secundario = $("#f-sec").checked;
    f.portes = $$("#f-portes .pilula").filter((b) => b.getAttribute("aria-pressed") === "true").map((b) => b.dataset.p);
    f.capMin = digitos($("#f-capmin").value);
    f.capMax = digitos($("#f-capmax").value);
    f.anoDe = digitos($("#f-anode").value).slice(0, 4);
    f.anoAte = digitos($("#f-anoate").value).slice(0, 4);
    f.soAtivas = $("#f-ativas").checked;
    f.tipo = $("#f-tipo").value;
    f.comTelefone = $("#f-tel").checked;
    f.comEmail = $("#f-mail").checked;
    f.nome = $("#f-nome").value.trim();
    gravar("prosp.filtros", f);
  };

  $("#f-buscar").onclick = () => {
    lerFiltros();
    $("#filtros").classList.remove("aberto");
    pesquisar(true);
  };
  $("#f-nome").addEventListener("keydown", (ev) => ev.key === "Enter" && $("#f-buscar").click());
  $("#f-limpar").onclick = () => {
    E.busca.filtros = { ...FILTROS_PADRAO, uf: f.uf, cidades: [], cnaes: [], portes: [] };
    gravar("prosp.filtros", E.busca.filtros);
    telaBusca(main);
  };
  $("#fechar-filtros").onclick = () => $("#filtros").classList.remove("aberto");

  desenharResultados();
}

function passaFiltros(r, f) {
  if (f.soAtivas && !ativa(r)) return false;
  if (f.tipo === "matriz" && !ehMatriz(r)) return false;
  if (f.tipo === "filial" && ehMatriz(r)) return false;
  if (f.portes.length && !f.portes.includes(porteDe(r).cod)) return false;
  const cap = Number(r.capital_social) || 0;
  if (f.capMin && cap < Number(f.capMin)) return false;
  if (f.capMax && cap > Number(f.capMax)) return false;
  const ano = anoAbertura(r);
  if (f.anoDe && (!ano || ano < Number(f.anoDe))) return false;
  if (f.anoAte && (!ano || ano > Number(f.anoAte))) return false;
  if (f.comTelefone && !telefonesDe(r).length) return false;
  if (f.comEmail && !emailDe(r)) return false;
  if (f.nome) {
    const n = norm(f.nome);
    if (!norm(`${r.razao_social} ${r.nome_fantasia}`).includes(n)) return false;
  }
  return true;
}

function resumoFiltros(f) {
  const partes = [];
  partes.push(f.cidades.length ? f.cidades.map((c) => c.nome).join(", ") : f.uf);
  if (f.cnaes.length) partes.push(f.cnaes.map((c) => c.descricao).join(", "));
  return partes.join(" · ");
}

async function pesquisar(novo) {
  const B = E.busca;
  const f = B.filtros;
  if (B.carregando) return;
  if (novo) {
    B.resultados = [];
    B.vistos = new Set();
    B.brutos = 0;
    B.cursor = null;
    E.selecao.clear();
    atualizarBarraSelecao();
  }
  const params = new URLSearchParams();
  if (f.cidades.length) params.set("municipio", f.cidades.map((c) => c.id).join(","));
  else params.set("uf", f.uf);
  if (f.cnaes.length) params.set(f.secundario ? "cnae" : "cnae_fiscal", f.cnaes.map((c) => String(parseInt(c.id, 10))).join(","));
  params.set("limit", "400");

  B.carregando = true;
  B.erro = null;
  B.buscou = true;
  desenharResultados();

  const alvo = B.resultados.length + 60;
  try {
    for (let rodada = 0; rodada < 5; rodada++) {
      if (B.cursor) params.set("cursor", B.cursor);
      const res = await api(`receita/busca?${params.toString()}`, { timeout: 90000 });
      B.brutos += res.data.length;
      for (const r of res.data) {
        r.cnpj = digitos(r.cnpj);
        if (B.vistos.has(r.cnpj)) continue;
        B.vistos.add(r.cnpj);
        if (passaFiltros(r, f)) B.resultados.push(r);
      }
      B.cursor = res.cursor || null;
      if (!B.cursor || B.resultados.length >= alvo) break;
      desenharResultados();
    }
  } catch (e) {
    B.erro = e.message;
  } finally {
    B.carregando = false;
    desenharResultados();
  }
}

function desenharResultados() {
  const topo = $("#res-topo");
  const area = $("#res");
  if (!topo || !area) return;
  const B = E.busca;
  const lista = ordenar(B.resultados);

  topo.innerHTML = `
    <button class="btn btn-filtros" id="abrir-filtros">${ico("filtro")} Filtros</button>
    <span class="contagem">${
      B.buscou
        ? `${plural(B.resultados.length, "empresa", "empresas")} <span class="muted peq" style="font-weight:500">· ${B.brutos.toLocaleString("pt-BR")} analisadas</span>`
        : "Resultados"
    }</span>
    ${B.resultados.length ? controlesVista(lista.length) : ""}`;
  $("#abrir-filtros").onclick = () => $("#filtros").classList.add("aberto");
  ligarControlesVista(topo, () => lista, desenharResultados);

  if (!B.buscou) {
    area.innerHTML = `<div class="vazio">${ico("busca")}<h3>Monte sua busca</h3>
      <p>Escolha estado, cidade e segmento nos filtros e toque em Pesquisar. Os dados vêm da base pública de CNPJs da Receita Federal.</p></div>`;
    return;
  }
  let html = "";
  if (B.erro) html += `<div class="alerta">${esc(B.erro)}</div>`;
  if (lista.length) html += htmlEmpresas(lista);
  else if (!B.carregando)
    html += `<div class="vazio">${ico("vazio")}<h3>Nenhuma empresa com esses filtros</h3>
      <p>${B.cursor ? "Ainda há mais empresas na base para analisar. Use “Buscar mais” ou afrouxe os filtros." : "Tente outra cidade, outro segmento ou menos filtros."}</p></div>`;
  if (B.carregando) html += `<div class="carregando"><span class="giro"></span> Consultando a base da Receita…</div>`;
  else if (B.cursor)
    html += `<div class="mais"><button class="btn" id="buscar-mais">${ico("mais")} Buscar mais</button></div>`;
  area.innerHTML = html;
  ligarEmpresas(area, lista);
  const mais = $("#buscar-mais");
  if (mais) mais.onclick = () => pesquisar(false);
}

// ============================================================ tela: LISTAS
async function telaListas(main, id) {
  if (!E.resumo.listas.length) await carregarResumo();
  const listas = E.resumo.listas;
  if (!id && listas.length && window.innerWidth > 760) id = listas[0].id;
  E.lista.id = id && listas.some((l) => l.id === id) ? id : null;
  const atual = listas.find((l) => l.id === E.lista.id);

  main.innerHTML = `
    <div class="topo"><h1>Listas</h1>
      <button class="btn prim" id="nova-lista">${ico("mais")} Nova lista</button></div>
    <div class="listas-lay">
      <nav class="listas-menu">${
        listas.length
          ? listas
              .map(
                (l) => `<a href="#/listas/${l.id}" class="${l.id === E.lista.id ? "ativo" : ""}">
                  <span class="bola" style="background:${esc(l.cor)}"></span><span class="nome-l">${esc(l.nome)}</span><span class="n num">${l.total}</span></a>`
              )
              .join("")
          : `<p class="muted peq" style="padding:6px 10px;margin:0">Nenhuma lista ainda.</p>`
      }</nav>
      <section>
        ${
          atual
            ? `<div class="resultados-topo" id="lista-topo"></div><div class="resultados" id="lista-res"></div>`
            : `<div class="vazio">${ico("listas")}<h3>${listas.length ? "Escolha uma lista" : "Crie sua primeira lista"}</h3>
               <p>Listas guardam empresas que você separou nas buscas. Selecione resultados e use “Adicionar à lista”.</p></div>`
        }
      </section>
    </div>`;

  $("#nova-lista").onclick = async () => {
    const nome = await pedirTexto("Nova lista", "Nome da lista", "", "Ex.: Indústrias — Sorocaba");
    if (!nome) return;
    try {
      const l = await api("data/listas", { method: "POST", body: { nome, cor: corAleatoria() } });
      await carregarResumo();
      location.hash = `#/listas/${l.id}`;
    } catch (e) {
      aviso(e.message, true);
    }
  };

  if (!atual) return;
  E.lista.carregando = true;
  desenharLista();
  try {
    E.lista.empresas = (await api(`data/listas/${atual.id}/empresas`)).map((r) => ({ ...r, cnpj: digitos(r.cnpj) }));
  } catch (e) {
    aviso(e.message, true);
    E.lista.empresas = [];
  }
  E.lista.carregando = false;
  desenharLista();
}

function desenharLista() {
  const topo = $("#lista-topo");
  const area = $("#lista-res");
  if (!topo || !area) return;
  const l = E.resumo.listas.find((x) => x.id === E.lista.id);
  if (!l) return;
  const filtro = norm(E.lista.filtro);
  const regs = ordenar(
    E.lista.empresas.filter((r) => !filtro || norm(`${r.razao_social} ${r.nome_fantasia} ${r.municipio} ${r.cnae_fiscal_descricao}`).includes(filtro))
  );
  topo.innerHTML = `
    <span class="contagem"><span class="selo"><span class="bola" style="background:${esc(l.cor)}"></span></span> ${esc(l.nome)}
      <span class="muted peq" style="font-weight:500">· ${plural(E.lista.empresas.length, "empresa", "empresas")}</span></span>
    <input class="entrada" id="lista-filtro" placeholder="Filtrar nesta lista" value="${esc(E.lista.filtro)}" style="width:200px;height:32px">
    ${regs.length ? controlesVista(regs.length) : ""}
    <button class="btn ico-btn" id="lista-menu" title="Mais opções" aria-label="Mais opções">⋯</button>`;
  ligarControlesVista(topo, () => regs, desenharLista);
  const inp = $("#lista-filtro");
  inp.oninput = () => {
    E.lista.filtro = inp.value;
    const pos = inp.selectionStart;
    desenharLista();
    const novo = $("#lista-filtro");
    novo.focus();
    novo.setSelectionRange(pos, pos);
  };
  $("#lista-menu").onclick = (ev) =>
    abrirMenu(
      ev.currentTarget,
      `<button data-v="tudo-funil">Enviar todas ao funil</button>
       <button data-v="exportar">Exportar lista (CSV)</button>
       <div class="sep"></div>
       <button data-v="renomear">Renomear</button>
       <button data-v="cor">Trocar cor</button>
       <div class="sep"></div>
       <button data-v="apagar" style="color:var(--danger)">Apagar lista</button>`,
      async (v) => {
        try {
          if (v === "tudo-funil") return E.lista.empresas.length && enviarFunil(E.lista.empresas);
          if (v === "exportar") return exportarCSV(E.lista.empresas, `lista-${norm(l.nome).replace(/\W+/g, "-")}`);
          if (v === "renomear") {
            const nome = await pedirTexto("Renomear lista", "Nome", l.nome);
            if (!nome) return;
            await api(`data/listas/${l.id}`, { method: "PATCH", body: { nome } });
          }
          if (v === "cor") {
            const i = CORES.indexOf(l.cor);
            await api(`data/listas/${l.id}`, { method: "PATCH", body: { cor: CORES[(i + 1) % CORES.length] } });
          }
          if (v === "apagar") {
            if (!(await confirmar("Apagar lista", `Apagar “${l.nome}”? As empresas continuam no funil, se estiverem lá.`, "Apagar", true))) return;
            await api(`data/listas/${l.id}`, { method: "DELETE" });
            await carregarResumo();
            location.hash = "#/listas";
            return;
          }
          await carregarResumo();
          renderizar();
        } catch (e) {
          aviso(e.message, true);
        }
      }
    );

  if (E.lista.carregando) {
    area.innerHTML = `<div class="carregando"><span class="giro"></span> Carregando…</div>`;
    return;
  }
  if (!E.lista.empresas.length) {
    area.innerHTML = `<div class="vazio">${ico("vazio")}<h3>Lista vazia</h3><p>Na busca, selecione empresas e use “Adicionar à lista”.</p></div>`;
    return;
  }
  area.innerHTML = regs.length ? htmlEmpresas(regs) : `<div class="vazio"><p>Nada corresponde ao filtro.</p></div>`;
  ligarEmpresas(area, regs);
}

// ============================================================ tela: FUNIL
let arrastando = false;

// Nome para exibir: a Receita grava sem acento ("PADARIA PAO BOM"); se o nome comercial do WhatsApp
// for o mesmo, ignorando acentos, usa a grafia dele ("Padaria Pão Bom").
function nomeEmpresa(r, waNome) {
  const base = nomeDe(r);
  const wa = String(waNome || "").trim();
  if (!wa) return base;
  const waExib = semSufixo(wa === wa.toUpperCase() ? titulo(wa) : wa);
  return comparavel(waExib) === comparavel(semSufixo((r.nome_fantasia || "").trim() || r.razao_social || "")) ? waExib : base;
}
const nomeNeg = (n) => (n.empresa ? nomeEmpresa(n.empresa, n.wa_nome) : n.contato_nome || "Contato sem nome");
function subNeg(n) {
  if (n.empresa) return `${titulo(n.empresa.municipio)} - ${n.empresa.uf}`;
  if (n.fonte === "site") return `Site · ${n.origem || "formulário"}`;
  return n.origem || "Contato";
}
function fmtTel(numero) {
  let d = digitos(numero);
  if (d.startsWith("55") && d.length >= 12) d = d.slice(2);
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return d;
}
const ROTULO_PASSO = {
  enviar_primeiro: "Primeiro contato",
  enviar_followup1: "Follow-up",
  enviar_followup2: "Nova tentativa",
  mover_outro_momento: "Sem resposta",
  enviar_retomada: "Retomada",
  encerrar: "Encerrar",
};
const passoLimpo = (p) => String(p || "").replace(/^enviando:/, "");
const fmtCurto = (iso) => {
  const d = new Date(iso);
  return isNaN(d) ? "" : d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
};
// "hoje, 10:37", "amanhã, 09:12", "qua, 21/10, 10:37"
function quando(iso, comHora = true) {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d)) return "";
  const mesmoDia = (a, b) => a.toDateString() === b.toDateString();
  const hora = d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  let dia;
  if (mesmoDia(d, new Date())) dia = "hoje";
  else if (mesmoDia(d, new Date(Date.now() + 864e5))) dia = "amanhã";
  else dia = d.toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "2-digit" }).replace(/\./g, "");
  return comHora ? `${dia}, ${hora}` : dia;
}

// Selos da automação no card do funil.
function selosAuto(n, et) {
  const s = [];
  if (n.nao_lidas > 0) s.push(`<span class="selo ok forte">${ico("whats")}${n.nao_lidas === 1 ? "1 nova" : `${n.nao_lidas} novas`}</span>`);
  const aberta = !et || et.tipo === "aberta";
  const p = passoLimpo(n.passo);
  if (n.optout) s.push(`<span class="selo perigo">Pediu para sair</span>`);
  else if (n.automacao === "ativa") {
    if (p === "enviar_primeiro") s.push(`<span class="selo acento">${ico("robo")}Envio aprovado</span>`);
    else if (p === "mover_outro_momento" || p === "encerrar") s.push(`<span class="selo acento" title="Aguardando resposta">${ico("robo")}Aguardando</span>`);
    else s.push(`<span class="selo acento" title="Próxima mensagem automática">${ico("robo")}${ROTULO_PASSO[p] || "Automação"} ${fmtCurto(n.proxima_acao_em)}</span>`);
  } else if (n.automacao === "pausada") s.push(`<span class="selo aviso">${ico("pausa")}Pausada</span>`);
  else if (n.automacao === "respondeu" && !n.nao_lidas) s.push(`<span class="selo ok">Respondeu</span>`);
  const rel = n.relatorio;
  if (rel?.vistas > 0) s.push(`<span class="selo ok" title="Abriu o pré-relatório${rel.visto_em ? ` (última vez ${esc(quando(rel.visto_em))})` : ""}">${ico("nota")}Viu o relatório${rel.vistas > 1 ? ` ${rel.vistas}×` : ""}</span>`);
  else if (rel && rel.status !== "rascunho" && !rel.enviado && aberta) s.push(`<span class="selo" title="Pré-relatório publicado, ainda não enviado">${ico("nota")}Relatório pronto</span>`);
  if (aberta && !n.optout && (n.wa_status === "nao_tem" || n.wa_status === "sem_numero")) s.push(`<span class="selo perigo">Sem WhatsApp</span>`);
  else if (aberta && et?.papel === "entrada" && n.automacao === "inativa")
    s.push(n.wa_status === "tem" ? `<span class="selo">${ico("whats")}Pronto p/ aprovar</span>` : `<span class="selo">Conferindo WhatsApp…</span>`);
  return s.join("");
}

async function telaFunil(main) {
  main.innerHTML = `
    <div class="topo"><h1>Funil</h1>
      <input class="entrada" id="funil-filtro" type="search" placeholder="Filtrar por nome ou telefone" style="width:230px;height:34px" value="${esc(E.funil.filtro)}">
      <button class="btn" id="funil-contato" title="Contato sem CNPJ (indicação, pessoa física)">${ico("pessoa")} Contato</button>
      <button class="btn" id="funil-cnpj">${ico("mais")} Por CNPJ</button>
      <button class="btn ico-btn" id="funil-exp" title="Exportar funil (CSV)" aria-label="Exportar funil">${ico("baixar")}</button>
    </div>
    <div class="quadro" id="quadro"><div class="carregando"><span class="giro"></span> Carregando…</div></div>`;
  $("#funil-filtro").oninput = (ev) => {
    E.funil.filtro = ev.target.value;
    desenharQuadro();
  };
  $("#funil-cnpj").onclick = adicionarPorCNPJ;
  $("#funil-contato").onclick = adicionarContato;
  $("#funil-exp").onclick = exportarFunil;
  await carregarResumo();
  await carregarFunil(true);
}

// completo: lê tudo; senão, só o que mudou desde a última leitura (economiza leituras do banco)
async function carregarFunil(completo = true) {
  try {
    if (completo || !E.funil.ultima) {
      E.funil.negocios = await api("data/negocios");
    } else {
      const novos = await api(`data/negocios?desde=${encodeURIComponent(E.funil.ultima)}`, { silencioso: true });
      const porId = new Map(E.funil.negocios.map((n) => [n.id, n]));
      for (const n of novos) porId.set(n.id, n);
      E.funil.negocios = [...porId.values()].sort((a, b) => String(b.atualizado_em).localeCompare(String(a.atualizado_em)));
    }
    E.funil.ultima = E.funil.negocios.reduce((m, n) => (String(n.atualizado_em) > m ? String(n.atualizado_em) : m), "");
  } catch (e) {
    if (completo) {
      aviso(e.message, true);
      E.funil.negocios = [];
    }
  }
  if (!arrastando) desenharQuadro();
}

function desenharQuadro() {
  const q = $("#quadro");
  if (!q) return;
  const rolagem = q.scrollLeft;
  const rolColunas = Object.fromEntries($$(".coluna", q).map((c) => [c.dataset.etapa, $(".coluna-cards", c)?.scrollTop || 0]));
  const filtro = norm(E.funil.filtro);
  const fd = digitos(E.funil.filtro);
  const negs = E.funil.negocios.filter(
    (n) =>
      !filtro ||
      norm(`${nomeNeg(n)} ${n.empresa?.razao_social || ""} ${n.empresa?.municipio || ""} ${n.contato_nome || ""} ${n.wa_nome || ""}`).includes(filtro) ||
      (fd.length >= 4 && digitos(`${n.telefone} ${n.wa_numero}`).includes(fd))
  );
  const hoje = hojeISO();
  if (!E.funil.negocios.length) {
    q.innerHTML = `<div class="vazio" style="margin:auto">${ico("funil")}<h3>Funil vazio</h3>
      <p>Envie empresas para cá a partir da busca, de uma lista ou da ficha da empresa — ou adicione pelo CNPJ ou como contato. Contatos do formulário do site também aparecem aqui.</p></div>`;
    return;
  }
  const card = (n, et) => {
    const pc = n.proximo_contato;
    const pcClasse = pc ? (pc < hoje ? "perigo" : pc === hoje ? "aviso" : "") : "";
    const icone = n.empresa ? "" : `<span class="tipo-c" title="${n.fonte === "site" ? "Contato do site" : "Contato sem CNPJ"}">${ico(n.fonte === "site" ? "site" : "pessoa")}</span>`;
    return `<article class="card-n ${n.nao_lidas > 0 ? "novas" : ""}" data-id="${n.id}">
      <span class="alca" title="Arrastar">${ico("alca")}</span>
      <div style="min-width:0">
        <div class="nome">${icone}${esc(nomeNeg(n))}</div>
        <div class="sub">${esc(subNeg(n))}</div>
        <div class="meta">
          ${selosAuto(n, et)}
          ${pc ? `<span class="selo ${pcClasse}">${pc < hoje ? "Atrasado · " : pc === hoje ? "Hoje · " : ""}${fmtData(pc).slice(0, 5)}</span>` : ""}
          ${n.valor ? `<span class="selo num">${fmtMoedaCurta(n.valor)}</span>` : ""}
          ${n.total_atividades ? `<span class="selo num" title="Registros de contato">${ico("nota")}${n.total_atividades}</span>` : ""}
        </div>
        ${n.ultima_atividade ? `<div class="ultima">${esc(n.ultima_atividade)}</div>` : ""}
      </div>
    </article>`;
  };
  q.innerHTML = E.resumo.etapas
    .map((et) => {
      const cards = negs.filter((n) => n.etapa_id === et.id).sort((a, b) => (b.nao_lidas > 0) - (a.nao_lidas > 0));
      const soma = cards.reduce((s, n) => s + (Number(n.valor) || 0), 0);
      const prontos = et.papel === "entrada" ? cards.filter((n) => n.automacao === "inativa" && n.wa_status === "tem" && !n.optout).length : 0;
      return `<section class="coluna" data-etapa="${et.id}">
        <div class="coluna-topo">
          <div class="t"><span class="bola" style="background:${esc(et.cor)}"></span>${esc(et.nome)}<span class="q num">${cards.length}</span></div>
          ${soma ? `<div class="soma num">${fmtMoedaCurta(soma)}</div>` : ""}
          ${prontos ? `<a class="btn peq prim aprovar-col" href="#/aprovar">${ico("aprovar")} Aprovar ${prontos}</a>` : ""}
        </div>
        <div class="coluna-cards">${cards.length ? cards.map((n) => card(n, et)).join("") : `<div class="coluna-vazia">Arraste para cá</div>`}</div>
      </section>`;
    })
    .join("");
  q.scrollLeft = rolagem;
  $$(".coluna", q).forEach((c) => {
    const cc = $(".coluna-cards", c);
    if (cc && rolColunas[c.dataset.etapa]) cc.scrollTop = rolColunas[c.dataset.etapa];
  });

  q.onclick = (ev) => {
    if (ev.target.closest(".alca") || ev.target.closest(".aprovar-col")) return;
    const c = ev.target.closest(".card-n");
    if (!c) return;
    const n = E.funil.negocios.find((x) => x.id === Number(c.dataset.id));
    if (n) abrirNegocio(n);
  };
  ligarArraste(q);
}

function ligarArraste(quadro) {
  quadro.onpointerdown = (ev) => {
    const alca = ev.target.closest(".alca");
    if (!alca || ev.button > 0) return;
    const card = alca.closest(".card-n");
    const id = Number(card.dataset.id);
    const neg = E.funil.negocios.find((n) => n.id === id);
    if (!neg) return;
    ev.preventDefault();
    arrastando = true;
    const r = card.getBoundingClientRect();
    const dx = ev.clientX - r.left;
    const dy = ev.clientY - r.top;
    const fantasma = card.cloneNode(true);
    fantasma.classList.add("fantasma");
    fantasma.style.width = `${r.width}px`;
    document.body.append(fantasma);
    card.classList.add("arrastando");
    let alvo = null;
    let rolagem = null;

    const mover = (e) => {
      fantasma.style.left = `${e.clientX - dx}px`;
      fantasma.style.top = `${e.clientY - dy}px`;
      const sob = document.elementFromPoint(e.clientX, e.clientY)?.closest(".coluna");
      if (sob !== alvo) {
        alvo?.classList.remove("alvo");
        alvo = sob;
        alvo?.classList.add("alvo");
      }
      const qb = quadro.getBoundingClientRect();
      clearInterval(rolagem);
      if (e.clientX > qb.right - 50) rolagem = setInterval(() => (quadro.scrollLeft += 14), 16);
      else if (e.clientX < qb.left + 50) rolagem = setInterval(() => (quadro.scrollLeft -= 14), 16);
    };
    const soltar = async () => {
      document.removeEventListener("pointermove", mover);
      document.removeEventListener("pointerup", soltar);
      document.removeEventListener("pointercancel", soltar);
      clearInterval(rolagem);
      fantasma.remove();
      card.classList.remove("arrastando");
      alvo?.classList.remove("alvo");
      arrastando = false;
      const novaEtapa = alvo ? Number(alvo.dataset.etapa) : null;
      if (novaEtapa && novaEtapa !== neg.etapa_id) await moverNegocio(neg, novaEtapa);
    };
    mover(ev);
    document.addEventListener("pointermove", mover);
    document.addEventListener("pointerup", soltar);
    document.addEventListener("pointercancel", soltar);
  };
}

async function moverNegocio(neg, etapaId) {
  const anterior = neg.etapa_id;
  const etapa = E.resumo.etapas.find((e) => e.id === etapaId);
  let motivo;
  if (etapa?.tipo === "perdido") {
    motivo = await pedirTexto("Motivo da perda", "Por que não avançou? (opcional)", "", "Ex.: sem orçamento agora");
    if (motivo === null) return;
  }
  neg.etapa_id = etapaId;
  desenharQuadro();
  try {
    await api(`data/negocios/${neg.id}`, { method: "PATCH", body: { etapa_id: etapaId, ...(motivo ? { motivo_perda: motivo } : {}) } });
    await carregarFunil(true);
    checarNovidades(true);
    const atual = E.funil.negocios.find((n) => n.id === neg.id);
    if (etapa?.tipo === "ganho") aviso("Venda marcada como ganha 🎉");
    else if (atual?.automacao === "ativa" && atual.passo === "enviar_retomada") aviso(`Retomada automática em ${fmtData(atual.proxima_acao_em.slice(0, 10))}`);
    else if (etapa?.papel === "entrada" && atual?.automacao === "inativa") aviso("De volta à fila de aprovação");
  } catch (e) {
    neg.etapa_id = anterior;
    desenharQuadro();
    aviso(e.message, true);
  }
}

async function adicionarPorCNPJ() {
  const v = await abrirModal({
    titulo: "Adicionar ao funil pelo CNPJ",
    corpo: `<div class="campo"><label for="m-cnpj">CNPJ</label>
      <input id="m-cnpj" class="entrada num" inputmode="numeric" placeholder="00.000.000/0000-00"></div>`,
    botoes: [
      { rotulo: "Cancelar", valor: null },
      {
        rotulo: "Buscar",
        classe: "prim",
        acao: (m) => {
          const d = digitos($("#m-cnpj", m).value);
          if (d.length !== 14) {
            aviso("CNPJ precisa ter 14 dígitos", true);
            return false;
          }
          return d;
        },
      },
    ],
  });
  if (!v) return;
  try {
    aviso("Consultando a Receita…");
    const r = await api(`receita/cnpj/${v}`);
    r.cnpj = digitos(r.cnpj);
    abrirEmpresa(r);
  } catch (e) {
    aviso(e.message, true);
  }
}

// Contato sem CNPJ: indicação, evento, pessoa física.
async function adicionarContato() {
  if (!E.resumo.etapas.length) await carregarResumo();
  const abertas = E.resumo.etapas.filter((e) => e.tipo === "aberta");
  const padrao = abertas.find((e) => e.papel === "conversa") || abertas[0];
  const entrada = E.resumo.etapas.find((e) => e.papel === "entrada");
  const r = await abrirModal({
    titulo: "Novo contato",
    texto: "Para quem não aparece na busca por CNPJ: indicação, contato de evento, pessoa física.",
    corpo: `
      <div class="campo"><label for="m-nome">Nome</label><input id="m-nome" class="entrada" maxlength="120" autocomplete="off"></div>
      <div class="campo"><label for="m-tel">WhatsApp com DDD</label><input id="m-tel" class="entrada num" inputmode="tel" placeholder="(15) 99999-9999" autocomplete="off"></div>
      <div class="campo"><label for="m-email">E-mail (opcional)</label><input id="m-email" class="entrada" type="email" autocomplete="off"></div>
      <div class="campo"><label for="m-int">Interesse ou observação (opcional)</label><textarea id="m-int" class="entrada" rows="2"></textarea></div>
      <div class="grade-2">
        <div class="campo"><label for="m-orig">Origem</label><input id="m-orig" class="entrada" value="Indicação" maxlength="80"></div>
        <div class="campo"><label for="m-et">Etapa</label><select id="m-et" class="entrada">${abertas
          .map((e) => `<option value="${e.id}" ${e.id === padrao?.id ? "selected" : ""}>${esc(e.nome)}</option>`)
          .join("")}</select></div>
      </div>
      ${entrada ? `<p class="dica">Na etapa “${esc(entrada.nome)}”, o contato entra na fila de aprovação do primeiro contato automático.</p>` : ""}`,
    botoes: [
      { rotulo: "Cancelar", valor: null },
      {
        rotulo: "Salvar",
        classe: "prim",
        acao: (m) => {
          const nome = $("#m-nome", m).value.trim();
          const tel = digitos($("#m-tel", m).value);
          if (nome.length < 2 || tel.length < 10 || tel.length > 13) {
            aviso("Informe nome e WhatsApp com DDD", true);
            return false;
          }
          return {
            nome,
            telefone: tel,
            email: $("#m-email", m).value.trim(),
            interesse: $("#m-int", m).value.trim(),
            origem: $("#m-orig", m).value.trim() || "Contato manual",
            etapa_id: Number($("#m-et", m).value),
          };
        },
      },
    ],
  });
  if (!r) return;
  try {
    const res = await api("data/contatos", { method: "POST", body: r });
    aviso("Contato criado");
    if (E.ctx === "funil") await carregarFunil(true);
    checarNovidades(true);
    abrirContato(res.id);
  } catch (e) {
    aviso(e.message, true);
  }
}

function exportarFunil() {
  const negs = E.funil.negocios;
  if (!negs.length) return aviso("O funil está vazio", true);
  const et = (id) => E.resumo.etapas.find((e) => e.id === id)?.nome || "";
  const AUTO = { inativa: "", ativa: "Automação ativa", respondeu: "Respondeu", assumida: "Com você", pausada: "Pausada", encerrada: "Encerrada" };
  const FONTE = { prospeccao: "Busca", site: "Site", manual: "Manual" };
  const cab = [
    "Nome", "Razão social", "CNPJ", "Contato", "Telefone", "WhatsApp", "E-mail", "Cidade", "UF", "Segmento", "Etapa", "Valor",
    "Próximo contato", "Origem", "Fonte", "Automação", "Próxima mensagem", "Motivo da perda", "Entrou no funil",
  ];
  const linhas = negs.map((n) => {
    const r = n.empresa || {};
    const p = passoLimpo(n.passo);
    return [
      nomeNeg(n), titulo(r.razao_social || ""), r.cnpj ? fmtCNPJ(r.cnpj) : "", n.contato_nome || "", fmtTel(n.telefone),
      n.wa_status === "tem" ? fmtTel(n.wa_numero) : n.wa_status === "nao_tem" ? "não tem" : "", n.email || emailDe(r),
      titulo(r.municipio || ""), r.uf || "", r.cnae_fiscal_descricao || "", et(n.etapa_id), n.valor ?? "", fmtData(n.proximo_contato),
      n.origem || "", FONTE[n.fonte] || n.fonte || "", AUTO[n.automacao] || "",
      n.automacao === "ativa" && n.proxima_acao_em ? `${ROTULO_PASSO[p] || ""} ${dataHora(n.proxima_acao_em)}` : "",
      n.motivo_perda || "", fmtData(n.criado_em),
    ];
  });
  baixarCSV([cab, ...linhas], "funil");
  aviso(`${plural(negs.length, "negócio exportado", "negócios exportados")}`);
}

// ============================================================ GAVETA (ficha da empresa ou do contato)
function abrirPainelGaveta() {
  $("#gaveta-fundo").hidden = false;
  const g = $("#gaveta");
  g.classList.add("aberta");
  g.setAttribute("aria-hidden", "false");
}

async function abrirEmpresa(registro) {
  E.gaveta = { tipo: "empresa", r: registro, negId: null, info: null, atividades: null, conversa: null };
  abrirPainelGaveta();
  desenharGaveta();
  await carregarInfoGaveta();
}

async function abrirContato(negId) {
  E.gaveta = { tipo: "contato", r: null, negId, info: null, atividades: null, conversa: null };
  abrirPainelGaveta();
  desenharGaveta();
  await carregarInfoGaveta();
}

const abrirNegocio = (n) => (n.empresa ? abrirEmpresa({ ...n.empresa, cnpj: digitos(n.empresa.cnpj) }) : abrirContato(n.id));

async function abrirNegocioPorId(id) {
  try {
    const d = await api(`data/negocios/${id}`);
    if (d.empresa) abrirEmpresa({ ...d.empresa, cnpj: digitos(d.empresa.cnpj) });
    else abrirContato(id);
  } catch (e) {
    aviso(e.message, true);
  }
}

async function carregarInfoGaveta() {
  const G = E.gaveta;
  if (!G) return;
  try {
    if (G.tipo === "contato") {
      const d = await api(`data/negocios/${G.negId}`);
      G.info = { negocio: d.negocio, listas: [] };
    } else {
      G.info = await api(`data/empresas/${G.r.cnpj}`);
      // o quadro do funil traz só parte dos dados: a ficha usa o registro completo salvo
      if (G.info.empresa) G.r = { ...G.r, ...G.info.empresa, cnpj: G.r.cnpj };
    }
    const neg = G.info.negocio;
    G.negId = neg?.id || null;
    if (neg) {
      const [ativs, conv] = await Promise.all([
        api(`data/negocios/${neg.id}/atividades`),
        api(`automacao/mensagens/${neg.id}`).catch(() => ({ mensagens: [], modelos: [] })),
      ]);
      G.atividades = ativs;
      G.conversa = conv;
    } else {
      G.atividades = null;
      G.conversa = null;
    }
  } catch (e) {
    aviso(e.message, true);
  }
  if (E.gaveta !== G) return;
  desenharGaveta();
  const neg = G.info?.negocio;
  if (neg?.nao_lidas > 0) marcarLidas(neg);
}
// chamada pelas novidades (resposta nova, envio): recarrega se a ficha continua aberta
const recarregarGaveta = () => carregarInfoGaveta();

async function marcarLidas(neg) {
  try {
    await api("automacao/acao", { method: "POST", body: { negocio_id: neg.id, acao: "lidas" } });
    neg.nao_lidas = 0;
    const n = E.funil.negocios.find((x) => x.id === neg.id);
    if (n) {
      n.nao_lidas = 0;
      if (E.ctx === "funil" && !arrastando) desenharQuadro();
    }
    checarNovidades(true);
  } catch {}
}

function fecharGaveta() {
  E.gaveta = null;
  $("#gaveta-fundo").hidden = true;
  const g = $("#gaveta");
  g.classList.remove("aberta");
  g.setAttribute("aria-hidden", "true");
}
$("#gaveta-fundo").onclick = fecharGaveta;

const ROTULO_TIPO = { nota: "Nota", ligacao: "Ligação", whatsapp: "WhatsApp", email: "E-mail", reuniao: "Reunião", sistema: "" };
const ICONE_TIPO = { nota: "nota", ligacao: "telefone", whatsapp: "whats", email: "email", reuniao: "reuniao", sistema: "sistema" };
const CAMPOS_DIGITANDO = ["n-texto", "w-texto", "w-outro", "ct-nome", "ct-tel", "ct-email", "ct-int"];

function desenharGaveta() {
  const G = E.gaveta;
  if (!G) return;
  const g = $("#gaveta");
  // a ficha é redesenhada quando chega mensagem: guarda o que está sendo digitado e a rolagem
  const digitado = CAMPOS_DIGITANDO.map((id) => [id, $(`#${id}`, g)]).filter(([, el]) => el && el.dataset.mexeu === "1").map(([id, el]) => [id, el.value]);
  const focado = document.activeElement && g.contains(document.activeElement) ? document.activeElement.id : null;
  const rolagem = $(".gaveta-corpo", g)?.scrollTop || 0;
  g.innerHTML = G.tipo === "contato" ? htmlGavetaContato(G) : htmlGavetaEmpresa(G);
  for (const [id, valor] of digitado) {
    const el = $(`#${id}`, g);
    if (el) {
      el.value = valor;
      el.dataset.mexeu = "1";
    }
  }
  g.oninput = (ev) => ev.target.id && CAMPOS_DIGITANDO.includes(ev.target.id) && (ev.target.dataset.mexeu = "1");
  if (focado && $(`#${focado}`, g)) $(`#${focado}`, g).focus({ preventScroll: true });
  const corpo = $(".gaveta-corpo", g);
  if (corpo) corpo.scrollTop = rolagem;
  const conv = $(".conversa", g);
  if (conv) conv.scrollTop = conv.scrollHeight;
  $("#g-fechar").onclick = fecharGaveta;
  if (G.tipo === "contato") ligarGavetaContato(G);
  else ligarGavetaEmpresa(G);
  const neg = G.info?.negocio;
  if (neg) {
    ligarNegocio(neg);
    ligarWhatsApp(neg, G);
    ligarRelatorioFicha(neg);
  }
}

// ---------- bloco "Pré-relatório" na ficha
function htmlRelatorioFicha(neg) {
  const r = neg.relatorio || { status: "nenhum" };
  const st = r.status || "nenhum";
  const vistas = r.visualizacoes || 0;
  return `<section class="secao" id="sec-rel"><h3>Pré-relatório ${seloRelatorio(st)}</h3><div class="conteudo-s">
    ${
      r.link
        ? `<div class="linha rl-link"><code>${esc(r.link)}</code><button class="btn peq" data-rel="copiar">${ico("copiar")} Copiar</button><a class="btn peq" href="${esc(linkInterno(r.link))}" target="_blank" rel="noopener">Abrir ↗</a></div>
           <p class="dica">${r.enviado_em ? `Enviado ${esc(quando(r.enviado_em))}` : "Ainda não enviado"} · ${
             vistas ? `aberto ${plural(vistas, "vez", "vezes")}${r.ultima_visualizacao_em ? `, a última ${esc(quando(r.ultima_visualizacao_em))}` : ""}` : "ainda não aberto pelo cliente"
           }</p>`
        : `<p class="auto-status">${st === "nenhum" ? "Leitura breve da marca a partir do que está público, para mandar antes ou durante a conversa." : "Em rascunho: o cliente ainda não vê."}</p>`
    }
    <div class="acoes-auto">
      <button class="btn peq ${r.link ? "" : "prim"}" data-rel="editor">${st === "nenhum" ? "Gerar pré-relatório" : r.link ? "Revisar" : "Continuar"}</button>
      ${r.link ? `<button class="btn peq" data-rel="mensagem">${ico("whats")} Pôr o link na mensagem</button>` : ""}
    </div>
  </div></section>`;
}

function ligarRelatorioFicha(neg) {
  const sec = $("#sec-rel");
  if (!sec) return;
  sec.onclick = (ev) => {
    const b = ev.target.closest("[data-rel]");
    if (!b) return;
    const link = neg.relatorio?.link;
    if (b.dataset.rel === "editor") return abrirEditorRelatorio(neg.id, location.hash || "#/funil");
    if (b.dataset.rel === "copiar") return copiar(link, "Link copiado");
    if (b.dataset.rel === "mensagem") {
      const ta = $("#w-texto");
      if (!ta || !link) return;
      if (!ta.value.includes(link)) ta.value = `${ta.value.trim() ? `${ta.value.trim()}\n\n` : ""}${link}`;
      ta.dataset.mexeu = "1";
      ta.scrollIntoView({ behavior: "smooth", block: "center" });
      ta.focus();
    }
  };
}

// ---------- ficha da empresa (Receita)
function htmlGavetaEmpresa(G) {
  const r = G.r;
  const p = porteDe(r);
  const tels = telefonesDe(r);
  const email = emailDe(r);
  const end = enderecoDe(r);
  const ano = anoAbertura(r);
  const anos = ano ? new Date().getFullYear() - ano : null;
  const neg = G.info?.negocio;
  const listasDaEmpresa = (G.info?.listas || []).map((id) => E.resumo.listas.find((l) => l.id === id)).filter(Boolean);
  const etapa = neg && E.resumo.etapas.find((e) => e.id === neg.etapa_id);
  const whatsLink = neg?.wa_numero ? `https://wa.me/${digitos(neg.wa_numero)}` : tels[0] ? `https://wa.me/55${tels[0].whats}` : "#";
  return `
    <div class="gaveta-topo">
      <div class="linha-1">
        <h2>${esc(nomeEmpresa(r, neg?.wa_nome))}</h2>
        <button class="btn fant ico-btn" id="g-fechar" aria-label="Fechar">${ico("fechar")}</button>
      </div>
      <div class="razao">${esc(titulo(r.razao_social))}</div>
      <div class="selos">
        <span class="selo ${ativa(r) ? "ok" : "perigo"}">${esc(titulo(r.descricao_situacao_cadastral || ""))}</span>
        <span class="selo">${esc(p.nome)}</span>
        <span class="selo">${ehMatriz(r) ? "Matriz" : "Filial"}</span>
        ${anos !== null ? `<span class="selo num">${plural(anos, "ano", "anos")}</span>` : ""}
        ${listasDaEmpresa.map((l) => `<span class="selo"><span class="bola" style="background:${esc(l.cor)}"></span>${esc(l.nome)}</span>`).join("")}
      </div>
      <div class="contatos">
        <a class="contato" id="c-tel" href="${tels[0] ? `tel:+55${tels[0].digitos}` : "#"}" aria-disabled="${!tels.length}">${ico("telefone")}Ligar</a>
        <a class="contato whats" id="c-whats" href="${whatsLink}" target="_blank" rel="noopener" aria-disabled="${whatsLink === "#"}">${ico("whats")}WhatsApp</a>
        <a class="contato" id="c-mapa" href="${linkMapsEndereco(r)}" target="_blank" rel="noopener" aria-disabled="${!end.l1}">${ico("mapa")}Localização</a>
        <a class="contato" id="c-mail" href="${email ? `mailto:${email}` : "#"}" aria-disabled="${!email}">${ico("email")}E-mail</a>
      </div>
    </div>
    <div class="gaveta-corpo">
      <div class="acoes-ficha">
        <button class="btn peq" id="g-listas">${ico("listas")} ${listasDaEmpresa.length ? "Listas" : "Adicionar à lista"}</button>
        ${neg ? "" : `<button class="btn peq" id="g-funil">${ico("funil")} Enviar ao funil</button>`}
        <button class="btn peq" id="g-semelhantes">${ico("semelhantes")} Semelhantes</button>
        <a class="btn peq" href="${linkMapsNome(r)}" target="_blank" rel="noopener">${ico("google")} Ver no Maps</a>
        <button class="btn peq ico-btn" id="g-mais" title="Mais" aria-label="Mais opções">⋯</button>
      </div>

      ${neg ? htmlWhatsApp(neg, G) + htmlRelatorioFicha(neg) + htmlNegocio(neg, etapa, G.atividades) : ""}

      <section class="secao"><h3>Dados gerais</h3><div class="conteudo-s"><dl class="dl">
        <dt>CNPJ</dt><dd class="num">${fmtCNPJ(r.cnpj)}</dd>
        <dt>Abertura</dt><dd>${fmtData(r.data_inicio_atividade) || "—"}</dd>
        <dt>Situação</dt><dd>${esc(titulo(r.descricao_situacao_cadastral || "—"))}${r.data_situacao_cadastral ? ` <span class="muted">desde ${fmtData(r.data_situacao_cadastral)}</span>` : ""}</dd>
        <dt>Porte</dt><dd>${esc(p.nome)}${r.opcao_pelo_simples ? ' <span class="muted">· Simples Nacional</span>' : ""}</dd>
        <dt>Capital social</dt><dd class="num">${r.capital_social !== undefined && r.capital_social !== null ? fmtMoeda(r.capital_social) : "—"}</dd>
        <dt>Natureza jurídica</dt><dd>${esc(r.natureza_juridica || "—")}</dd>
      </dl></div></section>

      <section class="secao"><h3>Contato</h3><div class="conteudo-s"><dl class="dl">
        <dt>Telefones</dt><dd>${
          tels.length
            ? tels.map((t) => `<a href="tel:+55${t.digitos}" class="num">${t.exib}</a>${t.celular ? ' <span class="selo ok">celular</span>' : ""}`).join("<br>")
            : '<span class="muted">Não informado</span>'
        }</dd>
        <dt>E-mail</dt><dd>${email ? `<a href="mailto:${esc(email)}">${esc(email)}</a>` : '<span class="muted">Não informado</span>'}</dd>
        <dt>Endereço</dt><dd>${esc(end.l1 || "—")}<br><span class="muted">${esc(end.l2)}${end.cep ? ` · ${end.cep}` : ""}</span></dd>
      </dl>
      <p class="dica" style="margin-top:10px">Telefone e e-mail são os declarados à Receita e podem estar desatualizados (às vezes são do contador). “Ver no Maps” mostra o perfil público da empresa.</p>
      </div></section>

      <section class="secao"><h3>Atividade</h3><div class="conteudo-s">
        <div><strong>${esc(r.cnae_fiscal_descricao || "—")}</strong> <code class="muted peq">${cnae7(r.cnae_fiscal)}</code></div>
        ${
          (r.cnaes_secundarios || []).filter((c) => c.codigo).length
            ? `<div class="rotulo" style="margin:12px 0 4px">Secundárias</div>` +
              r.cnaes_secundarios
                .filter((c) => c.codigo)
                .map((c) => `<div class="cnae-sec">${esc(c.descricao)} <code>${cnae7(c.codigo)}</code></div>`)
                .join("")
            : ""
        }
      </div></section>

      <section class="secao"><h3>Sócios e administradores</h3><div class="conteudo-s">${
        (r.qsa || []).length
          ? r.qsa
              .map(
                (s) => `<div class="socio"><div class="n">${esc(titulo(s.nome_socio))}</div>
                  <div class="muted peq">${esc(s.qualificacao_socio || "")}${s.data_entrada_sociedade ? ` · desde ${fmtData(s.data_entrada_sociedade)}` : ""}${s.faixa_etaria ? ` · ${esc(s.faixa_etaria)}` : ""}</div></div>`
              )
              .join("")
          : '<span class="muted">Não informado na base.</span>'
      }</div></section>

      <p class="dica">Fonte: base pública de CNPJs da Receita Federal (Minha Receita).</p>
    </div>`;
}

function ligarGavetaEmpresa(G) {
  const r = G.r;
  const neg = G.info?.negocio;
  const tels = telefonesDe(r);
  const email = emailDe(r);
  // contatos com escolha de número/modelo
  const modelos = (E.resumo.modelos || []).filter((m) => !m.passo);
  $("#c-whats").onclick = (ev) => {
    if (neg?.wa_numero || !tels.length) return;
    if (tels.length < 2 && !modelos.length) return;
    ev.preventDefault();
    const itens = [];
    for (const t of tels) {
      itens.push(`<a data-v="x" href="https://wa.me/55${t.whats}" target="_blank" rel="noopener">${t.exib}${t.celular ? "" : " <small>fixo — pode não ter WhatsApp</small>"}</a>`);
      for (const m of modelos) {
        itens.push(`<a data-v="x" href="https://wa.me/55${t.whats}?text=${encodeURIComponent(preencherModelo(m.texto, r))}" target="_blank" rel="noopener">&nbsp;&nbsp;↳ ${esc(m.titulo)}<small>${esc(preencherModelo(m.texto, r))}</small></a>`);
      }
      if (tels.length > 1) itens.push('<div class="sep"></div>');
    }
    abrirMenu(ev.currentTarget, itens.join(""));
  };
  $("#c-tel").onclick = (ev) => {
    if (tels.length < 2) return;
    ev.preventDefault();
    abrirMenu(ev.currentTarget, tels.map((t) => `<a data-v="x" href="tel:+55${t.digitos}">${t.exib}</a>`).join(""));
  };
  $("#c-mail").onclick = (ev) => {
    if (!email || !modelos.length) return;
    ev.preventDefault();
    abrirMenu(
      ev.currentTarget,
      `<a data-v="x" href="mailto:${esc(email)}">E-mail em branco</a>` +
        modelos.map((m) => `<a data-v="x" href="mailto:${esc(email)}?body=${encodeURIComponent(preencherModelo(m.texto, r))}">${esc(m.titulo)}</a>`).join("")
    );
  };

  $("#g-listas").onclick = () => escolherListas([r], true);
  $("#g-funil") && ($("#g-funil").onclick = () => enviarFunil([r], true));
  $("#g-semelhantes").onclick = () => buscarSemelhantes(r);
  $("#g-mais").onclick = (ev) =>
    abrirMenu(
      ev.currentTarget,
      `<button data-v="copiar">Copiar dados</button>
       <button data-v="cnpj">Copiar CNPJ</button>
       <button data-v="exportar">Exportar (CSV)</button>
       <button data-v="atualizar">Atualizar dados da Receita</button>
       ${neg ? '<div class="sep"></div><button data-v="sair-funil" style="color:var(--danger)">Tirar do funil</button>' : ""}`,
      async (v) => {
        if (v === "copiar") return copiar(textoEmpresa(r), "Dados copiados");
        if (v === "cnpj") return copiar(fmtCNPJ(r.cnpj), "CNPJ copiado");
        if (v === "exportar") return exportarCSV([r], `empresa-${r.cnpj}`);
        if (v === "atualizar") return atualizarDaReceita();
        if (v === "sair-funil") {
          if (!(await confirmar("Tirar do funil", "As anotações e a conversa registradas neste negócio serão apagadas.", "Tirar", true))) return;
          await api(`data/negocios/${neg.id}`, { method: "DELETE" });
          await carregarResumo();
          if (E.ctx === "funil") await carregarFunil(true);
          if (E.ctx === "aprovar") recarregarAprovar();
          await carregarInfoGaveta();
          redesenharAtual();
        }
      }
    );
}

// ---------- ficha do contato (site ou manual, sem CNPJ)
function htmlGavetaContato(G) {
  const neg = G.info?.negocio;
  if (!neg)
    return `<div class="gaveta-topo"><div class="linha-1"><h2>Carregando…</h2><button class="btn fant ico-btn" id="g-fechar" aria-label="Fechar">${ico("fechar")}</button></div></div>
      <div class="gaveta-corpo"><div class="carregando"><span class="giro"></span></div></div>`;
  const etapa = E.resumo.etapas.find((e) => e.id === neg.etapa_id);
  const t = neg.tracking || {};
  const tel = digitos(neg.wa_numero || neg.telefone);
  const email = neg.email || "";
  const local = [t.city, t.region].filter(Boolean).join(" - ");
  return `
    <div class="gaveta-topo">
      <div class="linha-1"><h2>${esc(neg.contato_nome || "Contato")}</h2><button class="btn fant ico-btn" id="g-fechar" aria-label="Fechar">${ico("fechar")}</button></div>
      <div class="razao">${neg.fonte === "site" ? "Contato do site" : "Contato sem CNPJ"}${neg.origem ? ` · ${esc(neg.origem)}` : ""}</div>
      <div class="selos">
        ${neg.fonte === "site" ? `<span class="selo acento">${ico("site")}Site</span>` : `<span class="selo">${ico("pessoa")}Manual</span>`}
        ${local ? `<span class="selo">${ico("mapa")}${esc(local)}</span>` : ""}
        <span class="selo num">desde ${fmtData(neg.criado_em)}</span>
      </div>
      <div class="contatos tres">
        <a class="contato" href="${tel ? `tel:+${tel}` : "#"}" aria-disabled="${!tel}">${ico("telefone")}Ligar</a>
        <a class="contato whats" href="${tel ? `https://wa.me/${tel}` : "#"}" target="_blank" rel="noopener" aria-disabled="${!tel}">${ico("whats")}WhatsApp</a>
        <a class="contato" href="${email ? `mailto:${esc(email)}` : "#"}" aria-disabled="${!email}">${ico("email")}E-mail</a>
      </div>
    </div>
    <div class="gaveta-corpo">
      <div class="acoes-ficha">
        <button class="btn peq" id="g-copiar">${ico("copiar")} Copiar dados</button>
        <button class="btn peq ico-btn" id="g-mais" title="Mais" aria-label="Mais opções">⋯</button>
      </div>
      ${htmlWhatsApp(neg, G)}
      ${htmlRelatorioFicha(neg)}
      ${htmlNegocio(neg, etapa, G.atividades)}
      <section class="secao"><h3>Contato</h3><div class="conteudo-s">
        <div class="grade-2">
          <div class="campo"><label for="ct-nome">Nome</label><input id="ct-nome" class="entrada" value="${esc(neg.contato_nome || "")}" maxlength="120"></div>
          <div class="campo"><label for="ct-tel">WhatsApp</label><input id="ct-tel" class="entrada num" inputmode="tel" value="${esc(fmtTel(neg.telefone))}"></div>
        </div>
        <div class="campo" style="margin-top:10px"><label for="ct-email">E-mail</label><input id="ct-email" class="entrada" type="email" value="${esc(email)}"></div>
        <div class="campo" style="margin-top:10px"><label for="ct-int">Interesse / observação</label><textarea id="ct-int" class="entrada" rows="2">${esc(neg.interesse || "")}</textarea></div>
      </div></section>
      ${htmlRastreamento(t, neg)}
    </div>`;
}

function ligarGavetaContato(G) {
  const neg = G.info?.negocio;
  if (!neg) return;
  const salvar = async (body, depois) => {
    try {
      await api(`data/negocios/${neg.id}`, { method: "PATCH", body });
      if (depois) await depois();
      await carregarInfoGaveta();
      if (E.ctx === "funil") carregarFunil(true);
    } catch (e) {
      aviso(e.message, true);
    }
  };
  $("#ct-nome").onchange = (ev) => ev.target.value.trim().length >= 2 && salvar({ contato_nome: ev.target.value.trim() });
  $("#ct-tel").onchange = (ev) => {
    const d = digitos(ev.target.value);
    if (d.length < 10 || d.length > 13) return aviso("Informe o número com DDD", true);
    salvar({ telefone: d }, () => api("automacao/acao", { method: "POST", body: { negocio_id: neg.id, acao: "verificar" } }).catch(() => {}));
  };
  $("#ct-email").onchange = (ev) => salvar({ email: ev.target.value.trim() });
  $("#ct-int").onchange = (ev) => salvar({ interesse: ev.target.value });
  $("#g-copiar").onclick = () =>
    copiar(
      [neg.contato_nome, neg.telefone && `WhatsApp: ${fmtTel(neg.telefone)}`, neg.email && `E-mail: ${neg.email}`, neg.interesse && `Interesse: ${neg.interesse}`, neg.origem && `Origem: ${neg.origem}`]
        .filter(Boolean)
        .join("\n"),
      "Dados copiados"
    );
  $("#g-mais").onclick = (ev) =>
    abrirMenu(ev.currentTarget, `<button data-v="apagar" style="color:var(--danger)">Apagar contato</button>`, async (v) => {
      if (v !== "apagar") return;
      if (!(await confirmar("Apagar contato", "O contato, as anotações e a conversa registrada aqui serão apagados (pedido de exclusão de dados, LGPD).", "Apagar", true))) return;
      try {
        await api(`data/negocios/${neg.id}`, { method: "DELETE" });
        fecharGaveta();
        if (E.ctx === "funil") await carregarFunil(true);
        if (E.ctx === "aprovar") recarregarAprovar();
        checarNovidades(true);
        aviso("Contato apagado");
      } catch (e) {
        aviso(e.message, true);
      }
    });
}

const hostDe = (u) => {
  try {
    return new URL(u).hostname.replace(/^www\./, "");
  } catch {
    return String(u || "");
  }
};
const caminhoDe = (u) => {
  try {
    const x = new URL(u);
    return x.pathname + (x.search.length > 1 ? "?…" : "");
  } catch {
    return String(u || "");
  }
};

function htmlRastreamento(t, neg) {
  if (!t || !(t.first || t.last || t.page)) return "";
  const toque = (x) => {
    if (!x) return "—";
    const fonte = x.utm_source
      ? `${x.utm_source}${x.utm_medium ? ` / ${x.utm_medium}` : ""}`
      : x.gclid || x.gbraid || x.wbraid
        ? "Google Ads"
        : x.fbclid
          ? "Meta (anúncio ou link)"
          : x.referrer
            ? hostDe(x.referrer)
            : "Direto";
    return `${esc(fonte)}${x.utm_campaign ? ` · campanha ${esc(x.utm_campaign)}` : ""}${x.landing ? ` · entrou por ${esc(caminhoDe(x.landing))}` : ""}${x.at ? ` <span class="muted">(${fmtData(x.at)})</span>` : ""}`;
  };
  const paginas = (t.pages || []).slice(-8).map((p) => esc(p[0])).join(" → ");
  const mesmo = JSON.stringify(t.last || {}) === JSON.stringify(t.first || {});
  return `<section class="secao"><h3>Origem do contato</h3><div class="conteudo-s"><dl class="dl">
    <dt>Origem</dt><dd>${esc(neg.origem || "—")}</dd>
    <dt>Primeira visita</dt><dd>${toque(t.first)}</dd>
    ${t.last && !mesmo ? `<dt>Última visita</dt><dd>${toque(t.last)}</dd>` : ""}
    <dt>Visitas</dt><dd class="num">${esc(t.visits || 1)}</dd>
    ${paginas ? `<dt>Páginas vistas</dt><dd class="peq">${paginas}</dd>` : ""}
    ${t.page ? `<dt>Formulário enviado em</dt><dd class="peq">${esc(caminhoDe(t.page))}</dd>` : ""}
  </dl><p class="dica" style="margin-top:10px">Vem do formulário do site (anúncio, campanha e páginas). Serve para medir de onde vêm as vendas.</p></div></section>`;
}

// ---------- bloco "No funil" (etapa, valor, próximo contato, anotações)
function htmlNegocio(neg, etapa, atividades) {
  return `
    <section class="secao negocio"><h3>No funil <span class="selo"><span class="bola" style="background:${esc(etapa?.cor || "#888")}"></span>${esc(etapa?.nome || "")}</span></h3>
      <div class="conteudo-s">
        <div class="grade-2">
          <div class="campo"><label for="n-etapa">Etapa</label>
            <select id="n-etapa" class="entrada">${E.resumo.etapas
              .map((e) => `<option value="${e.id}" ${e.id === neg.etapa_id ? "selected" : ""}>${esc(e.nome)}</option>`)
              .join("")}</select></div>
          <div class="campo"><label for="n-prox">Próximo contato</label>
            <input id="n-prox" type="date" class="entrada" value="${esc(neg.proximo_contato || "")}"></div>
          <div class="campo"><label for="n-valor">Valor (R$)</label>
            <input id="n-valor" class="entrada num" inputmode="decimal" placeholder="0" value="${neg.valor ?? ""}"></div>
          <div class="campo"><label>Origem</label><div style="padding-top:8px" class="muted">${esc(neg.origem || "—")}</div></div>
        </div>
        ${
          etapa?.tipo === "perdido"
            ? `<div class="campo" style="margin-top:8px"><label for="n-motivo">Motivo da perda</label>
               <input id="n-motivo" class="entrada" value="${esc(neg.motivo_perda || "")}" maxlength="200"></div>`
            : ""
        }
        <div class="campo" style="margin-top:14px">
          <label for="n-texto">Registrar contato ou nota</label>
          <textarea id="n-texto" class="entrada" placeholder="O que foi conversado, próximos passos…"></textarea>
          <div class="linha">
            <select id="n-tipo" class="entrada" style="width:auto">
              ${["nota", "ligacao", "whatsapp", "email", "reuniao"].map((t) => `<option value="${t}">${ROTULO_TIPO[t]}</option>`).join("")}
            </select>
            <button class="btn prim" id="n-salvar" style="margin-left:auto">Registrar</button>
          </div>
        </div>
        <div class="atividades">${
          atividades === null
            ? `<div class="carregando"><span class="giro"></span></div>`
            : atividades
                .map(
                  (a) => `<div class="ativ ${a.tipo === "sistema" ? "sistema" : ""}">${ico(ICONE_TIPO[a.tipo] || "nota")}
                    <div><div class="t">${a.tipo !== "sistema" ? `<strong>${ROTULO_TIPO[a.tipo]}:</strong> ` : ""}${esc(a.texto)}</div>
                    <time>${dataHora(a.criado_em)}</time></div>
                    ${a.tipo !== "sistema" ? `<button class="apagar" data-ativ="${a.id}" title="Apagar">×</button>` : "<span></span>"}</div>`
                )
                .join("")
        }</div>
      </div>
    </section>`;
}

function ligarNegocio(neg) {
  const salvarCampo = async (body) => {
    try {
      await api(`data/negocios/${neg.id}`, { method: "PATCH", body });
      if (body.etapa_id) checarNovidades(true);
      if (E.ctx === "funil") await carregarFunil(true);
      await carregarInfoGaveta();
      if (E.ctx !== "funil") redesenharAtual();
    } catch (e) {
      aviso(e.message, true);
    }
  };
  $("#n-etapa").onchange = async (ev) => {
    const id = Number(ev.target.value);
    const et = E.resumo.etapas.find((e) => e.id === id);
    const body = { etapa_id: id };
    if (et?.tipo === "perdido") {
      const motivo = await pedirTexto("Motivo da perda", "Por que não avançou? (opcional)", "", "Ex.: sem orçamento agora");
      if (motivo === null) {
        ev.target.value = neg.etapa_id;
        return;
      }
      if (motivo) body.motivo_perda = motivo;
    }
    salvarCampo(body);
  };
  $("#n-prox").onchange = (ev) => salvarCampo({ proximo_contato: ev.target.value || null });
  $("#n-valor").onchange = (ev) => {
    const v = ev.target.value.replace(/\./g, "").replace(",", ".").replace(/[^\d.]/g, "");
    salvarCampo({ valor: v === "" ? null : Number(v) });
  };
  const motivo = $("#n-motivo");
  if (motivo) motivo.onchange = () => salvarCampo({ motivo_perda: motivo.value });
  $("#n-salvar").onclick = async () => {
    const texto = $("#n-texto").value.trim();
    if (!texto) return $("#n-texto").focus();
    try {
      await api(`data/negocios/${neg.id}/atividades`, { method: "POST", body: { tipo: $("#n-tipo").value, texto } });
      $("#n-texto").value = "";
      $("#n-texto").dataset.mexeu = "";
      if (E.ctx === "funil") await carregarFunil(true);
      await carregarInfoGaveta();
      aviso("Registrado");
    } catch (e) {
      aviso(e.message, true);
    }
  };
  $$(".atividades .apagar").forEach(
    (b) =>
      (b.onclick = async () => {
        if (!(await confirmar("Apagar registro", "Apagar esta anotação?", "Apagar", true))) return;
        await api(`data/atividades/${b.dataset.ativ}`, { method: "DELETE" });
        if (E.ctx === "funil") await carregarFunil(true);
        await carregarInfoGaveta();
      })
  );
}

// ---------- bloco "WhatsApp": automação, número, conversa e envio
function estadoAutomacao(n, et, conv) {
  const p = passoLimpo(n.passo);
  const aberta = !et || et.tipo === "aberta";
  const B = {
    pausar: ["pausar", `${ico("pausa")}Pausar`],
    retomar: ["retomar", `${ico("play")}Retomar`, "prim"],
    assumir: ["assumir", `${ico("pessoa")}Assumir conversa`],
    outro: ["outro_momento", "Outro momento"],
    desq: ["desqualificar", "Desqualificar", "perigo"],
    reabrir: ["reabrir", "Voltar para aprovação"],
    continuar: ["continuar", `${ico("robo")}Era automática: continuar sequência`],
  };
  const so = (lista) => lista.filter((b) => aberta || !["desqualificar", "outro_momento"].includes(b[0]));
  if (n.optout) return { selo: "Pediu para sair", classe: "perigo", texto: "Este contato pediu para não receber mensagens. Nenhuma mensagem automática será enviada.", botoes: [] };
  switch (n.automacao) {
    case "ativa":
      if (p === "enviar_primeiro")
        return { selo: "Aprovado", classe: "acento", texto: "Primeiro contato aprovado. Sai no próximo horário de envio, respeitando o intervalo e o limite do dia.", botoes: so([B.reabrir, B.assumir, B.desq]) };
      if (p === "mover_outro_momento")
        return { selo: "Automação ativa", classe: "acento", texto: `Tentativas enviadas. Sem resposta até <strong>${esc(quando(n.proxima_acao_em, false))}</strong>, vai para Outro momento.`, botoes: so([B.pausar, B.assumir, B.outro, B.desq]) };
      if (p === "encerrar")
        return { selo: "Automação ativa", classe: "acento", texto: `Retomada enviada. Sem resposta até <strong>${esc(quando(n.proxima_acao_em, false))}</strong>, o negócio é encerrado (perdido por falta de resposta).`, botoes: so([B.pausar, B.assumir, B.desq]) };
      return {
        selo: "Automação ativa",
        classe: "acento",
        texto: `Próxima mensagem automática: <strong>${esc(ROTULO_PASSO[p] || p)}</strong>, ${esc(quando(n.proxima_acao_em))} (ou no próximo horário de envio).`,
        botoes: so([B.pausar, B.assumir, B.outro, B.desq]),
      };
    case "pausada":
      return {
        selo: "Pausada",
        classe: "aviso",
        texto: `Automação pausada${n.tentativas_erro >= 3 ? " depois de 3 erros de envio (veja o histórico)" : ""}.${p ? ` Ao retomar, a próxima é <strong>${esc(ROTULO_PASSO[p] || p)}</strong>.` : ""}`,
        botoes: so([B.retomar, B.assumir, B.desq]),
      };
    case "respondeu": {
      const teveAuto = (conv?.mensagens || []).some((m) => m.direcao === "saida" && m.origem === "automacao");
      return {
        selo: "Respondeu",
        classe: "ok",
        texto: `Respondeu: a automação parou e a conversa é com você.${teveAuto ? " Se a resposta foi uma mensagem automática da empresa, continue a sequência." : ""}`,
        botoes: so([...(teveAuto ? [B.continuar] : []), B.outro, B.desq]),
      };
    }
    case "assumida":
      return { selo: "Com você", classe: "", texto: "Sem mensagens automáticas para este contato.", botoes: so([B.outro, B.desq, ...(aberta ? [B.reabrir] : [])]) };
    case "encerrada":
      return { selo: "Encerrada", classe: "", texto: "Automação encerrada para este contato.", botoes: [B.reabrir] };
    default:
      if (et?.papel === "entrada")
        return {
          selo: "Aguardando aprovação",
          classe: "",
          texto:
            n.wa_status === "tem"
              ? `Primeiro contato pronto para revisar em <a href="#/aprovar">Aprovar</a>.`
              : n.wa_status
                ? "Sem WhatsApp: não entra na fila de aprovação."
                : "O sistema está conferindo se o número tem WhatsApp (faz isso sozinho, aos poucos).",
          botoes: [],
        };
      return { selo: "Sem automação", classe: "", texto: "Nenhuma mensagem automática programada.", botoes: so([B.outro, B.desq]) };
  }
}

function htmlNumeroWhats(n) {
  if (n.wa_status === "tem")
    return `<div class="num-whats">${ico("whats")}<span><strong class="num">${esc(fmtTel(n.wa_numero))}</strong>${n.wa_nome ? ` · ${esc(n.wa_nome)}` : ""}</span>
      <button class="btn peq fant" data-auto="verificar" title="Conferir de novo se o número tem WhatsApp">Conferir</button>
      <button class="btn peq fant" id="w-trocar">Trocar número</button></div>
      <div class="linha troca-num" hidden><input id="w-outro" class="entrada num" inputmode="tel" placeholder="(15) 99999-9999"><button class="btn peq prim" id="w-outro-salvar">Usar este</button></div>`;
  if (n.wa_status === "nao_tem" || n.wa_status === "sem_numero")
    return `<div class="num-whats sem">${ico("alerta")}<span>${n.wa_status === "sem_numero" ? "Sem telefone cadastrado." : "Nenhum número cadastrado tem WhatsApp."} Tem outro número?</span></div>
      <div class="linha troca-num"><input id="w-outro" class="entrada num" inputmode="tel" placeholder="(15) 99999-9999"><button class="btn peq prim" id="w-outro-salvar">Usar este</button></div>`;
  return `<div class="num-whats">${ico("whats")}<span>${n.telefone ? `<span class="num">${esc(fmtTel(n.telefone))}</span> · ` : ""}WhatsApp ainda não conferido</span>
    <button class="btn peq fant" data-auto="verificar">Conferir agora</button></div>`;
}

function htmlConversa(conv) {
  if (!conv) return `<div class="carregando"><span class="giro"></span></div>`;
  if (!conv.mensagens?.length) return `<p class="vazio-conv">Nenhuma mensagem por aqui ainda.</p>`;
  let diaAnterior = "";
  return conv.mensagens
    .map((m) => {
      const d = new Date(m.criado_em);
      const dia = d.toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "short" }).replace(/\./g, "");
      const sep = dia !== diaAnterior ? `<div class="conv-dia"><span>${esc(dia)}</span></div>` : "";
      diaAnterior = dia;
      const hora = d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
      let quem = "";
      if (m.direcao === "saida") quem = m.origem === "automacao" ? `${ico("robo")}${esc(ROTULO_PASSO[m.passo] || "Automação")}` : m.origem === "celular" ? "Pelo celular" : "Pelo sistema";
      else if (m.classificacao === "automatica") quem = "Resposta automática";
      else if (m.classificacao === "descadastro") quem = "Pediu para sair";
      const tique =
        m.direcao === "saida"
          ? `<span class="tique ${esc(m.status)}" title="${{ enviada: "Enviada", entregue: "Entregue", lida: "Lida" }[m.status] || ""}">${m.status === "enviada" ? "✓" : "✓✓"}</span>`
          : "";
      return `${sep}<div class="msg ${m.direcao === "saida" ? "enviada" : "recebida"}${m.classificacao === "automatica" ? " auto" : ""}"><div class="balao">${esc(m.texto)}</div>
        <div class="msg-meta">${quem ? `<span>${quem}</span>` : ""}<time>${hora}</time>${tique}</div></div>`;
    })
    .join("");
}

function htmlWhatsApp(neg, G) {
  const conv = G.conversa;
  const et = E.resumo.etapas.find((e) => e.id === neg.etapa_id);
  const st = estadoAutomacao(neg, et, conv);
  const numero = neg.wa_numero || (neg.wa_status !== "nao_tem" && neg.wa_status !== "sem_numero" ? neg.telefone : "");
  return `<section class="secao whats-secao" id="sec-whats">
    <h3>WhatsApp <span class="selo ${st.classe}">${esc(st.selo)}</span></h3>
    <div class="conteudo-s">
      <p class="auto-status">${st.texto}</p>
      ${htmlNumeroWhats(neg)}
      ${st.botoes.length ? `<div class="acoes-auto">${st.botoes.map(([a, rot, cls]) => `<button class="btn peq ${cls || ""}" data-auto="${a}">${rot}</button>`).join("")}</div>` : ""}
      <div class="conversa" aria-label="Conversa no WhatsApp">${htmlConversa(conv)}</div>
      <div class="enviar-box">
        ${
          conv?.modelos?.length
            ? `<select id="w-modelo" class="entrada" aria-label="Usar um modelo"><option value="">Usar um modelo…</option>${conv.modelos
                .map((m, i) => `<option value="${i}">${esc(m.titulo)}</option>`)
                .join("")}</select>`
            : ""
        }
        <textarea id="w-texto" class="entrada" rows="3" placeholder="Escreva uma mensagem…"></textarea>
        <div class="linha">
          <span class="dica">Sai na hora, pelo seu WhatsApp.${neg.automacao === "ativa" ? " A automação para depois disso." : ""}</span>
          <button class="btn prim" id="w-enviar" ${numero ? "" : "disabled"}>${ico("aprovar")} Enviar</button>
        </div>
      </div>
    </div>
  </section>`;
}

function ligarWhatsApp(neg, G) {
  const sec = $("#sec-whats");
  if (!sec) return;
  $$("[data-auto]", sec).forEach((b) => (b.onclick = () => acaoAutomacao(neg, b.dataset.auto, b)));
  const sel = $("#w-modelo");
  if (sel)
    sel.onchange = () => {
      const m = G.conversa?.modelos?.[Number(sel.value)];
      if (m) {
        const ta = $("#w-texto");
        ta.value = m.texto;
        ta.dataset.mexeu = "1";
        ta.focus();
      }
      sel.value = "";
    };
  $("#w-enviar").onclick = async () => {
    const ta = $("#w-texto");
    const t = ta.value.trim();
    if (!t) return ta.focus();
    const btn = $("#w-enviar");
    btn.disabled = true;
    try {
      await api("automacao/enviar", { method: "POST", body: { negocio_id: neg.id, texto: t } });
      ta.value = "";
      ta.dataset.mexeu = "";
      aviso("Mensagem enviada");
      await carregarInfoGaveta();
      if (E.ctx === "funil") carregarFunil(false);
    } catch (e) {
      aviso(e.message, true);
      btn.disabled = false;
    }
  };
  const trocar = $("#w-trocar");
  if (trocar)
    trocar.onclick = () => {
      $(".troca-num", sec).hidden = false;
      $("#w-outro").focus();
    };
  const salvarNum = $("#w-outro-salvar");
  if (salvarNum) salvarNum.onclick = () => usarOutroNumero(neg.id, $("#w-outro").value);
}

// número informado à mão (o da Receita pode ser do contador): salva e confere o WhatsApp só nele
async function usarOutroNumero(negId, valor) {
  const d = digitos(valor);
  if (d.length < 10 || d.length > 13) return aviso("Informe o número com DDD", true);
  try {
    await api(`data/negocios/${negId}`, { method: "PATCH", body: { telefone: d } });
    let msg = "Número salvo";
    let erro = false;
    try {
      const r = await api("automacao/acao", { method: "POST", body: { negocio_id: negId, acao: "verificar" } });
      const v = r.verificacao || {};
      if (v.erro) [msg, erro] = [`Número salvo. Não deu para conferir agora: ${v.erro}`, true];
      else if (v.com_whatsapp) msg = "Número salvo: tem WhatsApp";
      else [msg, erro] = ["Número salvo, mas ele não tem WhatsApp", true];
    } catch (e) {
      [msg, erro] = [`Número salvo. ${e.message}`, true];
    }
    aviso(msg, erro);
    checarNovidades(true);
    if (E.gaveta?.negId === negId) await carregarInfoGaveta();
    if (E.ctx === "aprovar") await recarregarAprovar();
    if (E.ctx === "funil") await carregarFunil(true);
  } catch (e) {
    aviso(e.message, true);
  }
}

async function acaoAutomacao(neg, acao, botao) {
  const CONFIRMAR = {
    desqualificar: ["Desqualificar", "O negócio vai para a etapa de perdidos (motivo: Desqualificado) e nenhuma mensagem automática sai mais.", "Desqualificar", true],
    outro_momento: ["Outro momento", "O negócio vai para Outro momento e recebe uma mensagem automática de retomada daqui a alguns meses (prazo em Ajustes → Automação).", "Mover"],
    reabrir: ["Voltar para aprovação", "O contato volta para a primeira etapa e entra de novo na fila de aprovação do primeiro contato.", "Voltar"],
    assumir: ["Assumir conversa", "Nenhuma mensagem automática será enviada para este contato.", "Assumir"],
  };
  if (CONFIRMAR[acao]) {
    const [t, x, r, p] = CONFIRMAR[acao];
    if (!(await confirmar(t, x, r, p))) return;
  }
  if (botao) botao.disabled = true;
  try {
    const r = await api("automacao/acao", { method: "POST", body: { negocio_id: neg.id, acao } });
    if (acao === "verificar") {
      const v = r.verificacao || {};
      aviso(v.erro ? v.erro : v.com_whatsapp ? "Tem WhatsApp" : "Nenhum número cadastrado tem WhatsApp", !!v.erro || !v.com_whatsapp);
    } else {
      aviso({ pausar: "Automação pausada", retomar: "Automação retomada", assumir: "A conversa é com você", outro_momento: "Movido para Outro momento", desqualificar: "Desqualificado", reabrir: "De volta à fila de aprovação", continuar: "Sequência retomada" }[acao] || "Feito");
    }
    checarNovidades(true);
    await carregarInfoGaveta();
    if (E.ctx === "funil") await carregarFunil(true);
    if (E.ctx === "aprovar") recarregarAprovar();
  } catch (e) {
    aviso(e.message, true);
    if (botao) botao.disabled = false;
  }
}

async function atualizarDaReceita() {
  const G = E.gaveta;
  if (!G || !G.r) return;
  try {
    const novo = await api(`receita/cnpj/${G.r.cnpj}`);
    novo.cnpj = digitos(novo.cnpj);
    G.r = novo;
    if (G.info?.empresa || G.info?.negocio || G.info?.listas?.length) {
      await api(`data/empresas/${novo.cnpj}`, { method: "PUT", body: { empresa: novo } });
    }
    aviso("Dados atualizados");
    desenharGaveta();
    if (E.ctx === "funil") carregarFunil(true);
  } catch (e) {
    aviso(e.message, true);
  }
}

function buscarSemelhantes(r) {
  const f = {
    ...E.busca.filtros,
    uf: r.uf,
    cidades: r.codigo_municipio_ibge ? [{ id: r.codigo_municipio_ibge, nome: titulo(r.municipio), uf: r.uf }] : [],
    cnaes: r.cnae_fiscal ? [{ id: cnae7(r.cnae_fiscal), descricao: r.cnae_fiscal_descricao || "" }] : [],
    secundario: false,
    nome: "",
  };
  E.busca.filtros = f;
  gravar("prosp.filtros", f);
  fecharGaveta();
  if (rota().pag !== "busca") location.hash = "#/busca";
  else telaBusca($("#conteudo"));
  setTimeout(() => pesquisar(true), 50);
}

function textoEmpresa(r) {
  const tels = telefonesDe(r).map((t) => t.exib).join(", ");
  const end = enderecoDe(r);
  return [
    nomeDe(r),
    titulo(r.razao_social),
    `CNPJ: ${fmtCNPJ(r.cnpj)}`,
    `Segmento: ${r.cnae_fiscal_descricao || ""}`,
    `Abertura: ${fmtData(r.data_inicio_atividade)}`,
    `Porte: ${porteDe(r).nome}`,
    tels && `Telefone: ${tels}`,
    emailDe(r) && `E-mail: ${emailDe(r)}`,
    `Endereço: ${end.completo}`,
    (r.qsa || []).length ? `Sócios: ${r.qsa.map((s) => titulo(s.nome_socio)).join(", ")}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

async function copiar(texto, msg) {
  try {
    await navigator.clipboard.writeText(texto);
    aviso(msg);
  } catch {
    aviso("Não foi possível copiar", true);
  }
}

// ============================================================ tela: APROVAR (primeiro contato)
const nomeEntrada = () => E.resumo.etapas.find((e) => e.papel === "entrada")?.nome || "Prospecção";
// item da fila → nome para exibir (empresa com a grafia do WhatsApp, quando bate)
const nomeItem = (i) => (i.cnpj ? nomeEmpresa({ nome_fantasia: i.nome, razao_social: i.razao_social }, i.wa_nome) : i.nome || "Contato");

// O número da Receita às vezes é do contador: avisa quando o nome no WhatsApp não parece ser da empresa.
function alertaNomeWhats(nome, waNome) {
  if (!waNome) return "";
  const w = comparavel(waNome);
  const n = comparavel(nome);
  if (/contab|contador|contadores|escritorio cont/.test(w) && !/contab/.test(n)) return "parece ser o contador da empresa";
  const COMUNS = new Set(["ltda", "eireli", "epp", "comercio", "servicos", "industria", "empresa", "loja", "grupo", "brasil", "sorocaba", "paulo"]);
  const palavras = n.split(" ").filter((p) => p.length >= 4 && !COMUNS.has(p));
  if (palavras.length && !palavras.some((p) => w.includes(p))) return "nome diferente da empresa; confira se o número é dela";
  return "";
}

async function telaAprovar(main) {
  main.innerHTML = `
    <div class="topo"><h1>Aprovar</h1>
      <button class="btn" id="ap-verificar" title="Conferir agora quais números têm WhatsApp">${ico("whats")} Conferir WhatsApp</button>
      <button class="btn prim" id="ap-todos" disabled>${ico("aprovar")} Aprovar todos</button>
    </div>
    <div class="pagina aprovar">
      <div class="painel-auto" id="ap-painel"></div>
      <div id="ap-lista" class="fila"><div class="carregando"><span class="giro"></span> Carregando…</div></div>
    </div>`;
  $("#ap-verificar").onclick = verificarAgora;
  $("#ap-todos").onclick = aprovarTodos;
  if (!E.resumo.etapas.length) await carregarResumo();
  await Promise.all([recarregarAprovar(), atualizarPainelAprovar()]);
}

async function recarregarAprovar() {
  try {
    E.aprovar.fila = await api("automacao/fila");
  } catch (e) {
    aviso(e.message, true);
    E.aprovar.fila = { itens: [], agendados: [] };
  }
  desenharFila();
}

async function atualizarPainelAprovar() {
  try {
    E.aprovar.painel = await api("automacao/painel", { silencioso: true });
  } catch {
    return;
  }
  desenharPainel();
}

function desenharPainel() {
  const el = $("#ap-painel");
  const p = E.aprovar.painel;
  if (!el || !p) return;
  const h = p.hoje || {};
  const c = [];
  c.push(`<button class="chip ${p.ligada ? "ok" : "perigo"}" id="ap-ligar" title="${p.ligada ? "Toque para desligar" : "Toque para ligar"}"><span class="ponto"></span>Automação ${p.ligada ? "ligada" : "desligada"}</button>`);
  if (!p.gowa_configurada) c.push(`<a class="chip perigo" href="#/ajustes" data-ir="aj-whatsapp">${ico("whats")}WhatsApp não configurado</a>`);
  else if (p.gowa_alerta) c.push(`<a class="chip perigo" href="#/ajustes" data-ir="aj-whatsapp">${ico("alerta")}WhatsApp: ${esc(p.gowa_alerta)}</a>`);
  else c.push(`<span class="chip ok">${ico("whats")}WhatsApp conectado</span>`);
  c.push(`<span class="chip">Hoje: <strong class="num">${h.novos || 0}/${h.limite_novos ?? "—"}</strong> primeiros contatos · <strong class="num">${h.envios || 0}/${h.limite_envios ?? "—"}</strong> envios</span>`);
  c.push(p.janela_aberta ? `<span class="chip ok">No horário de envio</span>` : `<span class="chip">Fora do horário · volta ${esc(quando(p.proxima_abertura))}</span>`);
  const minRel = p.ultimo_relogio ? (Date.now() - Date.parse(p.ultimo_relogio)) / 60000 : null;
  if (p.ligada && (minRel === null || minRel > 10))
    c.push(`<a class="chip perigo" href="#/ajustes" data-ir="aj-relogio">${ico("sistema")}${minRel === null ? "Relógio ainda não rodou" : `Relógio parado há ${Math.round(minRel)} min`}</a>`);
  const prox = (p.proximos || [])
    .slice(0, 4)
    .map((x) => {
      const ja = Date.parse(x.proxima_acao_em) <= Date.now();
      return `<span class="prox"><strong>${esc(x.rotulo)}</strong> · ${esc(titulo(x.empresa || x.contato_nome || ""))} · ${ja ? "na fila" : esc(quando(x.proxima_acao_em))}</span>`;
    })
    .join("");
  el.innerHTML = `<div class="chips">${c.join("")}</div>${prox ? `<div class="proximos"><span class="rotulo">Próximas ações</span>${prox}</div>` : ""}`;
  $("#ap-ligar").onclick = alternarAutomacao;
}

async function alternarAutomacao() {
  const p = E.aprovar.painel;
  if (!p) return;
  if (!p.ligada && !p.gowa_configurada) {
    aviso("Conecte o WhatsApp antes de ligar a automação", true);
    return irParaAjuste("aj-whatsapp");
  }
  const ok = await confirmar(
    p.ligada ? "Desligar a automação" : "Ligar a automação",
    p.ligada
      ? "Nenhuma mensagem automática sai enquanto estiver desligada. Os prazos continuam contando: o que vencer nesse tempo sai quando você ligar de novo."
      : "Os primeiros contatos aprovados e os follow-ups passam a sair sozinhos, só em dias úteis e no horário definido em Ajustes.",
    p.ligada ? "Desligar" : "Ligar"
  );
  if (!ok) return;
  try {
    await api("automacao/config", { method: "PUT", body: { automacao_ligada: p.ligada ? "0" : "1" } });
    aviso(p.ligada ? "Automação desligada" : "Automação ligada");
    await atualizarPainelAprovar();
  } catch (e) {
    aviso(e.message, true);
  }
}

function desenharFila() {
  const el = $("#ap-lista");
  const F = E.aprovar.fila;
  if (!el || !F) return;
  const prontos = F.itens.filter((i) => i.wa_status === "tem");
  const conferindo = F.itens.filter((i) => !i.wa_status);
  const semWhats = F.itens.filter((i) => i.wa_status === "nao_tem" || i.wa_status === "sem_numero");
  const todos = $("#ap-todos");
  const aprovaveis = prontos.filter((i) => !i.falta_relatorio).length;
  if (todos) {
    todos.disabled = !aprovaveis;
    todos.innerHTML = `${ico("aprovar")} Aprovar todos${aprovaveis > 1 ? ` (${aprovaveis})` : ""}`;
  }
  const verif = $("#ap-verificar");
  if (verif) verif.hidden = !conferindo.length;
  if (!F.itens.length && !F.agendados.length) {
    el.innerHTML = `<div class="vazio">${ico("aprovar")}<h3>Nada para aprovar</h3>
      <p>Empresas enviadas ao funil na etapa “${esc(nomeEntrada())}” aparecem aqui com o primeiro contato já preenchido. Você revisa, ajusta se quiser e aprova.</p></div>`;
    return;
  }
  el.innerHTML = `
    ${prontos.length ? `<h2 class="sec-fila">Prontos para aprovar <span class="q num">${prontos.length}</span></h2>${prontos.map(htmlItemFila).join("")}` : ""}
    ${
      conferindo.length
        ? `<h2 class="sec-fila">Conferindo o WhatsApp <span class="q num">${conferindo.length}</span></h2>
           <p class="dica">O sistema confere alguns números a cada 2 minutos, com limite por dia, para não chamar a atenção do WhatsApp. “Conferir WhatsApp” adianta alguns agora.</p>
           ${conferindo.map(htmlItemCompacto).join("")}`
        : ""
    }
    ${semWhats.length ? `<details class="sec-det"><summary class="sec-fila">Sem WhatsApp <span class="q num">${semWhats.length}</span></summary>${semWhats.map(htmlItemCompacto).join("")}</details>` : ""}
    ${
      F.agendados.length
        ? `<details class="sec-det" ${prontos.length ? "" : "open"}><summary class="sec-fila">Aprovados, aguardando o envio <span class="q num">${F.agendados.length}</span></summary>
           <p class="dica">Saem nesta ordem, no horário de envio, respeitando o intervalo e o limite do dia.</p>
           <div class="agendados">${F.agendados.map(htmlAgendado).join("")}</div></details>`
        : ""
    }`;
  ligarFila(el);
}

function htmlItemFila(i) {
  const nome = nomeItem(i);
  const alerta = i.cnpj ? alertaNomeWhats(nome, i.wa_nome) : "";
  const sub = [i.cidade && `${titulo(i.cidade)} - ${i.uf}`, i.segmento].filter(Boolean).join(" · ") || (i.fonte === "site" ? "Contato do site" : "Contato");
  return `<article class="item-fila" data-id="${i.id}">
    <div class="cab">
      <div class="tit"><div class="nome">${esc(nome)}</div><div class="sub">${esc(sub)}</div></div>
      <span class="selo ok" title="Número que vai receber">${ico("whats")}<span class="num">${esc(fmtTel(i.wa_numero))}</span></span>
    </div>
    ${i.wa_nome && (alerta || comparavel(i.wa_nome) !== comparavel(nome)) ? `<div class="wa-nome ${alerta ? "alerta" : ""}">${alerta ? ico("alerta") : ""}<span>No WhatsApp: <strong>${esc(i.wa_nome)}</strong>${alerta ? ` — ${esc(alerta)}` : ""}</span></div>` : ""}
    ${htmlRelFila(i)}
    <textarea class="entrada texto-fila" rows="5" aria-label="Mensagem para ${esc(nome)}">${esc(i.texto)}</textarea>
    <div class="rod">
      <span class="dica estado-texto"></span>
      <button class="btn peq fant" data-a="ficha">Ficha</button>
      <button class="btn peq fant ico-btn" data-a="mais" aria-label="Mais opções" title="Mais opções">⋯</button>
      <button class="btn peq prim" data-a="aprovar" ${i.falta_relatorio ? 'disabled title="Aprove o pré-relatório antes"' : ""}>${ico("aprovar")} Aprovar</button>
    </div>
  </article>`;
}

// linha do pré-relatório no card da fila: situação + botão para gerar ou revisar
function htmlRelFila(i) {
  const r = i.relatorio || { status: "nenhum" };
  const st = r.status || "nenhum";
  const texto = {
    nenhum: "Pré-relatório ainda não gerado",
    rascunho: "Pré-relatório em rascunho",
    aprovado: "Pré-relatório publicado",
    alterado: "Pré-relatório publicado, com mudanças não publicadas",
  }[st];
  return `<div class="rel-fila ${st}">${ico("nota")}<span>${texto}${
    i.falta_relatorio ? `<span class="falta"> · a mensagem usa o link: aprove o relatório para liberar o envio</span>` : ""
  }</span><button class="btn peq ${st === "aprovado" ? "fant" : ""}" data-a="relatorio">${st === "nenhum" ? "Gerar" : st === "rascunho" ? "Continuar" : "Revisar"}</button></div>`;
}

function htmlItemCompacto(i) {
  const nome = nomeItem(i);
  const sem = i.wa_status === "nao_tem" || i.wa_status === "sem_numero";
  const sub = [i.cidade && `${titulo(i.cidade)} - ${i.uf}`, i.telefone ? fmtTel(i.telefone) : "sem telefone"].filter(Boolean).join(" · ");
  return `<article class="item-fila compacto" data-id="${i.id}">
    <div class="cab">
      <div class="tit"><div class="nome">${esc(nome)}</div><div class="sub">${esc(sub)}</div></div>
      ${sem ? `<span class="selo perigo">Sem WhatsApp</span>` : `<span class="selo"><span class="giro mini"></span>Conferindo</span>`}
    </div>
    <div class="rod">
      <button class="btn peq fant" data-a="ficha">Ficha</button>
      ${sem ? `<button class="btn peq" data-a="numero">Usar outro número</button>` : ""}
      <button class="btn peq fant ico-btn" data-a="mais" aria-label="Mais opções" title="Mais opções">⋯</button>
    </div>
  </article>`;
}

function htmlAgendado(a, i) {
  const nome = a.cnpj ? nomeEmpresa({ nome_fantasia: a.nome, razao_social: a.razao_social }, a.wa_nome) : a.nome || "Contato";
  return `<div class="agendado" data-id="${a.id}">
    <span class="pos num">${i + 1}º</span><span class="nome">${esc(nome)}</span><span class="dica num">${esc(fmtTel(a.wa_numero))}</span>
    <button class="btn peq fant" data-a="ficha">Ficha</button><button class="btn peq" data-a="cancelar">Cancelar</button>
  </div>`;
}

// caixa de texto do tamanho da mensagem (no iPhone, sem rolagem dentro da caixa)
function autoAltura(ta) {
  ta.style.height = "auto";
  ta.style.height = `${Math.min(ta.scrollHeight + 2, 460)}px`;
}

function ligarFila(el) {
  $$(".texto-fila", el).forEach(autoAltura);
  el.oninput = (ev) => {
    if (!ev.target.classList.contains("texto-fila")) return;
    autoAltura(ev.target);
    // tirou ou pôs {relatorio} no texto: libera ou trava o Aprovar
    const card = ev.target.closest("[data-id]");
    const item = E.aprovar.fila.itens.find((x) => x.id === Number(card.dataset.id));
    const falta = /\{relatorio\}/.test(ev.target.value) && !item?.relatorio?.link;
    const b = $('[data-a="aprovar"]', card);
    if (b) b.disabled = falta;
    const linha = $(".rel-fila .falta", card);
    if (linha) linha.hidden = !falta;
  };
  el.onclick = async (ev) => {
    const b = ev.target.closest("[data-a]");
    if (!b) return;
    const card = b.closest("[data-id]");
    const id = Number(card.dataset.id);
    const item = E.aprovar.fila.itens.find((x) => x.id === id);
    const a = b.dataset.a;
    if (a === "ficha") return abrirNegocioPorId(id);
    if (a === "relatorio") return abrirEditorRelatorio(id, "#/aprovar");
    if (a === "aprovar") return aprovarItens([{ negocio_id: id, texto: $(".texto-fila", card).value }], [card]);
    if (a === "cancelar") return acaoFila(id, "reabrir");
    if (a === "numero") return pedirOutroNumero(id);
    if (a === "mais") return menuItemFila(b, item, card);
  };
  // o texto editado fica salvo (rascunho) ao sair da caixa
  el.onchange = async (ev) => {
    const ta = ev.target.closest(".texto-fila");
    if (!ta) return;
    const card = ta.closest("[data-id]");
    const id = Number(card.dataset.id);
    const item = E.aprovar.fila.itens.find((x) => x.id === id);
    const estado = $(".estado-texto", card);
    try {
      const r = await api("automacao/rascunho", { method: "POST", body: { negocio_id: id, texto: ta.value } });
      if (item) item.texto = r.texto;
      if (!ta.value.trim()) ta.value = r.texto;
      estado.textContent = "Texto salvo";
      setTimeout(() => (estado.textContent = ""), 2500);
    } catch (e) {
      aviso(e.message, true);
    }
  };
}

function menuItemFila(botao, item, card) {
  if (!item) return;
  const pronto = item.wa_status === "tem";
  abrirMenu(
    botao,
    `${pronto ? `<button data-v="restaurar">Voltar ao texto do modelo</button><button data-v="numero">Usar outro número</button>` : ""}
     <button data-v="assumir">Vou falar eu mesmo (tirar da fila)</button>
     <div class="sep"></div>
     <button data-v="desqualificar">Desqualificar</button>
     <button data-v="apagar" style="color:var(--danger)">Tirar do funil</button>`,
    async (v) => {
      try {
        if (v === "restaurar") {
          const r = await api("automacao/rascunho", { method: "POST", body: { negocio_id: item.id, texto: "" } });
          $(".texto-fila", card).value = r.texto;
          item.texto = r.texto;
          return aviso("Texto do modelo restaurado");
        }
        if (v === "numero") return pedirOutroNumero(item.id);
        if (v === "assumir") return acaoFila(item.id, "assumir");
        if (v === "desqualificar") return acaoFila(item.id, "desqualificar");
        if (v === "apagar") {
          if (!(await confirmar("Tirar do funil", "O negócio e as anotações serão apagados.", "Tirar", true))) return;
          await api(`data/negocios/${item.id}`, { method: "DELETE" });
          aviso("Removido do funil");
          checarNovidades(true);
          await carregarResumo();
          return recarregarAprovar();
        }
      } catch (e) {
        aviso(e.message, true);
      }
    }
  );
}

async function pedirOutroNumero(id) {
  const v = await pedirTexto("Usar outro número", "WhatsApp com DDD", "", "(15) 99999-9999");
  if (v) await usarOutroNumero(id, v);
}

async function acaoFila(id, acao) {
  try {
    await api("automacao/acao", { method: "POST", body: { negocio_id: id, acao } });
    aviso({ assumir: "Tirado da fila — a conversa é com você", desqualificar: "Desqualificado", reabrir: "Envio cancelado — voltou para a fila" }[acao] || "Feito");
    checarNovidades(true);
    await Promise.all([recarregarAprovar(), atualizarPainelAprovar()]);
  } catch (e) {
    aviso(e.message, true);
  }
}

async function aprovarItens(itens, cards = []) {
  if (itens.some((i) => !String(i.texto || "").trim())) return aviso("A mensagem não pode ficar vazia", true);
  cards.forEach((c) => c.classList.add("saindo"));
  try {
    const r = await api("automacao/aprovar", { method: "POST", body: { itens } });
    const p = E.aprovar.painel;
    if (r.aprovados) aviso(`${plural(r.aprovados, "contato aprovado", "contatos aprovados")}${p && !p.ligada ? " — a automação está desligada" : ""}`);
    if (r.sem_relatorio)
      aviso(
        r.sem_relatorio === 1
          ? "1 mensagem ficou na fila: ela usa o link do pré-relatório, que ainda não foi aprovado"
          : `${r.sem_relatorio} mensagens ficaram na fila: usam o link do pré-relatório, que ainda não foi aprovado`,
        true
      );
    else if (!r.aprovados) aviso("Nada foi aprovado (a fila mudou). Atualizando…", true);
    checarNovidades(true);
    await Promise.all([recarregarAprovar(), atualizarPainelAprovar()]);
  } catch (e) {
    cards.forEach((c) => c.classList.remove("saindo"));
    aviso(e.message, true);
  }
}

async function aprovarTodos() {
  const cards = $$("#ap-lista .item-fila:not(.compacto)").filter((c) => !$('[data-a="aprovar"]', c)?.disabled);
  if (!cards.length) return;
  const p = E.aprovar.painel || {};
  const cfg = p.config || {};
  const intervalo = cfg.intervalo_min || 4;
  const ok = await confirmar(
    `Aprovar ${plural(cards.length, "primeiro contato", "primeiros contatos")}`,
    `As mensagens saem aos poucos: uma a cada ${intervalo} a ${intervalo * 2} minutos, até ${cfg.novos_por_dia || 10} primeiros contatos por dia, em dias úteis das ${cfg.hora_inicio || "09:00"} às ${cfg.hora_fim || "17:00"}.${p.ligada === false ? " A automação está desligada: nada sai até você ligar." : ""} Dá para cancelar enquanto não saírem.`,
    "Aprovar"
  );
  if (!ok) return;
  aprovarItens(
    cards.map((c) => ({ negocio_id: Number(c.dataset.id), texto: $(".texto-fila", c).value })),
    cards
  );
}

async function verificarAgora() {
  const b = $("#ap-verificar");
  b.disabled = true;
  try {
    const r = await api("automacao/verificar", { method: "POST", body: {} });
    aviso(
      r.erro ? r.erro : r.verificados ? `${plural(r.verificados, "número conferido", "números conferidos")}: ${r.com_whatsapp} com WhatsApp` : "Nenhum número para conferir agora",
      !!r.erro
    );
    checarNovidades(true);
    await recarregarAprovar();
  } catch (e) {
    aviso(e.message, true);
  }
  b.disabled = false;
}

// ============================================================ tela: AJUSTES
const SECOES_AJ = [
  ["aj-whatsapp", "WhatsApp"],
  ["aj-automacao", "Automação"],
  ["aj-mensagens", "Mensagens"],
  ["aj-relatorio", "Pré-relatório"],
  ["aj-relogio", "Relógio"],
  ["aj-site", "Site"],
  ["aj-ia", "IA"],
  ["aj-etapas", "Etapas"],
  ["aj-modelos", "Modelos"],
  ["aj-backup", "Cópia e acesso"],
];
const ORIGEM = location.origin;
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
const campo = (id, rotulo, valor, extra = "", dica = "") =>
  `<div class="campo"><label for="${id}">${rotulo}</label><input id="${id}" class="entrada" value="${esc(valor ?? "")}" ${extra}>${dica ? `<p class="dica">${dica}</p>` : ""}</div>`;
const valor = (id) => $(`#${id}`)?.value ?? "";

async function telaAjustes(main, secao) {
  main.innerHTML = `<div class="topo"><h1>Ajustes</h1></div><div class="pagina"><div class="carregando"><span class="giro"></span> Carregando…</div></div>`;
  let cfg;
  try {
    cfg = await api("automacao/config");
  } catch (e) {
    $(".pagina", main).innerHTML = `<div class="alerta">${esc(e.message)}</div>`;
    return;
  }
  if (!E.resumo.etapas.length) await carregarResumo();
  main.innerHTML = `
    <div class="topo"><h1>Ajustes</h1></div>
    <div class="pagina"><div class="ajustes">
      <nav class="aj-indice" aria-label="Seções">${SECOES_AJ.map(([id, nome]) => `<button class="pilula" type="button" data-sec="${id}">${nome}</button>`).join("")}</nav>
      ${blocoWhatsApp(cfg)}
      ${blocoAutomacao(cfg)}
      ${blocoMensagens(cfg)}
      ${blocoRelatorio(cfg)}
      ${blocoRelogio(cfg)}
      ${blocoSite(cfg)}
      ${blocoIA(cfg)}
      ${blocoEtapas()}
      ${blocoModelos()}
      ${blocoBackup()}
    </div></div>`;
  $(".aj-indice", main).onclick = (ev) => {
    const b = ev.target.closest("[data-sec]");
    if (b) $(`#${b.dataset.sec}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  // botões "Copiar" (data-copiar = id do bloco de código)
  main.addEventListener("click", (ev) => {
    const b = ev.target.closest("[data-copiar]");
    if (b) copiar($(`#${b.dataset.copiar}`).textContent, "Copiado");
  });
  ligarWhatsAppAjustes(cfg);
  ligarAutomacaoAjustes();
  ligarMensagens(cfg);
  ligarRelatorioAjustes(cfg);
  ligarRelogio(cfg);
  ligarSite();
  ligarIA();
  ligarEtapas();
  ligarModelos();
  ligarBackup();
  if (secao) setTimeout(() => $(`#${secao}`)?.scrollIntoView({ block: "start" }), 60);
}

async function salvarConfig(pares, msg = "Salvo") {
  try {
    await api("automacao/config", { method: "PUT", body: pares });
    aviso(msg);
    return true;
  } catch (e) {
    aviso(e.message, true);
    return false;
  }
}

// ---------- WhatsApp (Gowa)
function dominioGowa(cfg) {
  try {
    return cfg.gowa_url ? new URL(cfg.gowa_url).hostname : "gowa.tangit.com.br";
  } catch {
    return "gowa.tangit.com.br";
  }
}

function blocoWhatsApp(cfg) {
  return `<section class="bloco" id="aj-whatsapp">
    <h2>WhatsApp</h2>
    <p>Envia e recebe pelo seu número atual, por meio da Gowa instalada na VPS. Funciona como o WhatsApp Web: o celular continua normal.</p>
    <div class="status-linha" id="gw-status"><span class="giro mini"></span> Conferindo a conexão…</div>
    <div class="grade-2">
      ${campo("gw-url", "Endereço da Gowa", cfg.gowa_url, 'placeholder="https://gowa.tangit.com.br" inputmode="url" autocapitalize="off"')}
      ${campo("gw-usuario", "Usuário", cfg.gowa_usuario, 'autocapitalize="off" autocomplete="off"')}
      ${campo("gw-senha", "Senha", cfg.gowa_senha, 'autocapitalize="off" autocomplete="off" spellcheck="false"')}
      ${campo("gw-device", "Aparelho na Gowa", cfg.gowa_device, 'placeholder="preenchido ao conectar" autocapitalize="off"')}
    </div>
    <div class="acoes-bloco">
      <button class="btn" id="gw-testar">Testar conexão</button>
      <button class="btn" id="gw-conectar">${ico("whats")} Conectar o WhatsApp</button>
      <button class="btn" id="gw-teste-envio">Mensagem de teste</button>
      <button class="btn prim" id="gw-salvar">Salvar</button>
    </div>
    <details class="sub-det" ${cfg.gowa_url ? "" : "open"}>
      <summary>Instalar a Gowa na VPS</summary>
      <p class="dica">Gera um comando para colar no terminal da VPS (passo a passo no LEIAME, parte 2). Ele instala a Gowa com HTTPS e o relógio dos envios, já com o endereço deste sistema e as chaves.</p>
      ${campo("gw-dominio", "Endereço que a Gowa vai usar", dominioGowa(cfg), 'autocapitalize="off" inputmode="url"', "O mesmo nome criado no DNS da Cloudflare (registro A apontando para o IP da VPS, nuvem cinza).")}
      <div class="acoes-bloco"><button class="btn prim" id="gw-gerar">Gerar comando</button></div>
      <div id="gw-comando-caixa" hidden>
        <pre class="codigo" id="gw-comando"></pre>
        <div class="acoes-bloco"><a class="btn" id="gw-ver" target="_blank" rel="noopener">Ver o script</a><button class="btn prim" data-copiar="gw-comando">${ico("copiar")} Copiar comando</button></div>
        <p class="dica">Vale por 30 minutos. O endereço da Gowa já ficou salvo acima.</p>
      </div>
    </details>
    <details class="sub-det">
      <summary>Dados do webhook (só se for configurar à mão)</summary>
      <dl class="dl">
        <dt>URL</dt><dd><code>${esc(ORIGEM)}/api/gowa/webhook</code></dd>
        <dt>Segredo</dt><dd><code>${esc(cfg.webhook_segredo)}</code></dd>
        <dt>Eventos</dt><dd><code>message,message.ack</code></dd>
      </dl>
    </details>
  </section>`;
}

async function atualizarStatusGowa() {
  const el = $("#gw-status");
  if (!el) return;
  if (!valor("gw-url")) {
    el.innerHTML = `<span class="selo">Não configurado</span> Instale a Gowa na VPS (script abaixo) e depois toque em Conectar o WhatsApp.`;
    return;
  }
  el.innerHTML = `<span class="giro mini"></span> Conferindo a conexão…`;
  try {
    const r = await api("automacao/testar", { method: "POST", body: {} });
    if (r.ok) el.innerHTML = `<span class="selo ok">${ico("check")}Conectado</span> WhatsApp ${r.numero ? `<strong class="num">${esc(fmtTel(r.numero))}</strong>` : ""} ligado à Gowa.`;
    else if (r.status) el.innerHTML = `<span class="selo aviso">WhatsApp desconectado</span> A Gowa está no ar, mas sem o WhatsApp. Toque em <strong>Conectar o WhatsApp</strong>.`;
    else el.innerHTML = `<span class="selo perigo">Sem conexão</span> ${esc(r.erro || "A Gowa não respondeu.")}`;
  } catch (e) {
    el.innerHTML = `<span class="selo perigo">Erro</span> ${esc(e.message)}`;
  }
}

function ligarWhatsAppAjustes(cfg) {
  const dadosGowa = () => ({ gowa_url: valor("gw-url").trim(), gowa_usuario: valor("gw-usuario").trim(), gowa_senha: valor("gw-senha").trim(), gowa_device: valor("gw-device").trim() });
  $("#gw-salvar").onclick = async () => {
    if (await salvarConfig(dadosGowa(), "Conexão salva")) atualizarStatusGowa();
  };
  $("#gw-testar").onclick = async () => {
    await salvarConfig(dadosGowa(), "Conexão salva");
    atualizarStatusGowa();
  };
  $("#gw-gerar").onclick = async () => {
    const dominio = valor("gw-dominio").trim().replace(/^https?:\/\//, "").replace(/\/.*$/, "");
    if (!dominio) return aviso("Informe o endereço da Gowa", true);
    if (!valor("gw-usuario").trim() || !valor("gw-senha").trim()) return aviso("Usuário e senha da Gowa não podem ficar vazios", true);
    // usuário e senha que aparecem acima são os que vão no script
    if (!(await salvarConfig({ gowa_usuario: valor("gw-usuario").trim(), gowa_senha: valor("gw-senha").trim() }, "Dados salvos"))) return;
    try {
      const r = await api("automacao/instalacao", { method: "POST", body: { dominio } });
      $("#gw-comando").textContent = r.comando;
      $("#gw-ver").href = r.link;
      $("#gw-comando-caixa").hidden = false;
      $("#gw-url").value = `https://${dominio}`;
      aviso("Comando gerado");
    } catch (e) {
      aviso(e.message, true);
    }
  };
  $("#gw-conectar").onclick = async () => {
    if (!valor("gw-url").trim()) return aviso("Preencha o endereço da Gowa (ou gere o comando de instalação)", true);
    await salvarConfig(dadosGowa(), "Conexão salva");
    await conectarWhatsApp();
    const c = await api("automacao/config").catch(() => null);
    if (c) $("#gw-device").value = c.gowa_device || "";
    atualizarStatusGowa();
  };
  $("#gw-teste-envio").onclick = mensagemDeTeste;
  atualizarStatusGowa();
}

async function conectarWhatsApp() {
  let aberto = true;
  let aba = "qr";
  let tQR = null;
  const promessa = abrirModal({
    titulo: "Conectar o WhatsApp",
    texto: "Use o número que você já usa. O celular continua funcionando normalmente.",
    corpo: `
      <div class="alternar abas" role="group" aria-label="Forma de conectar">
        <button type="button" data-aba="qr" aria-pressed="true">QR code (no Mac)</button>
        <button type="button" data-aba="codigo" aria-pressed="false">Código (só iPhone)</button>
      </div>
      <div id="cx-qr">
        <div class="qr-box" id="cx-qr-img"><span class="giro"></span></div>
        <ol class="passos">
          <li>No iPhone, abra o <strong>WhatsApp</strong> e toque em <strong>Configurações</strong> (barra inferior, à direita).</li>
          <li>Toque em <strong>Aparelhos conectados</strong> e depois em <strong>Conectar um aparelho</strong>.</li>
          <li>Aponte a câmera para o QR code acima. Ele muda a cada 30 segundos.</li>
        </ol>
      </div>
      <div id="cx-codigo" hidden>
        <div class="linha"><input id="cx-tel" class="entrada num" inputmode="tel" placeholder="Seu WhatsApp: (15) 99999-9999"><button class="btn" id="cx-gerar" type="button">Gerar código</button></div>
        <div class="codigo-par num" id="cx-par" hidden></div>
        <ol class="passos">
          <li>No iPhone: <strong>WhatsApp</strong> → <strong>Configurações</strong> (barra inferior, à direita) → <strong>Aparelhos conectados</strong> → <strong>Conectar um aparelho</strong>.</li>
          <li>Na tela da câmera, toque em <strong>Conectar com número de telefone</strong> (parte de baixo).</li>
          <li>Digite o código de 8 caracteres que aparece aqui.</li>
        </ol>
      </div>
      <p class="status-linha" id="cx-estado"><span class="giro mini"></span> Aguardando a conexão…</p>`,
    botoes: [{ rotulo: "Fechar", valor: null }],
  });
  promessa.then(() => (aberto = false));
  const m = $("#modal");
  const conectado = (numero) => {
    if (!aberto) return;
    aberto = false;
    clearTimeout(tQR);
    $("#cx-estado", m).innerHTML = `<span class="selo ok">${ico("check")}Conectado</span> ${numero ? `WhatsApp <strong class="num">${esc(fmtTel(numero))}</strong>` : ""}`;
    aviso("WhatsApp conectado");
    setTimeout(() => fecharModalAtual?.(), 1600);
  };
  const carregarQR = async () => {
    const box = $("#cx-qr-img", m);
    if (!box) return;
    box.innerHTML = `<span class="giro"></span>`;
    try {
      const r = await api("automacao/conectar", { method: "POST", body: { modo: "qr" } });
      if (r.conectado) return conectado(r.numero);
      if (!aberto) return;
      box.innerHTML = `<img src="${r.qr}" alt="QR code para conectar o WhatsApp">`;
      clearTimeout(tQR);
      tQR = setTimeout(() => aberto && aba === "qr" && carregarQR(), (r.duracao || 30) * 1000);
    } catch (e) {
      box.innerHTML = `<p class="alerta">${esc(e.message)}</p>`;
    }
  };
  $$("[data-aba]", m).forEach(
    (b) =>
      (b.onclick = () => {
        aba = b.dataset.aba;
        $$("[data-aba]", m).forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
        $("#cx-qr", m).hidden = aba !== "qr";
        $("#cx-codigo", m).hidden = aba !== "codigo";
        if (aba === "qr") carregarQR();
        else clearTimeout(tQR);
      })
  );
  $("#cx-gerar", m).onclick = async () => {
    const tel = digitos($("#cx-tel", m).value);
    if (tel.length < 10) return aviso("Informe seu número com DDD", true);
    const par = $("#cx-par", m);
    par.hidden = false;
    par.textContent = "…";
    try {
      const r = await api("automacao/conectar", { method: "POST", body: { modo: "codigo", telefone: tel } });
      if (r.conectado) return conectado(r.numero);
      par.textContent = r.codigo || "—";
    } catch (e) {
      par.textContent = "";
      par.hidden = true;
      aviso(e.message, true);
    }
  };
  carregarQR();
  // confere a cada 3 s se o WhatsApp conectou
  (async () => {
    while (aberto) {
      await esperar(3000);
      if (!aberto) break;
      try {
        const r = await api("automacao/testar", { method: "POST", body: {}, silencioso: true });
        if (r.ok) return conectado(r.numero);
      } catch {}
    }
  })();
  await promessa;
  aberto = false;
  clearTimeout(tQR);
}

async function mensagemDeTeste() {
  const r = await abrirModal({
    titulo: "Mensagem de teste",
    texto: "Sai na hora pelo WhatsApp conectado. Use outro número seu (ou de alguém próximo) para ver chegando.",
    corpo: `${campo("mt-num", "Para", "", 'inputmode="tel" placeholder="(15) 99999-9999"')}
      <div class="campo"><label for="mt-txt">Mensagem</label><textarea id="mt-txt" class="entrada" rows="2">Teste da automação de WhatsApp ✅</textarea></div>`,
    botoes: [
      { rotulo: "Cancelar", valor: null },
      {
        rotulo: "Enviar",
        classe: "prim",
        acao: (el) => {
          const numero = digitos($("#mt-num", el).value);
          if (numero.length < 10) {
            aviso("Informe o número com DDD", true);
            return false;
          }
          return { numero, texto: $("#mt-txt", el).value.trim() };
        },
      },
    ],
  });
  if (!r) return;
  try {
    await api("automacao/teste-envio", { method: "POST", body: r });
    aviso("Mensagem enviada");
  } catch (e) {
    aviso(e.message, true);
  }
}

// ---------- Automação (horário, limites, prazos)
function blocoAutomacao(cfg) {
  const n = (id, chave, extra = 'min="0"') => `<input id="${id}" class="entrada num curto" type="number" inputmode="numeric" value="${esc(cfg[chave])}" ${extra}>`;
  return `<section class="bloco" id="aj-automacao">
    <h2>Automação</h2>
    <p>Quando e quanto o sistema envia. Só em dias úteis (feriados nacionais já descontados) e dentro do horário.</p>
    <label class="chave-linha"><input type="checkbox" id="au-ligada" ${cfg.automacao_ligada === "1" ? "checked" : ""}><span class="chave" aria-hidden="true"></span><span><strong>Automação ligada</strong><br><span class="dica">Desligada, nada sai sozinho (você ainda aprova e responde pela ficha).</span></span></label>
    <div class="grade-2">
      ${campo("au-inicio", "Começa às", cfg.hora_inicio, 'type="time" step="900"')}
      ${campo("au-fim", "Termina às", cfg.hora_fim, 'type="time" step="900"')}
    </div>
    <h3 class="sub">Limites</h3>
    <p class="dica">Ritmo de pessoa, para o WhatsApp não estranhar o número. Comece baixo e aumente aos poucos.</p>
    <div class="grade-2">
      <div class="campo"><label for="au-novos">Primeiros contatos por dia</label>${n("au-novos", "novos_por_dia")}</div>
      <div class="campo"><label for="au-envios">Mensagens por dia (total)</label>${n("au-envios", "envios_por_dia")}</div>
      <div class="campo"><label for="au-intervalo">Intervalo mínimo entre mensagens (min)</label>${n("au-intervalo", "intervalo_min", 'min="1"')}</div>
      <div class="campo"><label for="au-verif">Números conferidos por dia</label>${n("au-verif", "verificacoes_por_dia")}</div>
    </div>
    <h3 class="sub">Prazos da sequência</h3>
    <div class="prazos">
      <div class="prazo"><span class="et">Follow-up</span> ${n("au-f1", "followup1_dias_uteis", 'min="1"')} <span>dias úteis depois do primeiro contato</span></div>
      <div class="prazo"><span class="et">Nova tentativa</span> ${n("au-f2", "followup2_dias", 'min="1"')} <span>dias depois do follow-up</span></div>
      <div class="prazo"><span class="et">Outro momento</span> ${n("au-sr", "sem_resposta_dias_uteis", 'min="1"')} <span>dias úteis sem resposta depois da nova tentativa</span></div>
      <div class="prazo"><span class="et">Retomada</span> ${n("au-om", "outro_momento_dias", 'min="1"')} <span>dias depois de ir para Outro momento</span></div>
      <div class="prazo"><span class="et">Encerrar</span> ${n("au-enc", "encerrar_dias", 'min="1"')} <span>dias sem resposta depois da retomada</span></div>
    </div>
    <div class="campo"><label for="au-feriados">Feriados locais</label>
      <textarea id="au-feriados" class="entrada" rows="3" placeholder="15/08 Aniversário de Sorocaba">${esc(cfg.feriados_extras)}</textarea>
      <p class="dica">Um por linha, no formato dd/mm (ou dd/mm/aaaa para um ano só). Os nacionais, Carnaval, Sexta-feira Santa e Corpus Christi já estão no sistema.</p></div>
    <div class="campo"><label for="au-rodape">Aviso no fim do primeiro contato</label>
      <input id="au-rodape" class="entrada" value="${esc(cfg.rodape_descadastro)}">
      <p class="dica">Quem responder SAIR (ou parecido) deixa de receber na hora e vai para Perdido. Vazio = sem aviso.</p></div>
    <div class="acoes-bloco"><button class="btn prim" id="au-salvar">Salvar automação</button></div>
  </section>`;
}

function ligarAutomacaoAjustes() {
  $("#au-salvar").onclick = async () => {
    const ini = valor("au-inicio");
    const fim = valor("au-fim");
    if (ini && fim && ini >= fim) return aviso("O horário de término precisa ser depois do início", true);
    await salvarConfig(
      {
        automacao_ligada: $("#au-ligada").checked ? "1" : "0",
        hora_inicio: ini,
        hora_fim: fim,
        novos_por_dia: valor("au-novos"),
        envios_por_dia: valor("au-envios"),
        intervalo_min: valor("au-intervalo"),
        verificacoes_por_dia: valor("au-verif"),
        followup1_dias_uteis: valor("au-f1"),
        followup2_dias: valor("au-f2"),
        sem_resposta_dias_uteis: valor("au-sr"),
        outro_momento_dias: valor("au-om"),
        encerrar_dias: valor("au-enc"),
        feriados_extras: valor("au-feriados"),
        rodape_descadastro: valor("au-rodape"),
      },
      "Automação salva"
    );
  };
}

// ---------- Mensagens da automação
const PASSOS_MSG = [
  ["primeiro_contato", "Primeiro contato", "Entra na fila de aprovação já preenchido. Você revisa e ajusta antes de sair."],
  ["followup_1", "Follow-up", "Se não houver resposta ao primeiro contato."],
  ["followup_2", "Nova tentativa", "Se não houver resposta ao follow-up."],
  ["outro_momento", "Retomada", "Meses depois, para quem foi para Outro momento."],
];
const VARIAVEIS = [
  ["{saudacao}", "“Olá, João” (ou “Olá”, sem nome)"],
  ["{nome}", "primeiro nome do sócio ou do contato"],
  ["{empresa}", "nome fantasia"],
  ["{razao_social}", "razão social"],
  ["{cidade}", "cidade"],
  ["{segmento}", "atividade (CNAE)"],
  ["{relatorio}", "link do pré-relatório aprovado (sozinho na última linha, sai com o cartão de prévia)"],
];
const EXEMPLO_VARS = {
  saudacao: "Olá, João",
  nome: "João",
  empresa: "Padaria Pão Bom",
  razao_social: "Pão Bom Padaria LTDA",
  cidade: "Sorocaba",
  segmento: "Padaria e confeitaria",
  socio: "João",
  relatorio: "https://tangit.com.br/padaria-pao-bom-relatorio-482913",
};
// mesmo critério do servidor: com o link sozinho na última linha, o aviso de descadastro entra antes dele
function comRodapeTela(texto, rodape) {
  const r = String(rodape || "").trim();
  const t = String(texto || "");
  if (!r || t.includes(r)) return t;
  const m = t.match(/^([\s\S]*?)\n[ \t]*(https?:\/\/\S+)\s*$/);
  if (m && m[1].trim()) return `${m[1].trim()}\n\n${r}\n\n${m[2]}`;
  return `${t}\n\n${r}`;
}
const exemplo = (texto) =>
  String(texto || "")
    .replace(/\{(\w+)\}/g, (t, k) => (k in EXEMPLO_VARS ? EXEMPLO_VARS[k] : t))
    .replace(/[ \t]+([,.!?])/g, "$1");

function blocoMensagens(cfg) {
  const modelos = E.resumo.modelos || [];
  return `<section class="bloco" id="aj-mensagens">
    <h2>Mensagens da automação</h2>
    <p>Os textos padrão de cada passo. Os campos entre chaves são preenchidos com os dados de cada empresa.</p>
    <div class="var-chips">${VARIAVEIS.map(([v, d]) => `<button type="button" class="pilula" data-var="${v}" title="${esc(d)}">${v}</button>`).join("")}</div>
    <p class="dica">Toque num campo para inserir no texto em que você está escrevendo.</p>
    ${PASSOS_MSG.map(([passo, nome, desc]) => {
      const m = modelos.find((x) => x.passo === passo);
      return `<div class="msg-modelo" data-passo="${passo}" data-id="${m?.id || ""}">
        <div class="t"><strong>${nome}</strong><span class="dica">${desc}</span></div>
        <textarea class="entrada" rows="4" id="mm-${passo}">${esc(m?.texto || "")}</textarea>
        <div class="previa"><span class="rotulo">Exemplo</span><div class="balao-prev" id="mp-${passo}"></div></div>
        <div class="acoes-bloco"><button class="btn peq prim" data-salvar-msg="${passo}">Salvar</button></div>
      </div>`;
    }).join("")}
  </section>`;
}

function ligarMensagens(cfg) {
  let ultimo = null;
  const previa = (passo) => {
    const t = valor(`mm-${passo}`);
    const ex = passo === "primeiro_contato" ? comRodapeTela(exemplo(t), cfg.rodape_descadastro) : exemplo(t);
    $(`#mp-${passo}`).textContent = t.trim() ? ex : "(vazio — este passo fica parado)";
  };
  PASSOS_MSG.forEach(([passo]) => {
    const ta = $(`#mm-${passo}`);
    previa(passo);
    ta.addEventListener("input", () => previa(passo));
    ta.addEventListener("focus", () => (ultimo = ta));
  });
  $(".var-chips").onclick = (ev) => {
    const b = ev.target.closest("[data-var]");
    if (!b) return;
    const ta = ultimo || $("#mm-primeiro_contato");
    const ini = ta.selectionStart ?? ta.value.length;
    const fim = ta.selectionEnd ?? ta.value.length;
    ta.value = ta.value.slice(0, ini) + b.dataset.var + ta.value.slice(fim);
    ta.focus();
    ta.setSelectionRange(ini + b.dataset.var.length, ini + b.dataset.var.length);
    ta.dispatchEvent(new Event("input"));
  };
  $("#aj-mensagens").addEventListener("click", async (ev) => {
    const b = ev.target.closest("[data-salvar-msg]");
    if (!b) return;
    const passo = b.dataset.salvarMsg;
    const caixa = b.closest(".msg-modelo");
    const texto = valor(`mm-${passo}`).trim();
    if (!texto && !(await confirmar("Deixar vazio?", "Sem texto, este passo da automação fica parado (os contatos nele são pausados).", "Deixar vazio", true))) return;
    try {
      const id = caixa.dataset.id;
      if (id) await api(`data/modelos/${id}`, { method: "PATCH", body: { texto } });
      else {
        const r = await api("data/modelos", { method: "POST", body: { titulo: `Automação · ${PASSOS_MSG.find((p) => p[0] === passo)[1]}`, texto: texto || " ", passo } });
        caixa.dataset.id = r.id;
      }
      await carregarResumo();
      aviso("Mensagem salva");
    } catch (e) {
      aviso(e.message, true);
    }
  });
}

// ---------- Pré-relatório
function blocoRelatorio(cfg) {
  const area = (id, rotulo, v, linhas = 3, dica = "") =>
    `<div class="campo"><label for="${id}">${rotulo}</label><textarea id="${id}" class="entrada" rows="${linhas}">${esc(v || "")}</textarea>${dica ? `<p class="dica">${dica}</p>` : ""}</div>`;
  return `<section class="bloco" id="aj-relatorio">
    <h2>Pré-relatório</h2>
    <p>Textos e dados que entram em todo pré-relatório novo (cada um pode ser mudado no próprio relatório) e o endereço dos links.</p>
    <h3 class="sub">Endereço dos links</h3>
    <div class="status-linha" id="pr-status">Os links ficam em <strong>https://${esc(cfg.relatorio_dominio || "tangit.com.br")}/&lt;cliente&gt;-relatorio-&lt;6 dígitos&gt;</strong>.</div>
    <div class="grade-2">
      ${campo("pr-dominio", "Domínio", cfg.relatorio_dominio, 'autocapitalize="off" inputmode="url"')}
      <div class="campo"><label>&nbsp;</label><button class="btn" id="pr-testar">Testar endereço</button></div>
    </div>
    <p class="dica">O site da Tangit repassa esses endereços para este sistema (instalação no LEIAME, parte Pré-relatório). Endereço deste sistema: <code>${esc(ORIGEM)}</code>${
      /^https:\/\/prospeccao-tangit\.pages\.dev$/.test(ORIGEM) ? "" : " — como é diferente de https://prospeccao-tangit.pages.dev, crie no projeto do site a variável <code>SISTEMA_URL</code> com este endereço"
    }.</p>
    <h3 class="sub">Convite (fim da página)</h3>
    <div class="grade-2">
      ${campo("pr-whats", "WhatsApp do botão", cfg.relatorio_whatsapp ? fmtTel(cfg.relatorio_whatsapp) : "", 'inputmode="tel"')}
      ${campo("pr-botao", "Texto do botão", cfg.relatorio_cta_botao)}
    </div>
    ${campo("pr-cta-titulo", "Título", cfg.relatorio_cta_titulo)}
    ${campo("pr-cta-texto", "Texto", cfg.relatorio_cta_texto)}
    ${campo("pr-cta-msg", "Mensagem que abre no WhatsApp", cfg.relatorio_cta_mensagem, "", "{empresa} vira o nome da empresa.")}
    <h3 class="sub">Assinatura e cor</h3>
    <div class="grade-2">
      ${campo("pr-nome", "Nome", cfg.relatorio_assinatura_nome)}
      ${campo("pr-cargo", "Cargo", cfg.relatorio_assinatura_cargo)}
    </div>
    <div class="campo" style="margin-top:12px"><label for="pr-cor">Cor de destaque padrão</label><input id="pr-cor" type="color" class="cor" value="${esc(cfg.relatorio_cor || "#e23917")}"></div>
    <h3 class="sub">Textos fixos</h3>
    ${area("pr-tese", "O ponto de partida (frase)", cfg.relatorio_tese, 2)}
    ${area("pr-tese-nota", "O ponto de partida (complemento)", cfg.relatorio_tese_nota, 3)}
    ${area("pr-fecho", "Fecho (referência para a IA e texto do rascunho sem IA)", cfg.relatorio_fecho, 4, "Use **assim** para negrito.")}
    ${area("pr-destaque", "Destaque (caixa colorida)", cfg.relatorio_destaque, 3)}
    <h3 class="sub">Coleta e redação</h3>
    <div class="grade-2">
      ${campo("pr-psi", "Chave do Google PageSpeed (opcional)", cfg.psi_chave, 'type="password" autocomplete="off"', "Sem chave, o Google às vezes recusa a medição de velocidade.")}
      ${campo("pr-modelo", "Modelo da IA para a redação", cfg.ia_modelo_relatorio, 'autocapitalize="off"', "Usa a mesma chave de Ajustes → IA.")}
    </div>
    <div class="acoes-bloco"><button class="btn prim" id="pr-salvar">Salvar</button></div>
  </section>`;
}

function ligarRelatorioAjustes() {
  $("#pr-salvar").onclick = () =>
    salvarConfig(
      {
        relatorio_dominio: valor("pr-dominio"),
        relatorio_whatsapp: valor("pr-whats"),
        relatorio_cta_botao: valor("pr-botao"),
        relatorio_cta_titulo: valor("pr-cta-titulo"),
        relatorio_cta_texto: valor("pr-cta-texto"),
        relatorio_cta_mensagem: valor("pr-cta-msg"),
        relatorio_assinatura_nome: valor("pr-nome"),
        relatorio_assinatura_cargo: valor("pr-cargo"),
        relatorio_cor: valor("pr-cor"),
        relatorio_tese: valor("pr-tese"),
        relatorio_tese_nota: valor("pr-tese-nota"),
        relatorio_fecho: valor("pr-fecho"),
        relatorio_destaque: valor("pr-destaque"),
        psi_chave: valor("pr-psi"),
        ia_modelo_relatorio: valor("pr-modelo") || "claude-sonnet-5-5",
      },
      "Pré-relatório salvo"
    );
  $("#pr-testar").onclick = async (ev) => {
    const b = ev.currentTarget;
    b.disabled = true;
    const st = $("#pr-status");
    st.innerHTML = `<span class="giro mini"></span> Testando…`;
    try {
      if (valor("pr-dominio")) await api("automacao/config", { method: "PUT", body: { relatorio_dominio: valor("pr-dominio") } });
      const r = await api("relatorio/teste-endereco", { method: "POST" });
      st.innerHTML = `<span class="selo ${r.ok ? "ok" : "perigo"}">${r.ok ? `${ico("check")}Funcionando` : "Não chegou"}</span> ${esc(r.detalhe || "")} <code>${esc(r.endereco || "")}</code>`;
    } catch (e) {
      st.innerHTML = `<span class="selo perigo">Erro</span> ${esc(e.message)}`;
    }
    b.disabled = false;
  };
}

// ---------- Relógio
function blocoRelogio(cfg) {
  return `<section class="bloco" id="aj-relogio">
    <h2>Relógio dos envios</h2>
    <p>A cada 2 minutos, a VPS chama o sistema para enviar o que estiver na hora (já vem no script de instalação). Sem o relógio, nada sai sozinho.</p>
    <div class="status-linha" id="rl-status">${statusRelogio(cfg.ultimo_relogio)}</div>
    <div class="acoes-bloco"><button class="btn" id="rl-agora">Rodar agora</button></div>
    <details class="sub-det"><summary>Endereço e chave do relógio</summary>
      <dl class="dl"><dt>URL</dt><dd><code>${esc(ORIGEM)}/api/automacao/tick</code> (POST)</dd><dt>Cabeçalho</dt><dd><code>x-relogio-chave: ${esc(cfg.relogio_chave)}</code></dd></dl>
    </details>
  </section>`;
}

function statusRelogio(ultimo) {
  if (!ultimo) return `<span class="selo aviso">Ainda não rodou</span> Ele começa quando a VPS estiver instalada.`;
  const min = (Date.now() - Date.parse(ultimo)) / 60000;
  return min > 10
    ? `<span class="selo perigo">Parado</span> Última vez ${esc(quando(ultimo))}. Confira se a VPS está ligada.`
    : `<span class="selo ok">${ico("check")}Funcionando</span> Última vez ${esc(quando(ultimo))}.`;
}

function ligarRelogio() {
  $("#rl-agora").onclick = async (ev) => {
    const b = ev.currentTarget;
    b.disabled = true;
    try {
      const r = await api("automacao/tick", { method: "POST" });
      $("#rl-status").innerHTML = statusRelogio(r.agora);
      const partes = [];
      if (r.enviados) partes.push(plural(r.enviados, "mensagem enviada", "mensagens enviadas"));
      if (r.movidos) partes.push(plural(r.movidos, "negócio movido", "negócios movidos"));
      if (r.verificacao?.verificados) partes.push(plural(r.verificacao.verificados, "número conferido", "números conferidos"));
      aviso(partes.length ? partes.join(" · ") : r.motivo || "Nada para fazer agora");
      if (partes.length) checarNovidades(true);
    } catch (e) {
      aviso(e.message, true);
    }
    b.disabled = false;
  };
}

// ---------- Formulário do site e rastreamento
function blocoSite(cfg) {
  return `<section class="bloco" id="aj-site">
    <h2>Formulário do site</h2>
    <p>O botão de WhatsApp do site, o mesmo do CRM antigo. Quem preenche entra no funil na etapa de conversa, com a origem (Google Ads, Meta, Instagram, busca…).</p>
    <div class="grade-2">
      ${campo("st-numero", "WhatsApp que recebe", cfg.site_wa_numero ? fmtTel(cfg.site_wa_numero) : "", 'inputmode="tel" placeholder="(15) 99999-9999"')}
      <div class="campo"><label for="st-cor">Cor do botão</label><input id="st-cor" type="color" class="cor" value="${esc(cfg.widget_cor || "#25D366")}"></div>
    </div>
    ${campo("st-rotulo", "Texto do botão", cfg.widget_rotulo)}
    ${campo("st-titulo", "Título do formulário", cfg.widget_titulo)}
    ${campo("st-intro", "Texto do formulário", cfg.widget_intro)}
    ${campo("st-modelo", "Mensagem que abre no WhatsApp", cfg.site_wa_modelo, "", "{nome} e {busca} são trocados pelo que a pessoa escreveu.")}
    <h3 class="sub">Instalar no site</h3>
    <p class="dica">Troque, no site, o endereço do script do CRM antigo por este (antes de &lt;/body&gt; ou no Google Tag Manager, numa tag de HTML personalizado):</p>
    <pre class="codigo" id="st-script">&lt;script src="${esc(ORIGEM)}/widget.js" defer&gt;&lt;/script&gt;</pre>
    <div class="acoes-bloco"><button class="btn" data-copiar="st-script">${ico("copiar")} Copiar</button><a class="btn" href="/teste.html" target="_blank" rel="noopener">Abrir página de teste</a></div>
    <p class="dica">Qualquer botão do site abre o formulário com <code>data-crm-open</code> (opcional: <code>data-crm-interest="Branding"</code>). Sem o botão flutuante: <code>data-float="false"</code> no script.</p>
    <h3 class="sub">Meta (Pixel e API de Conversões)</h3>
    <div class="grade-2">
      ${campo("st-pixel", "ID do Pixel", cfg.meta_pixel, 'inputmode="numeric"')}
      ${campo("st-teste", "Código de teste (opcional)", cfg.meta_teste, 'autocapitalize="off"')}
    </div>
    ${campo("st-token", "Token da API de Conversões", cfg.meta_token, 'type="password" autocomplete="off"', cfg.meta_ultimo ? `Último envio: ${esc(cfg.meta_ultimo)}` : "")}
    <h3 class="sub">Google Analytics 4</h3>
    <div class="grade-2">
      ${campo("st-ga4", "ID de métricas", cfg.ga4_id, 'placeholder="G-XXXXXXX" autocapitalize="characters"')}
      ${campo("st-ga4s", "Chave secreta da API", cfg.ga4_segredo, 'type="password" autocomplete="off"')}
    </div>
    <h3 class="sub">Google Ads (conversões offline)</h3>
    ${campo("st-gads", "Nome da conversão no Google Ads", cfg.gads_conv)}
    <div class="grade-2">
      ${campo("st-de", "Vendas de", new Date(Date.now() - 30 * 864e5).toISOString().slice(0, 10), 'type="date"')}
      ${campo("st-ate", "até", hojeISO(), 'type="date"')}
    </div>
    <div class="acoes-bloco"><button class="btn" id="st-csv">${ico("baixar")} Baixar CSV para o Google Ads</button><button class="btn prim" id="st-salvar">Salvar</button></div>
  </section>`;
}

function ligarSite() {
  $("#st-salvar").onclick = () =>
    salvarConfig(
      {
        site_wa_numero: valor("st-numero"),
        widget_cor: valor("st-cor"),
        widget_rotulo: valor("st-rotulo"),
        widget_titulo: valor("st-titulo"),
        widget_intro: valor("st-intro"),
        site_wa_modelo: valor("st-modelo"),
        meta_pixel: valor("st-pixel"),
        meta_teste: valor("st-teste"),
        meta_token: valor("st-token"),
        ga4_id: valor("st-ga4"),
        ga4_segredo: valor("st-ga4s"),
        gads_conv: valor("st-gads"),
      },
      "Formulário e rastreamento salvos"
    );
  $("#st-csv").onclick = () => baixarArquivo(`data/export/gads?de=${valor("st-de")}&ate=${valor("st-ate")}`, `conversoes-google-ads-${hojeISO()}.csv`);
}

// download de arquivo da API (com a chave de acesso)
async function baixarArquivo(caminho, nome) {
  try {
    const headers = {};
    const chave = ler("prosp.chave");
    if (chave) headers["x-access-key"] = chave;
    const r = await fetch(`/api/${caminho}`, { headers });
    if (!r.ok) throw new Error(`Erro ${r.status}`);
    const blob = await r.blob();
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = nome;
    document.body.append(a);
    a.click();
    setTimeout(() => {
      URL.revokeObjectURL(a.href);
      a.remove();
    }, 1000);
  } catch (e) {
    aviso(e.message, true);
  }
}

// ---------- IA
function blocoIA(cfg) {
  return `<section class="bloco" id="aj-ia">
    <h2>IA (opcional)</h2>
    <p>Separa resposta automática (“Obrigado pelo contato, em breve retornaremos”) de resposta de pessoa — as regras resolvem a maioria; a IA só entra nos casos duvidosos. Também escreve o rascunho do pré-relatório (modelo em Ajustes → Pré-relatório). Sem chave, valem só as regras.</p>
    <div class="grade-2">
      ${campo("ia-chave", "Chave da API da Anthropic", cfg.ia_chave, 'type="password" autocomplete="off" placeholder="sk-ant-…"')}
      ${campo("ia-modelo", "Modelo", cfg.ia_modelo, 'autocapitalize="off"')}
    </div>
    <div class="acoes-bloco"><button class="btn prim" id="ia-salvar">Salvar</button></div>
  </section>`;
}
function ligarIA() {
  $("#ia-salvar").onclick = () => salvarConfig({ ia_chave: valor("ia-chave"), ia_modelo: valor("ia-modelo") || "claude-haiku-5-5" }, "IA salva");
}

// ---------- Etapas
function blocoEtapas() {
  return `<section class="bloco" id="aj-etapas">
    <h2>Etapas do funil</h2>
    <p>Renomeie e reordene à vontade. A <strong>função</strong> diz à automação o que cada etapa significa (ex.: em qual etapa entra quem respondeu).</p>
    <div id="etapas"></div>
    <div class="acoes-bloco">
      <button class="btn" id="etapa-nova">${ico("mais")} Nova etapa</button>
      <button class="btn prim" id="etapas-salvar">Salvar etapas</button>
    </div>
  </section>`;
}

function ligarEtapas() {
  const PAPEIS = E.resumo.papeis || {};
  let etapas = E.resumo.etapas.map((e) => ({ ...e }));
  const desenhar = () => {
    $("#etapas").innerHTML = etapas
      .map(
        (e, i) => `<div class="etapa-linha" data-i="${i}">
          <input type="color" value="${esc(e.cor)}" data-c="cor" aria-label="Cor">
          <input class="entrada" value="${esc(e.nome)}" data-c="nome" maxlength="40" aria-label="Nome da etapa">
          <select class="entrada" data-c="tipo" aria-label="Tipo">
            <option value="aberta" ${e.tipo === "aberta" ? "selected" : ""}>Em andamento</option>
            <option value="ganho" ${e.tipo === "ganho" ? "selected" : ""}>Venda ganha</option>
            <option value="perdido" ${e.tipo === "perdido" ? "selected" : ""}>Perdida</option>
          </select>
          <select class="entrada" data-c="papel" aria-label="Função na automação">
            <option value="">Sem função</option>
            ${Object.entries(PAPEIS).map(([k, v]) => `<option value="${k}" ${e.papel === k ? "selected" : ""}>${esc(v)}</option>`).join("")}
          </select>
          <div class="linha">
            <button class="btn ico-btn peq" data-m="-1" ${i === 0 ? "disabled" : ""} aria-label="Subir">↑</button>
            <button class="btn ico-btn peq" data-m="1" ${i === etapas.length - 1 ? "disabled" : ""} aria-label="Descer">↓</button>
            <button class="btn ico-btn peq perigo" data-x="1" aria-label="Remover">×</button>
          </div>
        </div>`
      )
      .join("");
  };
  desenhar();
  $("#etapas").oninput = (ev) => {
    const linha = ev.target.closest(".etapa-linha");
    const c = ev.target.dataset.c;
    if (linha && c) etapas[Number(linha.dataset.i)][c] = ev.target.value || (c === "papel" ? null : ev.target.value);
  };
  $("#etapas").onchange = $("#etapas").oninput;
  $("#etapas").onclick = (ev) => {
    const linha = ev.target.closest(".etapa-linha");
    if (!linha) return;
    const i = Number(linha.dataset.i);
    const m = ev.target.closest("[data-m]");
    if (m) {
      const j = i + Number(m.dataset.m);
      [etapas[i], etapas[j]] = [etapas[j], etapas[i]];
      desenhar();
    }
    if (ev.target.closest("[data-x]")) {
      if (etapas.length === 1) return aviso("O funil precisa de ao menos uma etapa", true);
      etapas.splice(i, 1);
      desenhar();
    }
  };
  $("#etapa-nova").onclick = () => {
    const ultimaAberta = etapas.map((e) => e.tipo).lastIndexOf("aberta");
    etapas.splice(ultimaAberta + 1, 0, { nome: "Nova etapa", cor: corAleatoria(), tipo: "aberta", papel: null });
    desenhar();
  };
  $("#etapas-salvar").onclick = async () => {
    const usados = etapas.map((e) => e.papel).filter(Boolean);
    const repetido = usados.find((p, i) => usados.indexOf(p) !== i);
    if (repetido) return aviso(`Duas etapas com a função “${PAPEIS[repetido]}”`, true);
    const faltam = ["entrada", "contato", "conversa", "outro_momento", "perdido"].filter((p) => !usados.includes(p));
    if (faltam.length && !(await confirmar("Funções sem etapa", `A automação precisa destas funções: ${faltam.map((p) => PAPEIS[p]).join(", ")}. Sem elas, parte da sequência não move os cards. Salvar mesmo assim?`, "Salvar"))) return;
    try {
      E.resumo.etapas = await api("data/etapas", { method: "PUT", body: { etapas } });
      etapas = E.resumo.etapas.map((e) => ({ ...e }));
      desenhar();
      aviso("Etapas salvas");
    } catch (e) {
      aviso(e.message, true);
    }
  };
}

// ---------- Modelos manuais
function blocoModelos() {
  return `<section class="bloco" id="aj-modelos">
    <h2>Modelos de mensagem</h2>
    <p>Para responder rápido pela ficha (WhatsApp e e-mail). Use {saudacao}, {nome}, {empresa}, {razao_social}, {cidade}, {segmento} e {socio}.</p>
    <div id="modelos"></div>
    <button class="btn" id="modelo-novo">${ico("mais")} Novo modelo</button>
  </section>`;
}

function ligarModelos() {
  const desenhar = () => {
    const ms = (E.resumo.modelos || []).filter((m) => !m.passo);
    $("#modelos").innerHTML = ms.length
      ? ms
          .map(
            (m) => `<div class="modelo"><div class="t">${esc(m.titulo)}
              <span class="linha"><button class="btn peq" data-ed="${m.id}">Editar</button>
              <button class="btn peq perigo" data-del="${m.id}">Apagar</button></span></div>
              <div class="x">${esc(m.texto)}</div></div>`
          )
          .join("")
      : `<p class="muted">Nenhum modelo ainda.</p>`;
  };
  desenhar();
  const editar = async (m) => {
    const r = await abrirModal({
      titulo: m ? "Editar modelo" : "Novo modelo",
      corpo: `<div class="campo"><label for="m-t">Título</label><input id="m-t" class="entrada" value="${esc(m?.titulo || "")}" maxlength="80"></div>
        <div class="campo"><label for="m-x">Mensagem</label><textarea id="m-x" class="entrada" rows="5" placeholder="{saudacao}, tudo bem? Aqui é…">${esc(m?.texto || "")}</textarea></div>`,
      botoes: [
        { rotulo: "Cancelar", valor: null },
        {
          rotulo: "Salvar",
          classe: "prim",
          acao: (el) => {
            const titulo_ = $("#m-t", el).value.trim();
            const texto = $("#m-x", el).value.trim();
            if (!titulo_ || !texto) return false;
            return { titulo: titulo_, texto };
          },
        },
      ],
    });
    if (!r) return;
    try {
      if (m) await api(`data/modelos/${m.id}`, { method: "PATCH", body: r });
      else await api("data/modelos", { method: "POST", body: r });
      await carregarResumo();
      desenhar();
    } catch (e) {
      aviso(e.message, true);
    }
  };
  $("#modelo-novo").onclick = () => editar(null);
  $("#modelos").onclick = async (ev) => {
    const ed = ev.target.closest("[data-ed]");
    const del = ev.target.closest("[data-del]");
    if (ed) editar(E.resumo.modelos.find((m) => m.id === Number(ed.dataset.ed)));
    if (del) {
      if (!(await confirmar("Apagar modelo", "Apagar este modelo de mensagem?", "Apagar", true))) return;
      await api(`data/modelos/${del.dataset.del}`, { method: "DELETE" });
      await carregarResumo();
      desenhar();
    }
  };
}

// ---------- Cópia de segurança e acesso
function blocoBackup() {
  return `<section class="bloco" id="aj-backup">
    <h2>Cópia de segurança</h2>
    <p>Baixa listas, funil, anotações, conversas e modelos em um arquivo JSON (sem senhas e chaves).</p>
    <button class="btn" id="backup">${ico("baixar")} Baixar cópia</button>
    <h3 class="sub">Acesso neste aparelho</h3>
    <p class="dica">A chave de acesso fica salva neste navegador. Use em aparelho compartilhado.</p>
    <button class="btn" id="sair">Esquecer a chave neste aparelho</button>
  </section>`;
}

function ligarBackup() {
  $("#backup").onclick = () => baixarArquivo("data/backup", `prospeccao-backup-${hojeISO()}.json`);
  $("#sair").onclick = () => {
    try {
      localStorage.removeItem("prosp.chave");
    } catch {}
    aviso("Chave removida deste aparelho");
  };
}

// ============================================================ tela: PRÉ-RELATÓRIO (coleta, texto, prévia e aprovação)
const AREAS_REL = ["Marca", "Site", "Instagram", "Google", "Reputação", "Mídia", "Medição", "Negócio"];
const CONTEUDO_IG = [
  ["oferta", "Oferta e preço"],
  ["produto", "Produto"],
  ["bastidores", "Bastidores"],
  ["educativo", "Educativo"],
  ["depoimentos", "Depoimentos"],
  ["institucional", "Institucional"],
];
const REPUTACOES = ["RA1000", "Ótimo", "Bom", "Regular", "Ruim", "Não recomendada", "Sem índice", "Não encontrada"];
const STATUS_REL = {
  nenhum: ["Não gerado", ""],
  rascunho: ["Rascunho", "aviso"],
  aprovado: ["Publicado", "ok"],
  alterado: ["Publicado · com mudanças não publicadas", "aviso"],
};
const seloRelatorio = (st) => {
  const [t, c] = STATUS_REL[st || "nenhum"] || STATUS_REL.nenhum;
  return `<span class="selo ${c}">${esc(t)}</span>`;
};
const linkInterno = (link) => (link ? `${link}?interno=1` : "#");
const fmtMs = (ms) => (ms ? `${(ms / 1000).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} s` : "—");

// caminho "cta.titulo" → valor dentro do conteúdo
const lerCaminho = (o, c) => c.split(".").reduce((x, k) => (x == null ? x : x[k]), o);
function gravarCaminho(o, c, v) {
  const ks = c.split(".");
  let x = o;
  for (const k of ks.slice(0, -1)) x = x[k] ??= {};
  x[ks[ks.length - 1]] = v;
}

async function telaRelatorio(main, id) {
  const negId = Number(id);
  if (E.rel?.negId !== negId) E.rel = { negId, d: null, c: null, timers: {}, pendente: false, salvando: null };
  main.innerHTML = `<div class="topo"><button class="btn fant" id="rl-voltar">← Voltar</button><h1>Pré-relatório</h1></div>
    <div class="pagina"><div class="carregando"><span class="giro"></span> Carregando…</div></div>`;
  $("#rl-voltar").onclick = voltarDoRelatorio;
  if (!negId) return ($(".pagina", main).innerHTML = `<div class="alerta">Contato inválido.</div>`);
  if (!E.resumo.etapas.length) await carregarResumo();
  try {
    E.rel.d = await api(`relatorio/${negId}`);
  } catch (e) {
    $(".pagina", main).innerHTML = `<div class="alerta">${esc(e.message)}</div>`;
    return;
  }
  E.rel.c = JSON.parse(JSON.stringify(E.rel.d.relatorio.conteudo));
  desenharRelatorio(main);
}

function voltarDoRelatorio() {
  salvarRelPendente();
  location.hash = E.rel?.voltarPara || "#/aprovar";
}

function desenharRelatorio(main) {
  const d = E.rel.d;
  const ctx = d.contexto;
  main.innerHTML = `
    <div class="topo rl-topo">
      <button class="btn fant" id="rl-voltar">← Voltar</button>
      <h1>${esc(ctx.nome)}<span class="rl-sub">Pré-relatório</span></h1>
      <span id="rl-status">${seloRelatorio(d.relatorio.status)}</span>
      <span class="dica" id="rl-salvo"></span>
      <button class="btn rl-so-movel" id="rl-ver-previa">Prévia</button>
      <button class="btn prim" id="rl-aprovar">${ico("aprovar")} ${d.relatorio.publicado ? "Aprovar mudanças" : "Aprovar e publicar"}</button>
    </div>
    <div class="pagina rl-pagina">
      <div class="rl-editor">
        <div id="rl-publicacao"></div>
        <section class="bloco" id="rl-coleta">
          <h2><span class="rl-n">1</span> Coleta</h2>
          <p>O site é analisado sozinho. O resto você confere em poucos minutos pelos links prontos; o que ficar em branco fica fora do relatório.</p>
          ${htmlColetaSite()}
          ${htmlColetaManual()}
        </section>
        <section class="bloco" id="rl-pontos"></section>
        <section class="bloco" id="rl-texto"></section>
      </div>
      <aside class="rl-previa" aria-label="Prévia">
        <div class="rl-previa-cab"><span class="rotulo">Prévia no celular</span><a class="btn peq fant" id="rl-abrir-link" target="_blank" rel="noopener" hidden>Abrir publicado ↗</a></div>
        <div class="rl-moldura"><iframe id="rl-iframe" title="Prévia do pré-relatório"></iframe></div>
      </aside>
    </div>
    <div class="rl-previa-movel" id="rl-previa-movel" hidden>
      <div class="rl-previa-movel-cab"><strong>Prévia</strong><button class="btn" id="rl-fechar-previa">Fechar</button></div>
      <iframe id="rl-iframe-movel" title="Prévia do pré-relatório"></iframe>
    </div>`;
  $("#rl-voltar").onclick = voltarDoRelatorio;
  $("#rl-aprovar").onclick = aprovarRelatorio;
  $("#rl-ver-previa").onclick = () => {
    $("#rl-previa-movel").hidden = false;
    $("#rl-iframe-movel").srcdoc = htmlPrevia();
  };
  $("#rl-fechar-previa").onclick = () => ($("#rl-previa-movel").hidden = true);
  E.rel.ultimoStatus = d.relatorio.status;
  ligarColeta();
  desenharResultadoSite();
  desenharPontos();
  desenharTextoRel();
  desenharPublicacao();
  atualizarPrevia(true);
}

// ---------- coleta: site
function htmlColetaSite() {
  const d = E.rel.d;
  const site = d.relatorio.coleta.site;
  const sem = !!d.relatorio.coleta.manual?.sem_site;
  return `<h3 class="sub">Site</h3>
    <div class="linha rl-site-linha">
      <input id="rl-url" class="entrada" inputmode="url" autocapitalize="off" spellcheck="false" placeholder="www.empresa.com.br" value="${esc(site?.url_informada || d.site_sugerido || "")}">
      <button class="btn prim" id="rl-analisar">${site ? "Analisar de novo" : "Analisar site"}</button>
    </div>
    ${!site && d.site_sugerido ? `<p class="dica">Sugestão a partir do e-mail da empresa. Confira antes de analisar.</p>` : ""}
    <label class="rl-check"><input type="checkbox" id="rl-sem-site" ${sem ? "checked" : ""}> A empresa não tem site</label>
    <div id="rl-site-res"></div>`;
}

function desenharResultadoSite(carregandoVel = false) {
  const el = $("#rl-site-res");
  if (!el) return;
  const d = E.rel.d;
  const s = d.relatorio.coleta.site;
  const v = d.relatorio.coleta.velocidade;
  const m = d.medicao;
  if (!s) return (el.innerHTML = "");
  if (!s.ok) return (el.innerHTML = `<div class="alerta" style="margin-top:10px">${esc(s.erro || "Não foi possível abrir o site.")}</div>`);
  const sim = (b, t = "") => `<span class="rl-ok ${b ? "sim" : "nao"}">${b ? "✓" : "✕"}</span>${t}`;
  const via = (direto, gtm) => (direto ? " no código" : gtm ? " via GTM" : "");
  const t = s.tags || {};
  const g = s.via_gtm || {};
  const redes = Object.entries(s.redes || {}).filter(([, x]) => x);
  const linkRede = (k, x) =>
    k === "instagram" ? `https://www.instagram.com/${x}/` : k === "tiktok" ? `https://www.tiktok.com/@${x}` : x;
  const medicaoHtml = m
    ? `<div class="rl-chips">
        <span class="rl-chip ${m.gtm ? "sim" : ""}">${sim(m.gtm, ` Tag Manager${t.gtm?.length ? ` <small>${esc(t.gtm.join(", "))}</small>` : ""}`)}</span>
        <span class="rl-chip ${m.ga4 ? "sim" : ""}">${sim(m.ga4, ` Analytics 4${via(t.ga4?.length, g.ga4?.length)}`)}</span>
        <span class="rl-chip ${m.gads ? "sim" : ""}">${sim(m.gads, ` Google Ads (conversão)${via(t.gads?.length, g.gads?.length || s.gads_via_tag_google?.length)}`)}</span>
        <span class="rl-chip ${m.pixel_meta ? "sim" : ""}">${sim(m.pixel_meta, ` Pixel da Meta${via(t.pixel_meta?.length, g.pixel_meta?.length)}`)}</span>
        ${m.tiktok ? `<span class="rl-chip sim">${sim(true, " TikTok")}</span>` : ""}
        ${m.linkedin ? `<span class="rl-chip sim">${sim(true, " LinkedIn")}</span>` : ""}
        ${m.mapa_calor ? `<span class="rl-chip sim">${sim(true, " Mapa de calor")}</span>` : ""}
        ${m.rdstation ? `<span class="rl-chip sim">${sim(true, " RD Station")}</span>` : ""}
        ${m.ua_antigo ? `<span class="rl-chip">${sim(false, " Analytics antigo (UA)")}</span>` : ""}
      </div>
      ${m.gtm && !m.gtm_lido ? `<p class="dica">O site usa o Tag Manager, mas não deu para ler o que tem dentro: o que aparece como ✕ pode estar lá.</p>` : ""}`
    : "";
  const velHtml = carregandoVel
    ? `<span class="giro mini"></span> Medindo no Google (até 1 minuto)…`
    : v?.ok
      ? `<strong class="num">${v.nota ?? "—"}/100</strong> no celular · conteúdo principal em <strong>${fmtMs(v.campo_lcp_ms || v.lcp_ms)}</strong>${v.campo_lcp_ms ? " (visitantes reais)" : ""} · SEO ${v.seo ?? "—"} <button class="btn peq fant" id="rl-vel">Medir de novo</button>`
      : `${v?.erro ? `<span class="muted">${esc(v.erro)}</span> ` : ""}<button class="btn peq" id="rl-vel">Medir velocidade no celular</button>`;
  el.innerHTML = `<div class="rl-site">
    <dl class="dl">
      <dt>Endereço</dt><dd><a href="${esc(s.url_final)}" target="_blank" rel="noopener">${esc(hostDe(s.url_final))}</a> · ${esc(s.plataforma || "plataforma não identificada")} · ${fmtMs(s.ms)}</dd>
      <dt>Básico</dt><dd>${sim(s.https, " HTTPS")} &nbsp; ${sim(s.viewport, " Adapta ao celular")} &nbsp; ${sim(s.whatsapp, " Link de WhatsApp")} &nbsp; ${sim(s.formulario, " Formulário")}</dd>
      <dt>Na busca</dt><dd><strong>${esc(s.titulo || "(sem título)")}</strong><br><span class="muted">${esc(s.descricao || s.og_descricao || "(sem descrição)")}</span></dd>
      ${s.h1 ? `<dt>Frase principal</dt><dd>“${esc(s.h1)}”</dd>` : ""}
      <dt>Redes no site</dt><dd>${redes.length ? redes.map(([k, x]) => `<a href="${esc(linkRede(k, x))}" target="_blank" rel="noopener">${esc(k)}</a>`).join(" · ") : '<span class="muted">nenhuma</span>'}</dd>
      ${s.ano_rodape ? `<dt>Rodapé</dt><dd>© ${s.ano_rodape}</dd>` : ""}
      <dt>Velocidade</dt><dd id="rl-vel-res">${velHtml}</dd>
    </dl>
    <h3 class="sub">Medição e anúncios no site</h3>
    ${medicaoHtml}
  </div>`;
  const b = $("#rl-vel");
  if (b) b.onclick = medirVelocidadeRel;
}

// Chamada à API que devolve o corpo como veio (código de página repassado pelo servidor).
async function apiBruto(caminho, opcoes = {}) {
  const headers = {};
  const chave = ler("prosp.chave");
  if (chave) headers["x-access-key"] = chave;
  let body;
  if (opcoes.body !== undefined) {
    headers["content-type"] = "application/json";
    body = JSON.stringify(opcoes.body);
  }
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), opcoes.timeout || 45000);
  try {
    const r = await fetch(`/api/${caminho}`, { method: opcoes.method || "GET", headers, body, signal: ctrl.signal });
    if (r.status === 401) throw new Error("Acesso negado.");
    return r;
  } catch (e) {
    throw new Error(e.name === "AbortError" ? "O site demorou demais para responder." : e.message || "Sem conexão com o servidor.");
  } finally {
    clearTimeout(t);
  }
}
const ehJson = (r) => (r.headers.get("content-type") || "").includes("application/json");

// texto da página na codificação certa (a maioria é UTF-8; sites antigos usam ISO-8859-1)
async function textoDaPagina(r) {
  const bytes = new Uint8Array(await r.arrayBuffer()).subarray(0, 1_000_000);
  let cs = r.headers.get("x-charset") || "";
  if (!cs) cs = (new TextDecoder("windows-1252").decode(bytes.subarray(0, 4000)).match(/<meta[^>]+charset=["']?([\w-]+)/i)?.[1] || "utf-8").toLowerCase();
  try {
    return new TextDecoder(cs).decode(bytes);
  } catch {
    return new TextDecoder("utf-8").decode(bytes);
  }
}

// O servidor só repassa o código; a leitura roda aqui, no aparelho (não gasta o limite da Cloudflare).
async function analisarNoAparelho(url) {
  const r = await apiBruto(`relatorio/${E.rel.negId}/pagina`, { method: "POST", body: { url }, timeout: 45000 });
  if (ehJson(r)) {
    const e = await r.json();
    if (!("ok" in e)) throw new Error(e.erro || `Erro ${r.status}`);
    return { ok: false, url_informada: url, url_final: e.url_final, status: e.status, ms: e.ms, erro: e.erro };
  }
  const html = await textoDaPagina(r);
  const dados = { urlInformada: url, urlFinal: r.headers.get("x-url-final") || url, status: Number(r.headers.get("x-status")) || 200, ms: Number(r.headers.get("x-ms")) || 0, bytes: html.length, html };
  const proto = analisarHtml(html, dados.urlFinal);
  const gtm = [];
  for (const id of proto.tags.gtm.slice(0, 2)) {
    try {
      const g = await apiBruto(`relatorio/tag?id=${encodeURIComponent(id)}`, { timeout: 20000 });
      if (g.ok && !ehJson(g)) gtm.push(await g.text());
    } catch {}
  }
  let res = montarResultadoSite({ ...dados, gtm });
  if (precisaGtag(res)) {
    try {
      const g = await apiBruto(`relatorio/tag?id=${encodeURIComponent(res.tags.ga4[0])}`, { timeout: 20000 });
      if (g.ok && !ehJson(g)) res = montarResultadoSite({ ...dados, gtm, gtag: await g.text() });
    } catch {}
  }
  return res;
}

async function analisarSiteRel() {
  const url = $("#rl-url").value.trim();
  if (!url) return $("#rl-url").focus();
  const b = $("#rl-analisar");
  b.disabled = true;
  b.innerHTML = `<span class="giro mini"></span> Analisando…`;
  try {
    await salvarManualAgora();
    const resultado = await analisarNoAparelho(url);
    E.rel.d = await api(`relatorio/${E.rel.negId}/site`, { method: "POST", body: { resultado } });
    const ig = $("#rl-ig-usuario");
    const igColeta = E.rel.d.relatorio.coleta.manual?.instagram?.usuario;
    if (ig && !ig.value && igColeta) {
      ig.value = "@" + igColeta;
      atualizarLinksManuais();
    }
    if ($("#rl-sem-site")) $("#rl-sem-site").checked = !!E.rel.d.relatorio.coleta.manual?.sem_site;
    desenharResultadoSite();
    desenharPontos();
    if (!E.rel.d.relatorio.coleta.site?.ok) aviso(E.rel.d.relatorio.coleta.site?.erro || "O site não abriu", true);
    b.textContent = "Analisar de novo";
    if (E.rel.d.relatorio.coleta.site?.ok) medirVelocidadeRel();
  } catch (e) {
    aviso(e.message, true);
    b.textContent = "Analisar site";
  }
  b.disabled = false;
}

async function medirVelocidadeRel() {
  desenharResultadoSite(true);
  try {
    E.rel.d = await api(`relatorio/${E.rel.negId}/velocidade`, { method: "POST", timeout: 95000 });
  } catch (e) {
    aviso(e.message, true);
  }
  desenharResultadoSite();
  desenharPontos();
}

// ---------- coleta: conferência manual
function htmlColetaManual() {
  const m = E.rel.d.relatorio.coleta.manual || {};
  const ig = m.instagram || {};
  const g = m.google || {};
  const an = m.anuncios || {};
  const ra = m.reclame_aqui || {};
  const opc = (lista, atual) => lista.map(([v, t]) => `<option value="${v}" ${v === atual ? "selected" : ""}>${esc(t)}</option>`).join("");
  return `
    <h3 class="sub">Instagram</h3>
    <div class="grade-2">
      <div class="campo"><label for="rl-ig-usuario">Perfil</label><div class="linha"><input id="rl-ig-usuario" class="entrada" data-m="instagram.usuario" placeholder="@usuario" autocapitalize="off" value="${esc(ig.usuario ? "@" + ig.usuario : "")}"><a class="btn peq" id="rl-ig-link" target="_blank" rel="noopener">Abrir ↗</a></div></div>
      <div class="campo"><label for="rl-ig-ult">Última publicação</label><input id="rl-ig-ult" type="date" class="entrada" data-m="instagram.ultima_postagem" value="${esc(ig.ultima_postagem || "")}"></div>
      <div class="campo"><label for="rl-ig-seg">Seguidores</label><input id="rl-ig-seg" class="entrada num" data-m="instagram.seguidores" placeholder="11,3 mil" value="${esc(ig.seguidores || "")}"></div>
      <div class="campo"><label for="rl-ig-pub">Publicações</label><input id="rl-ig-pub" class="entrada num" data-m="instagram.publicacoes" value="${esc(ig.publicacoes || "")}"></div>
    </div>
    <div class="campo"><label for="rl-ig-bio">Bio (o que a marca promete ali)</label><textarea id="rl-ig-bio" class="entrada" rows="2" data-m="instagram.bio">${esc(ig.bio || "")}</textarea></div>
    <div class="campo"><label>O que mais aparece nas publicações</label><div class="pilulas" id="rl-ig-cont">${CONTEUDO_IG.map(
      ([v, t]) => `<button type="button" class="pilula" data-cont="${v}" aria-pressed="${(ig.conteudo || []).includes(v)}">${t}</button>`
    ).join("")}</div><p class="dica">Toque na ordem do que mais aparece.</p></div>

    <h3 class="sub">Google Meu Negócio</h3>
    <div class="grade-2">
      <div class="campo"><label for="rl-g-nota">Nota</label><div class="linha"><input id="rl-g-nota" class="entrada num" data-m="google.nota" placeholder="4,6" value="${esc(g.nota || "")}"><a class="btn peq" id="rl-g-link" target="_blank" rel="noopener">Maps ↗</a></div></div>
      <div class="campo"><label for="rl-g-aval">Avaliações</label><input id="rl-g-aval" class="entrada num" data-m="google.avaliacoes" placeholder="787" value="${esc(g.avaliacoes || "")}"></div>
    </div>
    <div class="campo"><label for="rl-g-desc">Descrição do perfil</label><textarea id="rl-g-desc" class="entrada" rows="2" data-m="google.descricao">${esc(g.descricao || "")}</textarea></div>
    <div class="campo"><label for="rl-g-resp">Responde às avaliações?</label><select id="rl-g-resp" class="entrada" data-m="google.responde"><option value="">Não conferi</option>${opc([["sim", "Sim"], ["as_vezes", "Às vezes"], ["nao", "Não"]], g.responde)}</select></div>

    <h3 class="sub">Anúncios ativos</h3>
    <div class="grade-2">
      <div class="campo"><label for="rl-an-meta">Na Meta (Instagram e Facebook)</label><div class="linha"><select id="rl-an-meta" class="entrada" data-m="anuncios.meta"><option value="">Não conferi</option>${opc([["sim", "Tem anúncios"], ["nao", "Sem anúncios"]], an.meta)}</select><a class="btn peq" id="rl-an-meta-link" target="_blank" rel="noopener">Conferir ↗</a></div></div>
      <div class="campo"><label for="rl-an-google">No Google</label><div class="linha"><select id="rl-an-google" class="entrada" data-m="anuncios.google"><option value="">Não conferi</option>${opc([["sim", "Tem anúncios"], ["nao", "Sem anúncios"]], an.google)}</select><a class="btn peq" id="rl-an-google-link" target="_blank" rel="noopener">Conferir ↗</a></div></div>
    </div>

    <h3 class="sub">Reclame Aqui</h3>
    <div class="grade-2">
      <div class="campo"><label for="rl-ra-rep">Reputação</label><div class="linha"><select id="rl-ra-rep" class="entrada" data-m="reclame_aqui.reputacao"><option value="">Não conferi</option>${opc(
        REPUTACOES.map((r) => [r, r]),
        ra.reputacao
      )}</select><a class="btn peq" id="rl-ra-link" target="_blank" rel="noopener">Abrir ↗</a></div></div>
      <div class="campo"><label for="rl-ra-nota">Nota (0 a 10)</label><input id="rl-ra-nota" class="entrada num" data-m="reclame_aqui.nota" placeholder="7,8" value="${esc(ra.nota || "")}"></div>
    </div>

    <h3 class="sub">O que mais você notou</h3>
    <div class="campo"><textarea id="rl-obs" class="entrada" rows="3" data-m="observacoes" placeholder="Ex.: o YouTube tem bons vídeos educativos, mas pouca audiência. Entra na redação.">${esc(m.observacoes || "")}</textarea></div>`;
}

function lerManual() {
  const m = { instagram: {}, google: {}, anuncios: {}, reclame_aqui: {}, observacoes: "" };
  $$("[data-m]", $("#rl-coleta")).forEach((el) => gravarCaminho(m, el.dataset.m, el.value));
  m.instagram.usuario = String(m.instagram.usuario || "").replace(/^@/, "").trim();
  m.instagram.conteudo = E.rel.conteudoIg ?? (E.rel.d.relatorio.coleta.manual?.instagram?.conteudo || []);
  m.sem_site = !!$("#rl-sem-site")?.checked;
  return m;
}

function atualizarLinksManuais() {
  const L = E.rel.d.links || {};
  const ig = String($("#rl-ig-usuario")?.value || "").replace(/^@/, "").trim();
  const set = (id, url) => {
    const a = $(id);
    if (a) a.href = url || "#";
  };
  set("#rl-ig-link", ig ? `https://www.instagram.com/${encodeURIComponent(ig)}/` : L.instagram);
  set("#rl-g-link", L.google_maps);
  set("#rl-an-meta-link", L.meta_anuncios);
  set("#rl-an-google-link", L.google_anuncios);
  set("#rl-ra-link", L.reclame_aqui);
}

function ligarColeta() {
  const sec = $("#rl-coleta");
  $("#rl-analisar").onclick = analisarSiteRel;
  $("#rl-url").onkeydown = (ev) => ev.key === "Enter" && analisarSiteRel();
  atualizarLinksManuais();
  E.rel.conteudoIg = null;
  sec.addEventListener("input", (ev) => {
    if (!ev.target.closest("[data-m]")) return;
    if (ev.target.id === "rl-ig-usuario") atualizarLinksManuais();
    agendarManual();
  });
  sec.addEventListener("change", (ev) => {
    if (ev.target.closest("[data-m]") || ev.target.id === "rl-sem-site") agendarManual(true);
  });
  $("#rl-ig-cont").onclick = (ev) => {
    const b = ev.target.closest("[data-cont]");
    if (!b) return;
    const atual = E.rel.conteudoIg ?? [...(E.rel.d.relatorio.coleta.manual?.instagram?.conteudo || [])];
    const i = atual.indexOf(b.dataset.cont);
    if (i >= 0) atual.splice(i, 1);
    else atual.push(b.dataset.cont);
    E.rel.conteudoIg = atual;
    $$("[data-cont]", $("#rl-ig-cont")).forEach((x) => x.setAttribute("aria-pressed", String(atual.includes(x.dataset.cont))));
    agendarManual(true);
  };
}

function agendarManual(rapido = false) {
  clearTimeout(E.rel.timers.manual);
  E.rel.manualPendente = true;
  E.rel.timers.manual = setTimeout(salvarManualAgora, rapido ? 300 : 1000);
}

async function salvarManualAgora() {
  clearTimeout(E.rel.timers.manual);
  if (!E.rel?.manualPendente || !$("#rl-coleta")) return;
  E.rel.manualPendente = false;
  try {
    const d = await api(`relatorio/${E.rel.negId}/manual`, { method: "PUT", body: { manual: lerManual() }, silencioso: true });
    E.rel.d = { ...d, relatorio: { ...d.relatorio } };
    E.rel.conteudoIg = null;
    desenharPontos();
    $("#rl-salvo") && ($("#rl-salvo").textContent = "Conferência salva");
  } catch (e) {
    aviso(e.message, true);
  }
}

// ---------- pontos encontrados + escrever
function desenharPontos() {
  const el = $("#rl-pontos");
  if (!el) return;
  const d = E.rel.d;
  const obs = d.observacoes || [];
  const creditos = obs.filter((o) => o.tipo === "credito");
  const pontos = obs.filter((o) => o.tipo === "ponto");
  el.innerHTML = `<h2><span class="rl-n">2</span> O que a leitura encontrou</h2>
    <p>Fatos que a coleta mostra até agora. A redação usa só isto (e o que você anotou) — nada além.</p>
    ${
      obs.length
        ? `<ul class="rl-obs">${[...creditos, ...pontos]
            .map(
              (o) => `<li class="${o.tipo}"><span class="selo ${o.tipo === "credito" ? "ok" : ""}">${esc(o.tipo === "credito" ? "Ponto forte" : o.area)}</span><span>${esc(o.fato)}</span></li>`
            )
            .join("")}</ul>`
        : `<div class="status-linha">Analise o site ou preencha a conferência para aparecerem os pontos.</div>`
    }
    <div class="acoes-bloco">
      <button class="btn" id="rl-regras">Rascunho sem IA</button>
      <button class="btn prim" id="rl-ia" ${d.ia ? "" : "disabled title='Coloque a chave da Anthropic em Ajustes → IA'"}>${ico("robo")} Escrever com IA</button>
    </div>
    ${d.ia ? "" : `<p class="dica" style="text-align:right">Para a IA escrever, coloque a chave da Anthropic em <a href="#/ajustes" data-ir="aj-ia">Ajustes → IA</a>.</p>`}`;
  $("#rl-regras").onclick = () => redigirRel("regras");
  $("#rl-ia").onclick = () => redigirRel("ia");
}

async function redigirRel(modo) {
  const c = E.rel.c;
  const temTexto = String(c.abertura || "").trim() || (c.apontamentos || []).some((a) => String(a.titulo || "").trim());
  if (temTexto && !(await confirmar("Escrever de novo?", "A abertura, os números, os canais e os apontamentos atuais serão substituídos pelo novo rascunho. Os textos fixos (ponto de partida, destaque e convite) ficam.", "Escrever de novo"))) return;
  const b = $(modo === "ia" ? "#rl-ia" : "#rl-regras");
  const rotulo = b.innerHTML;
  b.disabled = true;
  b.innerHTML = `<span class="giro mini"></span> ${modo === "ia" ? "Escrevendo…" : "Montando…"}`;
  try {
    await salvarManualAgora();
    await salvarRelPendente();
    const r = await api(`relatorio/${E.rel.negId}/redigir`, { method: "POST", body: { modo }, timeout: 100000 });
    E.rel.c = r.conteudo;
    E.rel.d.relatorio.status = r.status;
    desenharTextoRel();
    atualizarPrevia(true);
    atualizarStatusRel(r.status);
    aviso(modo === "ia" ? "Rascunho escrito. Revise antes de aprovar." : "Rascunho montado. Revise antes de aprovar.");
    $("#rl-texto")?.scrollIntoView({ behavior: "smooth", block: "start" });
  } catch (e) {
    aviso(e.message, true);
  }
  b.disabled = modo === "ia" && !E.rel.d.ia;
  b.innerHTML = rotulo;
}

// ---------- texto do relatório
function campoRel(caminho, rotulo, { area = false, linhas = 3, dica = "", attrs = "" } = {}) {
  const v = lerCaminho(E.rel.c, caminho) ?? "";
  const id = `rlc-${caminho.replace(/\./g, "-")}`;
  return `<div class="campo"><label for="${id}">${rotulo}</label>${
    area
      ? `<textarea id="${id}" class="entrada" rows="${linhas}" data-c="${caminho}" ${attrs}>${esc(v)}</textarea>`
      : `<input id="${id}" class="entrada" data-c="${caminho}" value="${esc(v)}" ${attrs}>`
  }${dica ? `<p class="dica">${dica}</p>` : ""}</div>`;
}

function desenharTextoRel() {
  const el = $("#rl-texto");
  if (!el) return;
  const c = E.rel.c;
  const corSite = E.rel.d.relatorio.coleta.site?.cor_marca;
  el.innerHTML = `<h2><span class="rl-n">3</span> Texto do relatório</h2>
    <p>Tudo aqui é editável e é salvo enquanto você escreve. Bloco vazio não aparece. Use **assim** para negrito.</p>
    <div class="grade-2">
      ${campoRel("empresa", "Nome da empresa")}
      <div class="campo"><label for="rlc-cor">Cor de destaque</label><div class="linha">
        <input id="rlc-cor" type="color" class="cor" data-c="cor" value="${esc(c.cor || "#e23917")}">
        <button type="button" class="btn peq" data-cor="#e23917">Tangit</button>
        ${corSite ? `<button type="button" class="btn peq" data-cor="${esc(corSite)}"><span class="bola" style="background:${esc(corSite)}"></span>Cor do site</button>` : ""}
      </div></div>
    </div>
    ${campoRel("abertura", "Abertura", { area: true, linhas: 5 })}
    <h3 class="sub">Números em destaque</h3>
    <div id="rl-numeros"></div>
    <h3 class="sub">O ponto de partida</h3>
    ${campoRel("tese", "Frase", { area: true, linhas: 2 })}
    ${campoRel("tese_nota", "Complemento", { area: true, linhas: 3 })}
    <h3 class="sub">O que a marca diz em cada canal</h3>
    <div id="rl-canais"></div>
    ${campoRel("canais_leitura", "Leitura das frases", { area: true, linhas: 2 })}
    <h3 class="sub">Apontamentos</h3>
    <div id="rl-aps"></div>
    <h3 class="sub">Para onde isso aponta</h3>
    ${campoRel("fecho", "Fecho", { area: true, linhas: 5 })}
    ${campoRel("destaque", "Destaque (caixa colorida)", { area: true, linhas: 3 })}
    <h3 class="sub">Convite</h3>
    <div class="grade-2">${campoRel("cta.titulo", "Título")}${campoRel("cta.botao", "Botão")}</div>
    ${campoRel("cta.texto", "Texto", { area: true, linhas: 2 })}
    <div class="grade-2">${campoRel("cta.whatsapp", "WhatsApp do botão", { attrs: 'inputmode="tel"' })}${campoRel("cta.mensagem", "Mensagem que abre no WhatsApp")}</div>
    <h3 class="sub">Rodapé</h3>
    <div class="campo"><label for="rlc-fontes">Fontes consultadas</label><input id="rlc-fontes" class="entrada" data-fontes="1" value="${esc((c.fontes || []).join(", "))}"><p class="dica">Separadas por vírgula. Aparecem no rodapé: “Leitura preliminar, feita em … a partir de …”.</p></div>`;
  desenharListasRel();
  el.oninput = (ev) => {
    const t = ev.target;
    if (t.dataset.c) gravarCaminho(E.rel.c, t.dataset.c, t.value);
    else if (t.dataset.fontes) E.rel.c.fontes = t.value.split(",").map((x) => x.trim()).filter(Boolean);
    else if (t.dataset.lista) {
      const lista = (E.rel.c[t.dataset.lista] ||= []);
      (lista[Number(t.dataset.i)] ||= {})[t.dataset.campo] = t.value;
    } else return;
    mudouRel();
  };
  el.onclick = (ev) => {
    const cor = ev.target.closest("[data-cor]");
    if (cor) {
      E.rel.c.cor = cor.dataset.cor;
      $("#rlc-cor").value = cor.dataset.cor;
      return mudouRel();
    }
    const b = ev.target.closest("[data-acao-lista]");
    if (!b) return;
    const nome = b.dataset.lista;
    const lista = (E.rel.c[nome] ||= []);
    const i = Number(b.dataset.i);
    const acao = b.dataset.acaoLista;
    if (acao === "add") lista.push(nome === "numeros" ? { valor: "", rotulo: "" } : nome === "canais" ? { frase: "", canal: "" } : { area: "", titulo: "", apoio: "" });
    if (acao === "sugestao") lista.push({ valor: b.dataset.valor, rotulo: b.dataset.rotulo });
    if (acao === "del") lista.splice(i, 1);
    if (acao === "sobe" && i > 0) [lista[i - 1], lista[i]] = [lista[i], lista[i - 1]];
    if (acao === "desce" && i < lista.length - 1) [lista[i + 1], lista[i]] = [lista[i], lista[i + 1]];
    desenharListasRel();
    mudouRel();
  };
}

function desenharListasRel() {
  const c = E.rel.c;
  const btn = (lista, i, acao, rot, titulo) => `<button type="button" class="btn peq fant ico-btn" data-acao-lista="${acao}" data-lista="${lista}" data-i="${i}" title="${titulo}" aria-label="${titulo}">${rot}</button>`;
  const inp = (lista, i, campo, v, ph, extra = "") => `<input class="entrada" data-lista="${lista}" data-i="${i}" data-campo="${campo}" value="${esc(v || "")}" placeholder="${esc(ph)}" ${extra}>`;
  const nums = c.numeros || [];
  const usados = new Set(nums.map((n) => `${n.valor}|${n.rotulo}`));
  const sugest = (E.rel.d.numeros_sugeridos || []).filter((s) => !usados.has(`${s.valor}|${s.rotulo}`));
  $("#rl-numeros").innerHTML = `${nums
    .map((n, i) => `<div class="rl-linha-num">${inp("numeros", i, "valor", n.valor, "23", 'style="width:96px"')}${inp("numeros", i, "rotulo", n.rotulo, "anos de operação")}${btn("numeros", i, "del", "✕", "Remover")}</div>`)
    .join("")}
    <div class="linha rl-add">${nums.length < 4 ? `<button type="button" class="btn peq" data-acao-lista="add" data-lista="numeros">${ico("mais")} Número</button>` : ""}${
      nums.length < 4 ? sugest.map((s) => `<button type="button" class="pilula" data-acao-lista="sugestao" data-lista="numeros" data-valor="${esc(s.valor)}" data-rotulo="${esc(s.rotulo)}">+ ${esc(s.valor)} ${esc(s.rotulo)}</button>`).join("") : ""
    }</div>`;
  const canais = c.canais || [];
  $("#rl-canais").innerHTML = `${canais
    .map((x, i) => `<div class="rl-linha-canal">${inp("canais", i, "frase", x.frase, "Os pneus mais baratos de SP")}${inp("canais", i, "canal", x.canal, "Instagram", 'style="width:150px"')}${btn("canais", i, "del", "✕", "Remover")}</div>`)
    .join("")}
    <div class="linha rl-add"><button type="button" class="btn peq" data-acao-lista="add" data-lista="canais">${ico("mais")} Canal</button>${
      canais.length ? "" : `<span class="dica">Sem frases, a seção não aparece. Com 2 ou mais, mostra como a marca se apresenta em cada lugar.</span>`
    }</div>`;
  const aps = c.apontamentos || [];
  $("#rl-aps").innerHTML = `${aps
    .map(
      (a, i) => `<div class="rl-ap">
        <div class="rl-ap-cab"><span class="rl-n peq">${String(i + 1).padStart(2, "0")}</span>
          <input class="entrada rl-area" list="rl-areas" data-lista="apontamentos" data-i="${i}" data-campo="area" value="${esc(a.area || "")}" placeholder="Área">
          <span class="rl-ap-acoes">${btn("apontamentos", i, "sobe", "↑", "Subir")}${btn("apontamentos", i, "desce", "↓", "Descer")}${btn("apontamentos", i, "del", "✕", "Remover")}</span></div>
        <textarea class="entrada rl-ap-tit" rows="2" data-lista="apontamentos" data-i="${i}" data-campo="titulo" placeholder="O achado e a consequência, numa linha">${esc(a.titulo || "")}</textarea>
        <textarea class="entrada" rows="2" data-lista="apontamentos" data-i="${i}" data-campo="apoio" placeholder="A evidência: números, nomes, o que foi visto">${esc(a.apoio || "")}</textarea>
      </div>`
    )
    .join("")}
    <datalist id="rl-areas">${AREAS_REL.map((a) => `<option value="${a}">`).join("")}</datalist>
    <div class="linha rl-add">${aps.length < 6 ? `<button type="button" class="btn peq" data-acao-lista="add" data-lista="apontamentos">${ico("mais")} Apontamento</button>` : ""}</div>`;
}

// ---------- prévia, gravação e publicação
const htmlPrevia = () => {
  const r = E.rel.d.relatorio;
  const faixa = !r.link
    ? "Prévia — o cliente só vê esta página depois que você aprovar"
    : r.status === "aprovado"
      ? "Prévia — esta é a versão publicada"
      : "Prévia — as mudanças só chegam ao cliente quando você publicar";
  return paginaRelatorio(E.rel.c, { previa: faixa });
};

function atualizarPrevia(agora = false) {
  clearTimeout(E.rel.timers.previa);
  const fazer = () => {
    const f = $("#rl-iframe");
    if (!f || getComputedStyle(f.closest(".rl-previa")).display === "none") return;
    const rolagem = f.contentWindow?.scrollY || 0;
    f.srcdoc = htmlPrevia();
    f.onload = () => rolagem && f.contentWindow?.scrollTo(0, rolagem);
  };
  if (agora) fazer();
  else E.rel.timers.previa = setTimeout(fazer, 350);
}

function mudouRel() {
  E.rel.pendente = true;
  $("#rl-salvo") && ($("#rl-salvo").textContent = "Editando…");
  atualizarPrevia();
  clearTimeout(E.rel.timers.salvar);
  E.rel.timers.salvar = setTimeout(salvarRelPendente, 1000);
}

async function salvarRelPendente() {
  clearTimeout(E.rel?.timers?.salvar);
  if (!E.rel?.pendente) return E.rel?.salvando;
  E.rel.pendente = false;
  const negId = E.rel.negId;
  E.rel.salvando = api(`relatorio/${negId}/conteudo`, { method: "PUT", body: { conteudo: E.rel.c }, silencioso: true })
    .then((r) => {
      if (E.rel?.negId !== negId) return;
      E.rel.d.relatorio.status = r.status;
      atualizarStatusRel(r.status);
      $("#rl-salvo") && ($("#rl-salvo").textContent = "Salvo");
    })
    .catch((e) => {
      if (E.rel?.negId === negId) E.rel.pendente = true;
      aviso(`Não salvou o texto: ${e.message}`, true);
    });
  return E.rel.salvando;
}

function atualizarStatusRel(st) {
  const el = $("#rl-status");
  const mudouFaixa = E.rel.ultimoStatus && E.rel.ultimoStatus !== st;
  E.rel.ultimoStatus = st;
  if (el) el.innerHTML = seloRelatorio(st);
  desenharPublicacao();
  if (mudouFaixa) atualizarPrevia();
}

function desenharPublicacao() {
  const el = $("#rl-publicacao");
  if (!el) return;
  const r = E.rel.d.relatorio;
  const ab = $("#rl-abrir-link");
  if (ab) {
    ab.hidden = !r.link;
    ab.href = linkInterno(r.link);
  }
  const btn = $("#rl-aprovar");
  if (btn) btn.innerHTML = `${ico("aprovar")} ${r.publicado && r.link ? (r.status === "alterado" ? "Publicar mudanças" : "Aprovado") : "Aprovar e publicar"}`;
  if (btn) btn.disabled = r.status === "aprovado" && !!r.link;
  if (!r.link) return (el.innerHTML = "");
  const vistas = r.visualizacoes || 0;
  el.innerHTML = `<section class="bloco rl-pub">
    <div class="linha" style="flex-wrap:wrap">
      <strong>${r.status === "alterado" ? "Publicado — há mudanças ainda não publicadas" : "Publicado"}</strong>
      <span class="dica">${r.enviado_em ? `Enviado ${esc(quando(r.enviado_em))}` : "Ainda não enviado"} · ${vistas ? `aberto ${plural(vistas, "vez", "vezes")}${r.ultima_visualizacao_em ? `, a última ${esc(quando(r.ultima_visualizacao_em))}` : ""}` : "ainda não aberto pelo cliente"}</span>
    </div>
    <div class="linha rl-link"><code>${esc(r.link)}</code>
      <button class="btn peq" id="rl-copiar">${ico("copiar")} Copiar</button>
      <a class="btn peq" href="${esc(linkInterno(r.link))}" target="_blank" rel="noopener">Abrir ↗</a>
      <button class="btn peq fant perigo" id="rl-despublicar">Tirar do ar</button>
    </div>
    <p class="dica">Para enviar: use <code>{relatorio}</code> na mensagem (Ajustes → Mensagens) ou “Pôr o link na mensagem”, na ficha. Sozinho na última linha, o link sai com o cartão de prévia no WhatsApp.</p>
  </section>`;
  $("#rl-copiar").onclick = () => copiar(r.link, "Link copiado");
  $("#rl-despublicar").onclick = async () => {
    if (!(await confirmar("Tirar do ar", "O link para de funcionar para o cliente. Dá para aprovar de novo depois (o endereço continua o mesmo).", "Tirar do ar", true))) return;
    try {
      await api(`relatorio/${E.rel.negId}/despublicar`, { method: "POST" });
      E.rel.d = await api(`relatorio/${E.rel.negId}`);
      atualizarStatusRel(E.rel.d.relatorio.status);
      aviso("Pré-relatório tirado do ar");
    } catch (e) {
      aviso(e.message, true);
    }
  };
}

async function aprovarRelatorio() {
  const c = E.rel.c;
  if (!String(c.empresa || "").trim()) return aviso("Falta o nome da empresa", true);
  if (!String(c.abertura || "").trim() && !(c.apontamentos || []).some((a) => String(a.titulo || "").trim())) return aviso("Escreva a abertura e os apontamentos antes de aprovar", true);
  const novo = !E.rel.d.relatorio.link;
  const ok = await confirmar(
    novo ? "Aprovar e publicar" : "Publicar as mudanças",
    novo
      ? "A página fica no ar no endereço tangit.com.br/…-relatorio-…, mas só chega ao cliente quando você enviar o link (pela mensagem do primeiro contato ou pela ficha)."
      : "A página publicada passa a mostrar a versão atual. O link continua o mesmo.",
    novo ? "Aprovar e publicar" : "Publicar"
  );
  if (!ok) return;
  const b = $("#rl-aprovar");
  b.disabled = true;
  try {
    await salvarManualAgora();
    E.rel.pendente = false;
    clearTimeout(E.rel.timers.salvar);
    const r = await api(`relatorio/${E.rel.negId}/aprovar`, { method: "POST", body: { conteudo: E.rel.c } });
    E.rel.d = await api(`relatorio/${E.rel.negId}`);
    E.rel.c = JSON.parse(JSON.stringify(E.rel.d.relatorio.conteudo));
    atualizarStatusRel(E.rel.d.relatorio.status);
    $("#rl-salvo").textContent = "";
    checarNovidades(true);
    aviso(novo ? "Publicado. O link entra no lugar de {relatorio} nas mensagens." : "Mudanças publicadas");
    atualizarPrevia(true);
    $("#rl-publicacao")?.scrollIntoView({ behavior: "smooth", block: "start" });
  } catch (e) {
    aviso(e.message, true);
    b.disabled = false;
  }
}

// abre o editor (da fila de aprovação ou da ficha)
function abrirEditorRelatorio(negId, voltarPara) {
  E.rel = { negId: Number(negId), d: null, c: null, timers: {}, pendente: false, salvando: null, voltarPara, veioDe: true };
  fecharGaveta();
  location.hash = `#/relatorio/${negId}`;
}

// ============================================================ início
(async function iniciar() {
  await carregarResumo();
  renderizar();
  checarNovidades(true);
})();
