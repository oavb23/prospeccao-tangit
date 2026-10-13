// Motor da automação de WhatsApp: aprovação do primeiro contato, follow-ups, outro momento,
// encerramento, respostas recebidas e verificação de números. Tudo guardado no D1.

import { lerConfig, gravarConfig, marcarMudanca } from "./config.js";
import { clienteGowa, verificarNumero, variantesNumero, jidDe, ErroGowa, enviarMensagem } from "./gowa.js";
import { preencher, comRodape, fmtTelefone } from "./textos.js";
import { classificar } from "./classificar.js";
import {
  dentroDaJanela,
  somarDiasUteis,
  somarDias,
  horarioAleatorio,
  agendarEm,
  diaLocal,
  proximaAbertura,
} from "./calendario.js";
import { melhorTelefone } from "./schema.js";
import { linksPublicados, linkPublicado, linkDe, ignorarVisitas, marcarEnviadoSeTiver } from "./relatorio.js";

const USA_RELATORIO = /\{relatorio\}/;
// troca {relatorio} pelo link aprovado; sem link, o campo fica no texto (e o envio não sai)
const comRelatorio = (texto, link) => (link ? String(texto || "").replace(/\{relatorio\}/g, link) : String(texto || ""));
const slugDoLink = (link) => String(link || "").split("/").pop();

const iso = (d) => new Date(d).toISOString();
const soDigitos = (v) => String(v ?? "").replace(/\D/g, "");
const parse = (s, d = {}) => {
  try {
    return typeof s === "string" ? JSON.parse(s) : s || d;
  } catch {
    return d;
  }
};
const recorte = (s, n = 140) => {
  const t = String(s || "").replace(/\s+/g, " ").trim();
  return t.length > n ? t.slice(0, n - 1) + "…" : t;
};

// Ação agendada → modelo de mensagem usado.
export const ENVIOS = {
  enviar_primeiro: "primeiro_contato",
  enviar_followup1: "followup_1",
  enviar_followup2: "followup_2",
  enviar_retomada: "outro_momento",
};
export const ROTULO_PASSO = {
  enviar_primeiro: "Primeiro contato",
  enviar_followup1: "Follow-up",
  enviar_followup2: "Nova tentativa",
  mover_outro_momento: "Ir para Outro momento",
  enviar_retomada: "Retomada",
  encerrar: "Encerrar sem resposta",
};

// ------------------------------------------------------------------ apoio
const atividade = (db, negId, texto, tipo = "sistema") =>
  db.prepare("INSERT INTO atividades (negocio_id, tipo, texto) VALUES (?, ?, ?)").bind(negId, tipo, String(texto).slice(0, 4000));

async function etapaDoPapel(db, papel, cache) {
  if (cache && cache.has(papel)) return cache.get(papel);
  const e = await db.prepare("SELECT id, nome, tipo, papel FROM etapas WHERE papel = ? ORDER BY ordem, id LIMIT 1").bind(papel).first();
  if (cache) cache.set(papel, e);
  return e;
}

async function modeloDoPasso(db, passo) {
  const m = await db.prepare("SELECT texto FROM modelos WHERE passo = ? ORDER BY id LIMIT 1").bind(passo).first();
  return m?.texto || "";
}

async function contagemDoDia(db, cfg, agora) {
  const dia = diaLocal(agora);
  let c = parse(cfg.contagem, {});
  if (c.dia !== dia) c = { dia, novos: 0, envios: 0, verificacoes: 0 };
  return c;
}

const empresaDe = (linha) => (linha?.empresa_dados ? parse(linha.empresa_dados, null) : null);

// Texto do primeiro contato como vai sair (modelo preenchido + aviso de descadastro).
export async function textoPrimeiroContato(db, cfg, neg, empresa, link = null) {
  const modelo = await modeloDoPasso(db, "primeiro_contato");
  if (link === null) link = await linkPublicado(db, cfg, neg.id);
  return comRodape(preencher(modelo, neg, empresa, link ? { relatorio: link } : {}), cfg.rodape_descadastro);
}

// O que acontece depois de cada envio.
function depoisDoEnvio(acao, agora, cfg) {
  switch (acao) {
    case "enviar_primeiro":
      return { passo: "enviar_followup1", em: horarioAleatorio(somarDiasUteis(agora, cfg.followup1_dias_uteis, cfg), cfg) };
    case "enviar_followup1":
      return { passo: "enviar_followup2", em: agendarEm(somarDias(agora, cfg.followup2_dias), cfg) };
    case "enviar_followup2":
      return { passo: "mover_outro_momento", em: somarDiasUteis(agora, cfg.sem_resposta_dias_uteis, cfg) };
    case "enviar_retomada":
      return { passo: "encerrar", em: somarDias(agora, cfg.encerrar_dias) };
    default:
      return { passo: null, em: null };
  }
}

// ------------------------------------------------------------------ mudança de etapa (manual ou automática)
// Devolve os comandos para manter a automação coerente com a etapa nova.
export function efeitosDaEtapa(db, neg, etapa, cfg, agora = new Date()) {
  const stmts = [];
  const set = (campos) => {
    const chaves = Object.keys(campos);
    stmts.push(
      db.prepare(`UPDATE negocios SET ${chaves.map((k) => `${k} = ?`).join(", ")}, atualizado_em = datetime('now') WHERE id = ?`).bind(...chaves.map((k) => campos[k]), neg.id)
    );
  };
  if (!etapa) return stmts;
  if (etapa.papel === "entrada") {
    if (neg.automacao !== "inativa") set({ automacao: "inativa", passo: null, proxima_acao_em: null, mensagem_inicial: null });
  } else if (etapa.papel === "outro_momento") {
    if (!neg.optout && neg.wa_status === "tem") {
      const em = agendarEm(somarDias(agora, cfg.outro_momento_dias), cfg);
      set({ automacao: "ativa", passo: "enviar_retomada", proxima_acao_em: iso(em) });
      stmts.push(atividade(db, neg.id, `Outro momento: nova mensagem agendada para ${em.toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" })}`));
    } else if (neg.automacao === "ativa") {
      set({ automacao: "assumida", passo: null, proxima_acao_em: null });
    }
  } else if (etapa.tipo === "ganho" || etapa.tipo === "perdido" || etapa.papel === "ganho" || etapa.papel === "perdido") {
    if (neg.automacao !== "encerrada") set({ automacao: "encerrada", passo: null, proxima_acao_em: null });
  } else if (["ativa", "respondeu", "pausada"].includes(neg.automacao)) {
    set({ automacao: "assumida", passo: null, proxima_acao_em: null });
  }
  return stmts;
}

async function moverParaPapel(db, neg, papel, cfg, agora, extra = {}) {
  const etapa = await etapaDoPapel(db, papel, extra.cache);
  if (!etapa) return [];
  const stmts = [];
  if (etapa.id !== neg.etapa_id) {
    stmts.push(db.prepare("UPDATE negocios SET etapa_id = ?, atualizado_em = datetime('now') WHERE id = ?").bind(etapa.id, neg.id));
    stmts.push(atividade(db, neg.id, `Moveu para "${etapa.nome}"`));
  }
  if (extra.motivo) stmts.push(db.prepare("UPDATE negocios SET motivo_perda = ? WHERE id = ?").bind(extra.motivo, neg.id));
  if (!extra.semEfeitos) stmts.push(...efeitosDaEtapa(db, neg, etapa, cfg, agora));
  return stmts;
}

// ------------------------------------------------------------------ aprovação e ações manuais
export async function aprovar(db, itens, agora = new Date()) {
  let aprovados = 0;
  let semRelatorio = 0;
  const cfg = await lerConfig(db);
  const stmts = [];
  const pedidos = (itens || [])
    .map((it) => ({ id: Number(it.negocio_id), texto: String(it.texto || "").trim().slice(0, 4000) }))
    .filter((it) => it.id && it.texto)
    .slice(0, 300);
  // uma consulta por bloco de 90 (limite de consultas e de parâmetros por requisição no plano gratuito)
  const negs = new Map();
  for (let i = 0; i < pedidos.length; i += 90) {
    const ids = pedidos.slice(i, i + 90).map((p) => p.id);
    const { results } = await db
      .prepare(`SELECT id, automacao, wa_status, optout FROM negocios WHERE id IN (${ids.map(() => "?").join(",")})`)
      .bind(...ids)
      .all();
    for (const r of results) negs.set(r.id, r);
  }
  const links = await linksPublicados(db, cfg, pedidos.map((p) => p.id));
  for (const pedido of pedidos) {
    const { id } = pedido;
    const neg = negs.get(id);
    if (!neg || neg.automacao !== "inativa" || neg.wa_status !== "tem" || neg.optout) continue;
    // a mensagem usa o pré-relatório: só aprova com ele no ar. O texto fica guardado com {relatorio}
    // (o link entra na hora do envio; se o relatório sair do ar antes, o envio pausa em vez de mandar link morto)
    const link = links.get(id)?.link;
    const texto = link ? pedido.texto.split(link).join("{relatorio}") : pedido.texto;
    if (USA_RELATORIO.test(texto) && !link) {
      semRelatorio++;
      continue;
    }
    neg.automacao = "ativa"; // o mesmo contato repetido no pedido não é aprovado duas vezes
    stmts.push(
      db
        .prepare(
          "UPDATE negocios SET automacao = 'ativa', passo = 'enviar_primeiro', proxima_acao_em = ?, mensagem_inicial = ?, tentativas_erro = 0, atualizado_em = datetime('now') WHERE id = ? AND automacao = 'inativa'"
        )
        .bind(iso(agora), texto, id),
      atividade(db, id, "Primeiro contato aprovado — sai no próximo horário de envio")
    );
    aprovados++;
  }
  for (let i = 0; i < stmts.length; i += 80) await db.batch(stmts.slice(i, i + 80));
  if (aprovados) await marcarMudanca(db);
  return { aprovados, sem_relatorio: semRelatorio };
}

export async function acaoManual(env, negId, acao, agora = new Date()) {
  const db = env.DB;
  const cfg = await lerConfig(db);
  const neg = await db.prepare("SELECT * FROM negocios WHERE id = ?").bind(negId).first();
  if (!neg) throw new Error("Negócio não encontrado.");
  const stmts = [];
  const set = (campos) => {
    const chaves = Object.keys(campos);
    stmts.push(
      db.prepare(`UPDATE negocios SET ${chaves.map((k) => `${k} = ?`).join(", ")}, atualizado_em = datetime('now') WHERE id = ?`).bind(...chaves.map((k) => campos[k]), negId)
    );
  };
  switch (acao) {
    case "pausar":
      if (neg.automacao !== "ativa") throw new Error("A automação não está rodando para este contato.");
      set({ automacao: "pausada" });
      stmts.push(atividade(db, negId, "Automação pausada"));
      break;
    case "retomar": {
      if (neg.automacao !== "pausada") throw new Error("A automação não está pausada.");
      if (!neg.passo) throw new Error("Não há próximo passo para retomar.");
      const em = neg.proxima_acao_em && neg.proxima_acao_em > iso(agora) ? neg.proxima_acao_em : iso(agora);
      set({ automacao: "ativa", proxima_acao_em: em, tentativas_erro: 0 });
      stmts.push(atividade(db, negId, "Automação retomada"));
      break;
    }
    case "assumir":
      set({ automacao: "assumida", passo: null, proxima_acao_em: null, nao_lidas: 0 });
      stmts.push(atividade(db, negId, "Você assumiu a conversa — sem mensagens automáticas"));
      break;
    case "outro_momento":
      stmts.push(...(await moverParaPapel(db, neg, "outro_momento", cfg, agora)));
      set({ nao_lidas: 0 });
      break;
    case "desqualificar":
      stmts.push(...(await moverParaPapel(db, neg, "perdido", cfg, agora, { motivo: "Desqualificado" })));
      set({ nao_lidas: 0 });
      break;
    case "reabrir": {
      if (neg.optout) throw new Error("Este contato pediu para não receber mensagens.");
      if (String(neg.passo || "").startsWith("enviando:")) throw new Error("A mensagem está saindo agora. Tente de novo em alguns segundos.");
      const naoSaiu = neg.automacao === "ativa" && neg.passo === "enviar_primeiro";
      stmts.push(...(await moverParaPapel(db, neg, "entrada", cfg, agora, { semEfeitos: true })));
      set({ automacao: "inativa", passo: null, proxima_acao_em: null, mensagem_inicial: naoSaiu ? neg.mensagem_inicial : null, tentativas_erro: 0 });
      stmts.push(atividade(db, negId, naoSaiu ? "Envio cancelado — voltou para a fila de aprovação" : "Voltou para a fila de aprovação"));
      break;
    }
    case "continuar": {
      // a "resposta" era automática (ex.: saudação que chegou atrasada): volta para a sequência de onde parou
      if (neg.automacao !== "respondeu") throw new Error("A sequência só pode continuar depois de uma resposta.");
      const ult = await db
        .prepare("SELECT passo, criado_em FROM mensagens WHERE negocio_id = ? AND direcao = 'saida' AND origem = 'automacao' ORDER BY id DESC LIMIT 1")
        .bind(negId)
        .first();
      const prox = ult?.passo ? depoisDoEnvio(ult.passo, new Date(ult.criado_em), cfg) : { passo: null };
      if (!prox.passo) throw new Error("Nenhuma mensagem automática foi enviada para este contato.");
      const em = prox.em && prox.em > agora ? prox.em : agora;
      stmts.push(...(await moverParaPapel(db, neg, ult.passo === "enviar_retomada" ? "outro_momento" : "contato", cfg, agora, { semEfeitos: true })));
      set({ automacao: "ativa", passo: prox.passo, proxima_acao_em: iso(em), nao_lidas: 0, tentativas_erro: 0 });
      stmts.push(
        db
          .prepare("UPDATE mensagens SET classificacao = 'automatica' WHERE id = (SELECT id FROM mensagens WHERE negocio_id = ? AND direcao = 'entrada' ORDER BY id DESC LIMIT 1)")
          .bind(negId),
        atividade(db, negId, "Era resposta automática — a sequência continua")
      );
      break;
    }
    case "verificar":
      set({ wa_status: null, wa_numero: null, wa_nome: null });
      break;
    case "lidas":
      set({ nao_lidas: 0 });
      break;
    default:
      throw new Error("Ação inválida.");
  }
  if (stmts.length) await db.batch(stmts);
  if (acao === "verificar") {
    const r = await verificarPendentes(env, cfg, { ids: [negId], limite: 1, agora, ignorarLimiteDiario: true });
    await marcarMudanca(db);
    return { ok: true, verificacao: r };
  }
  await marcarMudanca(db);
  return { ok: true };
}

// ------------------------------------------------------------------ verificação de números
export async function verificarPendentes(env, cfg, { ids = null, limite = 3, agora = new Date(), ignorarLimiteDiario = false } = {}) {
  const db = env.DB;
  const saida = { verificados: 0, com_whatsapp: 0, sem_whatsapp: 0, erro: null };
  if (!cfg.gowa_url) return { ...saida, erro: "Gowa não configurada" };
  const c = await contagemDoDia(db, cfg, agora);
  const maxDia = Number(cfg.verificacoes_por_dia) || 0;
  if (!ignorarLimiteDiario && c.verificacoes >= maxDia) return { ...saida, erro: "Limite diário de verificações atingido" };
  const filtroIds = ids?.length ? `AND n.id IN (${ids.map(() => "?").join(",")})` : "";
  const { results } = await db
    .prepare(
      `SELECT n.id, n.telefone, n.telefone_manual, n.fonte, e.dados AS empresa_dados FROM negocios n
         LEFT JOIN empresas e ON e.cnpj = n.cnpj
         LEFT JOIN etapas et ON et.id = n.etapa_id
        WHERE n.wa_status IS NULL AND n.optout = 0 AND COALESCE(et.tipo, 'aberta') = 'aberta' ${filtroIds}
        ORDER BY (et.papel = 'entrada') DESC, n.id LIMIT ?`
    )
    .bind(...(ids || []), Math.max(1, Math.min(limite, ignorarLimiteDiario ? limite : maxDia - c.verificacoes)))
    .all();
  if (!results.length) return saida;
  const gowa = clienteGowa(cfg);
  for (const n of results) {
    const empresa = empresaDe(n);
    // número informado à mão: confere só ele (não volta para o número da Receita, que pode ser do contador)
    const candidatos = (n.telefone_manual ? [n.telefone] : [n.telefone, empresa?.ddd_telefone_1, empresa?.ddd_telefone_2]).filter(Boolean);
    if (!candidatos.length) {
      await db.batch([
        db.prepare("UPDATE negocios SET wa_status = 'sem_numero', wa_verificado_em = ?, atualizado_em = datetime('now') WHERE id = ?").bind(iso(agora), n.id),
      ]);
      continue;
    }
    let r;
    try {
      r = await verificarNumero(gowa, candidatos);
    } catch (e) {
      saida.erro = e.message;
      if (e instanceof ErroGowa && e.desconectado) await gravarConfig(db, { gowa_alerta: e.message });
      break;
    }
    saida.verificados++;
    c.verificacoes++;
    if (r.tem) {
      saida.com_whatsapp++;
      const tel = soDigitos(r.original);
      await db.batch([
        db
          .prepare("UPDATE negocios SET wa_status = 'tem', wa_numero = ?, wa_nome = ?, telefone = ?, wa_verificado_em = ?, atualizado_em = datetime('now') WHERE id = ?")
          .bind(r.numero, r.nome || null, tel.startsWith("55") ? tel : "55" + tel, iso(agora), n.id),
        atividade(db, n.id, `WhatsApp encontrado: ${fmtTelefone(r.numero)}${r.nome ? ` (${r.nome})` : ""}`),
      ]);
    } else {
      saida.sem_whatsapp++;
      await db.batch([
        db.prepare("UPDATE negocios SET wa_status = 'nao_tem', wa_verificado_em = ?, atualizado_em = datetime('now') WHERE id = ?").bind(iso(agora), n.id),
        atividade(db, n.id, "Nenhum dos números da empresa tem WhatsApp"),
      ]);
    }
  }
  await gravarConfig(db, { contagem: JSON.stringify(c), ...(saida.erro ? {} : { gowa_alerta: "" }) });
  return saida;
}

// ------------------------------------------------------------------ relógio (chamado a cada 2 minutos)
export async function rodarRelogio(env, opcoes = {}) {
  const r = await passoDoRelogio(env, opcoes);
  if (r.movidos || r.enviados || r.verificacao?.verificados) await marcarMudanca(env.DB);
  return r;
}

async function passoDoRelogio(env, { agora = new Date(), sorteio = Math.random } = {}) {
  const db = env.DB;
  let cfg = await lerConfig(db);
  const resumo = { agora: iso(agora), movidos: 0, enviados: 0, verificacao: null, motivo: null };
  await gravarConfig(db, { ultimo_relogio: iso(agora) });
  // conferir quais números têm WhatsApp prepara a fila de aprovação: roda mesmo com a automação desligada,
  // mas só depois que o WhatsApp já foi conectado uma vez (antes disso a Gowa ainda está sendo instalada)
  if (cfg.gowa_url && cfg.gowa_ok_em) {
    resumo.verificacao = await verificarPendentes(env, cfg, { limite: 3, agora });
    cfg = await lerConfig(db);
  }
  if (cfg.automacao_ligada !== "1") return { ...resumo, motivo: "Automação desligada em Ajustes" };

  // destrava envios que ficaram presos (queda no meio do envio)
  await db
    .prepare("UPDATE negocios SET passo = substr(passo, 10) WHERE automacao = 'ativa' AND passo LIKE 'enviando:%' AND atualizado_em < ?")
    .bind(new Date(agora.getTime() - 10 * 60000).toISOString().replace("T", " ").slice(0, 19))
    .run();

  // 1) mudanças sem envio: ir para Outro momento e encerrar sem resposta (valem a qualquer hora)
  const { results: internos } = await db
    .prepare(
      "SELECT * FROM negocios WHERE automacao = 'ativa' AND passo IN ('mover_outro_momento', 'encerrar') AND proxima_acao_em <= ? ORDER BY proxima_acao_em LIMIT 5"
    )
    .bind(iso(agora))
    .all();
  const cache = new Map();
  for (const neg of internos) {
    if (neg.passo === "mover_outro_momento") {
      const stmts = await moverParaPapel(db, neg, "outro_momento", cfg, agora, { semEfeitos: true, cache });
      const em = agendarEm(somarDias(agora, cfg.outro_momento_dias), cfg, sorteio);
      stmts.push(
        db.prepare("UPDATE negocios SET passo = 'enviar_retomada', proxima_acao_em = ?, atualizado_em = datetime('now') WHERE id = ?").bind(iso(em), neg.id),
        atividade(db, neg.id, `Sem resposta às tentativas. Nova mensagem em ${em.toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" })}`)
      );
      await db.batch(stmts);
    } else {
      const stmts = await moverParaPapel(db, neg, "perdido", cfg, agora, { motivo: "Sem resposta", semEfeitos: true, cache });
      stmts.push(
        db.prepare("UPDATE negocios SET automacao = 'encerrada', passo = NULL, proxima_acao_em = NULL, atualizado_em = datetime('now') WHERE id = ?").bind(neg.id),
        atividade(db, neg.id, "Encerrado: não respondeu à retomada")
      );
      await db.batch(stmts);
    }
    resumo.movidos++;
  }

  // 2) um envio por vez, só em dia útil e dentro do horário, respeitando intervalo e limites
  if (!cfg.gowa_url) return { ...resumo, motivo: "Gowa não configurada" };
  if (!dentroDaJanela(agora, cfg)) return { ...resumo, motivo: "Fora do horário de envio", proxima_abertura: iso(proximaAbertura(agora, cfg)) };
  if (cfg.proximo_envio_em && cfg.proximo_envio_em > iso(agora)) return { ...resumo, motivo: "Aguardando o intervalo entre envios", proximo_envio_em: cfg.proximo_envio_em };
  const c = await contagemDoDia(db, cfg, agora);
  if (c.envios >= Number(cfg.envios_por_dia)) return { ...resumo, motivo: "Limite diário de envios atingido" };
  const podeNovo = c.novos < Number(cfg.novos_por_dia);
  const passos = Object.keys(ENVIOS).filter((p) => podeNovo || p !== "enviar_primeiro");
  const { results: fila } = await db
    .prepare(
      `SELECT n.*, e.dados AS empresa_dados FROM negocios n LEFT JOIN empresas e ON e.cnpj = n.cnpj
        WHERE n.automacao = 'ativa' AND n.optout = 0 AND n.passo IN (${passos.map(() => "?").join(",")}) AND n.proxima_acao_em <= ?
        ORDER BY (n.passo = 'enviar_primeiro'), n.proxima_acao_em LIMIT 5`
    )
    .bind(...passos, iso(agora))
    .all();
  if (!fila.length) return { ...resumo, motivo: podeNovo ? "Nada para enviar agora" : "Limite diário de primeiros contatos atingido" };

  const gowa = clienteGowa(cfg);
  for (const neg of fila) {
    const r = await enviarPasso(env, cfg, gowa, neg, agora, sorteio);
    if (r === "enviado") {
      resumo.enviados++;
      c.envios++;
      if (neg.passo === "enviar_primeiro") c.novos++;
      const intervalo = Math.max(1, Number(cfg.intervalo_min) || 1);
      const proximo = new Date(agora.getTime() + (intervalo + sorteio() * intervalo) * 60000);
      await gravarConfig(db, { contagem: JSON.stringify(c), proximo_envio_em: iso(proximo), gowa_alerta: "" });
      resumo.proximo_envio_em = iso(proximo);
      break;
    }
    if (r === "desconectado") {
      resumo.motivo = "WhatsApp desconectado da Gowa";
      break;
    }
  }
  return resumo;
}

// Envia a mensagem do passo atual de um negócio. Devolve "enviado", "falhou", "desconectado" ou "ocupado".
async function enviarPasso(env, cfg, gowa, neg, agora, sorteio) {
  const db = env.DB;
  const acao = neg.passo;
  const trava = await db
    .prepare("UPDATE negocios SET passo = ?, atualizado_em = datetime('now') WHERE id = ? AND passo = ? AND automacao = 'ativa'")
    .bind("enviando:" + acao, neg.id, acao)
    .run();
  if (trava.meta.changes !== 1) return "ocupado";
  const destravar = (extra = "") =>
    db.prepare(`UPDATE negocios SET passo = ?${extra}, atualizado_em = datetime('now') WHERE id = ?`).bind(acao, neg.id);

  const empresa = empresaDe(neg);
  const link = await linkPublicado(db, cfg, neg.id);
  let texto;
  if (acao === "enviar_primeiro" && neg.mensagem_inicial) texto = comRelatorio(neg.mensagem_inicial, link);
  else {
    texto = preencher(await modeloDoPasso(db, ENVIOS[acao]), neg, empresa, link ? { relatorio: link } : {});
    if (acao === "enviar_primeiro") texto = comRodape(texto, cfg.rodape_descadastro);
  }
  const faltaRelatorio = USA_RELATORIO.test(texto);
  if (!texto || !neg.wa_numero || faltaRelatorio) {
    await db.batch([
      destravar(),
      db.prepare("UPDATE negocios SET automacao = 'pausada' WHERE id = ?").bind(neg.id),
      atividade(
        db,
        neg.id,
        !texto
          ? `Automação pausada: o modelo "${ROTULO_PASSO[acao]}" está vazio (Ajustes → Mensagens da automação)`
          : faltaRelatorio
            ? `Automação pausada: a mensagem "${ROTULO_PASSO[acao]}" usa {relatorio}, mas o pré-relatório deste contato não está aprovado`
            : "Automação pausada: sem número de WhatsApp verificado"
      ),
    ]);
    return "falhou";
  }

  let res;
  const levaLink = link && texto.includes(link);
  try {
    if (levaLink) await ignorarVisitas(db, neg.id).run();
    res = await enviarMensagem(gowa, jidDe(neg.wa_numero), texto, levaLink ? link : "");
  } catch (e) {
    if (e instanceof ErroGowa && e.desconectado) {
      await db.batch([destravar()]);
      await gravarConfig(db, { gowa_alerta: e.message });
      return "desconectado";
    }
    const tentativas = (neg.tentativas_erro || 0) + 1;
    const stmts = [destravar(", tentativas_erro = tentativas_erro + 1")];
    if (tentativas >= 3) {
      stmts.push(
        db.prepare("UPDATE negocios SET automacao = 'pausada' WHERE id = ?").bind(neg.id),
        atividade(db, neg.id, `Automação pausada depois de 3 erros ao enviar: ${recorte(e.message)}`)
      );
    } else {
      stmts.push(db.prepare("UPDATE negocios SET proxima_acao_em = ? WHERE id = ?").bind(iso(new Date(agora.getTime() + 30 * 60000)), neg.id));
    }
    await db.batch(stmts);
    return "falhou";
  }

  const proximo = depoisDoEnvio(acao, agora, cfg);
  if (proximo.em && acao === "enviar_primeiro") proximo.em = horarioAleatorio(somarDiasUteis(agora, cfg.followup1_dias_uteis, cfg), cfg, sorteio);
  const stmts = [
    db
      .prepare(
        "INSERT INTO mensagens (negocio_id, direcao, origem, passo, texto, wa_id, status, criado_em) VALUES (?, 'saida', 'automacao', ?, ?, ?, 'enviada', ?)"
      )
      .bind(neg.id, acao, texto, res?.message_id || null, iso(agora)),
    db
      .prepare(
        "UPDATE negocios SET passo = ?, proxima_acao_em = ?, ultimo_envio_em = ?, tentativas_erro = 0, atualizado_em = datetime('now') WHERE id = ?"
      )
      .bind(proximo.passo, proximo.em ? iso(proximo.em) : null, iso(agora), neg.id),
    atividade(db, neg.id, `WhatsApp automático — ${ROTULO_PASSO[acao]}: “${recorte(texto, 90)}”`, "whatsapp"),
    ...marcarEnviadoSeTiver(db, neg.id, texto, slugDoLink(link)),
  ];
  if (acao === "enviar_primeiro") stmts.push(...(await moverParaPapel(db, neg, "contato", cfg, agora, { semEfeitos: true })));
  await db.batch(stmts);
  return "enviado";
}

// ------------------------------------------------------------------ envio manual pelo sistema
export async function enviarManual(env, negId, texto, agora = new Date()) {
  const db = env.DB;
  const cfg = await lerConfig(db);
  const neg = await db.prepare("SELECT * FROM negocios WHERE id = ?").bind(negId).first();
  if (!neg) throw new Error("Negócio não encontrado.");
  const t = String(texto || "").trim().slice(0, 4000);
  if (!t) throw new Error("Escreva a mensagem.");
  const numero = neg.wa_numero || variantesNumero(neg.telefone)[0];
  if (!numero) throw new Error("Este contato não tem número de WhatsApp.");
  const link = await linkPublicado(db, cfg, negId);
  if (USA_RELATORIO.test(t) && !link) throw new Error("A mensagem tem {relatorio}, mas o pré-relatório deste contato não está aprovado.");
  const final = comRelatorio(t, link);
  const levaLink = link && final.includes(link);
  if (levaLink) await ignorarVisitas(db, negId).run();
  const res = await enviarMensagem(clienteGowa(cfg), jidDe(numero), final, levaLink ? link : "");
  const stmts = [
    db
      .prepare("INSERT INTO mensagens (negocio_id, direcao, origem, texto, wa_id, status, criado_em) VALUES (?, 'saida', 'crm', ?, ?, 'enviada', ?)")
      .bind(negId, final, res?.message_id || null, iso(agora)),
    db.prepare("UPDATE negocios SET nao_lidas = 0, wa_numero = COALESCE(wa_numero, ?), atualizado_em = datetime('now') WHERE id = ?").bind(numero, negId),
    ...marcarEnviadoSeTiver(db, negId, final, slugDoLink(link)),
  ];
  if (["ativa", "respondeu"].includes(neg.automacao)) {
    stmts.push(
      db.prepare("UPDATE negocios SET automacao = 'assumida', passo = NULL, proxima_acao_em = NULL WHERE id = ?").bind(negId),
      atividade(db, negId, "Você respondeu pelo sistema — a automação parou para este contato")
    );
  }
  await db.batch(stmts);
  await marcarMudanca(db);
  return { ok: true, message_id: res?.message_id || null };
}

// ------------------------------------------------------------------ webhook da Gowa
const MIDIA = { audio: "[áudio]", image: "[imagem]", video: "[vídeo]", document: "[documento]", sticker: "[figurinha]", contact: "[contato]", contacts_array: "[contatos]", location: "[localização]", live_location: "[localização]", video_note: "[vídeo]" };

function textoDaMensagem(p) {
  if (p.body) return String(p.body);
  for (const [k, v] of Object.entries(MIDIA)) if (p[k]) return v;
  return "[mensagem]";
}

const usuarioDoJid = (jid) => String(jid || "").split("@")[0].split(":")[0];

async function acharNegocio(db, numero, lid) {
  const vars = numero ? variantesNumero(numero) : [];
  const conds = [];
  const binds = [];
  if (vars.length) {
    conds.push(`wa_numero IN (${vars.map(() => "?").join(",")})`, `telefone IN (${vars.map(() => "?").join(",")})`);
    binds.push(...vars, ...vars);
  }
  if (lid) {
    conds.push("wa_lid = ?");
    binds.push(lid);
  }
  if (!conds.length) return null;
  return db
    .prepare(`SELECT * FROM negocios WHERE ${conds.join(" OR ")} ORDER BY (automacao = 'encerrada'), atualizado_em DESC LIMIT 1`)
    .bind(...binds)
    .first();
}

export async function processarWebhook(env, dados) {
  const r = await tratarEvento(env, dados);
  if (r && !r.ignorado) await marcarMudanca(env.DB);
  return r;
}

async function tratarEvento(env, dados) {
  const db = env.DB;
  const ev = dados?.event;
  const p = dados?.payload || {};
  if (ev === "message.ack") return processarRecibo(db, dados);
  if (ev !== "message") return { ignorado: `evento ${ev}` };

  const chat = String(p.chat_id || "");
  if (!chat || /@(g\.us|newsletter|broadcast)$/.test(chat) || chat.startsWith("status@")) return { ignorado: "grupo, canal ou status" };
  const deMim = !!p.is_from_me;
  const contraparte = deMim ? chat : String(p.from || chat);
  const lid = contraparte.endsWith("@lid") ? contraparte : p.from_lid && !deMim ? String(p.from_lid) : null;
  const numero = contraparte.endsWith("@s.whatsapp.net") ? usuarioDoJid(contraparte) : chat.endsWith("@s.whatsapp.net") ? usuarioDoJid(chat) : null;

  const neg = await acharNegocio(db, numero, lid);
  if (!neg) return { ignorado: "contato fora do funil" };
  if (p.id) {
    const ja = await db.prepare("SELECT id FROM mensagens WHERE wa_id = ? LIMIT 1").bind(String(p.id)).first();
    if (ja) return { ignorado: "mensagem já registrada" };
  }
  const texto = textoDaMensagem(p);
  const quando = p.timestamp && !isNaN(Date.parse(p.timestamp)) ? new Date(p.timestamp) : new Date();
  const cfg = await lerConfig(db);
  const stmts = [];
  const atual = { numero: numero && !neg.wa_numero ? numero : neg.wa_numero, lid: lid || neg.wa_lid };
  stmts.push(
    db
      .prepare("UPDATE negocios SET wa_numero = ?, wa_lid = ?, wa_status = 'tem' WHERE id = ?")
      .bind(atual.numero || null, atual.lid || null, neg.id)
  );

  if (deMim) {
    stmts.push(
      db
        .prepare("INSERT INTO mensagens (negocio_id, direcao, origem, texto, wa_id, status, criado_em) VALUES (?, 'saida', 'celular', ?, ?, 'enviada', ?)")
        .bind(neg.id, texto, p.id || null, iso(quando))
    );
    if (/-relatorio-\d{6}/.test(texto)) {
      const r = await db.prepare("SELECT slug FROM relatorios WHERE negocio_id = ? AND publicado IS NOT NULL").bind(neg.id).first();
      stmts.push(...marcarEnviadoSeTiver(db, neg.id, texto, r?.slug));
    }
    if (["ativa", "respondeu"].includes(neg.automacao)) {
      stmts.push(
        db.prepare("UPDATE negocios SET automacao = 'assumida', passo = NULL, proxima_acao_em = NULL, nao_lidas = 0, atualizado_em = datetime('now') WHERE id = ?").bind(neg.id),
        atividade(db, neg.id, "Você mandou mensagem pelo WhatsApp — a automação parou para este contato")
      );
    }
    await db.batch(stmts);
    return { ok: true, negocio_id: neg.id, tipo: "sua_mensagem" };
  }

  // resposta do contato: quanto tempo depois do nosso último envio?
  const ultimo = await db
    .prepare("SELECT criado_em FROM mensagens WHERE negocio_id = ? AND direcao = 'saida' ORDER BY id DESC LIMIT 1")
    .bind(neg.id)
    .first();
  const segundos = ultimo ? (quando.getTime() - Date.parse(ultimo.criado_em)) / 1000 : null;
  const { tipo } = await classificar(texto, segundos, cfg, env);
  stmts.push(
    db
      .prepare(
        "INSERT INTO mensagens (negocio_id, direcao, origem, texto, wa_id, status, classificacao, criado_em) VALUES (?, 'entrada', 'lead', ?, ?, 'recebida', ?, ?)"
      )
      .bind(neg.id, texto, p.id || null, tipo, iso(quando))
  );

  if (tipo === "automatica") {
    await db.batch(stmts);
    return { ok: true, negocio_id: neg.id, tipo };
  }

  stmts.push(
    db.prepare("UPDATE negocios SET nao_lidas = nao_lidas + 1, ultima_resposta_em = ?, atualizado_em = datetime('now') WHERE id = ?").bind(iso(quando), neg.id)
  );
  if (neg.optout) {
    await db.batch(stmts);
    return { ok: true, negocio_id: neg.id, tipo, obs: "contato descadastrado" };
  }
  if (tipo === "descadastro") {
    stmts.push(
      db.prepare("UPDATE negocios SET optout = 1, automacao = 'encerrada', passo = NULL, proxima_acao_em = NULL WHERE id = ?").bind(neg.id),
      atividade(db, neg.id, `Pediu para não receber mensagens: “${recorte(texto, 90)}”`),
      ...(await moverParaPapel(db, neg, "perdido", cfg, quando, { motivo: "Pediu para não receber mensagens", semEfeitos: true }))
    );
    await db.batch(stmts);
    return { ok: true, negocio_id: neg.id, tipo };
  }

  // resposta de pessoa: a automação para e o card vai para a conversa
  stmts.push(atividade(db, neg.id, `Respondeu no WhatsApp: “${recorte(texto, 120)}”`, "whatsapp"));
  if (["ativa", "pausada", "encerrada"].includes(neg.automacao)) {
    stmts.push(db.prepare("UPDATE negocios SET automacao = 'respondeu', passo = NULL, proxima_acao_em = NULL WHERE id = ?").bind(neg.id));
    const et = await db.prepare("SELECT papel, tipo FROM etapas WHERE id = ?").bind(neg.etapa_id).first();
    if (!et || ["entrada", "contato", "outro_momento"].includes(et.papel) || et.tipo !== "aberta") {
      stmts.push(...(await moverParaPapel(db, neg, "conversa", cfg, quando, { semEfeitos: true })));
    }
  }
  await db.batch(stmts);
  return { ok: true, negocio_id: neg.id, tipo };
}

async function processarRecibo(db, dados) {
  const p = dados.payload || {};
  const ids = (p.ids || []).map(String).filter(Boolean);
  if (!ids.length) return { ignorado: "recibo sem ids" };
  const tipo = String(p.receipt_type || "");
  const ph = ids.map(() => "?").join(",");
  if (usuarioDoJid(p.from) && usuarioDoJid(p.from) === usuarioDoJid(dados.device_id)) {
    // você leu a mensagem do contato no celular (ou no WhatsApp Web): some o aviso de "nova" no sistema
    if (tipo !== "read" && tipo !== "read-self") return { ignorado: "recibo seu" };
    const r = await db
      .prepare(`UPDATE negocios SET nao_lidas = 0 WHERE nao_lidas > 0 AND id IN (SELECT negocio_id FROM mensagens WHERE direcao = 'entrada' AND wa_id IN (${ph}))`)
      .bind(...ids)
      .run();
    return r.meta.changes ? { ok: true, recibo: "lida por você" } : { ignorado: "nada para marcar como lido" };
  }
  if (tipo === "delivered") {
    await db.prepare(`UPDATE mensagens SET status = 'entregue' WHERE direcao = 'saida' AND status = 'enviada' AND wa_id IN (${ph})`).bind(...ids).run();
  } else if (tipo === "read" || tipo === "played") {
    await db.prepare(`UPDATE mensagens SET status = 'lida' WHERE direcao = 'saida' AND status IN ('enviada', 'entregue') AND wa_id IN (${ph})`).bind(...ids).run();
  }
  return { ok: true, recibo: tipo };
}

// ------------------------------------------------------------------ telas: fila de aprovação e painel
export async function filaDeAprovacao(db) {
  const cfg = await lerConfig(db);
  const modelo = await modeloDoPasso(db, "primeiro_contato");
  const { results } = await db
    .prepare(
      `SELECT n.*, e.dados AS empresa_dados FROM negocios n
         JOIN etapas et ON et.id = n.etapa_id
         LEFT JOIN empresas e ON e.cnpj = n.cnpj
        WHERE et.papel = 'entrada' AND n.automacao = 'inativa' AND n.optout = 0
        ORDER BY n.criado_em, n.id LIMIT 300`
    )
    .all();
  const itens = [];
  const usaNoModelo = USA_RELATORIO.test(modelo);
  const rels = await linksPublicados(db, cfg, results.map((n) => n.id));
  for (const n of results) {
    const empresa = empresaDe(n);
    const rel = rels.get(n.id) || { status: "nenhum", link: "" };
    const texto = n.mensagem_inicial ? comRelatorio(n.mensagem_inicial, rel.link) : comRodape(preencher(modelo, n, empresa, rel.link ? { relatorio: rel.link } : {}), cfg.rodape_descadastro);
    itens.push({
      id: n.id,
      cnpj: n.cnpj,
      fonte: n.fonte,
      nome: empresa ? empresa.nome_fantasia || empresa.razao_social : n.contato_nome,
      razao_social: empresa?.razao_social || "",
      cidade: empresa?.municipio || "",
      uf: empresa?.uf || "",
      segmento: empresa?.cnae_fiscal_descricao || "",
      telefone: n.telefone,
      wa_status: n.wa_status,
      wa_numero: n.wa_numero,
      wa_nome: n.wa_nome,
      texto,
      relatorio: { status: rel.status, link: rel.link, visualizacoes: rel.visualizacoes || 0 },
      falta_relatorio: USA_RELATORIO.test(texto),
    });
  }
  const { results: ag } = await db
    .prepare(
      `SELECT n.id, n.cnpj, n.contato_nome, n.proxima_acao_em, n.wa_numero, n.wa_nome, e.dados AS empresa_dados FROM negocios n LEFT JOIN empresas e ON e.cnpj = n.cnpj
        WHERE n.automacao = 'ativa' AND n.passo IN ('enviar_primeiro', 'enviando:enviar_primeiro') ORDER BY n.proxima_acao_em, n.id LIMIT 300`
    )
    .all();
  const agendados = ag.map((n) => {
    const emp = empresaDe(n);
    return { id: n.id, cnpj: n.cnpj, nome: emp ? emp.nome_fantasia || emp.razao_social : n.contato_nome, razao_social: emp?.razao_social || "", wa_numero: n.wa_numero, wa_nome: n.wa_nome, proxima_acao_em: n.proxima_acao_em };
  });
  return { itens, agendados, aguardando_envio: agendados.length, modelo_usa_relatorio: usaNoModelo };
}

// Texto do primeiro contato editado antes de aprovar (fica salvo como rascunho). Vazio = volta ao modelo.
export async function salvarRascunho(db, negId, texto) {
  // o link do pré-relatório volta a ser {relatorio}: se o relatório for despublicado, o texto não fica com link morto
  const link = await linkPublicado(db, await lerConfig(db), negId);
  let t = String(texto || "").trim().slice(0, 4000);
  if (link) t = t.split(link).join("{relatorio}");
  const r = await db
    .prepare("UPDATE negocios SET mensagem_inicial = ? WHERE id = ? AND automacao = 'inativa'")
    .bind(t || null, negId)
    .run();
  if (r.meta.changes !== 1) throw new Error("Este contato não está mais aguardando aprovação.");
  if (t) return { ok: true, texto: comRelatorio(t, link) };
  const cfg = await lerConfig(db);
  const neg = await db.prepare("SELECT n.*, e.dados AS empresa_dados FROM negocios n LEFT JOIN empresas e ON e.cnpj = n.cnpj WHERE n.id = ?").bind(negId).first();
  return { ok: true, texto: await textoPrimeiroContato(db, cfg, neg, empresaDe(neg)) };
}

// Conversa de um negócio + modelos já preenchidos com os dados dele (para responder rápido).
export async function conversa(db, negId) {
  const neg = await db.prepare("SELECT n.*, e.dados AS empresa_dados FROM negocios n LEFT JOIN empresas e ON e.cnpj = n.cnpj WHERE n.id = ?").bind(negId).first();
  if (!neg) throw new Error("Negócio não encontrado.");
  const [msgs, mods] = await db.batch([
    db
      .prepare("SELECT id, direcao, origem, passo, texto, status, classificacao, criado_em FROM mensagens WHERE negocio_id = ? ORDER BY criado_em, id")
      .bind(negId),
    db.prepare("SELECT id, titulo, texto, passo FROM modelos ORDER BY (passo IS NOT NULL), titulo COLLATE NOCASE"),
  ]);
  const empresa = empresaDe(neg);
  const cfg = await lerConfig(db);
  const link = await linkPublicado(db, cfg, negId);
  return {
    mensagens: msgs.results,
    modelos: mods.results.map((m) => ({ id: m.id, titulo: m.titulo, passo: m.passo, texto: preencher(m.texto, neg, empresa, link ? { relatorio: link } : {}) })),
    relatorio_link: link,
  };
}

export async function painel(db, agora = new Date()) {
  const cfg = await lerConfig(db);
  const c = await contagemDoDia(db, cfg, agora);
  const [respostas, proximos] = await db.batch([
    db.prepare("SELECT COUNT(*) AS n FROM negocios WHERE nao_lidas > 0"),
    db.prepare(
      `SELECT n.id, n.passo, n.proxima_acao_em, n.contato_nome, e.nome AS empresa FROM negocios n LEFT JOIN empresas e ON e.cnpj = n.cnpj
        WHERE n.automacao = 'ativa' AND n.proxima_acao_em IS NOT NULL ORDER BY n.proxima_acao_em LIMIT 8`
    ),
  ]);
  return {
    ligada: cfg.automacao_ligada === "1",
    gowa_configurada: !!cfg.gowa_url,
    gowa_alerta: cfg.gowa_alerta || "",
    hoje: { ...c, limite_novos: Number(cfg.novos_por_dia), limite_envios: Number(cfg.envios_por_dia) },
    janela_aberta: dentroDaJanela(agora, cfg),
    proxima_abertura: iso(proximaAbertura(agora, cfg)),
    proximo_envio_em: cfg.proximo_envio_em || null,
    ultimo_relogio: cfg.ultimo_relogio || null,
    config: { intervalo_min: Number(cfg.intervalo_min), novos_por_dia: Number(cfg.novos_por_dia), hora_inicio: cfg.hora_inicio, hora_fim: cfg.hora_fim },
    com_respostas: respostas.results[0]?.n || 0,
    proximos: proximos.results.map((r) => ({ ...r, rotulo: ROTULO_PASSO[r.passo] || r.passo })),
  };
}

export { melhorTelefone };
