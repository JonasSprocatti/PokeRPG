/* Smoke do multiplayer num DOM de mentira (jsdom): importa a cadeia inteira de módulos e desenha as telas em
   vários estados (menu, lobby co-op/PvP/Raide, luta, render incremental).
   Por que existe: as máquinas de desenvolvimento não têm navegador, e `node --test` não vê DOM — então um erro ao
   DESENHAR a sala só apareceria pra quem joga. Não substitui o teste em duas abas de verdade; garante que nada
   estoura ao carregar e ao montar as telas.
   Como rodar (jsdom não é dependência do projeto, que é sem build e sem node_modules):
     cd /tmp/algum-lugar && npm init -y && npm i jsdom      # FORA do repositório: o projeto não tem node_modules
     JSDOM=/tmp/algum-lugar/node_modules/jsdom/lib/api.js node ferramentas/smoke-multiplayer.mjs */
let JSDOM;
for (const onde of [process.env.JSDOM, 'jsdom'].filter(Boolean)) {
  try { ({ JSDOM } = await import(onde)); break; } catch { /* tenta o próximo */ }
}
if (!JSDOM) {
  console.error('Este smoke precisa do jsdom (as máquinas de desenvolvimento não têm navegador).');
  console.error('  cd /tmp/algum-lugar && npm init -y && npm i jsdom');
  console.error('  JSDOM=/tmp/algum-lugar/node_modules/jsdom/lib/api.js node ferramentas/smoke-multiplayer.mjs');
  process.exit(2);
}

const dom = new JSDOM(`<!doctype html><html><body>
  <header><div id="topr"></div><div id="conta-chip"></div></header>
  <div id="app"></div></body></html>`, { url: 'https://www.pokerpg.com.br/' });
for (const k of ['window', 'document', 'navigator', 'location', 'localStorage', 'sessionStorage', 'HTMLElement', 'Node', 'CustomEvent', 'Event', 'getComputedStyle', 'requestAnimationFrame', 'matchMedia'])
  if (dom.window[k] !== undefined) globalThis[k] = dom.window[k];
globalThis.matchMedia = globalThis.matchMedia || (() => ({ matches: false, addEventListener() {}, addListener() {} }));
globalThis.fetch = async () => { throw new Error('sem rede no smoke'); };

const R = new URL('../js/', import.meta.url).href;
const mp = await import(R + 'multiplayer.js');
const { meuId } = await import(R + 'mp-rede.js');
const EU = meuId();
const { G } = await import(R + 'estado.js');
const { telaSala, renderSala } = await import(R + 'mp-telas.js');
let falhas = 0;
const conferir = (ok, oque) => { console.log(`${ok ? '✔' : '❌'} ${oque}`); if (!ok) falhas++; };

mp.telaMultiplayer();
const menu = document.getElementById('app').innerHTML;
conferir(menu.includes('Criar sala') && menu.includes('mp-codigo'), 'menu: criar + campo de código');
conferir(!menu.includes('mp-entrada"'), 'menu: a escolha de Pokémon saiu daqui');

const salaBase = extra => ({ codigo: 'K7Q2', anfitriao: true, membros: [], zona: 'rota1', batalha: null, acoes: {}, acoesFeitas: [],
  escolhidos: new Set(), mensagens: [], hallSel: { selecao: [], equipamento: {} }, hallMons: [], convidado: null, pronto: false,
  entradaTipo: 'convidado', config: { modo: 'coop', porJogador: 1, balancear: true }, time: 'A', entrouEm: 1, ...extra });
const desenhar = sala => {
  if (G.sala) clearInterval(G.sala.relogio);
  G.sala = sala; telaSala();
  const html = document.getElementById('app').innerHTML;
  conferir(!html.includes('Algo quebrou'), `render sem cair no catch (${sala.config.modo}, ${sala.entradaTipo})`);
  return html;
};

const membro = (id, nome, extra = {}) => ({ id, nome, anfitriao: id === 'eu', entrouEm: 1, mons: [], ...extra });
let h = desenhar(salaBase({ membros: [membro('eu', 'Você'), membro('ana', 'Ana', { entradaTipo: 'espectador' })] }));
conferir(h.includes('K7Q2') && h.includes('mp-copiar'), 'lobby: código grande + botões de convite');
conferir(h.includes('👁 assistindo') && h.includes('⏳ escolhendo'), 'lobby: selos de estado por jogador');
conferir(h.includes('mp-cfg') && h.includes('mp-chip'), 'lobby: configuração em botões-cartão');
conferir(h.includes('mp-motivo') && h.includes('Co-op é jogar a run'), 'lobby: motivo de o botão estar apagado');
conferir(h.includes('👁 Só assistir'), 'lobby: opção de espectador');

h = desenhar(salaBase({ config: { modo: 'raide', porJogador: 3, balancear: true }, entradaTipo: 'hall', membros: [membro('eu', 'Você')] }));
conferir(h.includes('Hall da Fama') && !h.includes('Um Pokémon convidado'), 'raide: só Hall e assistir');

h = desenhar(salaBase({ anfitriao: false, config: { modo: 'pvp', porJogador: 2, balancear: false }, membros: [membro('eu', 'Você')] }));
conferir(h.includes('mp-chip') && h.includes('disabled'), 'convidado vê a configuração (travada)');
conferir(!h.includes('data-act="mp-pvp"'), 'convidado não vê o botão de começar');

/* ---------- cena de batalha ---------- */
const monFake = (ref, dono, nome, hp = 30) => ({ ref, dono, nome, level: 30, hp, stats: { hp: 30, attack: 20, defense: 20, 'special-attack': 20, 'special-defense': 20, speed: 20 },
  id: 25, types: ['electric'], status: hp < 15 ? 'psn' : null, vol: { stages: { attack: 1 }, conf: false },
  moves: [{ name: 'thunderbolt', type: 'electric', cls: 'special', power: 90, pp: 15, ppLeft: 12 }],
  data: { sprite: 'a.png', back: 'b.png', speciesName: 'pikachu', types: ['electric'] }, slot: 0 });
const batalha = {
  turno: 4, campo: { clima: null, terreno: null, lados: { A: {}, B: {} } }, evento: null, pvp: false,
  lados: { A: [monFake('A0', EU, 'Pikachu'), monFake('A1', 'ana', 'Bulbasaur', 10)], B: [monFake('B0', 'ia', 'Rattata selvagem')] },
};
h = desenhar(salaBase({ membros: [membro(EU, 'Você', { mons: [1] }), membro('ana', 'Ana', { mons: [1] })], batalha,
  prazo: Date.now() + 30000, acoesFeitas: ['A1'], historico: [{ turno: 3, linhas: ['Pikachu usou Thunderbolt!'] }] }));
conferir(h.includes('scene battle mp-cena'), 'batalha: cena de verdade (fundo + sprites)');
conferir(h.includes('spr back') && h.includes('class="plate"'), 'batalha: sprite de costas do meu lado + placa');
conferir(h.includes('mp-prazo-fill') && h.includes('mp-relogio'), 'batalha: barra de prazo');
conferir(h.includes('mp-ficha') && h.includes('⏳') && h.includes('✓'), 'batalha: fichas de quem já escolheu');
conferir(h.includes('mp-historico') && h.includes('Turno 3'), 'batalha: histórico dos turnos anteriores');
conferir(h.includes('class="moves"') && h.includes('Thunderbolt'), 'batalha: golpes clicáveis');
conferir(h.includes('st-psn') || h.includes('class="chips"'), 'batalha: status e estágios visíveis');

/* ---------- render incremental: nada mudou, nada é reescrito ---------- */
const alvo = document.getElementById('mp-topo').firstElementChild;
alvo.dataset.marca = 'sobreviveu';
renderSala();
conferir(document.getElementById('mp-topo').firstElementChild?.dataset.marca === 'sobreviveu', 'render não mexe no DOM quando nada mudou');
G.sala.batalha = { ...batalha, lados: { ...batalha.lados, B: [{ ...batalha.lados.B[0], hp: 3 }] } };   // o inimigo levou dano
renderSala();
conferir(document.getElementById('mp-topo').firstElementChild?.dataset.marca !== 'sobreviveu', 'render reescreve quando algo muda');

if (G.sala) clearInterval(G.sala.relogio);
console.log(falhas ? `\n${falhas} falha(s)` : '\ntudo certo');
process.exit(falhas ? 1 : 0);
