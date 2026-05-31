import { useState, useEffect, useRef } from 'react';
import { ExternalLink, Star, Plus, X, Loader, MapPin, Maximize2, LayoutGrid, ChevronDown, ChevronUp, Sparkles, ImagePlus, Settings } from 'lucide-react';
import { Link } from 'react-router-dom';
import { fetchProperties } from '../mockData';
import type { Property, PropertyRating } from '../types';
import { getGeminiApiKey } from './SettingsPage';

const PARTNERS = [
  { key: 'akihiro' as const, label: 'あきひろ' },
  { key: 'akari'   as const, label: 'あかり'   },
];

function StarInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <span className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star key={i} size={18}
          className={`cursor-pointer transition-transform active:scale-110 ${i <= value ? 'text-amber-400 fill-amber-400' : 'text-slate-200 fill-slate-200'}`}
          onClick={() => onChange(i)} />
      ))}
    </span>
  );
}

function ScoreBar({ score }: { score: number }) {
  const color = score >= 80 ? 'bg-emerald-500' : score >= 50 ? 'bg-amber-400' : 'bg-rose-400';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-700 ${color}`} style={{ width: `${score}%` }} />
      </div>
      <span className="text-xs font-bold tabular-nums w-9 text-right">{score}%</span>
    </div>
  );
}

type FormData = Omit<Property, 'id' | 'ratings' | 'mustTagIds'>;

function AddPropertyModal({ onClose, onAdd }: { onClose: () => void; onAdd: (p: Property) => void }) {
  const [step, setStep]       = useState<'top' | 'form'>('top');
  const [loading, setLoading] = useState(false);
  const [previewSrc, setPreviewSrc] = useState('');
  const [form, setForm]       = useState<FormData>({
    name: '', rent: 0, layout: '', sqm: 0, url: '', address: '', metAt: new Date().toISOString().slice(0, 10),
  });
  const [error, setError]     = useState('');
  const fileInputRef          = useRef<HTMLInputElement>(null);

  const analyzeImage = async (file: File) => {
    setLoading(true); setError('');
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl  = reader.result as string;
      const base64   = dataUrl.split(',')[1];
      const mimeType = file.type || 'image/jpeg';
      setPreviewSrc(dataUrl);
      try {
        const apiKey = getGeminiApiKey();
        if (!apiKey) throw new Error('no_key');

        const prompt = [
          'この画像は不動産サイト（SUUMO・アットホーム等）の物件ページのスクリーンショットです。',
          '以下のJSON形式で物件情報を抽出してください。値が読み取れない場合は空文字にしてください。',
          '{ "name": "物件名", "rent": 家賃の数値(円単位・管理費除く), "layout": "間取り", "sqm": 専有面積の数値(m²), "address": "住所", "note": "特記事項" }',
          'JSONのみ返してください。説明文は不要です。',
        ].join('\n');

        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [
                { text: prompt },
                { inline_data: { mime_type: mimeType, data: base64 } },
              ]}],
              generationConfig: { temperature: 0 },
            }),
          }
        );
        if (!res.ok) throw new Error(`Gemini error: ${res.status}`);
        const json = await res.json() as { candidates: { content: { parts: { text: string }[] } }[] };
        const text = json.candidates[0].content.parts[0].text;
        const m    = text.match(/\{[\s\S]*\}/);
        if (!m) throw new Error('JSON not found');
        const data = JSON.parse(m[0]);
        setForm(f => ({
          ...f,
          name:    data.name    || '',
          rent:    Number(data.rent)  || 0,
          layout:  data.layout  || '',
          sqm:     Number(data.sqm)   || 0,
          address: data.address || '',
        }));
        setStep('form');
      } catch (e) {
        if (e instanceof Error && e.message === 'no_key') {
          setError('no_key');
        } else {
          setError(e instanceof Error ? e.message : '解析に失敗しました');
        }
        setStep('form');
      } finally { setLoading(false); }
    };
    reader.readAsDataURL(file);
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) analyzeImage(file);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) analyzeImage(file);
  };

  const submit = () => {
    if (!form.name.trim()) return;
    onAdd({ ...form, id: `p${Date.now()}`, ratings: [
      { userId: 'akihiro', stars: 0, compromise: '' },
      { userId: 'akari',   stars: 0, compromise: '' },
    ], mustTagIds: [] });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onPointerDown={e => { if (e.currentTarget === e.target) onClose(); }}>
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-5 space-y-4 max-h-[90vh] overflow-y-auto" onPointerDown={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-navy-900">物件を追加</h3>
          <button onPointerDown={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"><X size={18} /></button>
        </div>

        {/* トップ: スクショ or 手動 */}
        {step === 'top' && (
          <div className="space-y-3">
            {/* スクショアップロードゾーン */}
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={onFileChange} />
            <div
              onPointerDown={() => fileInputRef.current?.click()}
              onDragOver={e => e.preventDefault()}
              onDrop={onDrop}
              className="flex flex-col items-center justify-center gap-3 py-8 border-2 border-dashed border-navy-200 rounded-2xl bg-navy-50 cursor-pointer hover:bg-navy-100 active:bg-navy-100 transition-colors"
            >
              {loading ? (
                <>
                  <Loader size={28} className="text-navy-400 animate-spin" />
                  <p className="text-sm font-semibold text-navy-700">Geminiが解析中...</p>
                  <p className="text-xs text-navy-400">物件情報を読み取っています</p>
                </>
              ) : (
                <>
                  <div className="w-14 h-14 rounded-2xl bg-navy-100 flex items-center justify-center">
                    <ImagePlus size={24} className="text-navy-500" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold text-navy-800">スクショをアップロード</p>
                    <p className="text-xs text-navy-400 mt-0.5">タップして選択、またはドラッグ＆ドロップ</p>
                  </div>
                  <span className="flex items-center gap-1 text-xs text-navy-600 bg-navy-200 px-3 py-1 rounded-full font-medium">
                    <Sparkles size={11} /> Geminiが自動で読み取ります
                  </span>
                </>
              )}
            </div>
            {error === 'no_key' ? (
              <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5">
                <Settings size={13} className="shrink-0" />
                <span>Gemini APIキーが未設定です。</span>
                <Link to="/settings" className="underline font-semibold shrink-0">設定する →</Link>
              </div>
            ) : error ? (
              <p className="text-xs text-red-500">{error}</p>
            ) : null}
            <button onPointerDown={() => setStep('form')}
              className="w-full text-xs text-slate-400 hover:text-slate-600 py-2 border border-dashed border-slate-200 rounded-xl transition-colors">
              手動で入力する
            </button>
          </div>
        )}

        {/* フォーム（スクショ解析後 or 手動） */}
        {step === 'form' && (
          <div className="space-y-3">
            {/* 解析したスクショのサムネイル */}
            {previewSrc && (
              <div className="relative rounded-xl overflow-hidden border border-slate-100">
                <img src={previewSrc} alt="スクショ" className="w-full h-28 object-cover object-top" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                <span className="absolute bottom-2 left-2 text-[10px] text-white bg-black/40 px-2 py-0.5 rounded-full">
                  Geminiで解析済み
                </span>
              </div>
            )}
            {error && error !== 'no_key' && <p className="text-xs text-red-500">{error}</p>}
            <div>
              <label className="block text-xs text-slate-500 mb-1">物件名 *</label>
              <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                autoFocus
                className="w-full text-sm px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-navy-400" placeholder="例: ガーデニエール砧WEST" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-500 mb-1">家賃（円）</label>
                <input type="number" value={form.rent || ''} onChange={e => setForm(f => ({ ...f, rent: Number(e.target.value) }))}
                  className="w-full text-sm px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-navy-400" placeholder="260000" />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">間取り</label>
                <input type="text" value={form.layout} onChange={e => setForm(f => ({ ...f, layout: e.target.value }))}
                  className="w-full text-sm px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-navy-400" placeholder="2LDK" />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">専有面積（㎡）</label>
                <input type="number" value={form.sqm || ''} onChange={e => setForm(f => ({ ...f, sqm: Number(e.target.value) }))}
                  className="w-full text-sm px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-navy-400" placeholder="55" />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">見学日</label>
                <input type="date" value={form.metAt} onChange={e => setForm(f => ({ ...f, metAt: e.target.value }))}
                  className="w-full text-sm px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-navy-400" />
              </div>
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">住所</label>
              <input type="text" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                className="w-full text-sm px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-navy-400" placeholder="世田谷区砧" />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">物件URL</label>
              <input type="url" value={form.url} onChange={e => setForm(f => ({ ...f, url: e.target.value }))}
                className="w-full text-sm px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-navy-400" placeholder="https://..." />
            </div>
            <div className="flex gap-2">
              <button onPointerDown={() => setStep('top')}
                className="px-4 py-3 text-sm text-slate-500 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
                戻る
              </button>
              <button onPointerDown={e => { e.preventDefault(); submit(); }}
                className="flex-1 bg-navy-900 text-white text-sm font-semibold py-3 rounded-xl hover:bg-navy-800 transition-colors">
                追加する
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function PropertyCard({ property, mustCount, onDelete }: { property: Property; mustCount: number; onDelete: (id: string) => void }) {
  const [expanded, setExpanded] = useState(false);
  const [ratings, setRatings] = useState<PropertyRating[]>(property.ratings);

  const score = mustCount === 0 ? 0 : Math.round((property.mustTagIds.length / mustCount) * 100);

  const avg = ratings.reduce((s, r) => s + r.stars, 0) / (ratings.filter(r => r.stars > 0).length || 1);

  const updateRating = (userId: 'akihiro' | 'akari', field: 'stars' | 'compromise', val: string | number) => {
    setRatings(prev => prev.map(r => r.userId === userId ? { ...r, [field]: val } : r));
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      {/* カードヘッダー */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-navy-900 text-base leading-snug">{property.name}</h3>
            {property.address && (
              <p className="flex items-center gap-1 mt-0.5 text-xs text-slate-400">
                <MapPin size={11} />{property.address}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {property.url && (
              <a href={property.url} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-navy-700 bg-navy-50 border border-navy-100 rounded-lg hover:bg-navy-100 transition-colors">
                <ExternalLink size={12} /> 物件を見る
              </a>
            )}
            <button onPointerDown={() => onDelete(property.id)}
              className="p-1.5 text-slate-300 hover:text-red-400 hover:bg-red-50 rounded-lg transition-colors">
              <X size={14} />
            </button>
          </div>
        </div>

        {/* スペック */}
        <div className="mt-3 flex flex-wrap gap-2">
          <span className="flex items-center gap-1 px-3 py-1.5 bg-navy-900 text-white text-sm font-bold rounded-xl">
            {(property.rent / 10000).toFixed(1)}<span className="text-xs font-normal opacity-70">万円</span>
          </span>
          <span className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-100 text-sm font-semibold text-slate-700 rounded-xl">
            <LayoutGrid size={13} className="text-slate-400" />{property.layout}
          </span>
          <span className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-100 text-sm font-semibold text-slate-700 rounded-xl">
            <Maximize2 size={13} className="text-slate-400" />{property.sqm}㎡
          </span>
        </div>

        {/* MUST適合率 */}
        {mustCount > 0 && (
          <div className="mt-3">
            <div className="flex justify-between mb-1">
              <span className="text-xs text-slate-500">MUST適合率</span>
              <span className="text-xs text-slate-400">{property.mustTagIds.length}/{mustCount}</span>
            </div>
            <ScoreBar score={score} />
          </div>
        )}

        {/* 2人の平均評価 */}
        <div className="mt-3 flex items-center gap-2">
          <span className="text-xs text-slate-500">2人の平均</span>
          <div className="flex gap-0.5">
            {[1,2,3,4,5].map(i => (
              <Star key={i} size={14} className={i <= Math.round(avg) ? 'text-amber-400 fill-amber-400' : 'text-slate-200 fill-slate-200'} />
            ))}
          </div>
          <span className="text-xs font-bold text-slate-600">{avg > 0 ? avg.toFixed(1) : '—'}</span>
        </div>
      </div>

      {/* 評価入力（展開） */}
      <button onPointerDown={() => setExpanded(v => !v)}
        className="w-full flex items-center justify-center gap-1.5 py-2.5 text-xs text-slate-400 hover:text-slate-600 border-t border-slate-100 hover:bg-slate-50 transition-colors">
        {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        {expanded ? '閉じる' : '2人の評価を入力'}
      </button>

      {expanded && (
        <div className="px-4 pb-4 pt-3 border-t border-slate-50 space-y-4">
          {PARTNERS.map(({ key, label }) => {
            const r = ratings.find(x => x.userId === key);
            return (
              <div key={key}>
                <p className="text-xs font-bold text-slate-600 mb-2">{label}</p>
                <StarInput value={r?.stars ?? 0} onChange={v => updateRating(key, 'stars', v)} />
                <input type="text" value={r?.compromise ?? ''} onChange={e => updateRating(key, 'compromise', e.target.value)}
                  className="mt-2 w-full text-xs px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-navy-400"
                  placeholder="気になる点・妥協点（任意）" />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function PropertiesPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const MUST_COUNT = 7; // mockTags のMUST件数

  useEffect(() => {
    fetchProperties().then(data => { setProperties(data); setLoading(false); });
  }, []);

  const sorted = [...properties].sort((a, b) => b.mustTagIds.length - a.mustTagIds.length);

  return (
    <div className="space-y-6">
      {showAdd && (
        <AddPropertyModal
          onClose={() => setShowAdd(false)}
          onAdd={p => { setProperties(prev => [p, ...prev]); setShowAdd(false); }}
        />
      )}

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy-900 tracking-tight">物件トラッカー</h1>
          <p className="mt-1 text-sm text-slate-500">MUST適合率 × 2人の評価で比較</p>
        </div>
        <button onPointerDown={() => setShowAdd(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-navy-900 text-white text-sm font-semibold rounded-xl hover:bg-navy-800 transition-colors">
          <Plus size={15} /> 追加
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 gap-2 text-slate-400">
          <Loader size={16} className="animate-spin" /> 読み込み中...
        </div>
      ) : (
        <>
          <p className="text-xs text-slate-400">{properties.length}件 · MUST適合率順</p>
          <div className="space-y-4">
            {sorted.map(p => (
              <PropertyCard key={p.id} property={p} mustCount={MUST_COUNT}
                onDelete={id => setProperties(prev => prev.filter(p => p.id !== id))} />
            ))}
          </div>
          <button onPointerDown={() => setShowAdd(true)}
            className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-slate-200 rounded-2xl text-sm text-slate-400 hover:border-navy-300 hover:text-navy-600 transition-colors">
            <Plus size={15} /> 物件を追加
          </button>
        </>
      )}
    </div>
  );
}
