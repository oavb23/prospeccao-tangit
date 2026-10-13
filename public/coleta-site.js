// Leitura do código de uma página (título, promessa, plataforma, medição, redes, WhatsApp).
// Este arquivo é usado pelo navegador (a análise roda no seu aparelho, sem gastar o limite de processamento
// da Cloudflare) e pelo servidor (testes e reserva): a regra é uma só.

// ------------------------------------------------------------------ utilidades de texto
const ENT = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", ndash: "–", mdash: "—", copy: "©", reg: "®", hellip: "…", rsquo: "’", lsquo: "‘", rdquo: "”", ldquo: "“", ccedil: "ç", atilde: "ã", otilde: "õ", aacute: "á", eacute: "é", iacute: "í", oacute: "ó", uacute: "ú", acirc: "â", ecirc: "ê", ocirc: "ô", agrave: "à", Ccedil: "Ç", Atilde: "Ã", Aacute: "Á", Eacute: "É", Iacute: "Í", Oacute: "Ó", Uacute: "Ú" };
export function decodificar(s) {
  return String(s ?? "")
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&([a-z]+);/gi, (t, n) => (n in ENT ? ENT[n] : t));
}
const limpar = (s) =>
  decodificar(String(s ?? "").replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " "))
    .replace(/\s+/g, " ")
    .trim();
const unicos = (lista) => [...new Set(lista.filter(Boolean))];

function atributos(tag) {
  const a = {};
  for (const m of tag.matchAll(/([a-zA-Z_:.-]+)\s*=\s*("([^"]*)"|'([^']*)'|([^\s"'>]+))/g)) a[m[1].toLowerCase()] = decodificar(m[3] ?? m[4] ?? m[5] ?? "");
  return a;
}

export function normalizarUrl(bruto) {
  let u = String(bruto || "").trim();
  if (!u) return "";
  if (!/^https?:\/\//i.test(u)) u = "https://" + u.replace(/^\/+/, "");
  try {
    const x = new URL(u);
    if (!x.hostname.includes(".")) return "";
    return x.toString();
  } catch {
    return "";
  }
}

// ------------------------------------------------------------------ leitura do HTML
const IGNORAR_INSTAGRAM = new Set(["p", "reel", "reels", "explore", "accounts", "stories", "tv", "about", "developer", "legal", "direct", "web", "share"]);
const IGNORAR_FACEBOOK = new Set(["sharer", "sharer.php", "share", "tr", "plugins", "dialog", "login", "watch", "groups", "events", "photo", "photo.php", "permalink.php", "story.php", "help", "policies", "privacy", "business"]);

function maisFrequente(lista) {
  const c = new Map();
  for (const x of lista) c.set(x, (c.get(x) || 0) + 1);
  return [...c.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || "";
}

export function analisarHtml(html, urlFinal = "") {
  const h = String(html || "");
  const saida = {};
  saida.titulo = limpar(h.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || "").slice(0, 200);
  const metas = {};
  for (const m of h.matchAll(/<meta\s[^>]*>/gi)) {
    const a = atributos(m[0]);
    const chave = (a.name || a.property || a["http-equiv"] || "").toLowerCase();
    if (chave && a.content !== undefined && !(chave in metas)) metas[chave] = a.content.trim();
  }
  saida.descricao = (metas.description || "").slice(0, 400);
  saida.og_titulo = (metas["og:title"] || "").slice(0, 200);
  saida.og_descricao = (metas["og:description"] || "").slice(0, 400);
  saida.og_imagem = metas["og:image"] || "";
  saida.viewport = !!metas.viewport;
  saida.gerador = metas.generator || "";
  saida.cor_tema = /^#[0-9a-f]{6}$/i.test(metas["theme-color"] || "") ? metas["theme-color"].toLowerCase() : "";
  saida.idioma = h.match(/<html[^>]*\slang=["']?([\w-]+)/i)?.[1] || "";
  const h1s = [...h.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/gi)].map((m) => limpar(m[1])).filter((t) => t.length >= 3);
  saida.h1 = (h1s[0] || "").slice(0, 200);
  saida.h1_total = h1s.length;

  // dados estruturados (LocalBusiness, Organization…)
  const tipos = [];
  for (const m of h.matchAll(/<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      const juntar = (o) => {
        if (!o || typeof o !== "object") return;
        if (Array.isArray(o)) return o.forEach(juntar);
        if (o["@type"]) [].concat(o["@type"]).forEach((t) => tipos.push(String(t)));
        if (o["@graph"]) juntar(o["@graph"]);
      };
      juntar(JSON.parse(m[1].trim()));
    } catch {}
  }
  saida.dados_estruturados = unicos(tipos).slice(0, 8);

  // links: redes, WhatsApp, telefone
  const hrefs = [...h.matchAll(/href\s*=\s*["']([^"']+)["']/gi)].map((m) => decodificar(m[1]));
  const insta = [];
  const face = [];
  const yt = [];
  const tt = [];
  const li = [];
  const wa = [];
  for (const href of hrefs) {
    let m;
    if ((m = href.match(/instagram\.com\/([A-Za-z0-9_.]{2,30})\/?(?:[?#]|$)/i)) && !IGNORAR_INSTAGRAM.has(m[1].toLowerCase())) insta.push(m[1].toLowerCase());
    if ((m = href.match(/facebook\.com\/([A-Za-z0-9_.-]{3,80})\/?(?:[?#]|$)/i)) && !IGNORAR_FACEBOOK.has(m[1].toLowerCase())) face.push(`https://www.facebook.com/${m[1]}`);
    if ((m = href.match(/youtube\.com\/((?:@|channel\/|c\/|user\/)[A-Za-z0-9_.-]{2,80})/i))) yt.push(`https://www.youtube.com/${m[1]}`);
    if ((m = href.match(/tiktok\.com\/@([A-Za-z0-9_.]{2,30})/i))) tt.push(m[1].toLowerCase());
    if ((m = href.match(/linkedin\.com\/(company|in|school)\/([A-Za-z0-9_%.-]{2,100})/i))) li.push(`https://www.linkedin.com/${m[1]}/${m[2]}`);
    if ((m = href.match(/(?:wa\.me\/|whatsapp\.com\/send\/?\?(?:[^"']*&)?phone=|whatsapp:\/\/send\?(?:[^"']*&)?phone=)\+?(\d{10,13})/i))) wa.push(m[1]);
    else if (/wa\.me\/|api\.whatsapp\.com|web\.whatsapp\.com|whatsapp:\/\//i.test(href)) wa.push("sim");
  }
  saida.redes = {
    instagram: maisFrequente(insta),
    facebook: maisFrequente(face),
    youtube: maisFrequente(yt),
    tiktok: maisFrequente(tt),
    linkedin: maisFrequente(li),
  };
  saida.whatsapp = wa.length > 0 || h.includes("wa.me/") || h.includes("api.whatsapp.com/send");
  saida.whatsapp_numeros = unicos(wa.filter((x) => x !== "sim")).slice(0, 3);
  saida.telefone_clicavel = hrefs.some((x) => /^tel:/i.test(x));
  saida.formulario = /<form[\s>]/i.test(h);
  saida.email_no_site = h.includes("mailto:") ? (h.match(/mailto:([^"'?\s>]+)/)?.[1] || "").toLowerCase() : "";

  // ano no rodapé (©)
  const fim = h.length > 200000 ? h.slice(-200000) : h;
  const anos = [...fim.matchAll(/(?:©|&copy;|&#169;|copyright)\s*(?:\d{4}\s*(?:[-–]|&ndash;|a)\s*)?((?:19|20)\d{2})/gi)].map((m) => Number(m[1]));
  saida.ano_rodape = anos.length ? Math.max(...anos) : null;

  saida.cor_marca = corDaMarca(h, saida.cor_tema);
  saida.plataforma = plataforma(h, saida.gerador);
  saida.tags = tagsDe(h);
  saida.https = /^https:/i.test(urlFinal);
  return saida;
}

// Cor mais usada no site entre as cores "de marca" (com saturação, nem quase branca nem quase preta).
// É só sugestão para a cor de destaque do pré-relatório.
function hsl(hex) {
  const [r, g, b] = hex.slice(1).match(/../g).map((x) => parseInt(x, 16) / 255);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
  return { s, l };
}
function corDaMarca(h, tema) {
  const boa = (c) => {
    const { s, l } = hsl(c);
    return s >= 0.45 && l >= 0.22 && l <= 0.68;
  };
  if (tema && boa(tema)) return tema;
  const cont = new Map();
  for (const m of String(h).slice(0, 300000).matchAll(/#([0-9a-f]{6})\b/gi)) {
    const c = "#" + m[1].toLowerCase();
    if (boa(c)) cont.set(c, (cont.get(c) || 0) + 1);
  }
  const [cor, n] = [...cont.entries()].sort((a, b) => b[1] - a[1])[0] || [];
  return n >= 3 ? cor : "";
}

const PLATAFORMAS = [
  ["Wix", ["static.wixstatic.com", "wix-code-", "_wixCIDX", "X-Wix-", "wixsite.com", "parastorage.com"]],
  ["Shopify", ["cdn.shopify.com", "Shopify.theme"]],
  ["Nuvemshop", ["nuvemshop", "tiendanube", "d26lpennugtm8s.cloudfront.net"]],
  ["Loja Integrada", ["lojaintegrada", "awsli.com.br"]],
  ["Tray", ["tray.com.br", "traycorp"]],
  ["VTEX", ["vteximg.com", "vtexassets.com", "vtexcommercestable"]],
  ["Webflow", ["data-wf-page", "webflow.com", "webflow.io"]],
  ["Squarespace", ["static1.squarespace.com", "squarespace-cdn"]],
  ["Framer", ["framerusercontent.com", "framer.com/m/"]],
  ["Google Sites", ["sites.google.com", "gstatic.com/atari"]],
  ["Hostinger (criador de sites)", ["zyrosite.com"]],
  ["WordPress", ["wp-content/", "wp-includes/"]],
];
function plataforma(h, gerador) {
  const g = String(gerador || "");
  for (const [nome, ps] of PLATAFORMAS) {
    if (ps.some((p) => h.includes(p)) || g.toLowerCase().includes(nome.toLowerCase().split(" ")[0])) {
      if (nome === "WordPress") {
        const extras = [h.includes("elementor") && "Elementor", h.includes("woocommerce") && "WooCommerce"].filter(Boolean);
        return extras.length ? `WordPress (${extras.join(", ")})` : "WordPress";
      }
      return nome;
    }
  }
  return g ? g.split(/[\s;]/)[0] : "";
}

// Tags de medição encontradas num texto (HTML da página ou código do contêiner do GTM).
// Cada busca começa por um trecho fixo ("GTM-", "fbq("…): o motor de busca de texto pula direto para ele,
// o que mantém o processamento curto (o plano gratuito da Cloudflare dá pouco tempo por chamada).
const todos = (t, re) => [...t.matchAll(re)].map((m) => m[1] || m[0]);
const tem = (t, ...trechos) => trechos.some((x) => t.includes(x));

export function tagsDe(texto) {
  const t = String(texto || "");
  const pixel = new Set();
  if (t.includes("fbq(")) for (const id of todos(t, /fbq\(\s*\\?["']init\\?["']\s*,\s*\\?["']?(\d{10,20})/g)) pixel.add(id);
  if (t.includes("facebook.com/tr")) for (const id of todos(t, /facebook\.com\/tr\?id=(\d{10,20})/g)) pixel.add(id);
  if (t.includes("vtp_pixelId")) for (const id of todos(t, /"vtp_pixelId"\s*[:,]\s*"(\d{10,20})"/g)) pixel.add(id);
  const meta = pixel.size > 0 || tem(t, "fbevents.js", "fbq(");
  const gads = new Set(t.includes("AW-") ? todos(t, /AW-(\d{8,12})\b/g).map((x) => "AW-" + x) : []);
  if (t.includes("vtp_conversionId")) for (const id of todos(t, /"vtp_conversionId"\s*[:,]\s*"(\d{8,12})"/g)) gads.add("AW-" + id);
  return {
    gtm: t.includes("GTM-") ? unicos(todos(t, /(GTM-[A-Z0-9]{5,9})\b/g)) : [],
    ga4: t.includes("G-") ? unicos(todos(t, /(?<![\w-])(G-[A-Z0-9]{8,12})\b/g).filter((x) => /\d/.test(x))) : [],
    gads: [...gads],
    ua: t.includes("UA-") ? unicos(todos(t, /(?<![\w-])(UA-\d{4,10}-\d{1,4})\b/g)) : [],
    pixel_meta: pixel.size ? [...pixel] : meta ? ["sim"] : [],
    tiktok: tem(t, "analytics.tiktok.com", "ttq.load(", "ttq.page("),
    linkedin: tem(t, "snap.licdn.com", "_linkedin_partner_id"),
    hotjar: tem(t, "static.hotjar.com", "hotjar.com/c/hotjar"),
    clarity: t.includes("clarity.ms/tag"),
    rdstation: tem(t, "d335luupugsy2.cloudfront.net", "rdstation"),
    chat: tem(t, "tawk.to", "jivosite", "zopim", "zdassets.com", "crisp.chat", "leadster", "kommo.com", "octadesk", "blip.ai", "manychat"),
  };
}

// Junta o que foi lido da página e dos contêineres do GTM no formato guardado no pré-relatório.
export function montarResultadoSite({ urlInformada, urlFinal, status, ms, bytes, html, gtm = [], gtag = "" }) {
  const base = { url_informada: urlInformada, url_final: urlFinal, status, ms, bytes: bytes || 0, analisado_em: new Date().toISOString() };
  const a = analisarHtml(html, urlFinal);
  a.via_gtm = null;
  if (a.tags.gtm.length) {
    const textos = gtm.filter(Boolean);
    if (textos.length) {
      const v = tagsDe(textos.join("\n"));
      a.via_gtm = { ga4: v.ga4, gads: v.gads, pixel_meta: v.pixel_meta, tiktok: v.tiktok, linkedin: v.linkedin, hotjar: v.hotjar, clarity: v.clarity, rdstation: v.rdstation };
    } else a.via_gtm = { erro: "Não consegui ler o contêiner do GTM." };
  }
  if (gtag) a.gads_via_tag_google = tagsDe(gtag).gads;
  return { ...base, ok: true, ...a };
}

// precisa ler o gtag.js? (tem GA4 no código, sem conversão do Google Ads em lugar nenhum)
export const precisaGtag = (r) => r.ok && r.tags.ga4.length && !r.tags.gads.length && !(r.via_gtm?.gads || []).length;

// Medição consolidada: o que aparece no código da página ou dentro do GTM.
export function medicao(site) {
  if (!site?.ok) return null;
  const t = site.tags || {};
  const g = site.via_gtm || {};
  const tem = (lista) => (lista || []).length > 0;
  return {
    gtm: tem(t.gtm),
    gtm_lido: !!site.via_gtm && !site.via_gtm.erro,
    ga4: tem(t.ga4) || tem(g.ga4),
    gads: tem(t.gads) || tem(g.gads) || tem(site.gads_via_tag_google),
    pixel_meta: tem(t.pixel_meta) || tem(g.pixel_meta),
    tiktok: !!(t.tiktok || g.tiktok),
    linkedin: !!(t.linkedin || g.linkedin),
    mapa_calor: !!(t.hotjar || g.hotjar || t.clarity || g.clarity),
    rdstation: !!(t.rdstation || g.rdstation),
    ua_antigo: tem(t.ua) && !(tem(t.ga4) || tem(g.ga4)),
  };
}

export const hostDe = (u) => {
  try {
    return new URL(normalizarUrl(u)).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
};

