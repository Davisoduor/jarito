// Rasterises the crescent mark into the PNG sizes phones and the manifest need.
import sharp from 'sharp';

const mark = (pad) => Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" ${pad ? '' : 'rx="15"'} fill="#12465A"/>
  <g transform="translate(32 32) scale(${pad ? 0.72 : 1}) translate(-32 -32)">
    <circle cx="31" cy="33" r="16" fill="#E2A42B"/><circle cx="38" cy="27" r="12.5" fill="#12465A"/>
  </g></svg>`);

await sharp(mark(false)).resize(192).png().toFile('public/icons/icon-192.png');
await sharp(mark(false)).resize(512).png().toFile('public/icons/icon-512.png');
await sharp(mark(true)).resize(512).png().toFile('public/icons/maskable-512.png');
await sharp(mark(true)).resize(180).png().toFile('public/icons/apple-touch-icon.png');

// Link preview image for texts and socials.
const og = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="#EEF2EA"/>
  <g transform="translate(96 110)"><rect width="120" height="120" rx="28" fill="#12465A"/>
  <circle cx="58" cy="62" r="30" fill="#E2A42B"/><circle cx="71" cy="51" r="23.5" fill="#12465A"/></g>
  <text x="96" y="370" font-family="Helvetica, Arial, sans-serif" font-size="92" font-weight="800" fill="#12303B" letter-spacing="-3">Keeps watch over</text>
  <text x="96" y="470" font-family="Helvetica, Arial, sans-serif" font-size="92" font-weight="800" fill="#12303B" letter-spacing="-3">your course deadlines.</text>
  <text x="96" y="545" font-family="Helvetica, Arial, sans-serif" font-size="34" fill="#4E6166">Canvas and Brightspace · free, no account</text>
</svg>`);
await sharp(og).png().toFile('public/og.png');
console.log('icons written');
