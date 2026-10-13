// Script de instalação da VPS: Gowa (WhatsApp) + Caddy (HTTPS automático) + relógio dos envios.
// É entregue por um link temporário (30 minutos), gerado em Ajustes → WhatsApp.

export const IMAGEM_GOWA = "aldinokemal2104/go-whatsapp-web-multidevice:v9.6.0";

const aspas = (v) => String(v ?? "").replace(/["\\$`]/g, "");

export function scriptInstalacao({ origem, dominio, usuario, senha, segredo, chaveRelogio }) {
  const o = aspas(origem);
  return `#!/bin/sh
# Gowa (WhatsApp) + HTTPS + relógio dos envios — gerado pelo sistema de prospecção
set -e
echo ""
echo "==> Preparando a pasta /opt/tangit"
mkdir -p /opt/tangit && cd /opt/tangit

if ! command -v docker >/dev/null 2>&1; then
  echo "==> Instalando o Docker (leva 1 a 2 minutos)"
  curl -fsSL https://get.docker.com | sh
fi

cat > Caddyfile <<'FIM'
${aspas(dominio)} {
  reverse_proxy gowa:3000
}
FIM

cat > docker-compose.yml <<'FIM'
services:
  gowa:
    image: ${IMAGEM_GOWA}
    restart: always
    command: ["rest"]
    environment:
      APP_BASIC_AUTH: "${aspas(usuario)}:${aspas(senha)}"
      APP_OS: "Tangit"
      WHATSAPP_WEBHOOK: "${o}/api/gowa/webhook"
      WHATSAPP_WEBHOOK_SECRET: "${aspas(segredo)}"
      WHATSAPP_WEBHOOK_EVENTS: "message,message.ack"
      WHATSAPP_WEBHOOK_IGNORE_JIDS: "@g.us,@newsletter,status@broadcast"
      WHATSAPP_AUTO_DOWNLOAD_MEDIA: "false"
      WHATSAPP_PRESENCE_ON_CONNECT: "unavailable"
    volumes:
      - gowa_dados:/app/storages
  caddy:
    image: caddy:2
    restart: always
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile:ro
      - caddy_dados:/data
      - caddy_config:/config
  relogio:
    image: curlimages/curl:8.10.1
    restart: always
    entrypoint: ["/bin/sh", "-c"]
    command: ['while true; do curl -fsS -m 60 -X POST -H "x-relogio-chave: ${aspas(chaveRelogio)}" "${o}/api/automacao/tick" > /dev/null 2>&1; sleep 120; done']
volumes:
  gowa_dados:
  caddy_dados:
  caddy_config:
FIM

echo "==> Baixando e ligando a Gowa, o HTTPS e o relógio"
docker compose pull -q
docker compose up -d
echo ""
echo "Pronto. Volte ao sistema: Ajustes > WhatsApp > Conectar o WhatsApp."
`;
}
