import { useState, useRef, useCallback } from 'react';

const PhotoUpload = ({ currentPhoto, onPhotoChange, label = "Загрузить фото", disabled = false }) => {
    const [preview, setPreview] = useState(currentPhoto);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef(null);

    const handleFileSelect = async (e) => {
        if (disabled) return;
        const file = e.target.files?.[0];
        if (!file) return;
        await processFile(file);
    };

    const processFile = (file) => {
        if (!file.type.startsWith('image/')) {
            alert('Пожалуйста, загрузите изображение');
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            const img = new Image();
            img.onload = () => {
                // Resize to max 1920px on longest side, compress to 85% JPEG
                const MAX_SIZE = 1920;
                let { width, height } = img;
                if (width > MAX_SIZE || height > MAX_SIZE) {
                    if (width > height) {
                        height = Math.round(height * MAX_SIZE / width);
                        width = MAX_SIZE;
                    } else {
                        width = Math.round(width * MAX_SIZE / height);
                        height = MAX_SIZE;
                    }
                }
                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                const compressed = canvas.toDataURL('image/jpeg', 0.85);
                setPreview(compressed);
                onPhotoChange(compressed);
            };
            img.src = reader.result;
        };
        reader.readAsDataURL(file);
    };

    const convertToBase64 = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = (error) => reject(error);
        });
    };

    const handleDragOver = useCallback((e) => {
        e.preventDefault();
        if (disabled) return;
        setIsDragging(true);
    }, [disabled]);

    const handleDragLeave = useCallback((e) => {
        e.preventDefault();
        if (disabled) return;
        setIsDragging(false);
    }, [disabled]);

    const handleDrop = useCallback(async (e) => {
        e.preventDefault();
        if (disabled) return;
        setIsDragging(false);

        const file = e.dataTransfer.files?.[0];
        if (file) {
            await processFile(file);
        }
    }, [disabled]);

    const handleCameraClick = (e) => {
        e.stopPropagation();
        if (disabled) return;
        fileInputRef.current.setAttribute('capture', 'environment');
        fileInputRef.current.click();
    };

    const handleGalleryClick = (e) => {
        e.stopPropagation();
        if (disabled) return;
        fileInputRef.current.removeAttribute('capture');
        fileInputRef.current.click();
    };

    const clearPhoto = (e) => {
        e.stopPropagation();
        if (disabled) return;
        setPreview(null);
        onPhotoChange(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <div className={`space-y-2 ${disabled ? 'opacity-60 grayscale' : ''}`}>
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
                disabled={disabled}
            />

            {preview ? (
                <div className="space-y-3">
                    <div className="relative overflow-hidden rounded-2xl border-2 border-slate-200 shadow-sm">
                        <img
                            src={preview}
                            alt="Preview"
                            className="w-full h-56 sm:h-64 object-cover"
                        />

                        {!disabled && (
                            <button
                                onClick={clearPhoto}
                                className="absolute top-3 right-3 p-2 bg-black/40 backdrop-blur-md hover:bg-black/60 text-white rounded-full transition-colors"
                                title="Удалить фото"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                                </svg>
                            </button>
                        )}
                    </div>

                    {!disabled && (
                        <div className="flex gap-2">
                            <button
                                onClick={handleCameraClick}
                                className="flex-1 py-3 bg-white border-2 border-slate-200 text-slate-700 rounded-xl font-bold text-xs flex items-center justify-center gap-2 hover:bg-slate-50 active:scale-95 transition-all"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path>
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path>
                                </svg>
                                Переснять
                            </button>
                            <button
                                onClick={handleGalleryClick}
                                className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-sm hover:bg-indigo-700 active:scale-95 transition-all"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                                </svg>
                                Из галереи
                            </button>
                        </div>
                    )}
                </div>
            ) : (
                <div
                    className={`relative border-2 border-dashed rounded-2xl p-6 sm:p-10 text-center transition-all duration-300 ${isDragging
                        ? 'border-indigo-500 bg-indigo-50/50 scale-[1.02]'
                        : 'border-slate-300 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-400'
                        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => !disabled && handleGalleryClick({ stopPropagation: () => { } })}
                >
                    <div className="flex flex-col items-center gap-4 pointer-events-none">
                        <div className={`w-14 h-14 rounded-full flex items-center justify-center shadow-sm border transaction-colors duration-300 ${isDragging ? 'bg-indigo-100 border-indigo-200 text-indigo-600' : 'bg-white border-slate-100 text-slate-400'
                            }`}>
                            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                            </svg>
                        </div>
                        <div>
                            <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">{label}</div>
                            <div className="text-[10px] text-slate-400">Нажмите или перетащите фото сюда</div>
                        </div>

                        <div className="flex gap-3 w-full max-w-xs mt-2 pointer-events-auto">
                            <button
                                onClick={handleCameraClick}
                                disabled={disabled}
                                className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-100 hover:bg-indigo-700 active:scale-95 transition-all"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path>
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path>
                                </svg>
                                КАМЕРА
                            </button>
                            <button
                                onClick={handleGalleryClick}
                                disabled={disabled}
                                className="flex-1 py-3 bg-slate-800 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-slate-200 hover:bg-slate-700 active:scale-95 transition-all"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                                </svg>
                                ГАЛЕРЕЯ
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PhotoUpload;
