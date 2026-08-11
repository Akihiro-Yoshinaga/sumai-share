import { useState, useEffect, useRef } from 'react';
import { ExternalLink, Star, Plus, X, Loader, MapPin, Maximize2, LayoutGrid, ChevronDown, ChevronUp, Sparkles, ImagePlus, Pencil, Mail, Hand } from 'lucide-react';
import { apiGetProperties, apiSaveProperties, apiAnalyzePropertyImages, apiGetConditions } from '../api';
import type { Condition, Property, PropertyRating, PropertySource } from '../types';

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

// 取り込み元のバッジ。source 未設定の既存データは手動追加として扱う。
function SourceBadge({ source }: { source?: PropertySource }) {
  const isAuto = source === 'auto';
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold shrink-0 ${
      isAuto
        ? 'bg-sky-50 text-sky-700 border border-sky-200'
        : 'bg-slate-100 text-slate-600 border border-slate-200'
    }`}>
      {isAuto ? <><Mail size={10} /> 自動</> : <><Hand size={10} /> 手動</>}
    </span>
  );
}

type FormData = Omit<Property, 'id' | 'ratings' | 'mustTagIds' | 'source'>;

function AddPropertyModal({ onClose, onAdd, initialData }: { onClose: () => void; onAdd: (p: Property) => void; initialData?: Property }) {
  const isEdit = !!initialData;
  const [step, setStep]         = useState<'top' | 'form'>(isEdit ? 'form' : 'top');
  const [loading, setLoading]   = useState(false);
  const [previews, setPreviews] = useState<string[]>([]);
  const [form, setForm]         = useState<FormData>(
    isEdit
      ? { name: initialData.name, rent: initialData.rent, layout: initialData.layout, sqm: initialData.sqm, url: initialData.url, address: initialData.address, metAt: initialData.metAt }
      : { name: '', rent: 0, layout: '', sqm: 0, url: '', address: '', metAt: new Date().toISOString().slice(0, 10) }
  );
  const [error, setError]       = useState('');
  const fileInputRef            = useRef<HTMLInputElement>(null);

  const fileToBase64 = (file: File): Promise<{ base64: string; mimeType: string; dataUrl: string }> =>
    new Promise(resolve => {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        resolve({ base64: dataUrl.split(',')[1], mimeType: file.type || 'image/jpeg', dataUrl });
      };
      reader.readAsDataURL(file);
    });

  const analyzeImages = async (files: File[]) => {
    if (!files.length) return;
    setLoading(true); setError('');
    try {
      const converted = await Promise.all(files.map(fileToBase64));
      setPreviews(converted.map(c => c.dataUrl));

      const data = await apiAnalyzePropertyImages(converted.map(c => ({ base64: c.base64, mimeType: c.mimeType })));
      setForm(f => ({
        ...f,
        name:    data.name    || '',
        rent:    Number(data.rent)  || 0,
        layout:  data.layout  || '',
        sqm:     Number(data.sqm)   || 0,
        address: data.address || '',
        url:     f.url,
      }));
      setStep('form');
    } catch (e) {
      setError(e instanceof Error ? e.message : '解析に失敗しました');
      setStep('form');
    } finally { setLoading(false); }
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []).filter(f => f.type.startsWith('image/'));
    if (files.length) analyzeImages(files);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
    if (files.length) analyzeImages(files);
  };

  const submit = () => {
    if (!form.name.trim()) return;
    if (isEdit) {
      onAdd({ ...initialData!, ...form });
    } else {
      onAdd({ ...form, id: `p${Date.now()}`, ratings: [
        { userId: 'akihiro', stars: 0, compromise: '' },
        { userId: 'akari',   stars: 0, compromise: '' },
      ], mustTagIds: [], source: 'manual' });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onPointerDown={e => { if (e.currentTarget === e.target) onClose(); }}>
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-5 space-y-4 max-h-[90vh] overflow-y-auto" onPointerDown={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-navy-900">{isEdit ? '物件を編集' : '物件を追加'}</h3>
          <button onPointerDown={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"><X size={18} /></button>
        </div>

        {/* トップ: スクショ or 手動 */}
        {step === 'top' && (
          <div className="space-y-3">
            {/* スクショアップロードゾーン */}
            <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={onFileChange} />
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
                    <p className="text-xs text-navy-400 mt-0.5">複数枚まとめて選択OK · ドラッグ＆ドロップも可</p>
                  </div>
                  <span className="flex items-center gap-1 text-xs text-navy-600 bg-navy-200 px-3 py-1 rounded-full font-medium">
                    <Sparkles size={11} /> Geminiが自動で読み取ります
                  </span>
                </>
              )}
            </div>
            {error && <p className="text-xs text-red-500">{error}</p>}
            <button onPointerDown={() => setStep('form')}
              className="w-full text-xs text-slate-400 hover:text-slate-600 py-2 border border-dashed border-slate-200 rounded-xl transition-colors">
              手動で入力する
            </button>
          </div>
        )}

        {/* フォーム（スクショ解析後 or 手動） */}
        {step === 'form' && (
          <div className="space-y-3">
            {/* 解析したスクショのサムネイル（複数） */}
            {previews.length > 0 && (
              <div className={`grid gap-1.5 ${previews.length === 1 ? 'grid-cols-1' : 'grid-cols-3'}`}>
                {previews.map((src, i) => (
                  <div key={i} className="relative rounded-xl overflow-hidden border border-slate-100 aspect-video">
                    <img src={src} alt={`スクショ${i + 1}`} className="w-full h-full object-cover object-top" />
                  </div>
                ))}
                <div className="col-span-full">
                  <span className="text-[10px] text-slate-400 flex items-center gap-1">
                    <Sparkles size={9} /> {previews.length}枚をGeminiで解析済み
                  </span>
                </div>
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
                {isEdit ? '保存する' : '追加する'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function PropertyCard({ property, mustCount, mustConditions, onDelete, onRatingChange, onEdit }: { property: Property; mustCount: number; mustConditions: Condition[]; onDelete: (id: string) => void; onRatingChange: (id: string, ratings: PropertyRating[]) => void; onEdit: (p: Property) => void }) {
  const [expanded, setExpanded] = useState(false);

  const score = mustCount === 0 ? 0 : Math.round((property.mustTagIds.length / mustCount) * 100);

  const avg = property.ratings.reduce((s, r) => s + r.stars, 0) / (property.ratings.filter(r => r.stars > 0).length || 1);

  const updateRating = (userId: 'akihiro' | 'akari', field: 'stars' | 'compromise', val: string | number) => {
    const next = property.ratings.map(r => r.userId === userId ? { ...r, [field]: val } : r);
    onRatingChange(property.id, next);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      {/* カードヘッダー */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <SourceBadge source={property.source} />
              <h3 className="font-bold text-navy-900 text-base leading-snug">{property.name}</h3>
            </div>
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
            <button onPointerDown={() => onEdit(property)}
              className="p-1.5 text-slate-300 hover:text-navy-600 hover:bg-navy-50 rounded-lg transition-colors">
              <Pencil size={14} />
            </button>
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
            {mustConditions.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {mustConditions.map(c => {
                  const ok = property.mustTagIds.includes(c.id);
                  return (
                    <span key={c.id} title={ok ? '確認済み' : '未確認'}
                      className={`px-1.5 py-0.5 rounded text-[10px] border ${
                        ok
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-slate-50 text-slate-400 border-slate-200 line-through'
                      }`}>
                      {c.detail || c.item}
                    </span>
                  );
                })}
              </div>
            )}
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
            const r = property.ratings.find(x => x.userId === key);
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

type SortKey = 'must' | 'newest';

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'must',   label: '適合順' },
  { key: 'newest', label: '新着順' },
];

// 取り込み元での絞り込み。source 未設定の既存データは手動追加とみなす。
type SourceFilter = 'all' | 'manual' | 'auto';

const SOURCE_FILTERS: { key: SourceFilter; label: string }[] = [
  { key: 'all',    label: 'すべて' },
  { key: 'manual', label: '手動で追加' },
  { key: 'auto',   label: '自動取り込み' },
];

const isAutoProperty = (p: Property) => p.source === 'auto';

export default function PropertiesPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading]       = useState(true);
  const [showAdd, setShowAdd]       = useState(false);
  const [editTarget, setEditTarget] = useState<Property | null>(null);
  const [sortKey, setSortKey]       = useState<SortKey>('newest');
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>('all');
  // MUST条件はシート「物件リサーチ要件一覧」を唯一の参照元にする。
  // 以前は件数を直値7で持っていたため、シートを編集しても適合率が追従しなかった。
  const [mustConditions, setMustConditions] = useState<Condition[]>([]);
  const MUST_COUNT = mustConditions.length;

  const LS_KEY = 'sumai_properties';

  const saveProperties = (next: Property[]) => {
    setProperties(next);
    localStorage.setItem(LS_KEY, JSON.stringify(next));
    apiSaveProperties(next).catch(console.error);
  };

  useEffect(() => {
    const local = localStorage.getItem(LS_KEY);
    const localData: Property[] = local ? JSON.parse(local) : [];
    if (localData.length > 0) { setProperties(localData); setLoading(false); }
    apiGetProperties()
      .then(data => {
        if (data.length > 0) {
          setProperties(data);
          localStorage.setItem(LS_KEY, JSON.stringify(data));
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));

    apiGetConditions()
      .then(rows => setMustConditions(rows.filter(c => c.priority === 'MUST')))
      .catch(console.error);
  }, []);

  const autoCount   = properties.filter(isAutoProperty).length;
  const manualCount = properties.length - autoCount;

  const visible = properties.filter(p =>
    sourceFilter === 'all' ? true : sourceFilter === 'auto' ? isAutoProperty(p) : !isAutoProperty(p)
  );

  const sorted = [...visible].sort((a, b) => {
    if (sortKey === 'must')   return b.mustTagIds.length - a.mustTagIds.length;
    return b.id.localeCompare(a.id);
  });

  return (
    <div className="space-y-6">
      {showAdd && (
        <AddPropertyModal
          onClose={() => setShowAdd(false)}
          onAdd={p => {
            saveProperties([p, ...properties]);
            setShowAdd(false);
          }}
        />
      )}
      {editTarget && (
        <AddPropertyModal
          initialData={editTarget}
          onClose={() => setEditTarget(null)}
          onAdd={p => {
            saveProperties(properties.map(x => x.id === p.id ? p : x));
            setEditTarget(null);
          }}
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
          {/* 取り込み元での絞り込み */}
          <div className="flex gap-2 flex-wrap">
            {SOURCE_FILTERS.map(({ key, label }) => {
              const n = key === 'all' ? properties.length : key === 'auto' ? autoCount : manualCount;
              return (
                <button key={key} onPointerDown={() => setSourceFilter(key)}
                  className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                    sourceFilter === key
                      ? 'bg-navy-900 text-white border-navy-900'
                      : 'bg-white text-slate-500 border-slate-200'
                  }`}>
                  {key === 'auto' && <Mail size={11} />}
                  {key === 'manual' && <Hand size={11} />}
                  {label}
                  <span className={sourceFilter === key ? 'opacity-70' : 'text-slate-400'}>{n}</span>
                </button>
              );
            })}
          </div>

          {/* 並び替えタブ */}
          <div className="flex gap-2">
            {SORT_OPTIONS.map(({ key, label }) => (
              <button key={key} onPointerDown={() => setSortKey(key)}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                  sortKey === key
                    ? 'bg-navy-900 text-white border-navy-900'
                    : 'bg-white text-slate-500 border-slate-200'
                }`}>
                {label}
              </button>
            ))}
            <span className="ml-auto text-xs text-slate-400 self-center">{sorted.length}件</span>
          </div>

          <div className="space-y-4">
            {sorted.map(p => (
              <PropertyCard key={p.id} property={p} mustCount={MUST_COUNT} mustConditions={mustConditions}
                onDelete={id => saveProperties(properties.filter(p => p.id !== id))}
                onRatingChange={(id, ratings) => saveProperties(properties.map(p => p.id === id ? { ...p, ratings } : p))}
                onEdit={setEditTarget} />
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
