// src/pages/TaskDetail.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import api from '../api/client';
import { STATUSES, ROLES } from '../utils/mockData';
import ChecklistSection from '../components/ChecklistSection';
import PhotoUpload from '../components/PhotoUpload';
import ApprovalHistory from '../components/ApprovalHistory';

// Helper to translate status to Russian
const translateStatus = (status) => {
    const translations = {
        [STATUSES.LOCKED]: 'Заблокировано',
        [STATUSES.ACTIVE]: 'Активно',
        [STATUSES.UNDER_REVIEW_FOREMAN]: 'На проверке у прораба',
        [STATUSES.UNDER_REVIEW_PM]: 'На проверке у ПМ',
        [STATUSES.REWORK]: 'Доработка',
        [STATUSES.REWORK_FOREMAN]: 'Доработка (от Прораба)',
        [STATUSES.REWORK_PM]: 'Вернуто ПМ',
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

    const fetchTask = async () => {
        try {
            setLoading(true);
            const fetchedTask = await api.getTaskById(id);
            if (fetchedTask) {
                setTask(fetchedTask);
                // If task is in rework, pre-fill comment
                if (fetchedTask.status === STATUSES.REWORK_FOREMAN || fetchedTask.status === STATUSES.REWORK_PM) {
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

    useEffect(() => {
        fetchTask();
    }, [id]);

    // Redirect Foreman to Review Page if task is under review
    // Redirect Foreman to Review Page if task is under review or returned by PM
    useEffect(() => {
        if (task && user?.role === ROLES.FOREMAN && (task.status === STATUSES.UNDER_REVIEW_FOREMAN || task.status === STATUSES.REWORK_PM)) {
            navigate(`/review/${id}`, { replace: true });
        }
    }, [task, user, id, navigate]);

    const handleFinalPhotoChange = async (base64) => {
        const result = await api.updateTaskFinalPhoto(id, base64);
        if (result.success) {
            setTask(prev => ({ ...prev, finalPhotoUrl: base64 }));
        } else {
            alert('Не удалось загрузить фото: ' + (result.message || 'Неизвестная ошибка'));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validation: All checklists must be completed and have required photos
        if (incompleteChecklist.length > 0) {
            alert(`Пожалуйста, выполните все пункты чек-листа. Осталось: ${incompleteChecklist.length}`);
            return;
        }

        // Final photo check (Strict for NON-Workers)
        if (!isMqWorker && !task.finalPhotoUrl) {
            alert('Пожалуйста, загрузите финальное фото результата.');
            return;
        }

        setIsSubmitting(true);
        setError(null); // Clear previous errors

        console.log('Submitting task review for ID:', id);
        const result = await api.submitTaskReview(id, {
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

    const isEditable = (
        (user?.role === ROLES.WORKER && (task?.status === STATUSES.ACTIVE || task?.status === STATUSES.REWORK_FOREMAN)) ||
        (user?.role === ROLES.FOREMAN && (task?.status === STATUSES.ACTIVE || task?.status === STATUSES.REWORK_FOREMAN || task?.status === STATUSES.REWORK_PM))
    );

    if (loading) return <div className="text-center py-20">Загрузка задачи...</div>;
    if (error) return <div className="text-center py-20 text-red-500">{error}</div>;
    if (!task) return null;

    // Validation Logic
    const isMqWorker = user?.role === ROLES.WORKER;

    const incompleteChecklist = task?.checklist?.filter(item => {
        // Common: Must be marked completed
        if (!item.isCompleted) return true;

        // Worker: Photo not required for submission
        if (isMqWorker) return false;

        // Foreman/Others: Photo required if flagged
        return item.isPhotoRequired && !item.photoUrl;
    }) || [];

    const isChecklistComplete = incompleteChecklist.length === 0;

    const isFinalPhotoUploaded = !!task.finalPhotoUrl;

    // Worker can submit without final photo and without item photos
    const isReadyToSubmit = isMqWorker
        ? isChecklistComplete // Workers only need to check the boxes
        : isChecklistComplete && isFinalPhotoUploaded; // Foremen need photos + final result

    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-20">
            {/* Task Info Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 sm:p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 sm:w-32 sm:h-32 bg-indigo-50 rounded-bl-full -mr-6 -mt-6 sm:-mr-8 sm:-mt-8 z-0"></div>

                <div className="relative z-10">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-4">
                        <div>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-indigo-50 text-indigo-700 mb-2 uppercase tracking-wider">
                                {task.projectName || 'Проект не указан'}
                            </span>
                            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 leading-tight">{task.title}</h1>
                        </div>
                        <div className={`self-start px-3 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase ${task.status === STATUSES.COMPLETED ? 'bg-green-100 text-green-700' :
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

            {/* Locked Task Banner for Workers */}
            {task.status === STATUSES.LOCKED && user?.role === ROLES.WORKER && (
                <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded-r-xl animate-pulse">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m0 0v2m0-2h2m-2 0H10m10-5a9 9 0 11-18 0 9 9 0 0118 0zM12 9v2m0-2h.01"></path></svg>
                        </div>
                        <div className="ml-3">
                            <h3 className="text-sm font-bold text-amber-800 uppercase tracking-tight">Задача заблокирована</h3>
                            <p className="text-xs text-amber-700 mt-1 font-medium italic">
                                Ожидание завершения предыдущих этапов. Сейчас доступен только просмотр для планирования работ.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* History/Notes */}
            <ApprovalHistory approvals={task.approvals} />

            {(task.rejectionReason || task.foremanNote) && (
                <div className="space-y-4 mb-6">
                    {task.rejectionReason && (
                        <div className="bg-red-50 border-l-4 border-red-400 p-4">
                            <div className="flex">
                                <div className="flex-shrink-0">
                                    <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <div className="ml-3">
                                    <h3 className="text-sm font-medium text-red-800">
                                        {task.status === STATUSES.UNDER_REVIEW_FOREMAN ? 'Замечания к проверке' : 'Задача возвращена на доработку'}
                                    </h3>
                                    <div className="mt-2 text-sm text-red-700">
                                        <p className="font-semibold mb-1">
                                            {task.rejectedByFullName ? `Автор: ${task.rejectedByFullName}` : ''}
                                        </p>
                                        <p>{task.rejectionReason}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {task.foremanNote && (
                        <div className="bg-indigo-50 border-l-4 border-indigo-400 p-4">
                            <div className="flex">
                                <div className="flex-shrink-0">
                                    <svg className="h-5 w-5 text-indigo-400" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <div className="ml-3">
                                    <h3 className="text-sm font-medium text-indigo-800">Пояснение от Прораба (Исправлено)</h3>
                                    <div className="mt-2 text-sm text-indigo-700 italic">
                                        <p>"{task.foremanNote}"</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            <div className="space-y-8">
                {/* Checklist Section */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 sm:p-6">
                    <ChecklistSection
                        taskId={id}
                        checklists={task.checklist}
                        readOnly={!isEditable}
                        onUpdate={fetchTask}
                    />
                </div>

                {/* Final Submission Section */}
                {(isEditable || task.finalPhotoUrl) && (
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 sm:p-6">
                        <h2 className="text-lg sm:text-xl font-bold text-slate-800 mb-4">Финальный результат</h2>

                        <div className="space-y-6">
                            {isEditable ? (
                                <div className={`mt-2 p-4 rounded-xl border-2 transition-all ${isChecklistComplete ? 'bg-indigo-50 border-indigo-100' : 'bg-slate-50 border-slate-100 opacity-60'}`}>
                                    <h3 className="text-sm font-bold text-slate-800 mb-3 flex flex-col sm:flex-row sm:items-center gap-2">
                                        <div className="flex items-center gap-2">
                                            <span className="w-1.5 h-4 bg-indigo-500 rounded-full"></span>
                                            Общее фото результата
                                        </div>
                                        {!isChecklistComplete && (
                                            <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full sm:ml-auto animate-pulse self-start sm:self-auto">
                                                Завершите чек-лист для разблокировки
                                            </span>
                                        )}
                                    </h3>
                                    <PhotoUpload
                                        currentPhoto={task.finalPhotoUrl}
                                        onPhotoChange={handleFinalPhotoChange}
                                        disabled={!isChecklistComplete || loading}
                                        label={isChecklistComplete ? "Загрузите финальное фото" : "Доступно после выполнения всех пунктов чек-листа"}
                                    />
                                </div>
                            ) : (
                                task.finalPhotoUrl && (
                                    <div className="mt-2 p-4 bg-slate-50 rounded-xl border border-slate-100">
                                        <label className="block text-xs font-bold text-slate-400 mb-3 uppercase tracking-wider">
                                            Общее фото результата
                                        </label>
                                        <img
                                            src={task.finalPhotoUrl}
                                            alt="Final Result"
                                            className="w-full h-48 sm:h-64 object-cover rounded-xl shadow-sm"
                                        />
                                    </div>
                                )
                            )}

                            {isEditable && (
                                <form onSubmit={handleSubmit} className="space-y-5 pt-4 border-t border-slate-50">
                                    <div>
                                        <label htmlFor="comment" className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-widest pl-1">
                                            Ваш комментарий (опционально)
                                        </label>
                                        <textarea
                                            id="comment"
                                            rows="4"
                                            value={comment}
                                            onChange={(e) => setComment(e.target.value)}
                                            placeholder="Опишите особенности выполнения работы..."
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 transition-all outline-none text-sm"
                                        ></textarea>
                                    </div>

                                    {!isReadyToSubmit && (
                                        <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl mb-4">
                                            <p className="text-xs text-amber-700 font-bold flex items-center gap-2">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                                </svg>
                                                ДЛЯ ОТПРАВКИ ОТЧЕТА:
                                            </p>
                                            <ul className="text-[10px] text-amber-600 mt-1 space-y-0.5 list-disc list-inside font-medium">
                                                {!isChecklistComplete && <li>Выполнить пункты чек-листа ({incompleteChecklist.length} ост.)</li>}
                                                {!isFinalPhotoUploaded && <li>Загрузить фото результата</li>}
                                            </ul>
                                        </div>
                                    )}

                                    <button
                                        type="submit"
                                        disabled={isSubmitting || !isReadyToSubmit}
                                        className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold text-base sm:text-lg hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-all shadow-lg shadow-indigo-100 active:scale-[0.98]"
                                    >
                                        {isSubmitting ? (
                                            <span className="flex items-center justify-center gap-2">
                                                <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                Отправка отчета...
                                            </span>
                                        ) : 'Отправить отчет на проверку'}
                                    </button>
                                </form>
                            )}
                        </div>
                    </div>
                )}
            </div>

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
