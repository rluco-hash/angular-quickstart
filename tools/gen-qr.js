/* Genera los QR de src/assets/qr como SVG estaticos: sin dependencia en runtime
   ni llamadas a un servicio externo de imagenes.

     node tools/gen-qr.js

   Las URLs NO se repiten aca: se leen de `socials` en app.component.ts, que es
   la fuente unica. Cambiar una URL alli y volver a correr esto alcanza.

   El encoder viene de qrcode-terminal, que ya esta en node_modules como
   dependencia transitiva; si desaparece: npm i -D qrcode-terminal */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const QRCode = require(path.join(root, 'node_modules/qrcode-terminal/vendor/QRCode'));
const QRErrorCorrectLevel = require(path.join(root, 'node_modules/qrcode-terminal/vendor/QRCode/QRErrorCorrectLevel'));

/** Pares url + archivo de QR tal como estan declarados en el componente. */
function targetsFromComponent() {
  const file = path.join(root, 'src/app/app.component.ts');
  const source = fs.readFileSync(file, 'utf8');
  const entry = /url:\s*'([^']+)',\s*\n\s*qr:\s*'assets\/qr\/([^']+)'/g;
  const found = [];

  for (const [, url, name] of source.matchAll(entry)) {
    found.push({ file: name, url });
  }

  if (!found.length) {
    throw new Error(`No encontre pares url/qr en ${file}`);
  }

  return found;
}

const targets = targetsFromComponent();

const QUIET = 2; // modulos de margen (el estandar pide 4, 2 basta en pantalla)

function svgFor(text) {
  const qr = new QRCode(-1, QRErrorCorrectLevel.M);
  qr.addData(text);
  qr.make();

  const count = qr.getModuleCount();
  const size = count + QUIET * 2;
  const parts = [];

  for (let row = 0; row < count; row++) {
    let col = 0;
    while (col < count) {
      if (!qr.isDark(row, col)) {
        col++;
        continue;
      }
      // Se agrupan modulos negros contiguos en un solo rect: menos nodos.
      let run = 1;
      while (col + run < count && qr.isDark(row, col + run)) run++;
      parts.push(
        `<rect x="${col + QUIET}" y="${row + QUIET}" width="${run}" height="1"/>`,
      );
      col += run;
    }
  }

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" ` +
    `shape-rendering="crispEdges" role="img">` +
    `<rect width="${size}" height="${size}" fill="#ffffff"/>` +
    `<g fill="#133660">${parts.join('')}</g>` +
    `</svg>\n`
  );
}

const outDir = path.join(root, 'src/assets/qr');
fs.mkdirSync(outDir, { recursive: true });

for (const { file, url } of targets) {
  fs.writeFileSync(path.join(outDir, file), svgFor(url));
  console.log('ok', file, '->', url);
}
