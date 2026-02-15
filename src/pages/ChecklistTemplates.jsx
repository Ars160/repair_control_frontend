import { useState, useEffect } from 'react';
import api from '../api/client';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Sortable Item Component
const SortableItem = ({ id, item, idx, onRemove }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
    } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100 touch-none group">
            {/* Drag Handle Icon */}
            <div className="cursor-grab text-slate-300 hover:text-indigo-600 transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" /></svg>
            </div>

            <span className="text-xs font-bold text-slate-400 w-5 text-center">#{idx + 1}</span>
            <span className="flex-1 text-sm font-medium text-slate-700">{item.description}</span>

            {item.isPhotoRequired && (
                <span className="text-[10px] bg-indigo-100 text-indigo-700 px-2 py-1 rounded-lg font-bold">ФОТО</span>
            )}

            <button
                onClick={(e) => { e.stopPropagation(); onRemove(idx); }}
                className="text-slate-400 hover:text-red-500 ml-2 p-1"
                onPointerDown={e => e.stopPropagation()} // Prevent drag start on delete button
                onMouseDown={e => e.stopPropagation()}
            >
                ×
            </button>
        </div>
    );
};

const ChecklistTemplates = () => {
    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [newTemplate, setNewTemplate] = useState({ name: '', items: [] });
    const [newItemText, setNewItemText] = useState('');
    const [isPhotoRequired, setIsPhotoRequired] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState(null);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    useEffect(() => {
        loadTemplates();
    }, []);

    const startEditing = (template) => {
        setNewTemplate({
            name: template.name,
            items: (template.items || []).map(item => ({ ...item, id: item.id || `temp-${Math.random().toString(36).substr(2, 9)}` }))
        });
        setIsEditing(true);
    };

    const handleDragEnd = (event) => {
        const { active, over } = event;

        if (active.id !== over.id) {
            setNewTemplate((prev) => {
                const oldIndex = prev.items.findIndex(i => i.id === active.id);
                const newIndex = prev.items.findIndex(i => i.id === over.id);

                return {
                    ...prev,
                    items: arrayMove(prev.items, oldIndex, newIndex)
                };
            });
        }
    };

    const handleUpdateTemplate = async () => {
        if (!selectedTemplate) return;

        // 1. Try direct update
        const res = await api.updateTemplate(selectedTemplate.id, newTemplate);

        if (res.success) {
            setTemplates(templates.map(t => t.id === selectedTemplate.id ? res.data : t));
            setSelectedTemplate(res.data);
            setIsEditing(false);
            setNewTemplate({ name: '', items: [] });
        } else {
            // 2. If direct update fails (e.g. 405 Method Not Allowed, 403 Forbidden), try "Clone & Replace" approach
            console.warn("Direct update failed, attempting replace strategy...", res);

            // Check triggers: Status 403/404/405 OR specific message text
            const isMethodNotAllowed = res.status === 405 || (res.message && res.message.toLowerCase().includes('not supported'));
            const isForbidden = res.status === 403;

            if (isMethodNotAllowed || isForbidden) {
                // Nuclear sanitization: explicitly reconstruct object with primitives only
                // This strips any hidden proxies, IDs, or backend fields that cause "detached entity" errors
                const originalName = String(newTemplate.name);
                const templateToCreate = {
                    name: originalName,
                    items: newTemplate.items.map((item, idx) => ({
                        description: String(item.description || ""),
                        isPhotoRequired: Boolean(item.isPhotoRequired),
                        orderIndex: Number(idx) // Force re-index sequence
                    }))
                };

                let createRes = await api.createTemplate(templateToCreate);

                // Handle duplicate name error (Unique Constraint)
                if (!createRes.success && (createRes.message?.includes('duplicate') || createRes.message?.includes('violates unique constraint'))) {
                    const timeSuffix = new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }).replace(':', '-');
                    templateToCreate.name = `${templateToCreate.name} (корр. ${timeSuffix})`;
                    createRes = await api.createTemplate(templateToCreate);

                    if (createRes.success) {
                        alert(`Имя шаблона было изменено на "${templateToCreate.name}", так как шаблон с исходным именем уже существует и не может быть удален.`);
                    }
                }

                if (createRes.success) {
                    // Created new one, now try to delete the old one
                    const deleteRes = await api.deleteTemplate(selectedTemplate.id);

                    if (deleteRes.success) {
                        // Fully replaced
                        setTemplates(templates.map(t => t.id === selectedTemplate.id ? createRes.data : t));
                        setSelectedTemplate(createRes.data);
                    } else {
                        // Created but delete failed (likely used in projects), keep both but select new
                        setTemplates([...templates, createRes.data]);
                        setSelectedTemplate(createRes.data);
                        alert(
                            "ВНИМАНИЕ: Старый шаблон используется в системе, поэтому мы не удалили его.\n\n" +
                            "Создана НОВАЯ ВЕРСИЯ шаблона.\n" +
                            "Пожалуйста, используйте её для новых задач."
                        );
                    }
                    setIsEditing(false);
                    setNewTemplate({ name: '', items: [] });
                } else {
                    alert("Не удалось создать новую версию шаблона: " + createRes.message);
                }
            } else {
                alert("Ошибка обновления: " + res.message);
            }
        }
    };

    const loadTemplates = async () => {
        setLoading(true);
        const data = await api.getTemplates();
        setTemplates(data);
        setLoading(false);
    };

    const handleAddItem = () => {
        if (!newItemText.trim()) return;
        setNewTemplate(prev => ({
            ...prev,
            items: [...prev.items, {
                id: `temp-${Math.random().toString(36).substr(2, 9)}`,
                description: newItemText,
                isPhotoRequired: isPhotoRequired,
                orderIndex: prev.items.length
            }]
        }));
        setNewItemText('');
        setIsPhotoRequired(false);
    };

    const handleRemoveItem = (index) => {
        setNewTemplate(prev => ({
            ...prev,
            items: prev.items.filter((_, i) => i !== index)
        }));
    };

    const handleCreateTemplate = async (e) => {
        e.preventDefault();
        if (newTemplate.items.length === 0) {
            alert("Добавьте хотя бы один пункт чеклиста");
            return;
        }

        const res = await api.createTemplate(newTemplate);
        if (res.success) {
            const created = res.data;
            setTemplates([...templates, created]);
            setShowCreate(false);
            setNewTemplate({ name: '', items: [] });
            setSelectedTemplate(created);
        } else {
            alert(res.message);
        }
    };

    const handleDeleteTemplate = async (id, e) => {
        e.stopPropagation();
        if (window.confirm("Удалить этот шаблон?")) {
            const res = await api.deleteTemplate(id);
            if (res.success) {
                setTemplates(templates.filter(t => t.id !== id));
                if (selectedTemplate?.id === id) setSelectedTemplate(null);
            } else {
                // Check for FK violation
                if (res.message && (res.message.includes("violates foreign key") || res.message.includes("constraint"))) {
                    alert("Невозможно удалить шаблон: он уже используется в задачах или видах работ.");
                } else {
                    alert(res.message);
                }
            }
        }
    };

    return (
        <div className="flex h-[calc(100vh-4rem)] max-w-7xl mx-auto overflow-hidden bg-slate-50/50 rounded-2xl border border-slate-200 shadow-sm my-4">

            {/* Sidebar List */}
            <div className={`${(selectedTemplate || showCreate) ? 'hidden md:flex' : 'flex'} w-full md:w-1/3 border-r border-slate-200 flex-col bg-white`}>
                <div className="p-4 border-b border-slate-100">
                    <h2 className="text-lg font-bold text-slate-800 mb-1">Шаблоны чеклистов</h2>
                    <p className="text-xs text-slate-500 mb-4">Список проверок для задач</p>

                    <button
                        onClick={() => setShowCreate(true)}
                        className="w-full py-2.5 bg-indigo-50 text-indigo-600 border border-indigo-100 hover:bg-indigo-100 rounded-xl font-bold transition-all flex items-center justify-center gap-2 text-sm"
                    >
                        <span>+ Новый чеклист</span>
                    </button>

                    {showCreate && !selectedTemplate && (
                        <div className="mt-4 p-4 bg-indigo-50/50 rounded-xl border border-indigo-100 animate-fadeIn md:hidden">
                            {/* Mobile Create Form Inline */}
                            <h3 className="font-bold text-sm text-indigo-900 mb-2">Создание шаблона</h3>
                            {/* Simplified creation for mobile could go here, or just redirect focus to main area */}
                            <p className="text-xs text-indigo-600">Переключитесь на десктоп или используйте форму справа (на больших экранах).</p>
                        </div>
                    )}
                </div>

                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                    {loading ? (
                        <div className="text-center py-10 text-slate-400 text-sm">Загрузка...</div>
                    ) : templates.length === 0 ? (
                        <div className="text-center py-10 text-slate-400 text-sm">Нет шаблонов</div>
                    ) : (
                        templates.map(tpl => (
                            <div
                                key={tpl.id}
                                onClick={() => { setSelectedTemplate(tpl); setShowCreate(false); }}
                                className={`group p-3 rounded-xl cursor-pointer border transition-all ${selectedTemplate?.id === tpl.id
                                    ? 'bg-indigo-50 border-indigo-200 shadow-sm'
                                    : 'bg-white border-transparent hover:bg-slate-50 hover:border-slate-200'
                                    }`}
                            >
                                <div className="flex justify-between items-center">
                                    <h3 className={`font-bold text-sm ${selectedTemplate?.id === tpl.id ? 'text-indigo-700' : 'text-slate-700'}`}>{tpl.name}</h3>
                                    <button
                                        onClick={(e) => handleDeleteTemplate(tpl.id, e)}
                                        className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-600 lg:group-hover:block"
                                    >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                </div>
                                <div className="mt-1 text-xs text-slate-400">
                                    {tpl.items?.length || 0} пунктов
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Main Content */}
            <div className={`${!selectedTemplate && !showCreate ? 'hidden md:flex' : 'flex'} w-full md:w-2/3 flex-col bg-slate-50/30 overflow-hidden relative`}>

                {/* Mobile Back Button */}
                {(selectedTemplate || showCreate) && (
                    <div className="md:hidden p-4 border-b border-slate-200 bg-white flex items-center gap-3 sticky top-0 z-10">
                        <button onClick={() => { setSelectedTemplate(null); setShowCreate(false); setIsEditing(false); }} className="p-1 -ml-1 text-slate-500">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                        <span className="font-bold text-slate-800 truncate">
                            {showCreate ? 'Новый шаблон' : selectedTemplate.name}
                        </span>
                    </div>
                )}

                <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-10">
                    <div className="max-w-2xl mx-auto">

                        {showCreate || isEditing ? (
                            <div className="animate-fadeIn">
                                <h2 className="text-2xl font-bold text-slate-800 mb-6">{isEditing ? 'Редактирование шаблона' : 'Создание чеклиста'}</h2>
                                <div className="bg-white p-6 rounded-2xl border border-indigo-100 shadow-xl shadow-indigo-100/50">
                                    <div className="space-y-6">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Название шаблона</label>
                                            <input
                                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all outline-none"
                                                placeholder="Например: Покраска стен"
                                                value={newTemplate.name}
                                                onChange={e => setNewTemplate({ ...newTemplate, name: e.target.value })}
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Пункты чеклиста</label>
                                            <div className="space-y-2 mb-4">
                                                <DndContext
                                                    sensors={sensors}
                                                    collisionDetection={closestCenter}
                                                    onDragEnd={handleDragEnd}
                                                >
                                                    <SortableContext
                                                        items={newTemplate.items.map(item => item.id)}
                                                        strategy={verticalListSortingStrategy}
                                                    >
                                                        {newTemplate.items.map((item, idx) => (
                                                            <SortableItem
                                                                key={item.id}
                                                                id={item.id}
                                                                item={item}
                                                                idx={idx}
                                                                onRemove={handleRemoveItem}
                                                            />
                                                        ))}
                                                    </SortableContext>
                                                </DndContext>
                                                {newTemplate.items.length === 0 && (
                                                    <div className="text-center text-slate-400 text-sm italic py-4 border-2 border-dashed border-slate-200 rounded-xl">Список пуст</div>
                                                )}
                                            </div>

                                            <div className="flex flex-col sm:flex-row gap-2">
                                                <input
                                                    className="w-full border border-slate-200 bg-white rounded-xl text-sm px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 outline-none"
                                                    placeholder="Текст пункта..."
                                                    value={newItemText}
                                                    onChange={e => setNewItemText(e.target.value)}
                                                    onKeyDown={e => e.key === 'Enter' && handleAddItem()}
                                                />
                                                <div className="flex gap-2">
                                                    <div className="flex items-center bg-white px-3 rounded-xl border border-slate-200 flex-1 sm:flex-none justify-center sm:justify-start">
                                                        <input
                                                            type="checkbox"
                                                            id="photoReq"
                                                            checked={isPhotoRequired}
                                                            onChange={e => setIsPhotoRequired(e.target.checked)}
                                                            className="mr-2 text-indigo-600 focus:ring-indigo-500 rounded"
                                                        />
                                                        <label htmlFor="photoReq" className="text-xs font-bold text-slate-600 cursor-pointer select-none">Фото</label>
                                                    </div>
                                                    <button
                                                        onClick={handleAddItem}
                                                        disabled={!newItemText.trim()}
                                                        className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-indigo-200"
                                                    >
                                                        +
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4 border-t border-slate-100">
                                            <button
                                                onClick={() => { setShowCreate(false); setIsEditing(false); }}
                                                className="w-full sm:flex-1 bg-white border border-slate-200 text-slate-600 py-3 rounded-xl font-bold hover:bg-slate-50 transition-colors"
                                            >
                                                Отмена
                                            </button>
                                            <button
                                                onClick={isEditing ? handleUpdateTemplate : handleCreateTemplate}
                                                disabled={!newTemplate.name || newTemplate.items.length === 0}
                                                className="w-full sm:flex-1 bg-gradient-to-r from-indigo-600 to-blue-600 text-white py-3 rounded-xl font-bold hover:shadow-lg hover:shadow-indigo-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {isEditing ? 'Сохранить изменения' : 'Создать шаблон'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : selectedTemplate ? (
                            <div className="animate-fadeIn">
                                <div className="flex justify-between items-start mb-6">
                                    <div>
                                        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800 mb-1">{selectedTemplate.name}</h1>
                                        <p className="text-slate-500 text-sm">Шаблон чеклиста</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => startEditing(selectedTemplate)}
                                            className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                            title="Редактировать"
                                        >
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                        </button>
                                        <button
                                            onClick={(e) => handleDeleteTemplate(selectedTemplate.id, e)}
                                            className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                                            title="Удалить"
                                        >
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    {selectedTemplate.items?.map((item, idx) => (
                                        <div key={idx} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
                                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-xs">
                                                {idx + 1}
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-medium text-slate-800">{item.description}</p>
                                            </div>
                                            {item.isPhotoRequired && (
                                                <span className="text-[10px] bg-indigo-50 text-indigo-600 px-2 py-1 rounded-lg font-bold border border-indigo-100">
                                                    📷 Фото
                                                </span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-slate-300 py-20 text-center">
                                <div className="bg-slate-100 p-6 rounded-full mb-6">
                                    <svg className="w-16 h-16 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                                    </svg>
                                </div>
                                <h2 className="text-xl font-bold text-slate-600">Выберите шаблон</h2>
                                <p className="text-sm mt-2 text-slate-400">или создайте новый чеклист</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ChecklistTemplates;
