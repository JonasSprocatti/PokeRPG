/* ============ motor do golpe (único: single player e multiplayer) ============ */
// Tudo que acontece quando um Pokémon usa um golpe, muda estágios, pega status ou chega ao fim do turno — com as
// habilidades (habilidades.js) ligadas. Não sabe de tela nem de rede: quem chama passa um `ctx` que diz COMO narrar:
//   ctx.nome(m)      nome pra exibir (single player: HTML com <b>; multiplayer: texto puro)
//   ctx.golpe(g)     nome do golpe pra exibir
//   ctx.say(txt, cls)  narra (pode ser async: o single player espera entre mensagens)
//   ctx.atualizar()  redesenha (barras de HP) — opcional
//   ctx.tremer(m)    animação de quem levou dano — opcional
//   ctx.refDe(m) / ctx.monPorRef(ref)  identificam quem plantou Leech Seed (pra curar no fim do turno) — opcionais
//   ctx.campo        objeto do campo da batalha, compartilhado pelos dois lados: { clima, turnos } — opcional
// Golpes especiais (Protect, Rest, Explosion, carga/recarga…) vêm da tabela de especiais.js.
// Sem DOM: importável no Node (tests/golpe.test.js).
import { STAT_PT, AIL_MSG, SELF_TARGETS } from './dados.js';
import { hab } from './habilidades.js';
import { especial } from './especiais.js';
import { seg, fimDeTurnoDoItem, frutaAgora } from './segurados.js';
import { ITEMS } from './dados.js';
import { calcDamage, confDamage, heal, typeEff, chanceAcerto, imuneAoStatusMon, danoResidual, chanceOhko, effStat,
  CLIMAS, CLIMA_TURNOS, climaDe, danoClima, TERRENOS, TERRENO_TURNOS, terrenoDe, terrenoBloqueiaStatus, noChao,
  LADO_VAZIO, TELA_TURNOS, VENTO_TURNOS, MAX_ESPINHOS, MAX_TOXINAS, multTelas, temSalvaguarda, temNeblina,
  passarLado, NOME_LADO, danoPedras, danoEspinhos, efeitoToxinas, recalc, golpeDoClima } from './regras.js';
import { rand, clamp, fmt } from './util.js';

const nada = () => {};
const up = ctx => (ctx.atualizar || nada)();
const nomeDoItem = m => ITEMS[m.item]?.name || 'o item';
// sorteia um valor de uma lista [[valor, peso], …] (Effect Spore: sono 11, paralisia 9, veneno 10)
const sortearPeso = lista => {
  let r = Math.random() * lista.reduce((s, [, p]) => s + p, 0);
  for (const [v, p] of lista) if ((r -= p) < 0) return v;
  return lista[lista.length - 1][0];
};
const climaDoCtx = ctx => climaDe(ctx.campo);
const terrenoDoCtx = ctx => terrenoDe(ctx.campo);
// lado do campo de um Pokémon (telas, salvaguarda, armadilhas). ctx.ladoDe(m) diz em qual lado ele está.
export function ladoDoCampo(ctx, m) {
  const chave = ctx.ladoDe?.(m); if (!chave || !ctx.campo) return null;
  const lados = (ctx.campo.lados ||= {});
  return (lados[chave] ||= LADO_VAZIO());
}
// fim da rodada: telas, salvaguarda, névoa e vento andam um turno nos dois lados (batalha.js / mp-motor)
export async function passarLados(campo, ctx) {
  for (const lado of Object.values(campo?.lados || {})) {
    for (const k of passarLado(lado)) await ctx.say(`${NOME_LADO[k]} passou.`, 'muted');
  }
}
// liga um terreno novo (golpe ou habilidade) e narra
export async function mudarTerreno(terreno, ctx, quem = null) {
  if (!TERRENOS[terreno] || !ctx.campo) return false;
  const repetido = terrenoDoCtx(ctx) === terreno;
  if (repetido && ctx.campo.terrenoFixo) {          // o chão da rota já é este: continua permanente, não vira um de 5 turnos
    await ctx.say(`${TERRENOS[terreno].icone} O campo continua: ${TERRENOS[terreno].nome.toLowerCase()}.${quem ? ` (${ctx.nome(quem)})` : ''}`, 'status');
    return true;
  }
  ctx.campo.terreno = terreno; ctx.campo.terrenoTurnos = TERRENO_TURNOS; ctx.campo.terrenoFixo = false;
  await ctx.say(`${TERRENOS[terreno].icone} ${repetido ? `O campo continua: ${TERRENOS[terreno].nome.toLowerCase()}.` : TERRENOS[terreno].comeca}${quem ? ` (${ctx.nome(quem)})` : ''}`, 'status');
  return true;
}
// fim da rodada: o terreno anda um turno (chamado junto de passarClima)
export async function passarTerreno(campo, ctx) {
  if (!campo?.terrenoTurnos || campo.terrenoFixo) return;   // o chão da rota não gasta turno
  campo.terrenoTurnos--;
  if (campo.terrenoTurnos > 0) return;
  const t = TERRENOS[campo.terreno];
  campo.terreno = null;
  if (t) await ctx.say(t.acaba, 'muted');
  const p = campo.padrao?.terreno;                          // acabou o que foi trocado: a rota volta ao chão dela
  if (p && TERRENOS[p]) { campo.terreno = p; campo.terrenoTurnos = TERRENO_TURNOS; campo.terrenoFixo = true; await ctx.say(`${TERRENOS[p].icone} ${TERRENOS[p].comeca}`, 'status'); }
}
// liga um clima novo (golpe ou habilidade) e narra; o mesmo clima de novo só renova o tempo
export async function mudarClima(clima, ctx, quem = null) {
  if (!CLIMAS[clima] || !ctx.campo) return false;
  const repetido = climaDoCtx(ctx) === clima;
  if (repetido && ctx.campo.climaFixo) {            // o tempo da rota já é este: continua permanente, não vira um de 5 turnos
    await ctx.say(`${CLIMAS[clima].icone} O tempo continua: ${CLIMAS[clima].nome.toLowerCase()}.${quem ? ` (${ctx.nome(quem)})` : ''}`, 'status');
    return true;
  }
  ctx.campo.clima = clima; ctx.campo.turnos = CLIMA_TURNOS; ctx.campo.climaFixo = false;
  await ctx.say(`${CLIMAS[clima].icone} ${repetido ? `O tempo continua: ${CLIMAS[clima].nome.toLowerCase()}.` : CLIMAS[clima].comeca}${quem ? ` (${ctx.nome(quem)})` : ''}`, 'status');
  return true;
}
// fim da rodada: o clima anda um turno e acaba quando o tempo esgota (chamado por batalha.js e mp-motor.js)
export async function passarClima(campo, ctx) {
  if (!campo?.turnos || campo.climaFixo) return;           // o tempo da rota não gasta turno
  campo.turnos--;
  if (campo.turnos > 0) return;
  const c = CLIMAS[campo.clima];
  campo.clima = null;
  if (c) await ctx.say(c.acaba, 'muted');
  const p = campo.padrao?.clima;                            // acabou o que foi trocado: a rota volta ao tempo dela
  if (p && CLIMAS[p]) { campo.clima = p; campo.turnos = CLIMA_TURNOS; campo.climaFixo = true; await ctx.say(`${CLIMAS[p].icone} ${CLIMAS[p].comeca}`, 'status'); }
}

// Golpe em que o Pokémon está travado (carregando, em fúria) — a escolha do jogador/IA é ignorada neste turno
export const golpeTravado = m => m.vol?.carregando || m.vol?.furia?.golpe || null;
// Algo impediu de agir: carga e fúria se perdem (como nos jogos)
function interromper(u) { delete u.vol.carregando; delete u.vol.invul; delete u.vol.furia; }
// Fim da rodada (depois de todos agirem): proteções de um turno só acabam
export function fimDaRodada(m) { if (!m.vol) return; m.vol.flinch = false; m.vol.protegido = false; m.vol.aguenta = false; delete m.vol.punicao; }

// Muda estágios. `fonte` = quem causou (se for outro Pokémon, Clear Body & cia. podem impedir a queda)
/* Em QUEM o golpe mexe os atributos. A PokéAPI separa por categoria:
     'damage-lower' → mexe nos atributos do ALVO (Crunch, Acid Spray);
     'damage-raise' → mexe nos do USUÁRIO — inclusive quando o golpe baixa os DELE MESMO (Close Combat, Draco
                      Meteor, Overheat). Por isso a regra não é o sinal da mudança, é a categoria.
   Já foi bug real, relatado em jogo: o código comparava com 'damage+raise' (com +), string que a API nunca devolve,
   então Flame Charge, Power-Up Punch, Ancient Power e companhia davam o bônus pro OPONENTE. Aceita as duas grafias
   pra não depender de qual delas a API usa. */
export const mudaOUsuario = meta => /[-+]raise$/.test(meta?.cat || '');

/* Mudança de Postura (Aegislash). Golpe de dano vira a Forma Lâmina (ataque altíssimo, defesa de papel); King's
   Shield volta pra Forma Escudo. As duas formas têm os MESMOS números trocados de lado (Ataque ↔ Defesa e
   At. Esp. ↔ Def. Esp.), então a troca é espelhar os atributos base — sem buscar a outra forma na rede, o que
   deixaria a batalha esperando por uma requisição no meio do turno.
   Cuidado: `m.data` é o objeto do CACHE, compartilhado por todo Aegislash que aparecer. Por isso a troca cria uma
   cópia (`{ ...m.data, base }`) em vez de mexer no original — senão o primeiro Aegislash do jogo contaminaria os
   próximos, e o cache guardaria a forma errada. */
export async function trocarPostura(m, paraLamina, ctx) {
  const h = hab(m); if (!h.postura || !!m.lamina === paraLamina) return false;
  const base = { ...m.data.base };
  for (const [a, b] of [h.postura.ataque, h.postura.especial]) { const t = base[a]; base[a] = base[b]; base[b] = t; }
  m.data = { ...m.data, base };
  m.lamina = paraLamina;
  recalc(m); (ctx.atualizar || nada)();
  await ctx.say(`${ctx.nome(m)} mudou para a Forma ${paraLamina ? 'Lâmina' : 'Escudo'}!`, 'good');
  return true;
}
// `refletido` = esta mudança já é o rebote do Mirror Armor (não reflete de novo, senão dois espelhos se devolvem pra sempre)
export async function mudarEstagios(m, mudancas, ctx, fonte = null, refletido = false) {
  const h = hab(m);
  for (let c of mudancas) {
    if (!(c.stat in m.vol.stages)) continue;
    // Contrary inverte o sentido da mudança (queda vira alta) e Simple dobra o tamanho dela — as duas valem pra qualquer origem
    if (h.inverteEstagios) c = { ...c, change: -c.change };
    if (h.dobraEstagios) c = { ...c, change: c.change * 2 };
    // Mirror Armor: a queda causada por OUTRO Pokémon volta pra quem causou
    if (c.change < 0 && fonte && fonte !== m && h.espelhaQueda && !refletido) {
      await ctx.say(`A habilidade ${fmt(m.ability)} de ${ctx.nome(m)} devolveu o efeito!`);
      await mudarEstagios(fonte, [c], ctx, m, true); continue;
    }
    if (c.change < 0 && fonte && fonte !== m && (h.semQueda === 'todas' || h.semQueda?.includes(c.stat))) {
      await ctx.say(`A habilidade ${fmt(m.ability)} de ${ctx.nome(m)} impede que ${STAT_PT[c.stat]} caia!`); continue;
    }
    if (c.change < 0 && fonte && fonte !== m && temNeblina(ladoDoCampo(ctx, m))) {   // Mist
      await ctx.say(`${NOME_LADO.neblina} impede que ${STAT_PT[c.stat]} de ${ctx.nome(m)} caia!`); continue;
    }
    const cur = m.vol.stages[c.stat], nv = clamp(cur + c.change, -6, 6);
    if (nv === cur) { await ctx.say(`${STAT_PT[c.stat]} de ${ctx.nome(m)} não pode ${c.change > 0 ? 'subir' : 'cair'} mais!`); continue; }
    m.vol.stages[c.stat] = nv;
    const d = Math.abs(c.change), subiu = c.change > 0;
    await ctx.say(`${STAT_PT[c.stat]} de ${ctx.nome(m)} ${subiu ? (d >= 3 ? 'subiu drasticamente' : d === 2 ? 'subiu muito' : 'subiu') : (d >= 3 ? 'caiu drasticamente' : d === 2 ? 'caiu muito' : 'caiu')}!`, subiu ? 'good' : 'status');
    // Defiant / Competitive: uma queda causada por OUTRO Pokémon dispara o contra-ataque (a reação usa fonte = o próprio,
    // então não dispara de novo)
    if (!subiu && fonte && fonte !== m && h.aoSerBaixado) {
      await ctx.say(`A habilidade ${fmt(m.ability)} de ${ctx.nome(m)} reagiu!`, 'status');
      await mudarEstagios(m, [{ stat: h.aoSerBaixado[0], change: h.aoSerBaixado[1] }], ctx, m);
    }
  }
  up(ctx);
}

/* Forecast (Castform): a forma acompanha o tempo — Sol vira Fogo, Chuva vira Água, Granizo/Neve viram Gelo, o resto
   (inclusive areia) fica Normal. Muda os TIPOS (é o que pesa na luta) e o sprite. Chamado quando entra em campo, ao
   fim de cada turno e no começo de cada golpe (do usuário E do alvo), então uma troca de tempo no meio da rodada
   já vale no golpe seguinte. `m.data` é o objeto do CACHE (compartilhado): a troca cria uma CÓPIA, como a postura do
   Aegislash. Os ids das formas são os da PokéAPI (Sunny 10013, Rainy 10014, Snowy 10015). */
export const FORMA_CASTFORM = { sol: { tipo: 'fire', id: 10013 }, chuva: { tipo: 'water', id: 10014 }, granizo: { tipo: 'ice', id: 10015 }, neve: { tipo: 'ice', id: 10015 } };
const spriteDaForma = (url, id) => (url ? url.replace(/\/\d+\.(png|gif|webp)/, `/${id}.$1`) : url);
export async function ajustarForma(m, ctx) {
  if (!hab(m).formaDoClima || m.hp <= 0) return false;
  const alvo = FORMA_CASTFORM[climaDoCtx(ctx)] || null, chave = alvo ? alvo.tipo : null;
  if ((m.formaClima || null) === chave) return false;
  m.formaBase ||= { types: [...m.data.types], sprite: m.data.sprite, back: m.data.back, art: m.data.art };
  const b = m.formaBase;
  m.data = { ...m.data,
    types: alvo ? [alvo.tipo] : [...b.types],
    sprite: alvo ? spriteDaForma(b.sprite, alvo.id) : b.sprite, back: alvo ? spriteDaForma(b.back, alvo.id) : b.back, art: alvo ? spriteDaForma(b.art, alvo.id) : b.art };
  m.formaClima = chave;
  up(ctx);
  await ctx.say(`${ctx.nome(m)} mudou de forma com o tempo!`, 'status');
  return true;
}
// fim da batalha: volta à forma normal (a forma é do tempo daquela luta, não da espécie)
export function desfazerForma(m) {
  if (!m?.formaBase) return false;
  m.data = { ...m.data, types: [...m.formaBase.types], sprite: m.formaBase.sprite, back: m.formaBase.back, art: m.formaBase.art };
  delete m.formaBase; delete m.formaClima;
  return true;
}

/* Habilidades que agem ao ENTRAR em campo (o mesmo código no single player e no multiplayer):
   Intimidate baixa o Ataque do oponente — salvo quem é imune a ela (Inner Focus, Own Tempo, Oblivious) ou reage (Guard Dog
   sobe o Ataque em vez de cair); depois vêm o clima, o terreno e os degraus de entrada (Intrepid Sword…). Download lê os
   oponentes: se a Defesa deles é menor que a Def. Esp., sobe o Ataque; senão, o At. Esp.
   `entrantes` = quem acabou de entrar; `oponentesDe(m)` = quem está do outro lado dele. */
export async function aoEntrarEmCampo(entrantes, oponentesDe, ctx) {
  for (const a of entrantes) if (hab(a).intimida) {
    await ctx.say(`A Intimidação de ${ctx.nome(a)} assusta o oponente!`);
    for (const b of oponentesDe(a)) {
      const hb = hab(b);
      if (hb.imuneIntimidacao) { await ctx.say(`A habilidade ${fmt(b.ability)} de ${ctx.nome(b)} não se abala!`); continue; }
      if (hb.intimidaSobe) {
        await ctx.say(`A habilidade ${fmt(b.ability)} de ${ctx.nome(b)} reage à Intimidação!`, 'good');
        await mudarEstagios(b, [{ stat: 'attack', change: 1 }], ctx, b); continue;
      }
      await mudarEstagios(b, [{ stat: 'attack', change: -1 }], ctx, a); // Clear Body & cia. impedem
    }
  }
  for (const m of entrantes) {
    const h = hab(m);
    if (h.climaAoEntrar) await mudarClima(h.climaAoEntrar, ctx, m);
    if (h.terrenoAoEntrar) await mudarTerreno(h.terrenoAoEntrar, ctx, m);
    let est = h.estagioAoEntrar;
    if (h.analisa) {
      const ops = oponentesDe(m);
      const def = ops.reduce((s, o) => s + effStat(o, 'defense'), 0), esp = ops.reduce((s, o) => s + effStat(o, 'special-defense'), 0);
      est = [def < esp ? 'attack' : 'special-attack', 1];
      await ctx.say(`${ctx.nome(m)} analisou o oponente!`);
    } else if (est) await ctx.say(`${ctx.nome(m)} entra decidido!`);
    // passa por mudarEstagios, então Clear Body e Névoa continuam valendo — é o mesmo caminho da Intimidação
    if (est) await mudarEstagios(m, [{ stat: est[0], change: est[1] }], ctx, m);
  }
  for (const m of entrantes) await ajustarForma(m, ctx);   // Castform já entra na forma do tempo (o da rota ou o que acabou de ser ligado)
}

// Reação a levar um golpe de dano (Steam Engine, Stamina, Weak Armor, Sand Spit…). Dispara UMA vez por golpe, mesmo
// que ele acerte várias vezes.
async function reagirAoGolpe(t, g, crit, ctx) {
  for (const r of hab(t).aoSerAtingido || []) {
    if (r.tipos && !r.tipos.includes(g.type)) continue;
    if (r.cls && r.cls !== g.cls) continue;
    if (r.soCritico && !crit) continue;
    await ctx.say(`A habilidade ${fmt(t.ability)} de ${ctx.nome(t)} reagiu!`, 'status');
    if (r.estagios) await mudarEstagios(t, r.estagios.map(([stat, change]) => ({ stat, change })), ctx, t);
    if (r.clima) await mudarClima(r.clima, ctx, t);
    if (r.terreno) await mudarTerreno(r.terreno, ctx, t);
  }
}
// Magic Guard: nenhum dano que não venha direto de um golpe (veneno, queimadura, recuo, armadilha, espinhos…)
const indireto = m => !!hab(m).semDanoIndireto;
// Pressure: o oponente gasta 1 PP a mais ao usar um golpe contra quem tem
const pressao = (u, t, g) => (t !== u && !SELF_TARGETS.has(g.target) && hab(t).pressao ? 1 : 0);

// Aplica status (inclui confusão). `avisar` = narra por que não pegou (golpe de status); secundário falha calado.
// Armadilhas pegam quem ENTRA em campo (o próximo Pokémon do treinador / da fila de lendários)
export async function aplicarArmadilhas(m, ctx) {
  const lado = ladoDoCampo(ctx, m); if (!lado || m.hp <= 0) return;
  const semDano = indireto(m);   // Magic Guard: pedras e espinhos são dano indireto e não pegam (o veneno das toxinas é status, esse pega)
  if (lado.pedras && !semDano) {
    const d = danoPedras(m); m.hp = Math.max(0, m.hp - d); up(ctx);
    await ctx.say(`Pedras afiadas acertam ${ctx.nome(m)} ao entrar! (−${d})`, 'hit');
  }
  if (m.hp > 0 && lado.espinhos && !semDano) {
    const d = danoEspinhos(m, lado.espinhos);
    if (d) { m.hp = Math.max(0, m.hp - d); up(ctx); await ctx.say(`${ctx.nome(m)} pisa nos espinhos! (−${d})`, 'hit'); }
  }
  if (m.hp > 0 && lado.toxinas) {
    const r = efeitoToxinas(m, lado.toxinas);
    if (r === 'limpa') { lado.toxinas = 0; await ctx.say(`${ctx.nome(m)} absorveu os espinhos venenosos.`, 'muted'); }
    else if (r) {
      await aplicarStatus(m, 'poison', ctx);
      if (r === 'grave' && m.status === 'poison') { m.vol.toxico = 1; await ctx.say(`O veneno em ${ctx.nome(m)} é grave!`, 'status'); }
    }
  }
}

// `fonte` = quem causou (Salvaguarda só protege de status vindo do inimigo, como nos jogos)
export async function aplicarStatus(t, ail, ctx, avisar = false, fonte = null) {
  if (fonte && fonte !== t && temSalvaguarda(ladoDoCampo(ctx, t))) {
    if (avisar) await ctx.say(`${NOME_LADO.salvaguarda} protege ${ctx.nome(t)}!`);
    return;
  }
  // Leaf Guard: no sol forte não pega status nenhum
  if (hab(t).semStatusClima && hab(t).semStatusClima === climaDe(ctx.campo)) {
    if (avisar) await ctx.say(`A habilidade ${fmt(t.ability)} de ${ctx.nome(t)} protege ${ctx.nome(t)} no ${CLIMAS[climaDe(ctx.campo)].nome.toLowerCase()}!`);
    return;
  }
  // terreno: Campo Elétrico não deixa dormir, Campo de Névoa não deixa pegar status nenhum (só quem está no chão)
  if (terrenoBloqueiaStatus(terrenoDe(ctx.campo), t, ail)) {
    if (avisar) await ctx.say(`${TERRENOS[terrenoDe(ctx.campo)].nome} protege ${ctx.nome(t)}!`);
    return;
  }
  if (imuneAoStatusMon(t, ail)) {
    if (avisar) await ctx.say(hab(t).imuneStatus?.includes(ail) ? `A habilidade ${fmt(t.ability)} de ${ctx.nome(t)} impede isso!` : `Não afeta ${ctx.nome(t)}...`);
    return;
  }
  if (ail === 'confusion') {
    if (t.vol.conf > 0) { if (avisar) await ctx.say(`${ctx.nome(t)} já está confuso!`); return; }
    t.vol.conf = rand(2, 5); await ctx.say(`${ctx.nome(t)} ficou confuso!`, 'status'); return;
  }
  if (!AIL_MSG[ail]) { if (avisar) await ctx.say('Mas nada aconteceu... (este efeito será ajustado em atualizações futuras)', 'muted'); return; }
  if (t.status) { if (avisar) await ctx.say(`${ctx.nome(t)} já tem uma condição de status.`); return; }
  t.status = ail; delete t.vol.toxico; if (ail === 'sleep') t.sleep = rand(2, 4);
  up(ctx); await ctx.say(`${ctx.nome(t)} ${AIL_MSG[ail]}!`, 'status');
  return true;
}

// Golpes de status com regra própria (especiais.js). true = tratou (o genérico não roda).
async function statusEspecial(u, t, g, esp, ctx) {
  const U = ctx.nome(u), T = ctx.nome(t);
  if (esp.clima) { if (!await mudarClima(esp.clima, ctx)) await ctx.say('Mas falhou!'); return true; }
  if (esp.terreno) { if (!await mudarTerreno(esp.terreno, ctx)) await ctx.say('Mas falhou!'); return true; }
  // telas e proteções: valem no lado de quem usou
  if (esp.lado) {
    const meu = ladoDoCampo(ctx, u);
    if (!meu) { await ctx.say('Mas falhou!'); return true; }
    if (esp.soNoGelo && !['granizo', 'neve'].includes(climaDoCtx(ctx))) { await ctx.say('Mas falhou! (só funciona no granizo ou na neve)'); return true; }
    if (meu[esp.lado] > 0) { await ctx.say('Mas falhou! (já está no ar)'); return true; }
    meu[esp.lado] = esp.lado === 'vento' ? VENTO_TURNOS : TELA_TURNOS;
    await ctx.say(`${NOME_LADO[esp.lado]} protege o lado de ${U} por ${meu[esp.lado]} turnos!`, 'good');
    return true;
  }
  // armadilhas: ficam esperando no lado do inimigo
  if (esp.armadilha) {
    const deles = ladoDoCampo(ctx, t);
    if (!deles) { await ctx.say('Mas falhou!'); return true; }
    if (esp.armadilha === 'pedras') {
      if (deles.pedras) { await ctx.say('Mas falhou! (as pedras já estão lá)'); return true; }
      deles.pedras = true;
    } else {
      const max = esp.armadilha === 'espinhos' ? MAX_ESPINHOS : MAX_TOXINAS;
      if (deles[esp.armadilha] >= max) { await ctx.say('Mas falhou! (não cabe mais)'); return true; }
      deles[esp.armadilha]++;
    }
    await ctx.say(`${esp.armadilha === 'pedras' ? 'Pedras afiadas flutuam' : esp.armadilha === 'espinhos' ? 'Espinhos se espalham' : 'Espinhos venenosos se espalham'} em volta de ${T}!`, 'status');
    if (!ctx.trocaDePokemon) await ctx.say('(só machuca quem entrar em campo depois — do seu lado ninguém troca)', 'muted');
    return true;
  }
  if (esp.protege) {
    // King's Shield devolve o Aegislash pra Forma Escudo — e isso acontece mesmo se a proteção falhar
    if (esp.voltaPostura) await trocarPostura(u, false, ctx);
    // repetir seguido: 1/3, 1/9… de chance
    const n = u.vol.protSeguidas || 0;
    if (Math.random() < 1 / 3 ** n) {
      u.vol.protegido = true; u.vol.protSeguidas = n + 1;
      // a barreira lembra o que faz com quem encostar nela (King's Shield, Spiky Shield, Obstruct…)
      if (esp.puneContato) u.vol.punicao = esp.puneContato; else delete u.vol.punicao;
      await ctx.say(`${U} se protegeu!`, 'good');
    } else { u.vol.protSeguidas = 0; delete u.vol.punicao; await ctx.say('Mas falhou!'); }
    return true;
  }
  if (esp.aguentaTurno) {
    const n = u.vol.protSeguidas || 0;
    if (Math.random() < 1 / 3 ** n) { u.vol.aguenta = true; u.vol.protSeguidas = n + 1; await ctx.say(`${U} se preparou para aguentar!`, 'good'); }
    else { u.vol.protSeguidas = 0; await ctx.say('Mas falhou!'); }
    return true;
  }
  if (esp.foco) {
    if (u.vol.foco) { await ctx.say('Mas falhou!'); return true; }
    u.vol.foco = esp.foco; await ctx.say(`${U} está concentrado! (chance de crítico maior)`, 'good'); return true;
  }
  if (esp.descanso) {
    if (u.hp >= u.stats.hp) { await ctx.say(`O HP de ${U} já está cheio!`); return true; }
    if (imuneAoStatusMon(u, 'sleep')) { await ctx.say('Mas falhou!'); return true; }
    u.hp = u.stats.hp; u.status = 'sleep'; u.sleep = 3; delete u.vol.toxico; up(ctx);
    await ctx.say(`${U} dormiu e recuperou todo o HP!`, 'good'); return true;
  }
  if (esp.toxico) {
    const antes = t.status;
    if (await aplicarStatus(t, 'poison', ctx, true) && !antes) { t.vol.toxico = 1; await ctx.say(`O veneno em ${T} é grave!`, 'status'); }
    return true;
  }
  if (esp.semente) {
    if (t.data.types.includes('grass')) { await ctx.say(`Não afeta ${T}...`); return true; }
    if (t.vol.semente != null) { await ctx.say(`${T} já está semeado!`); return true; }
    t.vol.semente = ctx.refDe ? ctx.refDe(u) : true; await ctx.say(`${T} foi semeado!`, 'status'); return true;
  }
  return false;
}

async function golpeDeStatus(u, t, g, selfT, ctx) {
  if (await statusEspecial(u, t, g, especial(g), ctx)) return;
  const meta = g.meta || {}; let fez = false;
  if (meta.heal > 0) {
    fez = true;
    if (u.hp >= u.stats.hp) await ctx.say(`O HP de ${ctx.nome(u)} já está cheio!`);
    else { heal(u, Math.floor(u.stats.hp * meta.heal / 100)); up(ctx); await ctx.say(`${ctx.nome(u)} recuperou HP.`, 'good'); }
  }
  if (g.stats.length) { fez = true; const alvo = selfT || mudaOUsuario(meta) ? u : t; await mudarEstagios(alvo, g.stats, ctx, u); }
  if (meta.ailment && meta.ailment !== 'none') {
    fez = true;
    if (Math.random() * 100 < (meta.ailChance || 100)) await aplicarStatus(selfT ? u : t, meta.ailment, ctx, true, u);
  }
  if (!fez) await ctx.say('Mas nada aconteceu... (este efeito será ajustado em atualizações futuras)', 'muted');
}

// `primeiro` = u agiu antes de t neste turno (recuo só vale assim)
export async function usarGolpe(u, t, g, primeiro, ctx) {
  await ajustarForma(u, ctx); if (t !== u) await ajustarForma(t, ctx);   // Castform: a forma do tempo de agora, antes de qualquer conta
  const U = ctx.nome(u), hu = hab(u);
  if (u.vol.recarga) { delete u.vol.recarga; await ctx.say(`${U} precisa recarregar!`); return; }  // Hyper Beam & cia.
  if (hu.preguica && u.vol.folga) { u.vol.folga = false; interromper(u); await ctx.say(`${U} está com preguiça...`); return; } // Truant: folga no turno seguinte a um golpe
  const travado = golpeTravado(u);                                                    // carga / fúria: repete sozinho
  if (travado) g = travado;
  if (u.status === 'sleep') {
    u.sleep -= hu.sonoRapido ? 2 : 1;                                                  // Early Bird
    if (u.sleep > 0) { interromper(u); await ctx.say(`${U} está dormindo profundamente.`); return; }
    u.status = null; u.sleep = 0; up(ctx); await ctx.say(`${U} acordou!`);
  }
  if (u.status === 'freeze') {
    if (Math.random() < 0.2) { u.status = null; up(ctx); await ctx.say(`${U} descongelou!`); }
    else { interromper(u); await ctx.say(`${U} está congelado!`); return; }
  }
  if (u.status === 'paralysis' && Math.random() < 0.25) { interromper(u); await ctx.say(`${U} está paralisado e não consegue se mover!`); return; }
  if (u.vol.flinch) { u.vol.flinch = false; interromper(u); await ctx.say(`${U} recuou e não conseguiu atacar!`); return; }
  if (u.vol.conf > 0) {
    u.vol.conf--;
    if (u.vol.conf === 0) await ctx.say(`${U} não está mais confuso.`);
    else {
      await ctx.say(`${U} está confuso...`);
      if (Math.random() < 1 / 3) { interromper(u); const d = confDamage(u); u.hp = Math.max(0, u.hp - d); up(ctx); (ctx.tremer || nada)(u); await ctx.say(`Ele se machucou na confusão! (−${d})`, 'hit'); return; }
    }
  }
  if (g.cls === 'status' && seg(u).semStatus) { await ctx.say(`${U} não consegue usar golpe de status segurando o Colete de Assalto!`); return; }
  // Campo Psíquico: golpe de prioridade não passa em quem está no chão
  const terr = terrenoDoCtx(ctx);
  if (TERRENOS[terr]?.semPrioridade && (g.priority || 0) > 0 && u !== t && noChao(t)) {
    await ctx.say(`${TERRENOS[terr].nome} protege ${ctx.nome(t)} de golpes rápidos!`);
    return;
  }
  // Dazzling, Queenly Majesty, Armor Tail: golpe de prioridade não passa (mesma regra do Campo Psíquico)
  if ((g.priority || 0) > 0 && u !== t && !SELF_TARGETS.has(g.target) && hab(t).bloqueiaPrioridade) {
    await ctx.say(`${fmt(t.ability)} de ${ctx.nome(t)} bloqueia golpes rápidos!`);
    return;
  }
  const esp = especial(g);
  if (!esp.protege && !esp.aguentaTurno) u.vol.protSeguidas = 0;
  // no sol forte, Solar Beam e Solar Blade saem na hora (não precisam carregar)
  const cargaPulada = esp.carga && !esp.invulneravel && /^solar-/.test(g.name) && climaDoCtx(ctx) === 'sol';
  // golpe de carga, 1º turno: gasta PP, prepara (e some, se for Fly/Dig…) e ataca só no próximo
  if (esp.carga && !cargaPulada && !u.vol.carregando) {
    if (g.ppLeft !== undefined) g.ppLeft = Math.max(0, g.ppLeft - 1 - pressao(u, t, g));
    u.vol.carregando = g; if (esp.invulneravel) u.vol.invul = true;
    await ctx.say(`${U} está se preparando para usar ${ctx.golpe(g)}!`); return;
  }
  if (esp.carga) { delete u.vol.carregando; delete u.vol.invul; }                    // 2º turno: não gasta PP de novo
  else if (!travado && g.ppLeft !== undefined) g.ppLeft = Math.max(0, g.ppLeft - 1 - pressao(u, t, g));  // fúria: só o 1º turno gasta
  if (esp.furia && !u.vol.furia) u.vol.furia = { golpe: g, turnos: rand(2, 3) };
  await ctx.say(`${U} usou ${ctx.golpe(g)}!`);
  if (hu.preguica) u.vol.folga = true;                                                // Truant: o próximo turno é de folga
  // Fake Out e First Impression só valem no primeiro golpe da batalha (vol.golpesDados conta os anteriores)
  const primeiroGolpe = !u.vol.golpesDados;
  u.vol.golpesDados = (u.vol.golpesDados || 0) + 1;
  if (esp.soPrimeiroTurno && !primeiroGolpe) { await ctx.say('Mas falhou! (só funciona no primeiro golpe da batalha)'); return; }

  const res = await executar(u, t, g, primeiro, ctx, esp);
  if (esp.autoDesmaio && u.hp > 0) { u.hp = 0; up(ctx); (ctx.tremer || nada)(u); await ctx.say(`${U} desmaiou com o esforço!`, 'hit'); }
  if (esp.recarga && res === 'acertou' && u.hp > 0) u.vol.recarga = true;
  if (u.vol.furia && --u.vol.furia.turnos <= 0) {
    delete u.vol.furia;
    if (u.hp > 0) { await ctx.say(`${U} se cansou da fúria...`); await aplicarStatus(u, 'confusion', ctx); }
  }
}

// O golpe em si, depois de "X usou Y!". Devolve 'acertou' quando o golpe de dano conectou (Hyper Beam só recarrega assim).
async function executar(u, t, g, primeiro, ctx, esp) {
  g = golpeDoClima(g, climaDoCtx(ctx));   // Weather Ball: tipo e poder do tempo (o PP já foi gasto no golpe original)
  const U = ctx.nome(u), T = ctx.nome(t), hu = hab(u), ht = hab(t);
  const selfT = SELF_TARGETS.has(g.target), meta = g.meta || {};
  if (!selfT && t.vol.protegido) {
    await ctx.say(`${T} se protegeu do golpe!`);
    // barreira que pune contato: só golpe físico encosta (mesma regra de Static/Elmo Rochoso)
    const pun = t.vol.punicao;
    if (pun && g.cls === 'physical' && u.hp > 0) {
      if (pun.estagio) await mudarEstagios(u, [{ stat: pun.estagio[0], change: pun.estagio[1] }], ctx, t);
      if (pun.dano && !indireto(u)) { const d = Math.max(1, Math.floor(u.stats.hp * pun.dano)); u.hp = Math.max(0, u.hp - d); up(ctx); await ctx.say(`${U} se machucou na barreira! (−${d})`, 'hit'); }
      if (pun.status && !u.status) await aplicarStatus(u, pun.status, ctx, true, t);
    }
    return;
  }
  if (!selfT && t.vol.invul) { await ctx.say('Mas errou!'); return; }                 // alvo no ar / debaixo da terra
  if (esp.soDormindo && t.status !== 'sleep') { await ctx.say(`Não afeta ${T}... (só funciona em quem está dormindo)`); return; }
  if (esp.ohko) {
    if (typeEff(g.type, t.data.types) === 0) { await ctx.say(`Não afeta ${T}...`); return; }
    if (ht.aguenta) { await ctx.say(`${T} aguentou firme graças a ${fmt(t.ability)}!`); return; }     // Sturdy
    if (Math.random() >= chanceOhko(u, t)) { await ctx.say(t.level > u.level ? 'Mas falhou! (o alvo tem nível maior)' : 'Mas errou!'); return; }
    t.hp = 0; up(ctx); (ctx.tremer || nada)(t); await ctx.say('É um nocaute de um golpe só!', 'crit'); return 'acertou';
  }
  if (!selfT && g.acc != null && Math.random() > chanceAcerto(g, u, t, climaDoCtx(ctx))) { await ctx.say('Mas errou!'); return; }
  if (g.cls === 'status') { await golpeDeStatus(u, t, g, selfT, ctx); up(ctx); return; }

  // imunidades e absorções de tipo por habilidade
  if (ht.imuneTipo === g.type) { await ctx.say(`${T} não é afetado graças a ${fmt(t.ability)}!`); return; }
  if (ht.absorve === g.type) {
    await ctx.say(`A habilidade ${fmt(t.ability)} de ${T} absorveu o golpe!`);
    if (ht.cura && t.hp < t.stats.hp) { heal(t, Math.floor(t.stats.hp * ht.cura)); up(ctx); await ctx.say(`${T} recuperou HP.`, 'good'); }
    if (ht.estagio) await mudarEstagios(t, [{ stat: ht.estagio[0], change: ht.estagio[1] }], ctx);
    if (ht.flashFire) t.vol.flashFire = true;
    return;
  }
  const ef = typeEff(g.type, t.data.types);
  if (ef === 0) { await ctx.say(`Não afeta ${T}...`); return; }
  if (ht.soSuperEfetivo && ef <= 1) { await ctx.say(`${T} não é afetado graças a ${fmt(t.ability)}!`); return; } // Wonder Guard

  if (esp.danoIgualHp) {                                                               // Endeavor
    if (t.hp <= u.hp) { await ctx.say('Mas falhou!'); return; }
    const d = t.hp - u.hp; t.hp = u.hp; up(ctx); (ctx.tremer || nada)(t); await ctx.say(`${T} perdeu ${d} HP.`, 'hit'); return 'acertou';
  }

  // Aegislash: atacar vira a Forma Lâmina ANTES de calcular o dano (é com o Ataque da Lâmina que o golpe sai)
  if (hu.postura) await trocarPostura(u, true, ctx);
  const hits = meta.minHits ? (hu.maxAcertos ? meta.maxHits || meta.minHits : rand(meta.minHits, meta.maxHits || meta.minHits)) : 1;
  const cheio = t.hp >= t.stats.hp;
  let total = 0, acertos = 0, crit = false, aguentou = false, resistiu = false, faixa = null;
  for (let i = 0; i < hits && t.hp > 0; i++) {
    const r = calcDamage(u, t, g, climaDoCtx(ctx), terrenoDoCtx(ctx), ladoDoCampo(ctx, t));
    let dano = r.dmg;
    if (ht.aguenta && cheio && i === 0 && dano >= t.hp) { dano = t.hp - 1; aguentou = true; }  // Sturdy
    else if (t.vol.aguenta && dano >= t.hp) { dano = t.hp - 1; resistiu = true; }            // Endure
    else if (seg(t).aguentaCheio && cheio && i === 0 && dano >= t.hp) { dano = t.hp - 1; faixa = t.item; t.item = null; } // Faixa de Foco
    t.hp = Math.max(0, t.hp - dano); total += dano; acertos++; crit ||= r.crit;
    if (r.crit) u.vol.criticos = (u.vol.criticos || 0) + 1;                                  // Sirfetch'd (evolucao.js)
  }
  t.vol.danoSofrido = (t.vol.danoSofrido || 0) + total;                                      // Runerigus (evolucao.js)
  up(ctx); (ctx.tremer || nada)(t);
  if (crit) await ctx.say('Um golpe crítico!', 'crit');
  if (ef > 1) await ctx.say('É super efetivo!', 'good'); else if (ef < 1) await ctx.say('Não é muito efetivo...');
  if (hits > 1) await ctx.say(`Acertou ${acertos} vez${acertos > 1 ? 'es' : ''}!`);
  await ctx.say(`${T} perdeu ${total} HP.`, 'hit');
  if (aguentou) await ctx.say(`${T} aguentou firme graças a ${fmt(t.ability)}!`, 'status');
  if (resistiu) await ctx.say(`${T} aguentou o golpe!`, 'status');
  if (faixa) await ctx.say(`${T} aguentou com 1 de HP usando a Faixa de Foco! (item gasto)`, 'status');
  // itens segurados de quem ataca: Sino-Concha drena, Orbe da Vida cobra HP; Elmo Rochoso machuca quem encostou
  const si = seg(u);
  if (si.drenaDano && total > 0 && u.hp > 0 && u.hp < u.stats.hp) { const h = Math.max(1, Math.floor(total * si.drenaDano)); heal(u, h); up(ctx); await ctx.say(`${U} recuperou ${h} HP com o Sino-Concha.`, 'good'); }
  if (si.recuoPorGolpe && total > 0 && u.hp > 0 && !indireto(u)) { const d = Math.max(1, Math.floor(u.stats.hp * si.recuoPorGolpe)); u.hp = Math.max(0, u.hp - d); up(ctx); await ctx.say(`O Orbe da Vida cobra o preço: ${U} perdeu ${d} HP.`, 'hit'); }
  if (g.cls === 'physical' && seg(t).espetos && u.hp > 0 && !indireto(u)) { const d = Math.max(1, Math.floor(u.stats.hp * seg(t).espetos)); u.hp = Math.max(0, u.hp - d); up(ctx); await ctx.say(`${U} se espetou no Elmo Rochoso de ${T}! (−${d})`, 'hit'); }
  await comerFruta(t, ctx); await comerFruta(u, ctx);                                        // Frutas Oran/Sitrus na hora do aperto
  // Moxie, Chilling Neigh, Grim Neigh: derrubar o alvo sobe um atributo de quem derrubou
  if (t.hp <= 0 && total > 0 && u.hp > 0 && hu.aoNocautear) {
    await ctx.say(`${U} ganhou moral com ${fmt(u.ability)}!`, 'good');
    await mudarEstagios(u, [{ stat: hu.aoNocautear[0], change: hu.aoNocautear[1] }], ctx, u);
  }

  if (meta.drain > 0) { const h = Math.max(1, Math.floor(total * meta.drain / 100)); heal(u, h); up(ctx); await ctx.say(`${U} drenou ${h} HP.`, 'good'); }
  else if (meta.drain < 0 && !hu.semDanoRecuo && !indireto(u)) { // Rock Head e Magic Guard evitam; o total de recuo conta pra Basculegion (evolucao.js)
    const d = Math.max(1, Math.floor(total * -meta.drain / 100)); u.hp = Math.max(0, u.hp - d); u.recuoTotal = (u.recuoTotal || 0) + d; up(ctx); await ctx.say(`${U} sofreu ${d} de dano de recuo.`, 'hit');
  }
  if (meta.heal > 0 && u.hp > 0) { heal(u, Math.floor(u.stats.hp * meta.heal / 100)); up(ctx); }

  // efeitos secundários: Serene Grace dobra a chance; Shield Dust protege o alvo
  const chance = p => Math.random() * 100 < p * (hu.chanceSecundaria || 1);
  if (g.stats.length && chance(meta.statChance || 100)) {
    if (mudaOUsuario(meta) && u.hp > 0) await mudarEstagios(u, g.stats, ctx, u);
    else if (!mudaOUsuario(meta) && t.hp > 0 && !ht.semSecundario) await mudarEstagios(t, g.stats, ctx, u);
  }
  if (t.hp > 0 && !ht.semSecundario) {
    if (meta.ailment && meta.ailment !== 'none' && meta.ailChance > 0 && chance(meta.ailChance)) await aplicarStatus(t, meta.ailment, ctx, false, u);
    if (meta.flinch > 0 && primeiro && !ht.semRecuo && chance(meta.flinch)) t.vol.flinch = true;
  }
  // reação a ter sido atingido (Steam Engine, Stamina, Weak Armor, Anger Point, Sand Spit…)
  if (total > 0 && t.hp > 0 && ht.aoSerAtingido) await reagirAoGolpe(t, g, crit, ctx);
  // contato (golpe físico): Static, Flame Body, Poison Point, Effect Spore, Gooey; Rough Skin, Iron Barbs
  if (g.cls === 'physical' && u.hp > 0) {
    const c = ht.contato;
    if (c && Math.random() * 100 < c.chance) {
      if (c.estagio) {                                                                // Gooey, Tangling Hair: a Velocidade de quem encosta cai
        await ctx.say(`${U} tocou em ${T}...`, 'muted');
        await mudarEstagios(u, [{ stat: c.estagio[0], change: c.estagio[1] }], ctx, t);
      } else if (!u.status && !(c.po && (u.data.types.includes('grass') || hab(u).imunePo))) {   // pó não pega Grama nem Overcoat
        const ail = c.sorteio ? sortearPeso(c.sorteio) : c.status;                    // Effect Spore: sono, paralisia ou veneno
        await ctx.say(`${U} tocou em ${T}...`, 'muted'); await aplicarStatus(u, ail, ctx);
      }
    }
    if (ht.contatoDano && !indireto(u)) { const d = Math.max(1, Math.floor(u.stats.hp * ht.contatoDano)); u.hp = Math.max(0, u.hp - d); up(ctx); await ctx.say(`${U} se machucou na ${fmt(t.ability)} de ${T}! (−${d})`, 'hit'); }
  }
  // Poison Touch: o golpe físico de quem tem a habilidade pode envenenar o alvo (Shield Dust protege)
  if (g.cls === 'physical' && hu.toque && t.hp > 0 && !t.status && !ht.semSecundario && Math.random() * 100 < hu.toque.chance) await aplicarStatus(t, hu.toque.status, ctx, false, u);
  return 'acertou';
}

// Fim do turno de um Pokémon em pé: queimadura/veneno (grave cresce a cada turno), Leech Seed, e habilidades de fim
// de turno (Speed Boost, Shed Skin)
export async function fimDeTurno(m, ctx) {
  if (m.hp <= 0) return;
  const h = hab(m), clima = climaDoCtx(ctx);
  if (clima) {
    // areia/granizo castigam quem não é do tipo certo; chuva/sol curam ou machucam quem tem a habilidade certa
    const dano = danoClima(clima, m);
    if (dano) { m.hp = Math.max(0, m.hp - dano); up(ctx); await ctx.say(`${ctx.nome(m)} se machuca com ${CLIMAS[clima].nome.toLowerCase()}. (−${dano})`, 'hit'); }
    const cura = h.curaClima?.[clima];
    if (m.hp > 0 && cura && m.hp < m.stats.hp) { const n = Math.max(1, Math.floor(m.stats.hp * cura)); heal(m, n); up(ctx); await ctx.say(`${ctx.nome(m)} se recupera com o tempo. (+${n}, ${fmt(m.ability)})`, 'good'); }
    const castigo = h.danoClimaProprio?.[clima];
    if (m.hp > 0 && castigo) { const n = Math.max(1, Math.floor(m.stats.hp * castigo)); m.hp = Math.max(0, m.hp - n); up(ctx); await ctx.say(`${ctx.nome(m)} sofre com ${CLIMAS[clima].nome.toLowerCase()}. (−${n}, ${fmt(m.ability)})`, 'hit'); }
    if (m.hp > 0 && h.curaStatusClima === clima && m.status) { m.status = null; m.sleep = 0; delete m.vol.toxico; up(ctx); await ctx.say(`${ctx.nome(m)} se curou com a chuva! (${fmt(m.ability)})`, 'good'); }
    if (m.hp <= 0) return;
  }
  if (h.curaStatusFimTurno && m.status && Math.random() < h.curaStatusFimTurno) {
    m.status = null; m.sleep = 0; delete m.vol.toxico; up(ctx); await ctx.say(`${ctx.nome(m)} trocou de pele e se curou! (${fmt(m.ability)})`, 'good');
  }
  /* Poison Heal: o veneno CURA 1/8 em vez de machucar. Magic Guard: nem veneno nem queimadura tiram HP. */
  const d = h.curaComVeneno && m.status === 'poison' ? 0 : indireto(m) ? 0 : danoResidual(m);
  if (h.curaComVeneno && m.status === 'poison' && m.hp < m.stats.hp) {
    const n = Math.max(1, Math.floor(m.stats.hp * h.curaComVeneno)); heal(m, n); up(ctx);
    await ctx.say(`${ctx.nome(m)} se recupera com o veneno! (+${n}, ${fmt(m.ability)})`, 'good');
  }
  if (d) { m.hp = Math.max(0, m.hp - d); up(ctx); await ctx.say(`${ctx.nome(m)} sofreu com ${m.status === 'burn' ? 'a queimadura' : 'o veneno'}. (−${d})`, 'hit'); }
  if (m.status === 'poison' && m.vol.toxico) m.vol.toxico = Math.min(15, m.vol.toxico + 1);
  if (m.hp > 0 && m.vol.semente != null && !indireto(m)) {
    const s = Math.min(m.hp, Math.max(1, Math.floor(m.stats.hp / 8)));
    m.hp -= s; up(ctx); await ctx.say(`A semente drenou ${ctx.nome(m)}. (−${s})`, 'hit');
    const quem = ctx.monPorRef?.(m.vol.semente);
    if (quem && quem.hp > 0 && quem.hp < quem.stats.hp) { heal(quem, s); up(ctx); await ctx.say(`${ctx.nome(quem)} recuperou ${s} HP.`, 'good'); }
  }
  // Campo de Grama: cura quem está no chão
  const terr = terrenoDoCtx(ctx), tCura = TERRENOS[terr]?.cura;
  if (tCura && m.hp > 0 && noChao(m) && m.hp < m.stats.hp) {
    const n = Math.max(1, Math.floor(m.stats.hp * tCura)); heal(m, n); up(ctx);
    await ctx.say(`${ctx.nome(m)} se recupera na grama alta. (+${n})`, 'good');
  }
  // item segurado: Restos curam, Lodo Negro cura Venenoso e machuca o resto (segurados.js)
  const di = fimDeTurnoDoItem(m);
  if (di > 0 && m.hp > 0) { heal(m, di); up(ctx); await ctx.say(`${ctx.nome(m)} recuperou ${di} HP com ${nomeDoItem(m)}.`, 'good'); }
  else if (di < 0 && m.hp > 0 && !indireto(m)) { m.hp = Math.max(0, m.hp + di); up(ctx); await ctx.say(`${nomeDoItem(m)} machucou ${ctx.nome(m)}. (${di})`, 'hit'); }
  if (m.hp > 0 && h.fimTurno) await mudarEstagios(m, [{ stat: h.fimTurno, change: 1 }], ctx);
  await comerFruta(m, ctx);
  await ajustarForma(m, ctx);
}
// Frutas que o Pokémon come sozinho (Oran, Sitrus, Lum): checadas no fim do turno e logo depois de levar dano.
export async function comerFruta(m, ctx) {
  const f = frutaAgora(m); if (!f) return;
  const nome = nomeDoItem(m);
  m.item = null;
  if (f.curaStatus) { m.status = null; m.sleep = 0; delete m.vol.toxico; up(ctx); await ctx.say(`${ctx.nome(m)} comeu a ${nome} e se curou!`, 'good'); return; }
  heal(m, f.cura); up(ctx);
  await ctx.say(`${ctx.nome(m)} comeu a ${nome} e recuperou ${f.cura} HP.`, 'good');
}
