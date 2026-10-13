/* Formulário de WhatsApp do site (mesmo contrato do CRM antigo) — os contatos entram no funil da prospecção.
   Instalação: <script src="https://ENDERECO-DA-PROSPECCAO/widget.js" defer></script>  (antes do </body> ou via GTM → HTML personalizado)
   Qualquer botão do site abre o formulário com: data-crm-open  (ou href="#crm"). Opcional: data-crm-interest="Sofás"
   Sem botão flutuante: <script src=".../widget.js" data-float="false" defer></script> */
(function () {
  'use strict';
  if (window.__crmWidget) return;
  window.__crmWidget = true;
  var d = document, w = window, S = d.currentScript;
  var BASE = S ? new URL(S.src, location.href).origin : '';
  var FLOAT = !(S && S.getAttribute('data-float') === 'false');
  var P = 'crmw_';
  function get(k) { try { return JSON.parse(localStorage.getItem(P + k)); } catch (e) { return null; } }
  function put(k, v) { try { localStorage.setItem(P + k, JSON.stringify(v)); } catch (e) {} }
  function cookie(n) { var m = d.cookie.match('(?:^|; )' + n + '=([^;]*)'); return m ? decodeURIComponent(m[1]) : ''; }
  function digits(s) { return String(s || '').replace(/\D/g, ''); }
  function esc(s) { return String(s || '').replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  // 1) Captura de origem e jornada (roda em toda página onde o script estiver)
  var q = new URLSearchParams(location.search), touch = {}, has = false;
  ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'utm_id', 'gclid', 'gbraid', 'wbraid', 'fbclid', 'ttclid', 'msclkid'].forEach(function (k) {
    var v = q.get(k); if (v) { touch[k] = v.slice(0, 250); has = true; }
  });
  var ref = '';
  try { if (d.referrer && new URL(d.referrer).hostname !== location.hostname) ref = d.referrer.slice(0, 300); } catch (e) {}
  var newVisit = false;
  try { newVisit = !sessionStorage.getItem(P + 'v'); sessionStorage.setItem(P + 'v', '1'); } catch (e) {}
  if (has || newVisit) {
    touch.referrer = ref; touch.landing = location.href.slice(0, 500); touch.at = new Date().toISOString();
    if (!get('first')) put('first', touch);            // primeiro contato (nunca sobrescreve)
    if (has || ref || !get('last')) put('last', touch); // último contato não-direto
    if (newVisit) put('visits', (get('visits') || 0) + 1);
  }
  if (touch.fbclid) put('fbc', 'fb.1.' + Date.now() + '.' + touch.fbclid);
  var pages = get('pages') || [];
  pages.push([location.pathname.slice(0, 150), Date.now()]);
  put('pages', pages.slice(-25));

  function tracking() {
    var ga = cookie('_ga').split('.');
    return {
      first: get('first'), last: get('last'), visits: get('visits') || 1, pages: get('pages') || [], page: location.href.slice(0, 500),
      fbp: cookie('_fbp'), fbc: cookie('_fbc') || get('fbc') || '', ga_cid: ga.length >= 4 ? ga[2] + '.' + ga[3] : '', lang: navigator.language
    };
  }

  // 2) Botão + pop-up
  var cfg = null, root, modal, form, okBox;
  var ICON = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 8.6 8.6 0 0 1-3.8-.9L3 21l1.9-5.2A8.4 8.4 0 0 1 12 3a8.4 8.4 0 0 1 9 8.5z"/></svg>';
  function css(c) {
    return ':host{all:initial}*{box-sizing:border-box;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif}' +
      '.fab{position:fixed;right:18px;bottom:18px;z-index:2147483000;display:flex;align-items:center;gap:8px;background:' + c + ';color:#fff;border:0;border-radius:999px;padding:13px 18px;font-size:15px;font-weight:600;box-shadow:0 6px 20px rgba(0,0,0,.22);cursor:pointer}' +
      '.ov{position:fixed;inset:0;z-index:2147483001;background:rgba(0,0,0,.45);display:none;align-items:flex-end;justify-content:center}.ov.on{display:flex}' +
      '.box{background:#fff;color:#111;width:100%;max-width:420px;border-radius:18px 18px 0 0;padding:24px 22px 22px;position:relative;max-height:92vh;overflow:auto}' +
      '@media(min-width:560px){.ov{align-items:center}.box{border-radius:18px}}' +
      'h2{margin:0 0 4px;font-size:20px;line-height:1.25}p{margin:0 0 16px;color:#555;font-size:14px;line-height:1.4}' +
      'label{display:block;font-size:13px;font-weight:600;margin:0 0 12px;color:#222}' +
      'input,textarea{display:block;width:100%;margin-top:6px;padding:12px;border:1px solid #d4d4d4;border-radius:10px;font-size:16px;color:#111;background:#fff;outline:none}' +
      'input:focus,textarea:focus{border-color:' + c + ';box-shadow:0 0 0 3px rgba(0,0,0,.06)}textarea{resize:vertical;min-height:76px}' +
      '.hp{position:absolute;left:-9999px;width:1px;height:1px;opacity:0}' +
      '.go{width:100%;border:0;border-radius:10px;padding:14px;font-size:16px;font-weight:700;color:#fff;background:' + c + ';cursor:pointer}' +
      '.x{position:absolute;top:8px;right:10px;border:0;background:none;font-size:26px;line-height:1;color:#777;cursor:pointer;padding:6px}' +
      '.err{color:#b91c1c;font-size:13px;min-height:18px;margin:-4px 0 8px}.ok a{display:block;text-align:center;margin-top:8px;color:#111;font-weight:600}' +
      '[hidden]{display:none!important}';
  }
  function build() {
    var hostEl = d.createElement('div');
    hostEl.id = 'crm-widget';
    d.body.appendChild(hostEl);
    root = hostEl.attachShadow ? hostEl.attachShadow({ mode: 'open' }) : hostEl;
    root.innerHTML = '<style>' + css(cfg.color || '#25D366') + '</style>' +
      (FLOAT ? '<button class="fab" type="button">' + ICON + '<span>' + esc(cfg.label) + '</span></button>' : '') +
      '<div class="ov" role="dialog" aria-modal="true" aria-label="' + esc(cfg.title) + '"><div class="box"><button class="x" type="button" aria-label="Fechar">×</button>' +
      '<form novalidate><h2>' + esc(cfg.title) + '</h2><p>' + esc(cfg.intro) + '</p>' +
      '<label>Nome<input name="nome" autocomplete="name"></label>' +
      '<label>WhatsApp<input name="whats" type="tel" inputmode="tel" autocomplete="tel" placeholder="(11) 90000-0000"></label>' +
      '<label>O que você procura?<textarea name="busca" rows="3"></textarea></label>' +
      '<input class="hp" name="website" tabindex="-1" autocomplete="off" aria-hidden="true">' +
      '<div class="err" role="alert"></div><button class="go" type="submit">Enviar e abrir WhatsApp</button></form>' +
      '<div class="ok" hidden><h2>Pronto!</h2><p>Estamos abrindo o WhatsApp para você continuar a conversa.</p><a target="_blank" rel="noopener">Não abriu? Toque aqui</a></div></div></div>';
    modal = root.querySelector('.ov'); form = root.querySelector('form'); okBox = root.querySelector('.ok');
    var fab = root.querySelector('.fab');
    if (fab) fab.onclick = function () { open(); };
    root.querySelector('.x').onclick = close;
    modal.onclick = function (e) { if (e.target === modal) close(); };
    var ph = form.querySelector('[name=whats]');
    ph.oninput = function (e) {
      if (e && e.inputType && e.inputType.indexOf('delete') === 0) return;
      if (ph.selectionStart != null && ph.selectionStart < ph.value.length) return; // editando no meio: não mexe
      var v = digits(ph.value).slice(0, 11);
      ph.value = v.length > 10 ? '(' + v.slice(0, 2) + ') ' + v.slice(2, 7) + '-' + v.slice(7) : v.length > 6 ? '(' + v.slice(0, 2) + ') ' + v.slice(2, 6) + '-' + v.slice(6) : v.length > 2 ? '(' + v.slice(0, 2) + ') ' + v.slice(2) : v;
      try { ph.setSelectionRange(ph.value.length, ph.value.length); } catch (x) {}
    };
    form.onsubmit = submit;
  }
  function open(interest) {
    if (!cfg) return;
    form.hidden = false; okBox.hidden = true;
    if (interest) form.querySelector('[name=busca]').value = interest;
    modal.classList.add('on');
    setTimeout(function () { try { form.querySelector('[name=nome]').focus(); } catch (e) {} }, 50);
  }
  function close() { modal.classList.remove('on'); }

  function submit(e) {
    e.preventDefault();
    var name = form.querySelector('[name=nome]').value.trim(), phone = digits(form.querySelector('[name=whats]').value),
      interest = form.querySelector('[name=busca]').value.trim(), err = form.querySelector('.err');
    if (name.length < 2 || phone.length < 10) { err.textContent = 'Informe seu nome e WhatsApp com DDD.'; return; }
    err.textContent = '';
    var eid = 'crm.' + Date.now().toString(36) + '.' + Math.random().toString(36).slice(2, 8);
    var data = JSON.stringify({ name: name, phone: phone, interest: interest, hp: form.querySelector('[name=website]').value, event_id: eid, tracking: tracking() });
    // envia o contato para o CRM sem atrasar a abertura do WhatsApp
    var sent = false;
    try { sent = navigator.sendBeacon(BASE + '/api/public/lead', new Blob([data], { type: 'text/plain' })); } catch (x) {}
    if (!sent) { try { fetch(BASE + '/api/public/lead', { method: 'POST', body: data, keepalive: true, mode: 'no-cors', headers: { 'content-type': 'text/plain' } }); } catch (x) {} }
    // eventos para Pixel / GA4 / GTM (mesmo event_id da API de Conversões = sem duplicidade)
    try { if (w.fbq) w.fbq('track', 'Lead', { content_name: interest.slice(0, 100) }, { eventID: eid }); } catch (x) {}
    try { if (w.gtag) w.gtag('event', 'generate_lead', { method: 'crm_widget' }); } catch (x) {}
    (w.dataLayer = w.dataLayer || []).push({ event: 'crm_lead', crm_event_id: eid });
    var msg = (cfg.wa_template || 'Olá, me chamo {nome} e tenho interesse em {busca}')
      .replace(/\{nome\}/g, name.split(/\s+/)[0]).replace(/\{busca\}/g, interest || 'saber mais');
    var url = 'https://wa.me/' + (cfg.wa_number || '') + '?text=' + encodeURIComponent(msg);
    form.hidden = true; okBox.hidden = false; okBox.querySelector('a').href = url;
    if (/Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent)) setTimeout(function () { location.href = url; }, 400);
    else w.open(url, '_blank');
  }

  function start() {
    fetch(BASE + '/api/public/config').then(function (r) { return r.json(); }).then(function (c) { cfg = c; build(); }).catch(function () {});
    d.addEventListener('click', function (e) {
      var el = e.target && e.target.closest && e.target.closest('[data-crm-open],a[href="#crm"]');
      if (el) { e.preventDefault(); open(el.getAttribute('data-crm-interest')); }
    });
  }
  if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', start); else start();
  w.CRMWidget = { open: open };
})();
