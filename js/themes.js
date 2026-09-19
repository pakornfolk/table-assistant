/**
 * Cute Timetable & GPA Master - Theme Engine & Customizer
 */

import { Storage, STORAGE_KEYS } from './supabase-client.js';

export const THEME_PRESETS = [
  { id: 'strawberry', name: 'Strawberry Milk', icon: '🍓', color: '#ff7597' },
  { id: 'lavender', name: 'Lavender Dream', icon: '💜', color: '#9b6bcc' },
  { id: 'matcha', name: 'Matcha Latte', icon: '🍵', color: '#52a46b' },
  { id: 'peach', name: 'Peach Sunset', icon: '🍑', color: '#ff7e5f' },
  { id: 'utcc', name: 'UTCC Cute Blue', icon: '💙', color: '#1e5ba3' },
  { id: 'cloudy', name: 'Cloudy Sky', icon: '☁️', color: '#4a90e2' }
];

class ThemeManager {
  constructor() {
    this.currentTheme = Storage.load(STORAGE_KEYS.THEME, 'strawberry');
    this.customColors = Storage.load(STORAGE_KEYS.CUSTOM_COLORS, {
      primary: '#ff7597',
      accent: '#9b72cf'
    });
  }

  init() {
    this.applyTheme(this.currentTheme);
  }

  applyTheme(themeId) {
    this.currentTheme = themeId;
    Storage.save(STORAGE_KEYS.THEME, themeId);

    if (themeId === 'custom') {
      document.documentElement.removeAttribute('data-theme');
      this.applyCustomColors(this.customColors.primary, this.customColors.accent);
    } else {
      // Remove inline custom overrides
      this.clearCustomStyles();
      document.documentElement.setAttribute('data-theme', themeId);
    }

    // Update active state in UI if theme buttons exist
    document.querySelectorAll('.theme-preset-btn').forEach(btn => {
      if (btn.dataset.theme === themeId) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  }

  setCustomColors(primaryHex, accentHex) {
    this.customColors = { primary: primaryHex, accent: accentHex };
    Storage.save(STORAGE_KEYS.CUSTOM_COLORS, this.customColors);
    this.applyTheme('custom');
  }

  applyCustomColors(primary, accent) {
    const root = document.documentElement;
    root.style.setProperty('--primary', primary);
    root.style.setProperty('--primary-hover', this.adjustBrightness(primary, -15));
    root.style.setProperty('--primary-light', this.hexToRgba(primary, 0.15));
    root.style.setProperty('--primary-soft', this.hexToRgba(primary, 0.08));
    root.style.setProperty('--surface-border', this.hexToRgba(primary, 0.22));
    root.style.setProperty('--secondary', accent);
    root.style.setProperty('--shadow-md', `0 8px 24px ${this.hexToRgba(primary, 0.15)}`);
  }

  clearCustomStyles() {
    const root = document.documentElement;
    root.style.removeProperty('--primary');
    root.style.removeProperty('--primary-hover');
    root.style.removeProperty('--primary-light');
    root.style.removeProperty('--primary-soft');
    root.style.removeProperty('--surface-border');
    root.style.removeProperty('--secondary');
    root.style.removeProperty('--shadow-md');
  }

  hexToRgba(hex, alpha = 1) {
    const cleanHex = hex.replace('#', '');
    const r = parseInt(cleanHex.substring(0, 2), 16) || 255;
    const g = parseInt(cleanHex.substring(2, 4), 16) || 117;
    const b = parseInt(cleanHex.substring(4, 6), 16) || 151;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  adjustBrightness(hex, percent) {
    const cleanHex = hex.replace('#', '');
    let num = parseInt(cleanHex, 16);
    let amt = Math.round(2.55 * percent);
    let R = (num >> 16) + amt;
    let B = ((num >> 8) & 0x00FF) + amt;
    let G = (num & 0x0000FF) + amt;
    return '#' + (0x1000000 + (R<255?R<1?0:R:255)*0x10000 + (B<255?B<1?0:B:255)*0x100 + (G<255?G<1?0:G:255)).toString(16).slice(1);
  }
}

export const Themes = new ThemeManager();
