import { json, erro, corpo } from "../../../lib/util.js";
import { garantirSchema } from "../../../lib/schema.js";
import { lerConfig } from "../../../lib/config.js";
import { clienteGowa, jidDe } from "../../../lib/gowa.js";
import { varrerSite, medirVelocidade, normalizarUrl } from "../../../lib/coleta.js";
import { rascunhoPorRegras, fontesUsadas } from "../../../lib/achados.js";
import { redigirComIA } from "../../../lib/redacao.js";
import {
  contexto,
  dadosEditor,
  garantirRelatorio,
  lerRelatorio,
  salvarColeta,
  salvarConteudo,
  aprovarRelatorio,
  despublicar,
  sanear,
  conteudoPadrao,
  linkDe,
  SLUG_TESTE,
} from "../../../lib/relatorio.js";

// Rotas do pré-relatório (com a chave de acesso):
//   GET  /api/relatorio/:negId                 dados do editor (coleta, texto, sugestões, links prontos)
//   POST /api/relatorio/:negId/pagina          { url }  repassa o código da página para a tela analisar (sem ler aqui)
//   GET  /api/relatorio/tag?id=GTM-…|G-…       repassa o código do Google Tag Manager / tag do Google
//   POST /api/relatorio/:negId/site            { resultado }  guarda a análise feita na tela  ·  { url }  analisa aqui (reserva)
//   POST /api/relatorio/:negId/velocidade      mede a velocidade no celular (Google PageSpeed)
//   PUT  /api/relatorio/:negId/manual          { manual }  conferência feita à mão (Instagram, Google, anúncios, Reclame Aqui)
//   POST /api/relatorio/:negId/redigir         { modo: "ia" | "regras" }  escreve o rascunho a partir da coleta
//   PUT  /api/relatorio/:negId/conteudo        { conteudo }  salva o texto (rascunho)
//   POST /api/relatorio/:negId/aprovar         { conteudo }  aprova e publica no endereço do site
//   POST /api/relatorio/:negId/despublicar     tira a página do ar
//   POST /api/relatorio/teste-endereco         confere se tangit.com.br/<…>-relatorio-<…> chega ao sistema

const MANUAL_PADRAO = { instagram: {}, google: {}, anuncios: {}, reclame_aqui: {}, observacoes: "", sem_site: false };

function limparManual(m = {}) {
  const t = (v, n = 300) => String(v ?? "").slice(0, n);
  const ig = m.instagram || {};
  const g = m.google || {};
  const an = m.anuncios || {};
  const ra = m.reclame_aqui || {};
  const um = (v, lista) => (lista.includes(v) ? v : "");
  return {
    instagram: {
      usuario: t(ig.usuario, 40).replace(/^@/, "").replace(/^https?:\/\/(www\.)?instagram\.com\//i, "").replace(/[/?#].*$/, "").trim(),
      seguidores: t(ig.seguidores, 20),
      publicacoes: t(ig.publicacoes, 20),
      ultima_postagem: /^\d{4}-\d{2}-\d{2}$/.test(String(ig.ultima_postagem || "")) ? ig.ultima_postagem : "",
      bio: t(ig.bio, 400),
      conteudo: (Array.isArray(ig.conteudo) ? ig.conteudo : []).filter((x) => ["oferta", "produto", "bastidores", "educativo", "depoimentos", "institucional"].includes(x)).slice(0, 6),
    },
    google: { nota: t(g.nota, 6), avaliacoes: t(g.avaliacoes, 12), descricao: t(g.descricao, 600), responde: um(g.responde, ["sim", "as_vezes", "nao"]) },
    anuncios: { meta: um(an.meta, ["sim", "nao"]), google: um(an.google, ["sim", "nao"]), obs: t(an.obs, 400) },
    reclame_aqui: { reputacao: t(ra.reputacao, 40), nota: t(ra.nota, 6) },
    observacoes: t(m.observacoes, 2000),
    sem_site: !!m.sem_site,
  };
}

const UA_SAFARI =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1";

// Busca uma página e devolve o corpo sem ler (o processamento fica no navegador).
async function repassar(url, accept) {
  const inicio = Date.now();
  const tentar = async (u) => {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 15000);
    try {
      return await fetch(u, { redirect: "follow", signal: ctrl.signal, headers: { "user-agent": UA_SAFARI, accept, "accept-language": "pt-BR,pt;q=0.9" } });
    } finally {
      clearTimeout(t);
    }
  };
  let r;
  let erro = "";
  try {
    r = await tentar(url);
  } catch (e) {
    erro = e.name === "AbortError" ? "O site demorou mais de 15 segundos para responder." : "Não foi possível abrir o site.";
    if (/^https:/i.test(url))
      try {
        r = await tentar(url.replace(/^https:/i, "http:"));
      } catch {}
  }
  const ms = Date.now() - inicio;
  if (!r) return json({ ok: false, erro, url_final: url, status: 0, ms });
  if (!r.ok) return json({ ok: false, erro: `O site respondeu com erro (HTTP ${r.status}).`, url_final: r.url || url, status: r.status, ms });
  const tipo = r.headers.get("content-type") || "";
  if (accept.startsWith("text/html") && tipo && !/html|xml|text\/plain/i.test(tipo)) return json({ ok: false, erro: "O endereço não devolveu uma página.", url_final: r.url, status: r.status, ms });
  const charset = (tipo.match(/charset=([\w-]+)/i)?.[1] || "").toLowerCase();
  return new Response(r.body, {
    headers: { "content-type": "application/octet-stream", "x-url-final": r.url || url, "x-status": String(r.status), "x-ms": String(ms), "x-charset": charset, "cache-control": "no-store" },
  });
}

// Análise feita na tela: só os campos conhecidos, com tamanho limitado.
function sanearSite(r = {}) {
  const t = (v, n = 300) => String(v ?? "").slice(0, n);
  const lista = (v, n = 6, tam = 40) => (Array.isArray(v) ? v.slice(0, n).map((x) => t(x, tam)) : []);
  const tags = (g = {}) => ({
    gtm: lista(g.gtm),
    ga4: lista(g.ga4),
    gads: lista(g.gads),
    ua: lista(g.ua),
    pixel_meta: lista(g.pixel_meta),
    tiktok: !!g.tiktok,
    linkedin: !!g.linkedin,
    hotjar: !!g.hotjar,
    clarity: !!g.clarity,
    rdstation: !!g.rdstation,
    chat: !!g.chat,
  });
  const base = { url_informada: t(r.url_informada), url_final: t(r.url_final, 500), status: Number(r.status) || 0, ms: Number(r.ms) || 0, bytes: Number(r.bytes) || 0, analisado_em: new Date().toISOString() };
  if (!r.ok) return { ...base, ok: false, erro: t(r.erro || "Não foi possível abrir o site.", 200) };
  const redes = r.redes || {};
  return {
    ...base,
    ok: true,
    titulo: t(r.titulo, 200),
    descricao: t(r.descricao, 400),
    og_titulo: t(r.og_titulo, 200),
    og_descricao: t(r.og_descricao, 400),
    og_imagem: t(r.og_imagem, 500),
    viewport: !!r.viewport,
    gerador: t(r.gerador, 80),
    cor_tema: /^#[0-9a-f]{6}$/.test(r.cor_tema || "") ? r.cor_tema : "",
    cor_marca: /^#[0-9a-f]{6}$/.test(r.cor_marca || "") ? r.cor_marca : "",
    idioma: t(r.idioma, 12),
    h1: t(r.h1, 200),
    h1_total: Number(r.h1_total) || 0,
    dados_estruturados: lista(r.dados_estruturados, 8, 60),
    redes: { instagram: t(redes.instagram, 40), facebook: t(redes.facebook, 200), youtube: t(redes.youtube, 200), tiktok: t(redes.tiktok, 40), linkedin: t(redes.linkedin, 200) },
    whatsapp: !!r.whatsapp,
    whatsapp_numeros: lista(r.whatsapp_numeros, 3, 15),
    telefone_clicavel: !!r.telefone_clicavel,
    formulario: !!r.formulario,
    email_no_site: t(r.email_no_site, 120),
    ano_rodape: Number(r.ano_rodape) || null,
    plataforma: t(r.plataforma, 60),
    https: !!r.https,
    tags: tags(r.tags),
    via_gtm: r.via_gtm ? (r.via_gtm.erro ? { erro: t(r.via_gtm.erro, 120) } : tags(r.via_gtm)) : null,
    gads_via_tag_google: lista(r.gads_via_tag_google),
  };
}

export async function onRequest({ request, env, params }) {
  if (!env.DB) return erro("Banco de dados não configurado: falta o vínculo D1 com o nome DB no projeto.", 500);
  const db = env.DB;
  await garantirSchema(db);
  const [a, b] = (params.path || []).map(String);
  const metodo = request.method.toUpperCase();

  try {
    if (a === "tag" && metodo === "GET") {
      const id = new URL(request.url).searchParams.get("id") || "";
      if (/^GTM-[A-Z0-9]{4,10}$/.test(id)) return repassar(`https://www.googletagmanager.com/gtm.js?id=${id}`, "*/*");
      if (/^G-[A-Z0-9]{6,14}$/.test(id)) return repassar(`https://www.googletagmanager.com/gtag/js?id=${id}`, "*/*");
      return erro("Código inválido.");
    }

    if (a === "teste-endereco" && metodo === "POST") {
      const cfg = await lerConfig(db);
      const alvo = linkDe(cfg, SLUG_TESTE);
      try {
        const r = await fetch(alvo, { redirect: "manual", headers: { "user-agent": "Mozilla/5.0 (teste do sistema)" } });
        const texto = await r.text();
        const ok = r.status === 200 && texto.includes("relatorio-ok");
        return json({
          ok,
          endereco: alvo,
          status: r.status,
          detalhe: ok
            ? "Funcionando: o endereço do site chega ao sistema."
            : r.status >= 300 && r.status < 400
              ? `O site redirecionou para ${r.headers.get("location") || "outro endereço"}. Confira o domínio em Ajustes.`
              : "O site respondeu, mas não chegou ao sistema. Falta instalar a rota no site da Tangit (LEIAME → Pré-relatório).",
        });
      } catch {
        return json({ ok: false, endereco: alvo, detalhe: "Não consegui abrir o endereço. Confira o domínio em Ajustes." });
      }
    }

    const negId = parseInt(a, 10);
    if (!negId) return erro("Rota não encontrada.", 404);
    const cfg = await lerConfig(db);
    const comIA = !!(env.ANTHROPIC_API_KEY || cfg.ia_chave);

    if (!b && metodo === "GET") {
      const d = await dadosEditor(db, negId, cfg);
      // e-mail do perfil comercial do WhatsApp: ajuda a achar o site (uma consulta só, fica guardada)
      if (!d.relatorio.coleta.whatsapp && d.negocio.wa_numero && cfg.gowa_url && !d.site_sugerido) {
        let perfil = { consultado: true };
        try {
          const p = await clienteGowa(cfg).perfilComercial(jidDe(d.negocio.wa_numero));
          perfil = { consultado: true, email: String(p?.email || "").slice(0, 120), endereco: String(p?.address || "").slice(0, 200), categorias: (p?.categories || []).map((c) => c?.name).filter(Boolean).slice(0, 4) };
        } catch {}
        await salvarColeta(db, negId, { ...d.relatorio.coleta, whatsapp: perfil });
        return json({ ...(await dadosEditor(db, negId, cfg)), ia: comIA });
      }
      return json({ ...d, ia: comIA });
    }

    const { ctx } = await contexto(db, negId);
    const row = await garantirRelatorio(db, negId, cfg, ctx);
    const coleta = { ...(row.coleta || {}) };

    if (b === "pagina" && metodo === "POST") {
      const { url } = await corpo(request);
      const alvo = normalizarUrl(url);
      if (!alvo) return json({ ok: false, erro: "Endereço inválido.", url_final: String(url || ""), status: 0, ms: 0 });
      return repassar(alvo, "text/html,application/xhtml+xml");
    }

    if (b === "site" && metodo === "POST") {
      const pedido = await corpo(request);
      const site = pedido.resultado ? sanearSite(pedido.resultado) : await varrerSite(pedido.url);
      coleta.site = site;
      coleta.manual = { ...MANUAL_PADRAO, ...(coleta.manual || {}) };
      if (site.ok && site.redes?.instagram && !coleta.manual.instagram?.usuario) coleta.manual.instagram = { ...(coleta.manual.instagram || {}), usuario: site.redes.instagram };
      if (site.ok) coleta.manual.sem_site = false;
      try {
        // velocidade medida em outro endereço não vale mais
        if (coleta.velocidade?.url && site.url_final && !coleta.velocidade.url.includes(new URL(site.url_final).hostname)) delete coleta.velocidade;
      } catch {}
      await salvarColeta(db, negId, coleta);
      return json({ ...(await dadosEditor(db, negId, cfg)), ia: comIA });
    }

    if (b === "velocidade" && metodo === "POST") {
      const alvo = coleta.site?.url_final || coleta.site?.url_informada;
      if (!alvo) return erro("Analise o site primeiro.");
      coleta.velocidade = await medirVelocidade(alvo, env.PSI_KEY || cfg.psi_chave);
      const atual = (await lerRelatorio(db, negId))?.coleta || {};
      await salvarColeta(db, negId, { ...atual, velocidade: coleta.velocidade });
      return json({ ...(await dadosEditor(db, negId, cfg)), ia: comIA });
    }

    if (b === "manual" && metodo === "PUT") {
      const { manual } = await corpo(request);
      const atual = (await lerRelatorio(db, negId))?.coleta || {};
      await salvarColeta(db, negId, { ...atual, manual: limparManual(manual) });
      return json({ ...(await dadosEditor(db, negId, cfg)), ia: comIA });
    }

    if (b === "redigir" && metodo === "POST") {
      const { modo } = await corpo(request);
      const base = { ...conteudoPadrao(cfg, ctx), ...(row.conteudo || {}) };
      const texto = modo === "ia" ? await redigirComIA(coleta, ctx, cfg, env) : rascunhoPorRegras(coleta, ctx, cfg);
      const novo = sanear({
        ...base,
        ...texto,
        empresa: base.empresa || ctx.nome,
        data: new Date().toLocaleString("en-CA", { timeZone: "America/Sao_Paulo" }).slice(0, 10),
        fontes: fontesUsadas(coleta, ctx),
      });
      const status = await salvarConteudo(db, negId, novo);
      return json({ ok: true, conteudo: novo, status, modo: modo === "ia" ? "ia" : "regras" });
    }

    if (b === "conteudo" && metodo === "PUT") {
      const { conteudo } = await corpo(request);
      const status = await salvarConteudo(db, negId, conteudo || {});
      return json({ ok: true, status });
    }

    if (b === "aprovar" && metodo === "POST") {
      const { conteudo } = await corpo(request);
      const r = await aprovarRelatorio(db, negId, conteudo, cfg);
      return json({ ok: true, ...r, status: "aprovado" });
    }

    if (b === "despublicar" && metodo === "POST") {
      await despublicar(db, negId);
      return json({ ok: true, status: "rascunho" });
    }
  } catch (e) {
    return erro(e.message || String(e), 400);
  }
  return erro("Rota não encontrada.", 404);
}
