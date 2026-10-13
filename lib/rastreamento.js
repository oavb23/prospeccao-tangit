// Origem do contato do site e envio de eventos para Meta (API de Conversões) e GA4.
// Mesma lógica do CRM do site, agora dentro do funil único.

import { lerConfig, gravarConfig } from "./config.js";

const META_V = "v23.0";
const enc = new TextEncoder();
const hex = (b) => [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, "0")).join("");
const sha = async (s) => hex(await crypto.subtle.digest("SHA-256", enc.encode(String(s))));
const norm = (s) => String(s ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").trim().toLowerCase();
const host = (u) => {
  try {
    return new URL(u).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
};
export const parse = (s, d = {}) => {
  try {
    return typeof s === "string" ? JSON.parse(s) : s || d;
  } catch {
    return d;
  }
};

export function classificarOrigem(t) {
  if (!t || typeof t !== "object") return "Visita direta";
  const src = norm(t.utm_source);
  const med = norm(t.utm_medium);
  const ref = host(t.referrer);
  const pago = /(cpc|ppc|paid|pago|cpm|cpv|display|patrocinado|ads?$|^ad_|_ads?_)/.test(med);
  if (t.gclid || t.gbraid || t.wbraid || (/(google|youtube)/.test(src) && pago)) return "Google Ads";
  if (/^(fb|ig|an|msg|facebook|instagram|meta|threads)/.test(src) && pago) return "Meta Ads";
  if (/^(ig|instagram)/.test(src) || /instagram\.com$/.test(ref)) return "Instagram";
  if (/^(fb|facebook)/.test(src) || /(facebook\.com|fb\.com|fb\.me)$/.test(ref)) return "Facebook";
  if (t.fbclid) return "Meta (sem UTM)";
  if (/whatsapp/.test(src) || /(whatsapp|wa\.me)/.test(ref)) return "WhatsApp";
  if (/(^|\.)(google|bing|yahoo|duckduckgo|ecosia|yandex)\./.test(ref) || (src === "google" && /organic/.test(med))) return "Google orgânico";
  if (/indica/.test(src + med)) return "Indicação";
  if (src || ref) return "Outros sites";
  return "Visita direta";
}

// Evento para a Meta. source "website" (formulário) usa o mesmo event_id do Pixel; as demais são do sistema.
export async function eventoMeta(db, nome, neg, custom = {}, source = "website") {
  try {
    const s = await lerConfig(db);
    if (!s.meta_pixel || !s.meta_token) return;
    const t = parse(neg.tracking);
    const partes = String(neg.contato_nome || "").trim().toLowerCase().split(/\s+/).filter(Boolean);
    const fone = String(neg.telefone || "").replace(/\D/g, "");
    const ud = { external_id: [await sha("neg-" + neg.id)], country: [await sha("br")] };
    if (fone) ud.ph = [await sha(fone.startsWith("55") ? fone : "55" + fone)];
    if (partes[0]) ud.fn = [await sha(partes[0])];
    if (partes.length > 1) ud.ln = [await sha(partes[partes.length - 1])];
    if (neg.email) ud.em = [await sha(String(neg.email).trim().toLowerCase())];
    if (t.fbp) ud.fbp = t.fbp;
    if (t.fbc) ud.fbc = t.fbc;
    if (t.ip) ud.client_ip_address = t.ip;
    if (t.ua) ud.client_user_agent = t.ua;
    const ev = {
      event_name: nome,
      event_time: Math.floor(Date.now() / 1000),
      action_source: source,
      user_data: ud,
      custom_data: { ...custom, lead_origin: neg.origem || "" },
    };
    if (source === "website") {
      ev.event_id = neg.event_id;
      ev.event_source_url = t.page || t.last?.landing || "";
    } else {
      ev.event_id = `${nome}-${neg.id}`;
      ev.custom_data.event_source = "crm";
    }
    const corpo = { data: [ev] };
    if (s.meta_teste) corpo.test_event_code = s.meta_teste;
    const r = await fetch(
      `https://graph.facebook.com/${META_V}/${encodeURIComponent(s.meta_pixel)}/events?access_token=${encodeURIComponent(s.meta_token)}`,
      { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(corpo) }
    );
    const txt = (await r.text()).slice(0, 300);
    await gravarConfig(db, {
      meta_ultimo: `${new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })} · ${nome} · HTTP ${r.status} · ${txt}`,
    });
  } catch {}
}

export async function eventoGA4(db, neg, nome, params = {}) {
  try {
    const s = await lerConfig(db);
    const t = parse(neg.tracking);
    if (!s.ga4_id || !s.ga4_segredo || !t.ga_cid) return;
    await fetch(
      `https://www.google-analytics.com/mp/collect?measurement_id=${encodeURIComponent(s.ga4_id)}&api_secret=${encodeURIComponent(s.ga4_segredo)}`,
      {
        method: "POST",
        body: JSON.stringify({
          client_id: t.ga_cid,
          events: [{ name: nome, params: { ...params, lead_id: "neg-" + neg.id, lead_source: neg.origem || "" } }],
        }),
      }
    );
  } catch {}
}
