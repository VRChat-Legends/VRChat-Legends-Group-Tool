import { useState } from 'react';
import ClickSpark from './ClickSpark';

const emptyEmbed = () => ({
  title: '',
  description: '',
  color: 0x48bb78,
  url: '',
  author: { name: '', url: '', icon_url: '' },
  thumbnail: { url: '' },
  image: { url: '' },
  footer: { text: '', icon_url: '' },
  timestamp: true,
  fields: [],
});

function hexToDec(hex) {
  if (!hex || typeof hex !== 'string') return 0x48bb78;
  const s = hex.replace(/^#/, '');
  if (/^[0-9A-Fa-f]{6}$/.test(s)) return parseInt(s, 16);
  return 0x48bb78;
}

function decToHex(n) {
  if (typeof n !== 'number') return '#48bb78';
  const h = Math.max(0, Math.min(0xffffff, Math.floor(n))).toString(16);
  return '#' + h.padStart(6, '0');
}

export default function DiscordEmbedBuilder({ template, onChange, embedTags = {}, title: sectionTitle }) {
  const embed = template || emptyEmbed();
  const set = (path, value) => {
    const next = JSON.parse(JSON.stringify(embed));
    const parts = path.split('.');
    let o = next;
    for (let i = 0; i < parts.length - 1; i++) {
      const k = parts[i];
      if (!(k in o)) o[k] = {};
      o = o[k];
    }
    o[parts[parts.length - 1]] = value;
    onChange(next);
  };

  const addField = () => {
    const next = { ...embed, fields: [...(embed.fields || []), { name: '', value: '', inline: false }] };
    onChange(next);
  };

  const removeField = (i) => {
    const next = { ...embed, fields: embed.fields.filter((_, j) => j !== i) };
    onChange(next);
  };

  const setField = (i, key, value) => {
    const fields = [...(embed.fields || [])];
    if (!fields[i]) fields[i] = { name: '', value: '', inline: false };
    fields[i] = { ...fields[i], [key]: value };
    onChange({ ...embed, fields });
  };

  return (
    <div className="space-y-4 rounded-xl border border-surface-700 bg-surface-800/50 p-4">
      <p className="text-sm font-medium text-surface-300">{sectionTitle}</p>

      <div className="grid grid-cols-1 gap-3">
        <div>
          <label className="block text-xs text-surface-500 mb-1">Title</label>
          <input value={embed.title || ''} onChange={(e) => set('title', e.target.value)} placeholder="e.g. User {action_title} Lobby" className="w-full px-3 py-2 rounded-lg bg-surface-800 border border-surface-600 text-surface-100 text-sm" />
        </div>
        <div>
          <label className="block text-xs text-surface-500 mb-1">Description</label>
          <textarea value={embed.description || ''} onChange={(e) => set('description', e.target.value)} rows={2} placeholder="Use {display_name}, {bio}, etc." className="w-full px-3 py-2 rounded-lg bg-surface-800 border border-surface-600 text-surface-100 text-sm resize-none" />
        </div>
        <div className="flex gap-4 flex-wrap">
          <div>
            <label className="block text-xs text-surface-500 mb-1">Color</label>
            <div className="flex items-center gap-2">
              <input type="color" value={decToHex(embed.color)} onChange={(e) => set('color', hexToDec(e.target.value))} className="w-10 h-10 rounded cursor-pointer bg-surface-700 border border-surface-600" />
              <input value={decToHex(embed.color)} onChange={(e) => set('color', hexToDec(e.target.value))} className="w-24 px-2 py-1.5 rounded-lg bg-surface-800 border border-surface-600 text-surface-100 text-sm font-mono" />
            </div>
          </div>
          <div className="flex-1 min-w-[120px]">
            <label className="block text-xs text-surface-500 mb-1">URL (title link)</label>
            <input value={embed.url || ''} onChange={(e) => set('url', e.target.value)} placeholder="https://..." className="w-full px-3 py-2 rounded-lg bg-surface-800 border border-surface-600 text-surface-100 text-sm" />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <div>
            <label className="block text-xs text-surface-500 mb-1">Author name</label>
            <input value={embed.author?.name || ''} onChange={(e) => set('author.name', e.target.value)} className="w-full px-3 py-2 rounded-lg bg-surface-800 border border-surface-600 text-surface-100 text-sm" />
          </div>
          <div>
            <label className="block text-xs text-surface-500 mb-1">Author URL</label>
            <input value={embed.author?.url || ''} onChange={(e) => set('author.url', e.target.value)} placeholder="https://..." className="w-full px-3 py-2 rounded-lg bg-surface-800 border border-surface-600 text-surface-100 text-sm" />
          </div>
          <div>
            <label className="block text-xs text-surface-500 mb-1">Author icon URL</label>
            <input value={embed.author?.icon_url || ''} onChange={(e) => set('author.icon_url', e.target.value)} placeholder="https://..." className="w-full px-3 py-2 rounded-lg bg-surface-800 border border-surface-600 text-surface-100 text-sm" />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div>
            <label className="block text-xs text-surface-500 mb-1">Thumbnail URL</label>
            <input value={embed.thumbnail?.url || ''} onChange={(e) => set('thumbnail.url', e.target.value)} placeholder="{avatar_url} or image URL" className="w-full px-3 py-2 rounded-lg bg-surface-800 border border-surface-600 text-surface-100 text-sm" />
          </div>
          <div>
            <label className="block text-xs text-surface-500 mb-1">Image URL</label>
            <input value={embed.image?.url || ''} onChange={(e) => set('image.url', e.target.value)} className="w-full px-3 py-2 rounded-lg bg-surface-800 border border-surface-600 text-surface-100 text-sm" />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div>
            <label className="block text-xs text-surface-500 mb-1">Footer text</label>
            <input value={embed.footer?.text || ''} onChange={(e) => set('footer.text', e.target.value)} className="w-full px-3 py-2 rounded-lg bg-surface-800 border border-surface-600 text-surface-100 text-sm" />
          </div>
          <div>
            <label className="block text-xs text-surface-500 mb-1">Footer icon URL</label>
            <input value={embed.footer?.icon_url || ''} onChange={(e) => set('footer.icon_url', e.target.value)} className="w-full px-3 py-2 rounded-lg bg-surface-800 border border-surface-600 text-surface-100 text-sm" />
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm text-surface-400 cursor-pointer">
          <input type="checkbox" checked={embed.timestamp !== false} onChange={(e) => set('timestamp', e.target.checked)} className="rounded border-surface-600 bg-surface-800 text-brand-500" />
          Show timestamp
        </label>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-xs text-surface-500">Fields (max 25)</label>
          <ClickSpark>
            <button type="button" onClick={addField} className="text-xs px-2 py-1 rounded bg-brand-500/20 text-brand-400 hover:bg-brand-500/30">+ Add field</button>
          </ClickSpark>
        </div>
        <div className="space-y-2">
          {(embed.fields || []).map((f, i) => (
            <div key={i} className="flex gap-2 items-start p-2 rounded-lg bg-surface-900 border border-surface-700">
              <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2">
                <input value={f.name || ''} onChange={(e) => setField(i, 'name', e.target.value)} placeholder="Field name" className="px-2 py-1.5 rounded bg-surface-800 border border-surface-600 text-surface-100 text-sm" />
                <input value={f.value || ''} onChange={(e) => setField(i, 'value', e.target.value)} placeholder="Field value (use tags)" className="px-2 py-1.5 rounded bg-surface-800 border border-surface-600 text-surface-100 text-sm sm:col-span-2" />
              </div>
              <label className="flex items-center gap-1 text-xs text-surface-500 whitespace-nowrap">
                <input type="checkbox" checked={!!f.inline} onChange={(e) => setField(i, 'inline', e.target.checked)} className="rounded border-surface-600 bg-surface-800 text-brand-500" />
                Inline
              </label>
              <button type="button" onClick={() => removeField(i)} className="p-1.5 rounded text-red-400 hover:bg-red-500/20" aria-label="Remove field">−</button>
            </div>
          ))}
        </div>
      </div>

      {Object.keys(embedTags).length > 0 && (
        <div>
          <label className="block text-xs text-surface-500 mb-2">Available tags (use in title, description, fields)</label>
          <div className="flex flex-wrap gap-1.5">
            {Object.entries(embedTags).map(([tag, desc]) => (
              <ClickSpark key={tag}>
                <button type="button" onClick={() => { navigator.clipboard?.writeText(`{${tag}}`); }} title={desc} className="px-2 py-1 rounded bg-surface-700 text-surface-300 text-xs font-mono hover:bg-surface-600">{'{' + tag + '}'}</button>
              </ClickSpark>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export { emptyEmbed };
