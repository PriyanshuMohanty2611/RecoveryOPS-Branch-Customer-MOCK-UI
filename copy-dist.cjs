const fs = require('fs');
const path = require('path');

const srcDir = path.resolve(__dirname, '.vercel/output/static');
const distDir = path.resolve(__dirname, 'dist');

if (fs.existsSync(srcDir)) {
  fs.mkdirSync(distDir, { recursive: true });
  fs.cpSync(srcDir, distDir, { recursive: true });
} else {
  const altSrc = path.resolve(__dirname, '.output/public');
  if (fs.existsSync(altSrc)) {
    fs.mkdirSync(distDir, { recursive: true });
    fs.cpSync(altSrc, distDir, { recursive: true });
  }
}

if (!fs.existsSync(path.join(distDir, 'index.html')) && fs.existsSync(path.resolve(__dirname, 'index.html'))) {
  fs.copyFileSync(path.resolve(__dirname, 'index.html'), path.join(distDir, 'index.html'));
}
console.log('[frontend-dist] dist directory populated successfully.');

