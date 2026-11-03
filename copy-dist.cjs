const fs = require('fs');
const path = require('path');

const distDir = path.resolve(__dirname, 'dist');
const publicDir = path.resolve(__dirname, 'public');

[distDir, publicDir].forEach(d => fs.mkdirSync(d, { recursive: true }));

const srcDir = path.resolve(__dirname, '.vercel/output/static');
const altSrc = path.resolve(__dirname, '.output/public');

if (fs.existsSync(srcDir)) {
  fs.cpSync(srcDir, distDir, { recursive: true });
  fs.cpSync(srcDir, publicDir, { recursive: true });
} else if (fs.existsSync(altSrc)) {
  fs.cpSync(altSrc, distDir, { recursive: true });
  fs.cpSync(altSrc, publicDir, { recursive: true });
}

const htmlSrc = path.resolve(__dirname, 'index.html');
if (fs.existsSync(htmlSrc)) {
  if (!fs.existsSync(path.join(distDir, 'index.html'))) {
    fs.copyFileSync(htmlSrc, path.join(distDir, 'index.html'));
  }
  if (!fs.existsSync(path.join(publicDir, 'index.html'))) {
    fs.copyFileSync(htmlSrc, path.join(publicDir, 'index.html'));
  }
}

console.log('[frontend-dist] dist and public directories populated successfully.');
