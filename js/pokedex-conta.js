/* ============ Pokédex da conta (dados puros) ============
   Tudo o que a conta já conhece de cada espécie, somando a carreira inteira mais a jornada em andamento.
   O jogo já registrava isso por jornada (estado.registrar → S.registro): `vistos` (apareceu na sua frente),
   `derrotados`, `amigos` (recrutou) e `ids` (id da espécie, pro sprite). Aqui só se junta tudo por espécie.
   Puro: sem DOM e sem rede — testado em tests/pokedex-conta.test.js. Quem desenha é tela-pokedex.js. */
import { GENS } from './dados-mapas.js';

// lendários de todos os mapas, pelo nome: é o que a badge `Amizade impossível` mede (recrutar um lendário)
const LENDARIOS = new Set(GENS.flatMap(g => g.rotas.flatMap(z => (z.lendarios || []).map(l => l.nome.toLowerCase().replace(/ /g, '-')))));

export const TOTAL_DEX = 1025;
// estado de uma espécie na sua conta: quanto mais você conviveu com ela, mais você sabe
export const ESTADOS = { nunca: 'nunca', visto: 'visto', derrotado: 'derrotado', amigo: 'amigo' };

/* Junta os registros e devolve um mapa `id → { especie, id, vistos, derrotados, amigos, estado }`.
   A chave é o ID, não o nome, porque é por id que a tela mostra sprite e ordena (ordem da Pokédex nacional).
   Espécie registrada numa jornada antiga sem `ids` (saves bem antigos) fica de fora do mapa por id — mas continua
   contada no total por nome, senão o número de "conhecidos" cairia sem motivo. */
export function pokedexDaConta(jornadas, registroAtual) {
  const porNome = {};
  const registros = [...(jornadas || []).map(j => j?.registro), registroAtual];
  for (const r of registros) {
    if (!r) continue;
    for (const lista of ['vistos', 'derrotados', 'amigos', 'shiniesAmigos']) {
      for (const [especie, n] of Object.entries(r[lista] || {})) {
        const e = porNome[especie] ||= { especie, id: null, vistos: 0, derrotados: 0, amigos: 0, shiniesAmigos: 0 };
        e[lista] += n;
      }
    }
    for (const [especie, id] of Object.entries(r.ids || {})) {
      const e = porNome[especie] ||= { especie, id: null, vistos: 0, derrotados: 0, amigos: 0, shiniesAmigos: 0 };
      if (!e.id) e.id = id;
    }
  }
  const porId = new Map();
  for (const e of Object.values(porNome)) {
    e.estado = e.amigos ? ESTADOS.amigo : e.derrotados ? ESTADOS.derrotado : e.vistos ? ESTADOS.visto : ESTADOS.nunca;
    if (e.id) porId.set(e.id, e);
  }
  /* Números que as badges precisam (badges.js). gensCompletas = Gens em que você já encontrou TODA a faixa de
     ids dela — é a badge da Pokédex regional. Fica aqui porque é a Pokédex que sabe disso. */
  const FAIXAS = [[1, 151], [152, 251], [252, 386], [387, 493], [494, 649], [650, 721], [722, 809], [810, 905], [906, 1025]];
  let gensCompletas = 0;
  for (const [de, ate] of FAIXAS) {
    let tem = true;
    for (let id = de; id <= ate && tem; id++) if (!porId.has(id)) tem = false;
    if (tem) gensCompletas++;
  }
  const soma = campo => Object.values(porNome).reduce((a, e) => a + (e[campo] || 0), 0);
  return {
    porId, porNome, conhecidas: Object.keys(porNome).length, gensCompletas,
    shiniesAmigos: soma('shiniesAmigos'),
    lendariosAmigos: Object.values(porNome).filter(e => e.amigos && LENDARIOS.has(e.especie)).length,
    rayquazaShiny: porNome.rayquaza?.shiniesAmigos || 0
  };
}

/* Onde esta espécie aparece no mundo: [{ gen, regiao, rota, min, max, taxa, santuario }]. Sai dos mapas gerados,
   então funciona offline e não depende da PokéAPI. `taxa` é a chance dentro daquela rota (o mesmo cálculo da
   Pokédex da rota). Serve pra Pokédex responder "e onde eu acho esse?". */
export function ondeAparece(id) {
  const saida = [];
  for (const g of GENS) for (const z of g.rotas) {
    const e = z.pool.find(p => p.id === id);
    if (!e) continue;
    const total = z.pool.reduce((a, p) => a + p.p, 0);
    saida.push({ gen: g.gen, regiao: g.regiao, rota: z.name, min: z.min, max: z.max, santuario: !!z.posVitoria, taxa: total ? e.p / total * 100 : 0 });
  }
  // o Alfa e os lendários não estão no pool: entram como aparição especial
  for (const g of GENS) for (const z of g.rotas) {
    if (z.chefe?.id === id) saida.push({ gen: g.gen, regiao: g.regiao, rota: z.name, min: z.chefe.nivel, max: z.chefe.nivel, alfa: true, taxa: 0 });
    for (const l of z.lendarios || []) if (l.id === id) saida.push({ gen: g.gen, regiao: g.regiao, rota: z.name, min: l.nivel, max: l.nivel, lendario: true, taxa: 0 });
  }
  return saida;
}
