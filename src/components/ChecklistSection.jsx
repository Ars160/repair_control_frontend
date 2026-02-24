import { useState, useEffect } from 'react';
import PhotoUpload from './PhotoUpload';
import api from '../api/client';
import { useAuth } from '../hooks/useAuth';
import { ROLES } from '../utils/mockData';

const ChecklistItem = ({
    item,
    index,
    readOnly,
    isWorker,
    loading,
    onToggle,
    onPhotoUpdate,
    onRemarkUpdate,
    canRemark
}) => {
    const [showMethodology, setShowMethodology] = useState(false);
    const isEffectivelyCompleted = item.isCompleted && !item.remark;

    return (
        <div
            className={`group relative p-5 rounded-2xl border transition-all duration-300 ${isEffectivelyCompleted && (!item.isPhotoRequired || item.photoUrl)
                ? 'bg-emerald-50/50 border-emerald-200/60 shadow-sm'
                : item.remark
                    ? 'bg-red-50/50 border-red-200 shadow-md ring-1 ring-red-100'
                    : 'bg-white border-slate-200 hover:border-indigo-300 hover:shadow-md'
                }`}
        >
            <div className="flex items-start gap-4 mb-4">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                    {!readOnly ? (
                        <div className="relative shrink-0 w-7 h-7">
                            <input
                                type="checkbox"
                                checked={isEffectivelyCompleted}
                                onChange={() => onToggle(item.id, item.isCompleted)}
                                disabled={loading}
                                className={`appearance-none w-7 h-7 rounded-xl border-2 transition-all cursor-pointer flex items-center justify-center outline-none focus:ring-4 focus:ring-indigo-100 absolute inset-0 z-10 ${isEffectivelyCompleted ? 'bg-indigo-600 border-indigo-600' : 'bg-white border-slate-300 hover:border-indigo-400'}`}
                            />
                            <svg
                                className={`absolute top-1 left-1 w-5 h-5 text-white pointer-events-none transition-transform duration-300 z-20 ${isEffectivelyCompleted ? 'scale-100' : 'scale-0'}`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
                            </svg>

                            {item.isPhotoRequired && !item.photoUrl && (
                                <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 z-30 pointer-events-none">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-4 w-4 bg-rose-500 border-2 border-white"></span>
                                </span>
                            )}
                        </div>
                    ) : (
                        <div className={`w-7 h-7 shrink-0 rounded-xl flex items-center justify-center ${item.isCompleted ? 'bg-emerald-500 text-white shadow-md shadow-emerald-200' : 'bg-slate-100 text-slate-300'
                            }`}>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
                            </svg>
                        </div>
                    )}
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">#{index + 1}</span>
                            {item.isPhotoRequired && (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100 uppercase tracking-wide">
                                    Фото
                                </span>
                            )}
                        </div>
                        <p className={`text-base font-semibold leading-snug transition-colors ${item.isCompleted ? 'text-slate-500 line-through decoration-slate-300' : 'text-slate-800'}`}>
                            {item.description}
                        </p>
                        {item.methodology && (
                            <div className="mt-2">
                                <button
                                    onClick={() => setShowMethodology(!showMethodology)}
                                    className="text-[10px] font-bold text-indigo-500 hover:text-indigo-700 uppercase tracking-wider flex items-center gap-1 transition-colors"
                                >
                                    <svg
                                        className={`w-3 h-3 transition-transform duration-200 ${showMethodology ? 'rotate-90' : ''}`}
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                    {showMethodology ? 'Скрыть методику' : 'Показать методику'}
                                </button>
                                {showMethodology && (
                                    <div className="mt-1 text-xs text-slate-600 bg-slate-50/80 p-3 rounded-lg border border-slate-100 animate-fadeIn leading-relaxed">
                                        {item.methodology}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
                {item.photoUrl && (
                    <div className="shrink-0 w-10 h-10 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center border border-emerald-200">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                        </svg>
                    </div>
                )}
            </div>

            {!readOnly && (
                <div className="space-y-4 pl-0 sm:pl-10">
                    {item.isPhotoRequired && !isWorker && (
                        <PhotoUpload
                            currentPhoto={item.photoUrl}
                            onPhotoChange={(photo) => onPhotoUpdate(item.id, photo)}
                            label={!item.isCompleted ? "Загрузить обязательное фото" : `Фото для пункта #${index + 1}`}
                            disabled={loading}
                        />
                    )}
                    {item.isPhotoRequired && isWorker && !item.photoUrl && item.isCompleted && (
                        <div className="flex items-center gap-3 text-xs text-amber-700 bg-amber-50 p-3 rounded-xl border border-amber-100">
                            <svg className="w-5 h-5 text-amber-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                            </svg>
                            <span className="font-medium">Фото результата загрузит прораб при проверке</span>
                        </div>
                    )}
                    {item.remark && (
                        <div className="bg-rose-50 border border-rose-100 p-4 rounded-2xl relative overflow-hidden group-hover:bg-rose-100/50 transition-colors">
                            <div className="absolute top-0 right-0 w-16 h-16 bg-rose-100 rounded-bl-full -mr-8 -mt-8 opacity-50"></div>
                            <div className="relative z-10">
                                <p className="flex items-center gap-2 text-[10px] font-bold text-rose-600 uppercase tracking-widest mb-1">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                                    </svg>
                                    Исправить
                                </p>
                                <p className="text-sm text-rose-800 font-medium italic leading-relaxed">"{item.remark}"</p>

                                {isWorker && item.isCompleted && (
                                    <div className="mt-3 flex">
                                        <div className="text-[10px] text-rose-600 bg-white/60 px-2 py-1 rounded border border-rose-100 flex items-center gap-1 animate-pulse">
                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                                            </svg>
                                            Снимите галочку, исправьте и отметьте снова
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                    {canRemark && (
                        <div className="mt-2">
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Замечание к этому пункту</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Напишите, что нужно исправить..."
                                    defaultValue={item.remark || ''}
                                    onBlur={(e) => onRemarkUpdate(item.id, e.target.value)}
                                    className="w-full pl-4 pr-4 py-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-400"
                                />
                            </div>
                        </div>
                    )}
                </div>
            )}

            {readOnly && (
                <div className="space-y-4 pl-0 sm:pl-10">
                    {item.photoUrl && (
                        <div className="relative group/photo rounded-xl overflow-hidden border border-slate-100 mt-2">
                            <img
                                src={item.photoUrl}
                                alt={`Пункт ${index + 1}`}
                                className="w-full h-56 object-cover transform transition-transform duration-700 group-hover/photo:scale-105"
                            />
                            <a
                                href={item.photoUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="absolute inset-0 bg-slate-900/0 group-hover/photo:bg-slate-900/30 transition-colors flex items-center justify-center opacity-0 group-hover/photo:opacity-100"
                            >
                                <div className="bg-white/90 backdrop-blur-sm p-2 rounded-lg shadow-lg">
                                    <svg className="w-5 h-5 text-slate-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"></path>
                                    </svg>
                                </div>
                            </a>
                        </div>
                    )}
                    {item.remark && !canRemark && (
                        <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl relative">
                            <p className="text-[10px] font-bold text-amber-700 uppercase tracking-widest mb-1">Замечание:</p>
                            <p className="text-sm text-amber-800 italic">"{item.remark}"</p>
                        </div>
                    )}
                    {canRemark && (
                        <div className="mt-3">
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Замечание к этому пункту</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Напишите замечание, если нужно..."
                                    defaultValue={item.remark || ''}
                                    onBlur={(e) => onRemarkUpdate(item.id, e.target.value)}
                                    className="w-full pl-4 pr-4 py-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-400"
                                />
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

const ChecklistSection = ({ taskId, checklists, onUpdate, readOnly = false, canRemark = false }) => {
    const [items, setItems] = useState(checklists || []);
    const [loading, setLoading] = useState(false);
    const { user } = useAuth();
    const isWorker = user?.role === ROLES.WORKER;

    useEffect(() => {
        if (checklists) {
            setItems(checklists);
        }
    }, [checklists]);

    const toggleChecklistComplete = async (itemId, currentStatus) => {
        const item = items.find(i => i.id === itemId);
        // Calculate effective status
        const isEffectiveComplete = item.isCompleted && !item.remark;
        // New status is opposite of effective status
        const newStatus = !isEffectiveComplete;

        // If unchecking an item with a photo - ask for confirmation
        if (isEffectiveComplete && item.photoUrl) {
            if (!window.confirm("При отмене выполнения прикрепленное фото будет удалено. Продолжить?")) {
                return;
            }
            // Remove photo if confirmed
            await handlePhotoUpdate(itemId, null);
        }

        // Check photo requirement logic
        if (newStatus === true && item.isPhotoRequired && !item.photoUrl) {
            if (isWorker) {
                // Worker can check without photo. The backend sends notification.
                // Proceed without blocking.
            } else {
                // Others (Foreman etc) must attach photo first
                alert("Для этого пункта обязательно необходимо прикрепить фотографию перед отметкой о выполнении.");
                return; // Exit without toggling
            }
        }

        setLoading(true);

        // We must call the API if the status is changing OR if there is a remark to clear (backend handles remark clearing on completion)
        if (item.isCompleted !== newStatus || (newStatus === true && item.remark)) {
            const toggleResult = await api.toggleChecklistComplete(itemId, newStatus);
            if (!toggleResult.success) {
                alert("Не удалось обновить статус. Попробуйте еще раз.");
                setLoading(false);
                return;
            }
        }

        // Update Local State
        setItems(items.map(mappedItem =>
            mappedItem.id === itemId ? {
                ...mappedItem,
                isCompleted: newStatus,
                remark: newStatus ? null : mappedItem.remark // Optimistic update: clear remark if checking
            } : mappedItem
        ));
        onUpdate?.();
        setLoading(false);
    };

    const handlePhotoUpdate = async (itemId, photoUrl) => {
        setLoading(true);

        const result = await api.updateChecklistPhoto(itemId, photoUrl);
        if (result.success) {
            // Use the real S3 URL returned from the server, not the raw base64
            const serverPhotoUrl = result.data?.photoUrl
                ? (result.data.photoUrl.startsWith('http') || result.data.photoUrl.startsWith('data:')
                    ? result.data.photoUrl
                    : `/files/${result.data.photoUrl}`)
                : null; // If deleted or error, set to null

            // Auto-complete if photo is added
            if (photoUrl && !items.find(i => i.id === itemId).isCompleted) {
                await api.toggleChecklistComplete(itemId, true);
                setItems(items.map(item =>
                    item.id === itemId ? { ...item, photoUrl: serverPhotoUrl, isCompleted: true, remark: null } : item
                ));
            } else {
                setItems(items.map(item =>
                    item.id === itemId ? { ...item, photoUrl: serverPhotoUrl } : item
                ));
            }
            onUpdate?.();
        } else if (!photoUrl) {
            // Even if API fails, if we're clearing, update locally for UX
            setItems(items.map(item =>
                item.id === itemId ? { ...item, photoUrl: null } : item
            ));
            onUpdate?.();
        }
        setLoading(false);
    };

    const handleRemarkUpdate = async (itemId, remark) => {
        setLoading(true);
        const result = await api.updateChecklistItemRemark(itemId, remark);
        if (result.success) {
            setItems(items.map(item =>
                item.id === itemId ? { ...item, remark } : item
            ));
            onUpdate?.();
        }
        setLoading(false);
    };

    const allCompleted = items.every(item => (item.isCompleted && !item.remark) && (!item.isPhotoRequired || item.photoUrl));

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-slate-800">Чек-лист выполнения</h3>
                {!readOnly && (
                    <div className="text-xs">
                        <span className={`font-bold ${allCompleted ? 'text-emerald-600' : 'text-amber-600'}`}>
                            {items.filter(i => (i.isCompleted && !i.remark) && (!i.isPhotoRequired || i.photoUrl)).length} / {items.length}
                        </span>
                        <span className="text-slate-400 ml-1">выполнено</span>
                    </div>
                )}
            </div>

            {items.length === 0 ? (
                <div className="text-center py-8 text-slate-400 bg-slate-50 rounded-xl">
                    Чек-лист не создан
                </div>
            ) : (
                <div className="space-y-3">
                    {(readOnly ? checklists : items)
                        ?.sort((a, b) => a.orderIndex - b.orderIndex)
                        .map((item, index) => (
                            <ChecklistItem
                                key={item.id}
                                item={item}
                                index={index}
                                readOnly={readOnly}
                                isWorker={isWorker}
                                loading={loading}
                                onToggle={toggleChecklistComplete}
                                onPhotoUpdate={handlePhotoUpdate}
                                onRemarkUpdate={handleRemarkUpdate}
                                canRemark={canRemark}
                            />
                        ))}
                </div>
            )}
        </div>
    );
};

export default ChecklistSection;
