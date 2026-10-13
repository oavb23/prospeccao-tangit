import { json } from "../../lib/util.js";

// Rotas que não usam a chave de acesso da tela (cada uma tem a própria proteção):
// formulário do site (público), webhook da Gowa (assinatura), relógio (chave do relógio)
// e script de instalação da VPS (link temporário de 30 minutos).
const LIVRES = [/^\/api\/public\//, /^\/api\/gowa\/webhook\/?$/, /^\/api\/automacao\/tick\/?$/, /^\/api\/instalar\/[0-9a-f]+$/];

// Chave de acesso obrigatória: o sistema guarda dados pessoais (LGPD) e envia mensagens pelo seu WhatsApp,
// então toda chamada à API precisa do cabeçalho X-Access-Key igual à variável ACCESS_KEY do projeto.
export async function onRequest(context) {
  const chave = context.env.ACCESS_KEY;
  const caminho = new URL(context.request.url).pathname;
  const livre = LIVRES.some((r) => r.test(caminho));
  if (!livre) {
    if (!chave) return json({ erro: "chave_nao_configurada" }, 503);
    const enviada = context.request.headers.get("x-access-key") || "";
    if (!(await iguais(enviada, chave))) return json({ erro: "acesso_negado" }, 401);
  }
  try {
    return await context.next();
  } catch (e) {
    return json({ erro: "falha_interna", detalhe: String(e?.message || e) }, 500);
  }
}

// comparação em tempo constante (não revela a chave por diferença de tempo)
async function iguais(a, b) {
  const enc = new TextEncoder();
  const [ha, hb] = await Promise.all([crypto.subtle.digest("SHA-256", enc.encode(a)), crypto.subtle.digest("SHA-256", enc.encode(b))]);
  const x = new Uint8Array(ha);
  const y = new Uint8Array(hb);
  let dif = 0;
  for (let i = 0; i < x.length; i++) dif |= x[i] ^ y[i];
  return dif === 0;
}
