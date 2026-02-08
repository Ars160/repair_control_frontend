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

const TaskCard = ({ task, userRole }) => {
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

    return (
        <Link
            to={getTaskLink()}
            className={`block relative overflow-hidden group transition-all duration-200
                ${isLocked
                    ? 'opacity-70 bg-slate-50 border border-slate-200 rounded-xl p-5 hover:opacity-100'
                    : 'card-premium p-5'
                }
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
            <div className="mb-5">
                <div className="text-xs font-bold tracking-wider text-bauberg-sky uppercase mb-1.5 truncate">
                    {task.object}
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-slate-900 group-hover:text-bauberg-blue transition-colors leading-tight">
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

                <div className="flex items-center text-slate-600 text-sm">
                    <svg className={`w-4 h-4 mr-1.5 ${isDeadlinePassed ? 'text-rose-500' : 'text-slate-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                    <span className={isDeadlinePassed ? 'text-rose-600 font-bold' : 'font-medium'}>
                        {new Date(task.deadline).toLocaleDateString()}
                    </span>
                </div>
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
