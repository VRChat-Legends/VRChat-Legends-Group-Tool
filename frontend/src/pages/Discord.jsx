import { useState, useEffect } from 'react';
import { api } from '../api/client';
import Card from '../components/Card';
import { useToast } from '../components/Toast';
import ClickSpark from '../components/ClickSpark';
import { Icons } from '../components/Icons';
import DiscordEmbedBuilder from '../components/DiscordEmbedBuilder';

function CommandsEditor() {
  const [cfg, setCfg] = useState(null);
  const toast = useToast();
  useEffect(() => { api.commands().then(setCfg).catch(() => setCfg({ prefix: '!', commands: [], slash_commands: [], sync_to_discord: false })); }, []);
  if (!cfg) return <p className="text-surface-500">Loading…</p>;
  const addCmd = (type) => {
    const list = type === 'slash' ? [...(cfg.slash_commands || []), { name: '', response: '', role_lock: '', cooldown_sec: 0 }] : [...(cfg.commands || []), { name: '', response: '', role_lock: '', cooldown_sec: 0 }];
    setCfg((c) => ({ ...c, [type === 'slash' ? 'slash_commands' : 'commands']: list }));
  };
  const updateCmd = (type, i, key, val) => {
    const list = [...(type === 'slash' ? cfg.slash_commands : cfg.commands)];
    if (!list[i]) return;
    list[i] = { ...list[i], [key]: val };
    setCfg((c) => ({ ...c, [type === 'slash' ? 'slash_commands' : 'commands']: list }));
  };
  const removeCmd = (type, i) => {
    const list = (type === 'slash' ? cfg.slash_commands : cfg.commands).filter((_, j) => j !== i);
    setCfg((c) => ({ ...c, [type === 'slash' ? 'slash_commands' : 'commands']: list }));
  };
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-4">
        <div>
          <label className="block text-xs text-surface-500 mb-1">Prefix</label>
          <input value={cfg.prefix || '!'} onChange={(e) => setCfg((c) => ({ ...c, prefix: e.target.value || '!' }))} className="w-16 px-2 py-2 rounded-lg bg-surface-800 border border-surface-600 text-surface-100 font-mono" />
        </div>
        <label className="flex items-center gap-2 cursor-pointer mt-6">
          <input type="checkbox" checked={cfg.sync_to_discord ?? false} onChange={(e) => setCfg((c) => ({ ...c, sync_to_discord: e.target.checked }))} className="rounded border-surface-600 bg-surface-800 text-brand-500" />
          <span className="text-surface-300">Sync to Discord (register slash commands)</span>
        </label>
      </div>
      <div>
        <p className="text-sm font-medium text-surface-300 mb-2">Prefix commands (e.g. !uptime)</p>
        {(cfg.commands || []).map((cmd, i) => (
          <div key={i} className="flex flex-wrap gap-2 items-center mb-2 p-2 rounded-lg bg-surface-800/50">
            <input placeholder="name" value={cmd.name} onChange={(e) => updateCmd('prefix', i, 'name', e.target.value)} className="w-24 px-2 py-1.5 rounded bg-surface-800 border border-surface-600 text-surface-100 text-sm" />
            <input placeholder="response" value={cmd.response} onChange={(e) => updateCmd('prefix', i, 'response', e.target.value)} className="flex-1 min-w-[120px] px-2 py-1.5 rounded bg-surface-800 border border-surface-600 text-surface-100 text-sm" />
            <input placeholder="role lock (ID)" value={cmd.role_lock || ''} onChange={(e) => updateCmd('prefix', i, 'role_lock', e.target.value)} className="w-28 px-2 py-1.5 rounded bg-surface-800 border border-surface-600 text-surface-100 text-sm" />
            <input type="number" placeholder="cooldown s" value={cmd.cooldown_sec ?? 0} onChange={(e) => updateCmd('prefix', i, 'cooldown_sec', parseInt(e.target.value, 10) || 0)} className="w-16 px-2 py-1.5 rounded bg-surface-800 border border-surface-600 text-surface-100 text-sm" />
            <button type="button" onClick={() => removeCmd('prefix', i)} className="text-red-400 hover:text-red-300 text-sm">Remove</button>
          </div>
        ))}
        <ClickSpark><button onClick={() => addCmd('prefix')} className="text-sm px-3 py-1.5 rounded bg-surface-700 text-surface-300 hover:bg-surface-600">+ Add</button></ClickSpark>
      </div>
      <div>
        <p className="text-sm font-medium text-surface-300 mb-2">Slash commands (e.g. /uptime)</p>
        {(cfg.slash_commands || []).map((cmd, i) => (
          <div key={i} className="flex flex-wrap gap-2 items-center mb-2 p-2 rounded-lg bg-surface-800/50">
            <input placeholder="name" value={cmd.name} onChange={(e) => updateCmd('slash', i, 'name', e.target.value)} className="w-24 px-2 py-1.5 rounded bg-surface-800 border border-surface-600 text-surface-100 text-sm" />
            <input placeholder="response" value={cmd.response} onChange={(e) => updateCmd('slash', i, 'response', e.target.value)} className="flex-1 min-w-[120px] px-2 py-1.5 rounded bg-surface-800 border border-surface-600 text-surface-100 text-sm" />
            <input placeholder="role lock" value={cmd.role_lock || ''} onChange={(e) => updateCmd('slash', i, 'role_lock', e.target.value)} className="w-28 px-2 py-1.5 rounded bg-surface-800 border border-surface-600 text-surface-100 text-sm" />
            <input type="number" placeholder="cooldown" value={cmd.cooldown_sec ?? 0} onChange={(e) => updateCmd('slash', i, 'cooldown_sec', parseInt(e.target.value, 10) || 0)} className="w-16 px-2 py-1.5 rounded bg-surface-800 border border-surface-600 text-surface-100 text-sm" />
            <button type="button" onClick={() => removeCmd('slash', i)} className="text-red-400 hover:text-red-300 text-sm">Remove</button>
          </div>
        ))}
        <ClickSpark><button onClick={() => addCmd('slash')} className="text-sm px-3 py-1.5 rounded bg-surface-700 text-surface-300 hover:bg-surface-600">+ Add</button></ClickSpark>
      </div>
      <ClickSpark>
        <button onClick={() => api.saveCommands(cfg).then(() => { api.commands().then(setCfg); toast('Commands saved', 'success'); })} className="px-4 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-medium flex items-center gap-2">
          <Icons.Save /> Save commands
        </button>
      </ClickSpark>
    </div>
  );
}

export default function Discord() {
  const [s, setS] = useState({});
  const [discordConfig, setDiscordConfig] = useState(null);
  const [localBotToken, setLocalBotToken] = useState('');
  const toast = useToast();

  useEffect(() => {
    api.settings().then(setS);
    api.discord().then(setDiscordConfig).catch(() => {});
  }, []);

  return (
    <div className="space-y-6 animate-in">
      <Card title="Discord Commands" subtitle="Prefix (!cmd) and slash (/cmd) commands — requires Discord bot" className="star-border bento-cell-wide" titleIcon={<Icons.Globe />}>
        <CommandsEditor />
      </Card>

      <Card title="Discord webhook" subtitle="Full embed builder with tags" className="star-border bento-cell-wide" titleIcon={<Icons.Globe />}>
        <label className="flex items-center gap-2 text-sm text-surface-400 cursor-pointer mb-3">
          <input
            type="checkbox"
            checked={s.discord_enabled ?? false}
            onChange={(e) =>
              api.saveDiscord({ enabled: e.target.checked }).then(() => {
                api.settings().then(setS);
                api.discord().then(setDiscordConfig);
                toast('Saved', 'success');
              })
            }
            className="rounded border-surface-600 bg-surface-800 text-brand-500"
          />
          Enable
        </label>
        <div className="flex gap-2 mb-4">
          <input
            type="url"
            value={s.discord_webhook_url ?? ''}
            onChange={(e) => setS((x) => ({ ...x, discord_webhook_url: e.target.value }))}
            placeholder="Webhook URL"
            className="flex-1 px-4 py-2.5 rounded-xl bg-surface-800 border border-surface-700 text-surface-100"
          />
          <ClickSpark>
            <button
              onClick={() =>
                api.saveDiscord({ webhook_url: s.discord_webhook_url }).then(() => {
                  toast('Saved', 'success');
                  api.settings().then(setS);
                  api.discord().then(setDiscordConfig);
                })
              }
              className="px-4 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-medium flex items-center gap-2"
            >
              <Icons.Save /> Save URL
            </button>
          </ClickSpark>
        </div>
        <div className="mb-4">
          <label className="block text-xs text-surface-500 mb-1">Discord Bot Token (optional, for slash commands)</label>
          <div className="flex gap-2">
            <input
              type="password"
              value={localBotToken}
              onChange={(e) => setLocalBotToken(e.target.value)}
              placeholder={discordConfig?.discord_bot_token_masked ? '•••••••• (enter new to replace)' : 'Bot token...'}
              className="flex-1 px-4 py-2.5 rounded-xl bg-surface-800 border border-surface-700 text-surface-100 text-sm font-mono"
            />
            <ClickSpark>
              <button onClick={() => { if (!localBotToken) return; api.saveDiscord({ discord_bot_token: localBotToken }).then(() => { setLocalBotToken(''); api.discord().then(setDiscordConfig); toast('Discord bot token saved', 'success'); }); }} className="px-4 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-medium flex items-center gap-2"><Icons.Save /> Save</button>
            </ClickSpark>
          </div>
        </div>
        <p className="text-xs text-surface-500 mb-3">
          Embed builder (Dishook-style): customize join/leave notifications. Use tags like {'{display_name}'}, {'{avatar_url}'} in any text field.
        </p>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <DiscordEmbedBuilder
            title="Join lobby embed"
            template={discordConfig?.embed_join}
            embedTags={discordConfig?.embed_tags || {}}
            onChange={(embed_join) => setDiscordConfig((c) => ({ ...c, embed_join }))}
          />
          <DiscordEmbedBuilder
            title="Leave lobby embed"
            template={discordConfig?.embed_leave}
            embedTags={discordConfig?.embed_tags || {}}
            onChange={(embed_leave) => setDiscordConfig((c) => ({ ...c, embed_leave }))}
          />
        </div>
        <ClickSpark>
          <button
            onClick={() =>
              api.saveDiscord({ embed_join: discordConfig?.embed_join, embed_leave: discordConfig?.embed_leave }).then(() => {
                toast('Embeds saved', 'success');
                api.discord().then(setDiscordConfig);
              })
            }
            className="mt-4 px-4 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-medium flex items-center gap-2"
          >
            <Icons.Save /> Save embeds
          </button>
        </ClickSpark>
      </Card>

      <Card title="Discord Welcome" subtitle="Send embed when users join your Discord server" className="star-border bento-cell-wide" titleIcon={<Icons.Globe />}>
        <label className="flex items-center gap-2 text-sm text-surface-400 cursor-pointer mb-3">
          <input
            type="checkbox"
            checked={discordConfig?.discord_welcome_enabled ?? false}
            onChange={(e) =>
              api.saveDiscord({ discord_welcome_enabled: e.target.checked }).then(() => {
                api.discord().then(setDiscordConfig);
                toast('Saved', 'success');
              })
            }
            className="rounded border-surface-600 bg-surface-800 text-brand-500"
          />
          Enable Welcome messages
        </label>
        <div className="mb-4">
          <label className="block text-xs text-surface-500 mb-1">Welcome Channel ID</label>
          <input
            type="text"
            value={discordConfig?.discord_welcome_channel_id ?? ''}
            onChange={(e) => setDiscordConfig((c) => ({ ...c, discord_welcome_channel_id: e.target.value }))}
            placeholder="e.g. 123456789012345678"
            className="w-full px-4 py-2.5 rounded-xl bg-surface-800 border border-surface-700 text-surface-100"
          />
        </div>
        <p className="text-xs text-surface-500 mb-2">Use variables: {'{username}'}, {'{display_name}'}, {'{user_id}'}, {'{avatar_url}'}, {'{timestamp}'}</p>
        <DiscordEmbedBuilder
          title="Welcome embed"
          template={discordConfig?.discord_welcome_embed || null}
          embedTags={discordConfig?.embed_tags || {}}
          onChange={(embed) => setDiscordConfig((c) => ({ ...c, discord_welcome_embed: embed }))}
        />
        <ClickSpark>
          <button
            onClick={() =>
              api.saveDiscord({
                discord_welcome_enabled: discordConfig?.discord_welcome_enabled,
                discord_welcome_channel_id: discordConfig?.discord_welcome_channel_id,
                discord_welcome_embed: discordConfig?.discord_welcome_embed,
              }).then(() => {
                toast('Welcome config saved', 'success');
                api.discord().then(setDiscordConfig);
              })
            }
            className="mt-4 px-4 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-medium flex items-center gap-2"
          >
            <Icons.Save /> Save Welcome
          </button>
        </ClickSpark>
      </Card>
    </div>
  );
}
