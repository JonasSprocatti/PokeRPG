/* ============ Pokédex da conta (dados puros) ============
   Tudo o que a conta já conhece de cada espécie, somando a carreira inteira mais a jornada em andamento.
   O jogo já registrava isso por jornada (estado.registrar → S.registro): `vistos` (apareceu na sua frente),
   `derrotados`, `amigos` (recrutou) e `ids` (id da espécie, pro sprite). Aqui só se junta tudo por espécie.
   Puro: sem DOM e sem rede — testado em tests/pokedex-conta.test.js. Quem desenha é tela-pokedex.js. */
import { GENS } from './dados-mapas.js';

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
    for (const lista of ['vistos', 'derrotados', 'amigos']) {
      for (const [especie, n] of Object.entries(r[lista] || {})) {
        const e = porNome[especie] ||= { especie, id: null, vistos: 0, derrotados: 0, amigos: 0 };
        e[lista] += n;
      }
    }
    for (const [especie, id] of Object.entries(r.ids || {})) {
      const e = porNome[especie] ||= { especie, id: null, vistos: 0, derrotados: 0, amigos: 0 };
      if (!e.id) e.id = id;
    }
  }
  const porId = new Map();
  for (const e of Object.values(porNome)) {
    e.estado = e.amigos ? ESTADOS.amigo : e.derrotados ? ESTADOS.derrotado : e.vistos ? ESTADOS.visto : ESTADOS.nunca;
    if (e.id) porId.set(e.id, e);
  }
  return { porId, porNome, conhecidas: Object.keys(porNome).length };
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
