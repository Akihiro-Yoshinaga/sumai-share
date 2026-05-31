import { useState, useEffect } from 'react';
import { Plus, X, AlertCircle, Star, RefreshCw, Save, Loader } from 'lucide-react';
import { GAS_API_URL } from '../types';
import type { Condition } from '../types';
import { apiGetConditions, apiSaveConditions } from '../api';
import { mockConditions } from '../mockData';

const CATEGORIES = ['予算', 'エリア', '間取り', '設備', '室内・環境', 'その他'];
type Priority = 'MUST' | 'WANT' | '-' | '';

function PriorityBadge({ value }: { value: Priority }) {
  if (value === 'MUST') return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-red-600 text-white">
      <AlertCircle size={10} /> MUST
    </span>
  );
  if (value === 'WANT') return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-amber-400 text-white">
      <Star size={10} /> WANT
    </span>
  );
  return <span className="text-xs text-slate-300">—</span>;
}

export default function ValuesPage() {
  const [conditions, setConditions] = useState<Condition[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<Priority | 'ALL'>('ALL');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newRow, setNewRow] = useState<Omit<Condition, 'id'>>({
    category: 'エリア', item: '', detail: '', priority: 'MUST', note: ''
  });
  const isConnected = !!GAS_API_URL;

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const data = isConnected ? await apiGetConditions() : mockConditions;
      setConditions(data);
    } catch (e) {
      setError('データの読み込みに失敗しました。Mockデータを表示しています。');
      setConditions(mockConditions);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const save = async (updated: Condition[]) => {
    if (!isConnected) { setConditions(updated); return; }
    setSaving(true);
    try {
      await apiSaveConditions(updated);
      setConditions(updated);
    } catch {
      setError('保存に失敗しました。');
    } finally {
      setSaving(false);
    }
  };

  const addCondition = () => {
    if (!newRow.item.trim() && !newRow.detail.trim()) return;
    const added: Condition = { ...newRow, id: `new_${Date.now()}` };
    save([...conditions, added]);
    setNewRow({ category: 'エリア', item: '', detail: '', priority: 'MUST', note: '' });
    setShowAddForm(false);
  };

  const remove = (id: string) => save(conditions.filter(c => c.id !== id));

  const updatePriority = (id: string, priority: Priority) => {
    save(conditions.map(c => c.id === id ? { ...c, priority } : c));
  };

  const musts = conditions.filter(c => c.priority === 'MUST');
  const wants = conditions.filter(c => c.priority === 'WANT');

  const filtered = activeTab === 'ALL' ? conditions
    : conditions.filter(c => c.priority === activeTab);

  const grouped = filtered.reduce<Record<string, Condition[]>>((acc, c) => {
    const key = c.category || 'その他';
    if (!acc[key]) acc[key] = [];
    acc[key].push(c);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy-900 tracking-tight">価値観のすり合わせ</h1>
          <p className="mt-1 text-sm text-slate-500">
            {isConnected ? 'スプレッドシートと同期中' : 'Mockデータ表示中（GAS URL未設定）'}
          </p>
        </div>
        <button onClick={load} disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-500 hover:text-navy-700 border border-slate-200 rounded-lg hover:border-slate-400 transition-colors">
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          更新
        </button>
      </div>

      {error && (
        <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
          {error}
        </div>
      )}

      {/* サマリー */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'MUST', count: musts.length, color: 'bg-red-50 border-red-100 text-red-700' },
          { label: 'WANT', count: wants.length, color: 'bg-amber-50 border-amber-100 text-amber-700' },
          { label: '合計', count: conditions.length, color: 'bg-navy-50 border-navy-100 text-navy-700' },
        ].map(({ label, count, color }) => (
          <div key={label} className={`rounded-2xl border p-4 text-center ${color}`}>
            <p className="text-2xl font-bold">{count}</p>
            <p className="text-xs font-medium mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* フィルタータブ */}
      <div className="flex gap-2">
        {(['ALL', 'MUST', 'WANT', '-'] as const).map(tab => (
          <button key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold border transition-all ${
              activeTab === tab
                ? 'bg-navy-900 text-white border-navy-900'
                : 'bg-white text-slate-500 border-slate-200 hover:border-slate-400'
            }`}>
            {tab === 'ALL' ? 'すべて' : tab === '-' ? '未設定' : tab}
          </button>
        ))}
      </div>

      {/* 条件リスト */}
      {loading ? (
        <div className="flex items-center justify-center py-16 gap-2 text-slate-400 text-sm">
          <Loader size={16} className="animate-spin" /> 読み込み中...
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(grouped).map(([category, rows]) => (
            <div key={category} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="px-5 py-3 bg-slate-50 border-b border-slate-100 flex items-center gap-2">
                <span className="text-xs font-bold text-slate-600 uppercase tracking-widest">{category}</span>
                <span className="text-xs text-slate-400 bg-white px-2 py-0.5 rounded-full border border-slate-100">{rows.length}件</span>
              </div>
              <div className="divide-y divide-slate-50">
                {rows.map(c => (
                  <div key={c.id} className="px-5 py-3.5 flex items-start gap-3 hover:bg-slate-50/50 transition-colors">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs text-slate-400">{c.item}</span>
                        <span className="text-sm font-medium text-slate-800">{c.detail}</span>
                        <PriorityBadge value={c.priority} />
                      </div>
                      {c.note && (
                        <p className="mt-1 text-xs text-slate-400 leading-relaxed">{c.note}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <select
                        value={c.priority}
                        onChange={e => updatePriority(c.id, e.target.value as Priority)}
                        disabled={saving}
                        className="text-xs border border-slate-200 rounded-lg px-2 py-1 outline-none focus:border-navy-400 bg-white"
                      >
                        <option value="MUST">MUST</option>
                        <option value="WANT">WANT</option>
                        <option value="-">—</option>
                      </select>
                      <button onClick={() => remove(c.id)} disabled={saving}
                        className="p-1 text-slate-300 hover:text-red-400 transition-colors rounded-lg hover:bg-red-50">
                        <X size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {filtered.length === 0 && (
            <p className="text-center text-sm text-slate-400 py-10">条件がありません</p>
          )}
        </div>
      )}

      {/* 追加フォーム */}
      {showAddForm ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-3">
          <h3 className="text-sm font-semibold text-navy-900">条件を追加</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-500 mb-1">カテゴリ</label>
              <select value={newRow.category}
                onChange={e => setNewRow(v => ({ ...v, category: e.target.value }))}
                className="w-full text-sm px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-navy-400">
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">優先度</label>
              <select value={newRow.priority}
                onChange={e => setNewRow(v => ({ ...v, priority: e.target.value as Priority }))}
                className="w-full text-sm px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-navy-400">
                <option value="MUST">MUST</option>
                <option value="WANT">WANT</option>
                <option value="-">—</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">項目</label>
            <input type="text" value={newRow.item}
              onChange={e => setNewRow(v => ({ ...v, item: e.target.value }))}
              className="w-full text-sm px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-navy-400"
              placeholder="例: キッチン" />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">条件・詳細</label>
            <input type="text" value={newRow.detail}
              onChange={e => setNewRow(v => ({ ...v, detail: e.target.value }))}
              className="w-full text-sm px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-navy-400"
              placeholder="例: 2口ガスコンロ以上" />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">備考</label>
            <input type="text" value={newRow.note}
              onChange={e => setNewRow(v => ({ ...v, note: e.target.value }))}
              className="w-full text-sm px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-navy-400"
              placeholder="例: 料理人仕様。ここは譲れない。" />
          </div>
          <div className="flex gap-2">
            <button onClick={addCondition}
              className="flex items-center gap-1.5 px-4 py-2 bg-navy-900 text-white text-sm font-semibold rounded-xl hover:bg-navy-800 transition">
              <Save size={14} /> 追加
            </button>
            <button onClick={() => setShowAddForm(false)}
              className="px-4 py-2 text-sm text-slate-500 border border-slate-200 rounded-xl hover:bg-slate-50 transition">
              キャンセル
            </button>
          </div>
        </div>
      ) : (
        <button onClick={() => setShowAddForm(true)}
          className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-slate-200 rounded-2xl text-sm text-slate-400 hover:border-navy-300 hover:text-navy-600 transition-colors">
          <Plus size={15} /> 条件を追加
        </button>
      )}
    </div>
  );
}
