/* Escreve `docs/saga-roteiro.md`: o roteiro COMPLETO da ⚔ Saga, capítulo por capítulo — missões, lugares (placa,
   baú, gatilho, luta, porta) e cada fala de cada personagem, com as condições e os efeitos em português.
   Sai do conteúdo de fábrica (`dados-saga-mundo.js`), então nunca fica velho: mexeu no mundo, rode de novo.
     node ferramentas/gerar-roteiro-saga.mjs
   O RESUMO da história (o mundo, os finais, as regras da escrita) continua em `docs/saga-historia.md`, à mão. */
import fs from 'node:fs';
import path from 'node:path';
import { CAPITULOS, MAPAS_SAGA, NPCS, MISSOES_SAGA, ITENS_SAGA, DONS, FACCOES } from '../js/dados-saga.js';
import { ITEMS } from '../js/dados.js';

const lista = v => (v == null ? [] : Array.isArray(v) ? v : [v]);
const txt = t => String(t ?? '').replace(/(<br\s*\/?>\s*)+/gi, ' ⏎ ').replace(/<\/?b>/gi, '**').replace(/<\/?i>/gi, '_');
const item = id => (ITENS_SAGA[id] ? `${ITENS_SAGA[id].emoji} ${ITENS_SAGA[id].nome}` : id);
const missao = id => MISSOES_SAGA[id]?.nome || id;
const etapa = e => (e === 'fim' ? 'concluída' : e === 'nao' ? 'não recebida' : `etapa ${e + 1}`);
const fac = f => (FACCOES[f] ? `${FACCOES[f].emoji} ${FACCOES[f].nome}` : f);
const nomeNpc = id => NPCS[id]?.nome || id;

function cond(se) {
  if (!se) return '';
  const p = [];
  for (const [k, v] of Object.entries(se)) {
    if (k === 'flag') p.push(lista(v).map(f => `\`${f}\``).join(' e '));
    else if (k === 'sem') p.push(`sem ${lista(v).map(f => `\`${f}\``).join(' nem ')}`);
    else if (k === 'item') p.push(`com ${lista(v).map(item).join(' e ')}`);
    else if (k === 'semItem') p.push(`sem ${lista(v).map(item).join(' nem ')}`);
    else if (k === 'rep') p.push(`${fac(v[0])} ≥ ${v[1]}`);
    else if (k === 'repAbaixo') p.push(`${fac(v[0])} < ${v[1]}`);
    else if (k === 'missao') p.push(`“${missao(v[0])}” ${etapa(v[1])}`);
    else if (k === 'tipo') p.push(`você é ${lista(v).join('/')}`);
    else if (k === 'falas') p.push(`${v[1]}ª conversa ou mais com ${nomeNpc(v[0])}`);
    else if (k === 'dom') p.push(`com o dom ${lista(v).map(d => DONS[d]?.nome || d).join(' ou ')}`);
    else if (k === 'aliado') p.push(`com aliado da ${fac(v)}`);
    else p.push(`${k}: ${JSON.stringify(v)}`);
  }
  return p.join(' · ');
}

function efeito(faz) {
  if (!faz) return '';
  const p = [];
  for (const [k, v] of Object.entries(faz)) {
    if (k === 'flag') p.push(`marca ${lista(v).map(f => `\`${f}\``).join(', ')}`);
    else if (k === 'tira') p.push(`apaga ${lista(v).map(f => `\`${f}\``).join(', ')}`);
    else if (k === 'item') p.push(`ganha ${lista(v).map(item).join(', ')}`);
    else if (k === 'perde') p.push(`entrega ${lista(v).map(item).join(', ')}`);
    else if (k === 'dinheiro') p.push(`${v > 0 ? '+' : ''}₽${v}`);
    else if (k === 'bag') p.push(v.map(([i, n]) => `${n}× ${ITEMS[i]?.name || i}`).join(', '));
    else if (k === 'rep') p.push(Object.entries(v).map(([f, n]) => `${FACCOES[f]?.emoji || f} ${n > 0 ? '+' : ''}${n}`).join(' '));
    else if (k === 'missao') p.push(`“${missao(v[0])}” → ${etapa(v[1])}`);
    else if (k === 'dom') p.push(`dom ${DONS[v] ? `${DONS[v].emoji} ${DONS[v].nome}` : v}`);
    else if (k === 'cura') p.push('descansa (cura)');
    else if (k === 'loja') p.push('abre a loja');
    else if (k === 'viajar') p.push('viaja');
    else if (k === 'fim') p.push(`🏁 **FINAL: ${v}**`);
    else if (k === 'parte') p.push(`um aliado da ${fac(v)} vai embora`);
    else p.push(`${k}: ${JSON.stringify(v)}`);
  }
  return p.join(' · ');
}
const entre = (s, a = '[', b = ']') => (s ? ` ${a}${s}${b}` : '');

function objeto(o) {
  const se = entre(cond(o.se), '_(se ', ')_');
  if (o.npc) return `🗣 ${nomeNpc(o.npc)}${se}`;
  if (o.porta) return `🚪 porta → ${MAPAS_SAGA[o.porta[0]]?.nome || o.porta[0]}${se}`;
  if (o.placa) return `🪧 “${txt(o.placa)}”${se}`;
  if (o.enfeite) return o.texto ? `🪧 “${txt(o.texto)}”${se}` : null;
  if (o.bau) return `📦 “${txt(o.texto)}”${entre(efeito(o.faz))}${se}`;
  if (o.gatilho) return `👣 “${txt(o.texto)}”${entre(efeito(o.faz))}${se}`;
  if (o.inimigo) return `⚔ luta (${o.inimigo.tipo}${o.inimigo.id ? `, \`venceu:${o.inimigo.id}\`` : ''})${o.inimigo.fala ? ` — “${txt(o.inimigo.fala)}”` : ''}${se}`;
  return null;
}

function npc(id, out) {
  const n = NPCS[id];
  out.push(`#### ${n.nome}`, '', 'Por onde a conversa começa (vale a primeira que bate):', '');
  for (const f of n.falas) out.push(`- ${cond(f.se) || '_sempre_'} → **${f.no}**`);
  out.push('');
  // os nós na ordem em que a conversa os alcança (cada ramo até o fim); o que nada alcança vai pro fim
  const ordem = [];
  const seguir = k => {
    if (!n.nos[k] || ordem.includes(k)) return;
    ordem.push(k);
    seguir(n.nos[k].vai);
    for (const o of n.nos[k].opcoes || []) seguir(o.vai);
  };
  n.falas.forEach(f => seguir(f.no));
  for (const k of Object.keys(n.nos)) if (!ordem.includes(k)) ordem.push(k);
  for (const k of ordem) {
    const no = n.nos[k];
    out.push(`- **${k}**: “${txt(no.fala)}”${entre(efeito(no.faz))}${no.vai ? ` → ${no.vai}` : ''}`);
    for (const o of no.opcoes || [])
      out.push(`  - ▸ _${txt(o.t)}_${entre(cond(o.se), '(se ', ')')}${entre(efeito(o.faz))}${o.vai ? ` → ${o.vai}` : ''}`);
  }
  out.push('');
}

export function roteiro() {
  const out = ['# ⚔ Saga — o roteiro completo', '',
    '> **GERADO** por `ferramentas/gerar-roteiro-saga.mjs` a partir de `js/dados-saga-mundo.js` — não editar à mão.',
    '> O resumo da história, os finais e as regras da escrita estão em `docs/saga-historia.md`.', '',
    'Legenda: 🗣 personagem · 🚪 porta · 🪧 placa · 📦 baú · 👣 ao pisar · ⚔ luta · ⏎ quebra de linha. ' +
    'Entre colchetes, o que acontece; em _(se …)_, quando aquilo está ali. Nome entre crases é uma marca do save.', ''];
  const visto = new Set(), dono = new Set();
  for (const c of CAPITULOS) {
    const mapas = Object.entries(MAPAS_SAGA).filter(([, m]) => m.cap === c.id);
    out.push(`## Capítulo ${c.n} · ${c.nome} — ${c.regiao}`, '');
    const ids = new Set(mapas.flatMap(([, m]) => Object.values(m.objs || {}).flatMap(lista).map(o => o.npc).filter(Boolean)));
    // a missão é do primeiro capítulo que a cita (num objeto do mapa ou na fala de quem mora lá)
    const texto = JSON.stringify([mapas.map(([, m]) => m.objs), [...ids].map(i => NPCS[i])]);
    const missoes = Object.entries(MISSOES_SAGA).filter(([id]) => !dono.has(id) && texto.includes(`"missao":["${id}",`));
    missoes.forEach(([id]) => dono.add(id));
    if (missoes.length) {
      out.push('### Missões', '');
      for (const [, m] of missoes) {
        out.push(`- **${m.nome}**${m.secreta ? ' 🤫 _secreta_' : ''}${m.falha ? ` · falha ${cond(m.falha)}` : ''}`);
        m.etapas.forEach((e, i) => out.push(`  ${i + 1}. ${txt(e)}`));
      }
      out.push('');
    }
    out.push('### Lugares', '');
    for (const [, m] of mapas) {
      out.push(`#### ${m.nome}`, '', `_${txt(m.desc)}_`, '');
      for (const o of Object.values(m.objs || {}).flatMap(lista)) { const l = objeto(o); if (l) out.push(`- ${l}`); }
      out.push('');
    }
    out.push('### Personagens', '');
    for (const id of ids) {
      if (visto.has(id)) { out.push(`- ${nomeNpc(id)} — falas no capítulo em que aparece primeiro.`, ''); continue; }
      visto.add(id); npc(id, out);
    }
  }
  return out.join('\n');
}

const RAIZ = path.resolve(import.meta.dirname, '..');
if (process.argv[1] === import.meta.filename) {
  fs.writeFileSync(path.join(RAIZ, 'docs/saga-roteiro.md'), roteiro() + '\n');
  console.log('docs/saga-roteiro.md escrito.');
}
