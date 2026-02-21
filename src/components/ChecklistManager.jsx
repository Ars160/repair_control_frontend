import { useState, useEffect } from 'react';
import api from '../api/client';

const ChecklistManager = ({ taskId, onUpdate, initialItems = [] }) => {
    const [items, setItems] = useState([]);
    const [templates, setTemplates] = useState([]);
    const [newItemDesc, setNewItemDesc] = useState('');
    const [newItemPhotoRequired, setNewItemPhotoRequired] = useState(false);
    const [newItemMethodology, setNewItemMethodology] = useState('');
    const [editingMethodology, setEditingMethodology] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (taskId) {
            loadChecklist();
        } else {
            setItems(initialItems);
        }
        loadTemplates();
    }, [taskId]);

    const loadChecklist = async () => {
        const data = await api.getChecklistsByTask(taskId);
        setItems(data.sort((a, b) => a.orderIndex - b.orderIndex));
    };

    const loadTemplates = async () => {
        const data = await api.getTemplates();
        setTemplates(data);
    };

    const handleAdd = async (e) => {
        if (e) e.preventDefault();
        if (!newItemDesc.trim()) return;

        if (taskId) {
            setLoading(true);
            const nextIndex = items.length;
            const result = await api.createChecklistItem(taskId, newItemDesc, nextIndex, newItemPhotoRequired, newItemMethodology || null);
            if (result.success) {
                const updatedItems = [...items, result.data];
                setItems(updatedItems);
                setNewItemDesc('');
                setNewItemPhotoRequired(false);
                setNewItemMethodology('');
                onUpdate?.(updatedItems);
            } else {
                alert(result.message || 'Ошибка при добавлении пункта');
            }
            setLoading(false);
        } else {
            // Local mode
            const newItem = {
                id: Date.now(), // temporary UI id
                description: newItemDesc,
                isPhotoRequired: newItemPhotoRequired,
                methodology: newItemMethodology || null,
                isCompleted: false
            };
            const updatedItems = [...items, newItem];
            setItems(updatedItems);
            setNewItemDesc('');
            setNewItemPhotoRequired(false);
            setNewItemMethodology('');
            onUpdate?.(updatedItems);
        }
    };

    const handleTemplateSelect = async (e) => {
        const templateId = Number(e.target.value);
        if (!templateId) return;

        const template = templates.find(t => t.id === templateId);
        if (template) {
            if (items.length > 0 && !window.confirm("Заменить текущий чек-лист пунктами из шаблона?")) {
                e.target.value = "";
                return;
            }

            const newItems = template.items.map((item, idx) => ({
                description: item.description,
                isPhotoRequired: item.isPhotoRequired,
                methodology: item.methodology || null,
                orderIndex: idx
            }));

            if (taskId) {
                setLoading(true);
                // In a real app we might have a bulk upload, but here we do it item by item or clear and add
                // To keep it simple, we'll suggest the user that it might take a moment
                // Actually, let's just update local items and let the user save the task if we were doing a full sync
                // But ChecklistManager is immediate-sync. 
                // Let's clear existing items first
                for (const item of items) {
                    await api.deleteChecklistItem(item.id);
                }
                const createdItems = [];
                for (const item of newItems) {
                    const res = await api.createChecklistItem(taskId, item.description, item.orderIndex, item.isPhotoRequired, item.methodology);
                    if (res.success) createdItems.push(res.data);
                }
                setItems(createdItems);
                onUpdate?.(createdItems);
                setLoading(false);
            } else {
                setItems(newItems.map(i => ({ ...i, id: Math.random() })));
                onUpdate?.(newItems);
            }
        }
        e.target.value = ""; // Reset select
    };

    const handleTogglePhotoRequired = async (item) => {
        if (taskId) {
            setLoading(true);
            const result = await api.updateChecklistItem(item.id, null, null, !item.isPhotoRequired);
            if (result.success) {
                const updatedItems = items.map(i => i.id === item.id ? { ...i, isPhotoRequired: !item.isPhotoRequired } : i);
                setItems(updatedItems);
                onUpdate?.(updatedItems);
            }
            setLoading(false);
        } else {
            const updatedItems = items.map(i => i.id === item.id ? { ...i, isPhotoRequired: !i.isPhotoRequired } : i);
            setItems(updatedItems);
            onUpdate?.(updatedItems);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Удалить пункт чек-листа?')) return;
        if (taskId) {
            setLoading(true);
            const result = await api.deleteChecklistItem(id);
            if (result.success) {
                const updatedItems = items.filter(i => i.id !== id);
                setItems(updatedItems);
                onUpdate?.(updatedItems);
            }
            setLoading(false);
        } else {
            const updatedItems = items.filter(i => i.id !== id);
            setItems(updatedItems);
            onUpdate?.(updatedItems);
        }
    };

    const handleMove = async (index, direction) => {
        const newIndex = index + direction;
        if (newIndex < 0 || newIndex >= items.length) return;

        const newItems = [...items];
        const temp = newItems[index];
        newItems[index] = newItems[newIndex];
        newItems[newIndex] = temp;

        if (taskId) {
            setLoading(true);
            await Promise.all([
                api.updateChecklistItem(newItems[index].id, null, index),
                api.updateChecklistItem(newItems[newIndex].id, null, newIndex)
            ]);
            setLoading(false);
        }

        const updatedItems = newItems.map((item, idx) => ({ ...item, orderIndex: idx }));
        setItems(updatedItems);
        onUpdate?.(updatedItems);
    };

    return (
        <div className="pt-2 border-t border-indigo-100 mb-2">
            <div className="flex justify-between items-center mb-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Чек-лист</label>
                <select
                    className="text-xs border-none bg-indigo-50 text-indigo-600 font-bold focus:ring-0 cursor-pointer hover:bg-indigo-100 rounded px-2 py-0.5 transition-colors"
                    onChange={handleTemplateSelect}
                    defaultValue=""
                    disabled={loading}
                >
                    <option value="" disabled>Загрузить шаблон...</option>
                    <option value="custom" className="font-bold text-orange-600">-- Пустой (сбросить) --</option>
                    {templates.map(t => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                </select>
            </div>

            <div className="space-y-1 mb-2">
                {items.map((item, index) => (
                    <div key={item.id} className="bg-white rounded-lg border border-slate-100 group relative overflow-hidden">
                        <div className="flex gap-1 items-center p-1.5">
                            <span className="text-[10px] text-slate-400">#{index + 1}</span>
                            <span className="flex-1 text-[11px] truncate" title={item.description}>{item.description}</span>
                            <div className="flex items-center gap-1 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                                <label className="flex items-center gap-0.5 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={item.isPhotoRequired}
                                        onChange={() => handleTogglePhotoRequired(item)}
                                        disabled={loading}
                                        className="w-2.5 h-2.5 rounded border-slate-300 text-indigo-600"
                                    />
                                    <span className="text-[9px] text-slate-500 font-bold">Фото</span>
                                </label>
                                <button
                                    onClick={() => setEditingMethodology(editingMethodology === item.id ? null : item.id)}
                                    className={`text-[9px] px-1.5 py-0.5 rounded font-bold transition-colors ${item.methodology ? 'bg-indigo-50 text-indigo-600' : 'text-slate-400 hover:text-indigo-600 hover:bg-indigo-50'}`}
                                    title={item.methodology ? 'Редактировать методику' : 'Добавить методику'}
                                >
                                    📋
                                </button>
                                <div className="flex gap-0.5 ml-1">
                                    <button onClick={() => handleMove(index, -1)} disabled={index === 0 || loading} className="text-slate-300 hover:text-indigo-600 text-[10px]">↑</button>
                                    <button onClick={() => handleMove(index, 1)} disabled={index === items.length - 1 || loading} className="text-slate-300 hover:text-indigo-600 text-[10px]">↓</button>
                                </div>
                                <button
                                    onClick={() => handleDelete(item.id)}
                                    disabled={loading}
                                    className="text-red-400 hover:text-red-600 px-1 text-sm font-bold"
                                >
                                    ×
                                </button>
                            </div>
                        </div>
                        {item.methodology && editingMethodology !== item.id && (
                            <div className="px-2 pb-1.5 -mt-0.5">
                                <p className="text-[9px] text-indigo-600 bg-indigo-50 px-2 py-1 rounded truncate" title={item.methodology}>📋 {item.methodology}</p>
                            </div>
                        )}
                        {editingMethodology === item.id && (
                            <div className="px-2 pb-2 space-y-1">
                                <textarea
                                    className="w-full border border-indigo-200 rounded-lg text-[11px] px-2 py-1.5 bg-indigo-50/50 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none resize-none"
                                    placeholder="Описание методики выполнения..."
                                    rows={2}
                                    defaultValue={item.methodology || ''}
                                    onBlur={(e) => {
                                        const val = e.target.value.trim();
                                        const updatedItems = items.map(i => i.id === item.id ? { ...i, methodology: val || null } : i);
                                        setItems(updatedItems);
                                        onUpdate?.(updatedItems);
                                        setEditingMethodology(null);
                                    }}
                                    autoFocus
                                />
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <div className="flex flex-col gap-2">
                <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Добавить пункт</label>
                    <input
                        className="w-full border border-slate-300 rounded-lg text-sm px-3 py-2 bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none shadow-sm"
                        placeholder="Новый пункт чек-листа..."
                        value={newItemDesc}
                        onChange={e => setNewItemDesc(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                handleAdd();
                            }
                        }}
                        disabled={loading}
                    />
                </div>
                <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Методика (необязательно)</label>
                    <textarea
                        className="w-full border border-slate-300 rounded-lg text-xs px-3 py-2 bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none shadow-sm resize-none"
                        placeholder="Опишите как выполнить этот пункт..."
                        value={newItemMethodology}
                        onChange={e => setNewItemMethodology(e.target.value)}
                        rows={2}
                        disabled={loading}
                    />
                </div>
                <div className="flex gap-2">
                    <label className="flex items-center gap-2 cursor-pointer bg-white px-3 py-2 rounded-lg border border-slate-300 flex-1 shadow-sm hover:border-indigo-300 transition-colors">
                        <input
                            type="checkbox"
                            checked={newItemPhotoRequired}
                            onChange={(e) => setNewItemPhotoRequired(e.target.checked)}
                            className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="text-[10px] text-slate-600 font-bold uppercase tracking-wider">ТРЕБУЕТСЯ ФОТО</span>
                    </label>
                    <button
                        type="button"
                        onClick={handleAdd}
                        disabled={loading}
                        className="bg-indigo-600 text-white px-5 rounded-lg font-bold hover:bg-indigo-700 transition-all active:scale-95 shadow-md shadow-indigo-200 text-base flex items-center justify-center p-2"
                    >
                        +
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ChecklistManager;
