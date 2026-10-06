import { json } from "../../lib/util.js";

// Chave de acesso opcional: se a variável ACCESS_KEY existir no projeto,
// toda chamada à API precisa enviar o cabeçalho X-Access-Key com o mesmo valor.
export async function onRequest(context) {
  const chave = context.env.ACCESS_KEY;
  if (chave) {
    const enviada = context.request.headers.get("x-access-key") || "";
    if (enviada !== chave) return json({ erro: "acesso_negado" }, 401);
  }
  try {
    return await context.next();
  } catch (e) {
    return json({ erro: "falha_interna", detalhe: String(e?.message || e) }, 500);
  }
}
