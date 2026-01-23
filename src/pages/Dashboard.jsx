import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import api from '../api/client';
import TaskCard from '../components/TaskCard';
import EstimatorDashboard from './EstimatorDashboard';

const Dashboard = () => {
    const { user } = useAuth();
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchTasks = async () => {
            if (!user) return;
            // Estimators use their own dashboard component, so we don't need to fetch tasks here for them
            if (user.role === 'ESTIMATOR') {
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

    if (loading) {
        return <div className="text-center mt-8">Загрузка задач...</div>;
    }

    if (error) {
        return <div className="text-center mt-8 text-red-500">{error}</div>;
    }

    return (
        <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-6">Ваши задачи</h1>
            {tasks.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {tasks.map(task => (
                        <TaskCard key={task.id} task={task} userRole={user.role} />
                    ))}
                </div>
            ) : (
                <div className="text-center mt-8 bg-white p-8 rounded-lg shadow">
                    <h2 className="text-xl font-semibold text-gray-700">Нет доступных задач</h2>
                    <p className="text-gray-500 mt-2">На данный момент для вас нет назначенных задач.</p>
                </div>
            )}
        </div>
    );
};

export default Dashboard;
