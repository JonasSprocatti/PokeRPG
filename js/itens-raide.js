/* ============ itens de raide: contra quais chefes cada um serve ============
   Os prêmios do chefe da semana são um RODÍZIO, não temáticos (o Groudon dá Prisma de Luz, que só serve contra chefe
   com ponto fraco, e ele não tem; o Calyrex dá Célula Zygarde, que só serve contra a regeneração do Zygarde). Então
   ninguém sabe olhando o item se ele presta pra luta de hoje — e o jogador guardava, gastava ou desistia às cegas.
   Este módulo responde "serve contra quem?" LENDO O CÓDIGO (a config de cada chefe em boss.CHEFES e os golpes dele em
   evento.EVENTOS), e a descrição de cada item em dados.js traz a mesma lista. `tests/itens-raide.test.js` confere que
   as duas batem, então chefe novo ou mecânica nova não deixa o texto mentindo.
   Sem DOM: só monta dados e strings. */
import { EVENTOS } from './evento.js';
import { CHEFES, ITEM_DO_RAIDE } from './boss.js';
import { ITEMS } from './dados.js';
import { esc } from './util.js';

/* O tipo de cada golpe que um chefe usa. A PokéAPI tem isso, mas a luta do chefe é montada com nomes (evento.EVENTOS
   guarda só `golpes: ['flamethrower', …]`) e este módulo precisa responder SEM rede. O teste falha se algum chefe
   usar um golpe que não esteja aqui — chefe novo obriga a completar a tabela. */
export const TIPO_DO_GOLPE = {
  'sludge-wave': 'poison', 'dragon-pulse': 'dragon', flamethrower: 'fire', 'flash-cannon': 'steel', 'dragon-claw': 'dragon',
  'air-slash': 'flying', earthquake: 'ground', 'extreme-speed': 'normal', 'fire-blast': 'fire', 'stone-edge': 'rock',
  overheat: 'fire', surf: 'water', 'ice-beam': 'ice', thunder: 'electric', 'hydro-pump': 'water', psychic: 'psychic',
  'focus-blast': 'fighting', 'shadow-ball': 'ghost', thunderbolt: 'electric', 'dark-pulse': 'dark', 'sacred-sword': 'fighting',
  'close-combat': 'fighting', 'fusion-bolt': 'electric', 'earth-power': 'ground', 'shadow-claw': 'ghost', 'draco-meteor': 'dragon',
  'hammer-arm': 'fighting', 'gunk-shot': 'poison', 'thousand-arrows': 'ground', 'thunder-punch': 'electric'
};
// todos os tipos de golpe que o chefe usa: os 4 golpes normais + o golpe carregado (que já traz o tipo na config)
export const tiposDoChefe = ev => new Set([...ev.golpes.map(g => TIPO_DO_GOLPE[g]), CHEFES[ev.chefe]?.canhao?.type].filter(Boolean));
const usaTipo = (...tipos) => ev => tipos.some(t => tiposDoChefe(ev).has(t));

/* Regra de "serve" de cada item. `todos` = a mecânica existe em qualquer chefe (todo chefe tem couraça ou pode ser
   exposto, todo chefe carrega um golpe, todo time tem Velocidade). Os outros dependem de algo que só alguns têm. */
const todos = () => true;
export const SERVE = {
  'cristal-de-ruptura': todos, 'selo-de-interrupcao': todos, 'escudo-astral': todos, 'espelho-reverso': todos,
  'relogio-de-areia': todos, 'fragmento-tera': todos,
  'cinza-vulcanica': usaTipo('fire'), 'escama-abissal': usaTipo('water'),
  'prisma-de-luz': ev => !!CHEFES[ev.chefe]?.pontoFraco,
  'celula-zygarde': ev => !!CHEFES[ev.chefe]?.regenera,
  // segurados de prêmio que reduzem dano de um tipo: servem contra quem ataca com ele
  'escama-do-ceu': usaTipo('flying', 'dragon'), 'cristal-psiquico': usaTipo('psychic'), 'cristal-gelido': usaTipo('ice'),
  // passivos que ajudam em qualquer luta
  'redea-espectral': todos, 'emblema-da-coroa': todos, 'presa-da-lua': todos, 'nucleo-eternamax': todos   // este depende do SEU time (bate com Dragão/Veneno?), não do chefe
};

// os chefes contra os quais o item (id em ITEMS) presta
export const chefesDoItem = id => EVENTOS.filter(SERVE[id] || (() => false));
// "todos os chefes" | "Groudon Primal" | "A e B" | "A, B e C" — o mesmo texto que a descrição do item leva
export function textoServe(id) {
  const l = chefesDoItem(id).map(e => e.nome);
  if (l.length === EVENTOS.length) return 'todos os chefes';
  return l.length <= 1 ? (l[0] || 'nenhum chefe') : `${l.slice(0, -1).join(', ')} e ${l[l.length - 1]}`;
}
// quais itens de raide servem contra este chefe (os 10 consumíveis, na ordem do jogo) — pra mostrar na caixa dele
export const itensQueServemContra = ev => Object.values(ITEM_DO_RAIDE).filter(id => SERVE[id]?.(ev));
// quem dá o item de prêmio: [{ nome, n }]
export const quemDa = id => EVENTOS.filter(e => e.recompensa?.itens?.[id]).map(e => ({ nome: e.nome, n: e.recompensa.itens[id] }));

/* Uma linha pra caixa do chefe: dos itens de raide que VOCÊ tem, quais servem contra ele e quais não (não gaste à toa).
   `inv` = a mochila da run (S.bag) ou o inventário da conta (evento.inventarioRaide). */
export function linhaItensDoChefe(ev, inv = {}) {
  const meus = CONSUMIVEIS.filter(id => (inv[id] || 0) > 0);
  if (!meus.length) return '<small>🎒 Você não tem itens de raide (vêm de prêmio ao vencer um chefe).</small>';
  const fmtI = id => `${esc(ITEMS[id].name)} ×${inv[id]}`;
  const servem = meus.filter(id => SERVE[id]?.(ev)), nao = meus.filter(id => !SERVE[id]?.(ev));
  return `<small>🎒 Seus itens de raide — <b>servem</b>: ${servem.length ? servem.map(fmtI).join(', ') : 'nenhum'}.${nao.length ? ` <span class="muted">Não servem contra ele: ${nao.map(fmtI).join(', ')}.</span>` : ''}</small>`;
}

const CONSUMIVEIS = Object.values(ITEM_DO_RAIDE);
const SEGURADOS_DE_PREMIO = ['nucleo-eternamax', 'escama-do-ceu', 'cristal-psiquico', 'cristal-gelido', 'redea-espectral', 'emblema-da-coroa', 'presa-da-lua'];
export { CONSUMIVEIS, SEGURADOS_DE_PREMIO };

/* A caixa "Itens de raide" da ajuda dos chefes: o que faz, contra quem serve e quem dá. O texto do "que faz" e a lista
   de chefes vêm da descrição do próprio item (dados.js), que é a fonte única mostrada também nas dicas dos botões e
   na mochila. */
export function htmlItensDeRaide() {
  const nomeDe = id => ITEMS[id].name;
  const linha = id => {
    const dados = quemDa(id).map(q => `${esc(q.nome)}${q.n > 1 ? ` (${q.n}×)` : ''}`).join(', ');
    // a descrição já termina em "Serve contra: …": separo pra mostrar em coluna própria
    const [faz, serve] = ITEMS[id].desc.split(/ Serve contra: /);
    return `<tr><td><b>${esc(nomeDe(id))}</b></td><td>${esc(faz.replace(/^Só na luta do chefe da semana: /, ''))}</td><td>${esc((serve || '').replace(/\.$/, ''))}</td><td><small>${dados || '—'}</small></td></tr>`;
  };
  const tabela = (ids, titulo) => `<h6>${titulo}</h6><div class="ajuda-tabela-caixa"><table class="ajuda-tabela">
    <thead><tr><th>Item</th><th>O que faz</th><th>Serve contra</th><th>Quem dá de prêmio</th></tr></thead>
    <tbody>${ids.map(linha).join('')}</tbody></table></div>`;
  return `<h5>Itens de raide</h5>
    <p class="small muted">Só vêm de prêmio (não há na loja). O prêmio gira entre os chefes, então <b>nem todo item serve contra o chefe da semana</b>: veja a coluna "Serve contra" antes de gastar. Sem ter o item no momento, o botão dele não aparece na luta.</p>
    ${tabela(CONSUMIVEIS, 'Consumíveis — usados durante a luta, um de cada tipo por luta (só se gasta se funcionar)')}
    ${tabela(SEGURADOS_DE_PREMIO, 'Itens de segurar — passivos, você equipa numa run')}`;
}
