import { useState, useEffect } from 'react';
import { ExternalLink, Star, Plus, X, Loader, MapPin, Maximize2, LayoutGrid, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import { fetchProperties } from '../mockData';
import type { Property, PropertyRating } from '../types';

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

// URL入力モーダル（スクレイピング呼び出し）
function AddPropertyModal({ onClose, onAdd }: { onClose: () => void; onAdd: (p: Property) => void }) {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [manual, setManual] = useState(false);
  const [form, setForm] = useState<Omit<Property, 'id' | 'ratings' | 'mustTagIds'>>({
    name: '', rent: 0, layout: '', sqm: 0, url: '', address: '', metAt: new Date().toISOString().slice(0, 10),
  });
  const [error, setError] = useState('');

  const fetchFromUrl = async () => {
    if (!url.trim()) return;
    setLoading(true); setError('');
    try {
      const gasUrl = import.meta.env.VITE_GAS_URL;
      if (gasUrl) {
        const res = await fetch(`${gasUrl}?action=scrapeProperty&url=${encodeURIComponent(url)}`, { redirect: 'follow' });
        const json = await res.json() as { data?: typeof form; error?: string };
        if (json.error) throw new Error(json.error);
        if (json.data) { setForm({ ...json.data, url }); setManual(true); return; }
      }
      // URLのドメインからサイト名を推測してプレースホルダーとして使う
      let guessedName = '';
      try {
        const host = new URL(url).hostname;
        if (host.includes('suumo')) guessedName = 'SUUMO物件';
        else if (host.includes('athome')) guessedName = 'アットホーム物件';
        else if (host.includes('homes') || host.includes('lifull')) guessedName = 'LIFULL HOME\'S物件';
        else if (host.includes('chintai')) guessedName = 'CHINTAI物件';
      } catch { /* invalid URL */ }
      setForm(f => ({ ...f, name: guessedName, url, metAt: new Date().toISOString().slice(0, 10) }));
      setManual(true);
    } catch (e) {
      setError('読み取りに失敗しました。手動で入力してください。');
      setForm(f => ({ ...f, url }));
      setManual(true);
    } finally { setLoading(false); }
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
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-5 space-y-4" onPointerDown={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-navy-900">物件を追加</h3>
          <button onPointerDown={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"><X size={18} /></button>
        </div>

        {/* URL入力 */}
        {!manual && (
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-slate-500 mb-1">SUUMO / アットホームのURL</label>
              <div className="flex gap-2">
                <input type="url" value={url} onChange={e => setUrl(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && fetchFromUrl()}
                  className="flex-1 text-sm px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-navy-400"
                  placeholder="https://suumo.jp/chintai/..." />
                <button onPointerDown={e => { e.preventDefault(); fetchFromUrl(); }} disabled={loading || !url.trim()}
                  className="flex items-center gap-1.5 px-3 py-2 bg-navy-900 text-white text-xs font-semibold rounded-xl disabled:opacity-50 hover:bg-navy-800 transition-colors">
                  {loading ? <Loader size={13} className="animate-spin" /> : <Sparkles size={13} />}
                  {loading ? '取得中' : '自動入力'}
                </button>
              </div>
            </div>
            {error && <p className="text-xs text-red-500">{error}</p>}
            <button onPointerDown={() => setManual(true)}
              className="w-full text-xs text-slate-400 hover:text-slate-600 py-2 border border-dashed border-slate-200 rounded-xl transition-colors">
              手動で入力する
            </button>
          </div>
        )}

        {/* 手動入力フォーム */}
        {manual && (
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-slate-500 mb-1">物件名 *</label>
              <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                autoFocus
                className="w-full text-sm px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-navy-400" placeholder="例: ○○マンション" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-500 mb-1">家賃（円）</label>
                <input type="number" value={form.rent || ''} onChange={e => setForm(f => ({ ...f, rent: Number(e.target.value) }))}
                  className="w-full text-sm px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-navy-400" placeholder="200000" />
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
                className="w-full text-sm px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-navy-400" placeholder="渋谷区○○1丁目" />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">物件URL</label>
              <input type="url" value={form.url} onChange={e => setForm(f => ({ ...f, url: e.target.value }))}
                className="w-full text-sm px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-navy-400" placeholder="https://..." />
            </div>
            <button onPointerDown={e => { e.preventDefault(); submit(); }}
              className="w-full bg-navy-900 text-white text-sm font-semibold py-3 rounded-xl hover:bg-navy-800 transition-colors">
              追加する
            </button>
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
