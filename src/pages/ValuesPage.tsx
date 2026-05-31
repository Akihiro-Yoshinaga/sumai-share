import { useState, useEffect } from 'react';
import { Plus, X, AlertCircle, Star } from 'lucide-react';
import { fetchTags } from '../mockData';
import type { Tag, TagType } from '../types';

function TagBadge({ tag, onRemove }: { tag: Tag; onRemove: (id: string) => void }) {
  const isMust = tag.type === 'must';
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
        isMust
          ? 'bg-navy-900 text-white'
          : 'bg-white text-slate-600 border border-slate-200'
      }`}
    >
      {isMust && <AlertCircle size={11} />}
      {!isMust && <Star size={11} />}
      {tag.label}
      <button
        onClick={() => onRemove(tag.id)}
        className={`ml-0.5 rounded-full p-0.5 hover:opacity-70 transition-opacity ${
          isMust ? 'text-white/70 hover:text-white' : 'text-slate-400'
        }`}
        aria-label={`${tag.label}を削除`}
      >
        <X size={10} />
      </button>
    </span>
  );
}

export default function ValuesPage() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState('');
  const [activeType, setActiveType] = useState<TagType>('must');

  useEffect(() => {
    fetchTags().then(data => {
      setTags(data);
      setLoading(false);
    });
  }, []);

  const addTag = () => {
    const label = input.trim();
    if (!label) return;
    const newTag: Tag = {
      id: `t${Date.now()}`,
      label,
      type: activeType,
      createdAt: new Date().toISOString().slice(0, 10),
    };
    setTags(prev => [...prev, newTag]);
    setInput('');
  };

  const removeTag = (id: string) => {
    setTags(prev => prev.filter(t => t.id !== id));
  };

  const musts = tags.filter(t => t.type === 'must');
  const wants = tags.filter(t => t.type === 'want');

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-navy-900 tracking-tight">価値観のすり合わせ</h1>
        <p className="mt-1 text-sm text-slate-500">新居への条件を Must / Want で整理しましょう。</p>
      </div>

      {/* 入力フォーム */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
        <div className="flex gap-2 mb-4">
          {(['must', 'want'] as TagType[]).map(type => (
            <button
              key={type}
              onClick={() => setActiveType(type)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                activeType === type
                  ? type === 'must'
                    ? 'bg-navy-900 text-white border-navy-900'
                    : 'bg-slate-800 text-white border-slate-800'
                  : 'bg-white text-slate-500 border-slate-200 hover:border-slate-400'
              }`}
            >
              {type === 'must' ? '🔴 Must（絶対条件）' : '⭐ Want（歓迎条件）'}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addTag()}
            placeholder={activeType === 'must' ? '例: 独立洗面台' : '例: 南向きリビング'}
            className="flex-1 px-4 py-2 text-sm rounded-xl border border-slate-200 outline-none focus:border-navy-400 focus:ring-2 focus:ring-navy-100 transition"
          />
          <button
            onClick={addTag}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-navy-900 text-white text-sm font-medium hover:bg-navy-800 transition"
          >
            <Plus size={15} />
            追加
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-16 text-slate-400 text-sm">読み込み中...</div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {/* Must */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-4">
              <span className="w-2 h-2 rounded-full bg-navy-900" />
              <h2 className="text-sm font-bold text-navy-900 uppercase tracking-widest">Must</h2>
              <span className="ml-auto text-xs text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full border border-slate-100">
                {musts.length}件
              </span>
            </div>
            {musts.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">まだ条件がありません</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {musts.map(tag => (
                  <TagBadge key={tag.id} tag={tag} onRemove={removeTag} />
                ))}
              </div>
            )}
          </div>

          {/* Want */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-4">
              <span className="w-2 h-2 rounded-full bg-slate-300" />
              <h2 className="text-sm font-bold text-slate-600 uppercase tracking-widest">Want</h2>
              <span className="ml-auto text-xs text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full border border-slate-100">
                {wants.length}件
              </span>
            </div>
            {wants.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">まだ条件がありません</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {wants.map(tag => (
                  <TagBadge key={tag.id} tag={tag} onRemove={removeTag} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* サマリー */}
      {!loading && (
        <div className="bg-navy-50 rounded-2xl border border-navy-100 p-5">
          <p className="text-xs text-navy-700 font-medium mb-1">条件サマリー</p>
          <p className="text-sm text-navy-900">
            Must <strong>{musts.length}</strong>件 · Want <strong>{wants.length}</strong>件 ·
            合計 <strong>{tags.length}</strong>件の条件が登録されています。
          </p>
        </div>
      )}
    </div>
  );
}
