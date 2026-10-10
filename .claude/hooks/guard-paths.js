#!/usr/bin/env node
// guard-paths.js — bloquea escrituras fuera de la zona del agente.
// Uso: node guard-paths.js <carpeta/> <archivo> ...
const path = require('path');

const block = (msg) => {
    console.error(`Bloqueado: ${msg}`);
    process.exit(2); // exit 2 = Claude Code cancela la acción y le muestra este mensaje al agente
};

let raw = '';
process.stdin.on('data', (c) => (raw += c));
process.stdin.on('end', () => {
    let input;
    try { input = JSON.parse(raw); } catch { block('no se pudo leer la entrada del hook.'); }

    const target = input.tool_input?.file_path || input.tool_input?.notebook_path;
    if (!target) process.exit(0);

    const root = process.env.CLAUDE_PROJECT_DIR || input.cwd || process.cwd();
    const rel = path.relative(root, path.resolve(root, target)).split(path.sep).join('/');
    const allowed = process.argv.slice(2);
    const inside = rel && !rel.startsWith('..') && !path.isAbsolute(rel);
    const ok = inside && allowed.some((p) => (p.endsWith('/') ? rel.startsWith(p) : rel === p));

    if (!ok) {
        block(`"${rel}" está fuera de tu zona (${allowed.join(', ')}). ` +
            'Si necesitas ese cambio, crea un CR en .agents/changes/ dirigido al agente dueño.');
    }
});