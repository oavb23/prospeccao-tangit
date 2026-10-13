// Calendário de envios: fuso de São Paulo, dias úteis, feriados nacionais e janela de horário.
// Tudo que é "dia útil" ou "horário comercial" passa por aqui.

const FUSO = "America/Sao_Paulo";
const MIN = 60 * 1000;
const DIA = 24 * 60 * MIN;

const fmtPartes = new Intl.DateTimeFormat("en-US", {
  timeZone: FUSO,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
  weekday: "short",
});
const SEMANA = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

// Componentes da data no horário de São Paulo.
export function local(data) {
  const p = {};
  for (const { type, value } of fmtPartes.formatToParts(data)) p[type] = value;
  return {
    ano: Number(p.year),
    mes: Number(p.month),
    dia: Number(p.day),
    hora: Number(p.hour),
    minuto: Number(p.minute),
    semana: SEMANA[p.weekday],
  };
}

// Diferença (em minutos) entre o horário de São Paulo e o UTC naquele instante (hoje: -180).
function deslocamento(data) {
  const l = local(data);
  const comoUTC = Date.UTC(l.ano, l.mes - 1, l.dia, l.hora, l.minuto);
  return Math.round((comoUTC - Math.floor(data.getTime() / MIN) * MIN) / MIN);
}

// Monta um instante a partir de data e hora de São Paulo.
export function deLocal(ano, mes, dia, hora = 0, minuto = 0) {
  const palpite = new Date(Date.UTC(ano, mes - 1, dia, hora, minuto) + 180 * MIN);
  const ajuste = deslocamento(palpite);
  return new Date(Date.UTC(ano, mes - 1, dia, hora, minuto) - ajuste * MIN);
}

const chaveDia = (l) => `${l.ano}-${String(l.mes).padStart(2, "0")}-${String(l.dia).padStart(2, "0")}`;
export const diaLocal = (data) => chaveDia(local(data));

// Domingo de Páscoa (algoritmo de Meeus/Jones/Butcher).
function pascoa(ano) {
  const a = ano % 19;
  const b = Math.floor(ano / 100);
  const c = ano % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const mes = Math.floor((h + l - 7 * m + 114) / 31);
  const dia = ((h + l - 7 * m + 114) % 31) + 1;
  return Date.UTC(ano, mes - 1, dia);
}

const cacheFeriados = new Map();
// Feriados nacionais, Carnaval e Corpus Christi (dias em que quase ninguém atende).
export function feriadosDoAno(ano) {
  if (cacheFeriados.has(ano)) return cacheFeriados.get(ano);
  const fixos = ["01-01", "04-21", "05-01", "09-07", "10-12", "11-02", "11-15", "11-20", "12-25"].map((md) => `${ano}-${md}`);
  const p = pascoa(ano);
  const rel = (dias) => new Date(p + dias * DIA).toISOString().slice(0, 10);
  const lista = new Set([...fixos, rel(-48), rel(-47), rel(-2), rel(60)]);
  cacheFeriados.set(ano, lista);
  return lista;
}

// "15/08, 2026-12-24" → conjunto de datas extras (dd/mm vale para todo ano).
export function feriadosExtras(texto, ano) {
  const saida = new Set();
  for (const parte of String(texto || "").split(/[\s,;]+/)) {
    let m = parte.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (m) {
      saida.add(`${m[1]}-${m[2]}-${m[3]}`);
      continue;
    }
    m = parte.match(/^(\d{1,2})\/(\d{1,2})(?:\/(\d{4}))?$/);
    if (m) {
      const a = m[3] ? Number(m[3]) : ano;
      saida.add(`${a}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`);
    }
  }
  return saida;
}

export function ehDiaUtil(data, cfg = {}) {
  const l = local(data);
  if (l.semana === 0 || l.semana === 6) return false;
  const chave = chaveDia(l);
  if (feriadosDoAno(l.ano).has(chave)) return false;
  if (feriadosExtras(cfg.feriados_extras, l.ano).has(chave)) return false;
  return true;
}

const minutosDe = (hhmm, padrao) => {
  const m = String(hhmm || "").match(/^(\d{1,2}):(\d{2})$/);
  return m ? Number(m[1]) * 60 + Number(m[2]) : padrao;
};
export const janelaMinutos = (cfg = {}) => ({
  inicio: minutosDe(cfg.hora_inicio, 9 * 60),
  fim: minutosDe(cfg.hora_fim, 17 * 60),
});

// Dentro de um dia útil e entre o horário de início e de fim configurados.
export function dentroDaJanela(data, cfg = {}) {
  if (!ehDiaUtil(data, cfg)) return false;
  const l = local(data);
  const agora = l.hora * 60 + l.minuto;
  const { inicio, fim } = janelaMinutos(cfg);
  return agora >= inicio && agora < fim;
}

// Mesmo horário, avançando dia a dia até o primeiro dia útil (inclui o próprio dia).
export function proximoDiaUtil(data, cfg = {}) {
  let d = new Date(data);
  for (let i = 0; i < 30 && !ehDiaUtil(d, cfg); i++) d = new Date(d.getTime() + DIA);
  return d;
}

// Soma N dias úteis, mantendo o horário.
export function somarDiasUteis(data, n, cfg = {}) {
  let d = new Date(data);
  let faltam = Math.max(0, Math.round(Number(n) || 0));
  let guarda = 0;
  while (faltam > 0 && guarda++ < 400) {
    d = new Date(d.getTime() + DIA);
    if (ehDiaUtil(d, cfg)) faltam--;
  }
  return d;
}

export const somarDias = (data, n) => new Date(new Date(data).getTime() + Math.round(Number(n) || 0) * DIA);

// Sorteia um horário dentro da janela no dia (de São Paulo) da data informada.
// Evita os primeiros 15 min e os últimos 30 min, para os envios não se acumularem nas bordas.
export function horarioAleatorio(data, cfg = {}, sorteio = Math.random) {
  const l = local(data);
  const { inicio, fim } = janelaMinutos(cfg);
  const de = inicio + 15;
  const ate = Math.max(de + 1, fim - 30);
  const min = de + Math.floor(sorteio() * (ate - de));
  return deLocal(l.ano, l.mes, l.dia, Math.floor(min / 60), min % 60);
}

// Data de agendamento: dia útil (o próprio ou o seguinte) com horário sorteado dentro da janela.
export function agendarEm(data, cfg = {}, sorteio = Math.random) {
  return horarioAleatorio(proximoDiaUtil(data, cfg), cfg, sorteio);
}

// Próxima abertura da janela a partir de agora (para mostrar "o próximo envio sai às...").
export function proximaAbertura(data, cfg = {}) {
  if (dentroDaJanela(data, cfg)) return new Date(data);
  const { inicio } = janelaMinutos(cfg);
  let d = new Date(data);
  for (let i = 0; i < 30; i++) {
    const l = local(d);
    const abertura = deLocal(l.ano, l.mes, l.dia, Math.floor(inicio / 60), inicio % 60);
    if (abertura > data && ehDiaUtil(abertura, cfg)) return abertura;
    d = new Date(deLocal(l.ano, l.mes, l.dia, 12, 0).getTime() + DIA);
  }
  return d;
}
