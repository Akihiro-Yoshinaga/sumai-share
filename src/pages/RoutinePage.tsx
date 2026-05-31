import { useState, useEffect, useRef } from 'react';
import { X, Tag, Pencil, Trash2, ChevronUp, ChevronDown } from 'lucide-react';
import { apiGetRoutines, apiSaveRoutines } from '../api';
import { fetchRoutineDays } from '../mockData';
import type { RoutineDay, RoutineBlock, DayType } from '../types';

const USER_CONFIG = {
  akihiro: { label: 'あきひろ', color: '#dbeafe', border: '#93c5fd', text: '#1e3a5f' },
  akari:   { label: 'あかり',   color: '#fee2e2', border: '#fca5a5', text: '#7f1d1d' },
  both:    { label: '2人',      color: '#243b53', border: '#243b53', text: '#ffffff' },
} as const;

type UserId = keyof typeof USER_CONFIG;

const HOUR_START  = 5;
const HOUR_END    = 24;
const TOTAL_HOURS = HOUR_END - HOUR_START;
const PX_PER_HOUR = 60;
const MINUTES     = [0, 10, 20, 30, 40, 50] as const;

function fmt(h: number, m: number) {
  return `${h}:${String(m).padStart(2, '0')}`;
}

function toDecimal(h: number, m: number) {
  return h + m / 60;
}

// ドラムロール式ピッカー（時 or 分）
function Drum({
  value,
  options,
  onChange,
  label,
}: {
  value: number;
  options: readonly number[];
  onChange: (v: number) => void;
  label: string;
}) {
  const idx = options.indexOf(value as (typeof options)[number]);

  const prev = () => onChange(options[(idx - 1 + options.length) % options.length]);
  const next = () => onChange(options[(idx + 1) % options.length]);

  return (
    <div className="flex flex-col items-center gap-0.5">
      <p className="text-[10px] text-slate-400 mb-0.5">{label}</p>
      <button
        type="button"
        onPointerDown={e => { e.preventDefault(); prev(); }}
        className="w-10 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 active:bg-slate-200 transition-colors"
      >
        <ChevronUp size={16} />
      </button>
      <div className="w-14 h-10 flex items-center justify-center rounded-xl bg-slate-50 border border-slate-200">
        <span className="text-base font-bold text-navy-900 tabular-nums">
          {String(value).padStart(label === '分' ? 2 : 1, '0')}
        </span>
      </div>
      <button
        type="button"
        onPointerDown={e => { e.preventDefault(); next(); }}
        className="w-10 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 active:bg-slate-200 transition-colors"
      >
        <ChevronDown size={16} />
      </button>
    </div>
  );
}

function TimePicker({
  hour,
  min,
  onHourChange,
  onMinChange,
}: {
  hour: number;
  min: number;
  onHourChange: (h: number) => void;
  onMinChange: (m: number) => void;
}) {
  const hours = Array.from({ length: HOUR_END - HOUR_START + 1 }, (_, i) => HOUR_START + i);
  return (
    <div className="flex items-center gap-2">
      <Drum value={hour} options={hours as unknown as readonly number[]} onChange={onHourChange} label="時" />
      <span className="text-xl font-bold text-slate-300 mt-4">:</span>
      <Drum value={min} options={MINUTES} onChange={onMinChange} label="分" />
    </div>
  );
}

function TimelineBlock({
  block,
  onEdit,
  onDelete,
}: {
  block: RoutineBlock;
  onEdit: (b: RoutineBlock) => void;
  onDelete: (id: string) => void;
}) {
  const startDec = toDecimal(block.startHour, block.startMin);
  const endDec   = toDecimal(block.endHour,   block.endMin);
  const top      = (startDec - HOUR_START) * PX_PER_HOUR;
  const height   = (endDec - startDec) * PX_PER_HOUR;
  const cfg      = USER_CONFIG[block.userId as UserId] ?? USER_CONFIG.both;

  return (
    <div
      className="absolute left-1 right-1 rounded-xl px-2.5 py-1.5 overflow-hidden group cursor-pointer select-none"
      style={{
        top: `${top}px`,
        height: `${Math.max(height, 28)}px`,
        backgroundColor: cfg.color,
        border: `1.5px solid ${cfg.border}`,
        color: cfg.text,
      }}
      onPointerDown={e => { e.stopPropagation(); onEdit(block); }}
    >
      <p className="text-xs font-bold leading-tight truncate">{block.label}</p>
      <p className="text-xs opacity-60 leading-tight">
        {fmt(block.startHour, block.startMin)}–{fmt(block.endHour, block.endMin)}
      </p>
      {height >= 72 && block.note && (
        <p className="text-xs opacity-50 leading-tight mt-0.5 line-clamp-2">{block.note}</p>
      )}
      <div className="absolute top-1 right-1 hidden group-hover:flex gap-1">
        <button
          onPointerDown={e => { e.stopPropagation(); onEdit(block); }}
          className="w-6 h-6 rounded-md bg-black/10 hover:bg-black/25 flex items-center justify-center transition-colors"
        >
          <Pencil size={11} />
        </button>
        <button
          onPointerDown={e => { e.stopPropagation(); onDelete(block.id); }}
          className="w-6 h-6 rounded-md bg-black/10 hover:bg-red-400 hover:text-white flex items-center justify-center transition-colors"
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
  const [local, setLocal] = useState<Partial<RoutineBlock>>({
    userId: 'both',
    startMin: 0,
    endMin: 0,
    requiredFeatures: [],
    ...block,
  });
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
    const uid       = (local.userId ?? 'both') as UserId;
    const startH    = local.startHour ?? 7;
    const startM    = local.startMin  ?? 0;
    const endH      = local.endHour   ?? 8;
    const endM      = local.endMin    ?? 0;
    if (toDecimal(endH, endM) <= toDecimal(startH, startM)) return;
    onSave({
      id:               local.id ?? `b${Date.now()}`,
      label:            local.label,
      startHour:        startH,
      startMin:         startM,
      endHour:          endH,
      endMin:           endM,
      userId:           uid,
      color:            USER_CONFIG[uid].color,
      note:             local.note ?? '',
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
        className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-5 space-y-4 max-h-[90vh] overflow-y-auto"
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
          <input
            type="text"
            value={local.label ?? ''}
            autoFocus
            onChange={e => setLocal(v => ({ ...v, label: e.target.value }))}
            onKeyDown={e => e.key === 'Enter' && save()}
            className="w-full text-sm px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-navy-400 focus:ring-2 focus:ring-navy-100"
            placeholder="例: 朝の準備"
          />
        </div>

        {/* 時間ピッカー */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-slate-500 mb-2">開始時間</label>
            <TimePicker
              hour={local.startHour ?? 7}
              min={local.startMin ?? 0}
              onHourChange={h => setLocal(v => ({ ...v, startHour: h }))}
              onMinChange={m => setLocal(v => ({ ...v, startMin: m }))}
            />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-2">終了時間</label>
            <TimePicker
              hour={local.endHour ?? 8}
              min={local.endMin ?? 0}
              onHourChange={h => setLocal(v => ({ ...v, endHour: h }))}
              onMinChange={m => setLocal(v => ({ ...v, endMin: m }))}
            />
          </div>
        </div>

        {/* 担当者 */}
        <div>
          <label className="block text-xs text-slate-500 mb-2">担当者</label>
          <div className="grid grid-cols-3 gap-2">
            {(Object.entries(USER_CONFIG) as [UserId, typeof USER_CONFIG[UserId]][]).map(([key, cfg]) => (
              <button
                key={key}
                type="button"
                onPointerDown={e => { e.preventDefault(); setLocal(v => ({ ...v, userId: key })); }}
                className="py-2.5 rounded-xl text-sm font-semibold border-2 transition-all"
                style={local.userId === key
                  ? { backgroundColor: cfg.color, color: cfg.text, borderColor: cfg.border }
                  : { backgroundColor: 'white', color: '#64748b', borderColor: '#e2e8f0' }
                }
              >
                {cfg.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs text-slate-500 mb-1">メモ</label>
          <textarea
            rows={2}
            value={local.note ?? ''}
            onChange={e => setLocal(v => ({ ...v, note: e.target.value }))}
            className="w-full text-sm px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-navy-400 resize-none"
            placeholder="動線や気になること..."
          />
        </div>

        <div>
          <label className="block text-xs text-slate-500 mb-1">必要な設備・条件</label>
          <div className="flex gap-1.5">
            <input
              type="text"
              value={featInput}
              onChange={e => setFeatInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addFeat()}
              className="flex-1 text-xs px-3 py-1.5 border border-slate-200 rounded-xl outline-none focus:border-navy-400"
              placeholder="例: 独立洗面台"
            />
            <button
              type="button"
              onPointerDown={e => { e.preventDefault(); addFeat(); }}
              className="text-xs px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
            >
              追加
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {(local.requiredFeatures ?? []).map(f => (
              <span key={f} className="inline-flex items-center gap-1 text-xs px-2.5 py-1 bg-navy-50 text-navy-700 rounded-full border border-navy-100">
                <Tag size={9} />{f}
                <button
                  type="button"
                  onPointerDown={e => {
                    e.preventDefault();
                    setLocal(v => ({ ...v, requiredFeatures: (v.requiredFeatures ?? []).filter(x => x !== f) }));
                  }}
                  className="ml-0.5 text-navy-400 hover:text-red-500"
                >×</button>
              </span>
            ))}
          </div>
        </div>

        <button
          type="button"
          onPointerDown={e => { e.preventDefault(); save(); }}
          className="w-full bg-navy-900 text-white text-sm font-semibold py-3 rounded-xl hover:bg-navy-800 transition-colors"
        >
          保存する
        </button>
      </div>
    </div>
  );
}

function DayTimeline({ day, onUpdate }: { day: RoutineDay; onUpdate: (d: RoutineDay) => void }) {
  const [editingBlock, setEditingBlock] = useState<Partial<RoutineBlock> | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const hours = Array.from({ length: TOTAL_HOURS + 1 }, (_, i) => HOUR_START + i);

  const saveBlock = (saved: RoutineBlock) => {
    const exists  = day.blocks.some(b => b.id === saved.id);
    const updated = exists
      ? day.blocks.map(b => b.id === saved.id ? saved : b)
      : [...day.blocks, saved];
    onUpdate({ ...day, blocks: updated });
    setEditingBlock(null);
  };

  const deleteBlock = (id: string) => {
    onUpdate({ ...day, blocks: day.blocks.filter(b => b.id !== id) });
  };

  const handleGridTap = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!gridRef.current) return;
    const rect     = gridRef.current.getBoundingClientRect();
    const y        = e.clientY - rect.top;
    const rawDec   = HOUR_START + y / PX_PER_HOUR;
    const startH   = Math.max(HOUR_START, Math.min(HOUR_END - 1, Math.floor(rawDec)));
    // 10分単位に丸める
    const rawMin   = Math.floor((rawDec - startH) * 60 / 10) * 10;
    const startM   = Math.min(50, rawMin) as 0 | 10 | 20 | 30 | 40 | 50;
    const endH     = startM >= 50 ? Math.min(HOUR_END, startH + 1) : startH;
    const endM     = startM >= 50 ? 0 : (startM + 10) as 0 | 10 | 20 | 30 | 40 | 50;
    setEditingBlock({ startHour: startH, startMin: startM, endHour: endH, endMin: endM, userId: 'both', requiredFeatures: [] });
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
      <div className="flex gap-4 mb-4">
        {(Object.entries(USER_CONFIG) as [UserId, typeof USER_CONFIG[UserId]][]).map(([key, cfg]) => (
          <span key={key} className="flex items-center gap-1.5 text-xs text-slate-600">
            <span className="w-3 h-3 rounded-sm border" style={{ backgroundColor: cfg.color, borderColor: cfg.border }} />
            {cfg.label}
          </span>
        ))}
      </div>

      {/* タイムライン */}
      <div className="flex" style={{ height: `${TOTAL_HOURS * PX_PER_HOUR}px` }}>
        {/* 時刻ラベル */}
        <div className="relative w-10 shrink-0 select-none">
          {hours.map(h => (
            <div
              key={h}
              className="absolute right-2 text-xs text-slate-300 -translate-y-2.5"
              style={{ top: `${(h - HOUR_START) * PX_PER_HOUR}px` }}
            >
              {h}
            </div>
          ))}
        </div>

        {/* グリッド */}
        <div
          ref={gridRef}
          className="relative flex-1 border-l border-slate-100 cursor-crosshair"
          onPointerDown={handleGridTap}
        >
          {hours.map(h => (
            <div
              key={h}
              className="absolute w-full border-t border-slate-100 pointer-events-none"
              style={{ top: `${(h - HOUR_START) * PX_PER_HOUR}px` }}
            >
              <div className="absolute w-full border-t border-slate-50" style={{ top: `${PX_PER_HOUR / 2}px` }} />
            </div>
          ))}

          {day.blocks.map(block => (
            <TimelineBlock
              key={block.id}
              block={block}
              onEdit={b => setEditingBlock(b)}
              onDelete={deleteBlock}
            />
          ))}
        </div>
      </div>

      <p className="mt-2 text-center text-xs text-slate-300">タイムラインをタップして予定を追加 · ブロックをタップして編集</p>

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
  const [days, setDays]         = useState<RoutineDay[]>([]);
  const [loading, setLoading]   = useState(true);
  const [activeDay, setActiveDay] = useState<DayType>('weekday');

  useEffect(() => {
    apiGetRoutines()
      .then(data => data ?? fetchRoutineDays())
      .then(data => { setDays(data); setLoading(false); })
      .catch(() => fetchRoutineDays().then(data => { setDays(data); setLoading(false); }));
  }, []);

  const updateDay = (updated: RoutineDay) => {
    setDays(prev => {
      const next = prev.map(d => d.id === updated.id ? updated : d);
      apiSaveRoutines(next).catch(console.error);
      return next;
    });
  };

  const currentDay = days.find(d => d.dayType === activeDay);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy-900 tracking-tight">ルーティン</h1>
        <p className="mt-1 text-sm text-slate-500">タイムラインをタップして予定を追加</p>
      </div>

      <div className="flex gap-2">
        {([
          { type: 'weekday' as DayType, label: '平日' },
          { type: 'weekend' as DayType, label: '休日' },
        ]).map(({ type, label }) => (
          <button
            key={type}
            onPointerDown={() => setActiveDay(type)}
            className={`flex-1 py-3 rounded-2xl text-sm font-semibold border-2 transition-all ${
              activeDay === type
                ? 'bg-navy-900 text-white border-navy-900'
                : 'bg-white text-slate-500 border-slate-200'
            }`}
          >
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
