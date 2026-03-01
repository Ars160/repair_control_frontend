import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import { STATUSES, ROLES } from '../utils/mockData';

const ManagementDashboard = ({ user }) => {
    const navigate = useNavigate();
    const [tasks, setTasks] = useState([]);
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        const loadDashboardData = async () => {
            try {
                setLoading(true);
                // For PM/Admin we fetch ALL tasks to analyze
                const [allTasks, allProjects] = await Promise.all([
                    api.getTasks('SUPER_ADMIN'), // Use SUPER_ADMIN role to get unfiltered list for analysis
                    api.getProjects()
                ]);
                setTasks(allTasks);
                setProjects(allProjects);
            } catch (err) {
                console.error("Dashboard data load error", err);
                setError("Не удалось загрузить данные управления.");
            } finally {
                setLoading(false);
            }
        };
        loadDashboardData();
    }, []);

    // --- Analytics Calculations ---

    const stats = useMemo(() => {
        const publishedTasks = tasks.filter(t => t.projectStatus === 'PUBLISHED');
        const total = publishedTasks.length;
        const completed = publishedTasks.filter(t => t.status === STATUSES.COMPLETED).length;
        const pendingPM = publishedTasks.filter(t => t.status === STATUSES.UNDER_REVIEW_PM).length;
        const rework = publishedTasks.filter(t => t.status === STATUSES.REWORK || t.status === STATUSES.REWORK_PM || t.status === STATUSES.REWORK_FOREMAN).length;

        const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

        return { total, completed, pendingPM, rework, progress, publishedTasks };
    }, [tasks]);

    const projectAnalytics = useMemo(() => {
        const activeProjects = projects.filter(p => p.status === 'PUBLISHED');
        // Map tasks to projects
        const analytics = activeProjects.map(project => {
            const projectTasks = tasks.filter(t => String(t.projectName).toLowerCase().includes(project.name.toLowerCase()));
            const totalInProject = projectTasks.length;
            const completedInProject = projectTasks.filter(t => t.status === STATUSES.COMPLETED).length;
            const progressInProject = totalInProject > 0 ? Math.round((completedInProject / totalInProject) * 100) : 0;

            return {
                ...project,
                total: totalInProject,
                completed: completedInProject,
                progress: progressInProject,
                tasks: projectTasks
            };
        });
        return analytics.sort((a, b) => b.progress - a.progress);
    }, [tasks, projects]);

    const filteredProjects = useMemo(() => {
        if (!searchQuery) return projectAnalytics;
        return projectAnalytics.filter(p =>
            p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()))
        );
    }, [projectAnalytics, searchQuery]);

    const draftProjects = useMemo(() => {
        return projects.filter(p => p.status === 'DRAFT');
    }, [projects]);

    const urgentTasks = useMemo(() => {
        return tasks
            .filter(t => t.status === STATUSES.UNDER_REVIEW_PM && t.projectStatus === 'PUBLISHED')
            .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
            .slice(0, 5);
    }, [tasks]);

    if (loading) return <div className="text-center py-20">Анализ данных проекта...</div>;
    if (error) return <div className="text-center py-20 text-red-500">{error}</div>;

    return (
        <div className="space-y-8 pb-20 animate-fadeIn">
            {/* Header */}
            <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 tracking-tight">Панель управления</h1>
                <p className="text-sm sm:text-base text-slate-500 mt-1">Добро пожаловать, {user.fullName}. Вот обзор ваших объектов.</p>
            </div>

            {/* Stat Cards */}
            {/* Review Queue (Elevated to Top) */}
            <div className="bg-amber-50/50 rounded-2xl shadow-sm border border-amber-200/60 p-5 sm:p-6 mb-8">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-slate-800 flex items-center gap-3">
                        <div className="p-2 bg-amber-100 text-amber-600 rounded-xl">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        </div>
                        Очередь проверки
                    </h2>
                    {stats.pendingPM > 0 && (
                        <div className="flex items-center gap-2">
                            <span className="relative flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
                            </span>
                            <span className="text-sm font-bold text-amber-600">{stats.pendingPM} задач ждут</span>
                        </div>
                    )}
                </div>

                {urgentTasks.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {urgentTasks.map(task => (
                            <div
                                key={task.id}
                                onClick={() => navigate(`/review/${task.id}`)}
                                className="p-4 bg-white hover:bg-amber-50 rounded-xl border border-slate-200 hover:border-amber-300 cursor-pointer transition-all group shadow-sm hover:shadow-md"
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <h4 className="text-sm font-bold text-slate-800 group-hover:text-amber-700 transition-colors line-clamp-2 pr-2">{task.title}</h4>
                                </div>
                                <div className="flex items-center justify-between mt-auto pt-2 border-t border-slate-50">
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest truncate max-w-[60%]">{task.objectName}</p>
                                    <span className="text-[10px] font-bold text-amber-600 bg-amber-100 px-2 py-0.5 rounded flex items-center gap-1">
                                        <svg className="w-3 h-3 block sm:hidden md:block" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                        {new Date(task.deadline).toLocaleDateString()}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-6 bg-white/50 rounded-xl border border-dashed border-slate-200">
                        <div className="w-10 h-10 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mb-2">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                        </div>
                        <p className="text-sm font-bold text-slate-500">Отличная работа! Нет задач на проверку.</p>
                    </div>
                )}

                {stats.pendingPM > 5 && (
                    <button className="w-full mt-4 py-2 text-sm font-bold text-amber-600 hover:text-amber-700 hover:bg-amber-100/50 rounded-xl transition-colors">
                        Показать все ({stats.pendingPM})
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Project List */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <h2 className="text-xl font-bold text-slate-800">Активные проекты</h2>
                        <div className="relative w-full sm:w-64">
                            <input
                                type="text"
                                placeholder="Поиск объектов..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
                            />
                            <svg className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                            </svg>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-6">
                        {filteredProjects.length > 0 ? (
                            filteredProjects.map(project => (
                                <ProjectCard key={project.id} project={project} />
                            ))
                        ) : (
                            <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200">
                                <p className="text-slate-400">Проекты не найдены</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Sidebar: Reviews/Activity */}
                <div className="space-y-8">
                    {/* The Review Queue block was moved to the very top */}

                    {/* Status Breakdown Mini Chart */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                        <h2 className="text-lg font-bold text-slate-800 mb-6">Распределение статусов</h2>
                        <div className="space-y-4">
                            <StatusRow label="Завершено" count={stats.completed} total={stats.total} color="bg-emerald-500" />
                            <StatusRow label="В работе" count={stats.publishedTasks?.filter(t => t.status === STATUSES.ACTIVE).length || 0} total={stats.total} color="bg-blue-500" />
                            <StatusRow label="На проверке" count={stats.publishedTasks?.filter(t => t.status.includes('REVIEW')).length || 0} total={stats.total} color="bg-amber-500" />
                            <StatusRow label="Доработка" count={stats.rework} total={stats.total} color="bg-rose-500" />
                            <StatusRow label="Ожидание" count={stats.publishedTasks?.filter(t => t.status === STATUSES.LOCKED).length || 0} total={stats.total} color="bg-slate-300" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- Sub-components ---

const StatCard = ({ title, value, subtitle, icon, color, pulse }) => {
    const colorClasses = {
        indigo: 'bg-indigo-50 text-indigo-600',
        amber: 'bg-amber-50 text-amber-600',
        rose: 'bg-rose-50 text-rose-600',
        slate: 'bg-slate-100 text-slate-500',
    };

    return (
        <div className="card-premium p-4 sm:p-6 relative overflow-hidden group">
            <div className={`absolute -right-4 -top-4 w-24 h-24 rounded-full opacity-10 transition-transform group-hover:scale-110 ${colorClasses[color].split(' ')[0]}`}></div>
            {pulse && <div className="absolute top-4 right-4 w-2 h-2 bg-amber-500 rounded-full animate-ping"></div>}
            <div className="flex items-center gap-4 relative z-10">
                <div className={`p-3 rounded-2xl ${colorClasses[color]}`}>
                    {icon}
                </div>
                <div>
                    <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{title}</h3>
                    <div className="flex items-baseline gap-2">
                        <span className="text-2xl sm:text-3xl font-bold text-slate-800 tracking-tight">{value}</span>
                        <span className="text-[10px] text-slate-500 font-medium">{subtitle}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

const ProjectCard = ({ project }) => {
    const navigate = useNavigate();

    return (
        <div
            className="card-premium overflow-hidden group cursor-pointer hover:ring-2 hover:ring-indigo-500/50 hover:shadow-xl transition-all duration-300"
            onClick={() => navigate(`/project/${project.id}`)}
        >
            <div className="p-5 sm:p-7">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 mb-6">
                    <div className="flex items-center gap-5">
                        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-100/50 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-500">
                            <svg className="w-7 h-7 sm:w-8 sm:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
                            </svg>
                        </div>
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <h3 className="text-lg sm:text-2xl font-bold text-slate-800 tracking-tight group-hover:text-indigo-600 transition-colors">{project.name}</h3>
                                <span className="bg-emerald-50 text-emerald-600 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider border border-emerald-100">Активен</span>
                            </div>
                            <p className="text-sm text-slate-500 line-clamp-1">{project.description || 'Проект строительных работ в пос. Байберг'}</p>
                        </div>
                    </div>
                    <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 pt-4 sm:pt-0 border-slate-50">
                        <div className="text-3xl sm:text-4xl font-extrabold text-indigo-600 tracking-tighter">{project.progress}<span className="text-lg sm:text-xl">%</span></div>
                        <div className="text-[10px] text-slate-400 uppercase font-black tracking-widest">Общий прогресс</div>
                    </div>
                </div>

                {/* Detailed Stats */}
                <div className="grid grid-cols-3 gap-6 mb-8">
                    <div className="flex flex-col gap-1">
                        <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Задач</div>
                        <div className="text-xl font-bold text-slate-800">{project.total}</div>
                    </div>
                    <div className="flex flex-col gap-1 border-x border-slate-100 px-6">
                        <div className="text-xs font-bold text-emerald-500 uppercase tracking-widest">Готово</div>
                        <div className="text-xl font-bold text-emerald-600">{project.completed}</div>
                    </div>
                    <div className="flex flex-col gap-1">
                        <div className="text-xs font-bold text-rose-400 uppercase tracking-widest">Ошибки</div>
                        <div className="text-xl font-bold text-rose-600">
                            {project.tasks.filter(t => t.status.includes('REWORK')).length}
                        </div>
                    </div>
                </div>

                {/* Advanced Progress bar */}
                <div className="mb-8 relative">
                    <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                        <div
                            className="bg-gradient-to-r from-indigo-500 to-violet-600 h-full rounded-full transition-all duration-1000 ease-out relative"
                            style={{ width: `${project.progress}%` }}
                        >
                            <div className="absolute top-0 right-0 bottom-0 w-8 bg-white/20 skew-x-[-20deg] animate-pulse"></div>
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="flex items-center justify-between gap-4">
                    <div className="flex -space-x-2">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-500">
                                {String.fromCharCode(64 + i)}
                            </div>
                        ))}
                        <div className="w-8 h-8 rounded-full border-2 border-white bg-indigo-50 flex items-center justify-center text-[10px] font-bold text-indigo-600">
                            +4
                        </div>
                    </div>

                    <div className="text-xs font-bold text-slate-400 tracking-widest uppercase">
                        Нажмите, чтобы открыть проект
                    </div>
                </div>
            </div>
        </div>
    );
};

const StatusRow = ({ label, count, total, color }) => (
    <div className="space-y-1">
        <div className="flex justify-between text-[11px] font-bold">
            <span className="text-slate-500">{label}</span>
            <span className="text-slate-700">{count}</span>
        </div>
        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
            <div className={`${color} h-full`} style={{ width: `${total > 0 ? (count / total) * 100 : 0}%` }}></div>
        </div>
    </div>
);

// --- Icons ---
const ChartIcon = () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z"></path></svg>;
const ReviewIcon = () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>;
const ReworkIcon = () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>;
const TaskIcon = () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path></svg>;

export default ManagementDashboard;
