import { useState, useEffect } from 'react';
import api from '../api/client';

const SubObjectTemplateManager = ({ onClose }) => {
    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [checklistTemplates, setChecklistTemplates] = useState([]);

    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [newTemplateName, setNewTemplateName] = useState('');

    const [showTaskForm, setShowTaskForm] = useState(false);
    const [newTask, setNewTask] = useState({
        name: '',
        checklistTemplateId: '',
        orderIndex: 0
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        const [tpls, checkTpls] = await Promise.all([
            api.getAllSubObjectTemplates(),
            api.getTemplates()
        ]);
        setTemplates(tpls);
        setChecklistTemplates(checkTpls);
        setLoading(false);
    };

    const handleCreateTemplate = async (e) => {
        e.preventDefault();
        const res = await api.createSubObjectTemplate(newTemplateName);
        if (res.success) {
            setTemplates([...templates, res.data]);
            setNewTemplateName('');
            setShowCreateForm(false);
        } else alert(res.message);
    };

    const handleDeleteTemplate = async (id) => {
        if (!window.confirm('Удалить этот шаблон?')) return;
        const res = await api.deleteSubObjectTemplate(id);
        if (res.success) {
            setTemplates(templates.filter(t => t.id !== id));
            if (selectedTemplate?.id === id) setSelectedTemplate(null);
        } else alert(res.message);
    };

    const handleAddTask = async (e) => {
        e.preventDefault();
        if (!newTask.checklistTemplateId) {
            alert('Выберите шаблон чеклиста');
            return;
        }

        const res = await api.addTaskTemplateToSubObject(
            selectedTemplate.id,
            newTask.name,
            Number(newTask.checklistTemplateId),
            selectedTemplate.taskTemplates?.length || 0
        );

        if (res.success) {
            // Update local state
            const updatedTemplate = {
                ...selectedTemplate,
                taskTemplates: [...(selectedTemplate.taskTemplates || []), res.data]
            };
            setTemplates(templates.map(t => t.id === selectedTemplate.id ? updatedTemplate : t));
            setSelectedTemplate(updatedTemplate);
            setShowTaskForm(false);
            setNewTask({ name: '', checklistTemplateId: '', orderIndex: 0 });
        } else alert(res.message);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden border border-white/50">
                {/* Header */}
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 backdrop-blur-xl">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-800">Шаблоны Подобъектов</h2>
                        <p className="text-sm text-slate-500">Настройте типовые наборы задач для разных видов работ</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                        <svg className="w-6 h-6 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="flex-1 overflow-hidden flex">
                    {/* Sidebar: Template List */}
                    <div className="w-1/3 border-r border-slate-100 flex flex-col bg-slate-50">
                        <div className="p-4">
                            <button
                                onClick={() => setShowCreateForm(true)}
                                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2"
                            >
                                <span>+ Новый шаблон</span>
                            </button>
                        </div>

                        {showCreateForm && (
                            <form onSubmit={handleCreateTemplate} className="px-4 pb-4 animate-fadeIn">
                                <div className="bg-white p-3 rounded-xl border border-indigo-100 shadow-sm">
                                    <input
                                        autoFocus
                                        className="w-full text-sm font-bold border-none focus:ring-0 p-0 mb-2 placeholder:font-normal"
                                        placeholder="Название (напр. Стяжка)"
                                        value={newTemplateName}
                                        onChange={e => setNewTemplateName(e.target.value)}
                                        required
                                    />
                                    <div className="flex gap-2">
                                        <button type="submit" className="flex-1 bg-indigo-100 text-indigo-700 py-1.5 rounded-lg text-xs font-bold hover:bg-indigo-200">Создать</button>
                                        <button type="button" onClick={() => setShowCreateForm(false)} className="flex-1 bg-slate-100 text-slate-600 py-1.5 rounded-lg text-xs font-bold hover:bg-slate-200">Отмена</button>
                                    </div>
                                </div>
                            </form>
                        )}

                        <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2">
                            {loading ? (
                                <div className="text-center py-10 text-slate-400">Загрузка...</div>
                            ) : templates.length === 0 ? (
                                <div className="text-center py-10 text-slate-400 text-sm">Нет шаблонов</div>
                            ) : (
                                templates.map(tpl => (
                                    <div
                                        key={tpl.id}
                                        onClick={() => setSelectedTemplate(tpl)}
                                        className={`group p-4 rounded-2xl cursor-pointer border transition-all ${selectedTemplate?.id === tpl.id
                                            ? 'bg-white border-indigo-500 shadow-md ring-1 ring-indigo-500'
                                            : 'bg-white border-slate-200 hover:border-indigo-300 hover:shadow-sm'
                                            }`}
                                    >
                                        <div className="flex justify-between items-center">
                                            <h3 className={`font-bold ${selectedTemplate?.id === tpl.id ? 'text-indigo-700' : 'text-slate-700'}`}>{tpl.name}</h3>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleDeleteTemplate(tpl.id); }}
                                                className="opacity-100 lg:opacity-0 lg:group-hover:opacity-100 p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                            >
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        </div>
                                        <div className="mt-2 flex items-center gap-2 text-xs text-slate-400 font-medium">
                                            <span className="bg-slate-100 px-2 py-1 rounded-md">{tpl.taskTemplates?.length || 0} задач</span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Main Content: Template Details */}
                    <div className="flex-1 bg-slate-50/30 overflow-y-auto p-6 lg:p-10">
                        {selectedTemplate ? (
                            <div className="max-w-3xl mx-auto space-y-6">
                                <div className="flex justify-between items-end">
                                    <div>
                                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Выбранный шаблон</h3>
                                        <h1 className="text-3xl font-extrabold text-slate-800">{selectedTemplate.name}</h1>
                                    </div>
                                    <button
                                        onClick={() => setShowTaskForm(true)}
                                        className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 hover:-translate-y-0.5 transition-all flex items-center gap-2"
                                    >
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                        </svg>
                                        Добавить задачу
                                    </button>
                                </div>

                                {showTaskForm && (
                                    <div className="bg-white p-6 rounded-2xl border border-indigo-100 shadow-xl shadow-indigo-100/50 animate-fadeIn mb-6">
                                        <h4 className="text-lg font-bold text-indigo-900 mb-4">Новая задача в шаблоне</h4>
                                        <form onSubmit={handleAddTask} className="space-y-4">
                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Название задачи</label>
                                                <input
                                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all outline-none"
                                                    placeholder="Например: Подготовка основания"
                                                    value={newTask.name}
                                                    onChange={e => setNewTask({ ...newTask, name: e.target.value })}
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Шаблон чеклиста</label>
                                                <select
                                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all outline-none"
                                                    value={newTask.checklistTemplateId}
                                                    onChange={e => setNewTask({ ...newTask, checklistTemplateId: e.target.value })}
                                                    required
                                                >
                                                    <option value="">Выберите чеклист...</option>
                                                    {checklistTemplates.map(ct => (
                                                        <option key={ct.id} value={ct.id}>{ct.name}</option>
                                                    ))}
                                                </select>
                                                <p className="text-xs text-slate-400 mt-2">
                                                    Задача будет создана с пунктами из выбранного шаблона чеклиста.
                                                </p>
                                            </div>
                                            <div className="flex justify-end gap-3 pt-2">
                                                <button type="button" onClick={() => setShowTaskForm(false)} className="px-5 py-2.5 rounded-xl font-bold text-slate-500 hover:bg-slate-100 transition-colors">Отмена</button>
                                                <button type="submit" className="px-6 py-2.5 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all">Сохранить</button>
                                            </div>
                                        </form>
                                    </div>
                                )}

                                <div className="space-y-3">
                                    {(selectedTemplate.taskTemplates || [])
                                        .sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0))
                                        .map((task, idx) => (
                                            <div key={task.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex items-center justify-between group">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-xs">
                                                        {idx + 1}
                                                    </div>
                                                    <div>
                                                        <h4 className="font-bold text-slate-800 text-lg">{task.name}</h4>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <span className="text-xs text-slate-400 font-medium bg-slate-50 px-2 py-1 rounded">
                                                                Чеклист: {task.checklistTemplate?.name || 'Не указан'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                                {/* Actions like delete task template could go here */}
                                            </div>
                                        ))}

                                    {(!selectedTemplate.taskTemplates || selectedTemplate.taskTemplates.length === 0) && (
                                        <div className="text-center py-12 bg-white rounded-3xl border border-dashed border-slate-300">
                                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                                <svg className="w-8 h-8 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                                                </svg>
                                            </div>
                                            <h3 className="text-lg font-bold text-slate-800 mb-1">Список задач пуст</h3>
                                            <p className="text-slate-500 max-w-xs mx-auto mb-6">Добавьте типовые задачи, которые будут создаваться для этого вида работ</p>
                                            <button onClick={() => setShowTaskForm(true)} className="text-indigo-600 font-bold hover:underline">Добавить первую задачу</button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-slate-300">
                                <svg className="w-24 h-24 mb-6 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                </svg>
                                <p className="text-xl font-bold">Выберите шаблон слева</p>
                                <p className="text-sm mt-2 opacity-75">или создайте новый</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SubObjectTemplateManager;
