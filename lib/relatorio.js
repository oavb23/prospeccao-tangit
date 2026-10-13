// Pré-relatório: guarda a coleta e o texto (rascunho), publica uma cópia aprovada no endereço
// tangit.com.br/<cliente>-relatorio-<6 dígitos> e conta quando o cliente abre.

import { lerConfig, marcarMudanca } from "./config.js";
import { variaveis, nomeDaEmpresa } from "./textos.js";
import { paginaRelatorio, slugCliente, PADRAO_SLUG, esc } from "../public/relatorio-pagina.js";
import { dominioDeEmail, linksConferencia, hostDe, medicao } from "./coleta.js";
import { fontesUsadas, numerosSugeridos, observacoes, canaisSugeridos } from "./achados.js";
import { titulo } from "../public/nomes.js";

export const SLUG_TESTE = "teste-relatorio-000000";
const parse = (s, d = null) => {
  try {
    return typeof s === "string" && s ? JSON.parse(s) : s || d;
  } catch {
    return d;
  }
};
const atividade = (db, negId, texto, tipo = "sistema") =>
  db.prepare("INSERT INTO atividades (negocio_id, tipo, texto) VALUES (?, ?, ?)").bind(negId, tipo, String(texto).slice(0, 4000));

export function linkDe(cfg, slug) {
  const dom = String(cfg.relatorio_dominio || "tangit.com.br").replace(/^https?:\/\//, "").replace(/\/+$/, "");
  return slug ? `https://${dom}/${slug}` : "";
}

// ------------------------------------------------------------------ contexto da empresa
export async function contexto(db, negId) {
  const neg = await db.prepare("SELECT n.*, e.dados AS empresa_dados FROM negocios n LEFT JOIN empresas e ON e.cnpj = n.cnpj WHERE n.id = ?").bind(negId).first();
  if (!neg) throw new Error("Negócio não encontrado.");
  const empresa = parse(neg.empresa_dados, null);
  const r = empresa || {};
  const ano = r.data_inicio_atividade ? parseInt(String(r.data_inicio_atividade).slice(0, 4), 10) : null;
  const anoAtual = Number(new Date().toLocaleString("en-CA", { timeZone: "America/Sao_Paulo" }).slice(0, 4));
  const ctx = {
    nome: nomeDaEmpresa(r, neg),
    wa_nome: neg.wa_nome || "",
    anos: ano ? anoAtual - ano : null,
    ano_abertura: ano,
    cidade: titulo(r.municipio || ""),
    uf: r.uf || "",
    segmento: r.cnae_fiscal_descricao || "",
    email: r.email || neg.email || "",
  };
  return { neg, empresa, ctx };
}

// ------------------------------------------------------------------ leitura e estado
export async function lerRelatorio(db, negId) {
  const r = await db.prepare("SELECT * FROM relatorios WHERE negocio_id = ?").bind(negId).first();
  if (!r) return null;
  return { ...r, coleta: parse(r.coleta, {}) || {}, conteudo: parse(r.conteudo, null), publicado: parse(r.publicado, null) };
}

export function estado(row, cfg) {
  if (!row) return { status: "nenhum" };
  return {
    status: row.status,
    link: row.slug && row.publicado ? linkDe(cfg, row.slug) : "",
    slug: row.slug || "",
    aprovado_em: row.aprovado_em,
    enviado_em: row.enviado_em,
    visto_em: row.visto_em,
    visualizacoes: row.visualizacoes || 0,
    ultima_visualizacao_em: row.ultima_visualizacao_em,
  };
}

const statusDe = (conteudoTxt, publicadoTxt) => (!publicadoTxt ? "rascunho" : conteudoTxt === publicadoTxt ? "aprovado" : "alterado");

// Textos fixos (Ajustes → Pré-relatório) que entram em todo relatório novo.
export function conteudoPadrao(cfg, ctx, agora = new Date()) {
  return {
    empresa: ctx.nome,
    data: agora.toLocaleString("en-CA", { timeZone: "America/Sao_Paulo" }).slice(0, 10),
    cor: cfg.relatorio_cor || "#e23917",
    abertura: "",
    numeros: [],
    tese: cfg.relatorio_tese || "",
    tese_nota: cfg.relatorio_tese_nota || "",
    canais: [],
    canais_leitura: "",
    apontamentos: [],
    fecho: cfg.relatorio_fecho || "",
    destaque: cfg.relatorio_destaque || "",
    cta: {
      titulo: cfg.relatorio_cta_titulo || "",
      texto: cfg.relatorio_cta_texto || "",
      botao: cfg.relatorio_cta_botao || "",
      whatsapp: cfg.relatorio_whatsapp || "",
      mensagem: cfg.relatorio_cta_mensagem || "",
    },
    assinatura: { nome: cfg.relatorio_assinatura_nome || "Bruno Bova", cargo: cfg.relatorio_assinatura_cargo || "Estrategista de marca" },
    fontes: [],
  };
}

// limpa e limita o conteúdo que vem da tela
export function sanear(c = {}) {
  const t = (v, n = 1200) => String(v ?? "").replace(/\r/g, "").slice(0, n);
  return {
    empresa: t(c.empresa, 120).trim(),
    data: /^\d{4}-\d{2}-\d{2}$/.test(String(c.data || "")) ? c.data : "",
    cor: /^#[0-9a-f]{6}$/i.test(String(c.cor || "")) ? String(c.cor).toLowerCase() : "#e23917",
    subtitulo: t(c.subtitulo, 200),
    abertura: t(c.abertura, 2000),
    numeros: (Array.isArray(c.numeros) ? c.numeros : []).slice(0, 4).map((n) => ({ valor: t(n?.valor, 20), rotulo: t(n?.rotulo, 90) })),
    tese: t(c.tese, 300),
    tese_nota: t(c.tese_nota, 600),
    canais_titulo: t(c.canais_titulo, 80),
    canais: (Array.isArray(c.canais) ? c.canais : []).slice(0, 6).map((x) => ({ canal: t(x?.canal, 60), frase: t(x?.frase, 220) })),
    canais_leitura: t(c.canais_leitura, 400),
    achados_titulo: t(c.achados_titulo, 80),
    apontamentos: (Array.isArray(c.apontamentos) ? c.apontamentos : []).slice(0, 6).map((a) => ({ area: t(a?.area, 30), titulo: t(a?.titulo, 180), apoio: t(a?.apoio, 320) })),
    fecho_titulo: t(c.fecho_titulo, 80),
    fecho: t(c.fecho, 1500),
    destaque: t(c.destaque, 600),
    cta: {
      titulo: t(c.cta?.titulo, 80),
      texto: t(c.cta?.texto, 300),
      botao: t(c.cta?.botao, 40),
      whatsapp: String(c.cta?.whatsapp || "").replace(/\D/g, "").slice(0, 13),
      mensagem: t(c.cta?.mensagem, 300),
    },
    assinatura: { nome: t(c.assinatura?.nome, 60), cargo: t(c.assinatura?.cargo, 60) },
    fontes: (Array.isArray(c.fontes) ? c.fontes : []).slice(0, 12).map((f) => t(f, 60)).filter(Boolean),
  };
}

export async function garantirRelatorio(db, negId, cfg, ctx) {
  const atual = await lerRelatorio(db, negId);
  if (atual) return atual;
  const conteudo = JSON.stringify(conteudoPadrao(cfg, ctx));
  await db
    .prepare("INSERT INTO relatorios (negocio_id, status, coleta, conteudo) VALUES (?, 'rascunho', '{}', ?) ON CONFLICT(negocio_id) DO NOTHING")
    .bind(negId, conteudo)
    .run();
  return lerRelatorio(db, negId);
}

// ------------------------------------------------------------------ gravação
export async function salvarColeta(db, negId, coleta) {
  await db.prepare("UPDATE relatorios SET coleta = ?, atualizado_em = datetime('now') WHERE negocio_id = ?").bind(JSON.stringify(coleta || {}), negId).run();
}

export async function salvarConteudo(db, negId, conteudo) {
  const atual = await db.prepare("SELECT publicado FROM relatorios WHERE negocio_id = ?").bind(negId).first();
  if (!atual) throw new Error("Pré-relatório não encontrado.");
  const txt = JSON.stringify(sanear(conteudo));
  const status = statusDe(txt, atual.publicado);
  await db.prepare("UPDATE relatorios SET conteudo = ?, status = ?, atualizado_em = datetime('now') WHERE negocio_id = ?").bind(txt, status, negId).run();
  return status;
}

function digitos6() {
  const n = crypto.getRandomValues(new Uint32Array(1))[0] % 900000;
  return String(100000 + n);
}

export async function aprovarRelatorio(db, negId, conteudo, cfg) {
  const row = await lerRelatorio(db, negId);
  if (!row) throw new Error("Pré-relatório não encontrado.");
  const c = sanear(conteudo || row.conteudo || {});
  if (!c.empresa) throw new Error("Falta o nome da empresa.");
  if (!c.abertura.trim() && !c.apontamentos.some((a) => a.titulo.trim())) throw new Error("O pré-relatório está vazio: escreva a abertura e os apontamentos.");
  if (!c.data) c.data = new Date().toLocaleString("en-CA", { timeZone: "America/Sao_Paulo" }).slice(0, 10);
  let slug = row.slug;
  if (!slug) {
    const base = slugCliente(c.empresa);
    for (let i = 0; i < 6 && !slug; i++) {
      const tentativa = `${base}-relatorio-${digitos6()}`;
      const ja = await db.prepare("SELECT 1 FROM relatorios WHERE slug = ?").bind(tentativa).first();
      if (!ja) slug = tentativa;
    }
    if (!slug) throw new Error("Não consegui gerar o endereço. Tente de novo.");
  }
  const txt = JSON.stringify(c);
  const primeira = !row.publicado;
  await db.batch([
    db
      .prepare("UPDATE relatorios SET conteudo = ?, publicado = ?, slug = ?, status = 'aprovado', aprovado_em = datetime('now'), atualizado_em = datetime('now') WHERE negocio_id = ?")
      .bind(txt, txt, slug, negId),
    atividade(db, negId, primeira ? `Pré-relatório aprovado: ${linkDe(cfg, slug)}` : "Pré-relatório atualizado (nova versão aprovada)"),
    db.prepare("UPDATE negocios SET atualizado_em = datetime('now') WHERE id = ?").bind(negId),
  ]);
  await marcarMudanca(db);
  return { slug, link: linkDe(cfg, slug) };
}

export async function despublicar(db, negId) {
  await db.batch([
    db.prepare("UPDATE relatorios SET publicado = NULL, status = 'rascunho', atualizado_em = datetime('now') WHERE negocio_id = ?").bind(negId),
    atividade(db, negId, "Pré-relatório tirado do ar (o link deixou de funcionar)"),
    db.prepare("UPDATE negocios SET atualizado_em = datetime('now') WHERE id = ?").bind(negId),
  ]);
  await marcarMudanca(db);
}

// ------------------------------------------------------------------ links publicados (fila de aprovação, envios)
export async function linksPublicados(db, cfg, ids) {
  const mapa = new Map();
  for (let i = 0; i < ids.length; i += 90) {
    const bloco = ids.slice(i, i + 90);
    if (!bloco.length) continue;
    const { results } = await db
      .prepare(`SELECT negocio_id, slug, status, visualizacoes FROM relatorios WHERE negocio_id IN (${bloco.map(() => "?").join(",")})`)
      .bind(...bloco)
      .all();
    for (const r of results) mapa.set(r.negocio_id, { status: r.status, link: r.slug && r.status !== "rascunho" ? linkDe(cfg, r.slug) : "", visualizacoes: r.visualizacoes || 0 });
  }
  return mapa;
}

export async function linkPublicado(db, cfg, negId) {
  const r = await db.prepare("SELECT slug, status FROM relatorios WHERE negocio_id = ? AND publicado IS NOT NULL").bind(negId).first();
  return r?.slug ? linkDe(cfg, r.slug) : "";
}

// A Gowa abre o link para montar a prévia: as visitas desse minuto não contam como do cliente.
export const ignorarVisitas = (db, negId) =>
  db.prepare("UPDATE relatorios SET ignorar_ate = ? WHERE negocio_id = ?").bind(new Date(Date.now() + 90000).toISOString(), negId);

// Mensagem com o link saiu (automação, sistema ou celular): marca como enviado.
export function marcarEnviadoSeTiver(db, negId, texto, slug) {
  if (!slug || !String(texto || "").includes(slug)) return [];
  return [
    db.prepare("UPDATE relatorios SET enviado_em = COALESCE(enviado_em, ?) WHERE negocio_id = ?").bind(new Date().toISOString(), negId),
  ];
}
export async function slugDoNegocio(db, negId) {
  return (await db.prepare("SELECT slug FROM relatorios WHERE negocio_id = ? AND publicado IS NOT NULL").bind(negId).first())?.slug || "";
}

// ------------------------------------------------------------------ página pública
const ROBO = /bot|crawl|spider|slurp|facebookexternalhit|facebookcatalog|whatsapp|telegram|slack|discord|skype|preview|embedly|curl|wget|python|go-http|java\/|okhttp|axios|node-fetch|headless|lighthouse|pagespeed|gtmetrix|pingdom|uptime|monitor/i;

export async function paginaPublica(env, slug, request, ctxExec) {
  const db = env.DB;
  const html = (corpo, status = 200, extra = {}) =>
    new Response(corpo, {
      status,
      headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store", "x-robots-tag": "noindex, nofollow", "referrer-policy": "no-referrer", ...extra },
    });
  if (slug === SLUG_TESTE)
    return html(`<!doctype html><meta charset="utf-8"><meta name="robots" content="noindex"><title>Pré-relatório: endereço ok</title><body style="font:16px system-ui;padding:40px"><p data-relatorio-ok="1">relatorio-ok — o endereço dos pré-relatórios está funcionando.</p></body>`);
  if (!PADRAO_SLUG.test(slug)) return html(paginaNaoEncontrada(), 404);
  const row = await db.prepare("SELECT * FROM relatorios WHERE slug = ? AND publicado IS NOT NULL").bind(slug).first();
  if (!row) return html(paginaNaoEncontrada(), 404);
  const cfg = await lerConfig(db);
  const url = linkDe(cfg, slug);
  const corpo = paginaRelatorio(parse(row.publicado, {}), { url });

  // conta a visita do cliente (não conta robôs, a prévia da Gowa, nem você abrindo pelo sistema)
  const u = new URL(request.url);
  const ua = request.headers.get("user-agent") || "";
  const agora = new Date().toISOString();
  const conta =
    request.method === "GET" && !u.searchParams.has("interno") && !ROBO.test(ua) && row.enviado_em && (!row.ignorar_ate || row.ignorar_ate < agora);
  if (conta) {
    const tarefa = (async () => {
      const ultima = row.ultima_visualizacao_em ? Date.parse(row.ultima_visualizacao_em) : 0;
      const stmts = [
        db
          .prepare("UPDATE relatorios SET visualizacoes = visualizacoes + 1, visto_em = COALESCE(visto_em, ?), ultima_visualizacao_em = ? WHERE id = ?")
          .bind(agora, agora, row.id),
      ];
      const n = (row.visualizacoes || 0) + 1;
      if (!row.visto_em || Date.now() - ultima > 6 * 3600000) {
        stmts.push(
          atividade(db, row.negocio_id, n === 1 ? "Abriu o pré-relatório" : `Abriu o pré-relatório de novo (${n}ª vez)`),
          db.prepare("UPDATE negocios SET atualizado_em = datetime('now') WHERE id = ?").bind(row.negocio_id)
        );
      }
      await db.batch(stmts);
      if (stmts.length > 1) await marcarMudanca(db);
    })().catch(() => {});
    if (ctxExec?.waitUntil) ctxExec.waitUntil(tarefa);
    else await tarefa;
  }
  return html(corpo);
}

function paginaNaoEncontrada() {
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex"><title>Página não encontrada · Tangit</title>
<style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#1b202c;color:#fff;font:17px/1.5 -apple-system,"Helvetica Neue",Arial,sans-serif;padding:24px}a{color:#fff}</style></head>
<body><div><p style="font-size:22px;margin:0 0 8px">Este pré-relatório não está mais disponível.</p><p style="opacity:.7;margin:0">Fale com Bruno Bova em <a href="https://tangit.com.br">tangit.com.br</a>.</p></div></body></html>`;
}

// ------------------------------------------------------------------ dados para o editor
export async function dadosEditor(db, negId, cfg) {
  const { neg, empresa, ctx } = await contexto(db, negId);
  const row = await garantirRelatorio(db, negId, cfg, ctx);
  const coleta = row.coleta || {};
  const dominioEmail = dominioDeEmail(empresa?.email) || dominioDeEmail(neg.email) || dominioDeEmail(coleta.whatsapp?.email);
  const siteSugerido = coleta.site?.url_informada || (dominioEmail ? `https://${dominioEmail}` : "");
  const instagram = coleta.manual?.instagram?.usuario || coleta.site?.redes?.instagram || "";
  return {
    negocio: { id: neg.id, cnpj: neg.cnpj, wa_numero: neg.wa_numero, wa_nome: neg.wa_nome, etapa_id: neg.etapa_id, automacao: neg.automacao },
    contexto: ctx,
    site_sugerido: siteSugerido,
    links: linksConferencia({ nome: ctx.nome, cidade: ctx.cidade, uf: ctx.uf, dominio: hostDe(coleta.site?.url_final || siteSugerido), instagram }),
    numeros_sugeridos: numerosSugeridos(coleta, ctx),
    canais_sugeridos: canaisSugeridos(coleta, ctx),
    fontes_sugeridas: fontesUsadas(coleta, ctx),
    observacoes: observacoes(coleta, ctx),
    medicao: medicao(coleta.site),
    relatorio: {
      ...estado(row, cfg),
      coleta,
      conteudo: { ...conteudoPadrao(cfg, ctx), ...(row.conteudo || {}) },
      publicado: !!row.publicado,
    },
    padrao: conteudoPadrao(cfg, ctx),
    ia: !!cfg.ia_chave,
  };
}

// usado na mensagem: variáveis + {relatorio}
export function variaveisComRelatorio(neg, empresa, link) {
  return { ...variaveis(neg, empresa), ...(link ? { relatorio: link } : {}) };
}

export { esc };
