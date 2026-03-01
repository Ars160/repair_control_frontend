import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import api from '../api/client';
import { STATUSES } from '../utils/mockData';

const ProjectDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [project, setProject] = useState(null);
    const [objects, setObjects] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadProjectData = async () => {
            try {
                const [projectData, objectsData, allTasks] = await Promise.all([
                    api.getProjects().then(p => p.find(pr => pr.id === Number(id))),
                    api.getObjectsByProject(id),
                    api.getTasks('SUPER_ADMIN')
                ]);

                setProject(projectData);
                setObjects(objectsData);
                setTasks(allTasks.filter(t => String(t.projectName).toLowerCase().includes(projectData?.name?.toLowerCase() || '')));
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        loadProjectData();
    }, [id]);

    if (loading) return <div className="text-center py-20">Загрузка проекта...</div>;
    if (!project) return <div className="text-center py-20 text-red-500">Проект не найден</div>;

    const completed = tasks.filter(t => t.status === STATUSES.COMPLETED).length;
    const progress = tasks.length > 0 ? Math.round((completed / tasks.length) * 100) : 0;

    return (
        <div className="space-y-10 pb-24 animate-fadeIn">
            {/* Premium Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="flex items-start gap-4 sm:gap-5 w-full">
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="p-3 bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 transition-colors shadow-sm mt-1 shrink-0"
                    >
                        <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7"></path>
                        </svg>
                    </button>
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center flex-wrap gap-2 sm:gap-3 mb-1">
                            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-800 tracking-tight break-words break-all sm:break-normal">
                                {project.name}
                            </h1>
                            <span className="shrink-0 bg-indigo-50 text-indigo-600 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider border border-indigo-100 mt-1 sm:mt-0">В РАБОТЕ</span>
                        </div>
                        <p className="text-sm sm:text-base text-slate-500 font-medium max-w-xl break-words line-clamp-2 md:line-clamp-none">
                            {project.description || 'Основные строительные и отделочные работы на объекте в пос. Байберг'}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-6 bg-white p-4 rounded-3xl border border-slate-100 shadow-sm self-start md:self-auto">
                    <div className="relative w-16 h-16">
                        <svg className="w-full h-full transform -rotate-90">
                            <circle cx="32" cy="32" r="28" fill="transparent" stroke="currentColor" strokeWidth="6" className="text-slate-100" />
                            <circle cx="32" cy="32" r="28" fill="transparent" stroke="currentColor" strokeWidth="6" strokeDasharray={`${Math.PI * 2 * 28}`} strokeDashoffset={`${Math.PI * 2 * 28 * (1 - progress / 100)}`} className="text-indigo-600" strokeLinecap="round" />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center text-xs font-black text-slate-800">{progress}%</div>
                    </div>
                    <div>
                        <div className="text-2xl font-black text-indigo-600 leading-none">{progress}%</div>
                        <div className="text-[10px] text-slate-400 uppercase font-black tracking-widest mt-1">Готовность</div>
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
                <StatCard label="Всего задач" value={tasks.length} icon={<TaskIcon />} color="bg-slate-50 text-slate-700 border-slate-100" />
                <StatCard label="Выполнено" value={completed} icon={<CheckIcon />} color="bg-emerald-50 text-emerald-700 border-emerald-100" />
                <StatCard label="В процессе" value={tasks.filter(t => t.status === STATUSES.ACTIVE).length} icon={<PlayIcon />} color="bg-blue-50 text-blue-700 border-blue-100" />
                <StatCard label="Доработки" value={tasks.filter(t => t.status.includes('REWORK')).length} icon={<AlertIcon />} color="bg-rose-50 text-rose-700 border-rose-100" />
            </div>

            {/* Objects */}
            <div className="space-y-4">
                <h2 className="text-xl font-bold text-slate-800">Объекты строительства</h2>
                {objects.map(obj => (
                    <ObjectCard key={obj.id} object={obj} />
                ))}
            </div>
        </div>
    );
};

const StatCard = ({ label, value, icon, color }) => (
    <div className={`p-4 sm:p-5 rounded-3xl border ${color} shadow-sm flex flex-col gap-3 group hover:scale-[1.02] transition-transform`}>
        <div className="flex justify-between items-start">
            <span className="text-2xl sm:text-3xl font-black">{value}</span>
            <div className="opacity-40 group-hover:scale-110 transition-transform">{icon}</div>
        </div>
        <div className="text-[10px] uppercase font-black tracking-widest opacity-60 leading-none">{label}</div>
    </div>
);

const ObjectCard = ({ object }) => {
    const [expanded, setExpanded] = useState(false);
    const [subObjects, setSubObjects] = useState([]);
    const [loading, setLoading] = useState(false);

    const loadSubObjects = async () => {
        if (!expanded && subObjects.length === 0) {
            setLoading(true);
            const data = await api.getSubObjectsByObject(object.id);
            setSubObjects(data);
            setLoading(false);
        }
        setExpanded(!expanded);
    };

    return (
        <div className="card-premium overflow-hidden border-none ring-1 ring-slate-100">
            <div
                className="p-5 sm:p-6 flex justify-between items-center cursor-pointer hover:bg-slate-50/50 transition-colors"
                onClick={loadSubObjects}
            >
                <div className="flex items-center gap-5 min-w-0 flex-1">
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-50 to-indigo-100 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-100 ${expanded ? 'bg-indigo-600 text-white' : ''} transition-colors duration-300`}>
                        <svg className="w-7 h-7 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
                        </svg>
                    </div>
                    <div className="min-w-0 flex-1">
                        <h3 className="text-lg sm:text-xl font-black text-slate-800 tracking-tight break-words break-all sm:break-normal line-clamp-2">{object.name}</h3>
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-1 min-w-0">
                            {object.address && <p className="text-xs text-slate-500 flex items-center gap-1 font-medium min-w-0 truncate">
                                <svg className="w-3 h-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                                {object.address}
                            </p>}
                            <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                            <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">{object.subObjectCount || 0} ЛОКАЦИЙ</span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="hidden sm:flex flex-col items-end">
                        <div className="text-xs font-black text-slate-400 uppercase tracking-widest leading-none">Прогресс</div>
                        <div className="text-lg font-black text-slate-700 tracking-tight mt-1">45%</div>
                    </div>
                    <div className={`p-2 rounded-xl bg-slate-100 text-slate-400 transition-transform duration-300 ${expanded ? 'rotate-180 bg-slate-900 text-white' : ''}`}>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7"></path>
                        </svg>
                    </div>
                </div>
            </div>

            {expanded && (
                <div className="bg-slate-50/50 p-6 border-t border-slate-100">
                    {loading ? (
                        <div className="flex items-center justify-center py-10">
                            <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                        </div>
                    ) : subObjects.length > 0 ? (
                        <div className="space-y-6">
                            {subObjects.map(sub => (
                                <SubObjectCard key={sub.id} subObject={sub} />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-10 bg-white rounded-2xl border-2 border-dashed border-slate-200">
                            <p className="text-sm font-bold text-slate-400">В этом объекте пока нет локаций</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

const SubObjectCard = ({ subObject }) => {
    const { user } = useAuth();
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadTasks = async () => {
            // Filter tasks for workers, show all for foreman/estimators/managers
            const userId = user.role === 'WORKER' ? user.id : null;
            const data = await api.getTasksBySubObject(subObject.id, userId);
            setTasks(data.sort((a, b) => (a.index || 0) - (b.index || 0)));
            setLoading(false);
        };
        loadTasks();
    }, [subObject.id, user]);

    if (loading) return <div className="text-sm text-slate-400">Загрузка задач...</div>;

    // Group tasks by their flow: sequential tasks go in single column, parallel tasks go side-by-side
    const taskGroups = [];
    let i = 0;
    while (i < tasks.length) {
        const currentTask = tasks[i];
        if (currentTask.taskType === 'PARALLEL') {
            // Collect all parallel tasks at this index level
            const parallelGroup = [currentTask];
            let j = i + 1;
            while (j < tasks.length && tasks[j].taskType === 'PARALLEL' && tasks[j].index === currentTask.index) {
                parallelGroup.push(tasks[j]);
                j++;
            }
            taskGroups.push({ type: 'parallel', tasks: parallelGroup });
            i = j;
        } else {
            // Sequential task
            taskGroups.push({ type: 'sequential', tasks: [currentTask] });
            i++;
        }
    }

    return (
        <div className="bg-white rounded-xl p-4 border border-slate-200">
            <div className="font-bold text-slate-700 mb-4 flex items-start sm:items-center gap-2">
                <div className="w-2 h-2 bg-indigo-500 rounded-full mt-2 sm:mt-0 shrink-0"></div>
                <h4 className="min-w-0 flex-1 break-words break-all sm:break-normal pr-2">
                    {subObject.name}
                </h4>
                <span className="text-xs text-slate-400 ml-auto shrink-0 whitespace-nowrap">{tasks.length} задач</span>
            </div>

            {tasks.length > 0 ? (
                <div className="space-y-2">
                    {taskGroups.map((group, groupIdx) => (
                        <div key={groupIdx}>
                            {group.type === 'sequential' ? (
                                <TaskCard task={group.tasks[0]} />
                            ) : (
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 px-2">
                                        <div className="flex-1 h-px bg-slate-200"></div>
                                        <span className="text-[10px] font-bold text-indigo-600 uppercase bg-indigo-50 px-2 py-0.5 rounded-full">
                                            Параллельные ({group.tasks.length})
                                        </span>
                                        <div className="flex-1 h-px bg-slate-200"></div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 p-2 bg-indigo-50/30 rounded-xl border-2 border-dashed border-indigo-200">
                                        {group.tasks.map(task => (
                                            <TaskCard key={task.id} task={task} isParallel={true} />
                                        ))}
                                    </div>
                                </div>
                            )}
                            {groupIdx < taskGroups.length - 1 && (
                                <div className="flex justify-center my-2">
                                    <svg className="w-6 h-6 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"></path>
                                    </svg>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-sm text-slate-400 text-center py-4">Нет задач</div>
            )}
        </div>
    );
};

const TaskCard = ({ task, isParallel = false }) => {
    const navigate = useNavigate();

    const statusConfig = {
        [STATUSES.COMPLETED]: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', badge: 'bg-emerald-100', dot: 'bg-emerald-500' },
        [STATUSES.ACTIVE]: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', badge: 'bg-blue-100', dot: 'bg-blue-500' },
        [STATUSES.UNDER_REVIEW_PM]: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', badge: 'bg-amber-100', dot: 'bg-amber-500' },
        [STATUSES.UNDER_REVIEW_FOREMAN]: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', badge: 'bg-amber-100', dot: 'bg-amber-500' },
        [STATUSES.REWORK]: { bg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-700', badge: 'bg-rose-100', dot: 'bg-rose-500' },
        [STATUSES.REWORK_PM]: { bg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-700', badge: 'bg-rose-100', dot: 'bg-rose-500' },
        [STATUSES.REWORK_FOREMAN]: { bg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-700', badge: 'bg-rose-100', dot: 'bg-rose-500' },
        [STATUSES.LOCKED]: { bg: 'bg-slate-50', border: 'border-slate-200', text: 'text-slate-700', badge: 'bg-slate-100', dot: 'bg-slate-400' },
        default: { bg: 'bg-slate-50', border: 'border-slate-200', text: 'text-slate-700', badge: 'bg-slate-100', dot: 'bg-slate-400' }
    };

    const baseConfig = statusConfig[task.status] || statusConfig.default;

    // Calculate if task is overdue
    let isOverdue = false;
    if (task.deadline && task.status !== STATUSES.COMPLETED) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const deadlineDate = new Date(task.deadline);
        deadlineDate.setHours(0, 0, 0, 0);
        isOverdue = deadlineDate < today;
    }

    // Override colors if overdue, unless it's completed
    const config = isOverdue ? {
        ...baseConfig,
        border: 'border-rose-400',
        bg: 'bg-rose-50/80',
    } : baseConfig;

    // Get assignee info
    const hasAssignees = (task.assigneeNames && task.assigneeNames.length > 0) || (task.assigneeIds && task.assigneeIds.length > 0);
    const assigneeNames = task.assigneeNames || [];
    const assigneeCount = assigneeNames.length || (task.assigneeIds ? task.assigneeIds.length : 0);

    return (
        <div
            className={`p-3 rounded-lg border ${config.border} ${config.bg} hover:shadow-md transition-all cursor-pointer group relative`}
            onClick={() => navigate(`/tasks/${task.id}`)}
        >
            {/* Index badge */}
            <div className="absolute -top-2 -left-2 w-6 h-6 rounded-full bg-white border-2 border-slate-300 flex items-center justify-center shadow-sm">
                <span className="text-[10px] font-bold text-slate-700">{(task.index || 0) + 1}</span>
            </div>

            {/* Type indicator */}
            {task.taskType === 'PARALLEL' && !isParallel && (
                <div className="absolute -top-2 -right-2">
                    <span className="bg-indigo-600 text-white text-[8px] px-1.5 py-0.5 rounded-full font-bold uppercase">||</span>
                </div>
            )}

            <div className="space-y-2 mt-1">
                <h5 className="font-bold text-sm text-slate-800 line-clamp-2 group-hover:text-indigo-600 transition-colors">
                    {task.title}
                </h5>

                {/* Assignees section */}
                <div className="flex items-center gap-1.5">
                    <div className={`w-2 h-2 rounded-full ${config.dot}`}></div>
                    {hasAssignees ? (
                        <div className="flex items-center gap-1.5 min-w-0">
                            <div className="flex -space-x-1.5 flex-shrink-0">
                                {assigneeNames.slice(0, 3).map((name, i) => (
                                    <div key={i} className="w-5 h-5 rounded-full bg-indigo-100 border border-white flex items-center justify-center" title={name}>
                                        <span className="text-[8px] font-bold text-indigo-600">{name.charAt(0)}</span>
                                    </div>
                                ))}
                                {assigneeCount > 3 && (
                                    <div className="w-5 h-5 rounded-full bg-slate-200 border border-white flex items-center justify-center">
                                        <span className="text-[8px] font-bold text-slate-500">+{assigneeCount - 3}</span>
                                    </div>
                                )}
                            </div>
                            <span className="text-xs text-slate-600 truncate" title={assigneeNames.join(', ')}>
                                {assigneeNames.length <= 2
                                    ? assigneeNames.join(', ')
                                    : `${assigneeNames[0]} и ещё ${assigneeCount - 1}`
                                }
                            </span>
                        </div>
                    ) : (
                        <span className="text-xs font-medium text-rose-500">Не назначено</span>
                    )}
                </div>

                <div className="flex items-center justify-end">
                    <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${config.badge} ${config.text}`}>
                        {translateStatus(task.status)}
                    </span>
                </div>

                {task.deadline && (
                    isOverdue ? (
                        <div className="flex items-center gap-1.5 mt-2 bg-rose-100/80 border border-rose-200 text-rose-700 px-2 py-1 rounded-md w-fit animate-pulse shadow-sm">
                            <AlertIcon />
                            <span className="text-[10px] font-black uppercase tracking-wider">Просрочено: {new Date(task.deadline).toLocaleDateString('ru-RU')}</span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-1 text-[10px] text-slate-500 mt-2">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                            </svg>
                            {new Date(task.deadline).toLocaleDateString('ru-RU')}
                        </div>
                    )
                )}
            </div>
        </div>
    );
};

const translateStatus = (status) => {
    const translations = {
        [STATUSES.COMPLETED]: 'Готово',
        [STATUSES.ACTIVE]: 'В работе',
        [STATUSES.UNDER_REVIEW_PM]: 'Проверка ПМ',
        [STATUSES.UNDER_REVIEW_FOREMAN]: 'Проверка ПР',
        [STATUSES.REWORK]: 'Доработка',
        [STATUSES.REWORK_PM]: 'Доработка',
        [STATUSES.LOCKED]: 'Ожидание'
    };
    return translations[status] || status;
};

// --- New Icons ---
const TaskIcon = () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path></svg>;
const CheckIcon = () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>;
const PlayIcon = () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>;
const AlertIcon = () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>;

export default ProjectDetails;
