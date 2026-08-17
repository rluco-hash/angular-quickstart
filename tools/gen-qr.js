/* Genera los QR de src/assets/qr como SVG estaticos: sin dependencia en runtime
   ni llamadas a un servicio externo de imagenes.
   Se corre a mano SOLO si cambia alguna de las URLs de abajo (y hay que
   mantenerlas iguales a las de `socials` en app.component.ts):

     node tools/gen-qr.js

   El encoder viene de qrcode-terminal, que ya esta en node_modules como
   dependencia transitiva; si desaparece: npm i -D qrcode-terminal */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const QRCode = require(path.join(root, 'node_modules/qrcode-terminal/vendor/QRCode'));
const QRErrorCorrectLevel = require(path.join(root, 'node_modules/qrcode-terminal/vendor/QRCode/QRErrorCorrectLevel'));

const targets = [
  { file: 'qr-comparador.svg', url: 'https://www.queplan.cl' },
  { file: 'qr-instagram.svg', url: 'https://www.instagram.com/queplan.cl' },
  { file: 'qr-linkedin.svg', url: 'https://www.linkedin.com/company/queplan' },
];

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
