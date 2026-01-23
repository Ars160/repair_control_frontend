import { useState, useEffect } from 'react';
import api from '../api/client';

const EstimatorDashboard = () => {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);

    // Expanded states
    const [expandedProjects, setExpandedProjects] = useState({}); // { projectId: boolean }
    const [expandedObjects, setExpandedObjects] = useState({}); // { objectId: boolean }
    const [expandedSubObjects, setExpandedSubObjects] = useState({}); // { subObjectId: boolean }

    // Data cache
    const [projectObjects, setProjectObjects] = useState({}); // { projectId: [objects] }
    const [objectSubObjects, setObjectSubObjects] = useState({}); // { objectId: [subObjects] }
    const [subObjectTasks, setSubObjectTasks] = useState({}); // { subObjectId: [tasks] }

    // Forms visibility
    const [showProjectForm, setShowProjectForm] = useState(false);
    const [showObjectForm, setShowObjectForm] = useState(null); // projectId
    const [showSubObjectForm, setShowSubObjectForm] = useState(null); // objectId
    const [showTaskForm, setShowTaskForm] = useState(null); // subObjectId

    // Form Data
    const [newProject, setNewProject] = useState({ name: '', description: '', deadline: '' });
    const [newObject, setNewObject] = useState({ name: '', address: '' });
    const [newSubObject, setNewSubObject] = useState({ name: '' });
    const [newTask, setNewTask] = useState({
        title: '',
        taskType: 'SEQUENTIAL',
        deadline: '',
        assigneeIds: [],
        priority: 'MEDIUM',
        placement: 'END', // END, START, AFTER
        placementTargetId: ''
    });

    const [users, setUsers] = useState([]);

    useEffect(() => {
        loadProjects();
        loadUsers();
    }, []);

    const loadProjects = async () => {
        setLoading(true);
        const data = await api.getProjects();
        console.log(data);

        setProjects(data);
        setLoading(false);
    };

    const loadUsers = async () => {
        const data = await api.getUsers();
        setUsers(data);
    };

    const toggleProject = async (projectId) => {
        setExpandedProjects(prev => ({ ...prev, [projectId]: !prev[projectId] }));
        if (!projectObjects[projectId]) {
            const data = await api.getObjectsByProject(projectId);
            setProjectObjects(prev => ({ ...prev, [projectId]: data }));
        }
    };

    const toggleObject = async (objectId) => {
        setExpandedObjects(prev => ({ ...prev, [objectId]: !prev[objectId] }));
        if (!objectSubObjects[objectId]) {
            const data = await api.getSubObjectsByObject(objectId);
            setObjectSubObjects(prev => ({ ...prev, [objectId]: data }));
        }
    };

    const toggleSubObject = async (subObjectId) => {
        setExpandedSubObjects(prev => ({ ...prev, [subObjectId]: !prev[subObjectId] }));
        if (!subObjectTasks[subObjectId]) {
            const data = await api.getTasksBySubObject(subObjectId);
            setSubObjectTasks(prev => ({ ...prev, [subObjectId]: data }));
        }
    };

    // --- Creators ---

    // Editing States
    const [editingProjectId, setEditingProjectId] = useState(null);
    const [editingObjectId, setEditingObjectId] = useState(null);
    const [editingSubObjectId, setEditingSubObjectId] = useState(null);
    const [editingTaskId, setEditingTaskId] = useState(null);

    // --- CRUD Handlers ---

    // Project
    const handleCreateProject = async (e) => {
        e.preventDefault();
        if (editingProjectId) {
            const res = await api.updateProject(editingProjectId, newProject);
            if (res.success) {
                setProjects(projects.map(p => p.id === editingProjectId ? res.data : p));
                setShowProjectForm(false);
                setEditingProjectId(null);
                setNewProject({ name: '', description: '', deadline: '' });
            } else alert(res.message);
        } else {
            const res = await api.createProject(newProject);
            if (res.success) {
                setProjects([...projects, res.data]);
                setShowProjectForm(false);
                setNewProject({ name: '', description: '', deadline: '' });
            } else alert(res.message);
        }
    };

    const startEditProject = (project) => {
        setNewProject({ name: project.name, description: project.description, deadline: project.deadline });
        setEditingProjectId(project.id);
        setShowProjectForm(true);
    };

    const handleDeleteProject = async (e, id) => {
        e.stopPropagation();
        if (window.confirm('Вы уверены? Все данные проекта будут удалены.')) {
            const res = await api.deleteProject(id);
            if (res.success) setProjects(projects.filter(p => p.id !== id));
            else alert(res.message);
        }
    };

    // Object
    const handleCreateObject = async (e, projectId) => {
        e.preventDefault();
        if (editingObjectId) {
            const res = await api.updateObject(editingObjectId, newObject);
            if (res.success) {
                setProjectObjects(prev => ({
                    ...prev,
                    [projectId]: prev[projectId].map(o => o.id === editingObjectId ? res.data : o)
                }));
                setShowObjectForm(null);
                setEditingObjectId(null);
                setNewObject({ name: '', address: '' });
            } else alert(res.message);
        } else {
            const res = await api.createObject({ ...newObject, projectId });
            if (res.success) {
                setProjectObjects(prev => ({
                    ...prev,
                    [projectId]: [...(prev[projectId] || []), res.data]
                }));
                setShowObjectForm(null);
                setNewObject({ name: '', address: '' });
            } else alert(res.message);
        }
    };

    const startEditObject = (e, object, projectId) => {
        e.stopPropagation();
        setNewObject({ name: object.name, address: object.address });
        setEditingObjectId(object.id);
        setShowObjectForm(projectId);
    };

    const handleDeleteObject = async (e, id, projectId) => {
        e.stopPropagation();
        if (window.confirm('Удалить объект?')) {
            const res = await api.deleteObject(id);
            if (res.success) {
                setProjectObjects(prev => ({
                    ...prev,
                    [projectId]: prev[projectId].filter(o => o.id !== id)
                }));
            } else alert(res.message);
        }
    };

    // SubObject
    const handleCreateSubObject = async (e, objectId) => {
        e.preventDefault();
        if (editingSubObjectId) {
            const res = await api.updateSubObject(editingSubObjectId, newSubObject);
            if (res.success) {
                setObjectSubObjects(prev => ({
                    ...prev,
                    [objectId]: prev[objectId].map(s => s.id === editingSubObjectId ? res.data : s)
                }));
                setShowSubObjectForm(null);
                setEditingSubObjectId(null);
                setNewSubObject({ name: '' });
            } else alert(res.message);
        } else {
            const res = await api.createSubObject({ ...newSubObject, objectId });
            if (res.success) {
                setObjectSubObjects(prev => ({
                    ...prev,
                    [objectId]: [...(prev[objectId] || []), res.data]
                }));
                setShowSubObjectForm(null);
                setNewSubObject({ name: '' });
            } else alert(res.message);
        }
    };

    const startEditSubObject = (e, subObject, objectId) => {
        e.stopPropagation();
        setNewSubObject({ name: subObject.name });
        setEditingSubObjectId(subObject.id);
        setShowSubObjectForm(objectId);
    };

    const handleDeleteSubObject = async (e, id, objectId) => {
        e.stopPropagation();
        if (window.confirm('Удалить подобъект?')) {
            const res = await api.deleteSubObject(id);
            if (res.success) {
                setObjectSubObjects(prev => ({
                    ...prev,
                    [objectId]: prev[objectId].filter(s => s.id !== id)
                }));
            } else alert(res.message);
        }
    };

    const handleCreateTask = async (e, subObjectId) => {
        e.preventDefault();

        let index = null;
        if (newTask.placement === 'START') {
            index = 0;
        } else if (newTask.placement === 'AFTER' && newTask.placementTargetId) {
            const targetTask = subObjectTasks[subObjectId]?.find(t => t.id === Number(newTask.placementTargetId));
            if (targetTask) {
                index = targetTask.index + 1;
            }
        }

        const payload = {
            ...newTask,
            subObjectId,
            assigneeIds: newTask.assigneeIds.map(Number),
            status: 'ACTIVE', // Backend recalcs this based on Logic
            index: index
        };
        // Remove UI-only fields
        delete payload.placement;
        delete payload.placementTargetId;

        if (editingTaskId) {
            const res = await api.updateTask(editingTaskId, payload);
            if (res.success) {
                setSubObjectTasks(prev => ({
                    ...prev,
                    [subObjectId]: prev[subObjectId].map(t => t.id === editingTaskId ? res.data : t)
                }));
                setShowTaskForm(null);
                setEditingTaskId(null);
                setNewTask({ title: '', taskType: 'SEQUENTIAL', deadline: '', assigneeIds: [] });
            } else alert(res.message);
        } else {
            const res = await api.createTask(payload);
            if (res.success) {
                setSubObjectTasks(prev => ({
                    ...prev,
                    [subObjectId]: [...(prev[subObjectId] || []), res.data]
                }));
                setShowTaskForm(null);
                setNewTask({ title: '', taskType: 'SEQUENTIAL', deadline: '', assigneeIds: [], priority: 'MEDIUM', placement: 'END', placementTargetId: '' });
            } else alert(res.message);
        }
    };

    const startEditTask = (e, task, subObjectId) => {
        e.stopPropagation();
        setNewTask({
            title: task.title,
            taskType: task.taskType || 'SEQUENTIAL',
            deadline: task.deadline,
            assigneeIds: task.assigneeIds || [],
            priority: task.priority || 'MEDIUM',
            placement: 'END',
            placementTargetId: ''
        });
        setEditingTaskId(task.id);
        setShowTaskForm(subObjectId);
    };

    const handleDeleteTask = async (e, id, subObjectId) => {
        e.stopPropagation();
        if (window.confirm('Удалить задачу?')) {
            const res = await api.deleteTask(id);
            if (res.success) {
                setSubObjectTasks(prev => ({
                    ...prev,
                    [subObjectId]: prev[subObjectId].filter(t => t.id !== id)
                }));
            } else alert(res.message);
        }
    };

    // --- Render Helpers ---

    if (loading) return <div className="p-8">Загрузка проектов...</div>;

    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-20">
            <div className="flex justify-between items-center bg-white/60 p-6 rounded-2xl glass-panel sticky top-4 z-20 backdrop-blur-xl">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Проекты</h1>
                    <p className="text-slate-500 text-sm mt-1">Управление объектами и задачами</p>
                </div>
                <button
                    onClick={() => {
                        if (showProjectForm && editingProjectId) {
                            // Cancel edit
                            setShowProjectForm(false);
                            setEditingProjectId(null);
                            setNewProject({ name: '', description: '', deadline: '' });
                        } else {
                            setShowProjectForm(!showProjectForm);
                        }
                    }}
                    className="flex items-center px-4 py-2.5 bg-indigo-600 text-white rounded-xl font-medium shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all hover:-translate-y-0.5"
                >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                    {showProjectForm ? 'Отмена' : 'Новый проект'}
                </button>
            </div>

            {/* Create/Edit Project Form */}
            {showProjectForm && (
                <div className="bg-white rounded-2xl shadow-xl p-6 border border-indigo-100 animate-fadeIn relative">
                    <div className={`absolute top-0 left-0 w-1.5 h-full rounded-l-2xl ${editingProjectId ? 'bg-orange-500' : 'bg-indigo-500'}`}></div>
                    <form onSubmit={handleCreateProject} className="space-y-5">
                        <div className="flex justify-between items-center mb-2">
                            <h3 className="text-lg font-bold text-slate-800">{editingProjectId ? 'Редактировать проект' : 'Создание нового проекта'}</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-500 uppercase">Название</label>
                                <input
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 transition-all outline-none"
                                    placeholder="Например: ЖК Бауберг"
                                    value={newProject.name}
                                    onChange={e => setNewProject({ ...newProject, name: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-500 uppercase">Дедлайн</label>
                                <input
                                    type="date"
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 transition-all outline-none"
                                    value={newProject.deadline}
                                    onChange={e => setNewProject({ ...newProject, deadline: e.target.value })}
                                />
                            </div>
                            <div className="md:col-span-2 space-y-1">
                                <label className="text-xs font-semibold text-slate-500 uppercase">Описание</label>
                                <textarea
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 transition-all outline-none min-h-[100px]"
                                    placeholder="Краткое описание проекта..."
                                    value={newProject.description}
                                    onChange={e => setNewProject({ ...newProject, description: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="flex justify-end pt-2">
                            <button type="submit" className={`px-6 py-2.5 text-white rounded-xl font-medium shadow-md transition-colors ${editingProjectId ? 'bg-orange-600 hover:bg-orange-700' : 'bg-indigo-600 hover:bg-indigo-700'}`}>
                                {editingProjectId ? 'Сохранить изменения' : 'Создать проект'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="grid grid-cols-1 gap-6">
                {projects.map(project => (
                    <div key={project.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow duration-300">
                        {/* Project Header */}
                        <div
                            className="p-5 flex justify-between items-center cursor-pointer bg-gradient-to-r from-slate-50 to-white border-b border-slate-100 group"
                            onClick={() => toggleProject(project.id)}
                        >
                            <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${expandedProjects[project.id] ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-500'}`}>
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">{project.name}</h2>
                                    <p className="text-sm text-slate-500">{project.description || 'Нет описания'}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <button onClick={(e) => { e.stopPropagation(); startEditProject(project); }} className="p-2 text-slate-400 hover:text-indigo-600 transition-colors" title="Редактировать">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                                </button>
                                <button onClick={(e) => handleDeleteProject(e, project.id)} className="p-2 text-slate-400 hover:text-red-600 transition-colors" title="Удалить">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                </button>
                                <span className={`transform transition-transform duration-300 text-slate-400 ${expandedProjects[project.id] ? 'rotate-180 text-indigo-500' : ''}`}>
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                </span>
                            </div>
                        </div>

                        {/* Project Content (Objects) */}
                        {expandedProjects[project.id] && (
                            <div className="p-5 bg-slate-50/50 space-y-4">
                                <div className="flex justify-between items-center mb-2 px-1">
                                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Объекты стоительства</h3>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (showObjectForm === project.id && editingObjectId) {
                                                setShowObjectForm(null);
                                                setEditingObjectId(null);
                                                setNewObject({ name: '', address: '' });
                                            } else {
                                                setShowObjectForm(project.id);
                                                setEditingObjectId(null);
                                                setNewObject({ name: '', address: '' });
                                            }
                                        }}
                                        className="text-xs px-3 py-1.5 bg-white border border-slate-200 text-indigo-600 font-semibold rounded-lg hover:border-indigo-200 hover:shadow-sm transition-all"
                                    >
                                        + Добавить объект
                                    </button>
                                </div>

                                {showObjectForm === project.id && (
                                    <form onSubmit={(e) => handleCreateObject(e, project.id)} className="bg-white p-4 rounded-xl shadow-sm border border-indigo-100 mb-4 animate-fadeIn relative">
                                        {editingObjectId && <div className="absolute top-2 right-2 text-xs font-bold text-orange-500 uppercase">Редактирование</div>}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            <input
                                                className="border-slate-200 px-3 py-2 rounded-lg text-sm focus:ring-indigo-500 focus:border-indigo-500"
                                                placeholder="Название объекта"
                                                value={newObject.name}
                                                onChange={e => setNewObject({ ...newObject, name: e.target.value })}
                                                required
                                            />
                                            <div className="flex gap-2">
                                                <input
                                                    className="border-slate-200 px-3 py-2 rounded-lg text-sm w-full focus:ring-indigo-500 focus:border-indigo-500"
                                                    placeholder="Адрес"
                                                    value={newObject.address}
                                                    onChange={e => setNewObject({ ...newObject, address: e.target.value })}
                                                />
                                                <button type="submit" className={`text-white px-4 rounded-lg text-sm font-medium transition-colors ${editingObjectId ? 'bg-orange-500 hover:bg-orange-600' : 'bg-indigo-600 hover:bg-indigo-700'}`}>
                                                    {editingObjectId ? 'Сохранить' : 'ОК'}
                                                </button>
                                            </div>
                                        </div>
                                    </form>
                                )}

                                {projectObjects[project.id]?.length === 0 && (
                                    <div className="text-center py-8 text-slate-400 bg-white rounded-xl border border-dashed border-slate-200">
                                        Нет объектов. Создайте первый!
                                    </div>
                                )}

                                <div className="grid grid-cols-1 gap-4">
                                    {projectObjects[project.id]?.map(object => (
                                        <div key={object.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                                            <div
                                                className="px-4 py-3 flex justify-between items-center cursor-pointer hover:bg-slate-50 transition-colors"
                                                onClick={() => toggleObject(object.id)}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-500 flex items-center justify-center">
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>
                                                    </div>
                                                    <div>
                                                        <h4 className="font-semibold text-slate-800">{object.name}</h4>
                                                        {object.address && <p className="text-xs text-slate-400">{object.address}</p>}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <button onClick={(e) => startEditObject(e, object, project.id)} className="p-1 text-slate-400 hover:text-indigo-600" title="Ред.">
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                                                    </button>
                                                    <button onClick={(e) => handleDeleteObject(e, object.id, project.id)} className="p-1 text-slate-400 hover:text-red-600" title="Уд.">
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                                    </button>
                                                    <span className={`text-slate-300 transform transition-transform ${expandedObjects[object.id] ? 'rotate-180' : ''}`}>▼</span>
                                                </div>
                                            </div>

                                            {expandedObjects[object.id] && (
                                                <div className="border-t border-slate-100 bg-slate-50/30 p-4">
                                                    <div className="flex justify-between items-center mb-3">
                                                        <span className="text-xs font-bold text-slate-400 uppercase">Локации / Подобъекты</span>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                if (showSubObjectForm === object.id && editingSubObjectId) {
                                                                    setShowSubObjectForm(null); setEditingSubObjectId(null); setNewSubObject({ name: '' });
                                                                } else {
                                                                    setShowSubObjectForm(object.id); setEditingSubObjectId(null); setNewSubObject({ name: '' });
                                                                }
                                                            }}
                                                            className="text-xs text-indigo-600 hover:text-indigo-800 font-medium bg-indigo-50 px-2 py-1 rounded"
                                                        >
                                                            + Добавить
                                                        </button>
                                                    </div>

                                                    {showSubObjectForm === object.id && (
                                                        <form onSubmit={(e) => handleCreateSubObject(e, object.id)} className="mb-3 flex gap-2 relative">
                                                            <input
                                                                className={`flex-1 border-slate-200 rounded-lg text-sm px-3 py-1.5 focus:ring-indigo-500 focus:border-indigo-500 ${editingSubObjectId ? 'border-orange-200 bg-orange-50' : ''}`}
                                                                placeholder="Название (напр. Кухня, Этаж 1)"
                                                                value={newSubObject.name}
                                                                onChange={e => setNewSubObject({ ...newSubObject, name: e.target.value })}
                                                                required
                                                            />
                                                            <button type="submit" className={`text-white px-3 py-1.5 rounded-lg text-sm ${editingSubObjectId ? 'bg-orange-500 hover:bg-orange-600' : 'bg-indigo-600 hover:bg-indigo-700'}`}>
                                                                {editingSubObjectId ? 'Сохр.' : 'OK'}
                                                            </button>
                                                        </form>
                                                    )}

                                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                                        {objectSubObjects[object.id]?.map(subObject => (
                                                            <div key={subObject.id} className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm relative group">
                                                                <div
                                                                    className="flex justify-between items-center cursor-pointer pb-2 border-b border-slate-100 mb-2"
                                                                    onClick={() => toggleSubObject(subObject.id)}
                                                                >
                                                                    <span className="font-medium text-slate-700 text-sm">{subObject.name}</span>
                                                                    <div className="flex items-center gap-2 opactiy-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                                                                        <button onClick={(e) => startEditSubObject(e, subObject, object.id)} className="text-slate-400 hover:text-indigo-600" title="Ред.">
                                                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                                                                        </button>
                                                                        <button onClick={(e) => handleDeleteSubObject(e, subObject.id, object.id)} className="text-slate-400 hover:text-red-600" title="Уд.">
                                                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                                                        </button>
                                                                        <button
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                if (showTaskForm === subObject.id && editingTaskId) {
                                                                                    setShowTaskForm(null); setEditingTaskId(null); setNewTask({ title: '', taskType: 'SEQUENTIAL', deadline: '', assigneeIds: [] });
                                                                                } else {
                                                                                    setShowTaskForm(subObject.id); setEditingTaskId(null); setNewTask({ title: '', taskType: 'SEQUENTIAL', deadline: '', assigneeIds: [] });
                                                                                }
                                                                            }}
                                                                            className="text-white bg-indigo-500 hover:bg-indigo-600 w-5 h-5 rounded flex items-center justify-center text-sm"
                                                                            title="Добавить задачу"
                                                                        >
                                                                            +
                                                                        </button>
                                                                    </div>
                                                                </div>

                                                                {/* Task Form inside SubObject Card */}
                                                                {showTaskForm === subObject.id && (
                                                                    <div className="mb-3 p-3 bg-indigo-50 rounded-lg border border-indigo-100 relative">
                                                                        {editingTaskId && <div className="absolute top-1 right-1 text-[10px] font-bold text-orange-500 uppercase">Редактирование</div>}
                                                                        <h5 className="text-xs font-bold text-indigo-800 mb-2 uppercase">{editingTaskId ? 'Ред. Задачу' : 'Новая задача'}</h5>
                                                                        <form onSubmit={(e) => handleCreateTask(e, subObject.id)} className="space-y-2">
                                                                            <input
                                                                                className="w-full border-indigo-200 rounded text-xs p-1.5 focus:ring-indigo-500"
                                                                                placeholder="Название задачи"
                                                                                value={newTask.title}
                                                                                onChange={e => setNewTask({ ...newTask, title: e.target.value })}
                                                                                required
                                                                            />
                                                                            <div className="flex gap-1">
                                                                                <select
                                                                                    className="flex-1 border-indigo-200 rounded text-xs p-1.5"
                                                                                    value={newTask.taskType}
                                                                                    onChange={e => setNewTask({ ...newTask, taskType: e.target.value })}
                                                                                >
                                                                                    <option value="SEQUENTIAL">Посл.</option>
                                                                                    <option value="PARALLEL">Парал.</option>
                                                                                </select>
                                                                                <input
                                                                                    type="date"
                                                                                    className="flex-1 border-indigo-200 rounded text-xs p-1.5"
                                                                                    value={newTask.deadline}
                                                                                    onChange={e => setNewTask({ ...newTask, deadline: e.target.value })}
                                                                                />
                                                                            </div>
                                                                            <select
                                                                                multiple
                                                                                className="w-full border-indigo-200 rounded text-xs p-1.5 h-16"
                                                                                value={newTask.assigneeIds}
                                                                                onChange={e => {
                                                                                    const options = [...e.target.selectedOptions];
                                                                                    const values = options.map(option => option.value);
                                                                                    setNewTask({ ...newTask, assigneeIds: values });
                                                                                }}
                                                                            >
                                                                                {users.filter(u => u.role === 'WORKER').map(u => (
                                                                                    <option key={u.id} value={u.id}>{u.fullName}</option>
                                                                                ))}
                                                                            </select>
                                                                            <div className="flex gap-1 mt-2">
                                                                                <select
                                                                                    className="flex-1 border-indigo-200 rounded text-xs p-1.5"
                                                                                    value={newTask.priority}
                                                                                    onChange={e => setNewTask({ ...newTask, priority: e.target.value })}
                                                                                >
                                                                                    <option value="LOW">Низкий</option>
                                                                                    <option value="MEDIUM">Средний</option>
                                                                                    <option value="HIGH">Высокий</option>
                                                                                </select>

                                                                                {!editingTaskId && (
                                                                                    <select
                                                                                        className="flex-1 border-indigo-200 rounded text-xs p-1.5"
                                                                                        value={newTask.placement}
                                                                                        onChange={e => setNewTask({ ...newTask, placement: e.target.value })}
                                                                                    >
                                                                                        <option value="END">В конец</option>
                                                                                        <option value="START">В начало</option>
                                                                                        <option value="AFTER">После...</option>
                                                                                    </select>
                                                                                )}
                                                                            </div>

                                                                            {newTask.placement === 'AFTER' && !editingTaskId && (
                                                                                <select
                                                                                    className="w-full border-indigo-200 rounded text-xs p-1.5 mt-2"
                                                                                    value={newTask.placementTargetId}
                                                                                    onChange={e => setNewTask({ ...newTask, placementTargetId: e.target.value })}
                                                                                    required
                                                                                >
                                                                                    <option value="">Выберите задачу...</option>
                                                                                    {subObjectTasks[subObject.id]?.map(t => (
                                                                                        <option key={t.id} value={t.id}>{t.title} (Status: {t.status})</option>
                                                                                    ))}
                                                                                </select>
                                                                            )}

                                                                            <div className="flex gap-2 mt-2">
                                                                                <button type="submit" className={`flex-1 text-white py-1.5 rounded text-xs font-semibold ${editingTaskId ? 'bg-orange-500 hover:bg-orange-600' : 'bg-indigo-600 hover:bg-indigo-700'}`}>
                                                                                    {editingTaskId ? 'Сохранить' : 'Добавить'}
                                                                                </button>
                                                                                <button type="button" onClick={() => setShowTaskForm(null)} className="px-2 bg-slate-200 rounded text-xs">Отм.</button>
                                                                            </div>
                                                                        </form>
                                                                    </div>
                                                                )}

                                                                {/* Task List */}
                                                                <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1 scrollbar-thin">
                                                                    {expandedSubObjects[subObject.id] && subObjectTasks[subObject.id]?.map(task => (
                                                                        <div key={task.id} className="flex justify-between items-center p-2 bg-slate-50 rounded border border-slate-100 hover:bg-white hover:shadow-sm transition-all group">
                                                                            <span className="text-xs text-slate-700 truncate mr-2">{task.title}</span>

                                                                            <div className="flex items-center gap-1">
                                                                                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium border ${task.status === 'COMPLETED' ? 'bg-green-50 text-green-600 border-green-100' :
                                                                                    task.status === 'ACTIVE' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                                                                                        'bg-yellow-50 text-yellow-600 border-yellow-100'
                                                                                    }`}>
                                                                                    {task.status.substring(0, 1)}
                                                                                </span>
                                                                                <button onClick={(e) => startEditTask(e, task, subObject.id)} className="text-slate-300 hover:text-indigo-600 ml-1 hidden group-hover:block" title="Ред.">
                                                                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                                                                                </button>
                                                                                <button onClick={(e) => handleDeleteTask(e, task.id, subObject.id)} className="text-slate-300 hover:text-red-600 hidden group-hover:block" title="Уд.">
                                                                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                                                                </button>
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                    {!expandedSubObjects[subObject.id] && (
                                                                        <div className="text-center text-[10px] text-slate-400 cursor-pointer hover:text-indigo-500" onClick={() => toggleSubObject(subObject.id)}>
                                                                            Показать задачи ▼
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default EstimatorDashboard;
