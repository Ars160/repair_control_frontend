import { useState, useEffect, useMemo, Fragment } from 'react';
import api from '../api/client';
import { STATUSES } from '../utils/mockData';

const Analytics = () => {
    const [tasks, setTasks] = useState([]);
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedProjectId, setExpandedProjectId] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [t, p] = await Promise.all([
                    api.getTasks('SUPER_ADMIN'),
                    api.getProjects()
                ]);
                setTasks(t);
                setProjects(p);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const globalStats = useMemo(() => {
        const total = tasks.length;
        const completed = tasks.filter(t => t.status === STATUSES.COMPLETED).length;
        const inProgress = tasks.filter(t => t.status === STATUSES.ACTIVE || t.status.includes('REVIEW')).length;
        const delayed = tasks.filter(t => t.status.includes('REWORK')).length;
        const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

        return { total, completed, inProgress, delayed, completionRate };
    }, [tasks]);

    if (loading) return <div className="text-center py-20">Сбор аналитических данных...</div>;

    return (
        <div className="space-y-8 animate-fadeIn">
            <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 tracking-tight">Глобальная аналитика</h1>
                <p className="text-sm sm:text-base text-slate-500 mt-1">Анализ эффективности и прогресса по всем объектам.</p>
            </div>

            {/* Performance Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 card-premium p-6 sm:p-10 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50/50 rounded-full blur-3xl -mr-32 -mt-32 transition-transform group-hover:scale-110 duration-700"></div>
                    <div className="relative z-10">
                        <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-8 mb-10">
                            <div>
                                <h3 className="text-xl font-black text-slate-800 mb-2">Эффективность выполнения</h3>
                                <p className="text-sm text-slate-500 font-medium">Общий показатель прогресса по всем активным объектам в Байберге</p>
                            </div>
                            <div className="shrink-0 flex items-center justify-center">
                                <div className="w-24 h-24 sm:w-28 sm:h-28 relative">
                                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 112 112">
                                        <circle cx="56" cy="56" r="48" stroke="currentColor" strokeWidth="10" fill="transparent" className="text-slate-100" />
                                        <circle cx="56" cy="56" r="48" stroke="currentColor" strokeWidth="10" fill="transparent"
                                            strokeDasharray={301.6}
                                            strokeDashoffset={301.6 - (301.6 * globalStats.completionRate) / 100}
                                            className="text-indigo-600 transition-all duration-1000 ease-out"
                                            strokeLinecap="round"
                                        />
                                    </svg>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                        <span className="text-2xl font-black text-slate-800 leading-none">{globalStats.completionRate}%</span>
                                        <span className="text-[8px] font-bold text-slate-400 uppercase mt-1">Готово</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-8 pt-8 border-t border-slate-100">
                            <div className="space-y-1">
                                <div className="text-3xl font-black text-slate-800 tracking-tight">{globalStats.completed}</div>
                                <div className="text-[10px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                                    Завершено
                                </div>
                            </div>
                            <div className="space-y-1">
                                <div className="text-3xl font-black text-slate-800 tracking-tight">{globalStats.inProgress}</div>
                                <div className="text-[10px] font-black text-blue-500 uppercase tracking-widest flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                                    В работе
                                </div>
                            </div>
                            <div className="col-span-2 sm:col-span-1 space-y-1">
                                <div className="text-3xl font-black text-rose-500 tracking-tight">{globalStats.delayed}</div>
                                <div className="text-[10px] font-black text-rose-400 uppercase tracking-widest flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-pulse"></span>
                                    Доработки
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-slate-900 rounded-3xl p-8 sm:p-10 text-white shadow-2xl shadow-slate-900/20 relative overflow-hidden group">
                    <div className="absolute bottom-0 right-0 w-48 h-48 bg-indigo-500/20 rounded-full blur-3xl -mb-24 -mr-24 transition-transform group-hover:scale-150 duration-700"></div>
                    <div className="relative z-10 h-full flex flex-col">
                        <h3 className="text-lg font-bold text-indigo-300 mb-2 uppercase tracking-widest">Общая нагрузка</h3>
                        <div className="text-6xl sm:text-7xl font-black mb-6 tracking-tighter text-white">
                            {globalStats.total}
                            <span className="text-xl text-indigo-400 ml-2 uppercase font-black tracking-widest">Задач</span>
                        </div>
                        <p className="text-slate-400 text-sm font-medium mb-auto leading-relaxed">
                            Текущая загруженность ресурсов по всем строительным объектам компании.
                        </p>
                        <div className="mt-8 pt-8 border-t border-white/10 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-indigo-500/20 rounded-2xl flex items-center justify-center border border-indigo-500/30">
                                    <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>
                                </div>
                                <div>
                                    <div className="text-[10px] font-black uppercase tracking-widest text-slate-500">Динамика</div>
                                    <div className="text-sm font-bold text-indigo-400">+12% рост</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Project Performance Comparison */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-8 border-b border-slate-50">
                    <h3 className="text-lg font-bold text-slate-800">Сравнение объектов</h3>
                    <p className="text-sm text-slate-400 mt-1">Состояние дел по каждому активному проекту.</p>
                </div>
                <div className="hidden sm:block">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50/50 text-slate-500 text-[10px] uppercase font-bold tracking-widest">
                            <tr>
                                <th className="px-8 py-4">Проект</th>
                                <th className="px-8 py-4">Прогресс</th>
                                <th className="px-8 py-4">Чек-листы</th>
                                <th className="px-8 py-4">Задачи (Г / В / Д)</th>
                                <th className="px-8 py-4">Статус</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {projects.map(p => {
                                const pTasks = tasks.filter(t => String(t.projectName).includes(p.name));
                                const total = pTasks.length;
                                const comp = pTasks.filter(t => t.status === STATUSES.COMPLETED).length;
                                const prog = total > 0 ? Math.round((comp / total) * 100) : 0;
                                const inP = pTasks.filter(t => t.status === STATUSES.ACTIVE).length;
                                const rew = pTasks.filter(t => t.status.includes('REWORK')).length;

                                return (
                                    <Fragment key={p.id}>
                                        <tr onClick={() => setExpandedProjectId(expandedProjectId === p.id ? null : p.id)} className="hover:bg-slate-50/50 transition-colors group cursor-pointer border-b border-slate-50 last:border-0">
                                            <td className="px-8 py-7">
                                                <div className="flex items-center gap-3">
                                                    <div className={`transition-transform duration-300 ${expandedProjectId === p.id ? 'rotate-90' : ''}`}>
                                                        <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                                                    </div>
                                                    <div>
                                                        <div className="font-extrabold text-slate-800 group-hover:text-indigo-600 transition-colors tracking-tight">{p.name}</div>
                                                        <div className="text-[10px] font-black text-slate-400 mt-1 uppercase tracking-widest">ЛОКАЦИЙ: {p.subObjectCount || 0}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-7 w-1/4">
                                                <div className="flex items-center gap-4">
                                                    <div className="flex-1 bg-slate-100 h-3 rounded-full overflow-hidden">
                                                        <div className="bg-indigo-600 h-full rounded-full transition-all duration-700" style={{ width: `${prog}%` }}></div>
                                                    </div>
                                                    <span className="text-sm font-black text-slate-700">{prog}%</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-7 w-1/4">
                                                <div className="flex flex-col gap-1">
                                                    <div className="flex justify-between text-xs font-bold text-slate-500">
                                                        <span>{pTasks.reduce((acc, t) => acc + (t.checklist?.filter(i => i.isCompleted).length || 0), 0)} / {pTasks.reduce((acc, t) => acc + (t.checklist?.length || 0), 0)}</span>
                                                        <span>{Math.round((pTasks.reduce((acc, t) => acc + (t.checklist?.filter(i => i.isCompleted).length || 0), 0) / (pTasks.reduce((acc, t) => acc + (t.checklist?.length || 0), 0) || 1)) * 100)}%</span>
                                                    </div>
                                                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                                                        <div
                                                            className="bg-amber-500 h-full rounded-full transition-all duration-700"
                                                            style={{ width: `${Math.round((pTasks.reduce((acc, t) => acc + (t.checklist?.filter(i => i.isCompleted).length || 0), 0) / (pTasks.reduce((acc, t) => acc + (t.checklist?.length || 0), 0) || 1)) * 100)}%` }}
                                                        ></div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-2">
                                                    <span className="px-2 py-1 bg-emerald-50 text-emerald-600 rounded text-xs font-bold">{comp}</span>
                                                    <span className="px-2 py-1 bg-blue-50 text-blue-600 rounded text-xs font-bold">{inP}</span>
                                                    <span className="px-2 py-1 bg-rose-50 text-rose-600 rounded text-xs font-bold">{rew}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                {prog > 90 ? (
                                                    <span className="flex items-center gap-1.5 text-emerald-600 text-xs font-bold">
                                                        <span className="w-1.5 h-1.5 bg-emerald-600 rounded-full"></span> Почти готов
                                                    </span>
                                                ) : rew > 2 ? (
                                                    <span className="flex items-center gap-1.5 text-rose-500 text-xs font-bold">
                                                        <span className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-pulse"></span> Внимание
                                                    </span>
                                                ) : (
                                                    <span className="flex items-center gap-1.5 text-blue-500 text-xs font-bold">
                                                        <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span> В графике
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                        {expandedProjectId === p.id && (
                                            <tr className="bg-slate-50/50 animate-fadeIn">
                                                <td colSpan="5" className="px-8 py-6">
                                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                        {(() => {
                                                            const workerStats = {};
                                                            pTasks.forEach(t => {
                                                                const names = t.assigneeNames || [];
                                                                names.forEach(name => {
                                                                    if (!workerStats[name]) {
                                                                        workerStats[name] = { total: 0, active: 0, rework: 0, completed: 0 };
                                                                    }
                                                                    workerStats[name].total++;
                                                                    if (t.status === STATUSES.COMPLETED) workerStats[name].completed++;
                                                                    else if (t.status.includes('REWORK')) workerStats[name].rework++;
                                                                    else workerStats[name].active++;
                                                                });
                                                            });

                                                            if (Object.keys(workerStats).length === 0) {
                                                                return <div className="col-span-3 text-center py-4 text-slate-400 text-sm font-medium italic">Нет назначенных исполнителей</div>;
                                                            }

                                                            return Object.entries(workerStats).map(([name, stats]) => (
                                                                <div key={name} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-start justify-between">
                                                                    <div>
                                                                        <div className="font-bold text-slate-800 text-sm">{name}</div>
                                                                        <div className="mt-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                                                            <span className="text-blue-600">{stats.active} в работе</span>
                                                                            <span>•</span>
                                                                            <span className={`${stats.rework > 0 ? 'text-rose-600' : 'text-slate-400'}`}>{stats.rework} доработок</span>
                                                                        </div>
                                                                    </div>
                                                                    <div className="text-right">
                                                                        <div className="text-lg font-black text-indigo-600">{stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}%</div>
                                                                        <div className="text-[9px] text-slate-400 font-bold uppercase">Эфф.</div>
                                                                    </div>
                                                                </div>
                                                            ));
                                                        })()}
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </Fragment>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                <div className="sm:hidden divide-y divide-slate-100">
                    {projects.map(p => {
                        const pTasks = tasks.filter(t => String(t.projectName).includes(p.name));
                        const total = pTasks.length;
                        const comp = pTasks.filter(t => t.status === STATUSES.COMPLETED).length;
                        const prog = total > 0 ? Math.round((comp / total) * 100) : 0;
                        const inP = pTasks.filter(t => t.status === STATUSES.ACTIVE).length;
                        const rew = pTasks.filter(t => t.status.includes('REWORK')).length;

                        return (
                            <div key={p.id} className="p-5 space-y-4">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <div className="font-bold text-slate-800">{p.name}</div>
                                        <div className="text-[10px] text-slate-400 uppercase tracking-widest mt-0.5">ID: {p.id}</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-xl font-bold text-indigo-600">{prog}%</div>
                                        <div className="text-[9px] text-slate-400 font-bold uppercase">Общий прогресс</div>
                                    </div>
                                </div>
                                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                    <div className="bg-indigo-600 h-full rounded-full" style={{ width: `${prog}%` }}></div>
                                </div>
                                <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100">
                                    <div className="flex items-center gap-1.5">
                                        <span className="w-6 h-6 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center text-[10px] font-bold">{comp}</span>
                                        <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center text-[10px] font-bold">{inP}</span>
                                        <span className="w-6 h-6 bg-rose-100 text-rose-600 rounded-lg flex items-center justify-center text-[10px] font-bold">{rew}</span>
                                    </div>
                                    {prog > 90 ? (
                                        <span className="text-emerald-600 text-[10px] font-bold uppercase tracking-widest px-2 py-1 bg-emerald-50 rounded-lg">Завершается</span>
                                    ) : rew > 2 ? (
                                        <span className="text-rose-600 text-[10px] font-bold uppercase tracking-widest px-2 py-1 bg-rose-50 rounded-lg animate-pulse">Внимание</span>
                                    ) : (
                                        <span className="text-blue-600 text-[10px] font-bold uppercase tracking-widest px-2 py-1 bg-blue-50 rounded-lg">В работе</span>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default Analytics;
