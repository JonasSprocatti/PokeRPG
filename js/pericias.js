/* ⚔ Modo Saga — as PERÍCIAS, o feito de cada ofício (puro, sem imports, sem DOM).

   Perícia não é golpe: não gasta PP, não sai da PokéAPI e não tem tabela de tipos. O recurso dela é **recarga
   em turnos**, guardada em `m.vol.cd = { pericia: turnos }` — e `vol` já é apagado no início e no fim de toda
   batalha, então nada disto encosta no save. É o que dá ritmo de ofício ao turno: o Guardião brada a cada 3
   turnos, o Curandeiro mantém o Bálsamo girando a cada 2, e a Muralha é o botão que se guarda pro momento ruim.

   Por que recarga e não mana: mana é uma segunda barra pra administrar (e pra encher fora da luta, em pousada ou
   item), e a Saga já administra HP, PP, itens e amizade. Recarga é o mesmo recurso do "cooldown" de todo RPG
   tático: zero UI nova além do número no botão, e a decisão continua sendo "agora ou guardo?". Está em
   `docs/plano-saga.md` como escolha fechada.

   Quem EXECUTA é `batalha.usarPericia` — e tudo o que ela faz é chamar o que já existe (`golpe.mudarEstagios`,
   `golpe.aplicarStatus`, a cura dos itens, `regras.abrirBrecha`). Nenhuma perícia reimplementa golpe: `golpe.js`
   continua sendo o único lugar que resolve um golpe.

   O nome de toda perícia é PT-BR e golpe segue em inglês na UI ("Protect", "Mean Look"). É a regra que deixa
   "Muralha" legível ao lado de Reflect sem ser a tradução dele.

   Este arquivo é o CHÃO do grafo (nenhum import), como `oficios.js` e `mp-sanear.js`: `regras.js`, `render.js`,
   `batalha.js` e os testes leem daqui. */

/* `alvo` existe pra TELA (dizer em quem a perícia cai) e pra narração; nenhuma perícia pede seleção manual de
   aliado — "o mais ferido" e "a comitiva toda" cobrem tudo o que a fase 1 precisa, e seleção de alvo aliado é
   decisão fechada de ficar fora (ver `docs/plano-saga.md`). Quem mira inimigo usa o FOCO da cena. */
export const PERICIAS = {
  brado: {
    nome: 'Brado de Ferro', oficio: 'guardiao', icone: '🛡', recarga: 3, alvo: 'eu',
    desc: 'Ergue o escudo e chama a luta pra si: a ameaça dele triplica por 2 turnos e a Defesa sobe um degrau.'
  },
  muralha: {
    nome: 'Muralha', oficio: 'guardiao', icone: '🧱', recarga: 5, alvo: 'comitiva',
    desc: 'A comitiva inteira toma metade do dano até o fim desta rodada.'
  },
  balsamo: {
    nome: 'Bálsamo', oficio: 'curandeiro', icone: '💚', recarga: 2, alvo: 'ferido',
    desc: 'Cura um terço do HP máximo de quem está mais ferido na comitiva. Curar chama atenção: a ameaça sobe.'
  },
  purificar: {
    nome: 'Purificar', oficio: 'curandeiro', icone: '✨', recarga: 4, alvo: 'comitiva',
    desc: 'Lava status, confusão e paixão de toda a comitiva.'
  },
  selo: {
    nome: 'Selo Arcano', oficio: 'arcano', icone: '🔮', recarga: 3, alvo: 'eu',
    desc: 'Marca o próximo golpe dele: abre 2 Brechas a mais e nenhuma resistência o reduz.'
  },
  estocada: {
    nome: 'Estocada', oficio: 'guerreiro', icone: '⚔', recarga: 3, alvo: 'eu',
    desc: 'O próximo golpe dele não erra e sai crítico.'
  },
  marca: {
    nome: 'Marca', oficio: 'encantador', icone: '🕯', recarga: 4, alvo: 'inimigo',
    desc: 'Amaldiçoa quem está em foco: ele toma 25% mais de todo dano por 2 turnos, e já perde meia Brecha.'
  },
  cancao: {
    nome: 'Canção de Guerra', oficio: 'bardo', icone: '🎻', recarga: 4, alvo: 'comitiva',
    desc: 'Ergue a comitiva: +1 de Ataque e +1 de Velocidade em todo mundo em campo.'
  }
};

/* As perícias de um ofício. Só o ofício MAIOR conta (`m.oficio`, congelado em `makeMon`) — o ofício menor existe
   pra LER o bicho ("Curandeiro-Guardião"), não pra dobrar o arsenal: um Miltank com as quatro perícias dos dois
   ofícios faria a comitiva de quatro virar uma de dois. */
export const periciasDoOficio = oficio => Object.keys(PERICIAS).filter(id => PERICIAS[id].oficio === oficio);
export const periciasDe = m => (m?.oficio ? periciasDoOficio(m.oficio) : []);

export const recargaDe = (m, id) => m?.vol?.cd?.[id] || 0;
// pronta = é perícia DELE (nunca a de outro ofício) e a recarga zerou
export const periciaPronta = (m, id) => !!PERICIAS[id] && periciasDe(m).includes(id) && !recargaDe(m, id);
export const temPericiaPronta = m => periciasDe(m).some(id => periciaPronta(m, id));
export const marcarRecarga = (m, id) => { if (m?.vol && PERICIAS[id]) (m.vol.cd ||= {})[id] = PERICIAS[id].recarga; };
// fim de rodada: um turno a menos em cada recarga (quem chega a zero sai do objeto, pra `vol` não inflar)
export function passarRecargas(m) {
  const cd = m?.vol?.cd; if (!cd) return;
  for (const id of Object.keys(cd)) if (--cd[id] <= 0) delete cd[id];
}
