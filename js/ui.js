/* ============ log e modal ============ */
// Tudo que toca o DOM de forma genérica (sem saber de batalha/criação).
import { G } from './estado.js';
import { sleep } from './util.js';
import { TC } from './dados.js';
import { animacoesLigadas } from './ajustes.js';

export const $ = s => document.querySelector(s);
/* "Vou animar?" tem DUAS respostas e um só ponto de leitura: o `prefers-reduced-motion` do sistema e o ajuste
   ⚙ Ajustes → Som e animações. É função, não const, porque o ajuste muda no meio da sessão (o const era lido uma
   vez no carregamento e o checkbox não valeria até o F5). Desligar também encurta a pausa do `say` — a espera
   existia pra dar tempo de ver a animação; sem animação, o combate anda mais rápido. */
const REDUCED_SISTEMA = matchMedia('(prefers-reduced-motion: reduce)').matches;
export const semAnimacao = () => REDUCED_SISTEMA || !animacoesLigadas();

/* ---- topo: dinheiro sempre visível + menu ☰ no celular ---- */
// telas fora do jogo limpam o topo por aqui (botões + dinheiro), nunca direto no #topr
export function limparTopo() {
  $('#topr').innerHTML = '';
  const d = $('#top-dinheiro'); if (d) d.textContent = '';
  fecharMenu();
}
export function fecharMenu() {
  $('#menu-links')?.classList.remove('open');
  const b = $('#menu-burger'); if (b) { b.textContent = '☰'; b.setAttribute('aria-expanded', 'false'); b.setAttribute('aria-label', 'Abrir menu'); }
}
// ☰ abre/fecha; clicar num botão do menu, fora dele, ou Esc fecha (sem mouse/teclado também dá pra sair: toque fora)
export function iniciarMenu() {
  document.addEventListener('click', e => {
    const menu = $('#menu-links'), burger = e.target.closest('#menu-burger');
    if (burger) {
      const abrir = !menu.classList.contains('open');
      menu.classList.toggle('open', abrir);
      burger.textContent = abrir ? '✕' : '☰';
      burger.setAttribute('aria-expanded', String(abrir));
      burger.setAttribute('aria-label', abrir ? 'Fechar menu' : 'Abrir menu');
      return;
    }
    if (!menu?.classList.contains('open')) return;
    if (!e.target.closest('#menu-links') || e.target.closest('button, a')) fecharMenu();
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') fecharMenu(); });
}

// aviso flutuante (canto de baixo), por cima de qualquer tela; pode ter botões com data-act. `ms` 0 = só fecha no ✕
export function toast(html, ms = 15000) {
  let pilha = $('#toasts');
  if (!pilha) { pilha = document.createElement('div'); pilha.id = 'toasts'; pilha.setAttribute('aria-live', 'polite'); document.body.appendChild(pilha); }
  const t = document.createElement('div'); t.className = 'toast';
  t.innerHTML = `<div>${html}</div><button type="button" class="toast-x" aria-label="Fechar aviso">✕</button>`;
  const fechar = () => t.remove();
  t.addEventListener('click', e => { if (e.target.closest('.toast-x, [data-act]')) setTimeout(fechar); });
  pilha.appendChild(t);
  if (ms) setTimeout(fechar, ms);
}

export function logRaw(l) {
  const el = $('#log'); if (!el) return;
  const p = document.createElement('p'); if (l.cls) p.className = l.cls; p.innerHTML = l.html;
  el.appendChild(p); el.scrollTop = el.scrollHeight;
}
export function log(html, cls = '') { const l = { html, cls }; logRaw(l); if (G.S) (G.S.log ||= []).push(l); }
export async function say(html, cls) { log(html, cls); await sleep(semAnimacao() ? 80 : 420); }
export function ask(html, options, extra = '') {
  return new Promise(res => {
    const d = document.createElement('div'); d.className = 'modal';
    d.innerHTML = `<div class="box" role="dialog" aria-modal="true"><div class="box-body">${html}</div>${extra}<div class="choices">${options.map((o, i) => `<button class="btn ${o.ghost ? 'ghost' : ''}" data-i="${i}">${o.label}</button>`).join('')}</div></div>`;
    document.body.appendChild(d); d.querySelector('button').focus();
    d.addEventListener('click', e => { const b = e.target.closest('button[data-i]'); if (!b) return; d.remove(); res(options[+b.dataset.i].value); });
  });
}
/* HUD de quantidade da loja: − / + / campo / Máx, com o total e o troco ao vivo. Devolve a quantidade escolhida
   (1..max) ou 0 se cancelou. `figuraHtml` é o <img> do item, montado por quem chama. Esc e clicar fora cancelam. */
/* `acao`: 'comprar' (padrão, gasta `dinheiro`) ou 'vender' (ganha na venda — a loja e a mochila usam o mesmo
   modal, só o texto muda). `preco` em 'vender' já vem como o valor de venda (metade do de compra). */
export function pedirQuantidade({ nome, figuraHtml = '', preco, max, dinheiro, acao = 'comprar' }) {
  return new Promise(res => {
    let q = 1;
    const vendendo = acao === 'vender';
    const brl = n => '₽' + n.toLocaleString('pt-BR');
    const d = document.createElement('div'); d.className = 'modal';
    const verbo = vendendo ? 'Vender' : 'Comprar';
    d.innerHTML = `<div class="box qtd-box" role="dialog" aria-modal="true" aria-label="${verbo} ${nome}">
      <div class="qtd-topo">${figuraHtml}<div><b>${nome}</b><div class="small muted">${vendendo ? `${brl(preco)} cada` : `${brl(preco)} cada · você tem ${brl(dinheiro)}`}</div></div></div>
      <div class="qtd-ctl">
        <button type="button" class="btn ghost" data-q="-10" aria-label="Menos 10">−10</button>
        <button type="button" class="btn ghost" data-q="-1" aria-label="Menos 1">−</button>
        <input type="number" inputmode="numeric" min="1" max="${max}" value="1" aria-label="Quantidade">
        <button type="button" class="btn ghost" data-q="1" aria-label="Mais 1">+</button>
        <button type="button" class="btn ghost" data-q="10" aria-label="Mais 10">+10</button>
      </div>
      <div class="qtd-atalho"><button type="button" class="btn ghost" data-q="max">Máx (${max})</button></div>
      <div class="qtd-total"></div>
      <div class="choices"><button type="button" class="btn" data-ok>${verbo}</button><button type="button" class="btn ghost" data-cancel>Cancelar</button></div></div>`;
    const inp = d.querySelector('input'), tot = d.querySelector('.qtd-total');
    const pinta = () => {
      q = Math.min(max, Math.max(1, Math.floor(+inp.value) || 1)); inp.value = q;
      tot.innerHTML = vendendo
        ? `Você recebe <b>${brl(q * preco)}</b>`
        : `Total <b>${brl(q * preco)}</b> <span class="muted small">— sobram ${brl(dinheiro - q * preco)}</span>`;
    };
    const fim = v => { document.removeEventListener('keydown', tecla, true); d.remove(); res(v); };
    const tecla = e => {
      if (e.key === 'Escape') { e.stopPropagation(); fim(0); }
      else if (e.key === 'Enter') { e.preventDefault(); pinta(); fim(q); }
    };
    d.addEventListener('click', e => {
      if (e.target === d || e.target.closest('[data-cancel]')) return fim(0);
      if (e.target.closest('[data-ok]')) { pinta(); return fim(q); }
      const b = e.target.closest('[data-q]'); if (!b) return;
      inp.value = b.dataset.q === 'max' ? max : (+inp.value || 1) + +b.dataset.q; pinta();
    });
    inp.addEventListener('input', pinta);
    document.addEventListener('keydown', tecla, true);
    document.body.appendChild(d); pinta(); inp.focus(); inp.select();
  });
}
// id do .mon na CENA de batalha pra este Pokémon (jogador/aliado/inimigo) — usado por toda animação de golpe
// (tremer, atacar…) que precisa achar o sprite certo. Devolve null fora da cena (nada pra animar).
function idDoMon(m) {
  if (!G.S) return null;
  const ia = (G.S.aliados || []).indexOf(m);
  // o lado inimigo é uma lista (⚔ Saga: até 3): o id leva o índice, senão a animação de dano cairia sempre
  // no primeiro sprite e o jogador veria o golpe acertar quem não apanhou
  const ie = (G.B?.inimigos || []).indexOf(m);
  return m === G.S.player ? 'mon-p' : ia >= 0 ? 'mon-a' + ia : ie >= 0 ? 'mon-e' + ie : null;
}
// troca a classe (removendo antes, forçando reflow) pra reiniciar a animação mesmo se ela já estava rodando
function reanimar(id, classe) {
  const el = document.getElementById(id); if (!el) return null;
  el.classList.remove(classe); void el.offsetWidth; el.classList.add(classe);
  return el;
}
/* Quem apanha treme E pisca NA COR DO TIPO do golpe (`dados.TC`, as mesmas cores dos selos de tipo) — pedido do
   usuário junto do som de impacto: golpe de fogo estoura laranja, de água azul.
   A piscada já foi disparada pelo render de `up(ctx)`, no vermelho padrão, e ela é REINICIADA aqui com a cor
   certa. O caminho de "pintar antes do render" não existe: `render()` remonta a cena inteira, então qualquer
   variável de CSS posta no sprite antes seria jogada fora junto com o elemento. `tipo` ausente (dano de
   confusão, esforço do próprio golpe) fica no vermelho de sempre. */
export function shake(m, tipo) {
  const id = idDoMon(m); if (!id || semAnimacao()) return;
  const el = reanimar(id, 'shake'); if (!el) return;
  el.style.setProperty('--cor-impacto', TC[tipo] || '#ff4d4d');
  reanimar(id, 'hit-flash');
}
// quem usou o golpe "pula" um pouco — narrado bem no momento em que golpe.js anuncia "X usou Y!" (ctx.atacar,
// opcional: o multiplayer não tem DOM, então o ctx dele simplesmente não define isso)
export function atacar(m) { const id = idDoMon(m); if (id && !semAnimacao()) reanimar(id, 'atacando'); }

/* 🏛 Arceus trocando de Prato (boss.js manda `{pratos: tipo}`): um anel com a cor de CADA tipo gira em volta dele
   e o Prato sorteado fica brilhando no meio. É uma camada por cima do sprite que se remove sozinha — nada fica no
   DOM pro `render()` seguinte ter de limpar (e `render()` remontando a cena no meio só corta a animação, não quebra). */
export function trocarPratos(m, tipo) {
  const id = idDoMon(m); if (!id || semAnimacao()) return;
  const el = document.getElementById(id); if (!el) return;
  el.querySelector('.pratos')?.remove();
  const tipos = Object.keys(TC), cor = TC[tipo] || '#fff', d = document.createElement('div');
  d.className = 'pratos'; d.setAttribute('aria-hidden', 'true');
  d.style.setProperty('--cor-prato', cor);
  d.innerHTML = tipos.map((t, i) => `<i style="--a:${Math.round(360 / tipos.length * i)}deg;background:${TC[t]}"></i>`).join('')
    + `<b style="background:${cor}"></b>`;
  el.appendChild(d);
  setTimeout(() => d.remove(), 1700);
}
