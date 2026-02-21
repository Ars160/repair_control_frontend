import React from 'react';
import { useAuth } from '../hooks/useAuth';

const formatPhoneNumber = (value) => {
    if (!value) return '—';
    const phone = value.replace(/[^\d]/g, '');
    if (phone.length < 2) return `+${phone}`;
    if (phone.length <= 4) return `+7 (${phone.slice(1, 4)}`;
    if (phone.length <= 7) return `+7 (${phone.slice(1, 4)}) ${phone.slice(4, 7)}`;
    if (phone.length <= 9) return `+7 (${phone.slice(1, 4)}) ${phone.slice(4, 7)}-${phone.slice(7, 9)}`;
    return `+7 (${phone.slice(1, 4)}) ${phone.slice(4, 7)}-${phone.slice(7, 9)}-${phone.slice(9, 11)}`;
};

const Profile = () => {
    const { user, logout } = useAuth();

    if (!user) return null;

    // Role translation helper
    const getRoleName = (role) => {
        const roles = {
            'SUPER_ADMIN': 'Администратор',
            'PM': 'Администратор',
            'ESTIMATOR': 'Сметчик',
            'FOREMAN': 'Прораб',
            'WORKER': 'Работник'
        };
        return roles[role] || role;
    };

    return (
        <div className="max-w-2xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                {/* Header Background */}
                <div className="h-32 bg-gradient-to-r from-blue-600 to-indigo-700 relative">
                    <div className="absolute -bottom-12 left-8">
                        <div className="h-24 w-24 rounded-full bg-white p-1 shadow-lg">
                            <div className="h-full w-full rounded-full bg-slate-100 flex items-center justify-center text-3xl font-bold text-slate-500">
                                {user.fullName?.charAt(0)}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Profile Content */}
                <div className="pt-16 pb-8 px-8">
                    <div className="flex justify-between items-start">
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900">{user.fullName}</h1>
                            <span className="inline-block mt-1 px-3 py-1 bg-indigo-50 text-indigo-700 text-xs font-bold uppercase tracking-wide rounded-full">
                                {getRoleName(user.role)}
                            </span>
                        </div>
                        <button
                            onClick={logout}
                            className="px-4 py-2 bg-slate-100 text-slate-600 rounded-lg text-sm font-bold hover:bg-rose-50 hover:text-rose-600 transition-colors"
                        >
                            Выйти
                        </button>
                    </div>

                    <div className="mt-8 grid gap-6 border-t border-slate-100 pt-8">
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Телефон</label>
                            <p className="text-slate-700 font-medium">{formatPhoneNumber(user.phone)}</p>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">ID Пользователя</label>
                            <p className="text-slate-500 font-mono text-sm">#{user.id}</p>
                        </div>

                        {/* Additional fields can go here */}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;
