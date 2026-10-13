/* 👀 OLHAR o jogo num navegador de verdade, no Raspberry Pi, sem dependência nenhuma.
   O Pi não tem tela: até aqui, CSS era escrito às cegas (foi assim que uma classe do mapa da Saga vazou pros
   selos de item e ninguém viu até um jogador mandar print). Esta ferramenta fecha o laço: sobe o
   `chromium-headless-shell` (o Chromium sem janela, `sudo apt install chromium-headless-shell`), fala o
   protocolo do DevTools pelo WebSocket que o Node 22 já traz, e tira FOTO da página.

   Cuidados com a memória (o Pi 3 tem 905 MB):
     · o navegador sobe com `choom -n 1000` — se a memória acabar, o kernel mata ELE primeiro, não a sessão de
       quem chamou;
     · uma aba só, sem GPU, heap do JS limitado; e `fechar()` sempre, senão ele fica comendo RAM.

   Como biblioteca (um roteiro em .mjs):
     import { abrir } from './olhar.mjs';
     const n = await abrir({ largura: 390, altura: 844 });       // celular; 1280×800 pra computador
     await n.ir('http://localhost:3000/jogar.html');
     await n.js(`document.title`);                               // roda na página; aceita await e import()
     await n.tecla('ArrowDown'); await n.toque(200, 400);
     await n.foto('/tmp/tela.png'); await n.fechar();
   Direto (uma foto e pronto):
     node ferramentas/olhar.mjs http://localhost:3000/jogar.html saida.png [largura] [altura]
   O jogo precisa estar servido: `python3 -m http.server 3000` na raiz. */
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const BINARIO = 'chromium-headless-shell', PORTA = 9333;
const dormir = ms => new Promise(r => setTimeout(r, ms));
const TECLAS = { ArrowUp: 38, ArrowDown: 40, ArrowLeft: 37, ArrowRight: 39, Enter: 13, Escape: 27 };

export async function abrir({ largura = 390, altura = 844, celular = largura < 700 } = {}) {
  const perfil = fs.mkdtempSync(path.join(os.tmpdir(), 'olhar-'));
  const proc = spawn('choom', ['-n', '1000', '--', BINARIO, `--remote-debugging-port=${PORTA}`, `--user-data-dir=${perfil}`,
    '--disable-gpu', '--disable-dev-shm-usage', '--no-first-run', '--mute-audio', '--hide-scrollbars', '--disable-extensions',
    '--disable-background-networking', '--renderer-process-limit=1', '--js-flags=--max-old-space-size=192', 'about:blank'], { stdio: 'ignore', detached: true });   // `detached` = grupo próprio: dá pra matar o navegador E os filhos dele de uma vez
  let saiu = false; proc.on('exit', () => { saiu = true; });
  let ws;
  for (let i = 0; i < 80 && !ws; i++) {     // o Pi demora: até ~20 s pro navegador responder
    await dormir(250);
    if (saiu) throw new Error(`${BINARIO} não subiu (está instalado? sobrou memória?)`);
    try { const v = await (await fetch(`http://127.0.0.1:${PORTA}/json/version`)).json(); ws = new WebSocket(v.webSocketDebuggerUrl); } catch { /* ainda subindo */ }
  }
  if (!ws) { try { process.kill(-proc.pid, 'SIGKILL'); } catch { proc.kill(); } throw new Error('o navegador não respondeu a tempo'); }
  await new Promise((ok, falha) => { ws.onopen = ok; ws.onerror = () => falha(new Error('não conectou no navegador')); });
  let seq = 0, sessao = null;
  const espera = new Map(), eventos = [], erros = [];
  ws.onmessage = ev => {
    const m = JSON.parse(ev.data);
    if (m.id && espera.has(m.id)) { const [ok, falha] = espera.get(m.id); espera.delete(m.id); m.error ? falha(new Error(m.error.message)) : ok(m.result); }
    else if (m.method === 'Runtime.exceptionThrown') erros.push(m.params.exceptionDetails?.exception?.description || m.params.exceptionDetails?.text);
    else if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') erros.push('console.error: ' + m.params.args.map(a => a.value ?? a.description).join(' '));
    else if (m.method) eventos.push(m.method);
  };
  const cdp = (method, params = {}) => new Promise((ok, falha) => { const id = ++seq; espera.set(id, [ok, falha]); ws.send(JSON.stringify({ id, method, params, ...(sessao ? { sessionId: sessao } : {}) })); });
  const { targetId } = await cdp('Target.createTarget', { url: 'about:blank' });
  sessao = (await cdp('Target.attachToTarget', { targetId, flatten: true })).sessionId;
  await cdp('Page.enable'); await cdp('Runtime.enable');
  await cdp('Emulation.setDeviceMetricsOverride', { width: largura, height: altura, deviceScaleFactor: 1, mobile: celular });
  if (celular) await cdp('Emulation.setTouchEmulationEnabled', { enabled: true });

  const n = {
    erros,       // exceções e console.error da página, na ordem: o que um jogador veria no console
    // espera a página carregar (ou `ms`, o que vier primeiro) e mais um respiro pros módulos rodarem
    async ir(url, ms = 45000) {
      eventos.length = 0;
      await cdp('Page.navigate', { url });
      for (let t = 0; t < ms && !eventos.includes('Page.loadEventFired'); t += 200) await dormir(200);
      await dormir(1200);
    },
    recarregar: async (ms = 45000) => { eventos.length = 0; await cdp('Page.reload'); for (let t = 0; t < ms && !eventos.includes('Page.loadEventFired'); t += 200) await dormir(200); await dormir(1500); },
    // roda uma expressão na página e devolve o valor (precisa ser serializável). Erro lá vira erro aqui.
    async js(expr) {
      const r = await cdp('Runtime.evaluate', { expression: `(async () => { ${expr.includes('return') ? expr : `return (${expr})`} })()`, awaitPromise: true, returnByValue: true });
      if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text);
      return r.result.value;
    },
    async tecla(key) {
      const base = { key, code: key.length === 1 ? `Key${key.toUpperCase()}` : key, windowsVirtualKeyCode: TECLAS[key] ?? key.toUpperCase().charCodeAt(0) };
      await cdp('Input.dispatchKeyEvent', { type: 'keyDown', ...base }); await cdp('Input.dispatchKeyEvent', { type: 'keyUp', ...base });
    },
    async toque(x, y) {
      for (const type of ['mousePressed', 'mouseReleased']) await cdp('Input.dispatchMouseEvent', { type, x, y, button: 'left', clickCount: 1 });
    },
    // clica no primeiro elemento que casa com o seletor (no centro dele); devolve false se não achou
    async clicar(seletor) {
      const c = await n.js(`const e = document.querySelector(${JSON.stringify(seletor)}); if (!e) return null; const r = e.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]`);
      if (!c) return false;
      await n.toque(c[0], c[1]); return true;
    },
    espere: dormir,
    async foto(arquivo) {
      const { data } = await cdp('Page.captureScreenshot', { format: 'png' });
      fs.writeFileSync(arquivo, Buffer.from(data, 'base64'));
      return arquivo;
    },
    async fechar() {
      try { ws.close(); } catch { /* já fechou */ }
      try { process.kill(-proc.pid, 'SIGKILL'); } catch { proc.kill('SIGKILL'); }   // o grupo inteiro: sem isso os processos-filho ficam vivos, comendo RAM
      await dormir(300);
      fs.rmSync(perfil, { recursive: true, force: true });
    }
  };
  return n;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const [url, saida = 'tela.png', largura = 390, altura = 844] = process.argv.slice(2);
  if (!url) { console.error('uso: node ferramentas/olhar.mjs <url> [saida.png] [largura] [altura]'); process.exit(1); }
  const n = await abrir({ largura: +largura, altura: +altura });
  try { await n.ir(url); console.log(await n.foto(saida)); for (const e of n.erros) console.log('⚠', e); }
  finally { await n.fechar(); }
}
