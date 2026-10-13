// Classifica uma mensagem recebida: resposta de pessoa, resposta automática (saudação/ausência)
// ou pedido para não receber mais. Regras primeiro; a IA entra só nos casos duvidosos, se houver chave.

import { semAcento } from "./textos.js";

const SAIR = [
  /^\s*(sair|parar|pare|stop|remover|descadastrar|cancelar)\s*[.!]*\s*$/,
  /nao (quero|desejo) (mais )?(receber|mensage)/,
  /(me )?(tire|tira|remova|remove|exclua) (da|dessa|desta|meu numero)/,
  /para de (me )?(mandar|enviar)/,
  /nao (me )?(mande|envie) mais/,
];

const AUTOMATICA = [
  /mensagem automatica|resposta automatica|atendimento automatico/,
  /(obrigad[oa]|agradecemos) (por|pelo|o seu|seu) (entrar em )?contato/,
  /(em breve|logo|assim que possivel) (retornaremos|responderemos|entraremos|daremos retorno|um de nossos)/,
  /(retornaremos|responderemos|entraremos em contato) (em breve|assim que|o mais breve)/,
  /(nosso|o) horario de (atendimento|funcionamento)/,
  /fora do (nosso )?horario/,
  /no momento (nao )?(estamos|podemos|conseguimos)/,
  /(seja )?bem[- ]?vind[oa]/,
  /como (podemos|posso) (te |lhe )?ajudar/,
  /(digite|escolha|selecione) (o numero|uma das|a opcao|uma opcao|1)/,
  /atendimento.*(segunda|seg\.?) (a|à) (sexta|sex)/,
  /aguarde (um momento|que|alguns)/,
  /(estou|estamos) (ausente|de ferias|fora)/,
];

const normalizar = (texto) => semAcento(texto).replace(/\s+/g, " ").trim();
const temCaraDeAutomatica = (t) => AUTOMATICA.some((r) => r.test(t));

// Resposta automática do WhatsApp Business chega em segundos. Na dúvida, trata como resposta de pessoa:
// é melhor parar a sequência à toa (você retoma com um toque) do que ignorar alguém que respondeu.
export function classificarPorRegra(texto, segundosDesdeEnvio = null) {
  const t = normalizar(texto);
  if (!t) return "humana"; // áudio, foto, figurinha: alguém respondeu
  if (SAIR.some((r) => r.test(t))) return "descadastro";
  const conhecido = segundosDesdeEnvio !== null && segundosDesdeEnvio >= 0;
  if (temCaraDeAutomatica(t) && (!conhecido || segundosDesdeEnvio <= 120)) return "automatica";
  if (conhecido && segundosDesdeEnvio <= 15 && t.length > 80) return "automatica";
  return "humana";
}

// Pergunta para a IA só quando vale a pena: cara de automática ou resposta muito rápida.
export async function classificar(texto, segundosDesdeEnvio, cfg, env) {
  const regra = classificarPorRegra(texto, segundosDesdeEnvio);
  const chave = env?.ANTHROPIC_API_KEY || cfg?.ia_chave;
  const rapida = segundosDesdeEnvio !== null && segundosDesdeEnvio >= 0 && segundosDesdeEnvio < 120;
  const duvidosa = regra === "automatica" || rapida || temCaraDeAutomatica(normalizar(texto));
  if (!chave || regra === "descadastro" || !String(texto || "").trim() || !duvidosa) return { tipo: regra, via: "regra" };
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 12000);
    const resp = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      signal: ctrl.signal,
      headers: { "x-api-key": chave, "anthropic-version": "2023-06-01", "content-type": "application/json" },
      body: JSON.stringify({
        model: cfg?.ia_modelo || "claude-haiku-5-5",
        max_tokens: 20,
        system:
          'Você classifica respostas de WhatsApp recebidas por uma empresa que mandou uma mensagem de prospecção. Responda só com uma palavra: "automatica" (saudação, ausência, menu ou qualquer resposta automática do WhatsApp Business), "descadastro" (a pessoa pede para não receber mais mensagens) ou "humana" (qualquer outra resposta escrita por uma pessoa).',
        messages: [
          {
            role: "user",
            content: `Tempo entre o nosso envio e a resposta: ${segundosDesdeEnvio === null ? "desconhecido" : `${Math.round(segundosDesdeEnvio)} segundos`}.\nResposta recebida:\n"""${String(texto).slice(0, 1500)}"""`,
          },
        ],
      }),
    });
    clearTimeout(t);
    if (!resp.ok) return { tipo: regra, via: "regra" };
    const dados = await resp.json();
    const saida = semAcento(dados?.content?.[0]?.text || "");
    const tipo = saida.includes("descadastro") ? "descadastro" : saida.includes("automatica") ? "automatica" : saida.includes("humana") ? "humana" : regra;
    return { tipo, via: "ia" };
  } catch {
    return { tipo: regra, via: "regra" };
  }
}
