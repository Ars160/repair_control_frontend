import { useState, useEffect } from 'react';
import PhotoUpload from './PhotoUpload';
import api from '../api/client';

const ChecklistSection = ({ taskId, checklists, onUpdate, readOnly = false }) => {
    const [items, setItems] = useState(checklists || []);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (checklists) {
            setItems(checklists);
        }
    }, [checklists]);

    const handleToggleComplete = async (itemId, currentStatus) => {
        setLoading(true);
        const result = await api.toggleChecklistComplete(itemId, !currentStatus);
        if (result.success) {
            setItems(items.map(item =>
                item.id === itemId ? { ...item, isCompleted: !currentStatus } : item
            ));
            onUpdate?.();
        }
        setLoading(false);
    };

    const handlePhotoUpdate = async (itemId, photoUrl) => {
        setLoading(true);
        const result = await api.updateChecklistPhoto(itemId, photoUrl);
        if (result.success) {
            setItems(items.map(item =>
                item.id === itemId ? { ...item, photoUrl } : item
            ));
            onUpdate?.();
        }
        setLoading(false);
    };

    const allCompleted = items.every(item => item.isCompleted && item.photoUrl);

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-slate-800">Чек-лист выполнения</h3>
                {!readOnly && (
                    <div className="text-xs">
                        <span className={`font-bold ${allCompleted ? 'text-emerald-600' : 'text-amber-600'}`}>
                            {items.filter(i => i.isCompleted && i.photoUrl).length} / {items.length}
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
                                className={`p-4 rounded-xl border-2 transition-all ${item.isCompleted && item.photoUrl
                                    ? 'bg-emerald-50 border-emerald-200'
                                    : 'bg-white border-slate-200'
                                    }`}
                            >
                                <div className="flex items-start gap-3 mb-3">
                                    <div className="flex items-center gap-2 flex-1">
                                        {!readOnly ? (
                                            <input
                                                type="checkbox"
                                                checked={item.isCompleted}
                                                onChange={() => handleToggleComplete(item.id, item.isCompleted)}
                                                disabled={loading}
                                                className="w-5 h-5 rounded border-2 border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                            />
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
                                    <PhotoUpload
                                        currentPhoto={item.photoUrl}
                                        onPhotoChange={(photo) => handlePhotoUpdate(item.id, photo)}
                                        label={`Фото для пункта #${index + 1}`}
                                    />
                                )}

                                {readOnly && item.photoUrl && (
                                    <img
                                        src={item.photoUrl}
                                        alt={`Пункт ${index + 1}`}
                                        className="w-full h-48 object-cover rounded-lg mt-2"
                                    />
                                )}
                            </div>
                        ))}
                </div>
            )}
        </div>
    );
};

export default ChecklistSection;
