import { garantirSchema } from "../../../lib/schema.js";
import { lerConfig, marcarMudanca } from "../../../lib/config.js";
import { classificarOrigem, eventoMeta } from "../../../lib/rastreamento.js";
import { paginaPublica } from "../../../lib/relatorio.js";

// Rotas públicas usadas pelo formulário do site (widget.js). Mesmo formato do CRM antigo,
// então basta trocar o endereço do script no site.
//   GET  /api/public/config   textos do botão e número do WhatsApp
//   POST /api/public/lead     contato enviado pelo formulário
//   GET  /api/public/relatorio/:slug   página do pré-relatório (o site tangit.com.br repassa o endereço para cá)

const CORS = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET,POST,OPTIONS",
  "access-control-allow-headers": "content-type",
};
const J = (d, s = 200, h = {}) =>
  new Response(JSON.stringify(d), { status: s, headers: { "content-type": "application/json; charset=utf-8", ...CORS, ...h } });
const digitos = (s) => String(s ?? "").replace(/\D/g, "");
const rand = (n = 8) => [...crypto.getRandomValues(new Uint8Array(n))].map((b) => b.toString(16).padStart(2, "0")).join("");
const com55 = (p) => {
  const d = digitos(p);
  return d && d.length <= 11 ? "55" + d : d;
};

export async function onRequest(ctx) {
  const { request: req, env, params } = ctx;
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS });
  if (!env.DB) return J({ error: "Banco D1 não vinculado." }, 500);
  const db = env.DB;
  await garantirSchema(db);
  const [rota, extra] = (params.path || []).map(String);

  if (rota === "relatorio" && (req.method === "GET" || req.method === "HEAD")) {
    return paginaPublica(env, String(extra || "").toLowerCase(), req, ctx);
  }

  if (rota === "config" && req.method === "GET") {
    const s = await lerConfig(db);
    return J(
      {
        wa_number: com55(s.site_wa_numero),
        wa_template: s.site_wa_modelo,
        label: s.widget_rotulo,
        title: s.widget_titulo,
        intro: s.widget_intro,
        color: s.widget_cor,
      },
      200,
      { "cache-control": "public, max-age=120" }
    );
  }

  if (rota === "lead" && req.method === "POST") {
    let d = {};
    try {
      d = JSON.parse((await req.text()) || "{}");
    } catch {}
    if (d.hp) return J({ ok: true }); // robôs
    const nome = String(d.name || "").trim().slice(0, 120);
    const fone = digitos(d.phone).slice(0, 13);
    const interesse = String(d.interest || "").trim().slice(0, 1000);
    if (nome.length < 2 || fone.length < 10) return J({ ok: false, error: "Dados inválidos" });
    const t = d.tracking && typeof d.tracking === "object" ? d.tracking : {};
    t.ip = req.headers.get("cf-connecting-ip") || "";
    t.ua = (req.headers.get("user-agent") || "").slice(0, 300);
    t.city = req.cf?.city || "";
    t.region = req.cf?.region || "";
    t.country = req.cf?.country || "";
    t.first_origin = classificarOrigem(t.first);
    const origem = classificarOrigem(t.last || t.first);
    const eventId = String(d.event_id || rand(8)).slice(0, 64);
    const telefone = com55(fone);

    // já existe um contato aberto com o mesmo número: registra o novo contato, sem duplicar o card
    const existente = await db
      .prepare(
        `SELECT n.* FROM negocios n LEFT JOIN etapas et ON et.id = n.etapa_id
          WHERE n.telefone = ? AND COALESCE(et.tipo, 'aberta') = 'aberta' ORDER BY n.id DESC LIMIT 1`
      )
      .bind(telefone)
      .first();
    if (existente) {
      await db.batch([
        db
          .prepare("INSERT INTO atividades (negocio_id, tipo, texto) VALUES (?, 'sistema', ?)")
          .bind(existente.id, `Novo contato pelo site (${origem})${interesse ? `: ${interesse}` : ""}`),
        db.prepare("UPDATE negocios SET atualizado_em = datetime('now') WHERE id = ?").bind(existente.id),
      ]);
      ctx.waitUntil(eventoMeta(db, "Lead", { ...existente, tracking: t, event_id: eventId }));
      await marcarMudanca(db);
      return J({ ok: true, id: existente.id });
    }

    const etapa =
      (await db.prepare("SELECT id FROM etapas WHERE papel = 'conversa' ORDER BY ordem, id LIMIT 1").first()) ||
      (await db.prepare("SELECT id FROM etapas WHERE tipo = 'aberta' ORDER BY ordem, id LIMIT 1").first());
    const r = await db
      .prepare(
        `INSERT INTO negocios (cnpj, etapa_id, origem, fonte, contato_nome, telefone, interesse, tracking, event_id)
         VALUES (NULL, ?, ?, 'site', ?, ?, ?, ?, ?)`
      )
      .bind(etapa?.id ?? null, origem, nome, telefone, interesse || null, JSON.stringify(t), eventId)
      .run();
    const id = r.meta.last_row_id;
    await db
      .prepare("INSERT INTO atividades (negocio_id, tipo, texto) VALUES (?, 'sistema', ?)")
      .bind(id, `Contato recebido pelo site (${origem})${interesse ? `: ${interesse}` : ""}`)
      .run();
    ctx.waitUntil(eventoMeta(db, "Lead", { id, contato_nome: nome, telefone, origem, tracking: t, event_id: eventId }));
    await marcarMudanca(db);
    return J({ ok: true, id });
  }

  return J({ error: "Rota não encontrada." }, 404);
}
