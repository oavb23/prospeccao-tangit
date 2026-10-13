// Configurações guardadas no D1 (tabela config, chave/valor).

export const PADRAO = {
  // automação
  automacao_ligada: "0",
  hora_inicio: "09:00",
  hora_fim: "17:00",
  feriados_extras: "",
  novos_por_dia: "10",
  envios_por_dia: "60",
  intervalo_min: "4",
  verificacoes_por_dia: "80",
  followup1_dias_uteis: "2",
  followup2_dias: "7",
  sem_resposta_dias_uteis: "2",
  outro_momento_dias: "90",
  encerrar_dias: "7",
  rodape_descadastro: "Se preferir não receber mensagens, é só responder SAIR.",
  // WhatsApp (Gowa)
  gowa_url: "",
  gowa_usuario: "",
  gowa_senha: "",
  gowa_device: "",
  webhook_segredo: "",
  relogio_chave: "",
  // IA (opcional)
  ia_chave: "",
  ia_modelo: "claude-haiku-5-5",
  // site (formulário) e rastreamento
  site_wa_numero: "",
  site_wa_modelo: "Olá, me chamo {nome} e tenho interesse em {busca}",
  widget_rotulo: "Fale conosco",
  widget_titulo: "Fale com a gente",
  widget_intro: "Preencha e continue a conversa no WhatsApp.",
  widget_cor: "#25D366",
  meta_pixel: "",
  meta_token: "",
  meta_teste: "",
  ga4_id: "",
  ga4_segredo: "",
  gads_conv: "Venda CRM",
  // pré-relatório
  relatorio_dominio: "tangit.com.br",
  relatorio_whatsapp: "5515996163095",
  relatorio_cor: "#e23917",
  relatorio_assinatura_nome: "Bruno Bova",
  relatorio_assinatura_cargo: "Estrategista de marca",
  relatorio_tese: "Tudo o que a empresa faz constrói percepção, então marca não pode se resumir ao logotipo.",
  relatorio_tese_nota:
    "Marca, aqui, não é o logotipo. É a resposta que o cliente dá quando alguém pergunta “por que vocês?” — e ela se forma em todo ponto de contato, com ou sem a intenção da empresa.",
  relatorio_fecho:
    "Quando existe posicionamento definido, a percepção é a mesma independentemente do canal por onde o cliente chega. Isso **otimiza o investimento em marketing**, porque a mensagem fica mais assertiva, e **melhora a conversão**, porque o cliente chega ao atendimento com a expectativa alinhada.",
  relatorio_destaque:
    "Quando o negócio consegue definir, executar e manter a consistência em todos os canais e pontos de contato com o cliente, ele define de forma ativa **quem é, quem não é, quem atende e quem não atende** — e filtra quem não interessa.",
  relatorio_cta_titulo: "Vale uma conversa?",
  relatorio_cta_texto: "Trinta minutos para olhar esses pontos com calma — com os dados que só vocês têm.",
  relatorio_cta_botao: "Conversar pelo WhatsApp",
  relatorio_cta_mensagem: "Olá, Bruno! Vi o pré-relatório da {empresa}.",
  ia_modelo_relatorio: "claude-sonnet-5-5",
  psi_chave: "",
};

// Nunca voltam para a tela em texto aberto.
export const SECRETAS = ["gowa_senha", "ia_chave", "meta_token", "ga4_segredo", "psi_chave"];
// Gerados pelo sistema na primeira vez (aparecem para copiar).
export const GERADAS = ["webhook_segredo", "relogio_chave", "gowa_usuario", "gowa_senha"];
// Estado interno (não editável pela tela).
export const INTERNAS = ["schema_versao", "contagem", "proximo_envio_em", "gowa_alerta", "gowa_ok_em", "meta_ultimo", "ultimo_relogio", "mudou_em"];

export const MASCARA = "••••••••";

const hex = (n) => [...crypto.getRandomValues(new Uint8Array(n))].map((b) => b.toString(16).padStart(2, "0")).join("");

export function valoresGerados() {
  return {
    webhook_segredo: hex(20),
    relogio_chave: hex(20),
    gowa_usuario: "tangit",
    gowa_senha: hex(12),
  };
}

export async function lerConfig(db) {
  const { results } = await db.prepare("SELECT chave, valor FROM config").all();
  const cfg = { ...PADRAO };
  for (const r of results) cfg[r.chave] = r.valor ?? "";
  return cfg;
}

export async function gravarConfig(db, pares) {
  const stmts = Object.entries(pares).map(([k, v]) =>
    db.prepare("INSERT INTO config (chave, valor) VALUES (?, ?) ON CONFLICT(chave) DO UPDATE SET valor = excluded.valor").bind(k, v == null ? "" : String(v))
  );
  if (stmts.length) await db.batch(stmts);
}

// Marca que algo mudou (mensagem recebida, envio, etapa): as telas abertas conferem isso a cada 20 s
// e só recarregam quando muda (1 linha lida por consulta, para caber folgado no plano gratuito do D1).
export const marcarMudanca = (db) => gravarConfig(db, { mudou_em: `${new Date().toISOString()}.${Math.random().toString(36).slice(2, 6)}` });

// Versão para a tela: segredos mascarados, internos fora.
export function configParaTela(cfg) {
  const saida = {};
  for (const k of Object.keys(PADRAO)) {
    const v = cfg[k] ?? "";
    saida[k] = SECRETAS.includes(k) && v && k !== "gowa_senha" ? MASCARA : v;
  }
  // a senha da Gowa é gerada aqui e precisa aparecer uma vez no script de instalação
  saida.gowa_senha = cfg.gowa_senha || "";
  return saida;
}

// Aceita só chaves conhecidas; ignora segredos que voltaram mascarados.
export function filtrarEdicao(dados) {
  const saida = {};
  for (const [k, v] of Object.entries(dados || {})) {
    if (!(k in PADRAO)) continue;
    if (SECRETAS.includes(k) && String(v) === MASCARA) continue;
    let valor = String(v ?? "").trim();
    if (k === "site_wa_numero" || k === "relatorio_whatsapp") valor = valor.replace(/\D/g, "");
    if (k === "relatorio_dominio") valor = valor.toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "");
    if (k === "relatorio_cor" && !/^#[0-9a-f]{6}$/i.test(valor)) continue;
    if (k === "gowa_url") valor = valor.replace(/\/+$/, "");
    if (["automacao_ligada"].includes(k)) valor = valor === "1" || valor === "true" ? "1" : "0";
    if (["novos_por_dia", "envios_por_dia", "intervalo_min", "verificacoes_por_dia", "followup1_dias_uteis", "followup2_dias", "sem_resposta_dias_uteis", "outro_momento_dias", "encerrar_dias"].includes(k)) {
      const n = Math.max(0, Math.min(10000, Math.round(Number(valor.replace(",", ".")) || 0)));
      valor = String(n);
    }
    if (["hora_inicio", "hora_fim"].includes(k) && !/^\d{1,2}:\d{2}$/.test(valor)) continue;
    saida[k] = valor;
  }
  return saida;
}
