import { useState, useEffect } from 'react';
import api from '../api/client';

const WorkTemplates = () => {
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

    const [isSidebarOpen, setIsSidebarOpen] = useState(true); // For mobile responsiveness
    const [isRenaming, setIsRenaming] = useState(false);
    const [renameValue, setRenameValue] = useState('');

    useEffect(() => {
        loadData();
    }, []);

    const handleRenameTemplate = async () => {
        if (!selectedTemplate || !renameValue.trim()) return;
        const res = await api.updateSubObjectTemplate(selectedTemplate.id, renameValue);
        if (res.success) {
            const updated = res.data;
            // Preserve tasks as update might return clean object
            if (selectedTemplate.taskTemplates) updated.taskTemplates = selectedTemplate.taskTemplates;

            setTemplates(templates.map(t => t.id === selectedTemplate.id ? updated : t));
            setSelectedTemplate(updated);
            setIsRenaming(false);
        } else {
            alert(res.message);
        }
    };

    const handleDeleteTaskTemplate = async (taskId) => {
        if (!window.confirm("Удалить эту задачу из шаблона?")) return;
        const res = await api.deleteTaskTemplateFromSubObject(taskId);
        if (res.success) {
            const updatedTasks = selectedTemplate.taskTemplates.filter(t => t.id !== taskId);
            const updatedTemplate = { ...selectedTemplate, taskTemplates: updatedTasks };

            setSelectedTemplate(updatedTemplate);
            setTemplates(templates.map(t => t.id === selectedTemplate.id ? updatedTemplate : t));
        } else {
            alert(res.message);
        }
    };

    const loadData = async () => {
        setLoading(true);
        try {
            const [tpls, checkTpls] = await Promise.all([
                api.getAllSubObjectTemplates(),
                api.getTemplates()
            ]);
            setTemplates(tpls);
            setChecklistTemplates(checkTpls);
        } catch (error) {
            console.error("Failed to load templates", error);
        } finally {
            setLoading(false);
            // On mobile, hide sidebar initially if data is loaded, but managing this via CSS classes is cleaner
        }
    };

    const handleCreateTemplate = async (e) => {
        e.preventDefault();
        const res = await api.createSubObjectTemplate(newTemplateName);
        if (res.success) {
            setTemplates([...templates, res.data]);
            setNewTemplateName('');
            setShowCreateForm(false);
            setSelectedTemplate(res.data); // Auto select new
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
        <div className="flex h-[calc(100vh-4rem)] max-w-7xl mx-auto overflow-hidden bg-slate-50/50 rounded-2xl border border-slate-200 shadow-sm my-4">
            {/* Sidebar: Template List */}
            <div className={`${selectedTemplate ? 'hidden md:flex' : 'flex'} w-full md:w-1/3 border-r border-slate-200 flex-col bg-white`}>
                <div className="p-4 border-b border-slate-100">
                    <h2 className="text-lg font-bold text-slate-800 mb-1">Шаблоны работ</h2>
                    <p className="text-xs text-slate-500 mb-4">Наборы задач для видов работ</p>

                    <button
                        onClick={() => setShowCreateForm(true)}
                        className="w-full py-2.5 bg-orange-50 text-orange-600 border border-orange-100 hover:bg-orange-100 rounded-xl font-bold transition-all flex items-center justify-center gap-2 text-sm"
                    >
                        <span>+ Новый вид работ</span>
                    </button>
                </div>

                {showCreateForm && (
                    <form onSubmit={handleCreateTemplate} className="p-4 bg-orange-50/30 border-b border-orange-100 animate-fadeIn">
                        <input
                            autoFocus
                            className="w-full text-sm font-bold border-none focus:ring-0 p-0 mb-2 placeholder:font-normal bg-transparent"
                            placeholder="Название (напр. Стяжка)"
                            value={newTemplateName}
                            onChange={e => setNewTemplateName(e.target.value)}
                            required
                        />
                        <div className="flex gap-2">
                            <button type="submit" className="flex-1 bg-orange-500 text-white py-1.5 rounded-lg text-xs font-bold hover:bg-orange-600 shadow-sm shadow-orange-200">Создать</button>
                            <button type="button" onClick={() => setShowCreateForm(false)} className="flex-1 bg-white border border-slate-200 text-slate-600 py-1.5 rounded-lg text-xs font-bold hover:bg-slate-50">Отмена</button>
                        </div>
                    </form>
                )}

                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                    {loading ? (
                        <div className="text-center py-10 text-slate-400 text-sm">Загрузка...</div>
                    ) : templates.length === 0 ? (
                        <div className="text-center py-10 text-slate-400 text-sm">Нет шаблонов</div>
                    ) : (
                        templates.map(tpl => (
                            <div
                                key={tpl.id}
                                onClick={() => setSelectedTemplate(tpl)}
                                className={`group p-3 rounded-xl cursor-pointer border transition-all ${selectedTemplate?.id === tpl.id
                                    ? 'bg-orange-50 border-orange-200 shadow-sm'
                                    : 'bg-white border-transparent hover:bg-slate-50 hover:border-slate-200'
                                    }`}
                            >
                                <div className="flex justify-between items-center">
                                    <h3 className={`font-bold text-sm ${selectedTemplate?.id === tpl.id ? 'text-orange-700' : 'text-slate-700'}`}>{tpl.name}</h3>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleDeleteTemplate(tpl.id); }}
                                        className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-600 lg:group-hover:block"
                                    >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                </div>
                                <div className="mt-1 flex items-center gap-2 text-xs text-slate-400">
                                    <span>{tpl.taskTemplates?.length || 0} задач</span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Main Content: Template Details */}
            <div className={`${!selectedTemplate ? 'hidden md:flex' : 'flex'} w-full md:w-2/3 flex-col bg-slate-50/30 overflow-hidden relative`}>

                {selectedTemplate ? (
                    <>
                        {/* Mobile Back Button */}
                        <div className="md:hidden p-4 border-b border-slate-200 bg-white flex items-center gap-3 sticky top-0 z-10">
                            <button onClick={() => setSelectedTemplate(null)} className="p-1 -ml-1 text-slate-500">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                            </button>
                            <span className="font-bold text-slate-800 truncate">{selectedTemplate.name}</span>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-10">
                            <div className="max-w-3xl mx-auto space-y-6">
                                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4">
                                    <div>
                                        {isRenaming ? (
                                            <div className="flex gap-2 items-center mb-1">
                                                <input
                                                    className="text-2xl sm:text-3xl font-extrabold text-slate-800 border-b border-slate-300 focus:border-indigo-500 outline-none bg-transparent w-full"
                                                    value={renameValue}
                                                    onChange={(e) => setRenameValue(e.target.value)}
                                                />
                                                <button onClick={handleRenameTemplate} className="p-1 text-green-600 hover:bg-green-50 rounded">
                                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                                </button>
                                                <button onClick={() => setIsRenaming(false)} className="p-1 text-slate-400 hover:bg-slate-100 rounded">
                                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2 group/title">
                                                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800">{selectedTemplate.name}</h1>
                                                <button
                                                    onClick={() => { setRenameValue(selectedTemplate.name); setIsRenaming(true); }}
                                                    className="opacity-0 group-hover/title:opacity-100 p-1.5 text-slate-400 hover:text-indigo-600 transition-all font-normal"
                                                >
                                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => setShowTaskForm(true)}
                                        className="w-full sm:w-auto bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
                                    >
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                        </svg>
                                        Добавить задачу
                                    </button>
                                </div>

                                {showTaskForm && (
                                    <div className="bg-white p-6 rounded-2xl border border-indigo-100 shadow-xl shadow-indigo-100/50 animate-fadeIn relative">
                                        <button onClick={() => setShowTaskForm(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                        </button>
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
                                            <div className="flex justify-end pt-2">
                                                <button type="submit" className="w-full sm:w-auto px-6 py-2.5 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all">Сохранить</button>
                                            </div>
                                        </form>
                                    </div>
                                )}

                                <div className="space-y-3 pb-10">
                                    {(selectedTemplate.taskTemplates || [])
                                        .sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0))
                                        .map((task, idx) => (
                                            <div key={task.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex items-center justify-between group">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-xs ring-2 ring-white">
                                                        {idx + 1}
                                                    </div>
                                                    <div>
                                                        <h4 className="font-bold text-slate-800 text-base sm:text-lg">{task.name}</h4>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <span className="text-xs text-slate-500 font-medium bg-slate-100 px-2 py-1 rounded">
                                                                Чеклист: {task.checklistTemplate?.name || 'Не указан'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={() => handleDeleteTaskTemplate(task.id)}
                                                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                        title="Удалить задачу"
                                                    >
                                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                    </button>
                                                </div>
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
                        </div>
                    </>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-slate-300 p-8 text-center">
                        <div className="bg-slate-100 p-6 rounded-full mb-6">
                            <svg className="w-16 h-16 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                            </svg>
                        </div>
                        <h2 className="text-xl font-bold text-slate-600">Выберите шаблон слева</h2>
                        <p className="text-sm mt-2 text-slate-400">или создайте новый, чтобы начать настройку состава работ</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default WorkTemplates;
