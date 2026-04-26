/* Copies the static site into dist/ for Vercel (Framework: Other, Output: dist). */
const fs = require('fs');
const path = require('path');

const root = process.cwd();
const out = path.join(root, 'dist');

function rmrf(p) {
  if (fs.existsSync(p)) fs.rmSync(p, { recursive: true, force: true });
}

function copyFile(from, to) {
  fs.mkdirSync(path.dirname(to), { recursive: true });
  fs.copyFileSync(from, to);
}

function copyDir(src, dest) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  for (const name of fs.readdirSync(src)) {
    if (name === '.git' || name === 'dist' || name === 'node_modules') continue;
    const s = path.join(src, name);
    const d = path.join(dest, name);
    if (fs.statSync(s).isDirectory()) copyDir(s, d);
    else copyDirSingle(s, d);
  }
}
function copyDirSingle(from, to) {
  fs.mkdirSync(path.dirname(to), { recursive: true });
  fs.copyFileSync(from, to);
}

rmrf(out);
fs.mkdirSync(out, { recursive: true });

const rootFiles = ['index.html', 'app.js', 'config.js', 'style.css', 'admin.html'];
for (const f of rootFiles) {
  const p = path.join(root, f);
  if (fs.existsSync(p)) copyFile(p, path.join(out, f));
}

const publicDir = path.join(root, 'public');
if (fs.existsSync(publicDir)) copyDir(publicDir, path.join(out, 'public'));

console.log('Static build: files copied to dist/');
