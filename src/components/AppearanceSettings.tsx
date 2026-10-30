'use client';

import { useEffect, useSyncExternalStore } from 'react';

const EVENT = 'wleedmovie-settings';
const PREFIX = 'wleedmovie-appearance-';

const themes = [
  { id: 'default', name: 'Default', description: 'The original white palette' },
  { id: 'atlantic', name: 'Atlantic', description: 'Cold cyan, slow tide' },
  { id: 'aurora', name: 'Aurora', description: 'Ribbons of light overhead' },
  { id: 'nocturne', name: 'Nocturne', description: 'Neon rain on empty streets' },
  { id: 'cosmos', name: 'Cosmos', description: 'Stars twinkling far off' },
  { id: 'sunset', name: 'Sunset', description: 'Retro horizon, endless dusk' },
  { id: 'sakura', name: 'Sakura', description: 'Petals falling at night' },
  { id: 'abyss', name: 'Abyss', description: 'Bubbles rising from the deep' },
  { id: 'cinder', name: 'Cinder', description: 'Embers lifting off a fire' },
  { id: 'obsidian', name: 'Obsidian', description: 'Polished dark glass, one clean line' },
  { id: 'glacier', name: 'Glacier', description: 'Snowfall over cold water' },
  { id: 'velvet', name: 'Velvet', description: 'Deep burgundy, gold trim' },
  { id: 'solstice', name: 'Solstice', description: 'Gold dust in late light' },
  { id: 'nightfall', name: 'Nightfall', description: 'Indigo haze, nothing moving fast' },
  { id: 'meadow', name: 'Meadow', description: 'Fireflies over dark grass' },
  { id: 'autumn', name: 'Autumn', description: 'Leaves drifting at dusk' },
  { id: 'custom', name: 'Custom', description: 'Your own accent color' },
  { id: 'lime', name: 'Lime', description: 'Electric green' },
  { id: 'surface', name: 'Surface', description: 'Soft green' },
  { id: 'aero', name: 'Aero', description: 'Sky blue' },
  { id: 'blue', name: 'Blue', description: 'Cool periwinkle' },
  { id: 'teal', name: 'Teal', description: 'Ocean green' },
  { id: 'forest', name: 'Forest', description: 'Quiet woodland' },
] as const;

function subscribe(callback: () => void) {
  window.addEventListener(EVENT, callback);
  window.addEventListener('storage', callback);
  return () => {
    window.removeEventListener(EVENT, callback);
    window.removeEventListener('storage', callback);
  };
}

function useSetting(key: string, fallback: string) {
  return useSyncExternalStore(
    subscribe,
    () => {
      try { return localStorage.getItem(PREFIX + key) ?? fallback; }
      catch { return fallback; }
    },
    () => fallback,
  );
}

function saveSetting(key: string, value: string) {
  try { localStorage.setItem(PREFIX + key, value); }
  catch { /* Keep the interface usable when browser storage is unavailable. */ }
  window.dispatchEvent(new Event(EVENT));
}

function Switch({ checked, label, onChange }: { checked: boolean; label: string; onChange: () => void }) {
  return <button type="button" role="switch" aria-checked={checked} aria-label={label} className={`appearance-switch ${checked ? 'on' : ''}`} onClick={onChange}><span /></button>;
}

export default function AppearanceSettings({ open, onClose }: { open: boolean; onClose: () => void }) {
  const theme = useSetting('theme', 'default');
  const customColor = useSetting('custom-color', '#83f343');
  const episodeView = useSetting('episode-view', 'list');
  const detailView = useSetting('detail-view', 'full');
  const imageLogos = useSetting('image-logos', 'off') === 'on';
  const spoilerFree = useSetting('spoiler-free', 'off') === 'on';
  const backgroundParticles = useSetting('background-particles', 'on') === 'on';
  const reducedMotion = useSetting('reduced-motion', 'off') === 'on';
  const activeTheme = themes.find(option => option.id === theme) ?? themes[0];

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = activeTheme.id;
    root.dataset.episodeView = episodeView;
    root.dataset.detailView = detailView;
    root.dataset.imageLogos = imageLogos ? 'on' : 'off';
    root.dataset.spoilerFree = spoilerFree ? 'on' : 'off';
    root.classList.toggle('reduce-motion', reducedMotion);
    root.classList.toggle('ambient-particles-off', !backgroundParticles);
    if (activeTheme.id === 'custom' && /^#[0-9a-f]{6}$/i.test(customColor)) {
      const rgb = [1, 3, 5].map(index => parseInt(customColor.slice(index, index + 2), 16));
      root.style.setProperty('--accent', customColor);
      root.style.setProperty('--accent-rgb', rgb.join(', '));
      root.style.setProperty('--accent-ink', (rgb[0] * .299 + rgb[1] * .587 + rgb[2] * .114) > 145 ? '#101712' : '#ffffff');
    } else {
      root.style.removeProperty('--accent');
      root.style.removeProperty('--accent-rgb');
      root.style.removeProperty('--accent-ink');
    }
  }, [activeTheme.id, customColor, episodeView, detailView, imageLogos, spoilerFree, backgroundParticles, reducedMotion]);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previous; };
  }, [open]);

  if (!open) return null;

  return <div className="appearance-overlay" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}>
    <section className="appearance-panel" role="dialog" aria-modal="true" aria-labelledby="appearance-heading">
      <div className="appearance-heading"><div><h2 id="appearance-heading">Appearance</h2><p>Change the look of the site to suit your needs.</p></div><button type="button" aria-label="Close appearance settings" onClick={onClose}>✕</button></div>

      <div className="appearance-theme-section"><div className="appearance-theme-intro"><h3>Theme</h3><p>Pick an ambient theme for the site&apos;s background and accent color.</p></div><div className="ambient-theme-grid" role="group" aria-label="Ambient themes">{themes.slice(0, 16).map(option => <button key={option.id} type="button" className={`ambient-theme-card theme-preview-${option.id}`} aria-pressed={theme === option.id} onClick={() => saveSetting('theme', option.id)}><span className="ambient-theme-art" aria-hidden="true" /><span className="ambient-theme-copy"><strong>{option.name}</strong><small>{option.description}</small></span>{theme === option.id && <span className="ambient-theme-selected" aria-hidden="true">✓</span>}</button>)}</div><div className="classic-theme-options" role="group" aria-label="Classic palettes"><span>Classic palettes</span>{themes.slice(16).map(option => <button key={option.id} type="button" aria-pressed={theme === option.id} onClick={() => saveSetting('theme', option.id)}>{option.name}</button>)}</div></div>
      {activeTheme.id === 'custom' && <div className="appearance-row custom-color-row"><div><h3>Accent Color</h3><p>Choose a color for buttons and highlights.</p></div><label className="color-control"><input type="color" value={customColor} onChange={event => saveSetting('custom-color', event.target.value)} aria-label="Custom accent color" /><span>{customColor.toUpperCase()}</span></label></div>}
      <div className="appearance-row"><div><h3>Episode View Style</h3><p>Choose how episodes appear on series pages.</p></div><div className="appearance-segment" role="group" aria-label="Episode view style"><button type="button" className={episodeView === 'grid' ? 'selected' : ''} aria-pressed={episodeView === 'grid'} onClick={() => saveSetting('episode-view', 'grid')}>Grid</button><button type="button" className={episodeView === 'list' ? 'selected' : ''} aria-pressed={episodeView === 'list'} onClick={() => saveSetting('episode-view', 'list')}>List</button></div></div>
      <div className="appearance-row"><div><h3>Detail View Type</h3><p>Pick between a full page or a compact view.</p></div><div className="appearance-segment" role="group" aria-label="Detail view type"><button type="button" className={detailView === 'full' ? 'selected' : ''} aria-pressed={detailView === 'full'} onClick={() => saveSetting('detail-view', 'full')}>Full</button><button type="button" className={detailView === 'compact' ? 'selected' : ''} aria-pressed={detailView === 'compact'} onClick={() => saveSetting('detail-view', 'compact')}>Compact</button></div></div>
      <div className="appearance-row"><div><h3>Use Image Logos</h3><p>Display title logos on detail pages when available.</p></div><Switch label="Use image logos" checked={imageLogos} onChange={() => saveSetting('image-logos', imageLogos ? 'off' : 'on')} /></div>
      <div className="appearance-row"><div><h3>Spoiler-Free Mode</h3><p>Hide episode images and titles until you choose an episode.</p></div><Switch label="Spoiler-free mode" checked={spoilerFree} onChange={() => saveSetting('spoiler-free', spoilerFree ? 'off' : 'on')} /></div>
      <div className="appearance-row"><div><h3>Animate Backgrounds</h3><p>Turn off to stop the moving theme effects and save battery.</p></div><Switch label="Animate backgrounds" checked={backgroundParticles} onChange={() => saveSetting('background-particles', backgroundParticles ? 'off' : 'on')} /></div>
      <div className="appearance-row"><div><h3>Reduce Motion</h3><p>Reduce effects and animated transitions.</p></div><Switch label="Reduce motion" checked={reducedMotion} onChange={() => saveSetting('reduced-motion', reducedMotion ? 'off' : 'on')} /></div>
    </section>
  </div>;
}
