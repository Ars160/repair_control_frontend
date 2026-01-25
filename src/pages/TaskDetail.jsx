// src/pages/TaskDetail.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import api from '../api/client';
import { STATUSES, ROLES } from '../utils/mockData';
import ChecklistItem from '../components/ChecklistItem';

// Helper to translate status to Russian
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

const TaskDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [task, setTask] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Form state for worker submission
    const [checklist, setChecklist] = useState([]);
    const [photos, setPhotos] = useState([]);
    const [comment, setComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const fetchTask = async () => {
            try {
                setLoading(true);
                const fetchedTask = await api.getTaskById(id);
                if (fetchedTask) {
                    setTask(fetchedTask);
                    setChecklist(fetchedTask.checklist || []);
                    // If task is in rework, pre-fill comment
                    if (fetchedTask.status === STATUSES.REWORK) {
                        setComment(fetchedTask.submission?.comment || '');
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
    }, [id]);

    const handleChecklistToggle = (itemId) => {
        setChecklist(prev =>
            prev.map(item =>
                item.id === itemId ? { ...item, completed: !item.completed } : item
            )
        );
    };

    // Old photo handler removed in favor of inline grid handler


    const handleSubmit = async (e) => {
        e.preventDefault();

        if (photos.length === 0) {
            alert('Пожалуйста, добавьте хотя бы одно фото.');
            return;
        }

        setIsSubmitting(true);
        const result = await api.submitTaskReview(id, {
            checklist,
            photos, // Pass File objects directly
            comment,
        });

        setIsSubmitting(false);
        if (result.success) {
            alert('Отчет успешно отправлен на проверку.');
            navigate('/dashboard');
        } else {
            setError(result.message || 'Не удалось отправить отчет.');
        }
    };

    // Determine if the form should be editable
    const isEditable = user?.role === ROLES.WORKER && (task?.status === STATUSES.ACTIVE || task?.status === STATUSES.REWORK);

    if (loading) return <div className="text-center mt-8">Загрузка задачи...</div>;
    if (error) return <div className="text-center mt-8 text-red-500">{error}</div>;
    if (!task) return null;

    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-20">
            {/* Task Info Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-bl-full -mr-8 -mt-8 z-0"></div>

                <div className="relative z-10">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-indigo-50 text-indigo-700 mb-2">
                                {task.projectName || 'Проект не указан'}
                            </span>
                            <h1 className="text-3xl font-bold text-slate-900">{task.title}</h1>
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
                                    <p className="text-sm font-semibold text-slate-800 capitalize">Medium</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Rework message */}
            {(task.status === STATUSES.REWORK || task.status === STATUSES.UNDER_REVIEW_FOREMAN) && task.rejectionReason && (
                <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div className="ml-3">
                            <h3 className="text-sm font-medium text-red-800">Замечания к доработке</h3>
                            <div className="mt-2 text-sm text-red-700">
                                <p>{task.rejectionReason}</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <form onSubmit={handleSubmit}>
                <div className="mb-6">
                    <h2 className="text-xl font-semibold text-gray-700 mb-3">Чек-лист</h2>
                    <div className="space-y-2">
                        {checklist.map(item => (
                            <ChecklistItem
                                key={item.id}
                                item={item}
                                isEditable={isEditable}
                                onToggle={isEditable ? handleChecklistToggle : () => { }}
                            />
                        ))}
                    </div>
                </div>

                {isEditable && (
                    <div className="border-t pt-6">
                        <h2 className="text-xl font-semibold text-gray-700 mb-3">Отправить отчет</h2>

                        <label className="block text-sm font-medium text-gray-700 mb-3">
                            Фотографии (Обязательно 1-3 фото)
                        </label>

                        {/* Hidden Input for adding files */}
                        <input
                            type="file"
                            id="photo-upload"
                            multiple
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                                if (e.target.files && e.target.files.length > 0) {
                                    const newFiles = Array.from(e.target.files);
                                    setPhotos(prev => {
                                        const combined = [...prev, ...newFiles];
                                        return combined.slice(0, 3); // Limit to 3 max
                                    });
                                }
                                e.target.value = ''; // Reset
                            }}
                        />

                        <div className="grid grid-cols-3 gap-4 mb-2">
                            {[0, 1, 2].map((index) => {
                                const isFilled = index < photos.length;
                                // Allow clicking if slot is empty (regardless of order, though we fill sequentially)
                                // Actually, simpler: if not filled, clicking triggers input which appends.

                                return (
                                    <div key={index} className="aspect-square relative flex flex-col items-center justify-center">
                                        {isFilled ? (
                                            <div className="relative w-full h-full group animate-fadeIn">
                                                <img
                                                    src={URL.createObjectURL(photos[index])}
                                                    alt={`preview ${index}`}
                                                    className="w-full h-full object-cover rounded-xl shadow-md border border-gray-200"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setPhotos(photos.filter((_, i) => i !== index))}
                                                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-lg hover:bg-red-600 transition-transform transform hover:scale-110 z-10"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                                    </svg>
                                                </button>
                                            </div>
                                        ) : (
                                            <div
                                                onClick={() => {
                                                    // Trigger upload if we haven't reached limit
                                                    if (photos.length < 3) {
                                                        document.getElementById('photo-upload').click();
                                                    }
                                                }}
                                                className={`w-full h-full rounded-xl border-2 border-dashed flex flex-col items-center justify-center transition-all duration-200
                                                    ${photos.length < 3
                                                        ? 'border-indigo-300 bg-indigo-50/50 hover:bg-indigo-50 hover:border-indigo-400 text-indigo-500 cursor-pointer hover:shadow-sm'
                                                        : 'border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed opacity-50'
                                                    }`}
                                            >
                                                {photos.length < 3 ? (
                                                    <>
                                                        <div className="bg-white p-2 rounded-full shadow-sm mb-2 group-hover:scale-110 transition-transform">
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                                            </svg>
                                                        </div>
                                                        <span className="text-xs font-medium">Фото {index + 1}</span>
                                                    </>
                                                ) : (
                                                    <span className="text-xs text-gray-400">Пусто</span>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                        <p className="text-xs text-secondary-500 mb-6 text-center">
                            Можно выбрать сразу несколько файлов
                        </p>

                        <div className="mb-4">
                            <label htmlFor="comment" className="block text-sm font-medium text-gray-700">
                                Комментарий (опционально)
                            </label>
                            <textarea
                                id="comment"
                                rows="4"
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            ></textarea>
                        </div>

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full sm:w-auto px-6 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-300"
                        >
                            {isSubmitting ? 'Отправка...' : 'Отправить на проверку'}
                        </button>
                    </div>
                )}
            </form>

            {/* Display previous submission if not editable */}
            {!isEditable && task.submission && (
                <div className="border-t pt-6 mt-6">
                    <h2 className="text-xl font-semibold text-gray-700 mb-3">Данные последнего отчета</h2>
                    <div className="mb-4">
                        <h3 className="text-sm font-medium text-gray-700">Комментарий</h3>
                        <p className="mt-1 text-sm text-gray-600 bg-gray-50 p-3 rounded-md">{task.submission.comment || 'Нет комментария'}</p>
                    </div>
                    <div>
                        <h3 className="text-sm font-medium text-gray-700">Приложенные фото</h3>
                        <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-4">
                            {task.submission.photos.map((photo, index) => (
                                <img key={index} src={photo} alt={`submission photo ${index + 1}`} className="rounded-lg object-cover w-full h-32" />
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TaskDetail;
