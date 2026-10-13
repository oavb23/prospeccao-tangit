// Cria e atualiza as tabelas no D1 sozinho (não precisa rodar SQL à mão).
// Versão 1: busca, listas e funil. Versão 2: contatos sem CNPJ (site), automação de WhatsApp e mensagens.
// Fase 2 (pré-relatório): tabela relatorios, criada junto com as outras (não muda a versão).

import { gravarConfig, valoresGerados } from "./config.js";

const VERSAO = "2";

const TABELAS = [
  `CREATE TABLE IF NOT EXISTS empresas (
     cnpj TEXT PRIMARY KEY,
     nome TEXT,
     municipio TEXT,
     uf TEXT,
     dados TEXT NOT NULL,
     atualizado_em TEXT NOT NULL DEFAULT (datetime('now'))
   )`,
  `CREATE TABLE IF NOT EXISTS listas (
     id INTEGER PRIMARY KEY AUTOINCREMENT,
     nome TEXT NOT NULL,
     cor TEXT NOT NULL DEFAULT '#3b6ea5',
     criado_em TEXT NOT NULL DEFAULT (datetime('now'))
   )`,
  `CREATE TABLE IF NOT EXISTS lista_itens (
     lista_id INTEGER NOT NULL,
     cnpj TEXT NOT NULL,
     adicionado_em TEXT NOT NULL DEFAULT (datetime('now')),
     PRIMARY KEY (lista_id, cnpj)
   )`,
  `CREATE TABLE IF NOT EXISTS etapas (
     id INTEGER PRIMARY KEY AUTOINCREMENT,
     nome TEXT NOT NULL,
     ordem INTEGER NOT NULL DEFAULT 0,
     cor TEXT NOT NULL DEFAULT '#7a8699',
     tipo TEXT NOT NULL DEFAULT 'aberta'
   )`,
  `CREATE TABLE IF NOT EXISTS atividades (
     id INTEGER PRIMARY KEY AUTOINCREMENT,
     negocio_id INTEGER NOT NULL,
     tipo TEXT NOT NULL DEFAULT 'nota',
     texto TEXT NOT NULL,
     criado_em TEXT NOT NULL DEFAULT (datetime('now'))
   )`,
  `CREATE TABLE IF NOT EXISTS modelos (
     id INTEGER PRIMARY KEY AUTOINCREMENT,
     titulo TEXT NOT NULL,
     texto TEXT NOT NULL
   )`,
  `CREATE TABLE IF NOT EXISTS config (
     chave TEXT PRIMARY KEY,
     valor TEXT
   )`,
  `CREATE TABLE IF NOT EXISTS mensagens (
     id INTEGER PRIMARY KEY AUTOINCREMENT,
     negocio_id INTEGER NOT NULL,
     direcao TEXT NOT NULL,
     origem TEXT NOT NULL,
     passo TEXT,
     texto TEXT,
     wa_id TEXT,
     status TEXT,
     classificacao TEXT,
     erro TEXT,
     criado_em TEXT NOT NULL
   )`,
  // pré-relatório (fase 2): coleta e texto em rascunho; "publicado" é a cópia aprovada que o cliente vê
  `CREATE TABLE IF NOT EXISTS relatorios (
     id INTEGER PRIMARY KEY AUTOINCREMENT,
     negocio_id INTEGER NOT NULL UNIQUE,
     slug TEXT UNIQUE,
     status TEXT NOT NULL DEFAULT 'rascunho',
     coleta TEXT,
     conteudo TEXT,
     publicado TEXT,
     aprovado_em TEXT,
     enviado_em TEXT,
     ignorar_ate TEXT,
     visto_em TEXT,
     visualizacoes INTEGER NOT NULL DEFAULT 0,
     ultima_visualizacao_em TEXT,
     criado_em TEXT NOT NULL DEFAULT (datetime('now')),
     atualizado_em TEXT NOT NULL DEFAULT (datetime('now'))
   )`,
  `CREATE INDEX IF NOT EXISTS idx_itens_cnpj ON lista_itens(cnpj)`,
  `CREATE INDEX IF NOT EXISTS idx_ativ_neg ON atividades(negocio_id)`,
  `CREATE INDEX IF NOT EXISTS idx_msg_neg ON mensagens(negocio_id, id)`,
  `CREATE INDEX IF NOT EXISTS idx_msg_wa ON mensagens(wa_id)`,
];

// Funil da versão 2: CNPJ opcional (contatos do site não têm) + campos de contato e automação.
const NEGOCIOS = (nome) => `CREATE TABLE IF NOT EXISTS ${nome} (
     id INTEGER PRIMARY KEY AUTOINCREMENT,
     cnpj TEXT UNIQUE,
     etapa_id INTEGER NOT NULL,
     valor REAL,
     proximo_contato TEXT,
     motivo_perda TEXT,
     origem TEXT,
     fonte TEXT NOT NULL DEFAULT 'prospeccao',
     contato_nome TEXT,
     telefone TEXT,
     telefone_manual INTEGER NOT NULL DEFAULT 0,
     email TEXT,
     interesse TEXT,
     tracking TEXT,
     event_id TEXT,
     wa_numero TEXT,
     wa_status TEXT,
     wa_nome TEXT,
     wa_lid TEXT,
     wa_verificado_em TEXT,
     automacao TEXT NOT NULL DEFAULT 'inativa',
     passo TEXT,
     proxima_acao_em TEXT,
     mensagem_inicial TEXT,
     tentativas_erro INTEGER NOT NULL DEFAULT 0,
     ultimo_envio_em TEXT,
     ultima_resposta_em TEXT,
     nao_lidas INTEGER NOT NULL DEFAULT 0,
     optout INTEGER NOT NULL DEFAULT 0,
     fechado_em TEXT,
     criado_em TEXT NOT NULL DEFAULT (datetime('now')),
     atualizado_em TEXT NOT NULL DEFAULT (datetime('now'))
   )`;

const INDICES_NEGOCIOS = [
  `CREATE INDEX IF NOT EXISTS idx_neg_wa ON negocios(wa_numero)`,
  `CREATE INDEX IF NOT EXISTS idx_neg_tel ON negocios(telefone)`,
  `CREATE INDEX IF NOT EXISTS idx_neg_lid ON negocios(wa_lid)`,
  `CREATE INDEX IF NOT EXISTS idx_neg_auto ON negocios(automacao, proxima_acao_em)`,
  `CREATE INDEX IF NOT EXISTS idx_neg_wastatus ON negocios(wa_status)`,
  `CREATE INDEX IF NOT EXISTS idx_neg_naolidas ON negocios(nao_lidas)`,
  `CREATE INDEX IF NOT EXISTS idx_neg_etapa ON negocios(etapa_id)`,
  `CREATE INDEX IF NOT EXISTS idx_neg_atual ON negocios(atualizado_em)`,
];

// Função de cada etapa na automação (o nome continua livre para você mudar).
export const PAPEIS = {
  entrada: "Entrada (aprovação)",
  contato: "Primeiro contato",
  conversa: "Conversa (respondeu)",
  proposta: "Proposta",
  negociacao: "Negociação",
  outro_momento: "Outro momento",
  ganho: "Venda ganha",
  perdido: "Perdida",
};

const ETAPAS_INICIAIS = [
  ["Prospecção", "#7a8699", "aberta", "entrada"],
  ["Primeiro contato", "#3b6ea5", "aberta", "contato"],
  ["Conversa", "#6a5acd", "aberta", "conversa"],
  ["Proposta enviada", "#c48a1c", "aberta", "proposta"],
  ["Negociação", "#d0662d", "aberta", "negociacao"],
  ["Outro momento", "#8a8f98", "aberta", "outro_momento"],
  ["Ganho", "#2e8b57", "ganho", "ganho"],
  ["Perdido", "#b23b3b", "perdido", "perdido"],
];

// Rascunhos para você reescrever em Ajustes → Mensagens da automação.
export const MODELOS_AUTOMACAO = [
  {
    passo: "primeiro_contato",
    titulo: "Automação · Primeiro contato",
    texto:
      "{saudacao}! Aqui é o Bruno Bova, da Tangit. Trabalho com estratégia e posicionamento de marca e dei uma olhada na presença da marca {empresa}. Anotei alguns pontos que podem ser úteis. Posso te mandar?",
  },
  {
    passo: "followup_1",
    titulo: "Automação · Follow-up (2 dias úteis)",
    texto: "{saudacao}, tudo bem? Passando para saber se viu minha mensagem sobre a marca {empresa}.",
  },
  {
    passo: "followup_2",
    titulo: "Automação · Nova tentativa (7 dias)",
    texto: "{saudacao}! Volto a falar porque os pontos que anotei sobre a marca {empresa} ainda valem. Se não for o momento, sem problema.",
  },
  {
    passo: "outro_momento",
    titulo: "Automação · Retomada (outro momento)",
    texto: "{saudacao}! Há alguns meses falamos sobre a marca {empresa}. Faz sentido conversarmos agora?",
  },
];

const semAcento = (s) => String(s ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

function papelPeloNome(e) {
  const n = semAcento(e.nome);
  if (e.tipo === "ganho") return "ganho";
  if (e.tipo === "perdido") return "perdido";
  if (n.includes("prospec") || n.includes("entrada") || n.includes("novo")) return "entrada";
  if (n.includes("primeiro")) return "contato";
  if (n.includes("conversa") || n.includes("respond") || n.includes("qualif")) return "conversa";
  if (n.includes("proposta")) return "proposta";
  if (n.includes("negocia")) return "negociacao";
  if (n.includes("outro momento")) return "outro_momento";
  return null;
}

async function colunas(db, tabela) {
  const { results } = await db.prepare(`PRAGMA table_info(${tabela})`).all();
  return new Set(results.map((r) => r.name));
}

async function existeTabela(db, tabela) {
  const r = await db.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?").bind(tabela).first();
  return !!r;
}

let pronto = false;

export async function garantirSchema(db) {
  if (pronto) return;
  await db.batch(TABELAS.map((s) => db.prepare(s)));
  const versaoAtual = async () => (await db.prepare("SELECT valor FROM config WHERE chave = 'schema_versao'").first())?.valor;
  if ((await versaoAtual()) !== VERSAO) {
    // só uma requisição atualiza o banco; as outras esperam (evita etapa "Outro momento" duplicada etc.)
    const pegarTrava = async () =>
      (await db.prepare("INSERT INTO config (chave, valor) VALUES ('migrando', ?) ON CONFLICT(chave) DO NOTHING").bind(String(Date.now())).run()).meta.changes === 1;
    let minha = await pegarTrava();
    if (!minha) {
      const trava = await db.prepare("SELECT valor FROM config WHERE chave = 'migrando'").first();
      if (trava && Date.now() - Number(trava.valor) > 60000) {
        // trava esquecida por uma atualização que caiu no meio: libera e tenta de novo
        await db.prepare("DELETE FROM config WHERE chave = 'migrando' AND valor = ?").bind(trava.valor).run();
        minha = await pegarTrava();
      }
    }
    if (minha) {
      try {
        if ((await versaoAtual()) !== VERSAO) await migrar(db);
      } finally {
        await db.prepare("DELETE FROM config WHERE chave = 'migrando'").run();
      }
    } else {
      for (let i = 0; i < 40 && (await versaoAtual()) !== VERSAO; i++) await new Promise((r) => setTimeout(r, 500));
      if ((await versaoAtual()) !== VERSAO) throw new Error("O banco está sendo atualizado. Tente de novo em alguns segundos.");
    }
  }
  pronto = true;
}

async function migrar(db) {
  // 1) funil: cria do zero ou reconstrói a tabela antiga (CNPJ passa a ser opcional)
  if (!(await existeTabela(db, "negocios"))) {
    await db.prepare(NEGOCIOS("negocios")).run();
  } else if (!(await colunas(db, "negocios")).has("fonte")) {
    await db.batch([
      db.prepare("DROP TABLE IF EXISTS negocios_v2"),
      db.prepare(NEGOCIOS("negocios_v2")),
      db.prepare(
        `INSERT INTO negocios_v2 (id, cnpj, etapa_id, valor, proximo_contato, motivo_perda, origem, criado_em, atualizado_em)
         SELECT id, cnpj, etapa_id, valor, proximo_contato, motivo_perda, origem, criado_em, atualizado_em FROM negocios`
      ),
      db.prepare("DROP TABLE negocios"),
      db.prepare("ALTER TABLE negocios_v2 RENAME TO negocios"),
    ]);
    // telefone da Receita para quem já estava no funil (o melhor número: celular primeiro)
    const { results } = await db
      .prepare("SELECT n.id, e.dados FROM negocios n JOIN empresas e ON e.cnpj = n.cnpj WHERE n.telefone IS NULL")
      .all();
    const stmts = [];
    for (const r of results) {
      let dados = {};
      try {
        dados = JSON.parse(r.dados);
      } catch {}
      const tel = melhorTelefone(dados);
      if (tel) stmts.push(db.prepare("UPDATE negocios SET telefone = ? WHERE id = ?").bind(tel, r.id));
    }
    for (let i = 0; i < stmts.length; i += 80) await db.batch(stmts.slice(i, i + 80));
  }
  await db.batch(INDICES_NEGOCIOS.map((s) => db.prepare(s)));

  // 2) etapas: função na automação + etapa "Outro momento"
  if (!(await colunas(db, "etapas")).has("papel")) {
    await db.prepare("ALTER TABLE etapas ADD COLUMN papel TEXT").run();
  }
  const { results: etapas } = await db.prepare("SELECT id, nome, tipo, ordem, papel FROM etapas ORDER BY ordem, id").all();
  if (!etapas.length) {
    await db.batch(
      ETAPAS_INICIAIS.map(([nome, cor, tipo, papel], i) =>
        db.prepare("INSERT INTO etapas (nome, ordem, cor, tipo, papel) VALUES (?, ?, ?, ?, ?)").bind(nome, i + 1, cor, tipo, papel)
      )
    );
  } else {
    const usados = new Set(etapas.map((e) => e.papel).filter(Boolean));
    const stmts = [];
    for (const e of etapas) {
      if (e.papel) continue;
      const p = papelPeloNome(e);
      if (p && !usados.has(p)) {
        usados.add(p);
        stmts.push(db.prepare("UPDATE etapas SET papel = ? WHERE id = ?").bind(p, e.id));
      }
    }
    if (stmts.length) await db.batch(stmts);
    if (!usados.has("outro_momento")) {
      // entra antes das etapas de ganho/perda e reordena tudo
      const lista = etapas.map((e) => ({ id: e.id, tipo: e.tipo }));
      const pos = lista.findIndex((e) => e.tipo !== "aberta");
      const r = await db
        .prepare("INSERT INTO etapas (nome, ordem, cor, tipo, papel) VALUES ('Outro momento', 0, '#8a8f98', 'aberta', 'outro_momento')")
        .run();
      lista.splice(pos < 0 ? lista.length : pos, 0, { id: r.meta.last_row_id });
      await db.batch(lista.map((e, i) => db.prepare("UPDATE etapas SET ordem = ? WHERE id = ?").bind(i + 1, e.id)));
    }
  }

  // 3) modelos: passo da automação + rascunhos
  if (!(await colunas(db, "modelos")).has("passo")) {
    await db.prepare("ALTER TABLE modelos ADD COLUMN passo TEXT").run();
  }
  const { results: comPasso } = await db.prepare("SELECT passo FROM modelos WHERE passo IS NOT NULL").all();
  const temPasso = new Set(comPasso.map((m) => m.passo));
  const faltando = MODELOS_AUTOMACAO.filter((m) => !temPasso.has(m.passo));
  if (faltando.length) {
    await db.batch(
      faltando.map((m) => db.prepare("INSERT INTO modelos (titulo, texto, passo) VALUES (?, ?, ?)").bind(m.titulo, m.texto, m.passo))
    );
  }

  // 4) segredos gerados uma vez (webhook, relógio, acesso à Gowa)
  const { results: cfgAtual } = await db.prepare("SELECT chave FROM config").all();
  const ja = new Set(cfgAtual.map((r) => r.chave));
  const novos = {};
  for (const [k, v] of Object.entries(valoresGerados())) if (!ja.has(k)) novos[k] = v;
  novos.schema_versao = VERSAO;
  await gravarConfig(db, novos);
}

// Telefones da Receita: celular primeiro. Devolve com 55 na frente.
export function melhorTelefone(r) {
  const lista = [r?.ddd_telefone_1, r?.ddd_telefone_2]
    .map((v) => String(v ?? "").replace(/\D/g, ""))
    .filter((d) => d.length >= 10 && d.length <= 11);
  if (!lista.length) return null;
  // celular: 11 dígitos com 9 na frente, ou o formato antigo da Receita (10 dígitos começando com 6 a 9)
  const celular = lista.find((d) => (d.length === 11 && d[2] === "9") || (d.length === 10 && /[6-9]/.test(d[2])));
  return "55" + (celular || lista[0]);
}
