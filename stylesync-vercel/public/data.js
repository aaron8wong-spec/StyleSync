// Cozy data — basic color names + warm-toned swatches.
// Single styling axis: OCCASION (casual / formal / sports), backed by the
// structured model attributes the recommender scores on.

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

// Closet preloaded with the user's real pieces. Each item carries the structured
// model fields (occasion / pattern / material / sleeve) the V1 engine scores on.
const _seedBase = 1781000000000;
window.SS_SEED_WARDROBE = [
  // ── Tops ──
  {
    id: 'w_ucsd_tee', label: 'UC San Diego Shirt', cat: 'top',
    color: 'blue', swatch: sw.blue, pattern: 'graphic', fabric: 'cotton',
    image: 'wardrobe/uc-san-diego-shirt.png', confidence: 0.94,
    occasion: 'casual', occasionConfidence: 0.9,
    patternFamily: 'graphic', materialFamily: 'knit', sleeveFamily: 'short_sleeve',
    createdAt: _seedBase - 1,
  },
  {
    id: 'w_blue_tee', label: 'Blue T-Shirt', cat: 'top',
    color: 'blue', swatch: sw.blue, pattern: 'solid', fabric: 'cotton',
    image: 'wardrobe/blue-t-shirt.png', confidence: 0.95,
    occasion: 'casual', occasionConfidence: 0.88,
    patternFamily: 'solid', materialFamily: 'knit', sleeveFamily: 'short_sleeve',
    createdAt: _seedBase - 2,
  },
  {
    id: 'w_blue_sweater', label: 'Light Blue Sweater', cat: 'top',
    color: 'blue', swatch: sw.blue, pattern: 'rib', fabric: 'knit',
    image: 'wardrobe/light-blue-sweater.png', confidence: 0.92,
    occasion: 'casual', occasionConfidence: 0.85,
    patternFamily: 'solid', materialFamily: 'knit', sleeveFamily: 'long_sleeve',
    createdAt: _seedBase - 3,
  },
  {
    id: 'w_black_ls', label: 'Black Long Sleeve Shirt', cat: 'top',
    color: 'black', swatch: sw.black, pattern: 'rib', fabric: 'knit',
    image: 'wardrobe/black-long-sleeve-shirt.png', confidence: 0.93,
    occasion: 'casual', occasionConfidence: 0.82,
    patternFamily: 'solid', materialFamily: 'knit', sleeveFamily: 'long_sleeve',
    createdAt: _seedBase - 4,
  },
  {
    id: 'w_golf_tee', label: 'Golf Club Tee', cat: 'top',
    color: 'green', swatch: sw.green, pattern: 'graphic', fabric: 'cotton',
    image: 'wardrobe/shopping.jpg', confidence: 0.92,
    occasion: 'casual', occasionConfidence: 0.87,
    patternFamily: 'graphic', materialFamily: 'knit', sleeveFamily: 'short_sleeve',
    createdAt: _seedBase + 1,
  },
  {
    id: 'w_graphic_tee', label: 'Washed Graphic Tee', cat: 'top',
    color: 'black', swatch: sw.black, pattern: 'graphic', fabric: 'cotton',
    image: 'wardrobe/graphic_tee.webp', confidence: 0.91,
    occasion: 'casual', occasionConfidence: 0.86,
    patternFamily: 'graphic', materialFamily: 'knit', sleeveFamily: 'short_sleeve',
    createdAt: _seedBase + 2,
  },
  {
    id: 'w_blue_oxford', label: 'Blue Oxford Shirt', cat: 'top',
    color: 'blue', swatch: sw.blue, pattern: 'solid', fabric: 'cotton',
    image: 'wardrobe/button_up_blue.webp', confidence: 0.93,
    occasion: 'formal', occasionConfidence: 0.84,
    patternFamily: 'solid', materialFamily: 'other', sleeveFamily: 'long_sleeve',
    createdAt: _seedBase + 3,
  },
  {
    id: 'w_flannel', label: 'Plaid Flannel', cat: 'top',
    color: 'brown', swatch: sw.brown, pattern: 'plaid', fabric: 'flannel',
    image: 'wardrobe/summer_flannel.jpg', confidence: 0.9,
    occasion: 'casual', occasionConfidence: 0.83,
    patternFamily: 'solid', materialFamily: 'other', sleeveFamily: 'long_sleeve',
    createdAt: _seedBase + 4,
  },
  {
    id: 'w_wool_tee', label: 'Olive Merino Tee', cat: 'top',
    color: 'green', swatch: sw.green, pattern: 'solid', fabric: 'wool',
    image: 'wardrobe/wool-shirt.jpg', confidence: 0.9,
    occasion: 'casual', occasionConfidence: 0.82,
    patternFamily: 'solid', materialFamily: 'knit', sleeveFamily: 'short_sleeve',
    createdAt: _seedBase + 5,
  },
  {
    id: 'w_layered_ls', label: 'Layered Long Sleeve', cat: 'top',
    color: 'green', swatch: sw.green, pattern: 'solid', fabric: 'cotton',
    image: 'wardrobe/longsleeve.jpg', confidence: 0.89,
    occasion: 'casual', occasionConfidence: 0.81,
    patternFamily: 'solid', materialFamily: 'knit', sleeveFamily: 'long_sleeve',
    createdAt: _seedBase + 6,
  },
  {
    id: 'w_taupe_ls', label: 'Taupe Long Sleeve', cat: 'top',
    color: 'tan', swatch: sw.tan, pattern: 'solid', fabric: 'cotton',
    image: 'wardrobe/longsleeve_brown.jpg', confidence: 0.9,
    occasion: 'casual', occasionConfidence: 0.83,
    patternFamily: 'solid', materialFamily: 'knit', sleeveFamily: 'long_sleeve',
    createdAt: _seedBase + 7,
  },

  // ── Bottoms ──
  {
    id: 'w_blue_jeans', label: 'Blue Jeans', cat: 'bottom',
    color: 'blue', swatch: sw.blue, pattern: 'denim', fabric: 'denim',
    image: 'wardrobe/blue-jeans.png', confidence: 0.96,
    occasion: 'casual', occasionConfidence: 0.9,
    patternFamily: 'solid', materialFamily: 'denim', sleeveFamily: null,
    createdAt: _seedBase - 6,
  },
  {
    id: 'w_cargo_pants', label: 'Brown Cargo Pants', cat: 'bottom',
    color: 'tan', swatch: sw.tan, pattern: 'pocket', fabric: 'cotton twill',
    image: 'wardrobe/brown-cargo-pants.png', confidence: 0.91,
    occasion: 'casual', occasionConfidence: 0.84,
    patternFamily: 'solid', materialFamily: 'other', sleeveFamily: null,
    createdAt: _seedBase - 7,
  },
  {
    id: 'w_green_shorts', label: 'Green Shorts', cat: 'bottom',
    color: 'green', swatch: sw.green, pattern: 'pocket', fabric: 'nylon',
    image: 'wardrobe/green-shorts.jpg', confidence: 0.9,
    occasion: 'sports', occasionConfidence: 0.85,
    patternFamily: 'solid', materialFamily: 'other', sleeveFamily: null,
    createdAt: _seedBase - 8,
  },
  {
    id: 'w_denim_shorts', label: 'Denim Shorts', cat: 'bottom',
    color: 'blue', swatch: sw.blue, pattern: 'denim', fabric: 'denim',
    image: 'wardrobe/denim-shorts.png', confidence: 0.92,
    occasion: 'casual', occasionConfidence: 0.85,
    patternFamily: 'solid', materialFamily: 'denim', sleeveFamily: null,
    createdAt: _seedBase - 15,
  },
  {
    id: 'w_light_jeans', label: 'Light Wash Jeans', cat: 'bottom',
    color: 'blue', swatch: sw.blue, pattern: 'denim', fabric: 'denim',
    image: 'wardrobe/jeans_blue.png', confidence: 0.95,
    occasion: 'casual', occasionConfidence: 0.89,
    patternFamily: 'solid', materialFamily: 'denim', sleeveFamily: null,
    createdAt: _seedBase + 8,
  },
  {
    id: 'w_black_jeans', label: 'Black Jeans', cat: 'bottom',
    color: 'black', swatch: sw.black, pattern: 'denim', fabric: 'denim',
    image: 'wardrobe/jeans_black.webp', confidence: 0.94,
    occasion: 'casual', occasionConfidence: 0.87,
    patternFamily: 'solid', materialFamily: 'denim', sleeveFamily: null,
    createdAt: _seedBase + 9,
  },
  {
    id: 'w_grey_pants', label: 'Grey Dress Pants', cat: 'bottom',
    color: 'gray', swatch: sw.gray, pattern: 'solid', fabric: 'wool',
    image: 'wardrobe/dress_pants_grey.webp', confidence: 0.93,
    occasion: 'formal', occasionConfidence: 0.88,
    patternFamily: 'solid', materialFamily: 'other', sleeveFamily: null,
    createdAt: _seedBase + 10,
  },
  {
    id: 'w_brown_trousers', label: 'Brown Dress Trousers', cat: 'bottom',
    color: 'brown', swatch: sw.brown, pattern: 'solid', fabric: 'wool',
    image: 'wardrobe/pants_brown.webp', confidence: 0.92,
    occasion: 'formal', occasionConfidence: 0.86,
    patternFamily: 'solid', materialFamily: 'other', sleeveFamily: null,
    createdAt: _seedBase + 11,
  },

  // ── Outerwear ──
  {
    id: 'w_brown_jacket', label: 'Light Brown Jacket', cat: 'outerwear',
    color: 'tan', swatch: sw.tan, pattern: 'pocket', fabric: 'canvas',
    image: 'wardrobe/light-brown-jacket.png', confidence: 0.9,
    occasion: 'casual', occasionConfidence: 0.83,
    patternFamily: 'solid', materialFamily: 'other', sleeveFamily: 'long_sleeve',
    createdAt: _seedBase - 9,
  },
  {
    id: 'w_grey_blazer', label: 'Grey Blazer', cat: 'outerwear',
    color: 'gray', swatch: sw.gray, pattern: 'pocket', fabric: 'wool',
    image: 'wardrobe/grey-blazer.png', confidence: 0.92,
    occasion: 'formal', occasionConfidence: 0.88,
    patternFamily: 'solid', materialFamily: 'other', sleeveFamily: 'long_sleeve',
    createdAt: _seedBase - 11,
  },
  {
    id: 'w_track_jacket', label: 'Navy Track Jacket', cat: 'outerwear',
    color: 'blue', swatch: sw.blue, pattern: 'colorblock', fabric: 'nylon',
    image: 'wardrobe/blue-jacket.jpg', confidence: 0.91,
    occasion: 'sports', occasionConfidence: 0.84,
    patternFamily: 'solid', materialFamily: 'other', sleeveFamily: 'long_sleeve',
    createdAt: _seedBase + 12,
  },
  {
    id: 'w_camel_coat', label: 'Camel Overcoat', cat: 'outerwear',
    color: 'tan', swatch: sw.tan, pattern: 'solid', fabric: 'wool',
    image: 'wardrobe/grey_coat.jpg', confidence: 0.93,
    occasion: 'formal', occasionConfidence: 0.87,
    patternFamily: 'solid', materialFamily: 'other', sleeveFamily: 'long_sleeve',
    createdAt: _seedBase + 13,
  },
  {
    id: 'w_leather_jacket', label: 'Leather Jacket', cat: 'outerwear',
    color: 'black', swatch: sw.black, pattern: 'solid', fabric: 'leather',
    image: 'wardrobe/leather_jacket.png', confidence: 0.94,
    occasion: 'casual', occasionConfidence: 0.85,
    patternFamily: 'solid', materialFamily: 'leather', sleeveFamily: 'long_sleeve',
    createdAt: _seedBase + 14,
  },
  {
    id: 'w_zip_hoodie', label: 'Cream Zip Hoodie', cat: 'outerwear',
    color: 'cream', swatch: sw.cream, pattern: 'solid', fabric: 'fleece',
    image: 'wardrobe/white-zipup.jpg', confidence: 0.9,
    occasion: 'casual', occasionConfidence: 0.82,
    patternFamily: 'solid', materialFamily: 'knit', sleeveFamily: 'long_sleeve',
    createdAt: _seedBase + 15,
  },

  // ── Shoes ──
  {
    id: 'w_white_shoes', label: 'White Shoes', cat: 'shoes',
    color: 'white', swatch: sw.white, pattern: 'lace', fabric: 'suede',
    image: 'wardrobe/white-shoes.png', confidence: 0.94,
    occasion: 'casual', occasionConfidence: 0.86,
    patternFamily: 'solid', materialFamily: 'leather', sleeveFamily: null,
    createdAt: _seedBase - 12,
  },
  {
    id: 'w_birkenstocks', label: 'Brown Birkenstocks', cat: 'shoes',
    color: 'brown', swatch: sw.brown, pattern: 'sole', fabric: 'leather',
    image: 'wardrobe/brown-birkenstocks.jpg', confidence: 0.9,
    occasion: 'casual', occasionConfidence: 0.82,
    patternFamily: 'solid', materialFamily: 'leather', sleeveFamily: null,
    createdAt: _seedBase - 13,
  },
  {
    id: 'w_black_shoes', label: 'Black Shoes', cat: 'shoes',
    color: 'black', swatch: sw.black, pattern: 'lace', fabric: 'leather',
    image: 'wardrobe/black-shoes.jpg', confidence: 0.91,
    occasion: 'formal', occasionConfidence: 0.8,
    patternFamily: 'solid', materialFamily: 'leather', sleeveFamily: null,
    createdAt: _seedBase - 14,
  },
  {
    id: 'w_sambas', label: 'Adidas Sambas', cat: 'shoes',
    color: 'black', swatch: sw.black, pattern: 'stripe', fabric: 'leather',
    image: 'wardrobe/sambas.png', confidence: 0.95,
    occasion: 'casual', occasionConfidence: 0.88,
    patternFamily: 'solid', materialFamily: 'leather', sleeveFamily: null,
    createdAt: _seedBase + 16,
  },
  {
    id: 'w_nb_sneakers', label: 'Grey Sneakers', cat: 'shoes',
    color: 'gray', swatch: sw.gray, pattern: 'lace', fabric: 'leather',
    image: 'wardrobe/sneakers.webp', confidence: 0.93,
    occasion: 'casual', occasionConfidence: 0.85,
    patternFamily: 'solid', materialFamily: 'leather', sleeveFamily: null,
    createdAt: _seedBase + 17,
  },
];

// No pre-built looks — users build their own.
window.SS_SEED_OUTFITS = [];

window.SS_INCOMING = {
  id: 'new1', cat: 'top', label: 'Pointelle tee', color: 'yellow', swatch: sw.yellow, pattern: 'rib',
  // structured model outputs (Models B + C)
  occasion: 'casual', occasionConfidence: 0.88,
  patternFamily: 'solid', materialFamily: 'knit', sleeveFamily: 'short_sleeve',
};
