import { useState, useEffect } from 'react';
import api from '../api/client';

const ChecklistTemplateManager = ({ onClose, onSelect }) => {
    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [newTemplate, setNewTemplate] = useState({ name: '', items: [] });
    const [newItemText, setNewItemText] = useState('');
    const [isPhotoRequired, setIsPhotoRequired] = useState(false);

    useEffect(() => {
        loadTemplates();
    }, []);

    const loadTemplates = async () => {
        setLoading(true);
        const data = await api.getTemplates();
        setTemplates(data);
        setLoading(false);
    };

    const handleAddItem = () => {
        if (!newItemText.trim()) return;
        setNewTemplate(prev => ({
            ...prev,
            items: [...prev.items, {
                description: newItemText,
                isPhotoRequired: isPhotoRequired,
                orderIndex: prev.items.length
            }]
        }));
        setNewItemText('');
        setIsPhotoRequired(false);
    };

    const handleRemoveItem = (index) => {
        setNewTemplate(prev => ({
            ...prev,
            items: prev.items.filter((_, i) => i !== index)
        }));
    };

    const handleCreateTemplate = async (e) => {
        e.preventDefault();
        if (newTemplate.items.length === 0) {
            alert("Добавьте хотя бы один пункт чеклиста");
            return;
        }

        const res = await api.createTemplate(newTemplate);
        if (res.success) {
            setTemplates([...templates, res.data]);
            setShowCreate(false);
            setNewTemplate({ name: '', items: [] });
        } else {
            alert(res.message);
        }
    };

    const handleDeleteTemplate = async (id, e) => {
        e.stopPropagation();
        if (window.confirm("Удалить этот шаблон?")) {
            const res = await api.deleteTemplate(id);
            if (res.success) {
                setTemplates(templates.filter(t => t.id !== id));
            } else {
                alert(res.message);
            }
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
                <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <h2 className="text-xl font-bold text-gray-800">Шаблоны чеклистов</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                    {loading ? (
                        <div className="text-center text-gray-400">Загрузка...</div>
                    ) : showCreate ? (
                        <div className="animate-fadeIn">
                            <h3 className="font-bold text-lg mb-4 text-gray-700">Новый шаблон</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Название шаблона</label>
                                    <input
                                        className="w-full border-gray-300 rounded-lg p-2.5 focus:ring-indigo-500 focus:border-indigo-500"
                                        placeholder="Например: Покраска стен"
                                        value={newTemplate.name}
                                        onChange={e => setNewTemplate({ ...newTemplate, name: e.target.value })}
                                    />
                                </div>

                                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                                    <h4 className="text-sm font-bold text-gray-600 mb-2 uppercase">Пункты чеклиста</h4>
                                    <div className="space-y-2 mb-3">
                                        {newTemplate.items.map((item, idx) => (
                                            <div key={idx} className="flex items-center gap-2 bg-white p-2 rounded border border-gray-200">
                                                <span className="text-xs font-bold text-gray-400">#{idx + 1}</span>
                                                <span className="flex-1 text-sm">{item.description}</span>
                                                {item.isPhotoRequired && (
                                                    <span className="text-[10px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded font-bold">ФОТО</span>
                                                )}
                                                <button onClick={() => handleRemoveItem(idx)} className="text-red-400 hover:text-red-600">×</button>
                                            </div>
                                        ))}
                                        {newTemplate.items.length === 0 && (
                                            <div className="text-center text-gray-400 text-sm italic py-2">Список пуст</div>
                                        )}
                                    </div>

                                    <div className="flex gap-2">
                                        <input
                                            className="flex-1 border-gray-300 rounded text-sm p-2"
                                            placeholder="Описание пункта..."
                                            value={newItemText}
                                            onChange={e => setNewItemText(e.target.value)}
                                            onKeyDown={e => e.key === 'Enter' && handleAddItem()}
                                        />
                                        <div className="flex items-center bg-white px-2 rounded border border-gray-300">
                                            <input
                                                type="checkbox"
                                                id="photoReq"
                                                checked={isPhotoRequired}
                                                onChange={e => setIsPhotoRequired(e.target.checked)}
                                                className="mr-1.5 text-indigo-600 focus:ring-indigo-500"
                                            />
                                            <label htmlFor="photoReq" className="text-xs text-gray-600 cursor-pointer select-none">Фото</label>
                                        </div>
                                        <button
                                            onClick={handleAddItem}
                                            disabled={!newItemText.trim()}
                                            className="bg-gray-200 text-gray-700 px-3 py-2 rounded text-sm font-bold hover:bg-gray-300 disabled:opacity-50"
                                        >
                                            +
                                        </button>
                                    </div>
                                </div>

                                <div className="flex gap-3 pt-2">
                                    <button
                                        onClick={handleCreateTemplate}
                                        disabled={!newTemplate.name || newTemplate.items.length === 0}
                                        className="flex-1 bg-indigo-600 text-white py-2.5 rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Создать шаблон
                                    </button>
                                    <button
                                        onClick={() => setShowCreate(false)}
                                        className="px-6 bg-white border border-gray-300 text-gray-700 py-2.5 rounded-xl font-bold hover:bg-gray-50"
                                    >
                                        Отмена
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <button
                                onClick={() => setShowCreate(true)}
                                className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-indigo-200 rounded-xl bg-indigo-50/50 hover:bg-indigo-50 hover:border-indigo-400 transition-all group"
                            >
                                <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-500 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                    </svg>
                                </div>
                                <span className="text-sm font-bold text-indigo-600">Создать шаблон</span>
                            </button>

                            {templates.map(template => (
                                <div
                                    key={template.id}
                                    className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer relative group"
                                    onClick={() => onSelect && onSelect(template)}
                                >
                                    <h4 className="font-bold text-gray-800 mb-1">{template.name}</h4>
                                    <p className="text-xs text-gray-500 mb-3">{template.items?.length || 0} пунктов</p>
                                    <div className="space-y-1">
                                        {template.items?.slice(0, 2).map((item, i) => (
                                            <div key={i} className="text-xs text-gray-600 truncate flex items-center gap-1">
                                                <span className="w-1.5 h-1.5 rounded-full bg-gray-300"></span>
                                                {item.description}
                                            </div>
                                        ))}
                                        {template.items?.length > 2 && (
                                            <div className="text-[10px] text-gray-400 pl-2.5">+{template.items.length - 2} еще...</div>
                                        )}
                                    </div>

                                    <button
                                        onClick={(e) => handleDeleteTemplate(template.id, e)}
                                        className="absolute top-2 right-2 p-1.5 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                        title="Удалить шаблон"
                                    >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ChecklistTemplateManager;
