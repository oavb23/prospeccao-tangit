// Cria as tabelas no D1 na primeira chamada (não precisa rodar SQL à mão).

const SQL = [
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
  `CREATE TABLE IF NOT EXISTS negocios (
     id INTEGER PRIMARY KEY AUTOINCREMENT,
     cnpj TEXT NOT NULL UNIQUE,
     etapa_id INTEGER NOT NULL,
     valor REAL,
     proximo_contato TEXT,
     motivo_perda TEXT,
     origem TEXT,
     criado_em TEXT NOT NULL DEFAULT (datetime('now')),
     atualizado_em TEXT NOT NULL DEFAULT (datetime('now'))
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
  `CREATE INDEX IF NOT EXISTS idx_itens_cnpj ON lista_itens(cnpj)`,
  `CREATE INDEX IF NOT EXISTS idx_ativ_neg ON atividades(negocio_id)`,
];

const ETAPAS_INICIAIS = [
  ["Prospecção", 1, "#7a8699", "aberta"],
  ["Primeiro contato", 2, "#3b6ea5", "aberta"],
  ["Conversa", 3, "#6a5acd", "aberta"],
  ["Proposta enviada", 4, "#c48a1c", "aberta"],
  ["Negociação", 5, "#d0662d", "aberta"],
  ["Ganho", 6, "#2e8b57", "ganho"],
  ["Perdido", 7, "#b23b3b", "perdido"],
];

let pronto = false;

export async function garantirSchema(db) {
  if (pronto) return;
  await db.batch(SQL.map((s) => db.prepare(s)));
  const { total } = await db.prepare("SELECT COUNT(*) AS total FROM etapas").first();
  if (!total) {
    await db.batch(
      ETAPAS_INICIAIS.map(([nome, ordem, cor, tipo]) =>
        db.prepare("INSERT INTO etapas (nome, ordem, cor, tipo) VALUES (?, ?, ?, ?)").bind(nome, ordem, cor, tipo)
      )
    );
  }
  pronto = true;
}
