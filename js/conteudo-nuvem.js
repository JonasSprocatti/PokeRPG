/* ============ 📦 conteúdo publicado: cache e nuvem ============ */
/* A metade COM rede e storage da Atualização de conteúdo (docs/plano-config-remota.md). A metade pura — validar e
   aplicar — é `conteudo.js`, testada no Node; aqui mora só o que depende de `localStorage` e do Supabase.

   O FLUXO, e a ordem importa:
     1. `carregarConteudoLocal()` no `boot()`: lê o cache (síncrono), valida e aplica. Sem rede. Sem cache, valem
        as tabelas de fábrica — o jogo NUNCA depende da nuvem pra abrir.
     2. `buscarConteudo()` logo depois, SEM `await` no caminho crítico: é busca não essencial, e `await` nela é a
        armadilha que o CLAUDE.md nomeia ("antes de `await` numa busca de rede em caminho crítico, perguntar se o
        jogo precisa DAQUILO agora"). Não precisa: ele já abriu com o cache.
     3. Veio versão maior → guarda. Aplica AGORA só se `podeAplicarAgora` deixar (regra do usuário: "na hora, só
        se não quebrar nada"); senão fica guardado e entra na jornada seguinte, que é quando o `boot` o lê.

   DOIS CANAIS: `teste` só a conta admin lê (é onde o 📤 Publicar grava, pra você jogar a edição antes de todo
   mundo), `estavel` é público. Quem é admin lê o teste quando ele existe e é mais novo. */
import { store, offline } from './util.js';
import { sb, ehAdmin, usuario } from './nuvem.js';
import { validarPacote, aplicarConteudo, podeAplicarAgora, pacoteDeFabrica, VERSAO_PACOTE } from './conteudo.js';

export const CONTEUDO_KEY = 'pokerpg-conteudo-v1';
export const CONTEUDO_PENDENTE_KEY = 'pokerpg-conteudo-pendente-v1';
export const CANAIS = ['estavel', 'teste'];

/* O que está valendo nesta sessão. Não é estado de jogo (não vai pro save, não é `G.S`): é de que versão de
   CONTEÚDO esta aba está jogando, e serve pra tela e pro diagnóstico. */
export const conteudo = { versao: 0, canal: 'fabrica', pendente: null, erro: null };

export const pacoteGuardado = () => store.get(CONTEUDO_KEY);
const guardar = (pacote, canal) => store.set(CONTEUDO_KEY, { pacote, canal, em: Date.now() });

/* ---- 1) o boot ---- */
/* Síncrono e à prova de bala: qualquer problema cai nas tabelas de fábrica e REGISTRA o motivo. Um pacote
   recusado em silêncio é indistinguível de "não há pacote", e é assim que um diagnóstico erra. */
export function carregarConteudoLocal() {
  const guardado = pacoteGuardado();
  if (!guardado?.pacote) { conteudo.canal = 'fabrica'; return aplicarConteudo(pacoteDeFabrica()); }
  const v = validarPacote(guardado.pacote);
  if (!v.ok) {
    // pacote guardado inválido = formato velho ou gravação corrompida: joga fora, senão ele é recusado em todo boot
    console.warn('conteúdo guardado é inválido, voltando pro de fábrica:', v.porque);
    conteudo.erro = v.porque; conteudo.canal = 'fabrica';
    store.del(CONTEUDO_KEY);
    return aplicarConteudo(pacoteDeFabrica());
  }
  conteudo.versao = guardado.pacote.versao; conteudo.canal = guardado.canal || 'estavel';
  return aplicarConteudo(guardado.pacote);
}

/* ---- 2) a nuvem ---- */
/* Qual canal vale pra quem está aqui. Admin lê os dois e fica com o mais novo; o resto só o estável. Separado e
   exportado porque é a única regra do arquivo que vale a pena conferir sem rede. */
export const canaisQuePossoLer = () => (ehAdmin() ? ['estavel', 'teste'] : ['estavel']);

/* Devolve `{ aplicado, guardado, versao, porque }`. Nunca estoura: quem chama é o boot, e derrubar o boot por
   causa de conteúdo seria trocar uma atualização por um jogo que não abre.
   `S` = o save em andamento (ou null) — é o que decide se dá pra aplicar agora. */
export async function buscarConteudo(S = null) {
  try {
    if (offline()) return { porque: 'sem internet' };
    const c = await sb(); if (!c) return { porque: 'nuvem não configurada' };
    const canais = canaisQuePossoLer();
    const { data, error } = await c.from('conteudo_publicado').select('canal,versao,pacote').in('canal', canais);
    /* Erro de rede e tabela faltando chegam iguais aqui, e os dois querem a mesma coisa: seguir com o cache. Mas
       o motivo vai pro console — "a tabela não existe" é um problema de deploy, não de internet do jogador. */
    if (error) return { porque: error.message };
    if (!data?.length) return { porque: 'nada publicado' };

    // o mais novo entre os canais que posso ler. Empate de versão: 'teste' ganha, porque é o que o admin quer ver.
    const melhor = data.slice().sort((a, b) => (b.versao - a.versao) || (b.canal === 'teste' ? 1 : -1))[0];
    const atual = pacoteGuardado();
    if (melhor.versao <= (atual?.pacote?.versao ?? -1) && atual?.canal === melhor.canal) {
      return { porque: 'já está na versão publicada', versao: melhor.versao };
    }
    const v = validarPacote(melhor.pacote);
    if (!v.ok) { console.warn('pacote publicado é inválido:', v.porque); return { porque: v.porque }; }

    const seguro = podeAplicarAgora(melhor.pacote, S);
    guardar(melhor.pacote, melhor.canal);
    if (!seguro.pode) {
      /* Fica pendente pro `boot` seguinte. Guardar no cache ACIMA e só não aplicar é de propósito: na próxima vez
         que o jogo abrir, `carregarConteudoLocal` o aplica sozinho, sem precisar de rede outra vez. */
      store.set(CONTEUDO_PENDENTE_KEY, { versao: melhor.versao, porque: seguro.porque });
      conteudo.pendente = { versao: melhor.versao, porque: seguro.porque };
      return { guardado: true, versao: melhor.versao, porque: seguro.porque };
    }
    store.del(CONTEUDO_PENDENTE_KEY);
    conteudo.pendente = null;
    const r = aplicarConteudo(melhor.pacote);
    conteudo.versao = melhor.versao; conteudo.canal = melhor.canal;
    return { aplicado: true, guardado: true, versao: melhor.versao, ...r };
  } catch (e) {
    return { porque: e.message };
  }
}

/* ---- 3) publicar (só admin) ---- */
/* `canal`: 'teste' = o 📤 Publicar (só você vê) · 'estavel' = o ✅ Liberar pra todos.
   A VERSÃO é calculada aqui, não escolhida: `max(versões que existem) + 1`. Deixar o número na mão de quem
   publica é o caminho curto pra republicar com número menor e o pacote novo ser ignorado pelo cache de todo
   mundo — e aí o conteúdo "não atualiza" sem nenhum erro aparecer. */
export async function publicarConteudo(pacote, canal = 'teste') {
  if (!CANAIS.includes(canal)) return { ok: false, porque: `canal "${canal}" não existe` };
  if (!ehAdmin()) return { ok: false, porque: 'só a conta de manutenção publica conteúdo' };
  const v = validarPacote({ ...pacote, formato: VERSAO_PACOTE, versao: pacote.versao ?? 0 });
  if (!v.ok) return { ok: false, porque: v.porque };

  const c = await sb(); if (!c) return { ok: false, porque: 'nuvem não configurada' };
  const { data, error: erroLeitura } = await c.from('conteudo_publicado').select('versao');
  if (erroLeitura) return { ok: false, porque: erroLeitura.message };
  const versao = Math.max(0, ...(data || []).map(r => Number(r.versao) || 0)) + 1;

  const { error } = await c.from('conteudo_publicado')
    .upsert({ canal, versao, pacote: { ...pacote, formato: VERSAO_PACOTE, versao }, publicado_em: new Date().toISOString(), publicado_por: usuario()?.id || null },
      { onConflict: 'canal' });
  if (error) return { ok: false, porque: error.message };
  return { ok: true, versao, canal };
}

/* O pacote que está no canal pedido, pra tela do editor mostrar o que já foi publicado (e pro ✅ Liberar pra
   todos promover o que FOI TESTADO, não o rascunho da tela — que pode ter mudado depois do 📤 Publicar). */
export async function lerCanal(canal) {
  const c = await sb(); if (!c) return null;
  const { data, error } = await c.from('conteudo_publicado').select('canal,versao,pacote,publicado_em').eq('canal', canal).maybeSingle();
  return error ? null : data;
}
