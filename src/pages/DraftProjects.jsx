import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../hooks/useAuth';

const DraftProjects = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [drafts, setDrafts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchDrafts = async () => {
            try {
                setLoading(true);
                const projects = await api.getProjects();
                setDrafts(projects.filter(p => p.status === 'DRAFT'));
            } catch (err) {
                console.error("Fetch drafts error", err);
                setError("Не удалось загрузить черновики.");
            } finally {
                setLoading(false);
            }
        };
        fetchDrafts();
    }, []);

    if (loading) return <div className="text-center py-20">Загрузка черновиков...</div>;
    if (error) return <div className="text-center py-20 text-red-500">{error}</div>;

    return (
        <div className="space-y-8 pb-20 animate-fadeIn">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 tracking-tight">Управление черновиками</h1>
                    <p className="text-sm text-slate-500 mt-1">Проекты на стадии подготовки. Не видны рабочим.</p>
                </div>
                <button
                    onClick={() => navigate(-1)}
                    className="px-4 py-2 text-slate-500 hover:text-slate-800 font-semibold flex items-center gap-2 transition-colors"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                    Назад
                </button>
            </div>

            {drafts.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                        </svg>
                    </div>
                    <h2 className="text-xl font-bold text-slate-700">Нет активных черновиков</h2>
                    <p className="text-slate-400 mt-2">Все ваши проекты опубликованы или еще не созданы.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-6">
                    {drafts.map(project => (
                        <DraftProjectCard key={project.id} project={project} />
                    ))}
                </div>
            )}
        </div>
    );
};

const DraftProjectCard = ({ project }) => {
    const navigate = useNavigate();
    const [objects, setObjects] = useState([]);
    const [expanded, setExpanded] = useState(false);

    useEffect(() => {
        if (expanded) {
            // In a real app, fetch object details with tasks
            // For now, we assume the project object contains them if fetched via detailed API
            // Or we fetch them here
            api.getObjectsByProject(project.id).then(setObjects);
        }
    }, [expanded, project.id]);

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:border-indigo-100 transition-colors">
            <div className="p-6">
                <div className="flex justify-between items-start">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-slate-800">{project.name}</h3>
                            <p className="text-xs text-slate-400 mt-0.5">Создан: {new Date(project.createdAt || Date.now()).toLocaleDateString()}</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setExpanded(!expanded)}
                            className="px-3 py-1.5 text-xs font-bold text-slate-500 hover:bg-slate-50 rounded-lg transition-colors border border-slate-100"
                        >
                            {expanded ? 'Свернуть' : 'Просмотреть структуру'}
                        </button>
                        <button
                            onClick={() => navigate(`/project/${project.id}`)}
                            className="px-4 py-1.5 text-xs font-bold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                        >
                            Перейти к проекту
                        </button>
                    </div>
                </div>

                {expanded && (
                    <div className="mt-6 pt-6 border-t border-slate-50 space-y-4 animate-slideDown">
                        {objects.length === 0 ? (
                            <p className="text-center text-sm text-slate-400 py-4 italic">В проекте пока нет объектов...</p>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {objects.map(obj => (
                                    <div key={obj.id} className="bg-slate-50/50 rounded-xl p-4 border border-slate-100">
                                        <h4 className="font-bold text-slate-700 text-sm mb-2">{obj.name}</h4>
                                        <div className="space-y-1">
                                            {obj.subObjects && obj.subObjects.map(sub => (
                                                <div key={sub.id} className="flex justify-between items-center bg-white px-3 py-2 rounded-lg text-[11px] border border-slate-100/50">
                                                    <span className="text-slate-600 font-medium">{sub.name}</span>
                                                    <span className={`px-1.5 py-0.5 rounded-full ${sub.workers?.length > 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                                        {sub.workers?.length > 0 ? 'Назначен' : 'Без рабочих'}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default DraftProjects;
