/* Dessin d'un QR code dans un canvas, partagé par les outils qui en affichent (CodeName, Père Noël secret).
   À charger après commun/vendor/qrcode.js et commun/commun.js. */
(() => {
'use strict';

const QUIET_ZONE_MODULES = 4;   // marge blanche réglementaire autour du code, nécessaire à la lecture

/** Dessine le QR code d'un texte (une URL) : net sur écran haute densité, couleurs --qr-fg / --qr-bg. */
function drawQr(canvas, text, cssSize) {
  const qr = window.qrcode(0, 'M');
  qr.addData(text);
  qr.make();
  const modules = qr.getModuleCount() + QUIET_ZONE_MODULES * 2;
  const dpr = Math.min(window.devicePixelRatio || 1, 3);
  const cell = Math.max(1, Math.floor(cssSize * dpr / modules));
  const px = cell * modules;
  canvas.width = canvas.height = px;
  canvas.style.width = canvas.style.height = (px / dpr) + 'px';
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = BoardBox.cssVar('--qr-bg');
  ctx.fillRect(0, 0, px, px);
  ctx.fillStyle = BoardBox.cssVar('--qr-fg');
  for (let r = 0; r < qr.getModuleCount(); r++) {
    for (let c = 0; c < qr.getModuleCount(); c++) {
      if (qr.isDark(r, c)) ctx.fillRect((c + QUIET_ZONE_MODULES) * cell, (r + QUIET_ZONE_MODULES) * cell, cell, cell);
    }
  }
}

BoardBox.drawQr = drawQr;
})();
