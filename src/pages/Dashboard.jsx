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
        <div className="animate-fadeIn">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6">Ваши задачи</h1>
            {tasks.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {tasks.map(task => (
                        <TaskCard key={task.id} task={task} userRole={user.role} />
                    ))}
                </div>
            ) : (
                <div className="text-center mt-8 bg-white p-6 sm:p-12 rounded-2xl shadow-sm border border-slate-100 italic">
                    <h2 className="text-lg font-bold text-slate-700">Нет доступных задач</h2>
                    <p className="text-sm text-slate-400 mt-2">На данный момент для вас нет назначенных задач.</p>
                </div>
            )}
        </div>
    );
};

export default Dashboard;
