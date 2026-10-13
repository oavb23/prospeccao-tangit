// Página do pré-relatório (o que o cliente vê em tangit.com.br/<cliente>-relatorio-<dígitos>).
// Este arquivo é usado pelo servidor (página publicada) e pelo navegador (prévia no editor): o desenho é um só.

export const TANGIT = {
  tinta: "#1b202c",
  creme: "#fdfdf7",
  laranja: "#e23917",
  base: "https://tangit.com.br",
};

const LOGO_PATHS = `<path d="M373.71,3.5v89.35c0,2-1.62,3.61-3.61,3.61h0c-1.46,0-2.77-.88-3.33-2.22L328.26,2.15c-.54-1.3-1.82-2.15-3.23-2.15h-57.43c-1.93,0-3.5,1.57-3.5,3.5v104.61c0,1.93,1.57,3.5,3.5,3.5h8.14c1.93,0,3.5-1.57,3.5-3.5V18.76c0-2,1.62-3.61,3.61-3.61h0c1.46,0,2.77.88,3.33,2.22l38.48,92.09c.54,1.3,1.82,2.15,3.23,2.15h57.44c1.93,0,3.5-1.57,3.5-3.5V3.5c0-1.93-1.57-3.5-3.5-3.5h-8.14c-1.93,0-3.5,1.57-3.5,3.5h.02Z"/><rect x="556.15" y="0" width="44.43" height="111.61" rx="3.5" ry="3.5"/><path d="M133.29,3.5v6.77c0,1.93-1.57,3.5-3.5,3.5h-37.43c-1.93,0-3.5,1.57-3.5,3.5v90.83c0,1.93-1.57,3.5-3.5,3.5h-37.42c-1.93,0-3.5-1.57-3.5-3.5V17.27c0-1.93-1.57-3.5-3.5-3.5H3.5c-1.93,0-3.5-1.57-3.5-3.5V3.5C0,1.57,1.57,0,3.5,0h126.29c1.93,0,3.5,1.57,3.5,3.5h0Z"/><path d="M750.88,3.5v6.77c0,1.93-1.57,3.5-3.5,3.5h-37.43c-1.93,0-3.5,1.57-3.5,3.5v90.83c0,1.93-1.57,3.5-3.5,3.5h-37.42c-1.93,0-3.5-1.57-3.5-3.5V17.27c0-1.93-1.57-3.5-3.5-3.5h-37.43c-1.93,0-3.5-1.57-3.5-3.5V3.5c0-1.93,1.57-3.5,3.5-3.5h126.29c1.93,0,3.5,1.57,3.5,3.5h-.01Z"/><path d="M539.15,53.76v29.84c0,15.46-12.54,28-28,28h-77.29c-15.46,0-28-12.54-28-28V28c0-15.46,12.54-28,28-28h77.25c15.46,0,28,12.54,28,28v5.26c0,1.93-1.57,3.5-3.5,3.5h-37.39c-1.93,0-3.5-1.57-3.5-3.5v-7.9c0-7.7-6.3-14-14-14h-16.42c-7.73,0-14,6.27-14,14v60.91c0,7.73,6.27,14,14,14h16.42c7.73,0,14-6.27,14-14v-21.28c0-1.93-1.57-3.5-3.5-3.5h-15.21c-1.93,0-3.5-1.57-3.5-3.5v-4.21c0-2,1.62-3.63,3.63-3.63l59.39-.02c2,0,3.63,1.62,3.63,3.63h0Z"/><path d="M249.76,111.58l-40.65-.14c-1.39,0-2.66-.81-3.26-2.07l-31.19-74.64c-1.31-2.75-5.23-2.75-6.55,0l-30.88,74.65c-.6,1.25-1.86,2.06-3.25,2.06l-8.23.11c-2.68.02-4.45-2.78-3.3-5.19L167.11,2.06c.6-1.26,1.88-2.06,3.27-2.06h35.78c1.4,0,2.67.8,3.27,2.07l43.62,104.32c1.15,2.41-.61,5.2-3.29,5.19h0Z"/>`;
const logo = (classe = "") => `<svg class="logo ${classe}" viewBox="0 0 750.89 111.61" role="img" aria-label="Tangit" fill="currentColor">${LOGO_PATHS}</svg>`;

const ICONE_WHATS =
  '<svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor"><path d="M12.04 2a9.9 9.9 0 0 0-8.5 15l-1.4 5.1 5.2-1.4A9.9 9.9 0 1 0 12.04 2zm0 18.1c-1.5 0-3-.4-4.3-1.2l-.3-.2-3.1.8.8-3-.2-.3a8.2 8.2 0 1 1 7.1 3.9zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.4.1-.7.3a2.8 2.8 0 0 0-.9 2.1c0 1.2.9 2.4 1 2.6.1.2 1.8 2.7 4.3 3.8 1.6.7 2.2.7 3 .6.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.1-1.2l-.4-.2z"/></svg>';

const MESES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];

export const esc = (v) =>
  String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

// texto com parágrafos (linha em branco) e **negrito**
function prosa(texto, classe = "") {
  const blocos = String(texto || "")
    .split(/\n\s*\n/)
    .map((b) => b.trim())
    .filter(Boolean);
  return blocos
    .map((b) => `<p${classe ? ` class="${classe}"` : ""}>${esc(b).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>").replace(/\n/g, "<br>")}</p>`)
    .join("");
}
const linha = (texto) => esc(texto).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");

function mesAno(iso) {
  const d = iso ? new Date(String(iso).slice(0, 10) + "T12:00:00Z") : new Date();
  if (isNaN(d)) return "";
  return `${MESES[d.getUTCMonth()]} de ${d.getUTCFullYear()}`;
}
function dataBR(iso) {
  const s = String(iso || "").slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s.split("-").reverse().join("/") : "";
}

// cor de destaque: só aceita hexadecimal; texto sobre ela branco ou escuro, o que tiver mais contraste
function corValida(c) {
  const v = String(c || "").trim();
  return /^#[0-9a-f]{6}$/i.test(v) ? v : TANGIT.laranja;
}
function luminancia(hex) {
  const n = hex.slice(1).match(/../g).map((x) => parseInt(x, 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * n[0] + 0.7152 * n[1] + 0.0722 * n[2];
}
const contraste = (a, b) => {
  const [x, y] = [luminancia(a), luminancia(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};
function escurecer(hex, f) {
  return "#" + hex.slice(1).match(/../g).map((x) => Math.round(parseInt(x, 16) * (1 - f)).toString(16).padStart(2, "0")).join("");
}
// Tons da cor de destaque com leitura garantida (contraste 4,5:1): fundo com texto branco e texto sobre o creme.
export function tonsDaCor(cor) {
  let fundo = cor;
  let sobre = "#ffffff";
  for (let f = 0; contraste(fundo, "#ffffff") < 4.5 && f <= 0.3; f += 0.02) fundo = escurecer(cor, f);
  if (contraste(fundo, "#ffffff") < 4.5) [fundo, sobre] = [cor, TANGIT.tinta];
  let texto = cor;
  for (let f = 0; contraste(texto, TANGIT.creme) < 4.5 && f <= 0.5; f += 0.02) texto = escurecer(cor, f);
  return { fundo, sobre, texto };
}

function fontes(base, embutidas) {
  const f = embutidas || {};
  const src = (nome, arquivo) => (f[nome] ? `url(${f[nome]}) format("truetype")` : `url(${base}/assets/fonts/${arquivo}) format("truetype")`);
  return `@font-face{font-family:"Stack Sans Headline";src:${src("titulo", "StackSansHeadline-SemiBold.ttf")};font-weight:600;font-display:swap}
@font-face{font-family:"Inter Tight";src:${src("texto", "InterTight-VariableFont_wght.ttf")};font-weight:100 900;font-display:swap}`;
}

function css(cor, base, embutidas) {
  const t = tonsDaCor(cor);
  return `${fontes(base, embutidas)}
:root{--tinta:${TANGIT.tinta};--creme:${TANGIT.creme};--acento:${cor};--acento-fundo:${t.fundo};--sobre-acento:${t.sobre};--acento-texto:${t.texto};--cinza:#5f6470;--linha:#e4e2d9;--max:760px;
  --titulo:"Stack Sans Headline","Arial Narrow",system-ui,sans-serif;--texto:"Inter Tight",-apple-system,"Helvetica Neue",Arial,sans-serif}
*{box-sizing:border-box}
html{-webkit-text-size-adjust:100%}
body{margin:0;background:var(--creme);color:var(--tinta);font-family:var(--texto);font-size:17px;line-height:1.55;-webkit-font-smoothing:antialiased}
a{color:inherit}
.faixa-previa{position:sticky;top:0;z-index:5;background:#ffd72e;color:#1b202c;font:600 13px/1.3 var(--texto);text-align:center;padding:8px 16px}
.envolve{max-width:var(--max);margin:0 auto;padding:0 22px}
.escuro{background:var(--tinta);color:#fff}
.barra{display:flex;align-items:center;justify-content:space-between;padding:22px 0}
.logo{display:block;height:15px;width:auto}
.barra .tag{font:600 11px/1 var(--titulo);letter-spacing:.14em;text-transform:uppercase;color:rgba(255,255,255,.6)}
.capa{padding:64px 0 72px}
.olho{font:600 12px/1.2 var(--titulo);letter-spacing:.14em;text-transform:uppercase;color:var(--acento-texto);margin:0 0 18px}
.escuro .olho{color:var(--acento)}
h1{font-family:var(--titulo);font-weight:600;text-transform:uppercase;font-size:clamp(40px,11.5vw,84px);line-height:.94;letter-spacing:-.01em;margin:0;overflow-wrap:anywhere;hyphens:auto}
.capa .sub{font-size:19px;line-height:1.45;color:rgba(255,255,255,.78);margin:26px 0 0;max-width:34em}
.assina{display:flex;gap:10px;align-items:baseline;flex-wrap:wrap;margin-top:34px;padding-top:18px;border-top:1px solid rgba(255,255,255,.16);font-size:14px;color:rgba(255,255,255,.7)}
.assina strong{font:600 13px/1 var(--titulo);letter-spacing:.08em;text-transform:uppercase;color:#fff}
section{padding:56px 0}
section+section{border-top:1px solid var(--linha)}
.escuro+section,section.escuro{border-top:0}
.rotulo{display:flex;align-items:center;gap:10px;font:600 13px/1.2 var(--titulo);letter-spacing:.12em;text-transform:uppercase;color:var(--acento-texto);margin:0 0 26px}
.rotulo::before{content:"";width:3px;height:1.15em;background:currentColor;flex:none}
.abertura p{font-size:clamp(19px,4.6vw,23px);line-height:1.45;margin:0 0 .8em;letter-spacing:-.005em}
.abertura p:last-child{margin-bottom:0}
.numeros{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin-top:34px}
@media(min-width:640px){.numeros{grid-template-columns:repeat(var(--colunas,4),minmax(0,1fr))}}
.numero{background:#fff;border:1px solid var(--linha);border-radius:10px;padding:16px 16px 14px}
.numero .v{font:600 clamp(30px,8vw,40px)/1 var(--titulo);letter-spacing:-.01em;color:var(--tinta)}
.numero .r{font-size:13.5px;line-height:1.35;color:var(--cinza);margin-top:8px}
.tese{padding:64px 0}
.tese .frase{font:600 clamp(26px,6.6vw,40px)/1.12 var(--titulo);letter-spacing:-.005em;margin:0}
.tese .nota{margin-top:22px;max-width:36em}
.tese .nota p{font:400 16.5px/1.55 var(--texto);color:rgba(255,255,255,.72);margin:0 0 .7em}
.canais{display:grid;gap:26px}
@media(min-width:640px){.canais{grid-template-columns:1fr 1fr;gap:30px 34px}}
.canal q{display:block;quotes:"“" "”";font-size:clamp(21px,5vw,26px);line-height:1.22;letter-spacing:-.01em;font-weight:450}
.canal .de{display:block;margin-top:8px;font:600 11.5px/1.3 var(--titulo);letter-spacing:.1em;text-transform:uppercase;color:var(--cinza)}
.leitura{margin:34px 0 0;padding:16px 18px;background:#fff;border:1px solid var(--linha);border-left:3px solid var(--acento-fundo);border-radius:6px;font-size:16.5px}
.achados{list-style:none;margin:0;padding:0;display:grid;gap:34px}
.achado{display:grid;grid-template-columns:auto 1fr;gap:4px 16px}
.achado .n{font:600 14px/1 var(--titulo);color:var(--acento-texto);padding-top:9px;min-width:22px}
.achado .area{font:600 11px/1.3 var(--titulo);letter-spacing:.12em;text-transform:uppercase;color:var(--cinza);margin-bottom:6px}
.achado h3{font-size:clamp(23px,5.6vw,30px);line-height:1.14;letter-spacing:-.015em;font-weight:500;margin:0}
.achado .apoio{margin:12px 0 0;padding-left:12px;border-left:2px solid var(--linha);color:var(--cinza);font-size:16px;line-height:1.5}
.conclusao p{font-size:clamp(18px,4.4vw,21px);line-height:1.5;margin:0 0 .9em}
.conclusao strong{font-weight:650}
.destaque{margin-top:30px;background:var(--acento-fundo);color:var(--sobre-acento);border-radius:10px;padding:22px 22px 22px 24px;font-size:17px;line-height:1.5;position:relative}
.destaque strong{font-weight:700}
.cta{padding:64px 0}
.cta h2{font:600 clamp(28px,7vw,44px)/1.04 var(--titulo);text-transform:uppercase;letter-spacing:-.005em;margin:0}
.cta p{color:rgba(255,255,255,.76);font-size:18px;margin:16px 0 28px;max-width:32em}
.botao{display:inline-flex;align-items:center;gap:10px;background:var(--acento-fundo);color:var(--sobre-acento);text-decoration:none;font:600 15px/1 var(--titulo);letter-spacing:.06em;text-transform:uppercase;padding:18px 22px;border-radius:999px}
.botao svg{width:20px;height:20px}
.botao:focus-visible{outline:3px solid #fff;outline-offset:3px}
.contato{margin-top:18px;font-size:14px;color:rgba(255,255,255,.6)}
footer{padding:34px 0 44px;border-top:1px solid rgba(255,255,255,.12);font-size:13px;line-height:1.55;color:rgba(255,255,255,.58)}
footer .linha-r{display:flex;justify-content:space-between;align-items:center;gap:16px;flex-wrap:wrap;margin-top:22px}
footer .logo{height:12px;color:#fff}
@media print{.faixa-previa{display:none}section{break-inside:avoid}}`;
}

// conteudo: { empresa, data, cor, abertura, numeros[], tese, tese_nota, canais[], canais_leitura, apontamentos[], fecho, destaque, cta{}, assinatura{}, fontes[] }
export function paginaRelatorio(c = {}, opcoes = {}) {
  const base = opcoes.base || TANGIT.base;
  const cor = corValida(c.cor);
  const empresa = String(c.empresa || "").trim() || "Sua empresa";
  const numeros = (c.numeros || []).filter((n) => String(n?.valor || "").trim() && String(n?.rotulo || "").trim()).slice(0, 4);
  const canais = (c.canais || []).filter((x) => String(x?.frase || "").trim()).slice(0, 6);
  const achados = (c.apontamentos || []).filter((a) => String(a?.titulo || "").trim()).slice(0, 6);
  const cta = c.cta || {};
  const ass = c.assinatura || {};
  const whats = String(cta.whatsapp || "").replace(/\D/g, "");
  const msgWhats = String(cta.mensagem || `Olá, Bruno! Vi o pré-relatório da ${empresa}.`).replace(/\{empresa\}/g, empresa);
  const linkWhats = whats ? `https://wa.me/${whats}?text=${encodeURIComponent(msgWhats)}` : "";
  const fontesLista = (c.fontes || []).filter(Boolean);
  const titulo = `Pré-relatório · ${empresa}`;
  const descricao = `Uma leitura breve da marca ${empresa}, feita a partir do que está público. Por ${ass.nome || "Bruno Bova"}, da Tangit.`;
  const og = opcoes.og_imagem || `${base}/assets/img/pre-relatorio-tangit.png`;

  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="robots" content="noindex, nofollow">
<meta name="theme-color" content="${TANGIT.tinta}">
<title>${esc(titulo)}</title>
<meta name="description" content="${esc(descricao)}">
<meta property="og:type" content="article">
<meta property="og:site_name" content="Tangit">
<meta property="og:locale" content="pt_BR">
<meta property="og:title" content="${esc(titulo)}">
<meta property="og:description" content="${esc(descricao)}">
${opcoes.url ? `<meta property="og:url" content="${esc(opcoes.url)}">` : ""}
<meta property="og:image" content="${esc(og)}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" type="image/svg+xml" href="${base}/assets/img/favicon.svg">
<style>${css(cor, base, opcoes.fontes_embutidas)}</style>
</head>
<body>
${opcoes.previa ? `<div class="faixa-previa">${esc(opcoes.previa === true ? "Prévia — o cliente só vê esta página depois que você aprovar" : opcoes.previa)}</div>` : ""}
<header class="escuro">
  <div class="envolve">
    <div class="barra">${logo()}<span class="tag">Pré-relatório</span></div>
    <div class="capa">
      <p class="olho">Pré-relatório · ${esc(mesAno(c.data))}</p>
      <h1>${esc(empresa)}</h1>
      <p class="sub">${esc(c.subtitulo || "Uma leitura breve da marca, feita a partir do que está público.")}</p>
      <div class="assina"><strong>${esc(ass.nome || "Bruno Bova")}</strong><span>${esc(ass.cargo || "Estrategista de marca")} · Tangit</span></div>
    </div>
  </div>
</header>
<main>
  ${
    String(c.abertura || "").trim() || numeros.length
      ? `<section class="abertura"><div class="envolve">
    ${prosa(c.abertura)}
    ${numeros.length ? `<div class="numeros" style="--colunas:${numeros.length}">${numeros.map((n) => `<div class="numero"><div class="v">${esc(n.valor)}</div><div class="r">${esc(n.rotulo)}</div></div>`).join("")}</div>` : ""}
  </div></section>`
      : ""
  }
  ${
    String(c.tese || "").trim()
      ? `<section class="tese escuro"><div class="envolve">
    <p class="olho">O ponto de partida</p>
    <p class="frase">${linha(c.tese)}</p>
    ${String(c.tese_nota || "").trim() ? `<div class="nota">${prosa(c.tese_nota)}</div>` : ""}
  </div></section>`
      : ""
  }
  ${
    canais.length
      ? `<section><div class="envolve">
    <h2 class="rotulo">${esc(c.canais_titulo || "O que a marca diz em cada canal")}</h2>
    <div class="canais">${canais.map((x) => `<div class="canal"><q>${esc(x.frase)}</q><span class="de">${esc(x.canal || "")}</span></div>`).join("")}</div>
    ${String(c.canais_leitura || "").trim() ? `<div class="leitura">${linha(c.canais_leitura)}</div>` : ""}
  </div></section>`
      : ""
  }
  ${
    achados.length
      ? `<section><div class="envolve">
    <h2 class="rotulo">${esc(c.achados_titulo || "O que a leitura encontrou")}</h2>
    <ol class="achados">${achados
      .map(
        (a, i) => `<li class="achado"><span class="n">${String(i + 1).padStart(2, "0")}</span><div>${a.area ? `<div class="area">${esc(a.area)}</div>` : ""}<h3>${linha(a.titulo)}</h3>${String(a.apoio || "").trim() ? `<p class="apoio">${linha(a.apoio)}</p>` : ""}</div></li>`
      )
      .join("")}</ol>
  </div></section>`
      : ""
  }
  ${
    String(c.fecho || "").trim() || String(c.destaque || "").trim()
      ? `<section class="conclusao"><div class="envolve">
    <h2 class="rotulo">${esc(c.fecho_titulo || "Para onde isso aponta")}</h2>
    ${prosa(c.fecho)}
    ${String(c.destaque || "").trim() ? `<div class="destaque">${linha(c.destaque)}</div>` : ""}
  </div></section>`
      : ""
  }
  <section class="cta escuro"><div class="envolve">
    <h2>${esc(cta.titulo || "Vale uma conversa?")}</h2>
    ${String(cta.texto || "").trim() ? `<p>${linha(cta.texto)}</p>` : ""}
    ${linkWhats ? `<a class="botao" href="${esc(linkWhats)}" target="_blank" rel="noopener">${ICONE_WHATS}${esc(cta.botao || "Conversar pelo WhatsApp")}</a>` : ""}
    <div class="contato">${esc(ass.nome || "Bruno Bova")}${whats ? ` · ${esc(fmtFone(whats))}` : ""} · tangit.com.br</div>
  </div></section>
</main>
<footer class="escuro"><div class="envolve">
  <div>Leitura preliminar${c.data ? `, feita em ${esc(dataBR(c.data))}` : ""}, limitada ao que está disponível em fontes públicas${fontesLista.length ? `: ${esc(juntar(fontesLista))}` : ""}. Os números são os que estavam visíveis nessa data.</div>
  <div class="linha-r">${logo()}<span>Todos os direitos reservados</span></div>
</div></footer>
</body>
</html>`;
}

function juntar(lista) {
  if (lista.length <= 1) return lista.join("");
  return `${lista.slice(0, -1).join(", ")} e ${lista[lista.length - 1]}`;
}

function fmtFone(d) {
  let n = String(d);
  if (n.startsWith("55") && n.length >= 12) n = n.slice(2);
  if (n.length === 11) return `(${n.slice(0, 2)}) ${n.slice(2, 7)}-${n.slice(7)}`;
  if (n.length === 10) return `(${n.slice(0, 2)}) ${n.slice(2, 6)}-${n.slice(6)}`;
  return n;
}

// Endereço do relatório a partir do nome do cliente: "GP Serviços Automotivos" → gp-servicos-automotivos-relatorio-482913
export function slugCliente(nome) {
  const s = String(nome || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, " e ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  if (!s) return "empresa";
  if (s.length <= 40) return s;
  const corte = s.slice(0, 40);
  return corte.includes("-") ? corte.slice(0, corte.lastIndexOf("-")) : corte;
}
export const PADRAO_SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*-relatorio-\d{6}$/;
