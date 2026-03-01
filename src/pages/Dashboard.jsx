import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import api from '../api/client';
import TaskCard from '../components/TaskCard';
import EstimatorDashboard from './EstimatorDashboard';
import ManagementDashboard from './ManagementDashboard';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [tasks, setTasks] = useState([]);
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState(user?.role === 'FOREMAN' ? 'under_review' : 'in_progress');
    const [searchQuery, setSearchQuery] = useState('');
    const [groupByTemplate, setGroupByTemplate] = useState(false);
    const [collapsedGroups, setCollapsedGroups] = useState({});
    const [highlightedTaskId, setHighlightedTaskId] = useState(null);

    const toggleGroup = (groupName) => {
        setCollapsedGroups(prev => ({
            ...prev,
            [groupName]: !prev[groupName]
        }));
    };

    useEffect(() => {
        const fetchTasks = async () => {
            if (!user) return;
            // Estimators and Managers use their own dashboard components
            if (user.role === 'ESTIMATOR' || user.role === 'PM' || user.role === 'SUPER_ADMIN') {
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                if (user.role === 'FOREMAN') {
                    const [fetchedTasks, fetchedProjects] = await Promise.all([
                        api.getTasks(user.role, user.id),
                        api.getProjects()
                    ]);
                    setTasks(fetchedTasks);

                    // Filter projects to only active ones where the foreman actually has tasks
                    const userProjectNames = [...new Set(fetchedTasks.map(t => t.projectName || t.objectName))].filter(Boolean);
                    const activeUserProjects = fetchedProjects.filter(p =>
                        p.status === 'PUBLISHED' &&
                        userProjectNames.some(name => String(name).toLowerCase().includes(p.name.toLowerCase()))
                    );
                    setProjects(activeUserProjects);
                } else {
                    const fetchedTasks = await api.getTasks(user.role, user.id);
                    setTasks(fetchedTasks);
                }
                setError(null);
            } catch (err) {
                setError('Не удалось загрузить задачи.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchTasks();
    }, [user]);

    // Define mock STATUSES here since we can't easily import from mockData if it's not exported or if we want to be self-contained, 
    // but better to rely on string matching if we can't import. 
    // However, looking at previous context, we can import STATUSES.
    // Let's assume STATUSES are strings.

    const primaryTabs = [
        { id: 'in_progress', label: 'В работе' },
        { id: 'locked', label: 'В очереди' },
        { id: 'completed', label: 'Завершенные' },
    ];

    const secondaryTabs = [
        { id: 'under_review', label: 'На проверке' },
        { id: 'rework_foreman', label: 'Доработка (Прораб)' },
        { id: 'rework_pm', label: 'Доработка (ПМ)' },
    ];

    const handleAlertClick = (task, targetTab) => {
        if (targetTab) {
            setActiveTab(targetTab);
        } else {
            setActiveTab(task.status.toLowerCase());
        }

        // Allow React to commit the Tab switch to the DOM, then invoke the internal DOM layout slide
        setTimeout(() => {
            const taskElement = document.getElementById(`task-card-${task.id}`);
            if (taskElement) {
                // Smooth scroll to the literal card object
                taskElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                // Trigger the ring map flash
                setHighlightedTaskId(task.id);
                // Clear the glow after 2.5s once the user has located it
                setTimeout(() => setHighlightedTaskId(null), 2500);
            } else {
                // Fallback to the top bounding box if object calculation drops
                document.getElementById('task-list-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }, 100);
    };

    const getFilteredTasks = () => {
        return tasks.filter(task => {
            // Search filter
            const matchesSearch =
                task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                task.object.toLowerCase().includes(searchQuery.toLowerCase());

            if (!matchesSearch) return false;

            // Tab filter
            switch (activeTab) {
                case 'in_progress':
                    return task.status === 'ACTIVE';
                case 'locked':
                    return task.status === 'LOCKED';
                case 'under_review':
                    return task.status === 'UNDER_REVIEW_FOREMAN' || task.status === 'UNDER_REVIEW_PM';
                case 'rework_foreman':
                    return task.status === 'REWORK_FOREMAN';
                case 'rework_pm':
                    return task.status === 'REWORK_PM';
                case 'completed':
                    return task.status === 'COMPLETED';
                case 'all': // Fallback if somehow triggered
                default:
                    return false; // Don't show by default if no matching tab is found
            }
        });
    };

    // Sort tasks: Completed tasks always at the bottom
    const filteredTasks = getFilteredTasks().sort((a, b) => {
        if (a.status === 'COMPLETED' && b.status !== 'COMPLETED') return 1;
        if (a.status !== 'COMPLETED' && b.status === 'COMPLETED') return -1;
        return 0; // Keep original order for same status group
    });

    // Calculate counts for tabs
    const getTabCount = (tabId) => {
        if (tabId === 'all') return tasks.length;
        return tasks.filter(task => {
            switch (tabId) {
                case 'in_progress':
                    return task.status === 'ACTIVE';
                case 'locked':
                    return task.status === 'LOCKED';
                case 'under_review':
                    return task.status === 'UNDER_REVIEW_FOREMAN' || task.status === 'UNDER_REVIEW_PM';
                case 'rework_foreman':
                    return task.status === 'REWORK_FOREMAN';
                case 'rework_pm':
                    return task.status === 'REWORK_PM';
                case 'completed':
                    return task.status === 'COMPLETED';
                default:
                    return 0;
            }
        }).length;
    };


    if (!user) return null;

    if (user.role === 'ESTIMATOR') {
        return <EstimatorDashboard />;
    }

    if (user.role === 'PM' || user.role === 'SUPER_ADMIN') {
        return <ManagementDashboard user={user} />;
    }

    if (loading) {
        return <div className="text-center mt-8">Загрузка задач...</div>;
    }

    if (error) {
        return <div className="text-center mt-8 text-red-500">{error}</div>;
    }

    const foremanReviewTasks = tasks.filter(t => t.status === 'UNDER_REVIEW_FOREMAN');
    const foremanReworkTasks = tasks.filter(t => t.status === 'REWORK_FOREMAN');
    const foremanPmReworkTasks = tasks.filter(t => t.status === 'REWORK_PM');

    // Rework tasks specifically returned to the active viewing worker
    const workerReworkTasks = tasks.filter(t => t.status === 'REWORK_FOREMAN' || t.status === 'REWORK_PM');

    return (
        <div className="animate-fadeIn pb-20">
            {user.role === 'WORKER' && workerReworkTasks.length > 0 && (
                <div className="mb-8 bg-rose-50/50 rounded-2xl shadow-md border-2 border-rose-200 p-5 sm:p-6 pb-4">
                    <h2 className="text-lg sm:text-xl font-bold text-slate-800 flex items-center gap-3 mb-4">
                        <div className="p-2 bg-rose-100 text-rose-600 rounded-xl relative shrink-0">
                            <span className="absolute -top-1 -right-1 flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
                            </span>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                        </div>
                        <span className="leading-tight flex-1">Вам вернули на доработку</span>
                        <span className="text-base sm:text-sm font-bold text-rose-600 bg-rose-100 w-8 h-8 sm:w-auto sm:h-auto sm:px-3 sm:py-1 rounded-xl sm:rounded-lg shrink-0 flex items-center justify-center">
                            <span>{workerReworkTasks.length}</span>
                            <span className="hidden sm:inline sm:ml-1">задач</span>
                        </span>
                    </h2>
                    <hr className="border-rose-100/60 mb-5 mt-1" />
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {workerReworkTasks.map(task => (
                            <div
                                key={task.id}
                                onClick={() => handleAlertClick(task)}
                                className="p-4 bg-white hover:bg-rose-50 rounded-xl border-l-4 border-l-rose-500 border border-slate-200 cursor-pointer transition-all group shadow shadow-rose-100/50 hover:shadow-md"
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <h4 className="text-sm font-bold text-slate-800 group-hover:text-rose-700 transition-colors line-clamp-2 pr-2">{task.title}</h4>
                                </div>
                                <div className="flex items-center justify-between mt-auto pt-2 border-t border-slate-50">
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest truncate max-w-[60%]">{task.object || task.objectName}</p>
                                    <span className="text-[10px] font-bold text-rose-600 bg-rose-100 px-2 py-0.5 rounded flex items-center gap-1">
                                        Исправить сейчас
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {user.role === 'FOREMAN' && (
                <div className="mb-8 space-y-6">
                    {/* Review Queue (Amber) */}
                    <div className="bg-amber-50/50 rounded-2xl shadow-md border-2 border-amber-200 p-5 sm:p-6 pb-2">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg sm:text-xl font-bold text-slate-800 flex items-center gap-3 flex-1">
                                <div className="p-2 bg-amber-100 text-amber-600 rounded-xl shrink-0">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                </div>
                                <span className="leading-tight">Очередь проверки</span>
                            </h2>
                            {foremanReviewTasks.length > 0 && (
                                <div className="flex items-center gap-2 shrink-0">
                                    <span className="relative flex h-3 w-3 hidden sm:flex">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
                                    </span>
                                    <span className="text-base sm:text-sm font-bold text-amber-600 bg-amber-100 w-8 h-8 sm:w-auto sm:h-auto sm:px-3 sm:py-1 rounded-xl sm:rounded-lg flex items-center justify-center">
                                        <span>{foremanReviewTasks.length}</span>
                                        <span className="hidden sm:inline sm:ml-1">ждут</span>
                                    </span>
                                </div>
                            )}
                        </div>
                        <hr className="border-amber-100/60 mb-5 mt-1" />

                        {foremanReviewTasks.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-4">
                                {foremanReviewTasks.map(task => (
                                    <div
                                        key={task.id}
                                        onClick={() => handleAlertClick(task, 'under_review')}
                                        className="p-4 bg-white hover:bg-amber-50 rounded-xl border border-amber-200 hover:border-amber-400 cursor-pointer transition-all group shadow shadow-amber-100/50 hover:shadow-md"
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <h4 className="text-sm font-bold text-slate-800 group-hover:text-amber-700 transition-colors line-clamp-2 pr-2">{task.title}</h4>
                                        </div>
                                        <div className="flex items-center justify-between mt-auto pt-2 border-t border-slate-50">
                                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest truncate max-w-[60%]">{task.object || task.objectName}</p>
                                            <span className="text-[10px] font-bold text-amber-600 bg-amber-100 px-2 py-0.5 rounded flex items-center gap-1">
                                                <svg className="w-3 h-3 block sm:hidden md:block" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                                {task.deadline ? new Date(task.deadline).toLocaleDateString('ru-RU') : 'Без срока'}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-6 mb-4 bg-white/50 rounded-xl border border-dashed border-slate-200">
                                <div className="w-10 h-10 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mb-2">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                                </div>
                                <p className="text-sm font-bold text-slate-500">Отличная работа! Нет задач на проверку.</p>
                            </div>
                        )}
                    </div>

                    {/* Pending Reworks by Workers (Red) */}
                    {foremanReworkTasks.length > 0 && (
                        <div className="bg-rose-50/50 rounded-2xl shadow-md border-2 border-rose-200 p-5 sm:p-6">
                            <h2 className="text-lg sm:text-xl font-bold text-slate-800 flex items-center gap-3 mb-4">
                                <div className="p-2 bg-rose-100 text-rose-600 rounded-xl shrink-0">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                                </div>
                                <span className="leading-tight flex-1">На доработке у бригад</span>
                                <span className="text-base sm:text-sm font-bold text-rose-600 bg-rose-100 w-8 h-8 sm:w-auto sm:h-auto sm:px-3 sm:py-1 rounded-xl sm:rounded-lg shrink-0 flex items-center justify-center">
                                    <span>{foremanReworkTasks.length}</span>
                                    <span className="hidden sm:inline sm:ml-1">задач</span>
                                </span>
                            </h2>
                            <hr className="border-rose-100/60 mb-5 mt-1" />
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {foremanReworkTasks.map(task => (
                                    <div
                                        key={task.id}
                                        onClick={() => handleAlertClick(task)}
                                        className="p-4 bg-white rounded-xl border border-rose-200 hover:border-rose-400 cursor-pointer transition-all group shadow shadow-rose-100/50 hover:shadow-md"
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <h4 className="text-sm font-bold text-slate-800 group-hover:text-rose-600 transition-colors line-clamp-2 pr-2">{task.title}</h4>
                                        </div>
                                        <div className="flex items-center justify-between mt-auto pt-2 border-t border-slate-50">
                                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest truncate max-w-[60%]">{task.object || task.objectName}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Pending Reworks by PM (Purple/Hot Alert) */}
                    {foremanPmReworkTasks.length > 0 && (
                        <div className="bg-purple-50/50 rounded-2xl shadow-md border-2 border-purple-200 p-5 sm:p-6 mb-6">
                            <h2 className="text-lg sm:text-xl font-bold text-slate-800 flex items-center gap-3 mb-4">
                                <div className="p-2 bg-purple-100 text-purple-600 rounded-xl relative shrink-0">
                                    <span className="absolute -top-1 -right-1 flex h-3 w-3">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-3 w-3 bg-purple-500"></span>
                                    </span>
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                </div>
                                <span className="leading-tight flex-1">Внимание: Возврат от ПМ!</span>
                                <span className="text-base sm:text-sm font-bold text-purple-600 bg-purple-100 w-8 h-8 sm:w-auto sm:h-auto sm:px-3 sm:py-1 rounded-xl sm:rounded-lg shrink-0 flex items-center justify-center">
                                    <span>{foremanPmReworkTasks.length}</span>
                                    <span className="hidden sm:inline sm:ml-1">задач</span>
                                </span>
                            </h2>
                            <hr className="border-purple-100/80 mb-5 mt-1" />
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {foremanPmReworkTasks.map(task => (
                                    <div
                                        key={task.id}
                                        onClick={() => handleAlertClick(task)}
                                        className="p-4 bg-white rounded-xl border-l-4 border-l-purple-500 border border-slate-200 hover:border-purple-300 cursor-pointer transition-all group shadow shadow-purple-100/50 hover:shadow-md"
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <h4 className="text-sm font-bold text-slate-800 group-hover:text-purple-600 transition-colors line-clamp-2 pr-2">{task.title}</h4>
                                        </div>
                                        <div className="flex items-center justify-between mt-auto pt-2 border-t border-slate-50">
                                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest truncate max-w-[60%]">{task.object || task.objectName}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Projects Overview */}
                    {projects.length > 0 && (
                        <div className="mt-8 mb-4">
                            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-3 mb-4">
                                <div className="p-2 bg-indigo-100 text-indigo-600 rounded-xl">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
                                </div>
                                Ваши объекты
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                {projects.map(project => {
                                    const projTasks = tasks.filter(t => String(t.projectName).toLowerCase().includes(project.name.toLowerCase()) || String(t.objectName).toLowerCase().includes(project.name.toLowerCase()));
                                    const total = projTasks.length;
                                    const completed = projTasks.filter(t => t.status === 'COMPLETED').length;
                                    const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
                                    return (
                                        <div
                                            key={project.id}
                                            onClick={() => navigate(`/project/${project.id}`)}
                                            className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all cursor-pointer group"
                                        >
                                            <div className="flex justify-between items-start mb-3">
                                                <div>
                                                    <h3 className="font-bold text-slate-800 group-hover:text-indigo-600 transition-colors line-clamp-2">{project.name}</h3>
                                                    {project.address && <p className="text-xs text-slate-500 mt-1 line-clamp-1">{project.address}</p>}
                                                </div>
                                            </div>
                                            <div className="space-y-1.5 mt-4">
                                                <div className="flex justify-between items-end">
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Прогресс объекта</span>
                                                    <span className="text-lg font-black text-indigo-600">{progress}%</span>
                                                </div>
                                                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                                    <div className="h-full bg-indigo-500 rounded-full transition-all duration-1000" style={{ width: `${progress}%` }}></div>
                                                </div>
                                                <p className="text-[10px] text-slate-400 text-right mt-1">
                                                    Выполнено {completed} из {total} задач
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    <div className="w-full h-px bg-slate-200 my-8"></div>
                </div>
            )}

            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
                    {user.role === 'FOREMAN' ? 'Все задачи и поиск' : 'Ваши задачи'}
                </h1>

                {/* Search Input */}
                <div className="relative w-full sm:w-64">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                    <input
                        type="text"
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition duration-150 ease-in-out"
                        placeholder="Поиск..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            {/* Filter Tabs */}
            <div className="bg-white p-3 sm:p-4 rounded-xl shadow-sm border border-slate-100 mb-6">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 px-1">Основные статусы</div>
                <div className="flex flex-wrap gap-2 mb-2">
                    {primaryTabs.map(tab => {
                        const count = getTabCount(tab.id);
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`
                                    whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 border
                                    ${isActive
                                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                                        : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                                    }
                                `}
                            >
                                {tab.label}
                                <span className={`ml-2 text-xs py-0.5 px-2 rounded-full ${isActive ? 'bg-indigo-500 text-white' : 'bg-gray-100 text-gray-500'}`}>
                                    {count}
                                </span>
                            </button>
                        );
                    })}
                </div>

                <div className="w-full h-px bg-slate-100 my-4"></div>

                <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 px-1">Проверки и доработки</div>
                <div className="flex flex-wrap gap-2">
                    {secondaryTabs.map(tab => {
                        const count = getTabCount(tab.id);
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`
                                    whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 border
                                    ${isActive
                                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                                        : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                                    }
                                `}
                            >
                                {tab.label}
                                <span className={`ml-2 text-xs py-0.5 px-2 rounded-full ${isActive ? 'bg-indigo-500 text-white' : 'bg-gray-100 text-gray-500'}`}>
                                    {count}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* View Toggle */}
            <div id="task-list-section" className="flex justify-end mb-4 scroll-mt-24">
                {user.role !== 'WORKER' && (
                    <div className="bg-slate-100 p-1 rounded-lg flex gap-1">
                        <button
                            onClick={() => setGroupByTemplate(false)}
                            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${!groupByTemplate ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Список
                        </button>
                        <button
                            onClick={() => setGroupByTemplate(true)}
                            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${groupByTemplate ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            По разделам
                        </button>
                    </div>
                )}
            </div>

            {filteredTasks.length > 0 ? (
                groupByTemplate && user.role !== 'WORKER' ? (
                    Object.entries(
                        filteredTasks.reduce((groups, task) => {
                            const groupName = task.object || task.objectName || task.projectName || 'Без раздела';
                            if (!groups[groupName]) groups[groupName] = [];
                            groups[groupName].push(task);
                            return groups;
                        }, {})
                    ).map(([groupName, tasks]) => (
                        <div key={groupName} className="mb-4 bg-white rounded-xl border border-slate-100 overflow-hidden shadow-sm">
                            <div
                                className="flex items-center gap-3 p-4 cursor-pointer hover:bg-slate-50 transition-colors select-none"
                                onClick={() => toggleGroup(groupName)}
                            >
                                <span className={`transform transition-transform duration-200 text-slate-400 ${collapsedGroups[groupName] ? '-rotate-90' : ''}`}>
                                    ▼
                                </span>
                                <h3 className="text-lg font-bold text-slate-700 flex items-center gap-3 flex-1">
                                    {groupName}
                                    <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-medium">{tasks.length}</span>
                                </h3>
                            </div>

                            {!collapsedGroups[groupName] && (
                                <div className="p-4 pt-0 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fadeIn border-t border-slate-50">
                                    {tasks.map(task => (
                                        <TaskCard key={task.id} task={task} userRole={user.role} isHighlighted={highlightedTaskId === task.id} />
                                    ))}
                                </div>
                            )}
                        </div>
                    ))
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredTasks.map(task => (
                            <TaskCard key={task.id} task={task} userRole={user.role} isHighlighted={highlightedTaskId === task.id} />
                        ))}
                    </div>
                )
            ) : (
                <div className="text-center mt-12 bg-white p-6 sm:p-12 rounded-2xl shadow-sm border border-slate-100">
                    <div className="mx-auto h-12 w-12 text-gray-400 mb-4">
                        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                        </svg>
                    </div>
                    <h2 className="text-lg font-bold text-slate-700 mb-1">Задачи не найдены</h2>
                    <p className="text-sm text-slate-400">
                        {searchQuery
                            ? `По запросу "${searchQuery}" ничего не найдено в этой категории.`
                            : 'В этой категории пока нет задач.'}
                    </p>
                    {(searchQuery || activeTab !== (user.role === 'FOREMAN' ? 'under_review' : 'in_progress')) && (
                        <button
                            onClick={() => { setSearchQuery(''); setActiveTab(user.role === 'FOREMAN' ? 'under_review' : 'in_progress'); }}
                            className="mt-4 text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                        >
                            Сбросить фильтры
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

export default Dashboard;
