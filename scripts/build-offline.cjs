const fs = require('fs');
const path = require('path');

const distHtmlPath = path.join(__dirname, '..', 'dist', 'index.html');
const offlineHtmlPath = path.join(__dirname, '..', 'B2B_Demo_Offline.html');

if (!fs.existsSync(distHtmlPath)) {
  console.error('dist/index.html not found. Please run "npm run build" first.');
  process.exit(1);
}

let html = fs.readFileSync(distHtmlPath, 'utf8');

// Strip module attributes to improve file:// compatibility.
html = html.replace(/<script[^>]*type="module"[^>]*>/g, '<script defer>');

// Remove the Vite modulepreload polyfill because it depends on fetch().
html = html.replace(/\bconst M=document\.createElement\("link"\)\.relList;.*?\)\(\);/g, '');

fs.writeFileSync(offlineHtmlPath, html);
console.log(`Successfully generated ${path.basename(offlineHtmlPath)}`);
