import { ALL_PALETTES, DEFAULT_THEME_ID, STORAGE_KEY_MODE, STORAGE_KEY_THEME } from './theme-config';
import { THEME_IDS, TOKEN_NAMES } from './types';

/**
 * Pure string builders (no DOM). vite.config.ts calls these to inline every theme's variables and a
 * tiny boot script into app.html, so the right colours are on screen before React loads.
 * Switching themes later is just changing <html data-theme="...">: no style rewriting, no reload.
 */
export function buildThemeCss(): string {
  return ALL_PALETTES.map((p) => {
    const decls = TOKEN_NAMES.map((name) => `${name}:${p.tokens[name]}`).join(';');
    return `:root[data-theme='${p.key}']{color-scheme:${p.scheme};${decls}}`;
  }).join('\n');
}

export function buildBootScript(): string {
  const scheme: Record<string, string> = {};
  for (const p of ALL_PALETTES) scheme[p.key] = p.scheme;
  return `(function(){try{
var ids=${JSON.stringify(THEME_IDS)},scheme=${JSON.stringify(scheme)};
var id=localStorage.getItem(${JSON.stringify(STORAGE_KEY_THEME)});
if(ids.indexOf(id)<0)id=${JSON.stringify(DEFAULT_THEME_ID)};
var key=id;
if(id==='campusly-original'){
var m=localStorage.getItem(${JSON.stringify(STORAGE_KEY_MODE)});
var dark=m==='dark'||(m!=='light'&&matchMedia('(prefers-color-scheme: dark)').matches);
key=dark?'campusly-original-dark':'campusly-original-light';}
var d=document.documentElement;d.setAttribute('data-theme',key);d.style.colorScheme=scheme[key];
}catch(e){document.documentElement.setAttribute('data-theme',${JSON.stringify(DEFAULT_THEME_ID)});}})();`;
}
