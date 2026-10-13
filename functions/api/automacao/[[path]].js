import { json, erro, corpo } from "../../../lib/util.js";
import { garantirSchema } from "../../../lib/schema.js";
import { lerConfig, gravarConfig, configParaTela, filtrarEdicao, marcarMudanca } from "../../../lib/config.js";
import { clienteGowa, ErroGowa, jidDe, variantesNumero } from "../../../lib/gowa.js";
import {
  rodarRelogio,
  aprovar,
  acaoManual,
  enviarManual,
  verificarPendentes,
  filaDeAprovacao,
  painel,
  salvarRascunho,
  conversa,
} from "../../../lib/automacao.js";

// Rotas da automação de WhatsApp:
//   GET  /api/automacao/painel              situação do dia, próximos envios, alertas
//   GET  /api/automacao/novidades?desde=    algo mudou desde a última consulta? (telas abertas perguntam a cada 20 s)
//   GET  /api/automacao/config              ajustes (segredos mascarados)
//   PUT  /api/automacao/config              salva ajustes
//   POST /api/automacao/testar              testa a conexão com a Gowa
//   POST /api/automacao/conectar            { modo: "qr" | "codigo", telefone? }  conecta o WhatsApp na Gowa
//   POST /api/automacao/teste-envio         { numero, texto }  mensagem de teste
//   POST /api/automacao/instalacao          { dominio }  comando de instalação da VPS (link de 30 minutos)
//   GET  /api/automacao/fila                contatos aguardando aprovação do primeiro contato
//   POST /api/automacao/rascunho            { negocio_id, texto }  guarda o texto editado antes de aprovar
//   POST /api/automacao/aprovar             { itens: [{ negocio_id, texto }] }
//   POST /api/automacao/verificar           { ids?: [...] }  confere quais números têm WhatsApp
//   POST /api/automacao/acao                { negocio_id, acao }  pausar | retomar | assumir | outro_momento | desqualificar | reabrir | continuar | verificar | lidas
//   GET  /api/automacao/mensagens/:id       conversa de um negócio + modelos preenchidos
//   POST /api/automacao/enviar              { negocio_id, texto }  manda agora pelo WhatsApp
//   POST /api/automacao/tick                relógio (chamado a cada 2 minutos pela VPS)

export async function onRequest({ request, env, params }) {
  if (!env.DB) return erro("Banco de dados não configurado: falta o vínculo D1 com o nome DB no projeto.", 500);
  const db = env.DB;
  await garantirSchema(db);
  const [rota, id] = (params.path || []).map(String);
  const metodo = request.method.toUpperCase();
  const url = new URL(request.url);
  // modo de teste local: permite simular a data e hora (?agora=2026-10-13T13:00:00Z)
  const agora = env.MODO_TESTE === "1" && url.searchParams.get("agora") ? new Date(url.searchParams.get("agora")) : new Date();

  try {
    if (rota === "tick" && (metodo === "POST" || metodo === "GET")) {
      const cfg = await lerConfig(db);
      const chaveRelogio = request.headers.get("x-relogio-chave") || url.searchParams.get("chave") || "";
      const chaveTela = request.headers.get("x-access-key") || "";
      const autorizado = (cfg.relogio_chave && chaveRelogio === cfg.relogio_chave) || (env.ACCESS_KEY && chaveTela === env.ACCESS_KEY);
      if (!autorizado) return erro("Chave do relógio inválida.", 401);
      return json(await rodarRelogio(env, { agora }));
    }

    if (rota === "novidades" && metodo === "GET") {
      const { results } = await db.prepare("SELECT chave, valor FROM config WHERE chave IN ('mudou_em', 'gowa_alerta')").all();
      const v = Object.fromEntries(results.map((r) => [r.chave, r.valor || ""]));
      const mudou_em = v.mudou_em || "";
      if (mudou_em === (url.searchParams.get("desde") || "")) return json({ mudou: false, mudou_em, gowa_alerta: v.gowa_alerta || "" });
      const [pend, resp] = await db.batch([
        db.prepare(
          `SELECT COUNT(*) AS n FROM negocios n JOIN etapas et ON et.id = n.etapa_id
            WHERE et.papel = 'entrada' AND n.automacao = 'inativa' AND n.optout = 0 AND COALESCE(n.wa_status, '') NOT IN ('nao_tem', 'sem_numero')`
        ),
        db.prepare("SELECT COUNT(*) AS n FROM negocios WHERE nao_lidas > 0"),
      ]);
      return json({ mudou: true, mudou_em, gowa_alerta: v.gowa_alerta || "", pendentes: pend.results[0]?.n || 0, com_respostas: resp.results[0]?.n || 0 });
    }

    if (rota === "painel" && metodo === "GET") return json(await painel(db, agora));

    if (rota === "config" && metodo === "GET") {
      const cfg = await lerConfig(db);
      return json({ ...configParaTela(cfg), meta_ultimo: cfg.meta_ultimo || "", ultimo_relogio: cfg.ultimo_relogio || "", gowa_alerta: cfg.gowa_alerta || "" });
    }
    if (rota === "config" && metodo === "PUT") {
      const novos = filtrarEdicao(await corpo(request));
      await gravarConfig(db, novos);
      return json({ ok: true, salvos: Object.keys(novos) });
    }

    if (rota === "testar" && metodo === "POST") {
      const cfg = { ...(await lerConfig(db)), ...filtrarEdicao(await corpo(request)) };
      try {
        const st = await clienteGowa(cfg).status();
        const ok = !!(st?.is_connected && st?.is_logged_in);
        await gravarConfig(db, ok ? { gowa_alerta: "", gowa_ok_em: new Date().toISOString() } : { gowa_alerta: "O WhatsApp não está conectado na Gowa" });
        return json({ ok, status: st, numero: String(st?.jid || "").split("@")[0].split(":")[0] });
      } catch (e) {
        // Gowa no ar, mas ainda sem aparelho (instalação nova): falta só conectar o WhatsApp
        if (e instanceof ErroGowa && [400, 404].includes(e.status)) return json({ ok: false, status: { is_connected: false, is_logged_in: false }, erro: e.message });
        return json({ ok: false, erro: e.status === 401 ? "A Gowa recusou o usuário e a senha (confira os campos acima)." : e.message });
      }
    }

    if (rota === "conectar" && metodo === "POST") {
      const b = await corpo(request);
      const cfg = await lerConfig(db);
      let device = cfg.gowa_device;
      const base = clienteGowa(cfg);
      let lista = [];
      try {
        lista = await base.dispositivos();
      } catch (e) {
        if (e instanceof ErroGowa && (e.status === 401 || e.status === 0)) throw e;
      }
      if (!Array.isArray(lista)) lista = [];
      if (!device) device = lista.length === 1 ? lista[0].id : "tangit";
      if (!lista.some((d) => d.id === device)) {
        try {
          await base.criarDispositivo(device);
        } catch (e) {
          if (!/exist/i.test(e.message)) throw e;
        }
      }
      if (cfg.gowa_device !== device) await gravarConfig(db, { gowa_device: device });
      const gowa = clienteGowa({ ...cfg, gowa_device: device });
      const st = await gowa.status().catch(() => null);
      if (st?.is_logged_in) {
        await gravarConfig(db, { gowa_alerta: "", gowa_ok_em: new Date().toISOString() });
        return json({ ok: true, conectado: true, numero: String(st.jid || "").split("@")[0].split(":")[0] });
      }
      if (b.modo === "codigo") {
        const tel = variantesNumero(b.telefone)[0];
        if (!tel) return erro("Informe o seu número de WhatsApp com DDD.");
        const r = await gowa.loginCodigo(device, tel);
        return json({ ok: true, codigo: r?.pair_code || "" });
      }
      const r = await gowa.loginQR(device);
      if (!r?.qr_link) return erro("A Gowa não devolveu o QR code. Tente de novo.");
      const caminho = new URL(r.qr_link, cfg.gowa_url).pathname;
      return json({ ok: true, qr: await gowa.arquivo(caminho), duracao: Number(r.qr_duration) || 30 });
    }

    if (rota === "instalacao" && metodo === "POST") {
      const b = await corpo(request);
      const dominio = String(b.dominio || "").trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "");
      if (!/^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(dominio)) return erro("Endereço inválido. Ex.: gowa.tangit.com.br");
      const token = [...crypto.getRandomValues(new Uint8Array(16))].map((x) => x.toString(16).padStart(2, "0")).join("");
      const expira = Date.now() + 30 * 60000;
      await gravarConfig(db, { instalar_token: token, instalar_expira: String(expira), instalar_dominio: dominio, gowa_url: `https://${dominio}` });
      const link = `${url.origin}/api/instalar/${token}`;
      return json({ ok: true, comando: `curl -fsSL ${link} | sh`, link, expira: new Date(expira).toISOString() });
    }

    if (rota === "teste-envio" && metodo === "POST") {
      const b = await corpo(request);
      const numero = variantesNumero(b.numero)[0];
      if (!numero) return erro("Informe um número com DDD.");
      const cfg = await lerConfig(db);
      const r = await clienteGowa(cfg).enviarTexto(jidDe(numero), String(b.texto || "Teste da automação ✅").slice(0, 1000));
      return json({ ok: true, message_id: r?.message_id || null });
    }

    if (rota === "fila" && metodo === "GET") return json(await filaDeAprovacao(db));

    if (rota === "rascunho" && metodo === "POST") {
      const b = await corpo(request);
      return json(await salvarRascunho(db, Number(b.negocio_id), b.texto));
    }

    if (rota === "aprovar" && metodo === "POST") {
      const b = await corpo(request);
      return json(await aprovar(db, b.itens || [], agora));
    }

    if (rota === "verificar" && metodo === "POST") {
      const b = await corpo(request);
      const cfg = await lerConfig(db);
      const ids = (b.ids || []).map(Number).filter(Boolean);
      // até 6 por clique: cada número pode precisar de algumas consultas à Gowa (limite de chamadas por requisição)
      const r = await verificarPendentes(env, cfg, { ids: ids.length ? ids.slice(0, 6) : null, limite: ids.length ? Math.min(ids.length, 6) : 6, agora, ignorarLimiteDiario: !!ids.length });
      if (r.verificados) await marcarMudanca(db);
      return json(r);
    }

    if (rota === "acao" && metodo === "POST") {
      const b = await corpo(request);
      return json(await acaoManual(env, Number(b.negocio_id), String(b.acao || ""), agora));
    }

    if (rota === "mensagens" && id && metodo === "GET") return json(await conversa(db, Number(id)));

    if (rota === "enviar" && metodo === "POST") {
      const b = await corpo(request);
      return json(await enviarManual(env, Number(b.negocio_id), b.texto, agora));
    }
  } catch (e) {
    if (e instanceof ErroGowa) {
      if (e.desconectado) await gravarConfig(db, { gowa_alerta: e.message });
      return erro(`WhatsApp: ${e.message}`, 502);
    }
    return erro(e.message || String(e), 400);
  }

  return erro("Rota não encontrada.", 404);
}
