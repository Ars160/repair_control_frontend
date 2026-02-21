import React, { useState, useEffect } from 'react';
import api from '../api/client';
import { useAuth } from '../hooks/useAuth';

const UserManagement = () => {
    const { user } = useAuth();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);

    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('ALL');
    const [statusFilter, setStatusFilter] = useState('ACTIVE');

    // Register Form State
    const [formData, setFormData] = useState({
        phone: '',
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

    const formatPhoneNumber = (value) => {
        if (!value) return value;
        const phoneNumber = value.replace(/[^\d]/g, '');
        const phoneNumberLength = phoneNumber.length;
        if (phoneNumberLength <= 1) return '+7';
        if (phoneNumberLength <= 4) {
            return `+7 (${phoneNumber.slice(1, 4)}`;
        }
        if (phoneNumberLength <= 7) {
            return `+7 (${phoneNumber.slice(1, 4)}) ${phoneNumber.slice(4, 7)}`;
        }
        if (phoneNumberLength <= 9) {
            return `+7 (${phoneNumber.slice(1, 4)}) ${phoneNumber.slice(4, 7)}-${phoneNumber.slice(7, 9)}`;
        }
        return `+7 (${phoneNumber.slice(1, 4)}) ${phoneNumber.slice(4, 7)}-${phoneNumber.slice(7, 9)}-${phoneNumber.slice(9, 11)}`;
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        if (name === 'phone') {
            setFormData({
                ...formData,
                phone: formatPhoneNumber(value)
            });
        } else {
            setFormData({
                ...formData,
                [name]: value
            });
        }
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setFormLoading(true);
        setFormError('');

        // Prepare data (clean phone)
        const submitData = {
            ...formData,
            phone: formData.phone.replace(/[^\d]/g, '')
        };

        let result;
        if (editingUser) {
            // Update existing user
            // Don't send empty password during update to avoid accidental reset
            if (!submitData.password) delete submitData.password;
            result = await api.updateUser(editingUser.id, submitData);
        } else {
            // Register new user
            result = await api.register(submitData);
        }

        if (result.success) {
            alert(editingUser ? 'Данные сотрудника обновлены!' : 'Пользователь успешно зарегистрирован!');
            closeModal();
            fetchUsers();
        } else {
            setFormError(result.message || (editingUser ? 'Ошибка обновления' : 'Ошибка регистрации'));
        }
        setFormLoading(false);
    };

    const handleEditClick = (u) => {
        setEditingUser(u);
        setFormData({
            phone: formatPhoneNumber(u.phone || ''),
            password: '', // Password field stays empty for updates
            fullName: u.fullName,
            role: u.role
        });
        setIsModalOpen(true);
    };

    const handleToggleFrozen = async (u) => {
        const isCurrentlyFrozen = u.status === 'FROZEN';
        const newStatus = isCurrentlyFrozen ? 'ACTIVE' : 'FROZEN';

        if (!confirm(`Вы уверены, что хотите ${isCurrentlyFrozen ? 'разморозить' : 'заморозить'} пользователя ${u.fullName}?`)) return;

        const result = await api.updateUser(u.id, { status: newStatus });
        if (result.success) {
            fetchUsers();
        } else {
            alert(result.message || 'Ошибка изменения статуса');
        }
    };

    const handleFireUser = async (u) => {
        if (!confirm(`Вы уверены, что хотите УВОЛИТЬ сотрудника ${u.fullName}? Его доступ будет заблокирован, он будет перемещен в архив.`)) return;

        const result = await api.updateUser(u.id, { status: 'FIRED' });
        if (result.success) {
            fetchUsers();
        } else {
            alert(result.message || 'Ошибка при увольнении');
        }
    };

    const handleRehireUser = async (u) => {
        if (!confirm(`Вы уверены, что хотите восстановить (нанять снова) сотрудника ${u.fullName}?`)) return;

        const result = await api.updateUser(u.id, { status: 'ACTIVE' });
        if (result.success) {
            fetchUsers();
        } else {
            alert(result.message || 'Ошибка при восстановлении');
        }
    };

    // Remove old handleToggleStatus and handleDeleteClick if they exist
    const handleDeleteClick = async (u) => {
        await handleFireUser(u);
    };

    const handleToggleStatus = async (u) => {
        if (u.status === 'FIRED') {
            await handleRehireUser(u);
        } else {
            await handleToggleFrozen(u);
        }
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingUser(null);
        setFormData({
            phone: '',
            password: '',
            fullName: '',
            role: 'WORKER'
        });
        setFormError('');
    };

    const getRoleBadge = (u) => {
        const role = u.role;
        const status = u.status;

        const roleStyles = {
            'SUPER_ADMIN': 'bg-purple-100 text-purple-700 border-purple-200',
            'PM': 'bg-blue-100 text-blue-700 border-blue-200',
            'ESTIMATOR': 'bg-emerald-100 text-emerald-700 border-emerald-200',
            'FOREMAN': 'bg-orange-100 text-orange-700 border-orange-200',
            'WORKER': 'bg-slate-100 text-slate-700 border-slate-200'
        };

        const roleLabels = {
            'SUPER_ADMIN': 'Администратор',
            'PM': 'Администратор',
            'ESTIMATOR': 'Сметчик',
            'FOREMAN': 'Прораб',
            'WORKER': 'Работник'
        };

        if (status === 'FIRED') {
            return (
                <span className="px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-100 text-rose-500 border border-rose-200 opacity-60">
                    Уволен
                </span>
            );
        }

        if (status === 'FROZEN') {
            return (
                <div className="flex flex-col gap-1 items-start">
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border ${roleStyles[role] || 'bg-gray-100 text-gray-700'} opacity-50`}>
                        {roleLabels[role] || role}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-amber-100 text-amber-600 border border-amber-200">
                        Заморожен
                    </span>
                </div>
            );
        }

        return (
            <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${roleStyles[role] || 'bg-gray-100 text-gray-700 border-gray-200'}`}>
                {roleLabels[role] || role}
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

        // Status Filter
        if (statusFilter !== 'ALL' && u.status !== statusFilter) return false;

        // Search Filter
        const search = searchTerm.toLowerCase();
        return (
            u.fullName?.toLowerCase().includes(search) ||
            u.phone?.toLowerCase().includes(search) ||
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
                    onClick={() => {
                        setEditingUser(null);
                        setFormData({ phone: '', password: '', fullName: '', role: 'WORKER' });
                        setIsModalOpen(true);
                    }}
                    className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg font-bold shadow-sm flex items-center justify-center gap-2 transition-colors"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                    Добавить сотрудника
                </button>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col sm:flex-row gap-4 items-center">
                <div className="flex-1 relative w-full">
                    <svg className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                    <input
                        type="text"
                        placeholder="Поиск по имени, телефону или ID..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>
                <div className="w-full sm:w-48">
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white font-bold text-slate-700"
                    >
                        <option value="ACTIVE">Активные</option>
                        <option value="FROZEN">Замороженные</option>
                        <option value="FIRED">Уволенные</option>
                        <option value="ALL">Все статусы</option>
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
                                <th className="px-6 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Телефон / Логин</th>
                                <th className="px-6 py-3 text-right text-xs font-bold text-slate-400 uppercase tracking-wider">Действия</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-200">
                            {filteredUsers.length > 0 ? (
                                filteredUsers.map((u) => (
                                    <tr key={u.id} className={`hover:bg-slate-50/50 transition-colors ${u.status === 'FIRED' ? 'opacity-60 grayscale' : u.status === 'FROZEN' ? 'bg-amber-50/10' : ''}`}>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0 h-10 w-10">
                                                    <div className={`h-10 w-10 rounded-full flex items-center justify-center font-bold relative ${u.status === 'FIRED' ? 'bg-rose-50 text-rose-300' : u.status === 'FROZEN' ? 'bg-amber-100 text-amber-500' : 'bg-slate-200 text-slate-500'}`}>
                                                        {u.fullName?.charAt(0)}
                                                        {u.status === 'FIRED' && <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-white rounded-full flex items-center justify-center border border-rose-200"><div className="w-2 h-2 bg-rose-400 rounded-full"></div></div>}
                                                        {u.status === 'FROZEN' && <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-white rounded-full flex items-center justify-center border border-amber-200"><div className="w-2 h-2 bg-amber-400 rounded-full"></div></div>}
                                                    </div>
                                                </div>
                                                <div className="ml-4">
                                                    <div className={`text-sm font-medium ${u.status === 'FIRED' ? 'text-slate-500 line-through decoration-rose-300' : 'text-slate-900'}`}>{u.fullName}</div>
                                                    <div className="text-[10px] text-slate-400 font-mono">#{u.id}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {getRoleBadge(u)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                            {u.phone ? formatPhoneNumber(u.phone) : '—'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-xs font-medium space-x-2">
                                            <button onClick={() => handleEditClick(u)} className="text-indigo-600 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1.5 rounded-lg transition-colors">
                                                Изменить
                                            </button>

                                            {u.status !== 'FIRED' ? (
                                                <>
                                                    <button onClick={() => handleToggleFrozen(u)} className={`${u.status === 'FROZEN' ? 'text-emerald-600 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100' : 'text-amber-600 hover:text-amber-900 bg-amber-50 hover:bg-amber-100'} px-2.5 py-1.5 rounded-lg transition-colors`}>
                                                        {u.status === 'FROZEN' ? 'Разморозить' : 'Заморозить'}
                                                    </button>
                                                    <button onClick={() => handleFireUser(u)} className="text-rose-600 hover:text-rose-900 bg-rose-50 hover:bg-rose-100 px-2.5 py-1.5 rounded-lg transition-colors border border-rose-200">
                                                        Уволить
                                                    </button>
                                                </>
                                            ) : (
                                                <button onClick={() => handleRehireUser(u)} className="text-emerald-600 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1.5 rounded-lg transition-colors">
                                                    Восстановить
                                                </button>
                                            )}
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

            <div className="md:hidden space-y-4">
                {filteredUsers.length > 0 ? (
                    filteredUsers.map((u) => (
                        <div key={u.id} className={`bg-white p-4 rounded-xl shadow-sm border border-slate-200 space-y-4 ${u.status === 'FIRED' ? 'opacity-70 grayscale' : u.status === 'FROZEN' ? 'border-amber-200 bg-amber-50/20' : ''}`}>
                            <div className="flex items-start gap-4">
                                <div className={`h-11 w-11 rounded-full flex items-center justify-center font-bold text-xl shrink-0 shadow-sm ${u.status === 'FIRED' ? 'bg-rose-50 text-rose-300' : u.status === 'FROZEN' ? 'bg-amber-100 text-amber-500' : 'bg-slate-100 text-slate-500'}`}>
                                    {u.fullName?.charAt(0)}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="flex justify-between items-start gap-2">
                                        <div className={`text-base font-bold truncate leading-tight ${u.status === 'FIRED' ? 'text-slate-500 line-through' : 'text-slate-900'}`}>{u.fullName}</div>
                                        <div className="text-[10px] text-slate-400 font-mono mt-1 shrink-0">#{u.id}</div>
                                    </div>
                                    <div className="text-xs text-slate-500 truncate mb-2">{u.phone ? formatPhoneNumber(u.phone) : '—'}</div>
                                    <div className="flex items-center gap-2">
                                        {getRoleBadge(u)}
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-2 pt-2 border-t border-slate-50">
                                <button onClick={() => handleEditClick(u)} className="flex-1 text-xs font-bold py-2 bg-indigo-50 text-indigo-600 rounded-lg">Изменить</button>

                                {u.status !== 'FIRED' ? (
                                    <>
                                        <button onClick={() => handleToggleFrozen(u)} className={`flex-1 text-xs font-bold py-2 ${u.status === 'FROZEN' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'} rounded-lg`}>
                                            {u.status === 'FROZEN' ? 'Разморо.' : 'Замороз.'}
                                        </button>
                                        <button onClick={() => handleFireUser(u)} className="flex-1 text-xs font-bold py-2 bg-rose-50 text-rose-600 rounded-lg">Уволить</button>
                                    </>
                                ) : (
                                    <button onClick={() => handleRehireUser(u)} className="flex-1 text-xs font-bold py-2 bg-emerald-50 text-emerald-600 rounded-lg">Восстановить</button>
                                )}
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
                    <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 animate-scale-in max-h-[calc(100dvh-2rem)] overflow-y-auto">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-slate-900">
                                {editingUser ? 'Редактировать сотрудника' : 'Новый сотрудник'}
                            </h2>
                            <button onClick={closeModal} className="text-slate-400 hover:text-slate-600">
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
                                <label className="block text-sm font-bold text-slate-700 mb-1">Телефон (Логин)</label>
                                <input
                                    name="phone"
                                    type="text"
                                    value={formData.phone}
                                    onChange={handleInputChange}
                                    required
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="+7 (707) 000-00-00"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">
                                    Пароль {editingUser && <span className="text-[10px] text-slate-400 font-normal ml-1">(оставьте пустым, если не хотите менять)</span>}
                                </label>
                                <input
                                    name="password"
                                    type="password"
                                    value={formData.password}
                                    onChange={handleInputChange}
                                    required={!editingUser}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder={editingUser ? "Новый пароль" : "минимум 6 символов"}
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
                                    {formLoading ? (editingUser ? 'Сохранение...' : 'Регистрация...') : (editingUser ? 'Сохранить изменения' : 'Зарегистрировать')}
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
