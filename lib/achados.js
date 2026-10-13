// Do que foi coletado para o pré-relatório: pontos fortes (para a abertura), pontos encontrados (para os
// apontamentos), frases de cada canal e números em destaque. Também monta o rascunho sem IA.
// Regra de ouro: só afirma o que a coleta mostra; quando o dado é incerto, o texto diz isso.

import { medicao, hostDe } from "./coleta.js";
import { comparavel } from "../public/nomes.js";

const ANO_ATUAL = (d = new Date()) => Number(d.toLocaleString("en-CA", { timeZone: "America/Sao_Paulo" }).slice(0, 4));

// "11,3 mil" → 11300 · "2.647" → 2647 · "4,6" → 4.6
export function numero(bruto) {
  let s = String(bruto ?? "").trim().toLowerCase().replace(/\s+/g, "");
  if (!s) return null;
  let mult = 1;
  if (/milh/.test(s) || /\dmi$/.test(s)) mult = 1e6;
  else if (/mil|k$/.test(s)) mult = 1e3;
  s = s.replace(/[^\d.,]/g, "");
  if (!s) return null;
  if (s.includes(",") && s.includes(".")) s = s.replace(/\./g, "").replace(",", ".");
  else if (s.includes(",")) s = s.replace(",", ".");
  else if (/^\d{1,3}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, "");
  const n = Number(s) * mult;
  return Number.isFinite(n) ? n : null;
}
const fmtInt = (n) => Math.round(n).toLocaleString("pt-BR");
export function fmtCompacto(n) {
  if (n === null || n === undefined) return "";
  if (n >= 1e6) return `${(n / 1e6).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} mi`;
  if (n >= 1e4) return `${(n / 1e3).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} mil`;
  return fmtInt(n);
}
const fmtNota = (n) => n.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 2 });
const fmtSeg = (ms) => `${(ms / 1000).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} s`;
const juntar = (l) => (l.length <= 1 ? l.join("") : `${l.slice(0, -1).join(", ")} e ${l[l.length - 1]}`);
const primeiraFrase = (s, max = 150) => {
  const t = String(s || "").replace(/\s+/g, " ").trim();
  if (!t) return "";
  const corte = t.match(/^(.{20,}?[.!?])(\s|$)/)?.[1] || t;
  return corte.length > max ? corte.slice(0, max - 1).replace(/\s+\S*$/, "") + "…" : corte;
};
const primeiraLinha = (s) => String(s || "").split(/\n/).map((x) => x.trim()).find((x) => x.length >= 3) || "";

const PARADAS = new Set("para com sem uma umas uns que como mais muito muita pelo pela pelos pelas sua seu suas seus nossa nosso nossas nossos voce você desde aqui isso esta este essa esse onde quando todo toda todos todas cada entre sobre".split(" "));
const palavras = (s) => new Set(comparavel(s).split(" ").filter((p) => p.length >= 4 && !PARADAS.has(p)));
function semelhanca(a, b) {
  const A = palavras(a);
  const B = palavras(b);
  if (!A.size || !B.size) return 0;
  let comum = 0;
  for (const p of A) if (B.has(p)) comum++;
  return comum / Math.min(A.size, B.size);
}

// marca no título do site: "Início | Padaria Pão Bom" → "Padaria Pão Bom"
function marcaNoTitulo(titulo) {
  const partes = String(titulo || "")
    .split(/\s[|–—•:-]\s|\s\|\s?|\|/)
    .map((p) => p.trim())
    .filter((p) => p && !/^(home|inicio|início|pagina inicial|página inicial|bem[- ]vindo.*|site oficial)$/i.test(p));
  if (!partes.length) return "";
  return partes.sort((a, b) => a.length - b.length)[0];
}

// ------------------------------------------------------------------ frases de cada canal
export function canaisSugeridos(coleta, ctx = {}) {
  const site = coleta?.site;
  const m = coleta?.manual || {};
  const lista = [];
  if (site?.ok) {
    const h1 = site.h1 && site.h1.split(" ").length >= 3 && comparavel(site.h1) !== comparavel(ctx.nome) ? site.h1 : "";
    const frase = h1 || primeiraFrase(site.og_descricao || site.descricao);
    if (frase) lista.push({ canal: "Site", frase: primeiraFrase(frase, 140) });
  }
  const bio = primeiraLinha(m.instagram?.bio);
  if (bio) lista.push({ canal: "Instagram", frase: primeiraFrase(bio, 140) });
  const gdesc = primeiraFrase(m.google?.descricao, 140);
  if (gdesc) lista.push({ canal: "Google Meu Negócio", frase: gdesc });
  // a mesma frase em dois canais vira uma linha só ("Instagram e site")
  const saida = [];
  for (const c of lista) {
    const igual = saida.find((x) => comparavel(x.frase) === comparavel(c.frase));
    if (igual) igual.canal = `${igual.canal} e ${c.canal.toLowerCase() === "site" ? "site" : c.canal}`;
    else saida.push({ ...c });
  }
  return saida;
}

// promessas diferentes: na maioria dos pares de canais, as frases quase não têm palavras em comum
function promessasDiferentes(canais) {
  if (canais.length < 2) return false;
  let pares = 0;
  let diferentes = 0;
  for (let i = 0; i < canais.length; i++)
    for (let j = i + 1; j < canais.length; j++) {
      pares++;
      if (semelhanca(canais[i].frase, canais[j].frase) < 0.34) diferentes++;
    }
  return diferentes * 2 >= pares + (pares === 1 ? 1 : 0);
}

// ------------------------------------------------------------------ números em destaque
export function numerosSugeridos(coleta, ctx = {}) {
  const m = coleta?.manual || {};
  const s = [];
  if (ctx.anos >= 2) s.push({ chave: "anos", valor: String(ctx.anos), rotulo: "anos de operação" });
  const nota = numero(m.google?.nota);
  const aval = numero(m.google?.avaliacoes);
  if (nota && nota >= 4.5 && aval >= 20) s.push({ chave: "google", valor: fmtNota(nota), rotulo: `nota no Google, com ${fmtInt(aval)} avaliações` });
  else if (aval >= 200) s.push({ chave: "avaliacoes", valor: fmtCompacto(aval), rotulo: "avaliações no Google" });
  const seg = numero(m.instagram?.seguidores);
  if (seg >= 1000) s.push({ chave: "instagram", valor: fmtCompacto(seg), rotulo: "seguidores no Instagram" });
  const vel = coleta?.velocidade;
  if (vel?.ok && vel.nota >= 80) s.push({ chave: "velocidade", valor: String(vel.nota), rotulo: "de 100 no teste de velocidade do Google (celular)" });
  return s;
}

// ------------------------------------------------------------------ observações
// tipo "credito" (o que já existe e merece ser dito) ou "ponto" (o que a leitura encontrou)
export function observacoes(coleta, ctx = {}, agora = new Date()) {
  const obs = [];
  const add = (o) => obs.push({ peso: 5, tipo: "ponto", ...o });
  const site = coleta?.site;
  const vel = coleta?.velocidade;
  const m = coleta?.manual || {};
  const ig = m.instagram || {};
  const g = m.google || {};
  const ra = m.reclame_aqui || {};
  const an = m.anuncios || {};
  const med = medicao(site);
  const nome = ctx.nome || "a empresa";

  // ---- créditos
  if (ctx.anos >= 3) add({ id: "anos", tipo: "credito", area: "Negócio", peso: 9, fato: `${ctx.anos} anos de operação${ctx.ano_abertura ? ` (CNPJ aberto em ${ctx.ano_abertura})` : ""}${ctx.cidade ? `, em ${ctx.cidade}` : ""}.` });
  const nota = numero(g.nota);
  const aval = numero(g.avaliacoes);
  if (nota && nota >= 4.6 && aval >= 50) add({ id: "google_bom", tipo: "credito", area: "Google", peso: 8, fato: `Nota ${fmtNota(nota)} no Google, com ${fmtInt(aval)} avaliações.` });
  const seg = numero(ig.seguidores);
  if (seg >= 3000) add({ id: "insta_base", tipo: "credito", area: "Instagram", peso: 6, fato: `${fmtCompacto(seg)} seguidores no Instagram${ig.usuario ? ` (@${ig.usuario})` : ""}.` });
  if (med?.gtm) add({ id: "gtm", tipo: "credito", area: "Medição", peso: 3, fato: "O site já tem o Google Tag Manager instalado: a base para medir existe." });
  if (an.meta === "sim" || an.google === "sim")
    add({ id: "midia", tipo: "credito", area: "Mídia", peso: 4, fato: `Tem anúncios ativos ${juntar([an.google === "sim" && "no Google", an.meta === "sim" && "na Meta (Instagram e Facebook)"].filter(Boolean))}.` });
  if (vel?.ok && vel.nota >= 80) add({ id: "velocidade_boa", tipo: "credito", area: "Site", peso: 3, fato: `O site tira ${vel.nota} de 100 no teste de velocidade do Google para celular.` });

  // ---- marca: nomes e promessas
  const canais = canaisSugeridos(coleta, ctx);
  if (promessasDiferentes(canais)) {
    add({
      id: "promessas",
      area: "Marca",
      peso: canais.length >= 3 ? 10 : 8,
      fato: `Cada canal usa uma frase diferente: ${canais.map((c) => `“${c.frase}” (${c.canal})`).join("; ")}.`,
      titulo: `${canais.length === 2 ? "Duas" : canais.length === 3 ? "Três" : "Várias"} promessas diferentes, nenhuma repetida`,
      apoio: `Nenhuma frase se repete entre ${juntar(canais.map((c) => (c.canal === "Site" ? "o site" : c.canal)))} — o cliente não encontra uma resposta única para “por que essa empresa?”.`,
    });
  }
  const marcaSite = site?.ok ? marcaNoTitulo(site.og_titulo || site.titulo) : "";
  const wa = String(ctx.wa_nome || "").trim();
  if (wa && marcaSite && semelhanca(wa, marcaSite) === 0 && !comparavel(marcaSite).includes(comparavel(wa)) && !comparavel(wa).includes(comparavel(marcaSite))) {
    add({
      id: "nomes",
      area: "Marca",
      peso: 7,
      fato: `O nome muda entre canais: “${wa}” no WhatsApp e “${marcaSite}” no título do site.`,
      titulo: "A mesma marca aparece com nomes diferentes",
      apoio: `“${wa}” no WhatsApp, “${marcaSite}” no site.`,
    });
  }

  // ---- site
  if (m.sem_site) {
    add({ id: "sem_site", area: "Site", peso: 8, fato: "A empresa não tem um site próprio (conferido manualmente).", titulo: "A marca ainda não tem um site próprio", apoio: "Hoje, quem procura a empresa depende do perfil no Google e das redes — canais em que a marca segue as regras de outra plataforma." });
  } else if (site && !site.ok) {
    add({ id: "site_fora", area: "Site", peso: 7, fato: `O site informado (${hostDe(site.url_informada) || site.url_informada}) não abriu: ${site.erro || "erro"}.`, titulo: "O site não abriu no dia da leitura", apoio: "Quem tenta conhecer a empresa por ali encontra uma porta fechada." });
  }
  if (site?.ok) {
    if (!site.viewport) add({ id: "sem_viewport", area: "Site", peso: 8, fato: "A página não tem a configuração para se adaptar à tela do celular (meta viewport).", titulo: "O site não se adapta à tela do celular", apoio: "No celular, a página abre como no computador, em miniatura." });
    if (!site.https) add({ id: "sem_https", area: "Site", peso: 7, fato: "O site abre sem HTTPS (sem o cadeado de segurança).", titulo: "O site abre sem o cadeado de segurança", apoio: "Os navegadores marcam a página como “não segura” — antes mesmo de o cliente ler qualquer coisa." });
    const tituloFraco = !site.titulo || /^(home|in[ií]cio|p[aá]gina inicial|untitled|wordpress|site)$/i.test(site.titulo.trim()) || comparavel(site.titulo) === comparavel(hostDe(site.url_final));
    if (!site.descricao && !site.og_descricao)
      add({ id: "sem_descricao", area: "Site", peso: 5, fato: `O site não tem descrição para o Google (meta description)${tituloFraco ? ` e o título da página é “${site.titulo || "vazio"}”` : ""}.`, titulo: "O site não diz ao Google como quer aparecer na busca", apoio: `Sem a descrição da página${tituloFraco ? " e com um título genérico" : ""}, o Google escolhe sozinho o texto que mostra abaixo do nome.` });
    else if (tituloFraco) add({ id: "titulo_fraco", area: "Site", peso: 4, fato: `O título da página no Google é “${site.titulo || "vazio"}”.`, titulo: `Na busca do Google, o site se chama “${site.titulo || "sem título"}”`, apoio: "O título é a primeira linha que aparece na busca — e hoje ele não diz quem é a empresa." });
    if (!site.whatsapp && !site.telefone_clicavel)
      add({ id: "sem_whats_site", area: "Site", peso: site.formulario ? 3 : 5, fato: `O site não tem link direto para o WhatsApp nem telefone clicável${site.formulario ? " (tem formulário)" : ""}.`, titulo: "O site não leva direto para o WhatsApp", apoio: "Quem decide ali precisa procurar o número; um botão encurta o caminho até a conversa." });
    if (ig.usuario && !site.redes?.instagram)
      add({ id: "sem_link_insta", area: "Site", peso: 2, fato: "O site não tem link para o Instagram.", titulo: "Site e Instagram não se apontam", apoio: "Quem chega por um canal não encontra o caminho para o outro." });
    if (site.ano_rodape && site.ano_rodape <= ANO_ATUAL(agora) - 2)
      add({ id: "rodape", area: "Site", peso: 3, fato: `O rodapé do site mostra © ${site.ano_rodape}.`, titulo: `O rodapé do site ainda mostra ${site.ano_rodape}`, apoio: "Detalhe pequeno, mas que passa a impressão de site parado." });
  }
  if (vel?.ok && vel.nota !== null && vel.nota < 50) {
    const lcp = vel.campo_lcp_ms || vel.lcp_ms;
    add({
      id: "lento",
      area: "Site",
      peso: vel.nota < 30 ? 7 : 5,
      fato: `Nota ${vel.nota}/100 no teste de velocidade do Google para celular${lcp ? `; o conteúdo principal aparece em ${fmtSeg(lcp)}${vel.campo_lcp_ms ? " (medido com visitantes reais)" : ""}` : ""}. O Google considera bom até 2,5 s.`,
      titulo: lcp ? `No celular, o site leva ${fmtSeg(lcp)} para mostrar o conteúdo principal` : "No celular, o site demora para abrir",
      apoio: `Nota ${vel.nota} de 100 no teste de velocidade do Google. A referência do próprio Google é até 2,5 s.`,
    });
  }

  // ---- medição e mídia
  if (med) {
    const incerto = med.gtm && !med.gtm_lido;
    const ressalva = incerto ? " (o site usa o GTM, que não pôde ser lido)" : med.gtm ? " nem dentro do Google Tag Manager" : "";
    if (!med.pixel_meta) {
      const anuncia = an.meta === "sim";
      add({
        id: "sem_pixel",
        area: "Mídia",
        peso: incerto ? 3 : anuncia ? 9 : 6,
        fato: `O Pixel da Meta não aparece no código do site${ressalva}.${anuncia ? " A empresa tem anúncios ativos na Meta." : ""}`,
        titulo: anuncia ? "Os anúncios no Instagram e no Facebook não enxergam o site" : "O site não conversa com o Instagram e o Facebook",
        apoio: anuncia
          ? "Sem o Pixel da Meta, não há como medir quem chega pelos anúncios — nem falar de novo com quem visitou e não chamou."
          : "Sem o Pixel da Meta, quem visita o site não pode ser lembrado depois nos anúncios (remarketing).",
      });
    }
    if (med.ua_antigo)
      add({ id: "ua_antigo", area: "Medição", peso: 6, fato: "O site ainda usa o Universal Analytics, a versão antiga do Google Analytics, que parou de registrar dados em 2023.", titulo: "O site ainda usa a versão antiga do Google Analytics", apoio: "Ela parou de registrar dados em 2023 — na prática, as visitas não estão sendo medidas." });
    else if (!med.ga4)
      add({ id: "sem_ga4", area: "Medição", peso: incerto ? 2 : 5, fato: `O Google Analytics 4 não aparece no código do site${ressalva}.`, titulo: "O site não mede as visitas com o Google Analytics", apoio: "Sem essa base, fica difícil saber de onde vem quem entra em contato — e o que funciona." });
    if (an.google === "sim" && !med.gads && !med.ga4)
      add({ id: "gads_sem_conversao", area: "Mídia", peso: incerto ? 3 : 8, fato: `A empresa anuncia no Google, mas a tag de conversão do Google Ads não aparece no site${ressalva}.`, titulo: "Os anúncios no Google não registram o que acontece no site", apoio: "Sem a tag de conversão, a campanha não aprende com quem de fato entrou em contato." });
  }
  if (an.meta === "sim" && an.google !== "sim" && an.google === "nao")
    add({ id: "so_meta", area: "Mídia", peso: 2, fato: "Anuncia na Meta, mas não tem anúncios ativos no Google." });

  // ---- Instagram
  if (ig.ultima_postagem) {
    const dias = Math.floor((agora - new Date(`${ig.ultima_postagem}T12:00:00-03:00`)) / 864e5);
    if (dias >= 30)
      add({
        id: "insta_parado",
        area: "Instagram",
        peso: dias >= 90 ? 8 : 6,
        fato: `A última publicação no Instagram é de ${ig.ultima_postagem.split("-").reverse().join("/")} (há ${dias} dias).`,
        titulo: dias >= 60 ? `O Instagram está parado há ${Math.round(dias / 30)} meses` : `O Instagram está parado há ${dias} dias`,
        apoio: "Para quem pesquisa a marca antes de comprar, perfil parado comunica abandono.",
      });
  }
  const conteudo = Array.isArray(ig.conteudo) ? ig.conteudo : [];
  if (conteudo.length && conteudo[0] === "oferta" && conteudo.length <= 2)
    add({ id: "insta_oferta", area: "Instagram", peso: 7, fato: "O Instagram é quase todo de oferta e preço.", titulo: "O Instagram fala quase só de oferta e preço", apoio: "Funciona para quem já vai comprar, mas não constrói preferência em quem ainda está escolhendo." });

  // ---- Google
  if (nota && nota < 4.4) add({ id: "google_nota", area: "Google", peso: nota < 4 ? 8 : 6, fato: `Nota ${fmtNota(nota)} no Google${aval ? `, com ${fmtInt(aval)} avaliações` : ""}.`, titulo: `Nota ${fmtNota(nota)} no Google`, apoio: "É o primeiro número que aparece para quem procura a empresa no Maps." });
  if (nota && aval !== null && aval < 30) add({ id: "poucas_aval", area: "Google", peso: 5, fato: `Só ${fmtInt(aval)} avaliações no Google.`, titulo: `Só ${fmtInt(aval)} avaliações no Google`, apoio: "Com a base de clientes que já existe, esse número pode crescer rápido." });
  if (g.responde === "nao") add({ id: "sem_resposta_google", area: "Google", peso: 4, fato: "As avaliações no Google ficam sem resposta da empresa.", titulo: "As avaliações no Google ficam sem resposta", apoio: "Responder também é comunicação: mostra a quem lê que existe alguém do outro lado." });

  // ---- Reclame Aqui
  const rep = String(ra.reputacao || "");
  const notaRa = numero(ra.nota);
  if (/nao recomendada|não recomendada|ruim/i.test(rep)) {
    const doisRetratos = nota && nota >= 4.3;
    add({
      id: "reclame",
      area: "Reputação",
      peso: 9,
      fato: `Reputação “${rep}” no Reclame Aqui${notaRa ? ` (nota ${fmtNota(notaRa)}/10)` : ""}${doisRetratos ? `, enquanto o Google mostra ${fmtNota(nota)}` : ""}.`,
      titulo: doisRetratos ? `${fmtNota(nota)} no Google e “${rep}” no Reclame Aqui: dois retratos da mesma empresa` : `Reputação “${rep}” no Reclame Aqui`,
      apoio: "Para quem pesquisa antes de comprar, o pior retrato costuma pesar mais.",
    });
  } else if (/regular/i.test(rep))
    add({ id: "reclame_regular", area: "Reputação", peso: 5, fato: `Reputação “Regular” no Reclame Aqui${notaRa ? ` (nota ${fmtNota(notaRa)}/10)` : ""}.`, titulo: "Reputação “Regular” no Reclame Aqui", apoio: "É um dos lugares onde o cliente confere a empresa antes de decidir." });

  return obs.sort((a, b) => b.peso - a.peso);
}

// ------------------------------------------------------------------ fontes consultadas (rodapé da página)
export function fontesUsadas(coleta, ctx = {}) {
  const m = coleta?.manual || {};
  const f = [];
  if (coleta?.site?.ok) f.push("site");
  if (coleta?.velocidade?.ok) f.push("teste de velocidade do Google");
  const ig = m.instagram || {};
  if (ig.seguidores || ig.bio || ig.ultima_postagem || (ig.conteudo || []).length) f.push("Instagram");
  if (m.google?.nota || m.google?.descricao) f.push("Google Meu Negócio");
  if (m.anuncios?.meta) f.push("Biblioteca de Anúncios da Meta");
  if (m.anuncios?.google) f.push("Centro de Transparência de Anúncios do Google");
  if (m.reclame_aqui?.reputacao) f.push("Reclame Aqui");
  if (ctx.anos) f.push("cadastro público do CNPJ");
  return f;
}

// ------------------------------------------------------------------ rascunho sem IA
export function escolherApontamentos(obs, max = 4) {
  const pontos = obs.filter((o) => o.tipo === "ponto" && o.titulo);
  const escolhidos = [];
  const areas = new Set();
  for (const o of pontos) if (!areas.has(o.area) && escolhidos.length < max) (escolhidos.push(o), areas.add(o.area));
  for (const o of pontos) if (!escolhidos.includes(o) && escolhidos.length < max) escolhidos.push(o);
  return escolhidos.sort((a, b) => b.peso - a.peso);
}

export function rascunhoPorRegras(coleta, ctx, cfg, agora = new Date()) {
  const obs = observacoes(coleta, ctx, agora);
  const aps = escolherApontamentos(obs);
  const canais = canaisSugeridos(coleta, ctx);
  const m = coleta?.manual || {};
  const nota = numero(m.google?.nota);
  const aval = numero(m.google?.avaliacoes);
  const seg = numero(m.instagram?.seguidores);
  const conquistas = [];
  if (ctx.anos >= 3) conquistas.push(`${ctx.anos} anos de operação${ctx.cidade ? ` em ${ctx.cidade}` : ""}`);
  if (nota >= 4.5 && aval >= 30) conquistas.push(`nota ${fmtNota(nota)} no Google com ${fmtInt(aval)} avaliações`);
  if (seg >= 3000) conquistas.push(`${fmtCompacto(seg)} seguidores no Instagram`);
  const qtd = aps.length;
  const pontosTxt = qtd ? ` Ela chega a ${["", "um ponto", "dois pontos", "três pontos", "quatro pontos", "cinco pontos", "seis pontos"][qtd]}${qtd > 1 ? " — e todos voltam para a mesma área: a marca" : ""}.` : "";
  const abertura = conquistas.length
    ? `${juntar(conquistas).replace(/^./, (c) => c.toUpperCase())}: a ${ctx.nome} já construiu o que mais leva tempo para construir.\n\nEsta leitura é breve e parte só do que está público.${pontosTxt}`
    : `Esta é uma leitura breve da ${ctx.nome}, feita só com o que está público.${pontosTxt}`;
  return {
    abertura,
    numeros: numerosSugeridos(coleta, ctx).slice(0, 4).map(({ valor, rotulo }) => ({ valor, rotulo })),
    canais: canais.length >= 2 ? canais : [],
    canais_leitura: canais.length >= 2 && promessasDiferentes(canais) ? `Cada canal apresenta uma ${ctx.nome} diferente — então a percepção do cliente recomeça a cada ponto de contato.` : "",
    apontamentos: aps.map((o) => ({ area: o.area, titulo: o.titulo, apoio: o.apoio || "" })),
  };
}
