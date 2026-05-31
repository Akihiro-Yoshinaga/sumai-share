import { useState } from 'react';
import { Check, Eye, EyeOff, Loader } from 'lucide-react';

const STORAGE_KEY = 'gemini_api_key';

export function getGeminiApiKey(): string {
  return localStorage.getItem(STORAGE_KEY) ?? '';
}

export default function SettingsPage() {
  const [key, setKey]         = useState(getGeminiApiKey);
  const [show, setShow]       = useState(false);
  const [saved, setSaved]     = useState(false);
  const [models, setModels]   = useState<string[]>([]);
  const [checking, setChecking] = useState(false);
  const [checkErr, setCheckErr] = useState('');

  const checkModels = async () => {
    if (!key.trim()) return;
    setChecking(true); setCheckErr(''); setModels([]);
    try {
      const res  = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key.trim()}`);
      const json = await res.json() as { models?: { name: string; supportedGenerationMethods?: string[] }[]; error?: { message: string } };
      if (json.error) throw new Error(json.error.message);
      const vision = (json.models ?? [])
        .filter(m => m.supportedGenerationMethods?.includes('generateContent'))
        .map(m => m.name);
      setModels(vision);
    } catch (e) {
      setCheckErr(e instanceof Error ? e.message : 'エラー');
    } finally { setChecking(false); }
  };

  const save = () => {
    localStorage.setItem(STORAGE_KEY, key.trim());
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy-900 tracking-tight">設定</h1>
        <p className="mt-1 text-sm text-slate-500">APIキーはこのデバイスにのみ保存されます</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
        <div>
          <h2 className="text-sm font-bold text-navy-900 mb-1">Gemini API キー</h2>
          <p className="text-xs text-slate-500 mb-3">
            物件スクショの自動読み取りに使います。
            <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer"
              className="text-navy-600 underline ml-1">Google AI Studioで取得</a>
          </p>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type={show ? 'text' : 'password'}
                value={key}
                onChange={e => setKey(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && save()}
                className="w-full text-sm px-3 py-2 pr-10 border border-slate-200 rounded-xl outline-none focus:border-navy-400 focus:ring-2 focus:ring-navy-100 font-mono"
                placeholder="AIza..."
              />
              <button
                type="button"
                onPointerDown={e => { e.preventDefault(); setShow(v => !v); }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {show ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            <button
              type="button"
              onPointerDown={e => { e.preventDefault(); save(); }}
              className={`flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-xl transition-all ${
                saved
                  ? 'bg-emerald-500 text-white'
                  : 'bg-navy-900 text-white hover:bg-navy-800'
              }`}
            >
              {saved ? <><Check size={14} /> 保存済み</> : '保存'}
            </button>
          </div>
        </div>

        <div className="text-xs text-slate-400 bg-slate-50 rounded-xl p-3 leading-relaxed">
          キーはブラウザの localStorage に保存されます。サーバーには送信されません。
          2人それぞれのデバイスで1回ずつ入力が必要です。
        </div>

        <button
          type="button"
          onPointerDown={e => { e.preventDefault(); checkModels(); }}
          disabled={!key.trim() || checking}
          className="flex items-center gap-1.5 text-xs text-slate-500 border border-slate-200 px-3 py-2 rounded-xl hover:bg-slate-50 disabled:opacity-40 transition-colors"
        >
          {checking ? <Loader size={12} className="animate-spin" /> : null}
          APIキーを確認・使えるモデルを表示
        </button>
        {checkErr && <p className="text-xs text-red-500">{checkErr}</p>}
        {models.length > 0 && (
          <div className="text-xs bg-slate-50 rounded-xl p-3 space-y-1">
            <p className="font-semibold text-slate-600 mb-2">使用可能なモデル（画像対応のものを選択）:</p>
            {models.filter(m => m.includes('flash') || m.includes('vision') || m.includes('pro')).map(m => (
              <p key={m} className="font-mono text-slate-500">{m}</p>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
