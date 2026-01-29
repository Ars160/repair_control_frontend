import { useState, useEffect } from 'react';
import api from '../api/client';

const ChecklistManager = ({ taskId, onUpdate }) => {
    const [items, setItems] = useState([]);
    const [newItemDesc, setNewItemDesc] = useState('');
    const [newItemPhotoRequired, setNewItemPhotoRequired] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (taskId) {
            loadChecklist();
        }
    }, [taskId]);

    const loadChecklist = async () => {
        const data = await api.getChecklistsByTask(taskId);
        setItems(data.sort((a, b) => a.orderIndex - b.orderIndex));
    };

    const handleAdd = async (e) => {
        e.preventDefault();
        if (!newItemDesc.trim()) return;

        setLoading(true);
        const nextIndex = items.length;
        const result = await api.createChecklistItem(taskId, newItemDesc, nextIndex, newItemPhotoRequired);
        if (result.success) {
            setItems([...items, result.data]);
            setNewItemDesc('');
            setNewItemPhotoRequired(false);
            onUpdate?.();
        }
        setLoading(false);
    };

    const handleTogglePhotoRequired = async (item) => {
        setLoading(true);
        const result = await api.updateChecklistItem(item.id, null, null, !item.isPhotoRequired);
        if (result.success) {
            setItems(items.map(i => i.id === item.id ? { ...i, isPhotoRequired: !item.isPhotoRequired } : i));
            onUpdate?.();
        }
        setLoading(false);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Удалить пункт чек-листа?')) return;
        setLoading(true);
        const result = await api.deleteChecklistItem(id);
        if (result.success) {
            setItems(items.filter(i => i.id !== id));
            onUpdate?.();
        }
        setLoading(false);
    };

    const handleMove = async (index, direction) => {
        const newIndex = index + direction;
        if (newIndex < 0 || newIndex >= items.length) return;

        setLoading(true);
        const newItems = [...items];
        const temp = newItems[index];
        newItems[index] = newItems[newIndex];
        newItems[newIndex] = temp;

        // Update indexes on backend
        await Promise.all([
            api.updateChecklistItem(newItems[index].id, null, index),
            api.updateChecklistItem(newItems[newIndex].id, null, newIndex)
        ]);

        setItems(newItems.map((item, idx) => ({ ...item, orderIndex: idx })));
        setLoading(false);
    };

    return (
        <div className="space-y-3 mt-4 p-3 bg-white rounded-lg border border-slate-200">
            <h5 className="text-xs font-bold text-slate-500 uppercase">Чек-лист задачи</h5>

            <div className="space-y-2">
                {items.map((item, index) => (
                    <div key={item.id} className="flex items-center gap-2 p-2 bg-slate-50 rounded border border-slate-100 group">
                        <span className="text-[10px] font-bold text-slate-400">#{index + 1}</span>
                        <span className="flex-1 text-xs text-slate-700">{item.description}</span>

                        <div className="flex items-center gap-2 mr-2">
                            <label className="flex items-center gap-1 cursor-pointer" title="Фото обязательно">
                                <input
                                    type="checkbox"
                                    checked={item.isPhotoRequired}
                                    onChange={() => handleTogglePhotoRequired(item)}
                                    disabled={loading}
                                    className="w-3 h-3 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                />
                                <span className="text-[10px] text-slate-500 font-medium">Фото</span>
                            </label>
                        </div>

                        <div className="flex items-center gap-1 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                            <button
                                onClick={() => handleMove(index, -1)}
                                disabled={index === 0 || loading}
                                className="p-1 text-slate-400 hover:text-indigo-600 disabled:opacity-30"
                            >
                                ↑
                            </button>
                            <button
                                onClick={() => handleMove(index, 1)}
                                disabled={index === items.length - 1 || loading}
                                className="p-1 text-slate-400 hover:text-indigo-600 disabled:opacity-30"
                            >
                                ↓
                            </button>
                            <button
                                onClick={() => handleDelete(item.id)}
                                disabled={loading}
                                className="p-1 text-slate-400 hover:text-red-600"
                            >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                                </svg>
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            <form onSubmit={handleAdd} className="flex gap-2 mt-2">
                <input
                    className="flex-1 border-slate-200 rounded text-[11px] px-2 py-1 focus:ring-1 focus:ring-indigo-500"
                    placeholder="Новый пункт..."
                    value={newItemDesc}
                    onChange={e => setNewItemDesc(e.target.value)}
                    disabled={loading}
                />
                <label className="flex items-center gap-1 cursor-pointer bg-slate-50 px-2 rounded border border-slate-200">
                    <input
                        type="checkbox"
                        checked={newItemPhotoRequired}
                        onChange={(e) => setNewItemPhotoRequired(e.target.checked)}
                        className="w-3 h-3 rounded border-slate-300 text-indigo-600"
                    />
                    <span className="text-[9px] text-slate-500 font-bold uppercase">Фото</span>
                </label>
                <button
                    type="submit"
                    disabled={loading}
                    className="bg-indigo-600 text-white px-2 py-1 rounded text-[11px] font-bold hover:bg-indigo-700"
                >
                    +
                </button>
            </form>
        </div>
    );
};

export default ChecklistManager;
