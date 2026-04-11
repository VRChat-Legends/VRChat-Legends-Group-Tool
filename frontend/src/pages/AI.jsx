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
  const [localGeminiKey, setLocalGeminiKey] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [negativePrompt, setNegativePrompt] = useState('');
  const toast = useToast();

  useEffect(() => {
    Promise.all([api.get('/api/ai-config'), api.discord()]).then(([cfg, discord]) => {
      setConfig({ ...(cfg || {}), gemini_key_masked: discord?.gemini_api_key_masked });
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
    <div className="space-y-6 animate-in w-full">
      <Card title="AI Assistant" subtitle="Unified AI for Desktop and Discord" className="star-border bento-cell-wide" titleIcon={<Icons.Chatbox />}>
        <div className="space-y-4">
          <div>
            <label className="block text-xs text-surface-500 mb-1">Google Gemini API Key (required for chat)</label>
            <div className="flex gap-2">
              <input type="password" value={localGeminiKey} onChange={(e) => setLocalGeminiKey(e.target.value)} placeholder={config?.gemini_key_masked ? '•••••••• (enter new to replace)' : 'AIza...'} className="flex-1 px-4 py-2.5 rounded-xl bg-surface-800 border border-surface-700 text-surface-100 font-mono" />
              <ClickSpark><button onClick={() => { if (!localGeminiKey) return; api.saveDiscord({ gemini_api_key: localGeminiKey }).then(() => { setLocalGeminiKey(''); api.get('/api/ai-config').then(() => {}); api.discord().then((d) => setConfig((c) => ({ ...c, gemini_key_masked: d?.gemini_api_key_masked }))); toast('Gemini API key saved', 'success'); }); }} className="px-4 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-medium">Save</button></ClickSpark>
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
        <Card title="Chat" subtitle="AI Assistant (powered by Google Gemini)" className="star-border bento-cell-wide">
          <div className="flex flex-col gap-4">
            {/* Chat header with clear */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-xs text-surface-500"><i className="fas fa-microchip mr-1" />Gemini 2.0 Flash</span>
                <span className="text-xs text-surface-500">{messages.length} messages</span>
              </div>
              {messages.length > 0 && (
                <button type="button" onClick={() => setMessages([])} className="text-xs text-surface-500 hover:text-red-400 transition-colors">
                  <i className="fas fa-trash mr-1" />Clear chat
                </button>
              )}
            </div>
            <div className="h-80 overflow-y-auto rounded-xl bg-surface-800/50 border border-surface-700 p-4 space-y-2">
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
                  <i className="fas fa-robot text-3xl text-surface-600" />
                  <p className="text-surface-500 text-sm">Send a message to start chatting with Gemini.</p>
                  <p className="text-surface-600 text-xs">Gemini API key must be set above.</p>
                </div>
              )}
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] px-3 py-2 rounded-lg text-sm whitespace-pre-wrap ${m.role === 'user' ? 'bg-brand-500/30 text-surface-100' : 'bg-surface-700 text-surface-200'}`}>
                    {m.content}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="px-3 py-2 rounded-lg bg-surface-700 text-surface-400 text-sm animate-pulse">Thinking…</div>
                </div>
              )}
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
                <button type="submit" disabled={loading} className="px-4 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-medium disabled:opacity-50">
                  {loading ? <i className="fas fa-spinner fa-spin" /> : 'Send'}
                </button>
              </ClickSpark>
            </form>
          </div>
        </Card>
      )}

      {/* AI Context Info */}
      <Card title="AI Context" subtitle="What the AI knows about during conversations" titleIcon={<i className="fas fa-brain text-brand-400 w-5 text-center" />}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="p-3 rounded-xl bg-surface-800/50 border border-surface-700/40">
            <p className="text-xs text-surface-500 mb-1"><i className="fas fa-users mr-1" />Lobby context</p>
            <p className="text-sm text-surface-300">Sees who is in your VRChat lobby (names, count) when responding.</p>
          </div>
          <div className="p-3 rounded-xl bg-surface-800/50 border border-surface-700/40">
            <p className="text-xs text-surface-500 mb-1"><i className="fas fa-globe mr-1" />World context</p>
            <p className="text-sm text-surface-300">Knows the current world name, author, description, and capacity.</p>
          </div>
          <div className="p-3 rounded-xl bg-surface-800/50 border border-surface-700/40">
            <p className="text-xs text-surface-500 mb-1"><i className="fas fa-clock-rotate-left mr-1" />Conversation history</p>
            <p className="text-sm text-surface-300">Remembers up to {config.memory_limit ?? 50} messages per conversation session.</p>
          </div>
          <div className="p-3 rounded-xl bg-surface-800/50 border border-surface-700/40">
            <p className="text-xs text-surface-500 mb-1"><i className="fas fa-shield-halved mr-1" />Prompt control</p>
            <p className="text-sm text-surface-300">System + negative prompts guide behavior. Negative prompt sets hard limits.</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
