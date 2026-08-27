const fs = require('fs');
const path = require('path');
const { icons } = require('./icons');
const { renderIcon } = require('./render');
const { mapTopicToIcon } = require('./topic-map');

const outDir = path.join(__dirname, 'out');
fs.mkdirSync(outDir, { recursive: true });

// Background shapes per icon — unique per glyph, randomized position/rotation.
// Each set: 2–3 flat cream shapes placed behind the glyph at odd angles.
const backgroundSets = {
  chip: [
    { type: 'triangle', cx: 200, cy: 180, size: 260, rotation: 8, opacity: 1 },
    { type: 'circle', cx: 830, cy: 220, r: 160, opacity: 1 },
    { type: 'square', x: 700, y: 650, size: 220, rotation: 6, opacity: 1 },
  ],
  cloud_sync: [
    { type: 'circle', cx: 180, cy: 780, r: 170, opacity: 1 },
    { type: 'square', x: 620, y: 120, size: 200, rotation: -8, opacity: 1 },
    { type: 'triangle', cx: 850, cy: 720, size: 220, rotation: -12, opacity: 1 },
  ],
  robot: [
    { type: 'square', x: 100, y: 100, size: 280, rotation: 12, opacity: 1 },
    { type: 'circle', cx: 820, cy: 750, r: 180, opacity: 1 },
    { type: 'triangle', cx: 750, cy: 150, size: 200, rotation: -20, opacity: 1 },
  ],
  rocket: [
    { type: 'circle', cx: 200, cy: 800, r: 200, opacity: 1 },
    { type: 'triangle', cx: 800, cy: 200, size: 240, rotation: 15, opacity: 1 },
    { type: 'square', x: 700, y: 600, size: 180, rotation: -10, opacity: 1 },
  ],
  brain: [
    { type: 'circle', cx: 150, cy: 200, r: 220, opacity: 1 },
    { type: 'square', x: 680, y: 600, size: 260, rotation: 8, opacity: 1 },
    { type: 'triangle', cx: 820, cy: 180, size: 180, rotation: -15, opacity: 1 },
  ],
  coin: [
    { type: 'triangle', cx: 200, cy: 200, size: 280, rotation: 10, opacity: 1 },
    { type: 'circle', cx: 800, cy: 780, r: 160, opacity: 1 },
    { type: 'square', x: 120, y: 650, size: 200, rotation: -6, opacity: 1 },
  ],
  gavel: [
    { type: 'square', x: 80, y: 120, size: 240, rotation: -12, opacity: 1 },
    { type: 'circle', cx: 820, cy: 200, r: 180, opacity: 1 },
    { type: 'triangle', cx: 200, cy: 780, size: 200, rotation: 20, opacity: 1 },
  ],
  lock: [
    { type: 'circle', cx: 180, cy: 180, r: 200, opacity: 1 },
    { type: 'square', x: 680, y: 620, size: 240, rotation: 14, opacity: 1 },
    { type: 'triangle', cx: 820, cy: 160, size: 180, rotation: -8, opacity: 1 },
  ],
  handshake: [
    { type: 'triangle', cx: 180, cy: 200, size: 260, rotation: -10, opacity: 1 },
    { type: 'circle', cx: 840, cy: 760, r: 180, opacity: 1 },
    { type: 'square', x: 700, y: 100, size: 200, rotation: 8, opacity: 1 },
  ],
  chart: [
    { type: 'square', x: 100, y: 100, size: 280, rotation: 6, opacity: 1 },
    { type: 'circle', cx: 800, cy: 200, r: 160, opacity: 1 },
    { type: 'triangle', cx: 200, cy: 800, size: 220, rotation: -14, opacity: 1 },
  ],
  megaphone: [
    { type: 'circle', cx: 160, cy: 200, r: 220, opacity: 1 },
    { type: 'square', x: 700, y: 600, size: 220, rotation: -10, opacity: 1 },
    { type: 'triangle', cx: 830, cy: 180, size: 180, rotation: 12, opacity: 1 },
  ],
  server: [
    { type: 'triangle', cx: 200, cy: 180, size: 240, rotation: 8, opacity: 1 },
    { type: 'circle', cx: 820, cy: 780, r: 180, opacity: 1 },
    { type: 'square', x: 720, y: 80, size: 200, rotation: -6, opacity: 1 },
  ],
  terminal: [
    { type: 'square', x: 80, y: 80, size: 260, rotation: -8, opacity: 1 },
    { type: 'circle', cx: 820, cy: 800, r: 180, opacity: 1 },
    { type: 'triangle', cx: 800, cy: 160, size: 200, rotation: 16, opacity: 1 },
  ],
  database: [
    { type: 'circle', cx: 180, cy: 200, r: 200, opacity: 1 },
    { type: 'square', x: 700, y: 600, size: 240, rotation: 10, opacity: 1 },
    { type: 'triangle', cx: 200, cy: 800, size: 180, rotation: -12, opacity: 1 },
  ],
  shield: [
    { type: 'triangle', cx: 180, cy: 180, size: 280, rotation: 14, opacity: 1 },
    { type: 'circle', cx: 820, cy: 800, r: 180, opacity: 1 },
    { type: 'square', x: 700, y: 80, size: 200, rotation: -8, opacity: 1 },
  ],
  document: [
    { type: 'square', x: 700, y: 100, size: 260, rotation: 12, opacity: 1 },
    { type: 'circle', cx: 180, cy: 800, r: 180, opacity: 1 },
    { type: 'triangle', cx: 820, cy: 760, size: 200, rotation: -10, opacity: 1 },
  ],
  globe: [
    { type: 'circle', cx: 180, cy: 180, r: 240, opacity: 1 },
    { type: 'triangle', cx: 800, cy: 800, size: 220, rotation: 8, opacity: 1 },
    { type: 'square', x: 700, y: 60, size: 180, rotation: -14, opacity: 1 },
  ],
  phone: [
    { type: 'square', x: 100, y: 100, size: 240, rotation: -10, opacity: 1 },
    { type: 'circle', cx: 820, cy: 800, r: 180, opacity: 1 },
    { type: 'triangle', cx: 180, cy: 800, size: 200, rotation: 16, opacity: 1 },
  ],
  magnifier: [
    { type: 'circle', cx: 180, cy: 200, r: 220, opacity: 1 },
    { type: 'square', x: 700, y: 620, size: 240, rotation: 8, opacity: 1 },
    { type: 'triangle', cx: 820, cy: 180, size: 180, rotation: -12, opacity: 1 },
  ],
  bolt: [
    { type: 'triangle', cx: 200, cy: 180, size: 280, rotation: 10, opacity: 1 },
    { type: 'circle', cx: 800, cy: 800, r: 180, opacity: 1 },
    { type: 'square', x: 680, y: 60, size: 200, rotation: -6, opacity: 1 },
  ],
  hand_swipe: [
    { type: 'square', x: 80, y: 80, size: 260, rotation: 8, opacity: 1 },
    { type: 'circle', cx: 820, cy: 780, r: 200, opacity: 1 },
    { type: 'triangle', cx: 800, cy: 160, size: 180, rotation: -14, opacity: 1 },
  ],
  layers: [
    { type: 'triangle', cx: 180, cy: 180, size: 260, rotation: 12, opacity: 1 },
    { type: 'circle', cx: 840, cy: 800, r: 180, opacity: 1 },
    { type: 'square', x: 720, y: 60, size: 200, rotation: -8, opacity: 1 },
  ],
  container: [
    { type: 'circle', cx: 180, cy: 200, r: 200, opacity: 1 },
    { type: 'square', x: 700, y: 600, size: 240, rotation: 10, opacity: 1 },
    { type: 'triangle', cx: 200, cy: 800, size: 180, rotation: -16, opacity: 1 },
  ],
  api_hub: [
    { type: 'square', x: 80, y: 80, size: 260, rotation: -10, opacity: 1 },
    { type: 'circle', cx: 820, cy: 800, r: 200, opacity: 1 },
    { type: 'triangle', cx: 820, cy: 180, size: 200, rotation: 14, opacity: 1 },
  ],
  chip_ai: [
    { type: 'triangle', cx: 200, cy: 180, size: 240, rotation: 8, opacity: 1 },
    { type: 'square', x: 680, y: 620, size: 220, rotation: -6, opacity: 1 },
    { type: 'circle', cx: 820, cy: 200, r: 160, opacity: 1 },
  ],
  satellite: [
    { type: 'circle', cx: 180, cy: 800, r: 200, opacity: 1 },
    { type: 'triangle', cx: 820, cy: 180, size: 240, rotation: -12, opacity: 1 },
    { type: 'square', x: 700, y: 600, size: 180, rotation: 10, opacity: 1 },
  ],
  warning: [
    { type: 'square', x: 80, y: 80, size: 260, rotation: 8, opacity: 1 },
    { type: 'circle', cx: 820, cy: 800, r: 200, opacity: 1 },
    { type: 'triangle', cx: 800, cy: 180, size: 180, rotation: -10, opacity: 1 },
  ],
  deal: [
    { type: 'circle', cx: 180, cy: 180, r: 220, opacity: 1 },
    { type: 'square', x: 700, y: 620, size: 240, rotation: 12, opacity: 1 },
    { type: 'triangle', cx: 200, cy: 800, size: 200, rotation: -8, opacity: 1 },
  ],
  funding: [
    { type: 'triangle', cx: 200, cy: 180, size: 260, rotation: 10, opacity: 1 },
    { type: 'circle', cx: 820, cy: 780, r: 180, opacity: 1 },
    { type: 'square', x: 120, y: 620, size: 200, rotation: -14, opacity: 1 },
  ],
  justice: [
    { type: 'square', x: 80, y: 80, size: 240, rotation: -10, opacity: 1 },
    { type: 'circle', cx: 820, cy: 200, r: 200, opacity: 1 },
    { type: 'triangle', cx: 180, cy: 800, size: 220, rotation: 16, opacity: 1 },
  ],
};

for (const [name, def] of Object.entries(icons)) {
  const svg = renderIcon(def, backgroundSets[name] || []);
  fs.writeFileSync(path.join(outDir, `${name}.svg`), svg);
  console.log(`wrote out/${name}.svg`);
}

console.log(`\nDone — ${Object.keys(icons).length} icons generated.`);

// ── Newsletter headline → thumbnail mapping ──────────────────────────
// Usage: node generate.js --map-headline "Anthropic Ships Claude Opus 5"
//   or:  node generate.js --map-all <mapping-file>

if (process.argv.includes('--map-headline')) {
  const headline = process.argv[process.argv.indexOf('--map-headline') + 1];
  const iconName = mapTopicToIcon(headline);
  const iconDef = icons[iconName];
  if (!iconDef) { console.error(`Unknown icon: ${iconName}`); process.exit(1); }
  const svg = renderIcon(iconDef, backgroundSets[iconName] || []);
  const outPath = path.join(outDir, `${iconName}-mapped.svg`);
  fs.writeFileSync(outPath, svg);
  console.log(`Headline: "${headline}"`);
  console.log(`Icon:     ${iconName}`);
  console.log(`Written:  ${outPath}`);
}

if (process.argv.includes('--map-all')) {
  const mappingFile = path.join(__dirname, '..', '..', 'thumbs', '_mapping.txt');
  if (!fs.existsSync(mappingFile)) { console.error('No _mapping.txt found'); process.exit(1); }
  const lines = fs.readFileSync(mappingFile, 'utf8').trim().split('\n');
  const results = [];
  for (const line of lines) {
    const parts = line.split('\t');
    if (parts.length < 4) continue;
    const [date, issue, , headline] = parts;
    const iconName = mapTopicToIcon(headline);
    const iconDef = icons[iconName];
    if (!iconDef) continue;
    const svg = renderIcon(iconDef, backgroundSets[iconName] || []);
    const thumbName = `thumb-${date}.svg`;
    fs.writeFileSync(path.join(outDir, thumbName), svg);
    results.push({ date, issue, icon: iconName, headline: headline.slice(0, 60) });
    console.log(`  ${thumbName.padEnd(35)} [${iconName.padEnd(12)}] ${headline.slice(0, 55)}`);
  }
  console.log(`\nMapped ${results.length} thumbnails.`);
}
