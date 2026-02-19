import React, { useState, useEffect } from 'react';
import api from '../api/client';
import { useAuth } from '../hooks/useAuth';

const UserManagement = () => {
    const { user } = useAuth();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('ALL');

    // Register Form State
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        fullName: '',
        role: 'WORKER'
    });
    const [formLoading, setFormLoading] = useState(false);
    const [formError, setFormError] = useState('');

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setLoading(true);
        const data = await api.getUsers();
        setUsers(data || []);
        setLoading(false);
    };

    const handleInputChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setFormLoading(true);
        setFormError('');

        const result = await api.register(formData);

        if (result.success) {
            alert('Пользователь успешно зарегистрирован!');
            setIsModalOpen(false);
            setFormData({
                email: '',
                password: '',
                fullName: '',
                role: 'WORKER'
            });
            fetchUsers(); // Refresh list
        } else {
            setFormError(result.message || 'Ошибка регистрации');
        }
        setFormLoading(false);
    };

    const getRoleBadge = (role) => {
        const styles = {
            'SUPER_ADMIN': 'bg-purple-100 text-purple-700',
            'PM': 'bg-blue-100 text-blue-700',
            'ESTIMATOR': 'bg-emerald-100 text-emerald-700',
            'FOREMAN': 'bg-orange-100 text-orange-700',
            'WORKER': 'bg-slate-100 text-slate-700'
        };
        const labels = {
            'SUPER_ADMIN': 'Администратор',
            'PM': 'Администратор',
            'ESTIMATOR': 'Сметчик',
            'FOREMAN': 'Прораб',
            'WORKER': 'Работник'
        };
        return (
            <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${styles[role] || 'bg-gray-100 text-gray-700'}`}>
                {labels[role] || role}
            </span>
        );
    };

    // Filter Logic
    const filteredUsers = users.filter(u => {
        // Hide current user
        if (u.id === user?.id) return false;

        // Role Filter
        if (roleFilter !== 'ALL') {
            if (roleFilter === 'PM') {
                // Show both PM and SUPER_ADMIN when "Администратор" is selected
                if (u.role !== 'PM' && u.role !== 'SUPER_ADMIN') return false;
            } else {
                if (u.role !== roleFilter) return false;
            }
        }

        // Search Filter
        const search = searchTerm.toLowerCase();
        return (
            u.fullName?.toLowerCase().includes(search) ||
            u.email?.toLowerCase().includes(search) ||
            u.id?.toString().includes(search)
        );
    });

    if (loading) {
        return <div className="p-8 text-center text-slate-500">Загрузка списка сотрудников...</div>;
    }

    return (
        <div className="space-y-6 pb-20">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Сотрудники</h1>
                    <p className="text-slate-500 text-sm">Управление пользователями и правами</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg font-bold shadow-sm flex items-center justify-center gap-2 transition-colors"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                    Добавить сотрудника
                </button>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                    <svg className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                    <input
                        type="text"
                        placeholder="Поиск по имени, email или ID..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>
                <div className="sm:w-48">
                    <select
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                    >
                        <option value="ALL">Все роли</option>
                        <option value="WORKER">Работник</option>
                        <option value="FOREMAN">Прораб</option>
                        <option value="PM">Администратор</option>
                        <option value="ESTIMATOR">Сметчик</option>
                    </select>
                </div>
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Сотрудник</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Роль</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Email / Логин</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">ID</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-200">
                            {filteredUsers.length > 0 ? (
                                filteredUsers.map((u) => (
                                    <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0 h-10 w-10">
                                                    <div className="h-10 w-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-bold">
                                                        {u.fullName?.charAt(0)}
                                                    </div>
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-medium text-slate-900">{u.fullName}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {getRoleBadge(u.role)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                            {u.email}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                                            #{u.id}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="4" className="px-6 py-8 text-center text-slate-500">
                                        Сотрудники не найдены
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-4">
                {filteredUsers.length > 0 ? (
                    filteredUsers.map((u) => (
                        <div key={u.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-lg shrink-0">
                                    {u.fullName?.charAt(0)}
                                </div>
                                <div className="min-w-0">
                                    <div className="text-sm font-bold text-slate-900 truncate">{u.fullName}</div>
                                    <div className="text-xs text-slate-500 truncate">{u.email}</div>
                                    <div className="mt-1">
                                        {getRoleBadge(u.role)}
                                    </div>
                                </div>
                            </div>
                            <div className="text-xs font-mono text-slate-400 shrink-0">
                                #{u.id}
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-8 text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                        Сотрудники не найдены
                    </div>
                )}
            </div>

            {/* Registration Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 animate-scale-in">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-slate-900">Новый сотрудник</h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                            </button>
                        </div>

                        <form onSubmit={handleRegister} className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">ФИО</label>
                                <input
                                    name="fullName"
                                    type="text"
                                    value={formData.fullName}
                                    onChange={handleInputChange}
                                    required
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="Иванов Иван"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Email (Логин)</label>
                                <input
                                    name="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    required
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="user@bauberg.ru"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Пароль</label>
                                <input
                                    name="password"
                                    type="password"
                                    value={formData.password}
                                    onChange={handleInputChange}
                                    required
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder=" минимум 6 символов"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Роль</label>
                                <select
                                    name="role"
                                    value={formData.role}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                                >
                                    <option value="WORKER">Работник</option>
                                    <option value="FOREMAN">Прораб</option>
                                    <option value="PM">Администратор</option>
                                    <option value="ESTIMATOR">Сметчик</option>
                                </select>
                            </div>

                            {formError && (
                                <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg">
                                    {formError}
                                </div>
                            )}

                            <div className="pt-4">
                                <button
                                    type="submit"
                                    disabled={formLoading}
                                    className={`w-full py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors ${formLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
                                >
                                    {formLoading ? 'Регистрация...' : 'Зарегистрировать'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserManagement;
