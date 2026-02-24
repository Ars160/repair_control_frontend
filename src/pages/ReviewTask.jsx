// src/pages/ReviewTask.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import api from '../api/client';
import { STATUSES, ROLES } from '../utils/mockData';
import ChecklistSection from '../components/ChecklistSection';
import ApprovalHistory from '../components/ApprovalHistory';
import PhotoUpload from '../components/PhotoUpload';

const ReviewTask = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [task, setTask] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);

    // State for actions with comment
    const [showCommentForm, setShowCommentForm] = useState(false);
    const [comment, setComment] = useState('');
    const [actionType, setActionType] = useState(null); // 'APPROVE' or 'REJECT'

    const handleFinalPhotoChange = async (base64) => {
        const result = await api.updateTaskFinalPhoto(id, base64);
        if (result.success) {
            const serverUrl = result.data?.finalPhotoUrl;
            const resolvedUrl = serverUrl
                ? (serverUrl.startsWith('http') || serverUrl.startsWith('data:') ? serverUrl : `/files/${serverUrl}`)
                : null;
            setTask(prev => ({ ...prev, finalPhotoUrl: resolvedUrl }));
        } else if (!base64) {
            setTask(prev => ({ ...prev, finalPhotoUrl: null }));
        } else {
            alert('Не удалось изменить фото: ' + (result.message || 'Неизвестная ошибка'));
        }
    };

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
        // Foreman must have all required photos before approving
        if (user.role === ROLES.FOREMAN) {
            // Check checklist photos
            const missingPhotos = (task.checklist || []).filter(
                item => item.isPhotoRequired && !item.photoUrl
            );
            if (missingPhotos.length > 0) {
                alert(`Невозможно принять работу: ${missingPhotos.length} пункт(ов) чек-листа требуют загрузки фото. Пожалуйста, загрузите все обязательные фото.`);
                return;
            }

            // Check final photo
            if (!task.finalPhotoUrl) {
                alert('Невозможно принять работу: необходимо загрузить финальное фото результата.');
                return;
            }
        }

        setIsProcessing(true);
        let nextStatus;
        if (user.role === ROLES.FOREMAN) {
            nextStatus = STATUSES.UNDER_REVIEW_PM; // Foreman approves worker's submission -> send to PM
        } else if (user.role === ROLES.PM) {
            nextStatus = STATUSES.COMPLETED;
        }

        if (nextStatus) {
            const result = await api.updateTaskStatus(id, nextStatus, comment);
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
        if (!comment) {
            alert('Пожалуйста, укажите причину доработки.');
            return;
        }
        setIsProcessing(true);
        // Backend will determine correct status (REWORK_FOREMAN or REWORK_PM) based on user role
        const result = await api.updateTaskStatus(id, 'REWORK_FOREMAN', comment);
        if (result.success) {
            alert('Задача возвращена на доработку.');
            navigate('/dashboard');
        } else {
            setError(result.message || 'Не удалось вернуть задачу.');
        }
        setIsProcessing(false);
    };

    const openCommentForm = (type) => {
        setActionType(type);
        setComment('');
        setShowCommentForm(true);
    };

    const translateStatus = (status) => {
        const translations = {
            [STATUSES.LOCKED]: 'Заблокировано',
            [STATUSES.ACTIVE]: 'Активно',
            [STATUSES.UNDER_REVIEW_FOREMAN]: 'На проверке у прораба',
            [STATUSES.UNDER_REVIEW_PM]: 'На проверке у ПМ',
            [STATUSES.REWORK_FOREMAN]: 'Доработка (от Прораба)',
            [STATUSES.REWORK_PM]: 'Вернуто ПМ',
            [STATUSES.COMPLETED]: 'Завершено',
        };
        return translations[status] || status;
    };

    if (loading) return <div className="text-center mt-8">Загрузка задачи...</div>;
    if (error) return <div className="text-center mt-8 text-red-500">{error}</div>;
    if (!task) return null;

    const isChecklistComplete = (task.checklist || []).every(item =>
        item.isCompleted && (!item.isPhotoRequired || item.photoUrl)
    );

    return (
        <div className="max-w-6xl mx-auto space-y-6 pb-20">
            {/* Task Info Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 sm:p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 sm:w-32 sm:h-32 bg-indigo-50 rounded-bl-full -mr-6 -mt-6 sm:-mr-8 sm:-mt-8 z-0"></div>

                <div className="relative z-10">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-4">
                        <div>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-indigo-50 text-indigo-700 mb-2 uppercase tracking-wider">
                                {task.projectName || 'Проект не указан'}
                            </span>
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 leading-tight">
                                    {task.title}
                                </h1>
                                <span className="inline-block self-start text-[10px] font-bold text-slate-400 border border-slate-200 rounded px-2 py-0.5 uppercase tracking-widest">
                                    Проверка
                                </span>
                            </div>
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
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 mb-1">
                                <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                                <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Расположение</p>
                            </div>
                            <div className="ml-2 space-y-2">
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase w-20 flex-shrink-0">Раздел</span>
                                    <span className="text-sm font-semibold text-slate-800">{task.objectName}</span>
                                </div>
                                {task.objectAddress && (
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase w-20 flex-shrink-0">Адрес</span>
                                        <span className="text-sm text-slate-600">{task.objectAddress}</span>
                                    </div>
                                )}
                                {task.subObjectName && (
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-bold text-indigo-400 uppercase w-20 flex-shrink-0">Подраздел</span>
                                        <span className="text-sm font-semibold text-indigo-600">{task.subObjectName}</span>
                                    </div>
                                )}
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

                    {/* Assignees Section */}
                    {task.assigneeNames && task.assigneeNames.length > 0 && (
                        <div className="mt-6 pt-5 border-t border-slate-100">
                            <div className="flex items-center gap-2 mb-3">
                                <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                                </svg>
                                <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Исполнители</p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {[...task.assigneeNames].map((name, i) => (
                                    <div key={i} className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-full pl-1 pr-3 py-1">
                                        <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                                            <span className="text-xs font-bold text-indigo-600">{name.charAt(0)}</span>
                                        </div>
                                        <span className="text-sm font-medium text-slate-700">{name}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left side: submission details */}
                <div>
                    <div className="mb-6">
                        <ChecklistSection
                            taskId={id}
                            checklists={task.checklist}
                            readOnly={user.role !== ROLES.FOREMAN}
                            canRemark={true}
                            onUpdate={async () => {
                                const fetchedTask = await api.getTaskById(id);
                                if (fetchedTask) setTask(fetchedTask);
                            }}
                        />
                    </div>
                    {(task.finalPhotoUrl || (user.role === ROLES.FOREMAN && task.status === STATUSES.UNDER_REVIEW_FOREMAN)) && (
                        <div className="mb-6">
                            <h3 className="text-lg font-medium text-gray-700 mb-3">Финальный результат</h3>

                            {user.role === ROLES.FOREMAN && task.status === STATUSES.UNDER_REVIEW_FOREMAN ? (
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
                                        label={isChecklistComplete ? (task.finalPhotoUrl ? "Изменить фото результата" : "Загрузить фото результата (обязательно)") : "Доступно после выполнения всех пунктов"}
                                        disabled={!isChecklistComplete || loading}
                                    />
                                </div>
                            ) : (
                                task.finalPhotoUrl && (
                                    <a href={task.finalPhotoUrl} target="_blank" rel="noopener noreferrer">
                                        <img
                                            src={task.finalPhotoUrl}
                                            alt="Final Result"
                                            className="rounded-xl object-cover w-full h-64 border border-slate-100 shadow-sm hover:opacity-90 transition"
                                        />
                                    </a>
                                )
                            )}
                        </div>
                    )}
                    <div className="mb-6">
                        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest pl-1 mb-2">Комментарий исполнителя</h3>
                        {task.submission?.authorName && (
                            <p className="text-xs font-bold text-indigo-600 mb-2 pl-1">От: {task.submission.authorName}</p>
                        )}
                        <p className="mt-1 text-sm text-slate-600 bg-slate-50 p-4 rounded-xl border border-slate-100 min-h-[50px] italic">
                            {task.submission?.comment ? `"${task.submission.comment}"` : 'Нет комментария'}
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

                {/* History/Notes */}
                <ApprovalHistory approvals={task.approvals} />

                {(task.rejectionReason || task.foremanNote) && (
                    <div className="space-y-4 mb-6">
                        {task.rejectionReason && (
                            <div className="bg-red-50 border-l-4 border-red-500 p-4">
                                <div className="flex">
                                    <div className="flex-shrink-0">
                                        <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <div className="ml-3">
                                        <h3 className="text-sm font-medium text-red-800">Замечания к исправлению</h3>
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
                            <div className="bg-indigo-50 border-l-4 border-indigo-500 p-4">
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

                {/* Actions Panel */}
                <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-100 shadow-sm sticky top-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path>
                            </svg>
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">Принятие решения</h2>
                    </div>

                    {!showCommentForm ? (
                        <div className="space-y-4">
                            <button
                                onClick={() => handleApprove()}
                                disabled={isProcessing}
                                className="w-full relative group overflow-hidden px-6 py-5 rounded-xl transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-500 transition-all group-hover:scale-105"></div>
                                <div className="relative flex items-center justify-center gap-2 text-white font-bold text-lg">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"></path>
                                    </svg>
                                    {isProcessing ? 'Обработка...' : 'Принять работу'}
                                </div>
                            </button>

                            <button
                                onClick={() => openCommentForm('REJECT')}
                                disabled={isProcessing}
                                className="w-full relative group overflow-hidden px-6 py-5 rounded-xl transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <div className="absolute inset-0 bg-white border-2 border-slate-100 group-hover:bg-rose-50 group-hover:border-rose-200 transition-all"></div>
                                <div className="relative flex items-center justify-center gap-2 text-slate-700 group-hover:text-rose-600 font-bold text-lg">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"></path>
                                    </svg>
                                    На доработку
                                </div>
                            </button>
                        </div>
                    ) : (
                        <div>
                            <h3 className="text-sm font-bold text-slate-700 mb-3 uppercase tracking-wider pl-1">
                                {actionType === 'REJECT' ? 'Причина возврата' : 'Ваше пояснение для ПМ'}
                            </h3>
                            <textarea
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                rows="5"
                                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 transition-all outline-none text-sm"
                                placeholder={actionType === 'REJECT' ? "Опишите, что необходимо исправить..." : "Опишите, что было сделано..."}
                            ></textarea>
                            <div className="mt-4 flex flex-col sm:flex-row gap-3">
                                <button
                                    onClick={actionType === 'REJECT' ? handleReject : handleApprove}
                                    disabled={isProcessing || (actionType === 'REJECT' && !comment)}
                                    className={`w-full px-4 py-3.5 text-sm font-bold text-white rounded-xl shadow-md disabled:bg-slate-300 transition-all active:scale-[0.98] ${actionType === 'REJECT' ? 'bg-rose-600 hover:bg-rose-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}
                                >
                                    {isProcessing ? 'Отправка...' : 'Подтвердить'}
                                </button>
                                <button
                                    onClick={() => setShowCommentForm(false)}
                                    disabled={isProcessing}
                                    className="w-full px-4 py-3.5 text-sm font-bold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all active:scale-[0.98]"
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
