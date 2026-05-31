import { useState, useEffect, useRef } from 'react';
import { Plus, X, Tag, Pencil, Trash2 } from 'lucide-react';
import { fetchRoutineDays } from '../mockData';
import type { RoutineDay, RoutineBlock, DayType } from '../types';

const USER_CONFIG = {
  akihiro: { label: 'あきひろ', color: '#334e68', text: '#fff' },
  akari:   { label: 'あかり',   color: '#9fb3c8', text: '#243b53' },
  both:    { label: '2人',      color: '#243b53', text: '#fff' },
} as const;

type UserId = keyof typeof USER_CONFIG;

const HOUR_START = 5;
const HOUR_END   = 24;
const TOTAL_HOURS = HOUR_END - HOUR_START;
const PX_PER_HOUR = 56;

function TimelineBlock({
  block,
  onEdit,
  onDelete,
}: {
  block: RoutineBlock;
  onEdit: (b: RoutineBlock) => void;
  onDelete: (id: string) => void;
}) {
  const top    = (block.startHour - HOUR_START) * PX_PER_HOUR;
  const height = (block.endHour - block.startHour) * PX_PER_HOUR;
  const cfg    = USER_CONFIG[block.userId as UserId] ?? USER_CONFIG.both;

  return (
    <div
      className="absolute left-1 right-1 rounded-xl px-2.5 py-1.5 overflow-hidden group"
      style={{
        top: `${top}px`,
        height: `${height}px`,
        backgroundColor: cfg.color,
        color: cfg.text,
        minHeight: '32px',
      }}
    >
      <p className="text-xs font-bold leading-tight truncate">{block.label}</p>
      <p className="text-xs opacity-60 leading-tight">{block.startHour}:00–{block.endHour}:00</p>
      {height >= 56 && block.note && (
        <p className="text-xs opacity-50 leading-tight mt-0.5 line-clamp-2">{block.note}</p>
      )}
      {/* 編集・削除ボタン */}
      <div className="absolute top-1 right-1 hidden group-hover:flex gap-1">
        <button
          onPointerDown={e => { e.stopPropagation(); e.preventDefault(); onEdit(block); }}
          className="w-6 h-6 rounded-md bg-black/20 hover:bg-black/40 flex items-center justify-center transition-colors"
        >
          <Pencil size={11} />
        </button>
        <button
          onPointerDown={e => { e.stopPropagation(); e.preventDefault(); onDelete(block.id); }}
          className="w-6 h-6 rounded-md bg-black/20 hover:bg-red-500 flex items-center justify-center transition-colors"
        >
          <Trash2 size={11} />
        </button>
      </div>
    </div>
  );
}

function BlockModal({
  block,
  onClose,
  onSave,
}: {
  block: Partial<RoutineBlock>;
  onClose: () => void;
  onSave: (b: RoutineBlock) => void;
}) {
  const [local, setLocal] = useState<Partial<RoutineBlock>>({ ...block });
  const [featInput, setFeatInput] = useState('');
  const overlayRef = useRef<HTMLDivElement>(null);

  const addFeat = () => {
    const v = featInput.trim();
    if (v) {
      setLocal(prev => ({ ...prev, requiredFeatures: [...(prev.requiredFeatures ?? []), v] }));
      setFeatInput('');
    }
  };

  const save = () => {
    if (!local.label?.trim()) return;
    onSave({
      id: local.id ?? `b${Date.now()}`,
      label: local.label,
      startHour: local.startHour ?? 7,
      endHour: local.endHour ?? 8,
      userId: (local.userId ?? 'both') as UserId,
      color: USER_CONFIG[(local.userId ?? 'both') as UserId]?.color ?? '#243b53',
      note: local.note ?? '',
      requiredFeatures: local.requiredFeatures ?? [],
    });
  };

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onPointerDown={e => { if (e.target === overlayRef.current) onClose(); }}
    >
      <div
        className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-5 space-y-4"
        onPointerDown={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-navy-900">{local.id ? 'ブロックを編集' : 'ブロックを追加'}</h3>
          <button onPointerDown={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
            <X size={18} />
          </button>
        </div>

        <div>
          <label className="block text-xs text-slate-500 mb-1">ラベル *</label>
          <input type="text" value={local.label ?? ''} autoFocus
            onChange={e => setLocal(v => ({ ...v, label: e.target.value }))}
            className="w-full text-sm px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-navy-400 focus:ring-2 focus:ring-navy-100"
            placeholder="例: 朝の準備" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-slate-500 mb-1">開始時間</label>
            <input type="number" min={HOUR_START} max={HOUR_END - 1}
              value={local.startHour ?? 7}
              onChange={e => setLocal(v => ({ ...v, startHour: Number(e.target.value) }))}
              className="w-full text-sm px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-navy-400" />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">終了時間</label>
            <input type="number" min={HOUR_START + 1} max={HOUR_END}
              value={local.endHour ?? 8}
              onChange={e => setLocal(v => ({ ...v, endHour: Number(e.target.value) }))}
              className="w-full text-sm px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-navy-400" />
          </div>
        </div>

        <div>
          <label className="block text-xs text-slate-500 mb-2">担当者</label>
          <div className="grid grid-cols-3 gap-2">
            {(Object.entries(USER_CONFIG) as [UserId, typeof USER_CONFIG[UserId]][]).map(([key, cfg]) => (
              <button key={key}
                onPointerDown={e => { e.preventDefault(); setLocal(v => ({ ...v, userId: key })); }}
                className="py-2 rounded-xl text-sm font-semibold border-2 transition-all"
                style={local.userId === key
                  ? { backgroundColor: cfg.color, color: cfg.text, borderColor: cfg.color }
                  : { backgroundColor: 'white', color: '#64748b', borderColor: '#e2e8f0' }
                }>
                {cfg.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs text-slate-500 mb-1">メモ</label>
          <textarea rows={2} value={local.note ?? ''}
            onChange={e => setLocal(v => ({ ...v, note: e.target.value }))}
            className="w-full text-sm px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-navy-400 resize-none"
            placeholder="動線や気になること..." />
        </div>

        <div>
          <label className="block text-xs text-slate-500 mb-1">必要な設備・条件</label>
          <div className="flex gap-1.5">
            <input type="text" value={featInput}
              onChange={e => setFeatInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addFeat()}
              className="flex-1 text-xs px-3 py-1.5 border border-slate-200 rounded-xl outline-none focus:border-navy-400"
              placeholder="例: 独立洗面台" />
            <button onPointerDown={e => { e.preventDefault(); addFeat(); }}
              className="text-xs px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors">
              追加
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {(local.requiredFeatures ?? []).map(f => (
              <span key={f} className="inline-flex items-center gap-1 text-xs px-2.5 py-1 bg-navy-50 text-navy-700 rounded-full border border-navy-100">
                <Tag size={9} />{f}
                <button onPointerDown={e => { e.preventDefault(); setLocal(v => ({ ...v, requiredFeatures: (v.requiredFeatures ?? []).filter(x => x !== f) })); }}
                  className="ml-0.5 text-navy-400 hover:text-red-500">×</button>
              </span>
            ))}
          </div>
        </div>

        <button onPointerDown={e => { e.preventDefault(); save(); }}
          className="w-full bg-navy-900 text-white text-sm font-semibold py-3 rounded-xl hover:bg-navy-800 transition-colors">
          保存する
        </button>
      </div>
    </div>
  );
}

function DayTimeline({
  day,
  onUpdate,
}: {
  day: RoutineDay;
  onUpdate: (d: RoutineDay) => void;
}) {
  const [editingBlock, setEditingBlock] = useState<Partial<RoutineBlock> | null>(null);
  const hours = Array.from({ length: TOTAL_HOURS + 1 }, (_, i) => HOUR_START + i);

  const saveBlock = (saved: RoutineBlock) => {
    const exists = day.blocks.some(b => b.id === saved.id);
    const updated = exists
      ? day.blocks.map(b => b.id === saved.id ? saved : b)
      : [...day.blocks, saved];
    onUpdate({ ...day, blocks: updated });
    setEditingBlock(null);
  };

  const deleteBlock = (id: string) => {
    onUpdate({ ...day, blocks: day.blocks.filter(b => b.id !== id) });
  };

  const allFeatures = [...new Set(day.blocks.flatMap(b => b.requiredFeatures))];

  return (
    <div>
      {editingBlock && (
        <BlockModal
          block={editingBlock}
          onClose={() => setEditingBlock(null)}
          onSave={saveBlock}
        />
      )}

      {/* 凡例 */}
      <div className="flex gap-3 mb-4">
        {(Object.entries(USER_CONFIG) as [UserId, typeof USER_CONFIG[UserId]][]).map(([key, cfg]) => (
          <span key={key} className="flex items-center gap-1.5 text-xs text-slate-600">
            <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: cfg.color }} />
            {cfg.label}
          </span>
        ))}
      </div>

      {/* タイムライン */}
      <div className="flex gap-0 relative" style={{ height: `${TOTAL_HOURS * PX_PER_HOUR}px` }}>
        {/* 時刻ラベル */}
        <div className="relative w-10 shrink-0">
          {hours.map(h => (
            <div key={h}
              className="absolute right-2 text-xs text-slate-300 -translate-y-2.5"
              style={{ top: `${(h - HOUR_START) * PX_PER_HOUR}px` }}>
              {h}
            </div>
          ))}
        </div>

        {/* グリッド + ブロック */}
        <div className="relative flex-1 border-l border-slate-100">
          {hours.map(h => (
            <div key={h}
              className="absolute w-full border-t border-slate-100"
              style={{ top: `${(h - HOUR_START) * PX_PER_HOUR}px` }} />
          ))}
          {day.blocks.map(block => (
            <TimelineBlock
              key={block.id}
              block={block}
              onEdit={setEditingBlock}
              onDelete={deleteBlock}
            />
          ))}
        </div>
      </div>

      {/* 追加ボタン */}
      <button
        onPointerDown={() => setEditingBlock({ startHour: 7, endHour: 8, userId: 'both', requiredFeatures: [] })}
        className="mt-4 w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-slate-200 rounded-2xl text-sm text-slate-400 hover:border-navy-300 hover:text-navy-600 transition-colors"
      >
        <Plus size={15} /> ブロックを追加
      </button>

      {/* 必要設備まとめ */}
      {allFeatures.length > 0 && (
        <div className="mt-5 bg-navy-50 rounded-2xl border border-navy-100 p-4">
          <p className="text-xs font-bold text-navy-700 mb-2">このルーティンで必要な条件</p>
          <div className="flex flex-wrap gap-1.5">
            {allFeatures.map(f => (
              <span key={f} className="text-xs px-2.5 py-1 bg-white text-navy-700 rounded-full border border-navy-200">
                {f}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function RoutinePage() {
  const [days, setDays] = useState<RoutineDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeDay, setActiveDay] = useState<DayType>('weekday');

  useEffect(() => {
    fetchRoutineDays().then(data => { setDays(data); setLoading(false); });
  }, []);

  const updateDay = (updated: RoutineDay) => {
    setDays(prev => prev.map(d => d.id === updated.id ? updated : d));
  };

  const currentDay = days.find(d => d.dayType === activeDay);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy-900 tracking-tight">ルーティン</h1>
        <p className="mt-1 text-sm text-slate-500">ブロックをホバー→✏️で編集、＋で追加</p>
      </div>

      <div className="flex gap-2">
        {([{ type: 'weekday' as DayType, label: '平日' }, { type: 'weekend' as DayType, label: '休日' }]).map(({ type, label }) => (
          <button key={type} onPointerDown={() => setActiveDay(type)}
            className={`flex-1 py-3 rounded-2xl text-sm font-semibold border-2 transition-all ${
              activeDay === type
                ? 'bg-navy-900 text-white border-navy-900'
                : 'bg-white text-slate-500 border-slate-200'
            }`}>
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-16 text-slate-400 text-sm">読み込み中...</div>
      ) : currentDay ? (
        <DayTimeline day={currentDay} onUpdate={updateDay} />
      ) : null}
    </div>
  );
}
