import { useState, useEffect, useMemo } from 'react';
import api from '../api/client';
import { STATUSES } from '../utils/mockData';

const Analytics = () => {
    const [tasks, setTasks] = useState([]);
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);

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
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-sm relative overflow-hidden">
                    <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-6 mb-8">
                        <div>
                            <h3 className="text-lg font-bold text-slate-800 mb-1">Эффективность выполнения</h3>
                            <p className="text-sm text-slate-400">Средний процент завершения работ по компании</p>
                        </div>
                        <div className="shrink-0">
                            <div className="w-20 h-20 sm:w-24 sm:h-24 relative">
                                <svg className="w-full h-full transform -rotate-90">
                                    <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-indigo-50" />
                                    <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="transparent"
                                        strokeDasharray={251.2}
                                        strokeDashoffset={251.2 - (251.2 * globalStats.completionRate) / 100}
                                        className="text-indigo-600 transition-all duration-1000"
                                        strokeLinecap="round"
                                    />
                                </svg>
                                <div className="absolute inset-0 flex items-center justify-center text-lg sm:text-xl font-bold text-slate-800">
                                    {globalStats.completionRate}%
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 sm:gap-8 pt-6 border-t border-slate-50">
                        <div>
                            <div className="text-xl sm:text-2xl font-bold text-slate-800">{globalStats.completed}</div>
                            <div className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest">Завершено</div>
                        </div>
                        <div>
                            <div className="text-xl sm:text-2xl font-bold text-slate-800">{globalStats.inProgress}</div>
                            <div className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest">В работе</div>
                        </div>
                        <div className="col-span-2 sm:col-span-1 border-t sm:border-t-0 pt-4 sm:pt-0">
                            <div className="text-xl sm:text-2xl font-bold text-rose-500">{globalStats.delayed}</div>
                            <div className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest">Доработки</div>
                        </div>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-3xl p-8 text-white shadow-xl shadow-indigo-200">
                    <h3 className="text-lg font-bold mb-2">Общая нагрузка</h3>
                    <div className="text-5xl font-bold mb-6">{globalStats.total}</div>
                    <p className="text-indigo-100 text-sm mb-8 leading-relaxed">
                        Общее количество активных и запланированных задач на всех строительных площадках на текущий момент.
                    </p>
                    <div className="p-4 bg-white/10 rounded-2xl flex items-center gap-4">
                        <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>
                        </div>
                        <div>
                            <div className="text-xs font-bold uppercase tracking-wider opacity-60">Тренды</div>
                            <div className="text-sm font-bold">+12% к прошлой неделе</div>
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
                                    <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-8 py-6">
                                            <div className="font-bold text-slate-800">{p.name}</div>
                                            <div className="text-xs text-slate-400 mt-0.5">{p.id} ID</div>
                                        </td>
                                        <td className="px-8 py-6 w-1/4">
                                            <div className="flex items-center gap-3">
                                                <div className="flex-1 bg-slate-100 h-2 rounded-full overflow-hidden">
                                                    <div className="bg-indigo-600 h-full rounded-full" style={{ width: `${prog}%` }}></div>
                                                </div>
                                                <span className="text-xs font-bold text-slate-600">{prog}%</span>
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
