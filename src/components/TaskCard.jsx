// src/components/TaskCard.jsx
import { Link } from 'react-router-dom';
import { STATUSES, ROLES } from '../utils/mockData';

// Helper to get status styles
const getStatusStyles = (status) => {
    switch (status) {
        case STATUSES.COMPLETED:
            return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
        case STATUSES.ACTIVE:
            return 'bg-blue-50 text-bauberg-blue border border-blue-200';
        case STATUSES.REWORK:
        case STATUSES.REWORK_FOREMAN:
            return 'bg-amber-50 text-amber-700 border border-amber-200';
        case STATUSES.REWORK_PM:
            return 'bg-rose-50 text-rose-700 border border-rose-200';
        case STATUSES.UNDER_REVIEW_FOREMAN:
        case STATUSES.UNDER_REVIEW_PM:
            return 'bg-indigo-50 text-indigo-700 border border-indigo-200';
        case STATUSES.LOCKED:
            return 'bg-slate-100 text-slate-500 border border-slate-200';
        default:
            return 'bg-slate-50 text-slate-700 border border-slate-200';
    }
};

// Helper to get priority styles
const getPriorityStyles = (priority) => {
    switch (priority) {
        case 'high':
            return 'text-rose-600';
        case 'medium':
            return 'text-amber-600';
        case 'low':
            return 'text-emerald-600';
        default:
            return 'text-slate-400';
    }
}

// Helper to translate status to Russian
const translateStatus = (status) => {
    const translations = {
        [STATUSES.LOCKED]: 'В очереди',
        [STATUSES.ACTIVE]: 'В работе',
        [STATUSES.UNDER_REVIEW_FOREMAN]: 'Проверка: Прораб',
        [STATUSES.UNDER_REVIEW_PM]: 'Проверка: ПМ',
        [STATUSES.REWORK]: 'Доработка',
        [STATUSES.REWORK_FOREMAN]: 'Доработка (Прораб)',
        [STATUSES.REWORK_PM]: 'Доработка (ПМ)',
        [STATUSES.COMPLETED]: 'Готово',
    };
    return translations[status] || status;
};

const TaskCard = ({ task, userRole, isHighlighted }) => {
    const isDeadlinePassed = new Date(task.deadline) < new Date() && task.status !== STATUSES.COMPLETED;

    // Determine the correct link based on user role and task status
    const getTaskLink = () => {
        // Allow workers to view locked tasks
        if ((userRole === ROLES.FOREMAN && task.status === STATUSES.UNDER_REVIEW_FOREMAN) ||
            (userRole === ROLES.PM && task.status === STATUSES.UNDER_REVIEW_PM)) {
            return `/review/${task.id}`;
        }
        return `/tasks/${task.id}`;
    };

    const completionPercentage = task.checklist && task.checklist.length > 0
        ? Math.round((task.checklist.filter(i => i.isCompleted).length / task.checklist.length) * 100)
        : 0;

    const isLocked = task.status === STATUSES.LOCKED;
    const isCompleted = task.status === STATUSES.COMPLETED;

    // Helper to calculate days remaining
    const getDaysRemaining = (deadlineDate) => {
        if (!deadlineDate) return null;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const deadline = new Date(deadlineDate);
        deadline.setHours(0, 0, 0, 0);
        const diffTime = deadline - today;
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    };

    const daysRemaining = getDaysRemaining(task.deadline);

    // Dynamic border color based on status and urgency
    const getBorderColor = () => {
        if (isCompleted) return 'border-l-4 border-l-emerald-500';
        if (task.status === STATUSES.REWORK || task.status === STATUSES.REWORK_FOREMAN || task.status === STATUSES.REWORK_PM) return 'border-l-4 border-l-rose-500';
        if (task.priority === 'HIGH' || (daysRemaining !== null && daysRemaining <= 1)) return 'border-l-4 border-l-amber-500';
        if (isLocked) return 'border-l-4 border-l-slate-300';
        return 'border-l-4 border-l-bauberg-blue'; // Default active
    };

    // Dynamic highlight styles based on status
    const getHighlightStyles = () => {
        if (!isHighlighted) return '';

        if (task.status === STATUSES.REWORK_PM)
            return 'bg-purple-100 border-purple-500 ring-4 ring-inset ring-purple-400 z-20 scale-[1.03] shadow-md';
        if (task.status === STATUSES.REWORK || task.status === STATUSES.REWORK_FOREMAN)
            return 'bg-rose-100 border-rose-500 ring-4 ring-inset ring-rose-400 z-20 scale-[1.03] shadow-md';
        if (task.status === STATUSES.UNDER_REVIEW_FOREMAN || task.status === STATUSES.UNDER_REVIEW_PM)
            return 'bg-amber-100 border-amber-500 ring-4 ring-inset ring-amber-400 z-20 scale-[1.03] shadow-md';

        return 'bg-indigo-100 border-indigo-500 ring-4 ring-inset ring-indigo-400 z-20 scale-[1.03] shadow-md';
    };

    // Render Deadline Badge
    const renderDeadlineBadge = () => {
        if (!task.deadline) return null;

        if (isCompleted) {
            return (
                <div className="flex items-center text-emerald-600 text-sm font-bold bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-100">
                    <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                    <span>Завершено</span>
                </div>
            );
        }

        if (daysRemaining < 0) {
            return (
                <div className="flex items-center text-rose-600 text-[11px] font-black tracking-wide uppercase bg-rose-50 px-2.5 py-1 rounded-md border border-rose-200 shadow-sm animate-pulse shadow-rose-100">
                    <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                    ПРОСРОЧЕНО!
                </div>
            );
        } else if (daysRemaining === 0) {
            return (
                <div className="flex items-center text-amber-600 text-xs font-bold bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200">
                    <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    СЕГОДНЯ
                </div>
            );
        } else if (daysRemaining === 1) {
            return (
                <div className="flex items-center text-amber-600 text-xs font-bold bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200">
                    <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    ЗАВТРА
                </div>
            );
        } else if (daysRemaining <= 3) {
            return (
                <div className="flex items-center text-amber-600 text-xs font-bold bg-amber-50/50 px-2.5 py-1 rounded-md border border-amber-100">
                    <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                    Осталось {daysRemaining} дн.
                </div>
            );
        } else {
            return (
                <div className="flex items-center text-slate-500 text-xs font-medium bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-md">
                    <svg className="w-4 h-4 mr-1.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                    До {new Date(task.deadline).toLocaleDateString()}
                </div>
            );
        }
    };

    return (
        <Link
            id={`task-card-${task.id}`}
            to={getTaskLink()}
            className={`block relative group transition-all duration-700 ease-out rounded-xl ${getBorderColor()}
                ${isLocked
                    ? 'opacity-70 bg-slate-50 border-t border-r border-b border-slate-200 p-5 hover:opacity-100'
                    : 'card-premium p-5 border-t border-r border-b'
                }
                ${getHighlightStyles()}
            `}
        >
            {/* Status Badge */}
            <div className="flex justify-between items-start mb-4">
                <div className={`px-3 py-1.5 rounded-md text-xs font-bold tracking-wide uppercase shadow-sm ${getStatusStyles(task.status)}`}>
                    {translateStatus(task.status)}
                </div>
                {task.priority === 'HIGH' && (
                    <div className="flex items-center gap-1.5 bg-rose-50 px-2 py-1 rounded text-rose-600 text-[10px] font-bold uppercase border border-rose-100">
                        <span>Важно</span>
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                        </span>
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="mb-5 min-w-0">
                <div className="text-xs font-bold tracking-wider text-bauberg-sky uppercase mb-1.5 break-words break-all sm:break-normal line-clamp-2">
                    {task.object}
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-slate-900 group-hover:text-bauberg-blue transition-colors leading-tight break-words break-all sm:break-normal line-clamp-3">
                    {task.title}
                </h3>
            </div>

            {/* Meta Info */}
            <div className="flex flex-wrap items-center gap-y-3 gap-x-5 mb-5 border-t border-slate-100 pt-4">
                {task.assigneeNames && task.assigneeNames.length > 0 && (
                    <div className="flex items-center text-slate-600 text-sm font-medium">
                        <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-600 mr-2 border border-slate-200">
                            {task.assigneeNames[0].charAt(0)}
                        </div>
                        <span className="truncate max-w-[120px]">{task.assigneeNames.join(', ')}</span>
                    </div>
                )}

                {renderDeadlineBadge()}
            </div>

            {/* Progress Bar (Simpler) */}
            <div className={`mt-auto ${isLocked ? 'opacity-50' : ''}`}>
                <div className="flex justify-between text-xs mb-2 align-bottom">
                    <span className="text-slate-500 font-medium">Прогресс</span>
                    <span className="text-bauberg-blue font-bold">{completionPercentage}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-100">
                    <div
                        className="bg-bauberg-blue h-full rounded-full transition-all duration-500 ease-out"
                        style={{ width: `${completionPercentage}%` }}
                    ></div>
                </div>
            </div>
        </Link>
    );
};

export default TaskCard;
