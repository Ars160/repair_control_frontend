import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
        <div className="space-y-6 pb-20 animate-fadeIn">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate('/dashboard')}
                    className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                    <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
                    </svg>
                </button>
                <div className="flex-1">
                    <h1 className="text-3xl font-bold text-slate-800">{project.name}</h1>
                    <p className="text-slate-500 mt-1">{project.description || 'Проект строительных работ'}</p>
                </div>
                <div className="text-right">
                    <div className="text-4xl font-bold text-indigo-600">{progress}%</div>
                    <div className="text-xs text-slate-400 uppercase font-bold">Завершено</div>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatCard label="Всего задач" value={tasks.length} color="bg-slate-100" />
                <StatCard label="Готово" value={completed} color="bg-emerald-100 text-emerald-700" />
                <StatCard label="В работе" value={tasks.filter(t => t.status === STATUSES.ACTIVE).length} color="bg-blue-100 text-blue-700" />
                <StatCard label="Доработки" value={tasks.filter(t => t.status.includes('REWORK')).length} color="bg-rose-100 text-rose-700" />
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

const StatCard = ({ label, value, color = 'bg-slate-100' }) => (
    <div className={`p-4 rounded-2xl ${color}`}>
        <div className="text-2xl font-bold">{value}</div>
        <div className="text-xs uppercase font-bold tracking-wider opacity-60">{label}</div>
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
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div
                className="p-5 flex justify-between items-center cursor-pointer hover:bg-slate-50"
                onClick={loadSubObjects}
            >
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
                        </svg>
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-slate-800">{object.name}</h3>
                        {object.address && <p className="text-sm text-slate-500">{object.address}</p>}
                    </div>
                </div>
                <svg className={`w-5 h-5 text-slate-400 transition-transform ${expanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                </svg>
            </div>

            {expanded && (
                <div className="border-t border-slate-100 bg-slate-50 p-5">
                    {loading ? (
                        <div className="text-center py-4 text-slate-400">Загрузка...</div>
                    ) : subObjects.length > 0 ? (
                        <div className="space-y-4">
                            {subObjects.map(sub => (
                                <SubObjectCard key={sub.id} subObject={sub} />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-4 text-slate-400">Нет локаций</div>
                    )}
                </div>
            )}
        </div>
    );
};

const SubObjectCard = ({ subObject }) => {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadTasks = async () => {
            const data = await api.getTasksBySubObject(subObject.id);
            setTasks(data.sort((a, b) => (a.index || 0) - (b.index || 0)));
            setLoading(false);
        };
        loadTasks();
    }, [subObject.id]);

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
            <h4 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
                <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                {subObject.name}
                <span className="text-xs text-slate-400 ml-auto">{tasks.length} задач</span>
            </h4>

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

    const config = statusConfig[task.status] || statusConfig.default;

    // Get assignee info
    const hasAssignees = task.assigneeIds && task.assigneeIds.length > 0;
    const assigneeText = hasAssignees
        ? `${task.assigneeIds.length} чел.`
        : 'Не назначено';

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

                <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                        <div className={`w-2 h-2 rounded-full ${config.dot}`}></div>
                        <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                        </svg>
                        <span className={`text-xs font-medium ${hasAssignees ? 'text-slate-600' : 'text-rose-600'}`}>
                            {assigneeText}
                        </span>
                    </div>
                    <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${config.badge} ${config.text}`}>
                        {translateStatus(task.status)}
                    </span>
                </div>

                {task.deadline && (
                    <div className="flex items-center gap-1 text-[10px] text-slate-500">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                        </svg>
                        {new Date(task.deadline).toLocaleDateString('ru-RU')}
                    </div>
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

export default ProjectDetails;
