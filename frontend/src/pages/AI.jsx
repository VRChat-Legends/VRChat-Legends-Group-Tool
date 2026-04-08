import { useState, useEffect } from 'react';
import { api } from '../api/client';
import Card from '../components/Card';
import { useToast } from '../components/Toast';
import ClickSpark from '../components/ClickSpark';
import { Icons } from '../components/Icons';

export default function AI() {
  const [config, setConfig] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [localOpenAIKey, setLocalOpenAIKey] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [negativePrompt, setNegativePrompt] = useState('');
  const toast = useToast();

  useEffect(() => {
    Promise.all([api.get('/api/ai-config'), api.discord()]).then(([cfg, discord]) => {
      setConfig({ ...(cfg || {}), openai_key_masked: discord?.openai_api_key_masked });
      setSystemPrompt((cfg && cfg.system_prompt) || '');
      setNegativePrompt((cfg && cfg.negative_prompt) || '');
    }).catch(() => setConfig({
      desktop_enabled: false,
      discord_enabled: false,
      shared_memory: false,
      file_access: false,
      memory_limit: 50,
    }));
  }, []);

  const saveConfig = (payload) => {
    api.post('/api/ai-config', payload)
      .then(setConfig)
      .then(() => toast('Saved', 'success'))
      .catch((e) => toast(e.message, 'error'));
  };

  if (!config) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <p className="text-surface-500">Loading…</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in">
      <Card title="AI Assistant" subtitle="Unified AI for Desktop and Discord" className="star-border bento-cell-wide" titleIcon={<Icons.Chatbox />}>
        <div className="space-y-4">
          <div>
            <label className="block text-xs text-surface-500 mb-1">OpenAI API Key (required for chat)</label>
            <div className="flex gap-2">
              <input type="password" value={localOpenAIKey} onChange={(e) => setLocalOpenAIKey(e.target.value)} placeholder={config?.openai_key_masked ? '•••••••• (enter new to replace)' : 'sk-...'} className="flex-1 px-4 py-2.5 rounded-xl bg-surface-800 border border-surface-700 text-surface-100 font-mono" />
              <ClickSpark><button onClick={() => { if (!localOpenAIKey) return; api.saveDiscord({ openai_api_key: localOpenAIKey }).then(() => { setLocalOpenAIKey(''); api.get('/api/ai-config').then(() => {}); api.discord().then((d) => setConfig((c) => ({ ...c, openai_key_masked: d?.openai_api_key_masked }))); toast('OpenAI API key saved', 'success'); }); }} className="px-4 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-medium">Save</button></ClickSpark>
            </div>
          </div>
          <div>
            <label className="block text-xs text-surface-500 mb-1">System prompt (default instructions for AI)</label>
            <textarea value={systemPrompt} onChange={(e) => setSystemPrompt(e.target.value)} onBlur={() => api.post('/api/ai-config', { system_prompt: systemPrompt }).then(() => toast('System prompt saved', 'success'))} rows={2} placeholder="e.g. You are a helpful assistant..." className="w-full px-4 py-2.5 rounded-xl bg-surface-800 border border-surface-700 text-surface-100" />
          </div>
          <div>
            <label className="block text-xs text-surface-500 mb-1">Negative prompt (what AI must NOT do)</label>
            <textarea value={negativePrompt} onChange={(e) => setNegativePrompt(e.target.value)} onBlur={() => api.post('/api/ai-config', { negative_prompt: negativePrompt }).then(() => toast('Negative prompt saved', 'success'))} rows={2} placeholder="e.g. Never @everyone, never share secrets..." className="w-full px-4 py-2.5 rounded-xl bg-surface-800 border border-surface-700 text-surface-100" />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={config.desktop_enabled ?? false}
              onChange={(e) => saveConfig({ desktop_enabled: e.target.checked })}
              className="rounded border-surface-600 bg-surface-800 text-brand-500"
            />
            <span className="text-surface-200">Desktop AI (chat in this tab)</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={config.discord_enabled ?? false}
              onChange={(e) => saveConfig({ discord_enabled: e.target.checked })}
              className="rounded border-surface-600 bg-surface-800 text-brand-500"
            />
            <span className="text-surface-200">Discord AI (respond in Discord)</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={config.shared_memory ?? false}
              onChange={(e) => saveConfig({ shared_memory: e.target.checked })}
              className="rounded border-surface-600 bg-surface-800 text-brand-500"
            />
            <span className="text-surface-200">Shared memory (Desktop + Discord)</span>
          </label>
          <div>
            <label className="block text-sm text-surface-500 mb-1">Memory limit (messages)</label>
            <input
              type="number"
              value={config.memory_limit ?? 50}
              onChange={(e) => setConfig((c) => ({ ...c, memory_limit: parseInt(e.target.value, 10) || 50 }))}
              onBlur={() => saveConfig({ memory_limit: config.memory_limit })}
              min={5}
              max={200}
              className="w-24 px-3 py-2 rounded-lg bg-surface-800 border border-surface-600 text-surface-100"
              title="How many past messages to send for context"
            />
          </div>
          <div className="rounded-xl p-4 bg-surface-800/50 border border-surface-700">
            <p className="text-xs text-surface-500 mb-2">Token usage</p>
            <p className="text-sm text-surface-200">Today: <strong>{config.daily_tokens ?? 0}</strong> tokens</p>
            <div className="flex items-center gap-2 mt-2">
              <label className="text-xs text-surface-500">Daily limit (0 = none)</label>
              <input
                type="number"
                value={config.daily_limit ?? 0}
                onChange={(e) => setConfig((c) => ({ ...c, daily_limit: parseInt(e.target.value, 10) || 0 }))}
                onBlur={() => saveConfig({ daily_limit: config.daily_limit })}
                min={0}
                className="w-24 px-3 py-2 rounded-lg bg-surface-800 border border-surface-600 text-surface-100"
                title="Max tokens per day; 0 = unlimited"
              />
            </div>
          </div>
          <div className="border border-amber-500/30 rounded-xl p-4 bg-amber-500/5">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={config.file_access ?? false}
                onChange={(e) => saveConfig({ file_access: e.target.checked })}
                className="rounded border-surface-600 bg-surface-800 text-amber-500"
              />
              <span className="text-amber-200 font-medium">File access (danger)</span>
            </label>
            <p className="text-xs text-surface-500 mt-1">Allow AI to read/write files. Use with caution.</p>
          </div>
        </div>
      </Card>

      {config.desktop_enabled && (
        <Card title="Chat" subtitle="AI Assistant (requires OpenAI API key above)" className="star-border bento-cell-wide">
          <div className="flex flex-col gap-4">
            <div className="h-64 overflow-y-auto rounded-xl bg-surface-800/50 border border-surface-700 p-4 space-y-2">
              {messages.length === 0 && (
                <p className="text-surface-500 text-sm">Send a message to start. OpenAI API key must be set above.</p>
              )}
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] px-3 py-2 rounded-lg text-sm ${m.role === 'user' ? 'bg-brand-500/30 text-surface-100' : 'bg-surface-700 text-surface-200'}`}>
                    {m.content}
                  </div>
                </div>
              ))}
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!input.trim() || loading) return;
                const userMsg = input.trim();
                setInput('');
                setMessages((prev) => [...prev, { role: 'user', content: userMsg }]);
                setLoading(true);
                api.post('/api/ai-chat', { message: userMsg, history: messages })
                  .then((r) => {
                    setMessages((prev) => [...prev, { role: 'assistant', content: r.reply || 'No response.' }]);
                    if (r.usage?.daily_total != null) setConfig((c) => ({ ...c, daily_tokens: r.usage.daily_total }));
                  })
                  .catch((err) => {
                    setMessages((prev) => [...prev, { role: 'assistant', content: `Error: ${err.message}` }]);
                  })
                  .finally(() => setLoading(false));
              }}
              className="flex gap-2"
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type a message…"
                disabled={loading}
                className="flex-1 px-4 py-2.5 rounded-xl bg-surface-800 border border-surface-700 text-surface-100"
              />
              <ClickSpark>
                <button type="submit" disabled={loading} className="px-4 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-medium">
                  Send
                </button>
              </ClickSpark>
            </form>
          </div>
        </Card>
      )}
    </div>
  );
}
