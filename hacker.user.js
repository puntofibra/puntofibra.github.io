// ==UserScript==
// @name         0 - Hacker Console FX + Gatekeeper
// @namespace    manu.hackfx.gatekeeper
// @version      3.1
// @description  Consola
// @match        *://*/*
// @grant        GM_setValue
// @grant        GM_getValue
// @run-at       document-start
// ==/UserScript==

(function () {
  'use strict';

  /* ============================================================
     0) LLAVE DE DESBLOQUEO GLOBAL (cross-domain via GM storage)
     ============================================================
     Esta clave se guarda en el almacenamiento propio de Tampermonkey
     (no en localStorage de una sola web), por eso persiste aunque
     escribas "open" en una web totalmente distinta a donde este
     instalado el script que quieres desbloquear. En CADA web que
     cargue, este script (document-start) espeja ese valor en el
     localStorage de esa web, para que tus otros scripts (con el
     guard-snippet de abajo) puedan leerlo ahi mismo, sea cual sea el
     dominio.
     ============================================================ */
  const UNLOCK_KEY = 'open_unlocked';
  const KEYWORD = 'open';

  function mirrorUnlockState() {
    try {
      const unlocked = !!GM_getValue(UNLOCK_KEY, false);
      localStorage.setItem(UNLOCK_KEY, unlocked ? '1' : '0');
      console.log('[Gatekeeper DEBUG] Pagina cargada. Estado actual:', unlocked ? 'OPEN' : 'CLOSE', '| host:', location.hostname);
    } catch (e) {
      console.log('[Gatekeeper DEBUG] ERROR en mirrorUnlockState:', e.message);
    }
  }
  mirrorUnlockState();

  function grantAccess() {
    try {
      GM_setValue(UNLOCK_KEY, true);
      localStorage.setItem(UNLOCK_KEY, '1');
      document.dispatchEvent(new CustomEvent('gatekeeper-state', { detail: { unlocked: true } }));
      console.log('[Gatekeeper DEBUG] "open" detectado -> ACCESO CONCEDIDO. localStorage ahora:', localStorage.getItem(UNLOCK_KEY));
    } catch (e) {
      console.log('[Gatekeeper DEBUG] ERROR en grantAccess:', e.message);
    }
  }

  function revokeAccess() {
    try {
      GM_setValue(UNLOCK_KEY, false);
      localStorage.setItem(UNLOCK_KEY, '0');
      document.dispatchEvent(new CustomEvent('gatekeeper-state', { detail: { unlocked: false } }));
      console.log('[Gatekeeper DEBUG] "close" detectado -> ACCESO REVOCADO. localStorage ahora:', localStorage.getItem(UNLOCK_KEY));
    } catch (e) {
      console.log('[Gatekeeper DEBUG] ERROR en revokeAccess:', e.message);
    }
  }

  /* ============================================================
     1) DETECTOR DE "hack" (abre la consola-animacion)
     ============================================================ */
  let buffer = '';
  const TRIGGER = 'hack';

  document.addEventListener('keydown', (e) => {
    // Si la consola ya esta abierta, no seguimos escuchando el trigger
    if (document.getElementById('hkc-overlay')) return;

    if (e.key && e.key.length === 1) {
      buffer += e.key.toLowerCase();
      if (buffer.length > TRIGGER.length) {
        buffer = buffer.slice(-TRIGGER.length);
      }
      if (buffer === TRIGGER) {
        buffer = '';
        launchConsole();
      }
    }
  });

  /* ============================================================
     1b) DETECTORES SILENCIOSOS "open" / "close" — funcionan SIEMPRE,
     este o no abierta la consola, Y tambien mientras escribes dentro
     de la consola (van en fase "capture" sobre document, el mismo
     nodo que usa la consola, asi que ambos ven las mismas teclas).
     "open"  -> desbloquea al instante.
     "close" -> bloquea al instante.
     ============================================================ */
  let openBuffer = '';
  const OPEN_TRIGGER = 'open';
  let closeBuffer = '';
  const CLOSE_TRIGGER = 'close';

  document.addEventListener('keydown', (e) => {
    if (!(e.key && e.key.length === 1)) return;
    const k = e.key.toLowerCase();

    openBuffer += k;
    if (openBuffer.length > OPEN_TRIGGER.length) openBuffer = openBuffer.slice(-OPEN_TRIGGER.length);
    console.log('[Gatekeeper DEBUG] buffer "open":', openBuffer);
    if (openBuffer === OPEN_TRIGGER) {
      openBuffer = '';
      closeBuffer = '';
      grantAccess();
    }

    closeBuffer += k;
    if (closeBuffer.length > CLOSE_TRIGGER.length) closeBuffer = closeBuffer.slice(-CLOSE_TRIGGER.length);
    if (closeBuffer === CLOSE_TRIGGER) {
      closeBuffer = '';
      openBuffer = '';
      revokeAccess();
    }
  }, true);

  /* ============================================================
     2) ESTILOS
     ============================================================ */
  function injectStyles() {
    if (document.getElementById('hkc-styles')) return;
    const css = `
    #hkc-overlay {
      position: fixed; inset: 0; z-index: 2147483647;
      background: radial-gradient(ellipse at center, #001a05 0%, #000000 100%);
      display: flex; align-items: center; justify-content: center;
      font-family: 'Consolas','Courier New',monospace;
      animation: hkc-fadein .35s ease-out;
    }
    @keyframes hkc-fadein { from{opacity:0} to{opacity:1} }

    #hkc-rain { position:absolute; inset:0; opacity:.35; pointer-events: none; z-index: 0; }

    #hkc-box {
      position: relative;
      z-index: 1;
      width: 100vw;
      height: 100vh;
      background: rgba(0,10,2,0.88);
      border: none;
      box-shadow: 0 0 60px rgba(23,255,95,0.25) inset;
      border-radius: 0;
      display: flex; flex-direction: column;
      overflow: hidden;
    }
    #hkc-titlebar {
      background: linear-gradient(#0d1f10,#081208);
      border-bottom: 1px solid #17ff5f;
      color: #17ff5f;
      font-size: 12px;
      padding: 6px 10px;
      display: flex; justify-content: space-between; align-items: center;
      letter-spacing: 1px;
    }
    #hkc-titlebar .dots span {
      display:inline-block; width:10px; height:10px; border-radius:50%;
      margin-right:6px; background:#17ff5f; opacity:.5;
    }
    #hkc-close-x {
      cursor: pointer; color:#17ff5f; opacity:.7; border:1px solid #17ff5f55;
      padding: 1px 8px; border-radius:3px; font-size:11px;
    }
    #hkc-close-x:hover { opacity:1; background:#17ff5f22; }

    #hkc-screen {
      flex: 1; padding: 14px 16px; overflow-y: auto;
      color: #17ff5f; font-size: 13.5px; line-height: 1.5;
      text-shadow: 0 0 4px rgba(23,255,95,.6);
    }
    #hkc-screen::-webkit-scrollbar { width: 8px; }
    #hkc-screen::-webkit-scrollbar-thumb { background:#17ff5f55; border-radius:4px; }

    .hkc-line { white-space: pre-wrap; word-break: break-word; }
    .hkc-cyan   { color:#42e6ff; text-shadow:0 0 4px rgba(66,230,255,.6); }
    .hkc-amber  { color:#ffbe42; text-shadow:0 0 4px rgba(255,190,66,.6); }
    .hkc-red    { color:#ff5c5c; text-shadow:0 0 4px rgba(255,92,92,.6); }
    .hkc-white  { color:#eafff0; }
    .hkc-dim    { color:#17ff5f88; }

    .hkc-prompt-row { display:flex; align-items:baseline; }
    .hkc-prompt-label { color:#42e6ff; margin-right:6px; white-space:nowrap; }
    .hkc-typed { color:#eafff0; }
    .hkc-cursor {
      display:inline-block; width:8px; height:15px; background:#17ff5f;
      margin-left:2px; animation: hkc-blink 1s steps(1) infinite;
      vertical-align: -2px;
    }
    @keyframes hkc-blink { 50% { opacity:0; } }

    .hkc-bar-wrap { color:#17ff5f88; }
    .hkc-bar-fill { color:#17ff5f; }

    #hkc-final {
      text-align:center; padding: 30px 10px;
    }
    #hkc-final h1 {
      font-size: 34px; margin: 0 0 6px 0; letter-spacing: 3px;
      color: #17ff5f; text-shadow: 0 0 8px #17ff5f, 0 0 24px #17ff5f;
      animation: hkc-glitch 1.4s infinite;
    }
    @keyframes hkc-glitch {
      0%,100% { transform: translate(0,0); }
      20% { transform: translate(-2px,1px); }
      40% { transform: translate(2px,-1px); }
      60% { transform: translate(-1px,-1px); }
      80% { transform: translate(1px,1px); }
    }
    #hkc-final p { color:#9affc0; font-size:13px; margin: 4px 0 20px; }

    #hkc-close-btn {
      background: transparent; border: 1px solid #17ff5f; color:#17ff5f;
      padding: 10px 26px; font-family: inherit; font-size: 13px;
      letter-spacing: 2px; cursor: pointer; border-radius: 4px;
      transition: all .2s;
    }
    #hkc-close-btn:hover { background:#17ff5f; color:#001a05; box-shadow:0 0 16px #17ff5f; }
    `;
    const style = document.createElement('style');
    style.id = 'hkc-styles';
    style.textContent = css;
    document.head.appendChild(style);
  }

  /* ============================================================
     3) LLUVIA ESTILO MATRIX DE FONDO (canvas)
     ============================================================ */
  function startRain(overlay) {
    const canvas = document.createElement('canvas');
    canvas.id = 'hkc-rain';
    overlay.appendChild(canvas);
    const ctx = canvas.getContext('2d');
    function resize() {
      canvas.width = overlay.clientWidth;
      canvas.height = overlay.clientHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    const chars = 'アイウエオカキクケコサシスセソ01001101ABCDEF#$%&';
    const fontSize = 15;
    let columns = Math.floor(canvas.width / fontSize);
    let drops = new Array(columns).fill(1);

    const interval = setInterval(() => {
      if (!document.getElementById('hkc-overlay')) {
        clearInterval(interval);
        window.removeEventListener('resize', resize);
        return;
      }
      columns = Math.floor(canvas.width / fontSize);
      if (drops.length !== columns) drops = new Array(columns).fill(1);

      ctx.fillStyle = 'rgba(0,10,2,0.15)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#17ff5f';
      ctx.font = fontSize + 'px monospace';
      for (let i = 0; i < drops.length; i++) {
        const text = chars[Math.floor(Math.random() * chars.length)];
        ctx.fillText(text, i * fontSize, drops[i] * fontSize);
        if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i]++;
      }
    }, 45);
  }

  /* ============================================================
     4) UTILIDADES DE ESCRITURA ANIMADA
     ============================================================ */
  const screenEl = () => document.getElementById('hkc-screen');

  function scrollDown() {
    const s = screenEl();
    if (s) s.scrollTop = s.scrollHeight;
  }

  // Escribe una linea letra a letra
  function typeLine(text, cls = '', speed = 14) {
    return new Promise((resolve) => {
      const s = screenEl();
      if (!s) return resolve();
      const line = document.createElement('div');
      line.className = 'hkc-line ' + cls;
      s.appendChild(line);
      let i = 0;
      const t = setInterval(() => {
        line.textContent += text[i];
        i++;
        scrollDown();
        if (i >= text.length) {
          clearInterval(t);
          resolve();
        }
      }, speed);
    });
  }

  function sleep(ms) {
    return new Promise((r) => setTimeout(r, ms));
  }

  // Muestra una barra de progreso animada tipo [####----] 42%
  // opts.slow = true -> mucho mas lenta, para las rondas de "deep hack" (15-20s)
  function progressBar(label, opts = {}) {
    return new Promise((resolve) => {
      const s = screenEl();
      const line = document.createElement('div');
      line.className = 'hkc-line hkc-bar-wrap';
      s.appendChild(line);
      let pct = 0;
      const total = 20;
      const step = opts.slow ? () => Math.ceil(Math.random() * 2) + 1 : () => Math.ceil(Math.random() * 4) + 1;
      const interval = opts.slow ? 240 : 90;
      const t = setInterval(() => {
        pct += step();
        if (pct > 100) pct = 100;
        const filled = Math.round((pct / 100) * total);
        const bar = '#'.repeat(filled) + '-'.repeat(total - filled);
        line.innerHTML = `${label} [<span class="hkc-bar-fill">${bar}</span>] ${pct}%`;
        scrollDown();
        if (pct >= 100) {
          clearInterval(t);
          setTimeout(resolve, 180);
        }
      }, interval);
    });
  }

  // Categorias de "fase de ataque" — cada ronda usa una distinta (ciclicamente)
  // para que la animacion nunca se vea repetitiva. Texto en ingles (asi se ve
  // en las peliculas de hackers). "extra" son lineas adicionales que solo se
  // usan en las rondas lentas ("deep hack") para alargar la escena 15-20s.
  const PHASE_TYPES = [
    {
      label: 'NETWORK RECON',
      headerCls: 'hkc-cyan',
      barLabel: 'Scanning target network',
      lines: [
        ['> net.scan(range="192.168.{}.0/24", stealth=True)', 'hkc-dim'],
        ['open ports: 22, 443, 8081 — banner grabbing...', 'hkc-cyan'],
        ['active host found: 10.{}.{}.{} (TTL=64, linux)', 'hkc-dim'],
        ['[OK] network topology reconstructed — 14 nodes visible', 'hkc-cyan'],
        ['fingerprinting services... nginx/1.24, openssh 8.9', 'hkc-dim'],
        ['[WARN] suspicious honeypot at 10.{}.{}.12, avoiding', 'hkc-red'],
      ],
      extra: [
        ['> arp.sweep(subnet="10.{}.0.0/16", timeout=200)', 'hkc-dim'],
        ['resolving reverse DNS for {} hosts...', 'hkc-dim'],
        ['[OK] internal DNS zone transfer succeeded', 'hkc-cyan'],
        ['mapping VLAN segmentation... 6 segments found', 'hkc-dim'],
        ['[WARN] IDS signature match on packet #{} — throttling', 'hkc-red'],
        ['cross-referencing CVE database against banners...', 'hkc-amber'],
        ['> service.enum(target="10.{}.{}.{}", deep=True)', 'hkc-dim'],
        ['[OK] internal routing table exfiltrated', 'hkc-cyan'],
      ],
    },
    {
      label: 'BRUTE FORCE / CREDENTIALS',
      headerCls: 'hkc-amber',
      barLabel: 'Cracking credentials',
      lines: [
        ['> hash.crack(algo="sha256", dict="rockyou_ext.txt")', 'hkc-dim'],
        ['[OK] weak credentials found, rotating access', 'hkc-cyan'],
        ['> bruteforce_socket.connect(target="10.42.{}.{}")', 'hkc-dim'],
        ['trying combination {}/{}... attempt {} of 4096', 'hkc-dim'],
        ['decrypting payload... AES256 -> XOR fallback detected', 'hkc-amber'],
        ['[OK] valid password found — hash match', 'hkc-cyan'],
      ],
      extra: [
        ['> wordlist.load(file="corporate_leak_2024.txt")', 'hkc-dim'],
        ['GPU cluster engaged: 4x RTX, {} MH/s', 'hkc-amber'],
        ['testing salted variants... round {}/512', 'hkc-dim'],
        ['[WARN] account lockout policy detected, slowing down', 'hkc-red'],
        ['rainbow table lookup in progress...', 'hkc-dim'],
        ['[OK] admin session token recovered', 'hkc-cyan'],
        ['> auth.replay(token=session.stolen, ttl={}s)', 'hkc-dim'],
        ['bypassing 2FA via SIM-swap emulation...', 'hkc-amber'],
      ],
    },
    {
      label: 'FIREWALL BYPASS',
      headerCls: 'hkc-red',
      barLabel: 'Evading security perimeter',
      lines: [
        ['[WARN] adaptive firewall detected, rerouting via proxy_{}', 'hkc-red'],
        ['spoofing MAC 3C:5A:B4:{}:{}:{} ... done', 'hkc-cyan'],
        ['> tunnel.open(protocol="icmp", encapsulate=True)', 'hkc-dim'],
        ['[OK] firewall rule evaded — traffic disguised as DNS', 'hkc-cyan'],
        ['chaining 3 VPN nodes... latency +{} ms', 'hkc-dim'],
        ['[OK] encrypted channel established, latency 12ms', 'hkc-cyan'],
      ],
      extra: [
        ['> waf.fingerprint(target="edge-{}")', 'hkc-dim'],
        ['bypassing rate limiter with jittered timing...', 'hkc-amber'],
        ['[WARN] TLS fingerprint mismatch, regenerating JA3', 'hkc-red'],
        ['fragmenting payload across {} TCP segments', 'hkc-dim'],
        ['[OK] deep packet inspection blinded successfully', 'hkc-cyan'],
        ['establishing covert DNS-over-HTTPS tunnel...', 'hkc-dim'],
        ['> proxy.rotate(pool="residential", count={})', 'hkc-dim'],
        ['[OK] origin IP fully masked', 'hkc-cyan'],
      ],
    },
    {
      label: 'DATABASE BREACH',
      headerCls: 'hkc-cyan',
      barLabel: 'Extracting data',
      lines: [
        ['> sql: SELECT * FROM users WHERE 1=1-- (bypass ok)', 'hkc-dim'],
        ['reading partition /dev/sda1 ... indexes rebuilt', 'hkc-dim'],
        ['[OK] table dump "customers" ({} rows) completed', 'hkc-cyan'],
        ['decrypting encrypted columns... AES-CBC broken', 'hkc-amber'],
        ['> db.exfiltrate(table="contracts", format="json")', 'hkc-dim'],
        ['[WARN] audit trigger detected, disabling logs', 'hkc-red'],
      ],
      extra: [
        ['> schema.dump(target="prod_db", verbose=True)', 'hkc-dim'],
        ['found {} unindexed sensitive columns', 'hkc-amber'],
        ['[OK] replication slave hijacked for silent read', 'hkc-cyan'],
        ['compressing dataset... {} MB -> {} MB', 'hkc-dim'],
        ['[WARN] backup encryption key required, brute-forcing', 'hkc-red'],
        ['reconstructing deleted rows from WAL log...', 'hkc-dim'],
        ['> export.stream(dest="remote_drop", chunked=True)', 'hkc-dim'],
        ['[OK] exfiltration channel throughput: {} KB/s', 'hkc-cyan'],
      ],
    },
    {
      label: 'PRIVILEGE ESCALATION',
      headerCls: 'hkc-amber',
      barLabel: 'Escalating privileges',
      lines: [
        ['escalating privileges: user -> root ... token forged', 'hkc-amber'],
        ['> exploit.inject(module="auth_bypass_v3", target=session)', 'hkc-dim'],
        ['injecting shellcode into pid={} ... success', 'hkc-amber'],
        ['[OK] kernel exploit CVE-2024-{} applied successfully', 'hkc-cyan'],
        ['overwriting permission table... UID 0 assigned', 'hkc-dim'],
        ['[OK] root access confirmed on remote host', 'hkc-cyan'],
      ],
      extra: [
        ['> kernel.symbols(leak="kaslr_base")', 'hkc-dim'],
        ['building ROP chain... {} gadgets resolved', 'hkc-amber'],
        ['[WARN] SELinux policy blocking write, patching', 'hkc-red'],
        ['heap spray in progress... {} allocations', 'hkc-dim'],
        ['[OK] sudoers file rewritten silently', 'hkc-cyan'],
        ['spawning root shell on tty{}...', 'hkc-dim'],
        ['> priv.verify(uid=0, gid=0)', 'hkc-dim'],
        ['[OK] full system control established', 'hkc-cyan'],
      ],
    },
    {
      label: 'PERSISTENCE / ROOTKIT',
      headerCls: 'hkc-red',
      barLabel: 'Installing persistence',
      lines: [
        ['> rootkit.install(hide_process=True, autostart=True)', 'hkc-dim'],
        ['[OK] backdoor disguised as systemd service', 'hkc-cyan'],
        ['scrubbing log footprint... {} entries purged', 'hkc-dim'],
        ['[WARN] antivirus attempted quarantine, neutralized', 'hkc-red'],
        ['creating ghost account with persistent access', 'hkc-amber'],
        ['[OK] persistence verified after simulated reboot', 'hkc-cyan'],
      ],
      extra: [
        ['> hook.syscall(table="sys_call_table", index={})', 'hkc-dim'],
        ['hiding kernel module from lsmod...', 'hkc-amber'],
        ['[WARN] integrity checker triggered, spoofing hash', 'hkc-red'],
        ['scheduling beacon callback every {} minutes', 'hkc-dim'],
        ['[OK] cron persistence installed under system user', 'hkc-cyan'],
        ['wiping bash_history and auth.log timestamps...', 'hkc-dim'],
        ['> c2.checkin(server="relay-{}", jitter=True)', 'hkc-dim'],
        ['[OK] backdoor confirmed reachable from C2', 'hkc-cyan'],
      ],
    },
  ];

  function randFakeFromCategory(category, n, includeExtra) {
    const pool = includeExtra ? [...category.lines, ...(category.extra || [])] : [...category.lines];
    const out = [];
    const count = Math.min(n, pool.length);
    for (let i = 0; i < count; i++) {
      const idx = Math.floor(Math.random() * pool.length);
      out.push(pool.splice(idx, 1)[0]);
    }
    return out;
  }

  function rnd() {
    return Math.floor(Math.random() * 255);
  }

  /* ============================================================
     5) INPUT INTERACTIVO (captura teclado del usuario)
     ============================================================ */
  function askUser(promptLabel) {
    return new Promise((resolve) => {
      const s = screenEl();
      const row = document.createElement('div');
      row.className = 'hkc-prompt-row hkc-line';
      row.innerHTML = `<span class="hkc-prompt-label">${promptLabel}</span><span class="hkc-typed"></span><span class="hkc-cursor"></span>`;
      s.appendChild(row);
      scrollDown();

      const typedEl = row.querySelector('.hkc-typed');
      let value = '';

      function handler(e) {
        if (e.key === 'Enter') {
          if (value.trim().length === 0) return; // exige algo de texto
          document.removeEventListener('keydown', handler, true);
          row.querySelector('.hkc-cursor').remove();
          resolve(value);
          return;
        }
        if (e.key === 'Backspace') {
          value = value.slice(0, -1);
        } else if (e.key.length === 1) {
          value += e.key;
        } else {
          return;
        }
        typedEl.textContent = value;
        e.preventDefault();
        e.stopPropagation();
      }
      document.addEventListener('keydown', handler, true);
    });
  }

  /* ============================================================
     6) SECUENCIA PRINCIPAL
     ============================================================ */
  async function launchConsole() {
    // Pantalla completa automatica: se dispara con la propia tecla que abre la
    // consola (cuenta como gesto de usuario, que es lo que exige la Fullscreen API)
    try {
      const el = document.documentElement;
      (el.requestFullscreen || el.webkitRequestFullscreen || function(){}).call(el);
    } catch (e) { /* noop */ }
    injectStyles();

    const overlay = document.createElement('div');
    overlay.id = 'hkc-overlay';
    overlay.innerHTML = `
      <div id="hkc-box">
        <div id="hkc-titlebar">
          <span class="dots"><span></span><span></span><span></span> root@${location.hostname}: ~/breach</span>
          <span id="hkc-close-x" title="Cerrar">✕</span>
        </div>
        <div id="hkc-screen"></div>
      </div>
    `;
    (document.body || document.documentElement).appendChild(overlay);
    startRain(overlay);

    document.getElementById('hkc-close-x').addEventListener('click', closeConsole);
    document.addEventListener('keydown', escToClose, true);

    // --- Intro de arranque ---
    await typeLine('INITIATING INTRUSION SEQUENCE...', 'hkc-white', 12);
    await sleep(200);
    await progressBar('Connecting to target server');
    await typeLine('connection established with simyo-core.internal', 'hkc-cyan', 10);
    await sleep(150);
    await typeLine('System ready. Enter a command to continue the intrusion.', 'hkc-dim', 8);
    await sleep(150);

    const DEFAULT_ROUNDS = 4;
    const MAX_ROUNDS_CAP = 25; // limite de seguridad para no colapsar la consola
    const SLOW_ROUND_THRESHOLD = 5; // solo se activan rondas lentas si se piden mas de 5
    let remaining = DEFAULT_ROUNDS - 1; // rondas restantes DESPUES de la actual
    let round = 1;
    let slowModeEnabled = false;

    while (true) {
      const userText = await askUser(`root@${location.hostname}:~$`);

      // Nota: "open" y "close" ya se detectan en tiempo real por el listener
      // global (1b), tanto si los escribes aqui dentro como fuera de la
      // consola. No hace falta comprobarlo aparte: al final leemos el
      // estado real guardado para que la pantalla de resultado sea 100%
      // fiel a lo ultimo que hayas tecleado.

      // ¿la respuesta empieza por "z"? -> esta sera la ULTIMA ronda,
      // se corta la cuenta pase lo que pase con el contador de numeros.
      const forceLastRound = /^\s*z/i.test(userText);
      if (forceLastRound) {
        remaining = 0;
      }

      // ¿ha escrito algun numero, aunque vaya mezclado con texto? -> resetea el contador
      // (si ademas empieza por "z", el numero no revive rondas: sigue siendo la ultima)
      const numMatch = userText.match(/\d+/);
      if (numMatch && !forceLastRound) {
        let num = parseInt(numMatch[0], 10);
        if (!isNaN(num)) {
          let capped = false;
          if (num > MAX_ROUNDS_CAP) {
            num = MAX_ROUNDS_CAP;
            capped = true;
          }
          remaining = Math.max(0, num);
          if (num > SLOW_ROUND_THRESHOLD) slowModeEnabled = true;
          await sleep(80);
          await typeLine(
            `[SYSTEM] number detected — intrusion counter reset: ${remaining} more phase(s) ahead` +
              (capped ? ' (capped for safety)' : ''),
            'hkc-amber',
            6
          );
          await sleep(150);
        }
      }

      if (forceLastRound) {
        await sleep(80);
        await typeLine('[SYSTEM] termination signal received — this will be the final phase', 'hkc-red', 6);
        await sleep(150);
      }

      // eco de lo escrito ya quedo en pantalla via askUser; ahora "reacciona"
      await sleep(120);
      await typeLine(`processing input: "${userText.slice(0, 60)}"`, 'hkc-dim', 6);
      await sleep(200);

      // Cada ronda usa una categoria de ataque distinta (ciclica) para variar la animacion.
      // Si el modo lento esta activo, algunas rondas (al azar) se convierten en un
      // "deep hack" mucho mas largo y tenso (15-20s), como en las peliculas.
      const phase = PHASE_TYPES[(round - 1) % PHASE_TYPES.length];
      const isSlowRound = slowModeEnabled && Math.random() < 0.5;

      await typeLine(`>>> PHASE ${round}: ${phase.label}${isSlowRound ? ' [DEEP SCAN]' : ''} <<<`, phase.headerCls, 8);
      await sleep(100);

      if (isSlowRound) {
        await typeLine('WARNING: target system is actively monitoring this connection.', 'hkc-red', 10);
        await sleep(300);
        await typeLine('Running deep exploit chain — do not disconnect...', 'hkc-amber', 10);
        await sleep(300);

        const nLines = 9 + Math.floor(Math.random() * 3); // 9-11 lineas, mas lento
        const lines = randFakeFromCategory(phase, nLines, true).map(([txt, cls]) => [
          txt.replace(/\{\}/g, () => rnd()),
          cls,
        ]);
        for (const [txt, cls] of lines) {
          await typeLine(txt, cls, 22 + Math.random() * 18); // tecleo mucho mas lento
          await sleep(220 + Math.random() * 380);
        }
        await progressBar(`Compiling exploit chain`, { slow: true });
        await typeLine('Verifying payload integrity...', 'hkc-dim', 14);
        await sleep(250);
        await progressBar(`${phase.barLabel}`, { slow: true });
      } else {
        const nLines = 3 + Math.floor(Math.random() * 2); // 3-4 lineas de relleno
        const lines = randFakeFromCategory(phase, nLines, false).map(([txt, cls]) => [
          txt.replace(/\{\}/g, () => rnd()),
          cls,
        ]);
        for (const [txt, cls] of lines) {
          await typeLine(txt, cls, 6 + Math.random() * 8);
          await sleep(80 + Math.random() * 150);
        }
        await progressBar(`${phase.barLabel}`);
      }

      if (remaining <= 0) break;
      await typeLine('Enter another command to keep digging into the system...', 'hkc-dim', 6);
      await sleep(150);
      remaining--;
      round++;
    }

    // --- Leer el estado REAL de desbloqueo (refleja el ultimo open/close
    // que hayas tecleado, dentro o fuera de la consola, durante toda la sesion) ---
    let unlocked = false;
    try {
      unlocked = !!GM_getValue(UNLOCK_KEY, false);
    } catch (e) { /* noop */ }
    localStorage.setItem(UNLOCK_KEY, unlocked ? '1' : '0');

    // --- Final ---
    await sleep(300);
    await typeLine('All security layers have been bypassed.', 'hkc-white', 10);
    await sleep(200);
    await typeLine(`Compiling final access report... (${round} phase(s) executed)`, 'hkc-dim', 8);
    await progressBar('Finalizing');

    const s = screenEl();
    const finalBox = document.createElement('div');
    finalBox.id = 'hkc-final';

    if (unlocked) {
      finalBox.innerHTML = `
        <h1>FULL ACCESS GRANTED</h1>
        <p>Keyword "open" detected &mdash; your scripts on this site are UNLOCKED</p>
        <button id="hkc-close-btn">CLOSE CONSOLE</button>
        <button id="hkc-reload-btn" style="margin-left:10px;">CLOSE &amp; RELOAD</button>
      `;
    } else {
      finalBox.innerHTML = `
        <h1 style="color:#ff5c5c; text-shadow:0 0 8px #ff5c5c, 0 0 24px #ff5c5c;">ACCESS DENIED</h1>
        <p style="color:#ff9a9a;">Keyword "open" not detected (or "close" was typed) &mdash; your scripts on this site are LOCKED</p>
        <button id="hkc-close-btn">CLOSE CONSOLE</button>
        <button id="hkc-reload-btn" style="margin-left:10px;">CLOSE &amp; RELOAD</button>
      `;
    }

    s.appendChild(finalBox);
    scrollDown();
    document.getElementById('hkc-close-btn').addEventListener('click', closeConsole);
    const reloadBtn = document.getElementById('hkc-reload-btn');
    if (reloadBtn) {
      reloadBtn.addEventListener('click', () => {
        closeConsole();
        location.reload();
      });
    }
  }

  function escToClose(e) {
    if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      closeConsole();
    }
  }

  function closeConsole() {
    const overlay = document.getElementById('hkc-overlay');
    if (overlay) overlay.remove();
    document.removeEventListener('keydown', escToClose, true);
    buffer = '';
  }
})();
