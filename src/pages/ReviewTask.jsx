// src/pages/ReviewTask.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import api from '../api/client';
import { STATUSES, ROLES } from '../utils/mockData';
import ChecklistItem from '../components/ChecklistItem';

const ReviewTask = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [task, setTask] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);

    // State for rejection
    const [showRejectionForm, setShowRejectionForm] = useState(false);
    const [rejectionComment, setRejectionComment] = useState('');

    useEffect(() => {
        const fetchTask = async () => {
            try {
                setLoading(true);
                const fetchedTask = await api.getTaskById(id);
                if (fetchedTask) {
                    // Ensure the user is authorized to review this task
                    if ((user.role === ROLES.FOREMAN && fetchedTask.status !== STATUSES.UNDER_REVIEW_FOREMAN) ||
                        (user.role === ROLES.PM && fetchedTask.status !== STATUSES.UNDER_REVIEW_PM)) {
                        setError('У вас нет прав на просмотр этой задачи на данном этапе.');
                    } else {
                        setTask(fetchedTask);
                    }
                } else {
                    setError('Задача не найдена.');
                }
            } catch (err) {
                setError('Не удалось загрузить задачу.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchTask();
    }, [id, user.role]);

    const handleApprove = async () => {
        setIsProcessing(true);
        let nextStatus;
        if (user.role === ROLES.FOREMAN) {
            nextStatus = STATUSES.UNDER_REVIEW_PM;
        } else if (user.role === ROLES.PM) {
            nextStatus = STATUSES.COMPLETED;
        }

        if (nextStatus) {
            const result = await api.updateTaskStatus(id, nextStatus);
            if (result.success) {
                alert('Задача одобрена.');
                navigate('/dashboard');
            } else {
                setError(result.message || 'Не удалось обновить статус задачи.');
            }
        }
        setIsProcessing(false);
    };

    const handleReject = async () => {
        if (!rejectionComment) {
            alert('Пожалуйста, укажите причину доработки.');
            return;
        }
        setIsProcessing(true);
        const result = await api.updateTaskStatus(id, STATUSES.REWORK, rejectionComment);
        if (result.success) {
            alert('Задача возвращена на доработку.');
            navigate('/dashboard');
        } else {
            setError(result.message || 'Не удалось вернуть задачу.');
        }
        setIsProcessing(false);
    };

    const translateStatus = (status) => {
        const translations = {
            [STATUSES.LOCKED]: 'Заблокировано',
            [STATUSES.ACTIVE]: 'Активно',
            [STATUSES.UNDER_REVIEW_FOREMAN]: 'На проверке у прораба',
            [STATUSES.UNDER_REVIEW_PM]: 'На проверке у ПМ',
            [STATUSES.REWORK]: 'Доработка',
            [STATUSES.COMPLETED]: 'Завершено',
        };
        return translations[status] || status;
    };

    if (loading) return <div className="text-center mt-8">Загрузка задачи...</div>;
    if (error) return <div className="text-center mt-8 text-red-500">{error}</div>;
    if (!task) return null;

    return (
        <div className="max-w-6xl mx-auto space-y-6 pb-20">
            {/* Task Info Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-bl-full -mr-8 -mt-8 z-0"></div>

                <div className="relative z-10">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-indigo-50 text-indigo-700 mb-2">
                                {task.projectName || 'Проект не указан'}
                            </span>
                            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
                                {task.title}
                                <span className="text-sm font-normal text-slate-400 border border-slate-200 rounded px-2 py-0.5">
                                    Проверка
                                </span>
                            </h1>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase ${task.status === STATUSES.COMPLETED ? 'bg-green-100 text-green-700' :
                            task.status === STATUSES.ACTIVE ? 'bg-blue-100 text-blue-700' :
                                task.status === STATUSES.REWORK ? 'bg-red-100 text-red-700' :
                                    'bg-gray-100 text-gray-700'
                            }`}>
                            {translateStatus(task.status)}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                        <div className="flex items-start">
                            <div className="flex-shrink-0 bg-slate-100 rounded-lg p-2 text-slate-500">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-slate-500">Локация</p>
                                <p className="text-base font-semibold text-slate-800">{task.objectName}</p>
                                {task.objectAddress && (
                                    <p className="text-sm text-slate-500">{task.objectAddress}</p>
                                )}
                                <p className="text-sm text-indigo-600 mt-1">{task.subObjectName}</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center">
                                <svg className="w-5 h-5 text-slate-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                                <div>
                                    <p className="text-xs text-slate-500 font-medium uppercase">Дедлайн</p>
                                    <p className="text-sm font-semibold text-slate-800">{new Date(task.deadline).toLocaleDateString()}</p>
                                </div>
                            </div>
                            <div className="flex items-center">
                                <svg className="w-5 h-5 text-slate-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                                <div>
                                    <p className="text-xs text-slate-500 font-medium uppercase">Приоритет</p>
                                    <p className={`text-sm font-semibold capitalize ${task.priority === 'HIGH' ? 'text-red-600' :
                                        task.priority === 'LOW' ? 'text-green-600' :
                                            'text-yellow-600'
                                        }`}>
                                        {task.priority === 'HIGH' ? 'Высокий' : task.priority === 'LOW' ? 'Низкий' : 'Средний'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left side: submission details */}
                <div>
                    <div className="mb-6">
                        <h2 className="text-xl font-semibold text-gray-700 mb-3">Чек-лист отчета</h2>
                        <div className="space-y-2 bg-gray-50 p-3 rounded-md">
                            {task.checklist.map(item => (
                                <ChecklistItem
                                    key={item.id}
                                    item={item}
                                    isEditable={false}
                                />
                            ))}
                        </div>
                    </div>
                    <div className="mb-6">
                        <h3 className="text-lg font-medium text-gray-700">Комментарий исполнителя</h3>
                        {task.submission?.authorName && (
                            <p className="text-sm font-semibold text-indigo-600 mb-2">От: {task.submission.authorName}</p>
                        )}
                        <p className="mt-1 text-sm text-gray-600 bg-gray-50 p-3 rounded-md min-h-[50px]">
                            {task.submission?.comment || 'Нет комментария'}
                        </p>
                    </div>
                    <div>
                        <h3 className="text-lg font-medium text-gray-700">Приложенные фото</h3>
                        <div className="mt-2 grid grid-cols-2 gap-4">
                            {task.submission?.photos.map((photo, index) => (
                                <a key={index} href={photo} target="_blank" rel="noopener noreferrer">
                                    <img src={photo} alt={`submission photo ${index + 1}`} className="rounded-lg object-cover w-full h-32 hover:opacity-80 transition" />
                                </a>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Rejection Note for Foreman */}
                {task.rejectionReason && (
                    <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className="ml-3">
                                <h3 className="text-sm font-medium text-red-800">
                                    Задача возвращена на доработку/проверку
                                </h3>
                                <div className="mt-2 text-sm text-red-700">
                                    <p>{task.rejectionReason}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Right side: actions */}
                <div className="bg-gray-50 p-6 rounded-lg">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">Действия</h2>

                    {!showRejectionForm ? (
                        <div className="space-y-4">
                            <button
                                onClick={handleApprove}
                                disabled={isProcessing}
                                className="w-full px-6 py-3 text-base font-medium text-white bg-green-600 border border-transparent rounded-md shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-green-300"
                            >
                                {isProcessing ? 'Обработка...' : 'Принять'}
                            </button>
                            <button
                                onClick={() => setShowRejectionForm(true)}
                                disabled={isProcessing}
                                className="w-full px-6 py-3 text-base font-medium text-white bg-red-600 border border-transparent rounded-md shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:bg-red-300"
                            >
                                Вернуть на доработку
                            </button>
                        </div>
                    ) : (
                        <div>
                            <h3 className="text-lg font-medium text-gray-700 mb-2">Причина возврата</h3>
                            <textarea
                                value={rejectionComment}
                                onChange={(e) => setRejectionComment(e.target.value)}
                                rows="5"
                                className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                placeholder="Опишите, что необходимо исправить..."
                            ></textarea>
                            <div className="mt-4 flex flex-col sm:flex-row gap-2">
                                <button
                                    onClick={handleReject}
                                    disabled={isProcessing || !rejectionComment}
                                    className="w-full px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md shadow-sm hover:bg-red-700 disabled:bg-red-300"
                                >
                                    {isProcessing ? 'Отправка...' : 'Отправить на доработку'}
                                </button>
                                <button
                                    onClick={() => setShowRejectionForm(false)}
                                    disabled={isProcessing}
                                    className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50"
                                >
                                    Отмена
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ReviewTask;
