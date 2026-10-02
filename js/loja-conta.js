/* ============ loja de preparo + Hall da Fama fora de uma run ============
   Extraído de arena.js (28/09/2026) pra virar compartilhado com a Sala de Raide (multiplayer.js): comprar
   cura/revive, itens de stat e itens de segurar com o SALDO da conta (progresso-conta.saldoArenaDaConta, sem
   run nenhuma por trás) e reconstruir um Pokémon do Hall da Fama (hall.js) pra lutar fora de uma run.
   Um lugar só evita o que já foi bug real: a validação de "o que pode entrar no inventário de conta"
   (evento.darItensDeRaide) e a lista do que a loja vende viviam espalhadas, fáceis de desalinhar.
   Tem rede (loadPokemon/loadMove): não é puro, mas também não tem DOM — quem desenha é arena.js/multiplayer.js. */
import { ITEMS, ITENS_SEGURADOS, API } from './dados.js';
import { inventarioRaide, darItensDeRaide } from './evento.js';
import { gastarSaldoArenaDaConta } from './carreira.js';
import { makeMon } from './pokemon.js';
import { loadPokemon, loadMove } from './api.js';
import { esc } from './util.js';

export const MAX_TIME_HALL = 3;   // no máximo 3 Pokémon do Hall por pessoa (Arena e Sala de Raide)
export const CURA_ARENA = ['potion', 'super-potion', 'hyper-potion', 'mega-potion', 'max-potion', 'full-restore',
  'antidote', 'paralyze-heal', 'awakening', 'burn-heal', 'ice-heal', 'full-heal', 'ether', 'max-ether', 'revive', 'max-revive'];
export const STATS_ARENA = ['x-attack', 'x-defense', 'x-sp-atk', 'x-sp-def', 'x-speed'];

/* ---------- comprar ---------- */
// cura/stat: se gastam no uso, sem teto de estoque (como a loja normal). segurado: compra UMA vez só (não se
// gasta equipando, só ocupa um slot). Devolve {ok, motivo?, preco?} — quem chama decide como avisar.
export function comprarComumConta(id) {
  if (!CURA_ARENA.includes(id) && !STATS_ARENA.includes(id)) return { ok: false };
  const preco = ITEMS[id]?.price || 0;
  if (!gastarSaldoArenaDaConta(preco)) return { ok: false, motivo: 'Saldo insuficiente.' };
  darItensDeRaide({ [id]: 1 });
  return { ok: true, preco };
}
export function comprarSeguradoConta(id) {
  if (!ITENS_SEGURADOS[id]) return { ok: false };
  if (inventarioRaide()[id] > 0) return { ok: false, motivo: `Já tem ${ITEMS[id].name}.` };
  const preco = ITEMS[id]?.price || 0;
  if (!gastarSaldoArenaDaConta(preco)) return { ok: false, motivo: 'Saldo insuficiente.' };
  darItensDeRaide({ [id]: 1 });
  return { ok: true, preco };
}

/* ---------- desenhar a loja e o "quem equipa o quê" (genérico: quem chama passa os data-act) ---------- */
export function htmlLojaConta(saldo, actComum, actSegurado) {
  const inv = inventarioRaide();
  const linhaComum = id => {
    const preco = ITEMS[id].price || 0;
    return `<li><span>${esc(ITEMS[id].name)} <b>×${inv[id] || 0}</b></span>
      <button class="btn ghost sm" data-act="${actComum}" data-v="${id}" ${saldo < preco ? 'disabled' : ''} title="${saldo < preco ? 'Saldo insuficiente' : esc(ITEMS[id].desc)}">Comprar ₽${preco.toLocaleString('pt-BR')}</button></li>`;
  };
  const linhaSegurado = id => {
    const preco = ITEMS[id].price || 0, tem = (inv[id] || 0) > 0;
    return `<li><span>${esc(ITEMS[id].name)} ${tem ? '✅' : ''}</span>
      <button class="btn ghost sm" data-act="${actSegurado}" data-v="${id}" ${tem || saldo < preco ? 'disabled' : ''} title="${tem ? 'Já tem — reutilizável, escolha quem equipa abaixo' : saldo < preco ? 'Saldo insuficiente' : esc(ITEMS[id].desc)}">${tem ? 'Adquirido' : `Comprar ₽${preco.toLocaleString('pt-BR')}`}</button></li>`;
  };
  return `<section class="pv conta"><div><h3>🎒 Loja de preparo</h3>
    <p class="small muted">Comprado com o saldo da conta (10% do dinheiro final de cada jornada terminada, pra sempre). Saldo: <b>₽${saldo.toLocaleString('pt-BR')}</b>.</p>
    <h4>❤ Cura e revive</h4><ul class="raide-lista">${CURA_ARENA.map(linhaComum).join('')}</ul>
    <h4>📈 Itens de stat</h4><ul class="raide-lista">${STATS_ARENA.map(linhaComum).join('')}</ul>
    <h4>🎽 Itens de segurar</h4><ul class="raide-lista">${Object.keys(ITENS_SEGURADOS).map(linhaSegurado).join('')}</ul></div></section>`;
}
// `entradas` = [{chave, rotulo}], `equipamento` = {chave: itemId}, `actAttr` = o atributo data-* do <select> (o
// change genérico de main.js já sabe ler `data-arena-equipar`/`data-mp-equipar`)
export function htmlEquiparConta(entradas, equipamento, actAttr) {
  if (!entradas.length) return '';
  const inv = inventarioRaide();
  const donos = Object.keys(ITENS_SEGURADOS).filter(id => (inv[id] || 0) > 0);
  const linha = e => {
    const atual = equipamento[e.chave] || '';
    const opcao = id => {
      const outroC = Object.keys(equipamento).find(c => equipamento[c] === id && c !== e.chave);
      const outro = outroC ? entradas.find(x => x.chave === outroC) : null;
      return `<option value="${id}" ${atual === id ? 'selected' : ''}>${esc(ITEMS[id].name)}${outro ? ` (tira de ${esc(outro.rotulo)})` : ''}</option>`;
    };
    return `<label class="equip-linha">${esc(e.rotulo)}
      <select ${actAttr}="${esc(e.chave)}">
        <option value="">Nenhum item</option>
        ${donos.map(opcao).join('')}
      </select></label>`;
  };
  return `<section class="pv conta"><div><h3>🎽 Equipar item</h3>
    <p class="small muted">${donos.length ? 'Opcional, vale a luta toda — compre na Loja de preparo pra ter o que escolher.' : 'Compre um item de segurar na Loja de preparo pra poder equipar.'}</p>
    ${entradas.map(linha).join('')}</div></section>`;
}

/* ---------- reconstruir um Pokémon do Hall pra lutar fora de uma run ---------- */
// ficha da PokéAPI + o que foi guardado (nível, IVs, EVs, natureza, habilidade, golpes) + o item de segurar
// escolhido na Loja de preparo (`itemId`; só entra se a conta realmente tem 1+ no inventário).
export async function reidratarHall(e, itemId) {
  // `genero: e.genero ?? null` fecha o sorteio: o Pokémon do Hall é um que JÁ nasceu, e sortear de novo aqui faria
  // o mesmo bicho entrar macho numa raide e fêmea na seguinte (entrada velha, de antes do gênero: fica sem).
  const m = await makeMon(await loadPokemon(e.id), e.nivel, { ivs: e.ivs, evs: e.evs, nature: e.nature, ability: e.ability, nick: e.nick, shiny: e.shiny, genero: e.genero ?? null });
  const golpes = (await Promise.all((e.moves || []).map(n => loadMove(`${API}/move/${n}/`).catch(() => null)))).filter(Boolean).map(g => ({ ...g, ppLeft: g.pp }));
  if (golpes.length) m.moves = golpes;
  if (itemId && inventarioRaide()[itemId] > 0) m.item = itemId;
  return m;
}
