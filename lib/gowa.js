// Cliente da Gowa (go-whatsapp-web-multidevice) rodando na sua VPS.
// Documentação da API: https://github.com/aldinokemal/go-whatsapp-web-multidevice/blob/main/docs/openapi.yaml

const soDigitos = (v) => String(v ?? "").replace(/\D/g, "");

function base64(texto) {
  const bytes = new TextEncoder().encode(texto);
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin);
}

export class ErroGowa extends Error {
  constructor(mensagem, status, desconectado = false) {
    super(mensagem);
    this.status = status;
    this.desconectado = desconectado;
  }
}

export function clienteGowa(cfg) {
  const raiz = String(cfg.gowa_url || "").replace(/\/+$/, "");
  if (!raiz) throw new ErroGowa("Endereço da Gowa não configurado (Ajustes → WhatsApp).", 0);
  const cabecalhos = { accept: "application/json" };
  if (cfg.gowa_usuario || cfg.gowa_senha) cabecalhos.authorization = "Basic " + base64(`${cfg.gowa_usuario}:${cfg.gowa_senha}`);
  if (cfg.gowa_device) cabecalhos["x-device-id"] = cfg.gowa_device;

  async function chamar(caminho, { method = "GET", body, timeout = 20000 } = {}) {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), timeout);
    let resp;
    try {
      resp = await fetch(raiz + caminho, {
        method,
        headers: body ? { ...cabecalhos, "content-type": "application/json" } : cabecalhos,
        body: body ? JSON.stringify(body) : undefined,
        signal: ctrl.signal,
      });
    } catch (e) {
      throw new ErroGowa(e.name === "AbortError" ? "A Gowa demorou demais para responder." : "Não foi possível falar com a Gowa (servidor fora do ar?).", 0, true);
    } finally {
      clearTimeout(t);
    }
    const texto = await resp.text();
    let dados = null;
    try {
      dados = texto ? JSON.parse(texto) : null;
    } catch {}
    if (resp.status === 401) throw new ErroGowa("A Gowa recusou o usuário e a senha.", 401);
    if (!resp.ok) {
      const msg = String(dados?.message || texto || `HTTP ${resp.status}`).slice(0, 300);
      const desconectado = /not (logged|login|connected)|loggin|not connected|logout/i.test(msg);
      throw new ErroGowa(msg, resp.status, desconectado);
    }
    return dados?.results ?? dados;
  }

  // arquivo servido pela Gowa (ex.: imagem do QR code) → data URL para mostrar na tela
  async function arquivo(caminho) {
    const resp = await fetch(raiz + caminho, { headers: cabecalhos });
    if (!resp.ok) throw new ErroGowa(`Não consegui baixar o QR code da Gowa (HTTP ${resp.status}).`, resp.status);
    const tipo = resp.headers.get("content-type") || "image/png";
    const bytes = new Uint8Array(await resp.arrayBuffer());
    let bin = "";
    for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
    return `data:${tipo};base64,${btoa(bin)}`;
  }

  const disp = (id) => encodeURIComponent(id);
  return {
    status: () => chamar("/app/status"),
    existe: async (numero) => !!(await chamar(`/user/check?phone=${soDigitos(numero)}`))?.is_on_whatsapp,
    info: (jid) => chamar(`/user/info?phone=${encodeURIComponent(jid)}`),
    enviarTexto: (jid, texto) => chamar("/send/message", { method: "POST", body: { phone: jid, message: texto } }),
    // link com cartão de prévia (a Gowa abre a página e monta título, descrição e imagem); o texto sai como legenda + link
    enviarLink: (jid, legenda, link) => chamar("/send/link", { method: "POST", body: { phone: jid, caption: legenda, link }, timeout: 40000 }),
    perfilComercial: (jid) => chamar(`/user/business-profile?phone=${encodeURIComponent(jid)}`, { timeout: 8000 }),
    // aparelhos (sessões) da Gowa e conexão do WhatsApp por QR code ou código de pareamento
    dispositivos: () => chamar("/devices"),
    criarDispositivo: (id) => chamar("/devices", { method: "POST", body: { device_id: id } }),
    loginQR: (id) => chamar(`/devices/${disp(id)}/login`),
    loginCodigo: (id, telefone) => chamar(`/devices/${disp(id)}/login/code?phone=${soDigitos(telefone)}`, { method: "POST" }),
    arquivo,
  };
}

export const jidDe = (numero) => `${soDigitos(numero)}@s.whatsapp.net`;

// Formas possíveis de um número brasileiro no WhatsApp (com e sem o nono dígito).
export function variantesNumero(bruto) {
  let d = soDigitos(bruto);
  if (d.startsWith("55") && d.length >= 12) d = d.slice(2);
  d = d.replace(/^0+/, "");
  if (d.length < 10 || d.length > 11) return [];
  const ddd = d.slice(0, 2);
  const num = d.slice(2);
  const v = ["55" + d];
  if (num.length === 9 && num[0] === "9") v.push("55" + ddd + num.slice(1));
  if (num.length === 8 && /[6-9]/.test(num[0])) v.push("55" + ddd + "9" + num);
  return v;
}

// Confere se o número tem WhatsApp e descobre a forma exata (o "JID") que o WhatsApp usa.
export async function verificarNumero(gowa, numeros) {
  const tentados = new Set();
  for (const bruto of numeros) {
    for (const v of variantesNumero(bruto)) {
      if (tentados.has(v)) continue;
      tentados.add(v);
      if (!(await gowa.existe(v))) continue;
      let canonico = v;
      let nome = "";
      try {
        const info = await gowa.info(jidDe(v));
        const usuario = soDigitos(info?.devices?.[0]?.User);
        if (usuario.length >= 12) canonico = usuario;
        nome = String(info?.verified_name || "").trim();
      } catch {}
      return { tem: true, numero: canonico, nome, original: bruto };
    }
  }
  return { tem: false, tentados: [...tentados] };
}

// Assinatura do webhook (cabeçalho X-Hub-Signature-256: sha256=<hex>).
export async function assinaturaValida(corpoBruto, cabecalho, segredo) {
  if (!segredo) return false;
  const recebida = String(cabecalho || "").replace(/^sha256=/, "").trim().toLowerCase();
  if (!/^[0-9a-f]{64}$/.test(recebida)) return false;
  const chave = await crypto.subtle.importKey("raw", new TextEncoder().encode(segredo), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const assinatura = await crypto.subtle.sign("HMAC", chave, new TextEncoder().encode(corpoBruto));
  const esperada = [...new Uint8Array(assinatura)].map((b) => b.toString(16).padStart(2, "0")).join("");
  let dif = 0;
  for (let i = 0; i < 64; i++) dif |= esperada.charCodeAt(i) ^ recebida.charCodeAt(i);
  return dif === 0;
}

// Manda a mensagem; se ela termina com o link do pré-relatório sozinho na última linha, vai com o cartão de prévia.
// Se a Gowa não conseguir montar a prévia, sai como texto normal (o conteúdo é o mesmo).
export async function enviarMensagem(gowa, jid, texto, link = "") {
  const t = String(texto || "").trim();
  if (link && t.endsWith(link)) {
    const antes = t.slice(0, -link.length);
    if (!antes || /\n[ \t]*$/.test(antes)) {
      try {
        const r = await gowa.enviarLink(jid, antes.trim(), link);
        return { ...(r || {}), com_previa: true };
      } catch (e) {
        if (e instanceof ErroGowa && (e.desconectado || e.status === 401)) throw e;
      }
    }
  }
  return gowa.enviarTexto(jid, t);
}
