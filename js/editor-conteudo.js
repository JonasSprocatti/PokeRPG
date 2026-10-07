/* ============ 🧰 editor de conteúdo: o rascunho (puro) ============
   A fase 3 da atualização por nuvem (docs/plano-config-remota.md): **missões de conta** (as globais), **preço dos
   itens** (que é o que decide a loja) e **texto e prêmio das badges**. A tela é js/tela-editor-conteudo.js.

   O QUE NÃO ENTRA, e não é esquecimento: o EFEITO de um item é código (`potion` cura 20 porque `ITEMS.potion.heal`
   é lido por `itens.usarItem`), então item novo continua sendo commit. `price: 0` é o botão de desligar um item:
   `render.js` só põe na loja o que tem preço.

   **Badge NOVA entra** (07/10/2026): a medida dela é DADO — um campo de `badges.MEDIDAS` com um alvo, resolvido por
   `badges.medirPorDado`. O que continua sendo commit é MEDIDA nova: regra que o `contextoBadges` ainda não conta.

   Mesmo desenho dos outros dois editores: rascunho no `localStorage` deste navegador, 📤 Publicar pelo canal (quem
   publica é `tela-editor-rotas.publicar`, porque o pacote é UM) e 📋 Copiar pra levar ao repositório. */
import { store } from './util.js';
import { MISSOES_GLOBAIS, ITEMS } from './dados.js';
import { BADGES } from './badges.js';
import { BADGES_DE_FABRICA } from './conteudo.js';

export const CHAVE_CONTEUDO = 'pokerpg-editor-conteudo-v1';
// { missoesGlobais?: [missao…], itens?: { id: {price,name,desc} }, badges?: { id: {nome,desc,recompensa} } }
export const rascunhoConteudo = () => store.get(CHAVE_CONTEUDO) || {};
const salvar = r => store.set(CHAVE_CONTEUDO, r);
export const limparRascunhoConteudo = () => salvar({});
export const quantosConteudo = () => {
  const r = rascunhoConteudo();
  return (r.missoesGlobais ? 1 : 0) + Object.keys(r.itens || {}).length + Object.keys(r.badges || {}).length;
};

/* ---- missões de conta (globais) ---- */
/* A lista INTEIRA, com o rascunho por cima — mesma escolha dos mapas e da música: criar e excluir são "a lista é
   outra", e mandar só as editadas faria o `aplicarConteudo` voltar as outras pro de fábrica. */
export const missoesGlobaisEditadas = () => rascunhoConteudo().missoesGlobais || MISSOES_GLOBAIS.map(m => JSON.parse(JSON.stringify(m)));
export const missaoGlobal = id => missoesGlobaisEditadas().find(m => m.id === id) || null;
export function gravarMissaoGlobal(id, missao) {
  const lista = missoesGlobaisEditadas();
  const i = lista.findIndex(m => m.id === id);
  salvar({ ...rascunhoConteudo(), missoesGlobais: i < 0 ? [...lista, missao] : lista.map((m, k) => (k === i ? missao : m)) });
}
export function excluirMissaoGlobal(id) {
  const lista = missoesGlobaisEditadas();
  if (lista.length <= 1) return { ok: false, porque: 'tem de sobrar ao menos uma missão de conta' };
  // missão que outra usa como `libera` não sai: a outra ficaria escondida pra sempre, sem erro nenhum
  const presa = lista.find(m => m.libera?.missao === id);
  if (presa) return { ok: false, porque: `a missão "${presa.id}" só abre depois desta` };
  salvar({ ...rascunhoConteudo(), missoesGlobais: lista.filter(m => m.id !== id) });
  return { ok: true };
}
// tira a lista do rascunho sem mexer nos remendos de item e badge (eles vivem nas outras chaves)
export function desfazerMissoesGlobais() {
  const r = rascunhoConteudo();
  delete r.missoesGlobais;
  salvar(r);
}
// id novo no formato dos que já existem (letra, número e hífen), sem repetir. Serve pra missão e pra badge.
export function idNovo(base, jaExistem) {
  const limpo = String(base || 'missao').toLowerCase().normalize('NFD').replace(/[^a-z0-9-]/g, '').slice(0, 40) || 'missao';
  if (!jaExistem.has(limpo)) return limpo;
  let n = 2;
  while (jaExistem.has(`${limpo}-${n}`)) n++;
  return `${limpo}-${n}`;
}

/* ---- itens e badges: remendo por id ---- */
/* Só o que MUDOU entra no rascunho, e campo igual ao de fábrica é apagado dele. Sem isso o rascunho cresceria com
   100 itens iguais aos de hoje, e um pacote cheio de "mudanças" que não mudam nada esconde as de verdade no diff. */
const comoEsta = (tabela, id, campos) => Object.fromEntries(campos.map(k => [k, tabela[id]?.[k]]));
export const itemDeHoje = id => comoEsta(ITEMS, id, ['price', 'name', 'desc']);
export const badgeDeHoje = id => comoEsta(Object.fromEntries(BADGES.map(b => [b.id, b])), id, ['nome', 'desc', 'recompensa']);
export const itemEditado = id => ({ ...itemDeHoje(id), ...rascunhoConteudo().itens?.[id] });
export const badgeEditada = id => ({ ...badgeDeHoje(id), ...rascunhoConteudo().badges?.[id] });

/* ---- badge NOVA ---- */
/* Badge nova não é remendo e não passa pelo `gravarRemendo`: ela só existe no pacote, então o rascunho guarda a
   LINHA INTEIRA. Pelo caminho do remendo, campo igual ao que já está na tabela seria apagado do rascunho — e uma
   badge publicada sem a medida é uma conquista impossível em silêncio.
   `badgeDeFabrica` separa as duas: a de fábrica só deixa editar texto e prêmio (a medida dela é função). */
export const badgeDeFabrica = id => !!BADGES_DE_FABRICA[id];
// a lista que a tela mostra: as da tabela (já com o rascunho por cima) + as que só existem no rascunho
export function badgesEditadas() {
  const novas = rascunhoConteudo().badges || {};
  const naTabela = new Set(BADGES.map(b => b.id));
  return [
    ...BADGES.map(b => ({ ...b, ...(novas[b.id] || {}) })),
    ...Object.entries(novas).filter(([id]) => !naTabela.has(id)).map(([id, b]) => ({ ...b, id }))
  ];
}
export const badgeEditadaPorId = id => badgesEditadas().find(b => b.id === id) || null;
export function gravarBadgeNova(id, badge) {
  const r = rascunhoConteudo();
  salvar({ ...r, badges: { ...r.badges, [id]: badge } });
}

const mesmoValor = (a, b) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null);
export function gravarRemendo(parte, id, valor, deHoje) {
  const r = rascunhoConteudo(), tabela = { ...r[parte] };
  const limpo = {};
  for (const [k, v] of Object.entries(valor)) if (!mesmoValor(v, deHoje[k])) limpo[k] = v;
  if (Object.keys(limpo).length) tabela[id] = limpo; else delete tabela[id];
  salvar({ ...r, [parte]: tabela });
  return Object.keys(limpo).length;
}
export function desfazerRemendo(parte, id) {
  const r = rascunhoConteudo(), tabela = { ...r[parte] };
  delete tabela[id];
  salvar({ ...r, [parte]: tabela });
}

/* O que entra no pacote. Chave só vai se tiver edição: ausente quer dizer "não mexi nisso", e `aplicarConteudo`
   resolve pelo de fábrica — mandar as 100 linhas de `itens` iguais às de hoje seria peso sem informação. */
export function extrasDoConteudo() {
  const r = rascunhoConteudo();
  const out = {};
  if (r.missoesGlobais) out.missoesGlobais = r.missoesGlobais;
  if (Object.keys(r.itens || {}).length) out.itens = r.itens;
  if (Object.keys(r.badges || {}).length) out.badges = r.badges;
  return out;
}

/* ---- o bloco pra colar no repositório ---- */
/* As missões globais viram o corpo de `MISSOES_GLOBAIS` (js/dados.js) e o resto vira uma tabela de remendo pra
   `dados.js` aplicar. Diferente dos mapas e da música, aqui o destino é um arquivo ESCRITO À MÃO — então o bloco
   sai pronto pra substituir a tabela, não pra virar arquivo inteiro. */
const j = v => JSON.stringify(v);
export function gerarBlocoConteudo({ missoesGlobais, itens, badges }) {
  const partes = [];
  if (missoesGlobais) {
    partes.push(`// ---- js/dados.js: o corpo de MISSOES_GLOBAIS ----\nexport const MISSOES_GLOBAIS = [\n${
      missoesGlobais.map(m => `  ${j(m)}`).join(',\n')}\n];`);
  }
  if (itens && Object.keys(itens).length) {
    partes.push(`// ---- js/dados.js: aplicar por cima de ITEMS (preço, nome, descrição) ----\n${
      Object.entries(itens).map(([id, it]) => `ITEMS[${j(id)}] = { ...ITEMS[${j(id)}], ...${j(it)} };`).join('\n')}`);
  }
  if (badges && Object.keys(badges).length) {
    const remendos = Object.entries(badges).filter(([id]) => badgeDeFabrica(id));
    const novas = Object.entries(badges).filter(([id]) => !badgeDeFabrica(id));
    if (remendos.length) {
      partes.push(`// ---- js/badges.js: aplicar por cima de BADGES (nome, descrição, recompensa) ----\n${
        remendos.map(([id, b]) => `Object.assign(BADGES.find(x => x.id === ${j(id)}), ${j(b)});`).join('\n')}`);
    }
    // badge nova vira linha de tabela, com `medida` (dado) em vez de `mede` (função) — badges.medirPorDado resolve
    if (novas.length) {
      partes.push(`// ---- js/badges.js: badges novas, pra entrar no corpo de BADGES ----\n${
        novas.map(([id, b]) => `  ${j({ id, ...b })},`).join('\n')}`);
    }
  }
  return partes.join('\n\n') || '// nada editado: o rascunho está vazio.';
}
