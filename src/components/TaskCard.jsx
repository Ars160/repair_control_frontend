// src/components/TaskCard.jsx
import { Link } from 'react-router-dom';
import { STATUSES, ROLES } from '../utils/mockData';

// Helper to get status styles
const getStatusStyles = (status) => {
    switch (status) {
        case STATUSES.COMPLETED:
            return 'bg-green-100 text-green-800';
        case STATUSES.ACTIVE:
            return 'bg-blue-100 text-blue-800';
        case STATUSES.REWORK:
        case STATUSES.REWORK_FOREMAN:
            return 'bg-red-100 text-red-800';
        case STATUSES.REWORK_PM:
            return 'bg-rose-100 text-rose-900 border border-rose-200';
        case STATUSES.UNDER_REVIEW_FOREMAN:
        case STATUSES.UNDER_REVIEW_PM:
            return 'bg-yellow-100 text-yellow-800';
        case STATUSES.LOCKED:
            return 'bg-gray-200 text-gray-600';
        default:
            return 'bg-gray-100 text-gray-800';
    }
};

// Helper to get priority styles
const getPriorityStyles = (priority) => {
    switch (priority) {
        case 'high':
            return 'text-red-500';
        case 'medium':
            return 'text-yellow-500';
        case 'low':
            return 'text-green-500';
        default:
            return 'text-gray-500';
    }
}

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

const TaskCard = ({ task, userRole }) => {
    const isDeadlinePassed = new Date(task.deadline) < new Date() && task.status !== STATUSES.COMPLETED;

    // Determine the correct link based on user role and task status
    const getTaskLink = () => {
        // Allow workers to view locked tasks
        if ((userRole === ROLES.FOREMAN && (task.status === STATUSES.UNDER_REVIEW_FOREMAN || task.status === STATUSES.REWORK_PM)) ||
            (userRole === ROLES.PM && task.status === STATUSES.UNDER_REVIEW_PM)) {
            return `/review/${task.id}`;
        }
        return `/tasks/${task.id}`;
    };

    const completionPercentage = task.checklist.length > 0
        ? Math.round((task.checklist.filter(i => i.completed).length / task.checklist.length) * 100)
        : 0;

    const isLocked = task.status === STATUSES.LOCKED;

    return (
        <Link
            to={getTaskLink()}
            className={`block bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-slate-100 transition-all duration-300 group
                ${isLocked ? 'opacity-70 bg-slate-50 hover:opacity-100 hover:border-slate-200 cursor-pointer' : 'hover-card active:scale-[0.98]'}
            `}
        >
            <div className="flex justify-between items-start mb-3 sm:mb-4">
                <div className="flex-1 min-w-0 mr-2">
                    <span className="text-[10px] sm:text-xs font-semibold tracking-wider text-indigo-500 uppercase mb-1 block truncate">
                        {task.object}
                    </span>
                    <h3 className="text-base sm:text-lg font-bold text-slate-800 group-hover:text-indigo-600 transition-colors flex items-center gap-2 truncate">
                        {task.title}
                        {isLocked && <svg className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>}
                    </h3>
                </div>
                <div className={`px-2 py-0.5 sm:px-3 sm:py-1 rounded-full text-[9px] sm:text-xs font-bold tracking-wide shrink-0 ${getStatusStyles(task.status)}`}>
                    {translateStatus(task.status)}
                </div>
            </div>

            <div className="flex flex-wrap items-center gap-y-2 gap-x-4 mb-4 sm:mb-6">
                <div className="flex items-center text-slate-500 text-xs sm:text-sm">
                    <svg className={`w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1 sm:mr-1.5 ${getPriorityStyles(task.priority)}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                    <span className="capitalize">{task.priority === 'HIGH' ? 'Высокий' : task.priority === 'MEDIUM' ? 'Средний' : 'Низкий'}</span>
                </div>
                <div className="flex items-center text-slate-500 text-xs sm:text-sm">
                    <svg className={`w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1 sm:mr-1.5 ${isDeadlinePassed ? 'text-red-500' : 'text-slate-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                    <span className={isDeadlinePassed ? 'text-red-600 font-medium' : ''}>
                        {new Date(task.deadline).toLocaleDateString()}
                    </span>
                </div>
            </div>

            {/* Premium Progress Bar */}
            <div className={`mt-2 ${isLocked ? 'opacity-50' : ''}`}>
                <div className="flex justify-between text-[10px] sm:text-xs mb-1 sm:mb-1.5">
                    <span className="text-slate-500 font-medium">Прогресс</span>
                    <span className="text-indigo-600 font-bold">{completionPercentage}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1.5 sm:h-2 overflow-hidden">
                    <div
                        className="bg-gradient-to-r from-indigo-500 to-indigo-600 h-1.5 sm:h-2 rounded-full transition-all duration-500 ease-out"
                        style={{ width: `${completionPercentage}%` }}
                    ></div>
                </div>
            </div>
        </Link>
    );
};

export default TaskCard;
