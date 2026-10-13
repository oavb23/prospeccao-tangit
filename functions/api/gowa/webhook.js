import { json } from "../../../lib/util.js";
import { garantirSchema } from "../../../lib/schema.js";
import { lerConfig } from "../../../lib/config.js";
import { assinaturaValida } from "../../../lib/gowa.js";
import { processarWebhook } from "../../../lib/automacao.js";

// Recebe os eventos da Gowa (mensagens e recibos de entrega/leitura).
// Configure na Gowa: WHATSAPP_WEBHOOK=https://SEU-ENDERECO/api/gowa/webhook e WHATSAPP_WEBHOOK_SECRET=<segredo de Ajustes>.
export async function onRequestPost({ request, env, waitUntil }) {
  if (!env.DB) return json({ erro: "sem banco" }, 500);
  await garantirSchema(env.DB);
  const bruto = await request.text();
  const cfg = await lerConfig(env.DB);
  const ok = await assinaturaValida(bruto, request.headers.get("x-hub-signature-256"), cfg.webhook_segredo);
  if (!ok) return json({ erro: "assinatura inválida" }, 401);
  let dados;
  try {
    dados = JSON.parse(bruto);
  } catch {
    return json({ erro: "json inválido" }, 400);
  }
  // responde rápido para a Gowa e processa em seguida (a classificação pode chamar a IA)
  const trabalho = processarWebhook(env, dados).catch((e) => ({ erro: String(e?.message || e) }));
  if (typeof waitUntil === "function" && env.MODO_TESTE !== "1") {
    waitUntil(trabalho);
    return json({ ok: true });
  }
  return json({ ok: true, resultado: await trabalho });
}

export function onRequestGet() {
  return json({ ok: true, info: "Endereço do webhook da Gowa. Use POST." });
}
