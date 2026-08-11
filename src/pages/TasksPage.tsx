import { useState, useEffect } from 'react';
import { Plus, X, Check, Calendar, User, Loader, Pencil, CalendarClock } from 'lucide-react';
import { apiGetTasks, apiSaveTasks } from '../api';
import type { Task } from '../types';
import { buildTimelineTasks, isTimelineTask, MILESTONES } from '../timeline';

const CATEGORIES = ['内見', '手続き', '引越し準備', '家具・家電', 'その他'];
const MOVE_IN_KEY = 'sumai_move_in_date';
const DEFAULT_MOVE_IN = '2026-11-01';
const ASSIGNEES = [
  { key: 'both'    as const, label: '2人', color: 'bg-navy-900 text-white' },
  { key: 'akihiro' as const, label: 'あきひろ', color: 'bg-slate-700 text-white' },
  { key: 'akari'   as const, label: 'あかり', color: 'bg-slate-400 text-white' },
];


export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [filterAssignee, setFilterAssignee] = useState<'all' | 'akihiro' | 'akari' | 'both'>('all');
  const [newTask, setNewTask] = useState<Omit<Task, 'id' | 'done'>>({
    title: '', dueDate: '', assignee: 'both', category: 'その他',
  });
  // 編集中のタスクID。null なら新規追加モード。
  const [editId, setEditId] = useState<string | null>(null);
  // 入居希望日。逆算タイムラインの起点。変更したら再生成できる。
  const [moveInDate, setMoveInDate] = useState(
    () => localStorage.getItem(MOVE_IN_KEY) ?? DEFAULT_MOVE_IN
  );

  useEffect(() => {
    apiGetTasks()
      .then(data => { setTasks(data ?? []); setLoading(false); })
      .catch(() => { setTasks([]); setLoading(false); });
  }, []);

  useEffect(() => { localStorage.setItem(MOVE_IN_KEY, moveInDate); }, [moveInDate]);

  const saveTasks = (next: Task[]) => {
    setTasks(next);
    apiSaveTasks(next).catch(console.error);
  };

  const toggle = (id: string) => {
    saveTasks(tasks.map(t => t.id === id ? { ...t, done: !t.done } : t));
  };

  const remove = (id: string) => saveTasks(tasks.filter(t => t.id !== id));

  const resetForm = () => {
    setNewTask({ title: '', dueDate: '', assignee: 'both', category: 'その他' });
    setEditId(null);
    setShowAdd(false);
  };

  // 新規追加と編集の両方を担う。editId があれば該当タスクを上書きする。
  const submitForm = () => {
    if (!newTask.title.trim()) return;
    if (editId) {
      saveTasks(tasks.map(t => t.id === editId ? { ...t, ...newTask } : t));
    } else {
      saveTasks([...tasks, { ...newTask, id: `task${Date.now()}`, done: false }]);
    }
    resetForm();
  };

  const startEdit = (t: Task) => {
    setNewTask({ title: t.title, dueDate: t.dueDate, assignee: t.assignee, category: t.category });
    setEditId(t.id);
    setShowAdd(true);
  };

  // 逆算タイムラインを生成。既にあるものは上書きせず、足りない分だけ追加する。
  const generateTimeline = () => {
    const fresh = buildTimelineTasks(moveInDate, tasks);
    if (!fresh.length) return;
    saveTasks([...tasks, ...fresh]);
  };

  const timelineCount = tasks.filter(isTimelineTask).length;
  const pendingTimeline = buildTimelineTasks(moveInDate, tasks).length;

  const filtered = filterAssignee === 'all' ? tasks : tasks.filter(t => t.assignee === filterAssignee);
  const todo = filtered.filter(t => !t.done);
  const done = filtered.filter(t => t.done);

  // 日付でソート
  const sortByDate = (arr: Task[]) => [...arr].sort((a, b) => (a.dueDate > b.dueDate ? 1 : -1));

  const today = new Date().toISOString().slice(0, 10);
  const isOverdue = (t: Task) => t.dueDate && t.dueDate < today && !t.done;
  const isSoon = (t: Task) => {
    if (!t.dueDate || t.done) return false;
    const diff = (new Date(t.dueDate).getTime() - Date.now()) / 86400000;
    return diff >= 0 && diff <= 7;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy-900 tracking-tight">タスク</h1>
          <p className="mt-1 text-sm text-slate-500">2人で共有するやることリスト</p>
        </div>
        <button onPointerDown={() => setShowAdd(v => !v)}
          className="flex items-center gap-1.5 px-4 py-2 bg-navy-900 text-white text-sm font-semibold rounded-xl hover:bg-navy-800 transition-colors">
          <Plus size={15} /> 追加
        </button>
      </div>

      {/* 逆算タイムライン */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-3">
        <div className="flex items-center gap-1.5">
          <CalendarClock size={15} className="text-navy-500" />
          <h3 className="text-sm font-bold text-navy-900">引っ越しの逆算タイムライン</h3>
        </div>
        <p className="text-xs text-slate-500 leading-relaxed">
          入居希望日から、解約予告・審査書類・内見開始・契約・ライフラインまでの
          {MILESTONES.length}件を期限つきで生成します。生成後は内容も期限も自由に変更できます。
        </p>
        <div className="flex items-end gap-3 flex-wrap">
          <div>
            <label className="block text-xs text-slate-500 mb-1">入居希望日</label>
            <input type="date" value={moveInDate} onChange={e => setMoveInDate(e.target.value)}
              className="text-sm px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-navy-400" />
          </div>
          <button onPointerDown={generateTimeline} disabled={pendingTimeline === 0}
            className={`px-4 py-2 text-sm font-semibold rounded-xl transition-colors ${
              pendingTimeline === 0
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                : 'bg-navy-900 text-white hover:bg-navy-800'
            }`}>
            {pendingTimeline === 0 ? '生成済み' : `${pendingTimeline}件を生成`}
          </button>
        </div>
        {timelineCount > 0 && (
          <p className="text-xs text-slate-400">
            生成済み {timelineCount}/{MILESTONES.length}件。
            日付を変えて再生成しても、既に作られたタスクは上書きされません（手で直した内容が消えないようにするため）。
          </p>
        )}
      </div>

      {/* 進捗バー */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
        <div className="flex justify-between mb-2">
          <span className="text-xs font-medium text-slate-600">進捗</span>
          <span className="text-xs text-slate-400">{done.length}/{tasks.length} 完了</span>
        </div>
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <div className="h-full bg-emerald-500 rounded-full transition-all duration-500"
            style={{ width: tasks.length ? `${(done.length / tasks.length) * 100}%` : '0%' }} />
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-16 gap-2 text-slate-400">
          <Loader size={16} className="animate-spin" /> 読み込み中...
        </div>
      )}

      {/* 追加フォーム */}
      {showAdd && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-3">
          <h3 className="text-sm font-bold text-navy-900">{editId ? 'タスクを編集' : 'タスクを追加'}</h3>
          <input type="text" value={newTask.title} onChange={e => setNewTask(v => ({ ...v, title: e.target.value }))}
            autoFocus
            className="w-full text-sm px-3 py-2.5 border border-slate-200 rounded-xl outline-none focus:border-navy-400 focus:ring-2 focus:ring-navy-100"
            placeholder="タスクを入力..." />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-500 mb-1">期限</label>
              <input type="date" value={newTask.dueDate} onChange={e => setNewTask(v => ({ ...v, dueDate: e.target.value }))}
                className="w-full text-sm px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-navy-400" />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">カテゴリ</label>
              <select value={newTask.category} onChange={e => setNewTask(v => ({ ...v, category: e.target.value }))}
                className="w-full text-sm px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-navy-400 bg-white">
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-2">担当</label>
            <div className="flex gap-2">
              {ASSIGNEES.map(({ key, label }) => (
                <button key={key} onPointerDown={e => { e.preventDefault(); setNewTask(v => ({ ...v, assignee: key })); }}
                  className={`flex-1 py-2 text-xs font-semibold rounded-xl border-2 transition-all ${
                    newTask.assignee === key ? 'bg-navy-900 text-white border-navy-900' : 'bg-white text-slate-500 border-slate-200'
                  }`}>
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <button onPointerDown={e => { e.preventDefault(); submitForm(); }}
              className="flex-1 bg-navy-900 text-white text-sm font-semibold py-2.5 rounded-xl hover:bg-navy-800 transition-colors">
              {editId ? '保存' : '追加'}
            </button>
            <button onPointerDown={resetForm}
              className="px-4 py-2.5 text-sm text-slate-500 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
              キャンセル
            </button>
          </div>
        </div>
      )}

      {/* フィルター */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {([{ key: 'all', label: 'すべて' }, ...ASSIGNEES] as { key: typeof filterAssignee; label: string }[]).map(({ key, label }) => (
          <button key={key} onPointerDown={() => setFilterAssignee(key)}
            className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold border transition-all ${
              filterAssignee === key ? 'bg-navy-900 text-white border-navy-900' : 'bg-white text-slate-500 border-slate-200'
            }`}>
            {label}
          </button>
        ))}
      </div>

      {/* Todo */}
      <div className="space-y-2">
        {sortByDate(todo).map(task => {
          const assigneeCfg = ASSIGNEES.find(a => a.key === task.assignee);
          return (
            <div key={task.id}
              className={`bg-white rounded-2xl border shadow-sm p-4 flex items-start gap-3 transition-all ${
                isOverdue(task) ? 'border-red-200 bg-red-50/30' : 'border-slate-100'
              }`}>
              <button onPointerDown={() => toggle(task.id)}
                className="mt-0.5 w-5 h-5 rounded-full border-2 border-slate-300 hover:border-navy-500 flex items-center justify-center shrink-0 transition-colors">
              </button>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-800">{task.title}</p>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  {task.dueDate && (
                    <span className={`flex items-center gap-1 text-xs ${isOverdue(task) ? 'text-red-500 font-semibold' : isSoon(task) ? 'text-amber-600 font-semibold' : 'text-slate-400'}`}>
                      <Calendar size={11} />
                      {task.dueDate}
                      {isOverdue(task) && ' ⚠️ 期限超過'}
                      {isSoon(task) && ' もうすぐ'}
                    </span>
                  )}
                  <span className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${assigneeCfg?.color ?? ''}`}>
                    <User size={9} />{assigneeCfg?.label}
                  </span>
                  <span className="text-xs text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full border border-slate-100">
                    {task.category}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-0.5 shrink-0">
                <button onPointerDown={() => startEdit(task)}
                  className="p-1 text-slate-300 hover:text-navy-600 hover:bg-navy-50 rounded-lg transition-colors">
                  <Pencil size={14} />
                </button>
                <button onPointerDown={() => remove(task.id)}
                  className="p-1 text-slate-300 hover:text-red-400 hover:bg-red-50 rounded-lg transition-colors">
                  <X size={14} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* 完了済み */}
      {done.length > 0 && (
        <div>
          <p className="text-xs font-medium text-slate-400 mb-2">完了済み ({done.length})</p>
          <div className="space-y-2">
            {sortByDate(done).map(task => (
              <div key={task.id} className="bg-slate-50 rounded-2xl border border-slate-100 p-4 flex items-start gap-3 opacity-60">
                <button onPointerDown={() => toggle(task.id)}
                  className="mt-0.5 w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
                  <Check size={11} className="text-white" />
                </button>
                <div className="flex-1">
                  <p className="text-sm text-slate-500 line-through">{task.title}</p>
                </div>
                <button onPointerDown={() => remove(task.id)}
                  className="p-1 text-slate-300 hover:text-red-400 rounded-lg transition-colors">
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
