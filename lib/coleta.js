// Coleta automática para o pré-relatório: busca a página e o Google Tag Manager, mede a velocidade no celular
// (PageSpeed) e monta os links da conferência manual. A leitura do código fica em public/coleta-site.js.
// Só lê páginas públicas, como qualquer visitante.

import { analisarHtml, montarResultadoSite, precisaGtag, normalizarUrl, hostDe } from "../public/coleta-site.js";
export { analisarHtml, tagsDe, medicao, normalizarUrl, hostDe, decodificar, montarResultadoSite } from "../public/coleta-site.js";

const UA_SAFARI =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1";
const MAX_HTML = 1_000_000; // o bastante para o código de qualquer página; mais que isso só pesa no processamento

const WEBMAIL = new Set(
  "gmail.com hotmail.com hotmail.com.br outlook.com outlook.com.br live.com msn.com yahoo.com yahoo.com.br ymail.com bol.com.br uol.com.br terra.com.br ig.com.br globo.com globomail.com icloud.com me.com r7.com zipmail.com.br oi.com.br protonmail.com proton.me aol.com gmx.com zoho.com".split(
    " "
  )
);

export function dominioDeEmail(email) {
  const d = String(email || "").trim().toLowerCase().split("@")[1] || "";
  if (!d || WEBMAIL.has(d) || /contab|contador|escritorio|assessoria/.test(d)) return "";
  return d;
}

// ------------------------------------------------------------------ busca do site
export async function buscar(url, { timeout = 15000, accept = "text/html,application/xhtml+xml" } = {}) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeout);
  const inicio = Date.now();
  try {
    const r = await fetch(url, {
      redirect: "follow",
      signal: ctrl.signal,
      headers: { "user-agent": UA_SAFARI, accept, "accept-language": "pt-BR,pt;q=0.9" },
    });
    const bytes = new Uint8Array(await r.arrayBuffer());
    const texto = new TextDecoder("utf-8", { fatal: false }).decode(bytes.subarray(0, MAX_HTML));
    return { ok: r.ok, status: r.status, url: r.url || url, texto, ms: Date.now() - inicio, bytes: bytes.length, tipo: r.headers.get("content-type") || "" };
  } catch (e) {
    return { ok: false, status: 0, url, texto: "", ms: Date.now() - inicio, erro: e.name === "AbortError" ? "O site demorou mais de 15 segundos para responder." : "Não foi possível abrir o site." };
  } finally {
    clearTimeout(t);
  }
}

export async function varrerSite(urlInformada, { buscarFn = buscar } = {}) {
  const r = await buscarPagina(urlInformada, { buscarFn });
  if (!r.ok) return r.resultado;
  const proto = analisarHtml(r.texto, r.url);
  const gtm = [];
  for (const id of proto.tags.gtm.slice(0, 2)) {
    const g = await buscarFn(`https://www.googletagmanager.com/gtm.js?id=${id}`, { timeout: 10000, accept: "*/*" });
    if (g.ok) gtm.push(g.texto);
  }
  let res = montarResultadoSite({ urlInformada, urlFinal: r.url, status: r.status, ms: r.ms, bytes: r.bytes, html: r.texto, gtm });
  if (precisaGtag(res)) {
    const g = await buscarFn(`https://www.googletagmanager.com/gtag/js?id=${res.tags.ga4[0]}`, { timeout: 10000, accept: "*/*" });
    if (g.ok) res = montarResultadoSite({ urlInformada, urlFinal: r.url, status: r.status, ms: r.ms, bytes: r.bytes, html: r.texto, gtm, gtag: g.texto });
  }
  return res;
}

// Abre a página (com reserva em http). Devolve o texto ou o resultado de erro já pronto para guardar.
export async function buscarPagina(urlInformada, { buscarFn = buscar } = {}) {
  const url = normalizarUrl(urlInformada);
  if (!url) return { ok: false, resultado: { ok: false, erro: "Endereço inválido.", url_informada: urlInformada } };
  let r = await buscarFn(url);
  if (!r.ok && /^https:/i.test(url) && !r.status) {
    const r2 = await buscarFn(url.replace(/^https:/i, "http:"));
    if (r2.ok) r = r2;
  }
  const base = { url_informada: urlInformada, url_final: r.url, status: r.status, ms: r.ms, bytes: r.bytes || 0, analisado_em: new Date().toISOString() };
  if (!r.ok) return { ok: false, resultado: { ...base, ok: false, erro: r.erro || `O site respondeu com erro (HTTP ${r.status}).` } };
  if (r.tipo && !/html|xml|text\/plain/i.test(r.tipo)) return { ok: false, resultado: { ...base, ok: false, erro: "O endereço não devolveu uma página." } };
  return { ok: true, ...r };
}

// ------------------------------------------------------------------ velocidade no celular (Google PageSpeed Insights)
export async function medirVelocidade(url, chave = "") {
  const alvo = normalizarUrl(url);
  if (!alvo) return { ok: false, erro: "Endereço inválido." };
  const q = new URLSearchParams({ url: alvo, strategy: "mobile", locale: "pt_BR" });
  for (const c of ["PERFORMANCE", "SEO", "ACCESSIBILITY", "BEST_PRACTICES"]) q.append("category", c);
  if (chave) q.set("key", chave);
  // só os campos usados: a resposta completa tem mais de 1 MB
  q.set(
    "fields",
    "id,loadingExperience(overall_category,metrics/LARGEST_CONTENTFUL_PAINT_MS),lighthouseResult(finalUrl,finalDisplayedUrl,categories/*/score,audits/largest-contentful-paint/numericValue,audits/first-contentful-paint/numericValue,audits/total-blocking-time/numericValue,audits/cumulative-layout-shift/numericValue)"
  );
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 75000);
  try {
    const r = await fetch(`https://www.googleapis.com/pagespeedonline/v5/runPagespeed?${q}`, { signal: ctrl.signal });
    const d = await r.json().catch(() => null);
    if (!r.ok) {
      const msg = d?.error?.message || `HTTP ${r.status}`;
      if (r.status === 429 || /quota/i.test(msg)) return { ok: false, erro: "O Google limitou as medições sem chave. Coloque uma chave do PageSpeed em Ajustes → Pré-relatório." };
      return { ok: false, erro: `O Google não conseguiu medir o site (${msg.slice(0, 140)}).` };
    }
    return { ok: true, ...lerPageSpeed(d), analisado_em: new Date().toISOString() };
  } catch (e) {
    return { ok: false, erro: e.name === "AbortError" ? "A medição do Google passou de 75 segundos. Tente de novo." : "Não foi possível falar com o Google PageSpeed." };
  } finally {
    clearTimeout(t);
  }
}

export function lerPageSpeed(d) {
  const lh = d?.lighthouseResult || {};
  const cat = lh.categories || {};
  const nota = (k) => (cat[k]?.score === null || cat[k]?.score === undefined ? null : Math.round(cat[k].score * 100));
  const au = lh.audits || {};
  const seg = (k) => {
    const v = au[k]?.numericValue;
    return typeof v === "number" ? Math.round(v) : null;
  };
  const campo = d?.loadingExperience?.metrics?.LARGEST_CONTENTFUL_PAINT_MS;
  return {
    nota: nota("performance"),
    seo: nota("seo"),
    acessibilidade: nota("accessibility"),
    boas_praticas: nota("best-practices"),
    lcp_ms: seg("largest-contentful-paint"),
    fcp_ms: seg("first-contentful-paint"),
    tbt_ms: seg("total-blocking-time"),
    cls: typeof au["cumulative-layout-shift"]?.numericValue === "number" ? Math.round(au["cumulative-layout-shift"].numericValue * 100) / 100 : null,
    campo_lcp_ms: campo?.percentile ?? null,
    campo_categoria: campo?.category || d?.loadingExperience?.overall_category || null,
    url: lh.finalDisplayedUrl || lh.finalUrl || d?.id || "",
  };
}

// ------------------------------------------------------------------ links prontos para a conferência manual
export function linksConferencia({ nome, cidade, uf, dominio, instagram }) {
  const busca = encodeURIComponent(nome || "");
  const local = encodeURIComponent([nome, cidade && `${cidade}${uf ? ` - ${uf}` : ""}`].filter(Boolean).join(", "));
  return {
    google_maps: `https://www.google.com/maps/search/?api=1&query=${local}`,
    google_busca: `https://www.google.com/search?q=${local}`,
    instagram: instagram ? `https://www.instagram.com/${encodeURIComponent(instagram)}/` : `https://www.google.com/search?q=${encodeURIComponent(`${nome || ""} ${cidade || ""} instagram`)}`,
    meta_anuncios: `https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=BR&media_type=all&search_type=keyword_unordered&q=${busca}`,
    google_anuncios: dominio ? `https://adstransparency.google.com/?region=BR&domain=${encodeURIComponent(dominio)}` : `https://adstransparency.google.com/?region=BR`,
    reclame_aqui: `https://www.reclameaqui.com.br/busca/?q=${busca}`,
  };
}
