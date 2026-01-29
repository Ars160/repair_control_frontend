import { useState, useEffect } from 'react';
import PhotoUpload from './PhotoUpload';
import api from '../api/client';

const ChecklistSection = ({ taskId, checklists, onUpdate, readOnly = false, canRemark = false }) => {
    const [items, setItems] = useState(checklists || []);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (checklists) {
            setItems(checklists);
        }
    }, [checklists]);

    const toggleChecklistComplete = async (itemId, currentStatus) => {
        const item = items.find(i => i.id === itemId);
        const newStatus = !currentStatus;

        // If unchecking an item with a photo - ask for confirmation
        if (currentStatus === true && item.photoUrl) {
            if (!window.confirm("При отмене выполнения прикрепленное фото будет удалено. Продолжить?")) {
                return;
            }
            // Remove photo if confirmed
            await handlePhotoUpdate(itemId, null);
        }

        // If checking an item that requires a photo but has none - DO NOT ALLOW
        if (newStatus === true && item.isPhotoRequired && !item.photoUrl) {
            alert("Для этого пункта обязательно необходимо прикрепить фотографию перед отметкой о выполнении.");
            return; // Exit without toggling
        }

        setLoading(true);
        const result = await api.toggleChecklistComplete(itemId, newStatus);
        if (result.success) {
            setItems(items.map(item =>
                item.id === itemId ? { ...item, isCompleted: newStatus } : item
            ));
            onUpdate?.();
        }
        setLoading(false);
    };

    const handlePhotoUpdate = async (itemId, photoUrl) => {
        setLoading(true);
        const result = await api.updateChecklistPhoto(itemId, photoUrl);
        if (result.success) {
            // Auto-complete if photo is added
            if (photoUrl && !items.find(i => i.id === itemId).isCompleted) {
                await api.toggleChecklistComplete(itemId, true);
                setItems(items.map(item =>
                    item.id === itemId ? { ...item, photoUrl, isCompleted: true } : item
                ));
            } else {
                setItems(items.map(item =>
                    item.id === itemId ? { ...item, photoUrl } : item
                ));
            }
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

    const allCompleted = items.every(item => item.isCompleted && (!item.isPhotoRequired || item.photoUrl));

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-slate-800">Чек-лист выполнения</h3>
                {!readOnly && (
                    <div className="text-xs">
                        <span className={`font-bold ${allCompleted ? 'text-emerald-600' : 'text-amber-600'}`}>
                            {items.filter(i => i.isCompleted && (!i.isPhotoRequired || i.photoUrl)).length} / {items.length}
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
                            <div
                                key={item.id}
                                className={`p-4 rounded-xl border-2 transition-all ${item.isCompleted && (!item.isPhotoRequired || item.photoUrl)
                                    ? 'bg-emerald-50 border-emerald-200'
                                    : 'bg-white border-slate-200'
                                    }`}
                            >
                                <div className="flex items-start gap-3 mb-3">
                                    <div className="flex items-center gap-2 flex-1">
                                        {!readOnly ? (
                                            <div className="relative">
                                                <input
                                                    type="checkbox"
                                                    checked={item.isCompleted || false}
                                                    onChange={() => toggleChecklistComplete(item.id, item.isCompleted)}
                                                    disabled={loading}
                                                    className={`w-6 h-6 rounded-lg border-2 transition-all ${item.isCompleted ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300 text-transparent hover:border-indigo-400'}`}
                                                />
                                                {item.isPhotoRequired && !item.photoUrl && (
                                                    <span className="absolute -top-1 -right-1 flex h-3 w-3">
                                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                                        <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                                                    </span>
                                                )}
                                            </div>
                                        ) : (
                                            <div className={`w-5 h-5 rounded flex items-center justify-center ${item.isCompleted ? 'bg-emerald-500 text-white' : 'bg-slate-200'
                                                }`}>
                                                {item.isCompleted && '✓'}
                                            </div>
                                        )}
                                        <div>
                                            <span className="text-[10px] font-bold text-slate-400">Пункт #{index + 1}</span>
                                            <p className={`text-sm font-medium ${item.isCompleted ? 'text-slate-600' : 'text-slate-800'}`}>
                                                {item.description}
                                            </p>
                                        </div>
                                    </div>
                                    {item.photoUrl && (
                                        <div className="w-6 h-6 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                                            </svg>
                                        </div>
                                    )}
                                </div>

                                {!readOnly && (
                                    <div className="space-y-3">
                                        {item.isPhotoRequired && (
                                            <PhotoUpload
                                                currentPhoto={item.photoUrl}
                                                onPhotoChange={(photo) => handlePhotoUpdate(item.id, photo)}
                                                label={!item.isCompleted ? "Загрузить обязательное фото" : `Фото для пункта #${index + 1}`}
                                                disabled={loading}
                                            />
                                        )}
                                        {item.remark && (
                                            <div className="bg-amber-50 border border-amber-100 p-3 rounded-lg">
                                                <p className="text-xs font-bold text-amber-700 uppercase tracking-wider mb-1">Замечание от проверяющего:</p>
                                                <p className="text-sm text-amber-800 italic">"{item.remark}"</p>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {readOnly && (
                                    <div className="space-y-3">
                                        {item.photoUrl && (
                                            <img
                                                src={item.photoUrl}
                                                alt={`Пункт ${index + 1}`}
                                                className="w-full h-48 object-cover rounded-lg mt-2 border border-slate-100"
                                            />
                                        )}
                                        {item.remark && !canRemark && (
                                            <div className="bg-amber-50 border border-amber-100 p-3 rounded-lg">
                                                <p className="text-xs font-bold text-amber-700 uppercase tracking-wider mb-1">Замечание:</p>
                                                <p className="text-sm text-amber-800 italic">"{item.remark}"</p>
                                            </div>
                                        )}
                                        {canRemark && (
                                            <div className="mt-3">
                                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Замечание к этому пункту</label>
                                                <div className="flex gap-2">
                                                    <input
                                                        type="text"
                                                        placeholder="Напишите замечание, если нужно..."
                                                        defaultValue={item.remark || ''}
                                                        onBlur={(e) => handleRemarkUpdate(item.id, e.target.value)}
                                                        className="flex-1 px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                </div>
            )}
        </div>
    );
};

export default ChecklistSection;
