import { json, erro, corpo, soDigitos } from "../../../lib/util.js";
import { garantirSchema } from "../../../lib/schema.js";

// API de dados próprios (listas, funil, atividades, modelos de mensagem) no D1.
// Rotas:
//   GET    /api/data/resumo                       listas, etapas, modelos e marcadores (o que já está salvo)
//   POST   /api/data/listas                       { nome, cor }
//   PATCH  /api/data/listas/:id                   { nome?, cor? }
//   DELETE /api/data/listas/:id
//   GET    /api/data/listas/:id/empresas
//   POST   /api/data/listas/:id/empresas          { empresas: [registroReceita...] }
//   DELETE /api/data/listas/:id/empresas          { cnpjs: [...] }
//   PUT    /api/data/etapas                       { etapas: [{id?, nome, cor, tipo}] }  (ordem = posição)
//   GET    /api/data/negocios
//   POST   /api/data/negocios                     { empresas: [...], etapa_id?, origem? }
//   PATCH  /api/data/negocios/:id                 { etapa_id?, valor?, proximo_contato?, motivo_perda? }
//   DELETE /api/data/negocios/:id
//   GET    /api/data/negocios/:id/atividades
//   POST   /api/data/negocios/:id/atividades      { tipo, texto }
//   DELETE /api/data/atividades/:id
//   GET    /api/data/empresas/:cnpj               registro salvo + listas + negócio
//   POST   /api/data/modelos                      { titulo, texto }
//   PATCH  /api/data/modelos/:id                  { titulo?, texto? }
//   DELETE /api/data/modelos/:id
//   GET    /api/data/backup                       tudo em JSON

export async function onRequest({ request, env, params }) {
  if (!env.DB) {
    return erro("Banco de dados não configurado: falta o vínculo D1 com o nome DB no projeto.", 500);
  }
  const db = env.DB;
  await garantirSchema(db);

  const partes = (params.path || []).map(String);
  const metodo = request.method.toUpperCase();
  const [rec, id, sub] = partes;

  // ---------- resumo ----------
  if (rec === "resumo" && metodo === "GET") {
    const [listas, etapas, modelos, itens, negocios] = await db.batch([
      db.prepare(
        `SELECT l.id, l.nome, l.cor, l.criado_em, COUNT(i.cnpj) AS total
           FROM listas l LEFT JOIN lista_itens i ON i.lista_id = l.id
          GROUP BY l.id ORDER BY l.nome COLLATE NOCASE`
      ),
      db.prepare("SELECT id, nome, cor, ordem, tipo FROM etapas ORDER BY ordem, id"),
      db.prepare("SELECT id, titulo, texto FROM modelos ORDER BY titulo COLLATE NOCASE"),
      db.prepare("SELECT lista_id, cnpj FROM lista_itens"),
      db.prepare("SELECT id, cnpj, etapa_id FROM negocios"),
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
    const atuais = (await db.prepare("SELECT id FROM etapas").all()).results.map((r) => r.id);
    const mantidas = new Set(etapas.filter((e) => e.id).map((e) => Number(e.id)));
    const removidas = atuais.filter((x) => !mantidas.has(x));
    const stmts = etapas.map((e, i) =>
      e.id
        ? db
            .prepare("UPDATE etapas SET nome = ?, cor = ?, tipo = ?, ordem = ? WHERE id = ?")
            .bind(String(e.nome).trim().slice(0, 40), e.cor || "#7a8699", e.tipo || "aberta", i + 1, Number(e.id))
        : db
            .prepare("INSERT INTO etapas (nome, cor, tipo, ordem) VALUES (?, ?, ?, ?)")
            .bind(String(e.nome).trim().slice(0, 40), e.cor || "#7a8699", e.tipo || "aberta", i + 1)
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
    const { results } = await db.prepare("SELECT id, nome, cor, ordem, tipo FROM etapas ORDER BY ordem, id").all();
    return json(results);
  }

  // ---------- negócios (funil) ----------
  if (rec === "negocios") {
    if (!id && metodo === "GET") {
      const { results } = await db
        .prepare(
          `SELECT n.*, e.dados,
                  (SELECT texto FROM atividades a WHERE a.negocio_id = n.id AND a.tipo <> 'sistema' ORDER BY a.id DESC LIMIT 1) AS ultima_atividade,
                  (SELECT COUNT(*) FROM atividades a WHERE a.negocio_id = n.id AND a.tipo <> 'sistema') AS total_atividades
             FROM negocios n JOIN empresas e ON e.cnpj = n.cnpj
            ORDER BY n.atualizado_em DESC`
        )
        .all();
      return json(
        results.map(({ dados, ...n }) => ({ ...n, empresa: JSON.parse(dados) }))
      );
    }
    if (!id && metodo === "POST") {
      const b = await corpo(request);
      const empresas = (b.empresas || []).filter((e) => soDigitos(e?.cnpj).length === 14);
      if (!empresas.length) return erro("Nenhuma empresa válida enviada.");
      let etapaId = parseInt(b.etapa_id, 10);
      if (!etapaId) {
        const primeira = await db.prepare("SELECT id FROM etapas ORDER BY ordem, id LIMIT 1").first();
        etapaId = primeira.id;
      }
      const existentes = new Set(
        (await db.prepare("SELECT cnpj FROM negocios").all()).results.map((r) => r.cnpj)
      );
      const novas = empresas.filter((e) => !existentes.has(soDigitos(e.cnpj)));
      const stmts = [];
      for (const e of novas) {
        stmts.push(upsertEmpresa(db, e));
        stmts.push(
          db
            .prepare("INSERT OR IGNORE INTO negocios (cnpj, etapa_id, origem) VALUES (?, ?, ?)")
            .bind(soDigitos(e.cnpj), etapaId, String(b.origem || "").slice(0, 80) || null)
        );
      }
      await emLotes(db, stmts);
      // registra a entrada no funil
      if (novas.length) {
        const ph = novas.map(() => "?").join(",");
        const { results } = await db
          .prepare(`SELECT id FROM negocios WHERE cnpj IN (${ph})`)
          .bind(...novas.map((e) => soDigitos(e.cnpj)))
          .all();
        await emLotes(
          db,
          results.map((r) =>
            db
              .prepare("INSERT INTO atividades (negocio_id, tipo, texto) VALUES (?, 'sistema', ?)")
              .bind(r.id, b.origem ? `Entrou no funil (origem: ${b.origem})` : "Entrou no funil")
          )
        );
      }
      return json({ ok: true, adicionados: novas.length, ja_estavam: empresas.length - novas.length });
    }

    const negId = parseInt(id, 10);
    if (!negId) return erro("Negócio inválido.");

    if (!sub && metodo === "PATCH") {
      const b = await corpo(request);
      const atual = await db.prepare("SELECT * FROM negocios WHERE id = ?").bind(negId).first();
      if (!atual) return erro("Negócio não encontrado.", 404);
      const stmts = [];
      const logs = [];
      if (b.etapa_id !== undefined && Number(b.etapa_id) !== atual.etapa_id) {
        const nova = await db.prepare("SELECT nome FROM etapas WHERE id = ?").bind(Number(b.etapa_id)).first();
        if (!nova) return erro("Etapa inválida.");
        stmts.push(db.prepare("UPDATE negocios SET etapa_id = ? WHERE id = ?").bind(Number(b.etapa_id), negId));
        logs.push(`Moveu para "${nova.nome}"`);
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
      if (!stmts.length) return json({ ok: true });
      stmts.push(db.prepare("UPDATE negocios SET atualizado_em = datetime('now') WHERE id = ?").bind(negId));
      for (const t of logs) {
        stmts.push(db.prepare("INSERT INTO atividades (negocio_id, tipo, texto) VALUES (?, 'sistema', ?)").bind(negId, t));
      }
      await db.batch(stmts);
      return json({ ok: true });
    }
    if (!sub && metodo === "DELETE") {
      await db.batch([
        db.prepare("DELETE FROM atividades WHERE negocio_id = ?").bind(negId),
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
      db.prepare("SELECT * FROM negocios WHERE cnpj = ?").bind(cnpj),
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
    if (!id && metodo === "POST") {
      const b = await corpo(request);
      if (!String(b.titulo || "").trim() || !String(b.texto || "").trim()) return erro("Preencha título e texto.");
      const r = await db
        .prepare("INSERT INTO modelos (titulo, texto) VALUES (?, ?)")
        .bind(String(b.titulo).trim().slice(0, 80), String(b.texto).slice(0, 2000))
        .run();
      return json({ id: r.meta.last_row_id }, 201);
    }
    const mId = parseInt(id, 10);
    if (mId && metodo === "PATCH") {
      const b = await corpo(request);
      await db
        .prepare("UPDATE modelos SET titulo = COALESCE(?, titulo), texto = COALESCE(?, texto) WHERE id = ?")
        .bind(b.titulo ?? null, b.texto ?? null, mId)
        .run();
      return json({ ok: true });
    }
    if (mId && metodo === "DELETE") {
      await db.prepare("DELETE FROM modelos WHERE id = ?").bind(mId).run();
      return json({ ok: true });
    }
  }

  // ---------- backup ----------
  if (rec === "backup" && metodo === "GET") {
    const tabelas = ["empresas", "listas", "lista_itens", "etapas", "negocios", "atividades", "modelos"];
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
