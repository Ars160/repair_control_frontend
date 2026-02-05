import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import api from '../api/client';
import TaskCard from '../components/TaskCard';
import EstimatorDashboard from './EstimatorDashboard';
import ManagementDashboard from './ManagementDashboard';

const Dashboard = () => {
    const { user } = useAuth();
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [groupByTemplate, setGroupByTemplate] = useState(false);
    const [collapsedGroups, setCollapsedGroups] = useState({});

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
                const fetchedTasks = await api.getTasks(user.role, user.id);
                setTasks(fetchedTasks);
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

    const filterTabs = [
        { id: 'all', label: 'Все' },
        { id: 'in_progress', label: 'В работе' },
        { id: 'under_review', label: 'На проверке' },
        { id: 'rework_foreman', label: 'Доработка (Прораб)' },
        { id: 'rework_pm', label: 'Доработка (ПМ)' },
        { id: 'completed', label: 'Завершенные' },
    ];

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
                    return task.status === 'ACTIVE' || task.status === 'LOCKED';
                case 'under_review':
                    return task.status === 'UNDER_REVIEW_FOREMAN' || task.status === 'UNDER_REVIEW_PM';
                case 'rework_foreman':
                    return task.status === 'REWORK_FOREMAN';
                case 'rework_pm':
                    return task.status === 'REWORK_PM';
                case 'completed':
                    return task.status === 'COMPLETED';
                case 'all':
                default:
                    return true; // Show all tasks
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
                    return task.status === 'ACTIVE' || task.status === 'LOCKED';
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

    return (
        <div className="animate-fadeIn pb-20">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Ваши задачи</h1>

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
            <div className="flex overflow-x-auto pb-4 mb-4 gap-2 no-scrollbar">
                {filterTabs.map(tab => {
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

            {/* View Toggle */}
            <div className="flex justify-end mb-4">
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
            </div>

            {filteredTasks.length > 0 ? (
                groupByTemplate ? (
                    Object.entries(
                        filteredTasks.reduce((groups, task) => {
                            const groupName = task.templateName || 'Без шаблона (Общие)';
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
                                        <TaskCard key={task.id} task={task} userRole={user.role} />
                                    ))}
                                </div>
                            )}
                        </div>
                    ))
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredTasks.map(task => (
                            <TaskCard key={task.id} task={task} userRole={user.role} />
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
                    {(searchQuery || activeTab !== 'all') && (
                        <button
                            onClick={() => { setSearchQuery(''); setActiveTab('all'); }}
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
