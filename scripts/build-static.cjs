/* Build static output for both:
   1) dist/ (for local/manual deploys and Vercel Output Directory mode)
   2) /vercel/output/static (for Vercel Build Output API mode) */
const fs = require('fs');
const path = require('path');

const root = process.cwd();
const out = path.join(root, 'dist');
const vercelOutStatic = '/vercel/output/static';
const vercelOutConfig = '/vercel/output/config.json';

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

const rootFiles = ['index.html', 'app.js', 'config.js', 'style.css', 'admin.html'];
const publicDir = path.join(root, 'public');

function buildTo(targetDir) {
  rmrf(targetDir);
  fs.mkdirSync(targetDir, { recursive: true });
  for (const f of rootFiles) {
    const p = path.join(root, f);
    if (fs.existsSync(p)) copyFile(p, path.join(targetDir, f));
  }
  if (fs.existsSync(publicDir)) copyDir(publicDir, path.join(targetDir, 'public'));
  const hasIndex = fs.existsSync(path.join(targetDir, 'index.html'));
  if (!hasIndex) {
    throw new Error(`Build output missing index.html in ${targetDir}. Check Vercel root directory setting.`);
  }
}

buildTo(out);
console.log('Static build: files copied to dist/');

// If Vercel uses Build Output API, also place files in /vercel/output/static.
try {
  if (process.env.VERCEL || fs.existsSync('/vercel/output')) {
    buildTo(vercelOutStatic);
    const config = {
      version: 3,
      routes: [
        { src: '/admin/?', dest: '/admin.html' },
      ],
    };
    fs.mkdirSync(path.dirname(vercelOutConfig), { recursive: true });
    fs.writeFileSync(vercelOutConfig, JSON.stringify(config, null, 2));
    console.log('Static build: files copied to /vercel/output/static with admin route config.');
  }
} catch (err) {
  console.warn('Warning: could not write Build Output API artifacts:', err.message);
}
