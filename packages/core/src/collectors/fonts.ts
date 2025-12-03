import type { FontsData } from '@anti-detect/types';

// Common fonts to test
const FONTS_TO_TEST = [
  // Windows
  'Arial',
  'Arial Black',
  'Calibri',
  'Cambria',
  'Comic Sans MS',
  'Consolas',
  'Courier New',
  'Georgia',
  'Impact',
  'Lucida Console',
  'Segoe UI',
  'Tahoma',
  'Times New Roman',
  'Trebuchet MS',
  'Verdana',

  // macOS
  'American Typewriter',
  'Andale Mono',
  'Apple Braille',
  'Apple Chancery',
  'Apple Color Emoji',
  'Apple SD Gothic Neo',
  'Apple Symbols',
  'AppleGothic',
  'AppleMyungjo',
  'Avenir',
  'Avenir Next',
  'Baskerville',
  'Big Caslon',
  'Brush Script MT',
  'Chalkboard',
  'Chalkboard SE',
  'Chalkduster',
  'Charter',
  'Cochin',
  'Copperplate',
  'Courier',
  'DIN Alternate',
  'DIN Condensed',
  'Didot',
  'Futura',
  'Geneva',
  'Gill Sans',
  'Helvetica',
  'Helvetica Neue',
  'Herculanum',
  'Hoefler Text',
  'Marker Felt',
  'Menlo',
  'Monaco',
  'Noteworthy',
  'Optima',
  'Palatino',
  'Papyrus',
  'Phosphate',
  'Rockwell',
  'San Francisco',
  'Savoye LET',
  'SignPainter',
  'Skia',
  'Snell Roundhand',
  'Times',
  'Zapfino',

  // Linux
  'DejaVu Sans',
  'DejaVu Sans Mono',
  'DejaVu Serif',
  'Droid Sans',
  'Droid Sans Mono',
  'Droid Serif',
  'FreeMono',
  'FreeSans',
  'FreeSerif',
  'Liberation Mono',
  'Liberation Sans',
  'Liberation Serif',
  'Noto Sans',
  'Noto Serif',
  'Ubuntu',
  'Ubuntu Mono',

  // Cross-platform
  'Roboto',
  'Open Sans',
  'Lato',
  'Montserrat',
  'Source Sans Pro',
  'Source Code Pro',
  'Fira Sans',
  'Fira Code',
  'JetBrains Mono',
  'Noto Color Emoji',
];

export async function collectFonts(): Promise<FontsData> {
  const detected: string[] = [];

  // Create test element
  const testString = 'mmmmmmmmmmlli';
  const testSize = '72px';
  const baseFonts = ['monospace', 'sans-serif', 'serif'];

  // Create span for testing
  const span = document.createElement('span');
  span.style.position = 'absolute';
  span.style.left = '-9999px';
  span.style.top = '-9999px';
  span.style.fontSize = testSize;
  span.style.fontStyle = 'normal';
  span.style.fontWeight = 'normal';
  span.style.letterSpacing = 'normal';
  span.style.lineHeight = 'normal';
  span.style.textTransform = 'none';
  span.style.textAlign = 'left';
  span.style.textDecoration = 'none';
  span.style.whiteSpace = 'nowrap';
  span.textContent = testString;

  document.body.appendChild(span);

  // Get baseline widths
  const baselineWidths: Record<string, number> = {};
  for (const baseFont of baseFonts) {
    span.style.fontFamily = baseFont;
    baselineWidths[baseFont] = span.offsetWidth;
  }

  // Test each font
  for (const font of FONTS_TO_TEST) {
    let isDetected = false;

    for (const baseFont of baseFonts) {
      span.style.fontFamily = `'${font}', ${baseFont}`;
      const width = span.offsetWidth;

      if (width !== baselineWidths[baseFont]) {
        isDetected = true;
        break;
      }
    }

    if (isDetected) {
      detected.push(font);
    }
  }

  document.body.removeChild(span);

  // Generate hash
  const hash = await hashFonts(detected);

  return {
    detected,
    hash,
    count: detected.length,
  };
}

async function hashFonts(fonts: string[]): Promise<string> {
  const str = fonts.sort().join(',');
  const encoder = new TextEncoder();
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(str));
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}
