const { getStroke } = require('perfect-freehand');
const { getSvgPathFromStroke } = require('./svgPath');

const INK = '#141414';
const PAPER_SHAPE = '#F6F3EC'; // flat cream background shapes
const CANVAS = 1000;

// Tunable "brush" -- this is what gives the thick, tapered, hand-inked look.
const STROKE_OPTIONS = {
  size: 34,
  thinning: 0.55,
  smoothing: 0.65,
  streamline: 0.55,
  easing: (t) => t,
  start: { taper: 0, cap: true },
  end: { taper: 0, cap: true },
};

function strokeToPath(points) {
  const outline = getStroke(points, STROKE_OPTIONS);
  return getSvgPathFromStroke(outline);
}

// Background shapes: flat, muted, geometric, placed behind the glyph and
// partially cropped by the canvas edge -- never centered, never symmetric.
function backgroundShapesSvg(shapes) {
  return shapes
    .map((s) => {
      const opacity = s.opacity ?? 1;
      if (s.type === 'circle') {
        return `<circle cx="${s.cx}" cy="${s.cy}" r="${s.r}" fill="${PAPER_SHAPE}" opacity="${opacity}"/>`;
      }
      if (s.type === 'square') {
        return `<rect x="${s.x}" y="${s.y}" width="${s.size}" height="${s.size}" fill="${PAPER_SHAPE}" opacity="${opacity}" transform="rotate(${s.rotation || 0} ${s.x + s.size / 2} ${s.y + s.size / 2})"/>`;
      }
      if (s.type === 'triangle') {
        const { cx, cy, size, rotation = 0 } = s;
        const pts = [
          [cx, cy - size / 2],
          [cx + size / 2, cy + size / 2],
          [cx - size / 2, cy + size / 2],
        ]
          .map((p) => p.join(','))
          .join(' ');
        return `<polygon points="${pts}" fill="${PAPER_SHAPE}" opacity="${opacity}" transform="rotate(${rotation} ${cx} ${cy})"/>`;
      }
      return '';
    })
    .join('\n  ');
}

function renderIcon(iconDef, backgroundShapes = []) {
  const strokePaths = iconDef.strokes
    .map((pts) => `<path d="${strokeToPath(pts)}" fill="${INK}"/>`)
    .join('\n  ');

  const dots = (iconDef.dots || [])
    .map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${INK}"/>`)
    .join('\n  ');

  return `<svg viewBox="0 0 ${CANVAS} ${CANVAS}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${CANVAS}" height="${CANVAS}" fill="#FFFFFF"/>
  ${backgroundShapesSvg(backgroundShapes)}
  ${strokePaths}
  ${dots}
</svg>`;
}

module.exports = { renderIcon };
