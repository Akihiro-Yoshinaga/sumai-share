import { useState, useEffect } from 'react';
import { Plus, ChevronUp, Tag } from 'lucide-react';
import { fetchRoutineDays } from '../mockData';
import type { RoutineDay, RoutineBlock, DayType } from '../types';

const USER_COLORS: Record<string, string> = {
  both: '#334e68',
  akihiro: '#486581',
  akari: '#9fb3c8',
};

const USER_LABELS: Record<string, string> = {
  both: '2人',
  akihiro: 'あきひろ',
  akari: 'あかり',
};

const PALETTE = [
  '#f0f4f8', '#d9e2ec', '#bcccdc', '#9fb3c8',
  '#829ab1', '#627d98', '#486581', '#334e68',
];

const HOUR_START = 5;
const HOUR_END = 24;
const TOTAL_HOURS = HOUR_END - HOUR_START;

function TimelineBlock({
  block,
  onClick,
}: {
  block: RoutineBlock;
  onClick: (b: RoutineBlock) => void;
}) {
  const top = ((block.startHour - HOUR_START) / TOTAL_HOURS) * 100;
  const height = ((block.endHour - block.startHour) / TOTAL_HOURS) * 100;

  const isDark = ['#334e68', '#486581', '#627d98'].includes(block.color);

  return (
    <button
      onClick={() => onClick(block)}
      className="absolute left-1 right-1 rounded-lg px-2 py-1 text-left overflow-hidden hover:opacity-90 transition-opacity border border-white/20 shadow-sm"
      style={{
        top: `${top}%`,
        height: `${height}%`,
        backgroundColor: block.color,
        color: isDark ? '#fff' : '#243b53',
        minHeight: '28px',
      }}
      title={block.label}
    >
      <p className="text-xs font-semibold leading-tight truncate">{block.label}</p>
      <p className="text-xs opacity-70 leading-tight">{block.startHour}:00–{block.endHour}:00</p>
    </button>
  );
}

function BlockDetailPanel({
  block,
  onClose,
  onUpdate,
}: {
  block: RoutineBlock;
  onClose: () => void;
  onUpdate: (b: RoutineBlock) => void;
}) {
  const [local, setLocal] = useState<RoutineBlock>(block);

  const save = () => {
    onUpdate(local);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/30 backdrop-blur-sm">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-navy-900 text-base">ブロック編集</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xs">閉じる</button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-xs text-slate-500 mb-1">ラベル</label>
            <input
              type="text"
              value={local.label}
              onChange={e => setLocal(v => ({ ...v, label: e.target.value }))}
              className="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-navy-400 focus:ring-2 focus:ring-navy-100"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-500 mb-1">開始時間</label>
              <input
                type="number"
                min={HOUR_START}
                max={HOUR_END - 1}
                value={local.startHour}
                onChange={e => setLocal(v => ({ ...v, startHour: Number(e.target.value) }))}
                className="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-navy-400"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">終了時間</label>
              <input
                type="number"
                min={HOUR_START + 1}
                max={HOUR_END}
                value={local.endHour}
                onChange={e => setLocal(v => ({ ...v, endHour: Number(e.target.value) }))}
                className="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-navy-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-slate-500 mb-1">誰が</label>
            <div className="flex gap-2">
              {(['both', 'akihiro', 'akari'] as const).map(u => (
                <button
                  key={u}
                  onClick={() => setLocal(v => ({ ...v, userId: u }))}
                  className={`flex-1 py-1.5 text-xs rounded-lg border transition-all ${
                    local.userId === u
                      ? 'bg-navy-900 text-white border-navy-900'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
                  }`}
                >
                  {USER_LABELS[u]}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs text-slate-500 mb-1">色</label>
            <div className="flex gap-1.5 flex-wrap">
              {PALETTE.map(c => (
                <button
                  key={c}
                  onClick={() => setLocal(v => ({ ...v, color: c }))}
                  className={`w-6 h-6 rounded-full border-2 transition-transform ${
                    local.color === c ? 'border-navy-900 scale-110' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs text-slate-500 mb-1">メモ</label>
            <textarea
              value={local.note}
              onChange={e => setLocal(v => ({ ...v, note: e.target.value }))}
              rows={2}
              className="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-navy-400 resize-none"
              placeholder="動線や気になること..."
            />
          </div>

          <div>
            <label className="block text-xs text-slate-500 mb-1">必要な設備・間取り条件</label>
            <FeatureEditor
              features={local.requiredFeatures}
              onChange={f => setLocal(v => ({ ...v, requiredFeatures: f }))}
            />
          </div>
        </div>

        <button
          onClick={save}
          className="w-full bg-navy-900 text-white text-sm font-semibold py-2.5 rounded-xl hover:bg-navy-800 transition"
        >
          保存
        </button>
      </div>
    </div>
  );
}

function FeatureEditor({
  features,
  onChange,
}: {
  features: string[];
  onChange: (f: string[]) => void;
}) {
  const [input, setInput] = useState('');
  const add = () => {
    const v = input.trim();
    if (v && !features.includes(v)) {
      onChange([...features, v]);
    }
    setInput('');
  };
  const remove = (f: string) => onChange(features.filter(x => x !== f));
  return (
    <div className="space-y-2">
      <div className="flex gap-1.5">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && add()}
          placeholder="例: 独立洗面台"
          className="flex-1 text-xs px-3 py-1.5 border border-slate-200 rounded-lg outline-none focus:border-navy-400"
        />
        <button
          onClick={add}
          className="text-xs px-3 py-1.5 bg-navy-900 text-white rounded-lg hover:bg-navy-800"
        >
          追加
        </button>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {features.map(f => (
          <span
            key={f}
            className="inline-flex items-center gap-1 text-xs px-2.5 py-1 bg-slate-100 text-slate-700 rounded-full border border-slate-200"
          >
            <Tag size={9} />
            {f}
            <button onClick={() => remove(f)} className="text-slate-400 hover:text-slate-600 ml-0.5">×</button>
          </span>
        ))}
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
  const [selected, setSelected] = useState<RoutineBlock | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [newBlock, setNewBlock] = useState<Partial<RoutineBlock>>({ startHour: 7, endHour: 8, userId: 'both', color: '#d9e2ec' });

  const updateBlock = (updated: RoutineBlock) => {
    onUpdate({ ...day, blocks: day.blocks.map(b => (b.id === updated.id ? updated : b)) });
  };

  const addBlock = () => {
    if (!newBlock.label?.trim()) return;
    const block: RoutineBlock = {
      id: `b${Date.now()}`,
      startHour: newBlock.startHour ?? 7,
      endHour: newBlock.endHour ?? 8,
      label: newBlock.label,
      color: newBlock.color ?? '#d9e2ec',
      userId: newBlock.userId ?? 'both',
      note: '',
      requiredFeatures: [],
    };
    onUpdate({ ...day, blocks: [...day.blocks, block] });
    setNewBlock({ startHour: 7, endHour: 8, userId: 'both', color: '#d9e2ec' });
    setShowAdd(false);
  };

  const hours = Array.from({ length: TOTAL_HOURS }, (_, i) => HOUR_START + i);

  return (
    <div>
      {selected && (
        <BlockDetailPanel
          block={selected}
          onClose={() => setSelected(null)}
          onUpdate={b => { updateBlock(b); setSelected(null); }}
        />
      )}

      <div className="flex gap-0">
        {/* 時刻軸 */}
        <div className="relative w-10 shrink-0" style={{ height: `${TOTAL_HOURS * 48}px` }}>
          {hours.map(h => (
            <div
              key={h}
              className="absolute right-2 text-xs text-slate-300 -translate-y-2"
              style={{ top: `${((h - HOUR_START) / TOTAL_HOURS) * 100}%` }}
            >
              {h}
            </div>
          ))}
        </div>

        {/* タイムライングリッド */}
        <div className="relative flex-1 border-l border-slate-100" style={{ height: `${TOTAL_HOURS * 48}px` }}>
          {hours.map(h => (
            <div
              key={h}
              className="absolute w-full border-t border-slate-100"
              style={{ top: `${((h - HOUR_START) / TOTAL_HOURS) * 100}%` }}
            />
          ))}
          {day.blocks
            .filter(b => b.startHour >= HOUR_START && b.endHour <= HOUR_END)
            .map(block => (
              <TimelineBlock key={block.id} block={block} onClick={setSelected} />
            ))}
        </div>
      </div>

      {/* ブロック追加 */}
      <button
        onClick={() => setShowAdd(v => !v)}
        className="mt-3 flex items-center gap-1.5 text-xs text-slate-400 hover:text-navy-700 transition-colors"
      >
        {showAdd ? <ChevronUp size={13} /> : <Plus size={13} />}
        ブロックを追加
      </button>

      {showAdd && (
        <div className="mt-2 bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-3">
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-xs text-slate-500 mb-1">ラベル</label>
              <input
                type="text"
                value={newBlock.label ?? ''}
                onChange={e => setNewBlock(v => ({ ...v, label: e.target.value }))}
                className="w-full text-xs px-2 py-1.5 border border-slate-200 rounded-lg outline-none focus:border-navy-400"
                placeholder="例: 朝の準備"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">開始</label>
              <input
                type="number"
                min={HOUR_START}
                max={23}
                value={newBlock.startHour}
                onChange={e => setNewBlock(v => ({ ...v, startHour: Number(e.target.value) }))}
                className="w-full text-xs px-2 py-1.5 border border-slate-200 rounded-lg outline-none"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">終了</label>
              <input
                type="number"
                min={6}
                max={HOUR_END}
                value={newBlock.endHour}
                onChange={e => setNewBlock(v => ({ ...v, endHour: Number(e.target.value) }))}
                className="w-full text-xs px-2 py-1.5 border border-slate-200 rounded-lg outline-none"
              />
            </div>
          </div>
          <button
            onClick={addBlock}
            className="text-xs px-4 py-1.5 bg-navy-900 text-white rounded-lg hover:bg-navy-800 transition"
          >
            追加する
          </button>
        </div>
      )}

      {/* 必要設備まとめ */}
      {day.blocks.flatMap(b => b.requiredFeatures).length > 0 && (
        <div className="mt-5">
          <p className="text-xs text-slate-500 font-medium mb-2">このルーティンで必要な条件</p>
          <div className="flex flex-wrap gap-1.5">
            {[...new Set(day.blocks.flatMap(b => b.requiredFeatures))].map(f => (
              <span key={f} className="text-xs px-2.5 py-1 bg-navy-50 text-navy-700 rounded-full border border-navy-100">
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
    fetchRoutineDays().then(data => {
      setDays(data);
      setLoading(false);
    });
  }, []);

  const updateDay = (updated: RoutineDay) => {
    setDays(prev => prev.map(d => (d.id === updated.id ? updated : d)));
  };

  const currentDay = days.find(d => d.dayType === activeDay);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-navy-900 tracking-tight">ルーティンシミュレーター</h1>
        <p className="mt-1 text-sm text-slate-500">
          平日・休日の生活動線を可視化して、必要な間取り・設備条件を洗い出しましょう。
        </p>
      </div>

      {/* 凡例 */}
      <div className="flex gap-4">
        {Object.entries(USER_LABELS).map(([key, label]) => (
          <span key={key} className="flex items-center gap-1.5 text-xs text-slate-500">
            <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: USER_COLORS[key] }} />
            {label}
          </span>
        ))}
      </div>

      {/* タブ */}
      <div className="flex gap-2">
        {([
          { type: 'weekday' as DayType, label: '平日' },
          { type: 'weekend' as DayType, label: '休日' },
        ]).map(({ type, label }) => (
          <button
            key={type}
            onClick={() => setActiveDay(type)}
            className={`px-5 py-2 rounded-xl text-sm font-medium border transition-all ${
              activeDay === type
                ? 'bg-navy-900 text-white border-navy-900'
                : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-16 text-slate-400 text-sm">読み込み中...</div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold text-navy-900 text-sm">
              {activeDay === 'weekday' ? '平日のルーティン' : '休日のルーティン'}
            </h2>
            <span className="text-xs text-slate-400">クリックで編集</span>
          </div>
          {currentDay ? (
            <DayTimeline day={currentDay} onUpdate={updateDay} />
          ) : (
            <p className="text-xs text-slate-400">データがありません</p>
          )}
        </div>
      )}

      {/* メモブロック一覧 */}
      {!loading && currentDay && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-navy-900">各ブロックのメモ</h2>
          {currentDay.blocks.map(b => (
            <div key={b.id} className="bg-white rounded-xl border border-slate-100 p-4 flex gap-3 items-start">
              <span
                className="mt-0.5 w-3 h-3 rounded-sm shrink-0"
                style={{ backgroundColor: b.color }}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold text-navy-900">{b.label}</span>
                  <span className="text-xs text-slate-400">{b.startHour}:00–{b.endHour}:00</span>
                  <span className="text-xs px-2 py-0.5 bg-slate-50 text-slate-500 rounded-full border border-slate-100">
                    {USER_LABELS[b.userId]}
                  </span>
                </div>
                {b.note && <p className="mt-1 text-xs text-slate-500 leading-relaxed">{b.note}</p>}
                {b.requiredFeatures.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {b.requiredFeatures.map(f => (
                      <span key={f} className="text-xs px-2 py-0.5 bg-navy-50 text-navy-700 rounded-full border border-navy-100">
                        {f}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
