import { useState } from 'react';
import { Eye, EyeOff, Check } from 'lucide-react';

export default function SettingsPage() {
  const [apiKey, setApiKey]     = useState(() => localStorage.getItem('gemini_api_key') ?? '');
  const [show, setShow]         = useState(false);
  const [saved, setSaved]       = useState(false);

  const save = () => {
    localStorage.setItem('gemini_api_key', apiKey.trim());
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy-900 tracking-tight">設定</h1>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-3">
        <h2 className="font-semibold text-navy-900">Gemini APIキー</h2>
        <p className="text-xs text-slate-500">スクショから物件情報を自動読み取りするために使います。各自のブラウザに保存されます。</p>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              type={show ? 'text' : 'password'}
              value={apiKey}
              onChange={e => setApiKey(e.target.value)}
              placeholder="AIza..."
              className="w-full text-sm px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-navy-400 pr-10"
            />
            <button
              onPointerDown={() => setShow(v => !v)}
              className="absolute right-2 top-1/2 -translate-y-2 text-slate-400 hover:text-slate-600"
            >
              {show ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          <button
            onPointerDown={save}
            className="flex items-center gap-1.5 px-4 py-2 bg-navy-900 text-white text-sm font-semibold rounded-xl hover:bg-navy-800 transition-colors"
          >
            {saved ? <><Check size={14} /> 保存済み</> : '保存'}
          </button>
        </div>
      </div>
    </div>
  );
}
