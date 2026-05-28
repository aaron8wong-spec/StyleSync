// Cozy data — basic color names + warm-toned swatches
window.SS_GENRES = [
  { key: 'casual',          label: 'Casual',       emoji: '☁', desc: 'Soft & weekendy' },
  { key: 'business_casual', label: 'Professional', emoji: '✦', desc: 'Polished but easy' },
  { key: 'minimal',         label: 'Minimal',      emoji: '◌', desc: 'Pared back' },
  { key: 'athletic',        label: 'Athletic',     emoji: '↗', desc: 'Built to move' },
  { key: 'punk',            label: 'Edgy',         emoji: '✺', desc: 'A little louder' },
  { key: 'cottage',         label: 'Cottagecore',  emoji: '✿', desc: 'Linen + tea' },
];

const sw = {
  black:  '#2A2620',
  white:  '#F0E8D9',
  cream:  '#E5DAC0',
  gray:   '#B5B0A5',
  brown:  '#7B5A3F',
  tan:    '#D6C7A6',
  red:    '#B85547',
  orange: '#C97B5C',
  yellow: '#E8CE85',
  green:  '#7C9079',
  blue:   '#5A7CA8',
  pink:   '#D89AA0',
  purple: '#9479A0',
};
window.SS_SWATCH = sw;

// Closet starts empty — users add their own pieces.
window.SS_SEED_WARDROBE = [];

// No pre-built looks — users build their own.
window.SS_SEED_OUTFITS = [];

window.SS_INCOMING = {
  id: 'new1', cat: 'top', label: 'Pointelle tee', color: 'yellow', swatch: sw.yellow, pattern: 'rib', tags: ['cottage','minimal'],
  // structured model outputs (Models B + C)
  occasion: 'casual', occasionConfidence: 0.88,
  patternFamily: 'solid', materialFamily: 'knit', sleeveFamily: 'short_sleeve',
};
