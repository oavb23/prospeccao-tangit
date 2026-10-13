import { json, erro, corpo, soDigitos } from "../../../lib/util.js";
import { garantirSchema, melhorTelefone, PAPEIS } from "../../../lib/schema.js";
import { lerConfig, marcarMudanca } from "../../../lib/config.js";
import { efeitosDaEtapa } from "../../../lib/automacao.js";
import { eventoMeta, eventoGA4, parse } from "../../../lib/rastreamento.js";

// API de dados próprios (listas, funil, atividades, modelos de mensagem) no D1.
// Rotas:
//   GET    /api/data/resumo                       listas, etapas, modelos, marcadores e contadores
//   POST   /api/data/listas                       { nome, cor }
//   PATCH  /api/data/listas/:id                   { nome?, cor? }
//   DELETE /api/data/listas/:id
//   GET    /api/data/listas/:id/empresas
//   POST   /api/data/listas/:id/empresas          { empresas: [registroReceita...] }
//   DELETE /api/data/listas/:id/empresas          { cnpjs: [...] }
//   PUT    /api/data/etapas                       { etapas: [{id?, nome, cor, tipo, papel}] }  (ordem = posição)
//   GET    /api/data/negocios
//   POST   /api/data/negocios                     { empresas: [...], etapa_id?, origem? }
//   POST   /api/data/contatos                     { nome, telefone, email?, interesse?, origem?, etapa_id? }  (sem CNPJ)
//   GET    /api/data/negocios/:id
//   PATCH  /api/data/negocios/:id                 { etapa_id?, valor?, proximo_contato?, motivo_perda?, contato_nome?, telefone?, email?, interesse? }
//   DELETE /api/data/negocios/:id
//   GET    /api/data/negocios/:id/atividades
//   POST   /api/data/negocios/:id/atividades      { tipo, texto }
//   DELETE /api/data/atividades/:id
//   GET    /api/data/empresas/:cnpj               registro salvo + listas + negócio
//   PUT    /api/data/empresas/:cnpj               { empresa }
//   POST   /api/data/modelos                      { titulo, texto, passo? }
//   PATCH  /api/data/modelos/:id                  { titulo?, texto?, passo? }
//   DELETE /api/data/modelos/:id
//   GET    /api/data/backup                       tudo em JSON
//   GET    /api/data/export/gads?de=&ate=         vendas com gclid (Google Ads, conversão offline)

const PASSOS_MODELO = ["primeiro_contato", "followup_1", "followup_2", "outro_momento"];
const CAMPOS_NEGOCIO =
  "n.id, n.cnpj, n.etapa_id, n.valor, n.proximo_contato, n.motivo_perda, n.origem, n.fonte, n.contato_nome, n.telefone, n.email, n.interesse, " +
  "n.wa_numero, n.wa_status, n.wa_nome, n.automacao, n.passo, n.proxima_acao_em, n.ultimo_envio_em, n.ultima_resposta_em, n.nao_lidas, n.optout, n.tentativas_erro, " +
  "n.fechado_em, n.criado_em, n.atualizado_em";
const com55 = (p) => {
  const d = soDigitos(p);
  return d && d.length <= 11 ? "55" + d : d;
};

export async function onRequest({ request, env, params, waitUntil }) {
  if (!env.DB) {
    return erro("Banco de dados não configurado: falta o vínculo D1 com o nome DB no projeto.", 500);
  }
  const db = env.DB;
  await garantirSchema(db);
  const depois = (p) => (typeof waitUntil === "function" ? waitUntil(p) : p);

  const partes = (params.path || []).map(String);
  const metodo = request.method.toUpperCase();
  const [rec, id, sub] = partes;

  // ---------- resumo ----------
  if (rec === "resumo" && metodo === "GET") {
    const [listas, etapas, modelos, itens, negocios, pendentes, respostas] = await db.batch([
      db.prepare(
        `SELECT l.id, l.nome, l.cor, l.criado_em, COUNT(i.cnpj) AS total
           FROM listas l LEFT JOIN lista_itens i ON i.lista_id = l.id
          GROUP BY l.id ORDER BY l.nome COLLATE NOCASE`
      ),
      db.prepare("SELECT id, nome, cor, ordem, tipo, papel FROM etapas ORDER BY ordem, id"),
      db.prepare("SELECT id, titulo, texto, passo FROM modelos ORDER BY titulo COLLATE NOCASE"),
      db.prepare("SELECT lista_id, cnpj FROM lista_itens"),
      db.prepare("SELECT id, cnpj, etapa_id FROM negocios WHERE cnpj IS NOT NULL"),
      db.prepare(
        `SELECT COUNT(*) AS n FROM negocios n JOIN etapas et ON et.id = n.etapa_id
          WHERE et.papel = 'entrada' AND n.automacao = 'inativa' AND n.optout = 0 AND COALESCE(n.wa_status, '') NOT IN ('nao_tem', 'sem_numero')`
      ),
      db.prepare("SELECT COUNT(*) AS n FROM negocios WHERE nao_lidas > 0"),
    ]);
    const marcadores = {};
    for (const r of itens.results) {
      (marcadores[r.cnpj] ||= { listas: [], negocio: null }).listas.push(r.lista_id);
    }
    for (const r of negocios.results) {
      (marcadores[r.cnpj] ||= { listas: [], negocio: null }).negocio = { id: r.id, etapa_id: r.etapa_id };
    }
    return json({
      listas: listas.results,
      etapas: etapas.results,
      modelos: modelos.results,
      marcadores,
      papeis: PAPEIS,
      pendentes: pendentes.results[0]?.n || 0,
      com_respostas: respostas.results[0]?.n || 0,
    });
  }

  // ---------- listas ----------
  if (rec === "listas") {
    if (!id && metodo === "POST") {
      const b = await corpo(request);
      const nome = String(b.nome || "").trim();
      if (!nome) return erro("Dê um nome à lista.");
      const r = await db
        .prepare("INSERT INTO listas (nome, cor) VALUES (?, ?)")
        .bind(nome.slice(0, 80), b.cor || "#3b6ea5")
        .run();
      return json({ id: r.meta.last_row_id, nome, cor: b.cor || "#3b6ea5", total: 0 }, 201);
    }
    const listaId = parseInt(id, 10);
    if (!listaId) return erro("Lista inválida.");

    if (!sub && metodo === "PATCH") {
      const b = await corpo(request);
      if (b.nome !== undefined) {
        await db.prepare("UPDATE listas SET nome = ? WHERE id = ?").bind(String(b.nome).trim().slice(0, 80), listaId).run();
      }
      if (b.cor) await db.prepare("UPDATE listas SET cor = ? WHERE id = ?").bind(b.cor, listaId).run();
      return json({ ok: true });
    }
    if (!sub && metodo === "DELETE") {
      await db.batch([
        db.prepare("DELETE FROM lista_itens WHERE lista_id = ?").bind(listaId),
        db.prepare("DELETE FROM listas WHERE id = ?").bind(listaId),
      ]);
      return json({ ok: true });
    }
    if (sub === "empresas" && metodo === "GET") {
      const { results } = await db
        .prepare(
          `SELECT e.dados, i.adicionado_em FROM lista_itens i
             JOIN empresas e ON e.cnpj = i.cnpj
            WHERE i.lista_id = ? ORDER BY i.adicionado_em DESC`
        )
        .bind(listaId)
        .all();
      return json(results.map((r) => ({ ...JSON.parse(r.dados), _adicionado_em: r.adicionado_em })));
    }
    if (sub === "empresas" && metodo === "POST") {
      const b = await corpo(request);
      const empresas = (b.empresas || []).filter((e) => soDigitos(e?.cnpj).length === 14);
      if (!empresas.length) return erro("Nenhuma empresa válida enviada.");
      const stmts = [];
      for (const e of empresas) {
        stmts.push(upsertEmpresa(db, e));
        stmts.push(
          db.prepare("INSERT OR IGNORE INTO lista_itens (lista_id, cnpj) VALUES (?, ?)").bind(listaId, soDigitos(e.cnpj))
        );
      }
      await emLotes(db, stmts);
      return json({ ok: true, adicionadas: empresas.length });
    }
    if (sub === "empresas" && metodo === "DELETE") {
      const b = await corpo(request);
      const cnpjs = (b.cnpjs || []).map(soDigitos).filter((c) => c.length === 14);
      await emLotes(
        db,
        cnpjs.map((c) => db.prepare("DELETE FROM lista_itens WHERE lista_id = ? AND cnpj = ?").bind(listaId, c))
      );
      return json({ ok: true, removidas: cnpjs.length });
    }
  }

  // ---------- etapas ----------
  if (rec === "etapas" && metodo === "PUT") {
    const b = await corpo(request);
    const etapas = (b.etapas || []).filter((e) => String(e.nome || "").trim());
    if (!etapas.length) return erro("O funil precisa de ao menos uma etapa.");
    const usados = new Set();
    for (const e of etapas) {
      const p = e.papel && PAPEIS[e.papel] ? e.papel : null;
      if (p && usados.has(p)) return erro(`Duas etapas com a mesma função na automação: “${PAPEIS[p]}”.`);
      if (p) usados.add(p);
      e.papel = p;
    }
    const atuais = (await db.prepare("SELECT id FROM etapas").all()).results.map((r) => r.id);
    const mantidas = new Set(etapas.filter((e) => e.id).map((e) => Number(e.id)));
    const removidas = atuais.filter((x) => !mantidas.has(x));
    const stmts = etapas.map((e, i) =>
      e.id
        ? db
            .prepare("UPDATE etapas SET nome = ?, cor = ?, tipo = ?, ordem = ?, papel = ? WHERE id = ?")
            .bind(String(e.nome).trim().slice(0, 40), e.cor || "#7a8699", e.tipo || "aberta", i + 1, e.papel, Number(e.id))
        : db
            .prepare("INSERT INTO etapas (nome, cor, tipo, ordem, papel) VALUES (?, ?, ?, ?, ?)")
            .bind(String(e.nome).trim().slice(0, 40), e.cor || "#7a8699", e.tipo || "aberta", i + 1, e.papel)
    );
    await db.batch(stmts);
    if (removidas.length) {
      // Negócios de etapas removidas voltam para a primeira etapa.
      const primeira = await db.prepare("SELECT id FROM etapas ORDER BY ordem, id LIMIT 1").first();
      const ph = removidas.map(() => "?").join(",");
      await db.batch([
        db.prepare(`UPDATE negocios SET etapa_id = ? WHERE etapa_id IN (${ph})`).bind(primeira.id, ...removidas),
        db.prepare(`DELETE FROM etapas WHERE id IN (${ph})`).bind(...removidas),
      ]);
    }
    const { results } = await db.prepare("SELECT id, nome, cor, ordem, tipo, papel FROM etapas ORDER BY ordem, id").all();
    return json(results);
  }

  // ---------- contato sem CNPJ (indicação, contato manual) ----------
  if (rec === "contatos" && !id && metodo === "POST") {
    const b = await corpo(request);
    const nome = String(b.nome || "").trim().slice(0, 120);
    const telefone = com55(b.telefone);
    if (nome.length < 2 || telefone.length < 12) return erro("Informe nome e WhatsApp com DDD.");
    let etapaId = parseInt(b.etapa_id, 10);
    if (!etapaId) etapaId = (await db.prepare("SELECT id FROM etapas WHERE papel = 'conversa' ORDER BY ordem LIMIT 1").first())?.id;
    if (!etapaId) etapaId = (await db.prepare("SELECT id FROM etapas ORDER BY ordem, id LIMIT 1").first()).id;
    const r = await db
      .prepare(
        "INSERT INTO negocios (cnpj, etapa_id, origem, fonte, contato_nome, telefone, telefone_manual, email, interesse) VALUES (NULL, ?, ?, 'manual', ?, ?, 1, ?, ?)"
      )
      .bind(etapaId, String(b.origem || "Contato manual").slice(0, 80), nome, telefone, String(b.email || "").trim() || null, String(b.interesse || "").trim() || null)
      .run();
    await db.prepare("INSERT INTO atividades (negocio_id, tipo, texto) VALUES (?, 'sistema', 'Contato cadastrado manualmente')").bind(r.meta.last_row_id).run();
    return json({ ok: true, id: r.meta.last_row_id }, 201);
  }

  // ---------- negócios (funil) ----------
  if (rec === "negocios") {
    if (!id && metodo === "GET") {
      // ?desde=AAAA-MM-DD HH:MM:SS → só o que mudou (as telas abertas atualizam sem ler o funil inteiro)
      const desde = new URL(request.url).searchParams.get("desde");
      const filtro = desde ? "WHERE n.atualizado_em >= ?" : "";
      // só os campos da empresa que o quadro usa (o banco recorta o JSON; a ficha busca o registro completo)
      const { results } = await db
        .prepare(
          `SELECT ${CAMPOS_NEGOCIO},
                  CASE WHEN e.cnpj IS NULL THEN NULL ELSE json_object(
                    'cnpj', e.cnpj, 'razao_social', json_extract(e.dados, '$.razao_social'), 'nome_fantasia', json_extract(e.dados, '$.nome_fantasia'),
                    'municipio', json_extract(e.dados, '$.municipio'), 'uf', json_extract(e.dados, '$.uf'),
                    'cnae_fiscal_descricao', json_extract(e.dados, '$.cnae_fiscal_descricao'), 'email', json_extract(e.dados, '$.email')) END AS empresa_json,
                  (SELECT texto FROM atividades a WHERE a.negocio_id = n.id AND a.tipo <> 'sistema' ORDER BY a.id DESC LIMIT 1) AS ultima_atividade,
                  (SELECT COUNT(*) FROM atividades a WHERE a.negocio_id = n.id AND a.tipo <> 'sistema') AS total_atividades
             FROM negocios n LEFT JOIN empresas e ON e.cnpj = n.cnpj
             ${filtro}
            ORDER BY n.atualizado_em DESC`
        )
        .bind(...(desde ? [desde] : []))
        .all();
      return json(results.map(({ empresa_json, ...n }) => ({ ...n, empresa: empresa_json ? JSON.parse(empresa_json) : null })));
    }
    if (!id && metodo === "POST") {
      const b = await corpo(request);
      const empresas = (b.empresas || []).filter((e) => soDigitos(e?.cnpj).length === 14);
      if (!empresas.length) return erro("Nenhuma empresa válida enviada.");
      let etapaId = parseInt(b.etapa_id, 10);
      if (!etapaId) {
        const primeira =
          (await db.prepare("SELECT id FROM etapas WHERE papel = 'entrada' ORDER BY ordem LIMIT 1").first()) ||
          (await db.prepare("SELECT id FROM etapas ORDER BY ordem, id LIMIT 1").first());
        etapaId = primeira.id;
      }
      const existentes = new Set(
        (await db.prepare("SELECT cnpj FROM negocios WHERE cnpj IS NOT NULL").all()).results.map((r) => r.cnpj)
      );
      const novas = empresas.filter((e) => !existentes.has(soDigitos(e.cnpj)));
      const stmts = [];
      for (const e of novas) {
        stmts.push(upsertEmpresa(db, e));
        stmts.push(
          db
            .prepare("INSERT OR IGNORE INTO negocios (cnpj, etapa_id, origem, fonte, telefone) VALUES (?, ?, ?, 'prospeccao', ?)")
            .bind(soDigitos(e.cnpj), etapaId, String(b.origem || "").slice(0, 80) || null, melhorTelefone(e))
        );
      }
      await emLotes(db, stmts);
      // registra a entrada no funil
      if (novas.length) {
        // o D1 aceita até 100 parâmetros por consulta: busca os ids em blocos
        const ids = [];
        for (let i = 0; i < novas.length; i += 90) {
          const bloco = novas.slice(i, i + 90).map((e) => soDigitos(e.cnpj));
          const { results } = await db
            .prepare(`SELECT id FROM negocios WHERE cnpj IN (${bloco.map(() => "?").join(",")})`)
            .bind(...bloco)
            .all();
          ids.push(...results.map((r) => r.id));
        }
        await emLotes(
          db,
          ids.map((nid) =>
            db
              .prepare("INSERT INTO atividades (negocio_id, tipo, texto) VALUES (?, 'sistema', ?)")
              .bind(nid, b.origem ? `Entrou no funil (origem: ${b.origem})` : "Entrou no funil")
          )
        );
        await marcarMudanca(db);
      }
      return json({ ok: true, adicionados: novas.length, ja_estavam: empresas.length - novas.length });
    }

    const negId = parseInt(id, 10);
    if (!negId) return erro("Negócio inválido.");

    if (!sub && metodo === "GET") {
      const n = await db
        .prepare(`SELECT ${CAMPOS_NEGOCIO}, n.tracking, n.mensagem_inicial, e.dados FROM negocios n LEFT JOIN empresas e ON e.cnpj = n.cnpj WHERE n.id = ?`)
        .bind(negId)
        .first();
      if (!n) return erro("Negócio não encontrado.", 404);
      const { dados, tracking, ...resto } = n;
      const t = parse(tracking);
      delete t.ip;
      delete t.ua;
      return json({ negocio: { ...resto, tracking: t }, empresa: dados ? JSON.parse(dados) : null });
    }

    if (!sub && metodo === "PATCH") {
      const b = await corpo(request);
      const atual = await db.prepare("SELECT * FROM negocios WHERE id = ?").bind(negId).first();
      if (!atual) return erro("Negócio não encontrado.", 404);
      const stmts = [];
      const logs = [];
      let etapaNova = null;
      if (b.etapa_id !== undefined && Number(b.etapa_id) !== atual.etapa_id) {
        etapaNova = await db.prepare("SELECT id, nome, tipo, papel FROM etapas WHERE id = ?").bind(Number(b.etapa_id)).first();
        if (!etapaNova) return erro("Etapa inválida.");
        stmts.push(db.prepare("UPDATE negocios SET etapa_id = ? WHERE id = ?").bind(etapaNova.id, negId));
        logs.push(`Moveu para "${etapaNova.nome}"`);
        const fechou = etapaNova.tipo === "ganho" || etapaNova.tipo === "perdido";
        stmts.push(db.prepare("UPDATE negocios SET fechado_em = ? WHERE id = ?").bind(fechou ? new Date().toISOString() : null, negId));
        stmts.push(...efeitosDaEtapa(db, atual, etapaNova, await lerConfig(db)));
      }
      if (b.valor !== undefined) {
        const v = b.valor === null || b.valor === "" ? null : Number(b.valor);
        if ((Number.isFinite(v) ? v : null) !== atual.valor) stmts.push(db.prepare("UPDATE negocios SET valor = ? WHERE id = ?").bind(Number.isFinite(v) ? v : null, negId));
      }
      if (b.proximo_contato !== undefined && (b.proximo_contato || null) !== (atual.proximo_contato || null)) {
        stmts.push(
          db.prepare("UPDATE negocios SET proximo_contato = ? WHERE id = ?").bind(b.proximo_contato || null, negId)
        );
        if (b.proximo_contato) logs.push(`Próximo contato marcado para ${b.proximo_contato.split("-").reverse().join("/")}`);
      }
      if (b.motivo_perda !== undefined && (String(b.motivo_perda || "") || null) !== atual.motivo_perda) {
        stmts.push(
          db.prepare("UPDATE negocios SET motivo_perda = ? WHERE id = ?").bind(String(b.motivo_perda || "").slice(0, 200) || null, negId)
        );
        if (b.motivo_perda) logs.push(`Motivo da perda: ${b.motivo_perda}`);
      }
      for (const campo of ["contato_nome", "email", "interesse"]) {
        if (b[campo] !== undefined && (String(b[campo] || "").trim() || null) !== atual[campo]) {
          stmts.push(db.prepare(`UPDATE negocios SET ${campo} = ? WHERE id = ?`).bind(String(b[campo] || "").trim().slice(0, 1000) || null, negId));
        }
      }
      if (b.telefone !== undefined) {
        const tel = com55(b.telefone) || null;
        if (tel !== atual.telefone) {
          // número novo, informado à mão: confere o WhatsApp de novo, só nesse número
          stmts.push(
            db
              .prepare("UPDATE negocios SET telefone = ?, telefone_manual = 1, wa_status = NULL, wa_numero = NULL, wa_nome = NULL, wa_lid = NULL WHERE id = ?")
              .bind(tel, negId)
          );
          logs.push(`Telefone alterado para ${tel ? tel.slice(2) : "—"}`);
        }
      }
      if (!stmts.length) return json({ ok: true });
      stmts.push(db.prepare("UPDATE negocios SET atualizado_em = datetime('now') WHERE id = ?").bind(negId));
      for (const t of logs) {
        stmts.push(db.prepare("INSERT INTO atividades (negocio_id, tipo, texto) VALUES (?, 'sistema', ?)").bind(negId, t));
      }
      await db.batch(stmts);
      // eventos de conversão (contatos do site, que têm rastreamento)
      if (etapaNova && atual.tracking) {
        const neg = await db.prepare("SELECT * FROM negocios WHERE id = ?").bind(negId).first();
        if (etapaNova.tipo === "ganho") {
          depois(
            Promise.all([
              eventoMeta(db, "Purchase", neg, { currency: "BRL", value: neg.valor || 0 }, "system_generated"),
              eventoGA4(db, neg, "close_convert_lead", { currency: "BRL", value: neg.valor || 0 }),
            ])
          );
        } else if (etapaNova.tipo === "perdido") {
          depois(eventoGA4(db, neg, "close_unconvert_lead", { unconvert_lead_reason: String(neg.motivo_perda || "").slice(0, 100) }));
        } else {
          depois(eventoGA4(db, neg, etapaNova.papel === "proposta" ? "qualify_lead" : "working_lead", { lead_status: etapaNova.nome }));
        }
      }
      return json({ ok: true });
    }
    if (!sub && metodo === "DELETE") {
      await db.batch([
        db.prepare("DELETE FROM atividades WHERE negocio_id = ?").bind(negId),
        db.prepare("DELETE FROM mensagens WHERE negocio_id = ?").bind(negId),
        db.prepare("DELETE FROM negocios WHERE id = ?").bind(negId),
      ]);
      return json({ ok: true });
    }
    if (sub === "atividades" && metodo === "GET") {
      const { results } = await db
        .prepare("SELECT id, tipo, texto, criado_em FROM atividades WHERE negocio_id = ? ORDER BY id DESC")
        .bind(negId)
        .all();
      return json(results);
    }
    if (sub === "atividades" && metodo === "POST") {
      const b = await corpo(request);
      const texto = String(b.texto || "").trim();
      if (!texto) return erro("Escreva algo.");
      const tipo = ["nota", "ligacao", "whatsapp", "email", "reuniao", "sistema"].includes(b.tipo) ? b.tipo : "nota";
      await db.batch([
        db.prepare("INSERT INTO atividades (negocio_id, tipo, texto) VALUES (?, ?, ?)").bind(negId, tipo, texto.slice(0, 4000)),
        db.prepare("UPDATE negocios SET atualizado_em = datetime('now') WHERE id = ?").bind(negId),
      ]);
      return json({ ok: true }, 201);
    }
  }

  if (rec === "atividades" && id && metodo === "DELETE") {
    await db.prepare("DELETE FROM atividades WHERE id = ? AND tipo <> 'sistema'").bind(parseInt(id, 10)).run();
    return json({ ok: true });
  }

  // ---------- empresa salva ----------
  if (rec === "empresas" && id && metodo === "GET") {
    const cnpj = soDigitos(id);
    const [emp, listas, neg] = await db.batch([
      db.prepare("SELECT dados FROM empresas WHERE cnpj = ?").bind(cnpj),
      db.prepare("SELECT lista_id FROM lista_itens WHERE cnpj = ?").bind(cnpj),
      db.prepare(`SELECT ${CAMPOS_NEGOCIO} FROM negocios n WHERE n.cnpj = ?`).bind(cnpj),
    ]);
    return json({
      empresa: emp.results[0] ? JSON.parse(emp.results[0].dados) : null,
      listas: listas.results.map((r) => r.lista_id),
      negocio: neg.results[0] || null,
    });
  }

  if (rec === "empresas" && id && metodo === "PUT") {
    const b = await corpo(request);
    const e = b.empresa;
    if (!e || soDigitos(e.cnpj) !== soDigitos(id)) return erro("Dados inválidos.");
    await upsertEmpresa(db, e).run();
    return json({ ok: true });
  }

  // ---------- modelos de mensagem ----------
  if (rec === "modelos") {
    const passoValido = (p) => (PASSOS_MODELO.includes(p) ? p : null);
    if (!id && metodo === "POST") {
      const b = await corpo(request);
      if (!String(b.titulo || "").trim() || !String(b.texto || "").trim()) return erro("Preencha título e texto.");
      const passo = passoValido(b.passo);
      const stmts = [];
      if (passo) stmts.push(db.prepare("UPDATE modelos SET passo = NULL WHERE passo = ?").bind(passo));
      stmts.push(
        db.prepare("INSERT INTO modelos (titulo, texto, passo) VALUES (?, ?, ?)").bind(String(b.titulo).trim().slice(0, 80), String(b.texto).slice(0, 4000), passo)
      );
      const res = await db.batch(stmts);
      return json({ id: res[res.length - 1].meta.last_row_id }, 201);
    }
    const mId = parseInt(id, 10);
    if (mId && metodo === "PATCH") {
      const b = await corpo(request);
      const stmts = [
        db
          .prepare("UPDATE modelos SET titulo = COALESCE(?, titulo), texto = COALESCE(?, texto) WHERE id = ?")
          .bind(b.titulo ?? null, b.texto !== undefined ? String(b.texto).slice(0, 4000) : null, mId),
      ];
      if (b.passo !== undefined) {
        const passo = passoValido(b.passo);
        if (passo) stmts.push(db.prepare("UPDATE modelos SET passo = NULL WHERE passo = ? AND id <> ?").bind(passo, mId));
        stmts.push(db.prepare("UPDATE modelos SET passo = ? WHERE id = ?").bind(passo, mId));
      }
      await db.batch(stmts);
      return json({ ok: true });
    }
    if (mId && metodo === "DELETE") {
      await db.prepare("DELETE FROM modelos WHERE id = ?").bind(mId).run();
      return json({ ok: true });
    }
  }

  // ---------- exportação para o Google Ads (vendas do site com gclid) ----------
  if (rec === "export" && id === "gads" && metodo === "GET") {
    const url = new URL(request.url);
    const de = url.searchParams.get("de") || "0000";
    const ate = url.searchParams.get("ate") || "9999";
    const cfg = await lerConfig(db);
    const { results } = await db
      .prepare(
        `SELECT n.valor, n.fechado_em, n.tracking FROM negocios n JOIN etapas et ON et.id = n.etapa_id
          WHERE et.tipo = 'ganho' AND n.tracking IS NOT NULL AND n.fechado_em >= ? AND n.fechado_em < ?`
      )
      .bind(de, ate + "T99")
      .all();
    const celula = (v) => (/[",\n]/.test(String(v)) ? `"${String(v).replace(/"/g, '""')}"` : String(v));
    const linhas = ["Parameters:TimeZone=America/Sao_Paulo", "Google Click ID,Conversion Name,Conversion Time,Conversion Value,Conversion Currency"];
    for (const l of results) {
      const t = parse(l.tracking);
      const g = t.last?.gclid || t.first?.gclid;
      if (!g) continue;
      const hora = new Date(l.fechado_em).toLocaleString("sv-SE", { timeZone: "America/Sao_Paulo" });
      linhas.push([g, cfg.gads_conv, hora, l.valor || 0, "BRL"].map(celula).join(","));
    }
    return new Response(linhas.join("\n"), {
      headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": 'attachment; filename="conversoes-google-ads.csv"' },
    });
  }

  // ---------- backup ----------
  if (rec === "backup" && metodo === "GET") {
    const tabelas = ["empresas", "listas", "lista_itens", "etapas", "negocios", "atividades", "modelos", "mensagens"];
    const res = await db.batch(tabelas.map((t) => db.prepare(`SELECT * FROM ${t}`)));
    const saida = { gerado_em: new Date().toISOString() };
    tabelas.forEach((t, i) => (saida[t] = res[i].results));
    return json(saida, 200, {
      "content-disposition": `attachment; filename="prospeccao-backup-${new Date().toISOString().slice(0, 10)}.json"`,
    });
  }

  return erro("Rota não encontrada.", 404);
}

function upsertEmpresa(db, e) {
  const cnpj = soDigitos(e.cnpj);
  const limpo = {};
  for (const [k, v] of Object.entries(e)) if (!k.startsWith("_")) limpo[k] = v;
  return db
    .prepare(
      `INSERT INTO empresas (cnpj, nome, municipio, uf, dados) VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(cnpj) DO UPDATE SET nome = excluded.nome, municipio = excluded.municipio,
         uf = excluded.uf, dados = excluded.dados, atualizado_em = datetime('now')`
    )
    .bind(cnpj, e.nome_fantasia || e.razao_social || "", e.municipio || "", e.uf || "", JSON.stringify(limpo));
}

// D1 aceita lotes grandes, mas dividimos para ficar folgado nos limites do plano gratuito.
async function emLotes(db, stmts, tamanho = 80) {
  for (let i = 0; i < stmts.length; i += tamanho) {
    await db.batch(stmts.slice(i, i + tamanho));
  }
}
