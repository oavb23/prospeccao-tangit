// Redação do pré-relatório com IA (Claude, pela API da Anthropic), a partir só do que foi coletado.
// Sem chave de IA, o sistema usa o rascunho por regras (lib/achados.js).

import { observacoes, canaisSugeridos, numerosSugeridos, fontesUsadas, rascunhoPorRegras } from "./achados.js";

// Frases do próprio Bruno (análise e proposta da GP) — referência de tom, não de conteúdo.
const EXEMPLOS_DE_TOM = [
  "Instagram e Facebook operam quase 100% no fundo do funil",
  "O YouTube tem o melhor conteúdo da operação e a menor audiência",
  "O TikTok parou junto com o fim da parceria — um ativo que deixou de render e hoje comunica abandono",
  "“Nossas Lojas” lista as 26 unidades, mas ainda não ajuda o cliente a achar a mais próxima",
  "A mídia performa muito bem apesar da reputação, não com ela",
  "Cinco promessas, nenhuma repetida de forma consistente",
  "Estratégia de mídia madura, criativo que pode saturar",
];

const SISTEMA = `Você escreve o texto de um pré-relatório de marca que Bruno Bova, estrategista de marca da Tangit, envia a uma empresa antes da primeira conversa. O leitor é o dono ou sócio da empresa, que não pediu nada e vai abrir pelo celular a partir do WhatsApp.

Como escrever:
- Português do Brasil, frases curtas, palavras comuns. Sem jargão de marketing; se precisar de um termo técnico (ex.: remarketing, Pixel), explique em poucas palavras.
- Tom de colega de mercado: reconheça o que a empresa já construiu antes de apontar qualquer coisa. Nunca trate o leitor como quem errou, não sabe o que faz ou "precisa de ajuda". Nada de "vocês deveriam", "falta clareza", "está errado".
- Nada de promessa de resultado, superlativo ("incrível", "enorme"), exclamação ou venda de serviço. Não cite a Tangit nem o que ela faz.
- Use SOMENTE os fatos fornecidos. Não invente números, nomes, causas ou intenções. Se um fato tem ressalva (ex.: "não aparece no código do site"), mantenha a ressalva. Prefira o número exato ao adjetivo.
- Os apontamentos seguem o formato dos slides do Bruno: um título que diz o achado e a consequência numa linha (como nos exemplos), e uma linha de apoio com a evidência concreta.
- Prioridade dos apontamentos: consistência da marca entre canais > reputação > conversão no site > medição e mídia. Escolha de 3 a 4, de áreas diferentes quando possível. Não repita o mesmo achado em dois apontamentos.

Exemplos de títulos no tom do Bruno:
${EXEMPLOS_DE_TOM.map((e) => `- ${e}`).join("\n")}`;

const FERRAMENTA = {
  name: "texto_do_relatorio",
  description: "Devolve os textos do pré-relatório.",
  input_schema: {
    type: "object",
    properties: {
      abertura: {
        type: "string",
        description:
          "1 ou 2 parágrafos curtos (até 75 palavras no total), separados por linha em branco. Começa reconhecendo conquistas concretas da empresa que estão nos fatos (anos, nota, seguidores…). Termina dizendo que a leitura é breve, feita só com o que está público, e quantos pontos encontrou.",
      },
      canais_leitura: {
        type: "string",
        description: "Uma frase (até 30 palavras) lendo as frases de cada canal em conjunto. Vazio se houver menos de 2 canais com frase.",
      },
      apontamentos: {
        type: "array",
        minItems: 2,
        maxItems: 4,
        items: {
          type: "object",
          properties: {
            area: { type: "string", description: "Uma palavra: Marca, Site, Instagram, Google, Reputação, Mídia ou Medição." },
            titulo: { type: "string", description: "O achado e a consequência, até 95 caracteres." },
            apoio: { type: "string", description: "A evidência concreta (números, nomes, o que foi visto), até 160 caracteres." },
          },
          required: ["area", "titulo", "apoio"],
        },
      },
      fecho: {
        type: "string",
        description: "Parágrafo (até 70 palavras) ligando os apontamentos à marca como percepção do cliente em todos os canais. Pode usar **negrito** em até duas expressões. Siga o sentido do texto de referência do Bruno, adaptado aos achados.",
      },
    },
    required: ["abertura", "apontamentos", "fecho"],
  },
};

export function fatosParaIA(coleta, ctx, cfg, agora = new Date()) {
  const obs = observacoes(coleta, ctx, agora);
  return {
    empresa: ctx.nome,
    segmento: ctx.segmento || "",
    cidade: [ctx.cidade, ctx.uf].filter(Boolean).join(" - "),
    pontos_fortes: obs.filter((o) => o.tipo === "credito").map((o) => o.fato),
    pontos_encontrados: obs.filter((o) => o.tipo === "ponto").map((o) => ({ area: o.area, fato: o.fato, relevancia: o.peso })),
    frases_de_cada_canal: canaisSugeridos(coleta, ctx),
    numeros_em_destaque: numerosSugeridos(coleta, ctx).map((n) => `${n.valor} ${n.rotulo}`),
    observacoes_do_bruno: String(coleta?.manual?.observacoes || "").trim(),
    texto_de_referencia_do_fecho: cfg.relatorio_fecho || "",
  };
}

export async function redigirComIA(coleta, ctx, cfg, env, agora = new Date()) {
  const chave = env?.ANTHROPIC_API_KEY || cfg.ia_chave;
  if (!chave) throw new Error("Sem chave da IA (Ajustes → IA). Use o rascunho sem IA.");
  const fatos = fatosParaIA(coleta, ctx, cfg, agora);
  if (!fatos.pontos_encontrados.length && !fatos.observacoes_do_bruno)
    throw new Error("Ainda não há pontos para escrever: analise o site ou preencha a conferência manual antes.");
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 90000);
  let resp;
  try {
    resp = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      signal: ctrl.signal,
      headers: { "x-api-key": chave, "anthropic-version": "2023-06-01", "content-type": "application/json" },
      body: JSON.stringify({
        model: cfg.ia_modelo_relatorio || "claude-sonnet-5-5",
        max_tokens: 2000,
        system: SISTEMA,
        tools: [FERRAMENTA],
        tool_choice: { type: "tool", name: FERRAMENTA.name },
        messages: [{ role: "user", content: `Fatos coletados (JSON):\n${JSON.stringify(fatos, null, 2)}\n\nEscreva os textos do pré-relatório.` }],
      }),
    });
  } catch (e) {
    throw new Error(e.name === "AbortError" ? "A IA demorou demais para responder. Tente de novo." : "Não foi possível falar com a IA.");
  } finally {
    clearTimeout(t);
  }
  const dados = await resp.json().catch(() => null);
  if (!resp.ok) {
    const msg = dados?.error?.message || `HTTP ${resp.status}`;
    if (resp.status === 401) throw new Error("A chave da IA foi recusada (Ajustes → IA).");
    if (resp.status === 404 || /model/i.test(msg)) throw new Error(`A IA não reconheceu o modelo “${cfg.ia_modelo_relatorio}” (Ajustes → Pré-relatório).`);
    throw new Error(`IA: ${msg.slice(0, 200)}`);
  }
  const uso = (dados?.content || []).find((b) => b.type === "tool_use");
  const r = uso?.input || {};
  const limpa = (s, n) => String(s || "").replace(/\r/g, "").trim().slice(0, n);
  const aps = (Array.isArray(r.apontamentos) ? r.apontamentos : [])
    .map((a) => ({ area: limpa(a.area, 20), titulo: limpa(a.titulo, 140), apoio: limpa(a.apoio, 240) }))
    .filter((a) => a.titulo)
    .slice(0, 4);
  if (!aps.length || !String(r.abertura || "").trim()) throw new Error("A IA devolveu um texto incompleto. Tente de novo.");
  const regras = rascunhoPorRegras(coleta, ctx, cfg, agora);
  return {
    abertura: limpa(r.abertura, 1200),
    numeros: regras.numeros,
    canais: regras.canais,
    canais_leitura: regras.canais.length >= 2 ? limpa(r.canais_leitura, 300) : "",
    apontamentos: aps,
    fecho: limpa(r.fecho, 900) || cfg.relatorio_fecho,
  };
}

export { fontesUsadas };
