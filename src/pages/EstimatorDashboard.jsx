import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import ChecklistManager from '../components/ChecklistManager';

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
    const [newSubObject, setNewSubObject] = useState({ name: '', templateId: '' });
    const [newTask, setNewTask] = useState({
        title: '',
        taskType: 'SEQUENTIAL',
        deadline: '',
        assigneeIds: [],
        priority: 'MEDIUM',
        placement: 'END', // END, START, AFTER
        placementTargetId: '',
        checklist: []
    });

    const [users, setUsers] = useState([]);
    const [availableTaskWorkers, setAvailableTaskWorkers] = useState([]);

    // Assignment UI states
    const [showAssignmentModal, setShowAssignmentModal] = useState(null); // { type: 'PROJECT' | 'SUBOBJECT', id, name }
    const [assignedStaff, setAssignedStaff] = useState([]);
    const [assignmentLoading, setAssignmentLoading] = useState(false);

    useEffect(() => {
        loadProjects();
        loadUsers();
    }, []);

    const loadProjects = async () => {
        setLoading(true);
        const data = await api.getProjects();

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

    // --- Assignment Handlers ---

    const openProjectAssignment = async (project) => {
        setShowAssignmentModal({ type: 'PROJECT', id: project.id, name: project.name });
        setAssignmentLoading(true);
        // For foremen, we fetch.
        const foremen = await api.getProjectForemen(project.id);
        const staff = [];
        foremen.forEach(f => {
            if (!staff.find(s => s.id === f.id)) {
                staff.push({ ...f, isForeman: true });
            }
        });

        setAssignedStaff(staff);
        setAssignmentLoading(false);
    };

    const openSubObjectAssignment = async (subObject) => {
        setShowAssignmentModal({ type: 'SUBOBJECT', id: subObject.id, name: subObject.name });
        setAssignmentLoading(true);
        const workers = await api.getSubObjectWorkers(subObject.id);
        setAssignedStaff(workers.map(w => ({ ...w, isWorker: true })));
        setAssignmentLoading(false);
    };


    const handleAddForeman = async (projectId, userId) => {
        if (assignedStaff.some(s => s.id === Number(userId) && s.isForeman)) {
            alert("Этот сотрудник уже назначен прорабом.");
            return;
        }
        const res = await api.addForeman(projectId, userId);
        if (res.success) {
            const user = users.find(u => u.id === Number(userId));
            setAssignedStaff(prev => [...prev, { ...user, isForeman: true }]);
        } else alert(res.message);
    };

    const handleRemoveForeman = async (projectId, userId) => {
        const res = await api.removeForeman(projectId, userId);
        if (res.success) {
            setAssignedStaff(prev => prev.filter(s => !(s.id === userId && s.isForeman)));
        } else alert(res.message);
    };

    const handleAddWorker = async (subObjectId, userId) => {
        if (assignedStaff.some(s => s.id === Number(userId) && s.isWorker)) {
            alert("Этот сотрудник уже назначен на этот объект.");
            return;
        }
        const res = await api.addSubObjectWorker(subObjectId, userId);
        if (res.success) {
            const user = users.find(u => u.id === Number(userId));
            setAssignedStaff(prev => [...prev, { ...user, isWorker: true }]);
        } else alert(res.message);
    };

    const handleRemoveWorker = async (subObjectId, userId) => {
        const res = await api.removeSubObjectWorker(subObjectId, userId);
        if (res.success) {
            setAssignedStaff(prev => prev.filter(s => s.id !== userId));
        } else alert(res.message);
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

    const handlePublishProject = async (e, id) => {
        e.stopPropagation();
        if (window.confirm('Опубликовать проект? Это отправит уведомления всем участникам.')) {
            const res = await api.publishProject(id);
            if (res.success) {
                setProjects(projects.map(p => p.id === id ? { ...p, status: 'PUBLISHED' } : p));
                alert('Проект опубликован!');
            } else alert(res.message);
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
        if (window.confirm('Удалить раздел?')) {
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

        let subObjectId = editingSubObjectId;

        if (subObjectId) {
            const res = await api.updateSubObject(subObjectId, newSubObject);
            if (res.success) {
                setObjectSubObjects(prev => ({
                    ...prev,
                    [objectId]: prev[objectId].map(s => s.id === subObjectId ? res.data : s)
                }));
                setShowSubObjectForm(null);
                setEditingSubObjectId(null);
                setNewSubObject({ name: '', templateId: '' });
            } else alert(res.message);
        } else {
            const res = await api.createSubObject({ ...newSubObject, objectId });
            if (res.success) {
                subObjectId = res.data.id;
                setObjectSubObjects(prev => ({
                    ...prev,
                    [objectId]: [...(prev[objectId] || []), res.data]
                }));

                // Apply template if selected
                if (newSubObject.templateId) {
                    const applyRes = await api.applySubObjectTemplate(Number(newSubObject.templateId), subObjectId);
                    if (!applyRes.success) {
                        alert(`Подобъект создан, но шаблон не применился: ${applyRes.message}`);
                    } else {
                        // Refresh tasks for this subobject to show the newly created tasks
                        const tasksData = await api.getTasksBySubObject(subObjectId);
                        setSubObjectTasks(prev => ({ ...prev, [subObjectId]: tasksData }));
                        // Auto-expand the subobject to show tasks
                        if (!expandedSubObjects[subObjectId]) {
                            toggleSubObject(subObjectId);
                        }
                    }
                }

                setShowSubObjectForm(null);
                setNewSubObject({ name: '', templateId: '' });
            } else alert(res.message);
        }
    };

    const startEditSubObject = (e, subObject, objectId) => {
        e.stopPropagation();
        setNewSubObject({ name: subObject.name, templateId: '' }); // Templates apply only on creation mostly, or explicit action
        setEditingSubObjectId(subObject.id);
        setShowSubObjectForm(objectId);
    };

    const handleDeleteSubObject = async (e, id, objectId) => {
        e.stopPropagation();
        if (window.confirm('Удалить подраздел?')) {
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
                setNewTask({ title: '', taskType: 'SEQUENTIAL', deadline: '', assigneeIds: [], priority: 'MEDIUM', placement: 'END', placementTargetId: '', checklist: [] });
            } else alert(res.message);
        } else {
            const res = await api.createTask(payload);
            if (res.success) {
                setSubObjectTasks(prev => ({
                    ...prev,
                    [subObjectId]: [...(prev[subObjectId] || []), res.data]
                }));
                setShowTaskForm(null);
                setNewTask({ title: '', taskType: 'SEQUENTIAL', deadline: '', assigneeIds: [], priority: 'MEDIUM', placement: 'END', placementTargetId: '', checklist: [] });
            } else alert(res.message);
        }
    };

    const startCreateTask = async (e, subObjectId) => {
        e.stopPropagation();
        if (showTaskForm === subObjectId && !editingTaskId) {
            setShowTaskForm(null);
        } else {
            // Load allowed workers
            try {
                const workers = await api.getSubObjectWorkers(subObjectId);
                setAvailableTaskWorkers(workers);
            } catch (err) {
                console.error(err);
                setAvailableTaskWorkers([]); // Fallback
            }

            setShowTaskForm(subObjectId);
            setEditingTaskId(null);
            setNewTask({ title: '', taskType: 'SEQUENTIAL', deadline: '', assigneeIds: [], priority: 'MEDIUM', placement: 'END', placementTargetId: '', checklist: [] });
        }
    };

    const startEditTask = async (e, task, subObjectId, projectId) => {
        e.stopPropagation();
        try {
            const workers = await api.getSubObjectWorkers(subObjectId);
            setAvailableTaskWorkers(workers);
        } catch (err) {
            console.error(err);
            setAvailableTaskWorkers([]);
        }

        setNewTask({
            title: task.title,
            taskType: task.taskType || 'SEQUENTIAL',
            deadline: task.deadline,
            assigneeIds: task.assigneeIds || [],
            priority: task.priority || 'MEDIUM',
            placement: 'END',
            placementTargetId: '',
            checklist: task.checklist || []
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

    // --- Template Stats (For Dropdowns) ---
    // const [showTemplateManager, setShowTemplateManager] = useState(false); // Removed
    // const [showSubObjectTemplateManager, setShowSubObjectTemplateManager] = useState(false); // Removed

    const [templates, setTemplates] = useState([]); // Checklist Templates
    const [subObjectTemplates, setSubObjectTemplates] = useState([]); // SubObject Templates

    const loadTemplates = async () => {
        const data = await api.getTemplates();
        setTemplates(data);
    };

    const loadSubObjectTemplates = async () => {
        const data = await api.getAllSubObjectTemplates();
        setSubObjectTemplates(data);
    };

    useEffect(() => {
        if (showTaskForm) {
            loadTemplates();
        }
    }, [showTaskForm]);

    useEffect(() => {
        if (showSubObjectForm) {
            loadSubObjectTemplates();
        }
    }, [showSubObjectForm]);

    const handleTemplateSelect = (e) => {
        const value = e.target.value;

        if (value === 'custom') {
            if (newTask.checklist.length > 0) {
                if (!window.confirm("Очистить текущий чеклист?")) {
                    e.target.value = ""; // Reset select if cancelled
                    return;
                }
            }
            setNewTask(prev => ({
                ...prev,
                templateId: null,
                checklist: []
            }));
            return;
        }

        const templateId = Number(value);
        if (!templateId) return;

        const template = templates.find(t => t.id === templateId);
        if (template) {
            if (newTask.checklist.length > 0) {
                if (!window.confirm("Заменить текущий чеклист пунктами из шаблона?")) {
                    e.target.value = ""; // Reset select
                    return;
                }
            }
            setNewTask(prev => ({
                ...prev,
                templateId: template.id,
                checklist: template.items.map(item => ({
                    description: item.description,
                    isPhotoRequired: item.isPhotoRequired,
                    isCompleted: false
                }))
            }));
        }
    };


    // --- Render Helpers ---

    if (loading) return <div className="p-8">Загрузка проектов...</div>;

    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-20">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/60 p-4 sm:p-6 rounded-2xl glass-panel sticky top-4 z-20 backdrop-blur-xl">
                <div>
                    <h1 className="text-xl sm:text-3xl font-bold text-slate-800 tracking-tight">Рабочее пространство</h1>
                    <p className="text-slate-500 text-xs sm:text-sm mt-1">Управление проектами и задачами</p>
                </div>
                <div className="self-end sm:self-auto">
                    <button
                        onClick={() => {
                            if (showProjectForm && editingProjectId) {
                                setShowProjectForm(false);
                                setEditingProjectId(null);
                                setNewProject({ name: '', description: '', deadline: '' });
                            } else {
                                setShowProjectForm(!showProjectForm);
                            }
                        }}
                        className={`group flex items-center px-5 py-2.5 rounded-xl font-bold shadow-lg transition-all duration-300 ease-in-out hover:-translate-y-0.5 ${showProjectForm
                            ? 'bg-slate-100 text-slate-600 hover:bg-slate-200 shadow-slate-200'
                            : 'bg-indigo-600 text-white shadow-indigo-200 hover:bg-indigo-700'
                            }`}
                    >
                        <div className={`relative w-5 h-5 mr-2 transition-transform duration-300 ease-in-out ${showProjectForm ? 'rotate-45' : 'rotate-0'}`}>
                            {/* Using a simple Plus icon that forms an X when rotated 45deg */}
                            <svg className="w-5 h-5 absolute inset-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
                        </div>
                        <span className="transition-opacity duration-300">
                            {showProjectForm ? 'Отмена' : (
                                <>
                                    <span className="hidden sm:inline">Проект</span>
                                    <span className="sm:hidden">Проект</span>
                                </>
                            )}
                        </span>
                    </button>
                </div>
            </div>



            {/* Create/Edit Project Form */}
            {
                showProjectForm && (
                    <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-6 border border-indigo-100 animate-fadeIn relative">
                        <div className={`absolute top-0 left-0 w-1.5 h-full rounded-l-2xl ${editingProjectId ? 'bg-orange-500' : 'bg-indigo-500'}`}></div>
                        <form onSubmit={handleCreateProject} className="space-y-5">
                            <div className="flex justify-between items-center mb-2">
                                <h3 className="text-lg font-bold text-slate-800">{editingProjectId ? 'Редактировать проект' : 'Создание нового проекта'}</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Название</label>
                                    <input
                                        className="w-full px-4 py-2.5 sm:py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 transition-all outline-none text-sm"
                                        placeholder="Например: ЖК Бауберг"
                                        value={newProject.name}
                                        onChange={e => setNewProject({ ...newProject, name: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Дедлайн</label>
                                    <input
                                        type="date"
                                        className="w-full px-4 py-2.5 sm:py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 transition-all outline-none text-sm"
                                        value={newProject.deadline}
                                        onChange={e => setNewProject({ ...newProject, deadline: e.target.value })}
                                    />
                                </div>
                                <div className="md:col-span-2 space-y-1">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Описание</label>
                                    <textarea
                                        className="w-full px-4 py-2.5 sm:py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 transition-all outline-none min-h-[80px] sm:min-h-[100px] text-sm"
                                        placeholder="Краткое описание проекта..."
                                        value={newProject.description}
                                        onChange={e => setNewProject({ ...newProject, description: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end pt-2">
                                <button type="submit" className={`w-full sm:w-auto px-8 py-3 text-white rounded-xl font-bold shadow-md transition-all active:scale-[0.98] ${editingProjectId ? 'bg-orange-500 hover:bg-orange-600' : 'bg-indigo-600 hover:bg-indigo-700'}`}>
                                    {editingProjectId ? 'Сохранить изменения' : 'Создать проект'}
                                </button>
                            </div>
                        </form>
                    </div>
                )
            }

            <div className="grid grid-cols-1 gap-6">
                {projects.map(project => (
                    <div key={project.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow duration-300">
                        {/* Project Header */}
                        <div
                            className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer bg-gradient-to-r from-slate-50 to-white border-b border-slate-100 group"
                            onClick={() => toggleProject(project.id)}
                        >
                            <div className="flex items-center gap-3 sm:gap-4">
                                <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-colors shrink-0 ${expandedProjects[project.id] ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-500'}`}>
                                    <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
                                </div>
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2">
                                        <h2 className="text-lg sm:text-xl font-bold text-slate-800 group-hover:text-indigo-600 transition-colors truncate">{project.name}</h2>
                                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-tight ${project.status === 'PUBLISHED' ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-600'
                                            }`}>
                                            {project.status === 'PUBLISHED' ? 'Опубликован' : 'Черновик'}
                                        </span>
                                    </div>
                                    <p className="text-xs sm:text-sm text-slate-500 truncate">{project.description || 'Нет описания'}</p>
                                </div>
                            </div>
                            <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-3 border-t sm:border-t-0 pt-3 sm:pt-0">
                                <div className="flex items-center gap-1 sm:gap-2">
                                    <button onClick={(e) => { e.stopPropagation(); startEditProject(project); }} className="p-2 text-slate-400 hover:text-indigo-600 transition-colors" title="Редактировать">
                                        <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                                    </button>
                                    <button onClick={(e) => { e.stopPropagation(); openProjectAssignment(project); }} className="p-2 text-slate-400 hover:text-indigo-600 transition-colors" title="Ответственные">
                                        <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
                                    </button>
                                    {project.status !== 'PUBLISHED' && (
                                        <button
                                            onClick={(e) => handlePublishProject(e, project.id)}
                                            className="ml-1 px-3 py-1 bg-green-500 hover:bg-green-600 text-white rounded-lg text-xs font-bold shadow-sm transition-all"
                                            title="Опубликовать"
                                        >
                                            Опубликовать
                                        </button>
                                    )}
                                    <button onClick={(e) => handleDeleteProject(e, project.id)} className="p-2 text-slate-400 hover:text-red-600 transition-colors" title="Удалить">
                                        <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                    </button>
                                </div>
                                <span className={`transform transition-transform duration-300 text-slate-400 sm:ml-2 ${expandedProjects[project.id] ? 'rotate-180 text-indigo-500' : ''}`}>
                                    <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                </span>
                            </div>
                        </div>

                        {/* Project Content (Objects) */}
                        {expandedProjects[project.id] && (
                            <div className="p-5 bg-slate-50/50 space-y-4">
                                <div className="flex justify-between items-center mb-2 px-1">
                                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Разделы</h3>
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
                                        + Добавить раздел
                                    </button>
                                </div>

                                {showObjectForm === project.id && (
                                    <form onSubmit={(e) => handleCreateObject(e, project.id)} className="bg-white p-4 rounded-xl shadow-sm border border-indigo-100 mb-4 animate-fadeIn relative">
                                        {editingObjectId && <div className="absolute top-2 right-2 text-[10px] font-bold text-orange-500 uppercase">Редактирование</div>}
                                        <div className="flex flex-col gap-3">
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                <div className="space-y-1">
                                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Название раздела</label>
                                                    <input
                                                        className="w-full border-slate-200 px-3 py-2 rounded-lg text-sm focus:ring-indigo-500 focus:border-indigo-500"
                                                        placeholder="Напр: Квартира 42"
                                                        value={newObject.name}
                                                        onChange={e => setNewObject({ ...newObject, name: e.target.value })}
                                                        required
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Адрес</label>
                                                    <input
                                                        className="w-full border-slate-200 px-3 py-2 rounded-lg text-sm focus:ring-indigo-500 focus:border-indigo-500"
                                                        placeholder="Улица, дом..."
                                                        value={newObject.address}
                                                        onChange={e => setNewObject({ ...newObject, address: e.target.value })}
                                                    />
                                                </div>
                                            </div>
                                            <div className="flex gap-2 pt-1">
                                                <button type="submit" className={`flex-1 text-white py-2.5 rounded-lg text-sm font-bold transition-colors ${editingObjectId ? 'bg-orange-500 hover:bg-orange-600' : 'bg-indigo-600 hover:bg-indigo-700'}`}>
                                                    {editingObjectId ? 'Сохранить изменения' : 'Создать раздел'}
                                                </button>
                                                <button type="button" onClick={() => { setShowObjectForm(null); setEditingObjectId(null); setNewObject({ name: '', address: '' }); }} className="px-4 bg-slate-100 text-slate-600 py-2.5 rounded-lg text-sm font-bold">Отмена</button>
                                            </div>
                                        </div>
                                    </form>
                                )}

                                {projectObjects[project.id]?.length === 0 && (
                                    <div className="text-center py-8 text-slate-400 bg-white rounded-xl border border-dashed border-slate-200">
                                        Нет разделов. Создайте первый!
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
                                                        <span className="text-xs font-bold text-slate-400 uppercase">Подразделы</span>
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
                                                        <form onSubmit={(e) => handleCreateSubObject(e, object.id)} className="mb-3 flex flex-col sm:flex-row gap-2 relative items-start sm:items-center">
                                                            <div className="flex-1 w-full space-y-2 sm:space-y-0 sm:flex sm:gap-2">
                                                                <input
                                                                    className={`w-full sm:flex-1 border-slate-200 rounded-lg text-sm px-3 py-1.5 focus:ring-indigo-500 focus:border-indigo-500 ${editingSubObjectId ? 'border-orange-200 bg-orange-50' : ''}`}
                                                                    placeholder="Название (напр. Кухня, Этаж 1)"
                                                                    value={newSubObject.name}
                                                                    onChange={e => setNewSubObject({ ...newSubObject, name: e.target.value })}
                                                                    required
                                                                />
                                                                {!editingSubObjectId && (
                                                                    <select
                                                                        className="w-full sm:w-48 border-slate-200 rounded-lg text-sm px-3 py-1.5 focus:ring-indigo-500 focus:border-indigo-500 text-slate-600"
                                                                        value={newSubObject.templateId}
                                                                        onChange={e => setNewSubObject({ ...newSubObject, templateId: e.target.value })}
                                                                    >
                                                                        <option value="">Без шаблона</option>
                                                                        {subObjectTemplates.map(t => (
                                                                            <option key={t.id} value={t.id}>{t.name}</option>
                                                                        ))}
                                                                    </select>
                                                                )}
                                                            </div>
                                                            <div className="flex gap-2 w-full sm:w-auto">
                                                                <button type="submit" className={`flex-1 sm:flex-none text-white px-3 py-1.5 rounded-lg text-sm font-bold ${editingSubObjectId ? 'bg-orange-500 hover:bg-orange-600' : 'bg-indigo-600 hover:bg-indigo-700'}`}>
                                                                    {editingSubObjectId ? 'Сохр.' : 'OK'}
                                                                </button>
                                                                {editingSubObjectId && (
                                                                    <button type="button" onClick={() => { setShowSubObjectForm(null); setEditingSubObjectId(null); setNewSubObject({ name: '', templateId: '' }); }} className="flex-1 sm:flex-none bg-slate-200 text-slate-600 px-3 py-1.5 rounded-lg text-sm font-bold">Отм.</button>
                                                                )}
                                                            </div>
                                                        </form>
                                                    )}

                                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
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
                                                                        <button onClick={(e) => { e.stopPropagation(); openSubObjectAssignment(subObject); }} className="text-slate-400 hover:text-indigo-600" title="Назначить рабочих">
                                                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
                                                                        </button>
                                                                        <button onClick={(e) => handleDeleteSubObject(e, subObject.id, object.id)} className="text-slate-400 hover:text-red-600" title="Уд.">
                                                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                                                        </button>
                                                                        <button
                                                                            onClick={(e) => startCreateTask(e, subObject.id)}
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
                                                                                {availableTaskWorkers.map(u => (
                                                                                    <option key={u.id} value={u.id}>{u.fullName}</option>
                                                                                ))}
                                                                            </select>
                                                                            {newTask.taskType === 'PARALLEL' && (
                                                                                <div className="text-[10px] text-amber-700 bg-amber-50 p-2 rounded mt-1 border border-amber-200">
                                                                                    ⚠️ <strong>Параллельные задачи:</strong> назначайте разных работников
                                                                                </div>
                                                                            )}
                                                                            <div className="grid grid-cols-2 gap-2 mt-2">
                                                                                <div className="space-y-1">
                                                                                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest pl-1">Приоритет</label>
                                                                                    <select
                                                                                        className="w-full border-indigo-200 rounded-lg text-xs p-2 bg-white"
                                                                                        value={newTask.priority}
                                                                                        onChange={e => setNewTask({ ...newTask, priority: e.target.value })}
                                                                                    >
                                                                                        <option value="LOW">Низкий</option>
                                                                                        <option value="MEDIUM">Средний</option>
                                                                                        <option value="HIGH">Высокий</option>
                                                                                    </select>
                                                                                </div>

                                                                                <div className="space-y-1">
                                                                                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest pl-1">Расположение</label>
                                                                                    <select
                                                                                        className="w-full border-indigo-200 rounded-lg text-xs p-2 bg-white"
                                                                                        value={newTask.placement}
                                                                                        onChange={e => setNewTask({ ...newTask, placement: e.target.value })}
                                                                                    >
                                                                                        <option value="END">В конец</option>
                                                                                        <option value="START">В начало</option>
                                                                                        <option value="AFTER">После...</option>
                                                                                    </select>
                                                                                </div>
                                                                            </div>


                                                                            {!editingTaskId && (
                                                                                <>
                                                                                    {/* Template Selector */}
                                                                                    <div className="pt-2 border-t border-indigo-100 mb-2">
                                                                                        <div className="flex justify-between items-center mb-1">
                                                                                            <label className="text-[10px] font-bold text-slate-500 uppercase">Чек-лист</label>
                                                                                            <select
                                                                                                className="text-xs border-none bg-indigo-50 text-indigo-600 font-bold focus:ring-0 cursor-pointer hover:bg-indigo-100 rounded px-2 py-0.5 transition-colors"
                                                                                                onChange={handleTemplateSelect}
                                                                                                defaultValue=""
                                                                                            >
                                                                                                <option value="" disabled>Загрузить шаблон...</option>
                                                                                                <option value="custom" className="font-bold text-orange-600">-- Пустой (сбросить) --</option>
                                                                                                {templates.map(t => (
                                                                                                    <option key={t.id} value={t.id}>{t.name}</option>
                                                                                                ))}
                                                                                            </select>
                                                                                        </div>
                                                                                        <div className="space-y-1">
                                                                                            {newTask.checklist.map((item, idx) => (
                                                                                                <div key={idx} className="flex gap-1 items-center bg-white p-1 rounded border border-slate-100 group relative">
                                                                                                    <span className="text-[10px] text-slate-400">#{idx + 1}</span>
                                                                                                    <span className="flex-1 text-[11px] truncate" title={item.description}>{item.description}</span>
                                                                                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                                                        <label className="flex items-center gap-0.5 cursor-pointer">
                                                                                                            <input
                                                                                                                type="checkbox"
                                                                                                                checked={item.isPhotoRequired}
                                                                                                                onChange={(e) => {
                                                                                                                    const updated = [...newTask.checklist];
                                                                                                                    updated[idx] = { ...updated[idx], isPhotoRequired: e.target.checked };
                                                                                                                    setNewTask({ ...newTask, checklist: updated });
                                                                                                                }}
                                                                                                                className="w-2.5 h-2.5 rounded border-slate-300 text-indigo-600"
                                                                                                            />
                                                                                                            <span className="text-[9px] text-slate-500 font-bold">Фото</span>
                                                                                                        </label>
                                                                                                        <button
                                                                                                            type="button"
                                                                                                            onClick={() => setNewTask({ ...newTask, checklist: newTask.checklist.filter((_, i) => i !== idx) })}
                                                                                                            className="text-red-400 hover:text-red-600 px-1"
                                                                                                        >
                                                                                                            ×
                                                                                                        </button>
                                                                                                    </div>
                                                                                                </div>
                                                                                            ))}
                                                                                        </div>
                                                                                    </div>
                                                                                    <div className="flex flex-col sm:flex-row gap-2">
                                                                                        <input
                                                                                            id={`new-checklist-description-${subObject.id}`}
                                                                                            className="flex-1 border-indigo-100 rounded-lg text-xs p-2.5 bg-white"
                                                                                            placeholder="Новый пункт чек-листа..."
                                                                                            onKeyDown={(e) => {
                                                                                                if (e.key === 'Enter') {
                                                                                                    e.preventDefault();
                                                                                                    const val = e.target.value.trim();
                                                                                                    if (val) {
                                                                                                        const photoReq = document.getElementById(`new-checklist-photo-req-${subObject.id}`).checked;
                                                                                                        setNewTask({ ...newTask, checklist: [...newTask.checklist, { description: val, isPhotoRequired: photoReq }] });
                                                                                                        e.target.value = '';
                                                                                                        document.getElementById(`new-checklist-photo-req-${subObject.id}`).checked = false;
                                                                                                    }
                                                                                                }
                                                                                            }}
                                                                                        />
                                                                                        <div className="flex gap-2">
                                                                                            <label className="flex items-center gap-2 cursor-pointer bg-white px-3 py-2 rounded-lg border border-indigo-100 flex-1 sm:flex-none">
                                                                                                <input
                                                                                                    type="checkbox"
                                                                                                    id={`new-checklist-photo-req-${subObject.id}`}
                                                                                                    className="w-4 h-4 rounded border-slate-300 text-indigo-600"
                                                                                                />
                                                                                                <span className="text-[10px] text-slate-500 font-bold uppercase">ФОТО</span>
                                                                                            </label>
                                                                                            <button
                                                                                                type="button"
                                                                                                onClick={() => {
                                                                                                    const input = document.getElementById(`new-checklist-description-${subObject.id}`);
                                                                                                    const val = input.value.trim();
                                                                                                    const photoReq = document.getElementById(`new-checklist-photo-req-${subObject.id}`).checked;
                                                                                                    if (val) {
                                                                                                        setNewTask({ ...newTask, checklist: [...newTask.checklist, { description: val, isPhotoRequired: photoReq }] });
                                                                                                        input.value = '';
                                                                                                        document.getElementById(`new-checklist-photo-req-${subObject.id}`).checked = false;
                                                                                                    }
                                                                                                }}
                                                                                                className="bg-indigo-600 text-white px-4 rounded-lg font-bold"
                                                                                            >
                                                                                                +
                                                                                            </button>
                                                                                        </div>
                                                                                    </div>
                                                                                </>
                                                                            )}
                                                                            {newTask.placement === 'AFTER' && (
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



                                                                            {editingTaskId && (
                                                                                <ChecklistManager
                                                                                    taskId={editingTaskId}
                                                                                    onUpdate={(updatedChecklist) => {
                                                                                        setNewTask(prev => ({ ...prev, checklist: updatedChecklist }));
                                                                                    }}
                                                                                />
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
                                                                                <button onClick={(e) => startEditTask(e, task, subObject.id, project.id)} className="text-slate-300 hover:text-indigo-600 ml-1 hidden group-hover:block" title="Ред.">
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

            {/* Assignment Modal */}
            {
                showAssignmentModal && (
                    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-zoomIn">
                            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-indigo-50/30">
                                <div>
                                    <h3 className="text-lg font-bold text-slate-800">
                                        {showAssignmentModal.type === 'PROJECT' ? 'Управление командой проекта' : 'Назначение рабочих'}
                                    </h3>
                                    <p className="text-xs text-slate-500 font-medium truncate max-w-[280px]">{showAssignmentModal.name}</p>
                                </div>
                                <button onClick={() => setShowAssignmentModal(null)} className="p-2 hover:bg-white rounded-full transition-colors text-slate-400">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l18 18"></path></svg>
                                </button>
                            </div>

                            <div className="p-6 space-y-6">
                                {/* Assigned Staff List */}
                                <div className="space-y-3">
                                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Текущий состав</h4>
                                    {assignmentLoading ? (
                                        <div className="text-center py-4 text-slate-400 text-sm">Загрузка...</div>
                                    ) : assignedStaff.length > 0 ? (
                                        <div className="space-y-2">
                                            {assignedStaff.map(s => (
                                                <div key={`${s.id}-${s.isPM ? 'pm' : s.isForeman ? 'foreman' : 'worker'}`} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${s.isPM ? 'bg-amber-100 text-amber-600' :
                                                            s.isForeman ? 'bg-indigo-100 text-indigo-600' :
                                                                'bg-emerald-100 text-emerald-600'
                                                            }`}>
                                                            {s.fullName.substring(0, 1)}
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-bold text-slate-700">{s.fullName}</p>
                                                            <p className="text-[10px] uppercase font-bold text-slate-400">
                                                                {s.isPM ? 'Project Manager' : s.isForeman ? 'Foreman' : 'Worker'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    {!s.isPM && (
                                                        <button
                                                            onClick={() => showAssignmentModal.type === 'PROJECT' ? handleRemoveForeman(showAssignmentModal.id, s.id) : handleRemoveWorker(showAssignmentModal.id, s.id)}
                                                            className="p-1.5 text-slate-300 hover:text-red-500 transition-colors"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                                        </button>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-6 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-400 text-xs italic">
                                            Никто не назначен
                                        </div>
                                    )}
                                </div>

                                {/* Add New Section */}
                                <div className="space-y-3 pt-4 border-t border-slate-100">
                                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Добавить</h4>
                                    {showAssignmentModal.type === 'PROJECT' ? (
                                        <div className="space-y-4">
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Добавить Foremen</label>
                                                <div className="flex gap-2">
                                                    <select
                                                        id="foreman-select"
                                                        className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-indigo-400"
                                                    >
                                                        <option value="">Выберите прораба...</option>
                                                        {users.filter(u => u.role === 'FOREMAN').map(u => (
                                                            <option key={u.id} value={u.id}>{u.fullName}</option>
                                                        ))}
                                                    </select>
                                                    <button
                                                        onClick={() => {
                                                            const id = document.getElementById('foreman-select').value;
                                                            if (id) handleAddForeman(showAssignmentModal.id, id);
                                                        }}
                                                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded-lg text-sm font-bold shadow-sm"
                                                    >
                                                        +
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Добавить рабочего</label>
                                            <div className="flex gap-2">
                                                <select
                                                    id="worker-select"
                                                    className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-indigo-400"
                                                >
                                                    <option value="">Выберите рабочего...</option>
                                                    {users.filter(u => u.role === 'WORKER').map(u => (
                                                        <option key={u.id} value={u.id}>{u.fullName}</option>
                                                    ))}
                                                </select>
                                                <button
                                                    onClick={() => {
                                                        const id = document.getElementById('worker-select').value;
                                                        if (id) handleAddWorker(showAssignmentModal.id, id);
                                                    }}
                                                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded-lg text-sm font-bold shadow-sm"
                                                >
                                                    +
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="p-4 bg-slate-50 flex justify-end">
                                <button onClick={() => setShowAssignmentModal(null)} className="px-6 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold text-sm shadow-sm hover:bg-slate-50 transition-colors">
                                    Закрыть
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default EstimatorDashboard;
