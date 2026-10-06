/* Prospecção — interface (HTML/JS puro, sem dependências).
   Dados: Minha Receita (via /api/receita), cidades e CNAEs do IBGE (via /api/ibge),
   listas e funil no D1 da Cloudflare (via /api/data). */

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

const MINUSC = new Set(["de", "da", "do", "das", "dos", "e", "em", "na", "no", "nas", "nos", "para", "com", "a", "o", "ao"]);
const MAIUSC = new Set(["ltda", "me", "epp", "eireli", "s/a", "sa", "s.a", "s.a.", "cia", "mei", "ii", "iii", "iv", "slu", "ss", "lp", "tv", "sp", "rj", "mg", "pr", "sc", "rs", "ti"]);
function titulo(s) {
  if (!s) return "";
  return String(s)
    .toLowerCase()
    .split(/(\s+|-|\/)/)
    .map((p, i) => {
      const limpo = p.replace(/[.,()]/g, "");
      if (MAIUSC.has(limpo)) return p.toUpperCase();
      if (i > 0 && MINUSC.has(limpo)) return p;
      return p.charAt(0).toUpperCase() + p.slice(1);
    })
    .join("");
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
const nomeDe = (r) => titulo((r.nome_fantasia || "").trim() || r.razao_social || "Sem nome");
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
  return [...new Set(brutos)].map((d) => ({
    digitos: d,
    celular: d.length === 11 && d[2] === "9",
    exib: d.length === 11 ? `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}` : `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`,
  }));
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
  gaveta: null,
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
  if (resp.status === 401) {
    const ok = await pedirChave();
    if (ok) return api(caminho, opcoes);
    throw new Error("Acesso negado.");
  }
  const dados = await resp.json().catch(() => null);
  if (!resp.ok) throw new Error(dados?.erro || `Erro ${resp.status}`);
  return dados;
}

async function carregarResumo() {
  try {
    E.resumo = await api("data/resumo");
  } catch (e) {
    aviso(e.message, true);
  }
}

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
  $$(".nav a").forEach((a) => a.classList.toggle("ativo", a.dataset.rota === pag));
  limparSelecao(false);
  const main = $("#conteudo");
  if (pag === "listas") {
    E.ctx = "lista";
    await telaListas(main, id ? Number(id) : null);
  } else if (pag === "funil") {
    E.ctx = "funil";
    await telaFunil(main);
  } else if (pag === "ajustes") {
    E.ctx = "ajustes";
    telaAjustes(main);
  } else {
    E.ctx = "busca";
    telaBusca(main);
  }
  atualizarBarraSelecao();
}
window.addEventListener("hashchange", renderizar);

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
  const csv = [cab, ...linhas]
    .map((l) => l.map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`).join(";"))
    .join("\r\n");
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `${nomeArquivo}-${hojeISO()}.csv`;
  document.body.append(a);
  a.click();
  setTimeout(() => {
    URL.revokeObjectURL(a.href);
    a.remove();
  }, 1000);
  aviso(`${plural(registros.length, "empresa exportada", "empresas exportadas")}`);
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
async function telaFunil(main) {
  main.innerHTML = `
    <div class="topo"><h1>Funil</h1>
      <input class="entrada" id="funil-filtro" placeholder="Filtrar empresas" style="width:200px;height:34px" value="${esc(E.funil.filtro)}">
      <button class="btn" id="funil-cnpj">${ico("mais")} Por CNPJ</button>
      <button class="btn ico-btn" id="funil-exp" title="Exportar funil (CSV)" aria-label="Exportar funil">${ico("baixar")}</button>
    </div>
    <div class="quadro" id="quadro"><div class="carregando"><span class="giro"></span> Carregando…</div></div>`;
  $("#funil-filtro").oninput = (ev) => {
    E.funil.filtro = ev.target.value;
    desenharQuadro();
  };
  $("#funil-cnpj").onclick = adicionarPorCNPJ;
  $("#funil-exp").onclick = () => {
    const et = (id) => E.resumo.etapas.find((e) => e.id === id)?.nome || "";
    if (!E.funil.negocios.length) return aviso("O funil está vazio", true);
    exportarCSV(
      E.funil.negocios.map((n) => ({ ...n.empresa, cnpj: digitos(n.empresa.cnpj), _neg: n })),
      "funil",
      {
        cabecalho: ["Etapa", "Valor", "Próximo contato", "Origem", "Motivo da perda", "Entrou no funil"],
        valores: ({ _neg: n }) => [et(n.etapa_id), n.valor ?? "", fmtData(n.proximo_contato), n.origem || "", n.motivo_perda || "", fmtData(n.criado_em)],
      }
    );
  };
  await carregarResumo();
  await carregarFunil();
}

async function carregarFunil() {
  try {
    E.funil.negocios = await api("data/negocios");
  } catch (e) {
    aviso(e.message, true);
    E.funil.negocios = [];
  }
  desenharQuadro();
}

function desenharQuadro() {
  const q = $("#quadro");
  if (!q) return;
  const filtro = norm(E.funil.filtro);
  const negs = E.funil.negocios.filter(
    (n) => !filtro || norm(`${n.empresa.razao_social} ${n.empresa.nome_fantasia} ${n.empresa.municipio}`).includes(filtro)
  );
  const hoje = hojeISO();
  if (!E.funil.negocios.length) {
    q.innerHTML = `<div class="vazio" style="margin:auto">${ico("funil")}<h3>Funil vazio</h3>
      <p>Envie empresas para cá a partir da busca, de uma lista ou da ficha da empresa — ou adicione direto pelo CNPJ.</p></div>`;
    return;
  }
  q.innerHTML = E.resumo.etapas
    .map((et) => {
      const cards = negs.filter((n) => n.etapa_id === et.id);
      const soma = cards.reduce((s, n) => s + (Number(n.valor) || 0), 0);
      return `<section class="coluna" data-etapa="${et.id}">
        <div class="coluna-topo">
          <div class="t"><span class="bola" style="background:${esc(et.cor)}"></span>${esc(et.nome)}<span class="q num">${cards.length}</span></div>
          ${soma ? `<div class="soma num">${fmtMoedaCurta(soma)}</div>` : ""}
        </div>
        <div class="coluna-cards">${
          cards.length
            ? cards
                .map((n) => {
                  const r = n.empresa;
                  const pc = n.proximo_contato;
                  const pcClasse = pc ? (pc < hoje ? "perigo" : pc === hoje ? "aviso" : "") : "";
                  return `<article class="card-n" data-id="${n.id}">
                    <span class="alca" title="Arrastar">${ico("alca")}</span>
                    <div style="min-width:0">
                      <div class="nome">${esc(nomeDe(r))}</div>
                      <div class="sub">${esc(titulo(r.municipio))} - ${esc(r.uf)}</div>
                      <div class="meta">
                        ${pc ? `<span class="selo ${pcClasse}">${pc < hoje ? "Atrasado · " : pc === hoje ? "Hoje · " : ""}${fmtData(pc).slice(0, 5)}</span>` : ""}
                        ${n.valor ? `<span class="selo num">${fmtMoedaCurta(n.valor)}</span>` : ""}
                        ${n.total_atividades ? `<span class="selo num" title="Registros de contato">${ico("nota")}${n.total_atividades}</span>` : ""}
                      </div>
                      ${n.ultima_atividade ? `<div class="ultima">${esc(n.ultima_atividade)}</div>` : ""}
                    </div>
                  </article>`;
                })
                .join("")
            : `<div class="coluna-vazia">Arraste empresas para cá</div>`
        }</div>
      </section>`;
    })
    .join("");

  q.onclick = (ev) => {
    if (ev.target.closest(".alca")) return;
    const c = ev.target.closest(".card-n");
    if (!c) return;
    const n = E.funil.negocios.find((x) => x.id === Number(c.dataset.id));
    if (n) abrirEmpresa({ ...n.empresa, cnpj: digitos(n.empresa.cnpj) });
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
    await Promise.all([carregarResumo(), carregarFunil()]);
    if (etapa?.tipo === "ganho") aviso("Venda marcada como ganha 🎉");
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

// ============================================================ GAVETA (ficha da empresa)
async function abrirEmpresa(registro) {
  E.gaveta = { r: registro, info: null, atividades: null };
  $("#gaveta-fundo").hidden = false;
  const g = $("#gaveta");
  g.classList.add("aberta");
  g.setAttribute("aria-hidden", "false");
  desenharGaveta();
  await carregarInfoGaveta();
}

async function carregarInfoGaveta() {
  const G = E.gaveta;
  if (!G) return;
  try {
    G.info = await api(`data/empresas/${G.r.cnpj}`);
    if (G.info.negocio) G.atividades = await api(`data/negocios/${G.info.negocio.id}/atividades`);
    else G.atividades = null;
  } catch (e) {
    aviso(e.message, true);
  }
  if (E.gaveta === G) desenharGaveta();
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

function desenharGaveta() {
  const G = E.gaveta;
  if (!G) return;
  const r = G.r;
  const g = $("#gaveta");
  const rolagem = $(".gaveta-corpo", g)?.scrollTop || 0;
  const p = porteDe(r);
  const tels = telefonesDe(r);
  const email = emailDe(r);
  const end = enderecoDe(r);
  const ano = anoAbertura(r);
  const anos = ano ? new Date().getFullYear() - ano : null;
  const neg = G.info?.negocio;
  const listasDaEmpresa = (G.info?.listas || []).map((id) => E.resumo.listas.find((l) => l.id === id)).filter(Boolean);
  const etapa = neg && E.resumo.etapas.find((e) => e.id === neg.etapa_id);

  g.innerHTML = `
    <div class="gaveta-topo">
      <div class="linha-1">
        <h2>${esc(nomeDe(r))}</h2>
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
        <a class="contato whats" id="c-whats" href="${tels[0] ? `https://wa.me/55${tels[0].digitos}` : "#"}" target="_blank" rel="noopener" aria-disabled="${!tels.length}">${ico("whats")}WhatsApp</a>
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

      ${neg ? htmlNegocio(neg, etapa, G.atividades) : ""}

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
      <p class="dica" style="margin-top:10px">Telefone e e-mail são os declarados à Receita e podem estar desatualizados. “Ver no Maps” mostra o perfil público da empresa.</p>
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

  $(".gaveta-corpo", g).scrollTop = rolagem;
  $("#g-fechar").onclick = fecharGaveta;

  // contatos com escolha de número/modelo
  const modelos = E.resumo.modelos || [];
  $("#c-whats").onclick = (ev) => {
    if (!tels.length) return;
    if (tels.length < 2 && !modelos.length) return;
    ev.preventDefault();
    const itens = [];
    for (const t of tels) {
      itens.push(`<a data-v="x" href="https://wa.me/55${t.digitos}" target="_blank" rel="noopener">${t.exib}${t.celular ? "" : " <small>fixo — pode não ter WhatsApp</small>"}</a>`);
      for (const m of modelos) {
        itens.push(`<a data-v="x" href="https://wa.me/55${t.digitos}?text=${encodeURIComponent(preencherModelo(m.texto, r))}" target="_blank" rel="noopener">&nbsp;&nbsp;↳ ${esc(m.titulo)}<small>${esc(preencherModelo(m.texto, r))}</small></a>`);
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
        modelos
          .map((m) => `<a data-v="x" href="mailto:${esc(email)}?body=${encodeURIComponent(preencherModelo(m.texto, r))}">${esc(m.titulo)}</a>`)
          .join("")
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
          if (!(await confirmar("Tirar do funil", "As anotações deste negócio serão apagadas.", "Tirar", true))) return;
          await api(`data/negocios/${neg.id}`, { method: "DELETE" });
          await carregarResumo();
          if (E.ctx === "funil") await carregarFunil();
          await carregarInfoGaveta();
          redesenharAtual();
        }
      }
    );

  if (neg) ligarNegocio(neg);
}

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
      await carregarResumo();
      if (E.ctx === "funil") await carregarFunil();
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
      if (E.ctx === "funil") await carregarFunil();
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
        if (E.ctx === "funil") await carregarFunil();
        await carregarInfoGaveta();
      })
  );
}

async function atualizarDaReceita() {
  const G = E.gaveta;
  if (!G) return;
  try {
    const novo = await api(`receita/cnpj/${G.r.cnpj}`);
    novo.cnpj = digitos(novo.cnpj);
    G.r = novo;
    if (G.info?.empresa || G.info?.negocio || G.info?.listas?.length) {
      await api(`data/empresas/${novo.cnpj}`, { method: "PUT", body: { empresa: novo } });
    }
    aviso("Dados atualizados");
    desenharGaveta();
    if (E.ctx === "funil") carregarFunil();
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

// ============================================================ tela: AJUSTES
function telaAjustes(main) {
  main.innerHTML = `
    <div class="topo"><h1>Ajustes</h1></div>
    <div class="pagina"><div class="ajustes">
      <section class="bloco">
        <h2>Etapas do funil</h2>
        <p>Renomeie, troque a ordem e defina quais etapas contam como venda ganha ou perdida.</p>
        <div id="etapas"></div>
        <div class="linha" style="margin-top:12px">
          <button class="btn" id="etapa-nova">${ico("mais")} Nova etapa</button>
          <button class="btn prim" id="etapas-salvar" style="margin-left:auto">Salvar etapas</button>
        </div>
      </section>
      <section class="bloco">
        <h2>Modelos de mensagem</h2>
        <p>Aparecem ao tocar em WhatsApp ou E-mail na ficha. Use {empresa}, {razao_social}, {cidade}, {segmento} e {socio} para preencher automaticamente.</p>
        <div id="modelos"></div>
        <button class="btn" id="modelo-novo">${ico("mais")} Novo modelo</button>
      </section>
      <section class="bloco">
        <h2>Cópia de segurança</h2>
        <p>Baixa listas, funil, anotações e modelos em um arquivo JSON.</p>
        <button class="btn" id="backup">${ico("baixar")} Baixar cópia</button>
      </section>
      <section class="bloco">
        <h2>Acesso neste aparelho</h2>
        <p>Se o projeto usa chave de acesso, ela fica salva neste navegador.</p>
        <button class="btn" id="sair">Esquecer chave neste aparelho</button>
      </section>
    </div></div>`;

  let etapas = E.resumo.etapas.map((e) => ({ ...e }));
  const desenharEtapas = () => {
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
          <div class="linha">
            <button class="btn ico-btn peq" data-m="-1" ${i === 0 ? "disabled" : ""} aria-label="Subir">↑</button>
            <button class="btn ico-btn peq" data-m="1" ${i === etapas.length - 1 ? "disabled" : ""} aria-label="Descer">↓</button>
            <button class="btn ico-btn peq perigo" data-x="1" aria-label="Remover">×</button>
          </div>
        </div>`
      )
      .join("");
  };
  desenharEtapas();
  $("#etapas").oninput = (ev) => {
    const linha = ev.target.closest(".etapa-linha");
    const c = ev.target.dataset.c;
    if (linha && c) etapas[Number(linha.dataset.i)][c] = ev.target.value;
  };
  $("#etapas").onclick = (ev) => {
    const linha = ev.target.closest(".etapa-linha");
    if (!linha) return;
    const i = Number(linha.dataset.i);
    const m = ev.target.closest("[data-m]");
    if (m) {
      const j = i + Number(m.dataset.m);
      [etapas[i], etapas[j]] = [etapas[j], etapas[i]];
      desenharEtapas();
    }
    if (ev.target.closest("[data-x]")) {
      if (etapas.length === 1) return aviso("O funil precisa de ao menos uma etapa", true);
      etapas.splice(i, 1);
      desenharEtapas();
    }
  };
  $("#etapa-nova").onclick = () => {
    const ultimaAberta = etapas.map((e) => e.tipo).lastIndexOf("aberta");
    etapas.splice(ultimaAberta + 1, 0, { nome: "Nova etapa", cor: corAleatoria(), tipo: "aberta" });
    desenharEtapas();
  };
  $("#etapas-salvar").onclick = async () => {
    try {
      E.resumo.etapas = await api("data/etapas", { method: "PUT", body: { etapas } });
      etapas = E.resumo.etapas.map((e) => ({ ...e }));
      desenharEtapas();
      aviso("Etapas salvas");
    } catch (e) {
      aviso(e.message, true);
    }
  };

  const desenharModelos = () => {
    const ms = E.resumo.modelos || [];
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
  desenharModelos();
  const editarModelo = async (m) => {
    const r = await abrirModal({
      titulo: m ? "Editar modelo" : "Novo modelo",
      corpo: `<div class="campo"><label for="m-t">Título</label><input id="m-t" class="entrada" value="${esc(m?.titulo || "")}" maxlength="80"></div>
        <div class="campo"><label for="m-x">Mensagem</label><textarea id="m-x" class="entrada" rows="5" placeholder="Olá, tudo bem? Aqui é…">${esc(m?.texto || "")}</textarea></div>`,
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
      desenharModelos();
    } catch (e) {
      aviso(e.message, true);
    }
  };
  $("#modelo-novo").onclick = () => editarModelo(null);
  $("#modelos").onclick = async (ev) => {
    const ed = ev.target.closest("[data-ed]");
    const del = ev.target.closest("[data-del]");
    if (ed) editarModelo(E.resumo.modelos.find((m) => m.id === Number(ed.dataset.ed)));
    if (del) {
      if (!(await confirmar("Apagar modelo", "Apagar este modelo de mensagem?", "Apagar", true))) return;
      await api(`data/modelos/${del.dataset.del}`, { method: "DELETE" });
      await carregarResumo();
      desenharModelos();
    }
  };

  $("#backup").onclick = async () => {
    try {
      const dados = await api("data/backup");
      const blob = new Blob([JSON.stringify(dados, null, 2)], { type: "application/json" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `prospeccao-backup-${hojeISO()}.json`;
      document.body.append(a);
      a.click();
      setTimeout(() => {
        URL.revokeObjectURL(a.href);
        a.remove();
      }, 1000);
    } catch (e) {
      aviso(e.message, true);
    }
  };
  $("#sair").onclick = () => {
    try {
      localStorage.removeItem("prosp.chave");
    } catch {}
    aviso("Chave removida deste aparelho");
  };
}

// ============================================================ início
(async function iniciar() {
  await carregarResumo();
  renderizar();
})();
