/**
 * 全域 UI_PALETTE 屬性。
 * RGB 代表使用者選定的介面基準色；明暗由相對亮度決定。
 */
const DARK = Object.freeze({
  background: [0, 0, 0],
  surface: [32, 33, 39],
  panel: [17, 18, 22],
  control: [52, 54, 64],
  hover: [71, 74, 88],
  border: [60, 62, 73],
  text: [241, 242, 245],
  muted: [165, 168, 181],
  editor: [0, 0, 0],
  gutter: [8, 9, 11]
});

const LIGHT = Object.freeze({
  background: [255, 255, 255],
  surface: [244, 246, 250],
  panel: [236, 239, 244],
  control: [224, 229, 237],
  hover: [210, 218, 230],
  border: [189, 198, 211],
  text: [25, 30, 42],
  muted: [78, 89, 106],
  editor: [255, 255, 255],
  gutter: [240, 242, 247]
});

function channelToLinear(channel) {
  const value = channel / 255;
  return value <= 0.04045
    ? value / 12.92
    : ((value + 0.055) / 1.055) ** 2.4;
}

function brightness(rgb) {
  return (
    0.2126 * channelToLinear(rgb[0]) +
    0.7152 * channelToLinear(rgb[1]) +
    0.0722 * channelToLinear(rgb[2])
  );
}

function contrastRatio(a, b) {
  const light = Math.max(brightness(a), brightness(b));
  const dark = Math.min(brightness(a), brightness(b));
  return (light + 0.05) / (dark + 0.05);
}

function readableText(background) {
  const white = [255, 255, 255];
  const black = [0, 0, 0];
  return contrastRatio(background, white) >= contrastRatio(background, black)
    ? white
    : black;
}

function blend(start, end, weight) {
  return start.map((value, index) =>
    Math.round(value + (end[index] - value) * weight)
  );
}

function rgbText(rgb) {
  return `rgb(${rgb.join(', ')})`;
}

export class InterfacePalette {
  #rgb = [0, 0, 0];
  #listeners = new Set();

  constructor() {
    try {
      const stored = JSON.parse(localStorage.getItem('cluster.uiPalette'));
      if (Array.isArray(stored) && this.#valid(stored)) {
        this.#rgb = [...stored];
      }
    } catch (_) {
      // Local storage is optional.
    }
    this.apply();
  }

  #valid(rgb) {
    return rgb.length === 3 &&
      rgb.every(value => Number.isInteger(value) && value >= 0 && value <= 255);
  }

  get value() {
    return Object.freeze([...this.#rgb]);
  }

  get mode() {
    return brightness(this.#rgb) >= 0.5 ? 'light' : 'dark';
  }

  get weight() {
    return brightness(this.#rgb);
  }

  set(rgb) {
    if (!Array.isArray(rgb) || !this.#valid(rgb)) {
      return Object.freeze({
        ok: false,
        code: 400,
        message: 'RGB values must be integers from 0 to 255'
      });
    }

    this.#rgb = [...rgb];
    this.apply();

    try {
      localStorage.setItem('cluster.uiPalette', JSON.stringify(this.#rgb));
    } catch (_) {
      // Persistence failure does not prevent visual updates.
    }

    for (const listener of this.#listeners) {
      listener(this.value);
    }
    return Object.freeze({ok: true, code: 200});
  }

  subscribe(listener) {
    this.#listeners.add(listener);
    return () => this.#listeners.delete(listener);
  }

  apply() {
    const root = document.documentElement;
    const weight = this.weight;
    const keys = Object.keys(DARK);

    const surfaces = {};

    for (const key of keys) {
      if (key === 'text' || key === 'muted') continue;

      const base = blend(DARK[key], LIGHT[key], weight);
      const tint = weight === 0 || weight === 1 ? 0 : 0.12;
      surfaces[key] = blend(base, this.#rgb, tint);
      root.style.setProperty(`--ui-${key}`, rgbText(surfaces[key]));
    }

    const foreground = readableText(surfaces.background);
    const secondary = readableText(surfaces.surface);
    root.style.setProperty('--ui-text', rgbText(foreground));
    root.style.setProperty('--ui-muted', rgbText(secondary));
    root.style.setProperty('--ui-text-on-surface', rgbText(secondary));
    root.style.setProperty(
      '--ui-text-on-control',
      rgbText(readableText(surfaces.control))
    );
    root.style.setProperty(
      '--ui-text-on-panel',
      rgbText(readableText(surfaces.panel))
    );

    // Explorer active row uses palette mode rather than non-existent body classes.\n    const active = this.mode === 'light'\n      ? {bg:'#b8d7ff',hover:'#9cc6ff',text:'#102c4b',edge:'#145da0'}\n      : {bg:'#274c70',hover:'#32628d',text:'#ffffff',edge:'#80c8ff'};\n    root.style.setProperty('--explorer-active-bg',active.bg);\n    root.style.setProperty('--explorer-active-hover',active.hover);\n    root.style.setProperty('--explorer-active-text',active.text);\n    root.style.setProperty('--explorer-active-edge',active.edge);\n    root.style.colorScheme = this.mode;
    root.style.setProperty('--ui-accent', rgbText(this.#rgb));
  }
}
