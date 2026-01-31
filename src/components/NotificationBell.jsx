// src/components/NotificationBell.jsx
import React, { useState, useEffect, useRef } from 'react';
import api from '../api/client';
import { useNavigate } from 'react-router-dom';

const NotificationBell = () => {
    const [notifications, setNotifications] = useState([]);
    const [allNotifications, setAllNotifications] = useState([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const [activeTab, setActiveTab] = useState('NEW'); // 'NEW' or 'HISTORY'
    const dropdownRef = useRef(null);
    const navigate = useNavigate();

    const fetchNotifications = async () => {
        try {
            // Fetch unread for badge
            const unreadData = await api.getUnreadNotifications();
            setNotifications(unreadData || []);

            // If history tab is open, fetch all
            if (activeTab === 'HISTORY' && showDropdown) {
                const allData = await api.getAllNotifications();
                setAllNotifications(allData || []);
            }
        } catch (error) {
            console.error("Failed to fetch notifications", error);
        }
    };

    useEffect(() => {
        fetchNotifications();
        // Poll every 30 seconds
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, [activeTab, showDropdown]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleMarkAsRead = async (id, event) => {
        if (event) event.stopPropagation();
        try {
            await api.markNotificationAsRead(id);
            setNotifications(prev => prev.filter(n => n.id !== id));
            // Update history list item to read status if visible
            setAllNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
        } catch (error) {
            console.error("Failed to mark as read", error);
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            await api.markAllNotificationsAsRead();
            setNotifications([]);
            setAllNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        } catch (error) {
            console.error("Failed to mark all as read", error);
        }
    };

    const handleDeleteNotification = async (id, event) => {
        if (event) event.stopPropagation();
        try {
            await api.deleteNotification(id);
            setNotifications(prev => prev.filter(n => n.id !== id));
            setAllNotifications(prev => prev.filter(n => n.id !== id));
        } catch (error) {
            console.error("Failed to delete notification", error);
        }
    };

    const handleClearHistory = async () => {
        if (!window.confirm('Очистить всю историю уведомлений?')) return;
        try {
            await api.clearNotifications();
            setAllNotifications([]);
            setNotifications([]);
        } catch (error) {
            console.error("Failed to clear history", error);
        }
    };

    const handleNotificationClick = async (notification) => {
        // Mark as read
        if (!notification.isRead) {
            await handleMarkAsRead(notification.id);
        }
        setShowDropdown(false);
    };

    const displayedNotifications = activeTab === 'NEW' ? notifications : allNotifications;

    return (
        <div className="relative mr-2 sm:mr-6" ref={dropdownRef}>
            <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="relative p-2 text-slate-400 hover:text-indigo-600 transition-colors rounded-full hover:bg-slate-50 outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path>
                </svg>
                {notifications.length > 0 && (
                    <span className="absolute top-1 right-1 inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-bold leading-none text-white transform translate-x-1/4 -translate-y-1/4 bg-red-500 rounded-full border-2 border-white shadow-sm">
                        {notifications.length > 9 ? '9+' : notifications.length}
                    </span>
                )}
            </button>

            {showDropdown && (
                <div className="fixed inset-0 top-0 left-0 w-full h-full z-50 sm:absolute sm:inset-auto sm:right-0 sm:mt-2 sm:w-96 sm:h-auto bg-white sm:rounded-xl shadow-xl ring-1 ring-black ring-opacity-5 transform origin-top-right transition-all overflow-hidden flex flex-col">
                    {/* Header with Tabs - Mobile Close Button Included */}
                    <div className="bg-slate-50 border-b border-slate-100 flex-none">
                        <div className="flex px-4 py-3 sm:px-2 sm:pt-2 items-center">
                            <button className="sm:hidden mr-4 p-1 text-slate-400" onClick={() => setShowDropdown(false)}>
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                            </button>
                            <div className="flex flex-1">
                                <button
                                    onClick={() => setActiveTab('NEW')}
                                    className={`flex-1 pb-2 text-xs font-bold uppercase tracking-wide border-b-2 transition-colors ${activeTab === 'NEW' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                                >
                                    НОВЫЕ ({notifications.length})
                                </button>
                                <button
                                    onClick={() => setActiveTab('HISTORY')}
                                    className={`flex-1 pb-2 text-xs font-bold uppercase tracking-wide border-b-2 transition-colors ${activeTab === 'HISTORY' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                                >
                                    ИСТОРИЯ
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Notification List */}
                    <div className="flex-1 overflow-y-auto sm:max-h-96 custom-scrollbar bg-white p-0 sm:p-0">
                        {displayedNotifications.length === 0 ? (
                            <div className="px-4 py-12 text-center">
                                <svg className="mx-auto h-12 w-12 text-slate-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"></path>
                                </svg>
                                <p className="mt-2 text-sm text-slate-400 font-medium">Нет уведомлений</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-50">
                                {displayedNotifications.map(notification => (
                                    <div
                                        key={notification.id}
                                        onClick={() => handleNotificationClick(notification)}
                                        className={`relative group px-4 py-4 cursor-pointer transition-colors ${notification.isRead ? 'bg-white hover:bg-slate-50' : 'bg-indigo-50/30 hover:bg-indigo-50/60'}`}
                                    >
                                        <div className="flex justify-between items-start gap-3">
                                            <div className="flex-1 min-w-0">
                                                <p className={`text-sm leading-relaxed ${notification.isRead ? 'text-slate-600' : 'text-slate-800 font-medium'}`}>
                                                    {notification.message}
                                                </p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                                                        {new Date(notification.createdAt).toLocaleString('ru-RU')}
                                                    </p>
                                                    {notification.isRead && (
                                                        <span className="text-[10px] text-emerald-500 font-medium flex items-center">
                                                            <svg className="w-3 h-3 mr-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                                                            Просмотрено
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            {!notification.isRead ? (
                                                <button
                                                    onClick={(e) => handleMarkAsRead(notification.id, e)}
                                                    className="shrink-0 text-indigo-400 hover:text-indigo-600 p-1 rounded-full hover:bg-indigo-100 transition-all"
                                                    title="Пометить как прочитанное"
                                                >
                                                    <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={(e) => handleDeleteNotification(notification.id, e)}
                                                    className="shrink-0 text-slate-300 hover:text-red-500 p-1 rounded-full hover:bg-red-50 transition-all lg:opacity-0 group-hover:opacity-100"
                                                    title="Удалить навсегда"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Footer Actions */}
                    {displayedNotifications.length > 0 && (
                        <div className="bg-slate-50 px-4 py-3 rounded-b-2xl text-center border-t border-slate-100 flex-none flex gap-2 justify-center">
                            {activeTab === 'NEW' && notifications.length > 0 && (
                                <button
                                    onClick={handleMarkAllAsRead}
                                    className="text-[10px] font-bold text-indigo-600 hover:text-indigo-700 uppercase tracking-wider transition-colors"
                                >
                                    Прочитать все
                                </button>
                            )}
                            {activeTab === 'HISTORY' && allNotifications.length > 0 && (
                                <button
                                    onClick={handleClearHistory}
                                    className="text-[10px] font-bold text-red-400 hover:text-red-600 uppercase tracking-wider transition-colors"
                                >
                                    Очистить историю
                                </button>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default NotificationBell;
