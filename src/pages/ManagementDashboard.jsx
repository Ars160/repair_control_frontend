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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Общий прогресс"
                    value={`${stats.progress}%`}
                    subtitle="Все проекты"
                    icon={<ChartIcon />}
                    color="indigo"
                />
                <StatCard
                    title="На проверке ПМ"
                    value={stats.pendingPM}
                    subtitle="Требуют внимания"
                    icon={<ReviewIcon />}
                    color="amber"
                    pulse={stats.pendingPM > 0}
                />
                <StatCard
                    title="Доработки"
                    value={stats.rework}
                    subtitle="Исправляются"
                    icon={<ReworkIcon />}
                    color="rose"
                />
                <StatCard
                    title="Всего задач"
                    value={stats.total}
                    subtitle="По всем объектам"
                    icon={<TaskIcon />}
                    color="slate"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Project List */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex justify-between items-end">
                        <h2 className="text-xl font-bold text-slate-800">Активные проекты</h2>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                        {projectAnalytics.map(project => (
                            <ProjectCard key={project.id} project={project} />
                        ))}
                    </div>
                </div>

                {/* Sidebar: Reviews/Activity */}
                <div className="space-y-8">
                    {/* Review Queue */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                        <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center justify-between">
                            Очередь проверки
                            {stats.pendingPM > 0 && (
                                <span className="bg-amber-100 text-amber-600 text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider">Срочно</span>
                            )}
                        </h2>

                        <div className="space-y-3">
                            {urgentTasks.length > 0 ? (
                                urgentTasks.map(task => (
                                    <div
                                        key={task.id}
                                        onClick={() => navigate(`/review/${task.id}`)}
                                        className="p-3 bg-slate-50 hover:bg-indigo-50 rounded-xl border border-transparent hover:border-indigo-100 cursor-pointer transition-all group"
                                    >
                                        <div className="flex justify-between items-start mb-1">
                                            <h4 className="text-sm font-semibold text-slate-700 group-hover:text-indigo-600 transition-colors line-clamp-1">{task.title}</h4>
                                            <span className="text-[10px] text-slate-400">{new Date(task.deadline).toLocaleDateString()}</span>
                                        </div>
                                        <p className="text-[10px] text-slate-500 uppercase tracking-tight">{task.objectName}</p>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-10">
                                    <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
                                        <svg className="w-6 h-6 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                                    </div>
                                    <p className="text-sm text-slate-400">Нет задач на проверку</p>
                                </div>
                            )}
                        </div>

                        {stats.pendingPM > 5 && (
                            <button className="w-full mt-4 py-2 text-xs font-semibold text-indigo-600 hover:text-indigo-700 text-center">
                                Показать все ({stats.pendingPM})
                            </button>
                        )}
                    </div>

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
        <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow relative overflow-hidden">
            {pulse && <div className="absolute top-3 right-3 w-2 h-2 bg-amber-500 rounded-full animate-ping"></div>}
            <div className="flex items-center gap-3 sm:gap-4">
                <div className={`p-2.5 sm:p-3 rounded-xl ${colorClasses[color]}`}>
                    {icon}
                </div>
                <div>
                    <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{title}</h3>
                    <div className="flex items-baseline gap-2">
                        <span className="text-xl sm:text-2xl font-bold text-slate-800">{value}</span>
                        <span className="text-[9px] sm:text-[10px] text-slate-400 font-medium">{subtitle}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

const ProjectCard = ({ project }) => {
    const navigate = useNavigate();

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-all">
            <div className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
                    <div className="flex items-center gap-3 sm:gap-4">
                        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                            <svg className="w-6 h-6 sm:w-7 sm:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
                            </svg>
                        </div>
                        <div>
                            <h3 className="text-lg sm:text-xl font-bold text-slate-800 line-clamp-1">{project.name}</h3>
                            <p className="text-xs sm:text-sm text-slate-500 mt-0.5 line-clamp-1">{project.description || 'Проект строительных работ'}</p>
                        </div>
                    </div>
                    <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 pt-3 sm:pt-0">
                        <div className="text-2xl sm:text-3xl font-bold text-indigo-600">{project.progress}%</div>
                        <div className="text-[10px] text-slate-400 uppercase font-bold">Готово</div>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="text-center p-3 bg-slate-50 rounded-lg">
                        <div className="text-lg font-bold text-slate-800">{project.total}</div>
                        <div className="text-[10px] uppercase font-bold text-slate-500">Всего</div>
                    </div>
                    <div className="text-center p-3 bg-emerald-50 rounded-lg">
                        <div className="text-lg font-bold text-emerald-600">{project.completed}</div>
                        <div className="text-[10px] uppercase font-bold text-emerald-700">Готово</div>
                    </div>
                    <div className="text-center p-3 bg-rose-50 rounded-lg">
                        <div className="text-lg font-bold text-rose-600">
                            {project.tasks.filter(t => t.status.includes('REWORK')).length}
                        </div>
                        <div className="text-[10px] uppercase font-bold text-rose-700">Доработки</div>
                    </div>
                </div>

                {/* Progress bar */}
                <div className="mb-4">
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div
                            className="bg-indigo-600 h-full rounded-full transition-all duration-1000"
                            style={{ width: `${project.progress}%` }}
                        ></div>
                    </div>
                </div>

                {/* Action button */}
                <button
                    onClick={() => navigate(`/project/${project.id}`)}
                    className="w-full px-4 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
                >
                    Подробнее
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                    </svg>
                </button>
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
