import { useState, useEffect } from 'react';
import { ExternalLink, Star, ChevronDown, ChevronUp, MapPin, Maximize2, LayoutGrid } from 'lucide-react';
import { fetchProperties, fetchTags } from '../mockData';
import type { Property, Tag, PropertyRating } from '../types';

function Stars({ value, onChange }: { value: number; onChange?: (v: number) => void }) {
  return (
    <span className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star
          key={i}
          size={14}
          className={`${i <= value ? 'text-amber-400 fill-amber-400' : 'text-slate-200 fill-slate-200'} ${onChange ? 'cursor-pointer hover:scale-110 transition-transform' : ''}`}
          onClick={() => onChange?.(i)}
        />
      ))}
    </span>
  );
}

function ScoreBar({ score }: { score: number }) {
  const color =
    score >= 80 ? 'bg-emerald-500' : score >= 60 ? 'bg-amber-400' : 'bg-rose-400';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${color}`}
          style={{ width: `${score}%` }}
        />
      </div>
      <span className="text-xs font-semibold tabular-nums w-10 text-right">{score}%</span>
    </div>
  );
}

function PropertyCard({
  property,
  mustTags,
}: {
  property: Property;
  mustTags: Tag[];
}) {
  const [expanded, setExpanded] = useState(false);
  const [ratings, setRatings] = useState<PropertyRating[]>(property.ratings);

  const matchCount = property.mustTagIds.length;
  const totalMust = mustTags.length;
  const score = totalMust === 0 ? 0 : Math.round((matchCount / totalMust) * 100);

  const updateRating = (userId: 'akihiro' | 'akari', field: 'stars' | 'compromise', val: string | number) => {
    setRatings(prev =>
      prev.map(r =>
        r.userId === userId ? { ...r, [field]: val } : r
      )
    );
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-navy-900 text-base leading-snug truncate">
              {property.name}
            </h3>
            <div className="flex items-center gap-1 mt-1 text-xs text-slate-400">
              <MapPin size={11} />
              <span>{property.address}</span>
            </div>
          </div>
          <a
            href={property.url}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 text-slate-400 hover:text-navy-700 transition-colors"
          >
            <ExternalLink size={15} />
          </a>
        </div>

        <div className="mt-4 flex flex-wrap gap-3 text-sm">
          <div className="flex items-center gap-1.5 bg-slate-50 rounded-lg px-3 py-1.5 border border-slate-100">
            <span className="text-slate-400 text-xs">家賃</span>
            <span className="font-bold text-navy-900">
              {(property.rent / 10000).toFixed(1)}<span className="text-xs font-normal text-slate-500">万円</span>
            </span>
          </div>
          <div className="flex items-center gap-1.5 bg-slate-50 rounded-lg px-3 py-1.5 border border-slate-100">
            <LayoutGrid size={13} className="text-slate-400" />
            <span className="font-semibold text-navy-900">{property.layout}</span>
          </div>
          <div className="flex items-center gap-1.5 bg-slate-50 rounded-lg px-3 py-1.5 border border-slate-100">
            <Maximize2 size={13} className="text-slate-400" />
            <span className="font-semibold text-navy-900">{property.sqm}<span className="text-xs font-normal text-slate-500">㎡</span></span>
          </div>
        </div>

        {/* Must適合率 */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-slate-500 font-medium">Must 適合率</span>
            <span className="text-xs text-slate-400">{matchCount}/{totalMust}件</span>
          </div>
          <ScoreBar score={score} />
        </div>

        {/* 満たしているMust */}
        {property.mustTagIds.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {property.mustTagIds.map(id => {
              const tag = mustTags.find(t => t.id === id);
              return tag ? (
                <span key={id} className="text-xs px-2.5 py-1 bg-navy-900 text-white rounded-full">
                  {tag.label}
                </span>
              ) : null;
            })}
          </div>
        )}

        {/* 2人の評価 */}
        <div className="mt-4 grid grid-cols-2 gap-3">
          {([
            { key: 'akihiro' as const, label: 'あきひろ' },
            { key: 'akari' as const, label: 'あかり' },
          ]).map(({ key, label }) => {
            const r = ratings.find(x => x.userId === key);
            return (
              <div key={key} className="rounded-xl bg-slate-50 border border-slate-100 p-3">
                <p className="text-xs text-slate-400 mb-1.5 font-medium">{label}</p>
                <Stars value={r?.stars ?? 0} onChange={v => updateRating(key, 'stars', v)} />
                <p className="text-xs text-slate-500 mt-1.5 truncate">{r?.compromise || '—'}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* 展開 */}
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center justify-center gap-1 py-2.5 text-xs text-slate-400 hover:text-slate-600 border-t border-slate-100 hover:bg-slate-50 transition-colors"
      >
        {expanded ? <><ChevronUp size={13} />閉じる</> : <><ChevronDown size={13} />妥協点を編集</>}
      </button>

      {expanded && (
        <div className="px-5 pb-5 border-t border-slate-100 pt-4 grid grid-cols-2 gap-3">
          {([
            { key: 'akihiro' as const, label: 'あきひろの妥協点' },
            { key: 'akari' as const, label: 'あかりの妥協点' },
          ]).map(({ key, label }) => {
            const r = ratings.find(x => x.userId === key);
            return (
              <div key={key}>
                <label className="block text-xs text-slate-500 mb-1">{label}</label>
                <input
                  type="text"
                  value={r?.compromise ?? ''}
                  onChange={e => updateRating(key, 'compromise', e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-navy-400 focus:ring-2 focus:ring-navy-100"
                  placeholder="例: 収納が狭い"
                />
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
  const [mustTags, setMustTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetchProperties(), fetchTags()]).then(([props, tags]) => {
      setProperties(props);
      setMustTags(tags.filter(t => t.type === 'must'));
      setLoading(false);
    });
  }, []);

  const sorted = [...properties].sort((a, b) => {
    const totalMust = mustTags.length || 1;
    const sa = (a.mustTagIds.length / totalMust) * 100;
    const sb = (b.mustTagIds.length / totalMust) * 100;
    return sb - sa;
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-navy-900 tracking-tight">物件トラッカー</h1>
        <p className="mt-1 text-sm text-slate-500">
          Must条件の適合率でスコアリング。2人の評価を比較しましょう。
        </p>
      </div>

      {loading ? (
        <div className="text-center py-16 text-slate-400 text-sm">物件情報を読み込み中...</div>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500">{properties.length}件の物件 · 適合率順</p>
            <span className="text-xs bg-navy-50 text-navy-700 px-3 py-1 rounded-full border border-navy-100">
              Must条件 {mustTags.length}件で評価中
            </span>
          </div>
          <div className="grid md:grid-cols-2 gap-5">
            {sorted.map(p => (
              <PropertyCard key={p.id} property={p} mustTags={mustTags} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
