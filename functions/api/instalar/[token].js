import { garantirSchema } from "../../../lib/schema.js";
import { lerConfig } from "../../../lib/config.js";
import { scriptInstalacao } from "../../../lib/instalacao.js";

// Link temporário com o script de instalação da VPS (gerado em Ajustes → WhatsApp, vale 30 minutos).
// Uso na VPS:  curl -fsSL https://ENDERECO/api/instalar/TOKEN | sh
export async function onRequestGet({ params, env, request }) {
  const texto = (t, status = 200) => new Response(t, { status, headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" } });
  if (!env.DB) return texto("echo 'Banco de dados não configurado.'", 500);
  await garantirSchema(env.DB);
  const cfg = await lerConfig(env.DB);
  const token = String(params.token || "");
  const valido = cfg.instalar_token && token.length >= 20 && token === cfg.instalar_token && Date.now() < Number(cfg.instalar_expira || 0);
  // responde 200 de propósito: assim o aviso aparece no terminal (com erro HTTP o curl não mostra nada)
  if (!valido) return texto("echo ''; echo 'Link de instalação vencido. Gere outro em Ajustes > WhatsApp > Instalar a Gowa.'; exit 1");
  return texto(
    scriptInstalacao({
      origem: new URL(request.url).origin,
      dominio: cfg.instalar_dominio,
      usuario: cfg.gowa_usuario,
      senha: cfg.gowa_senha,
      segredo: cfg.webhook_segredo,
      chaveRelogio: cfg.relogio_chave,
    })
  );
}
