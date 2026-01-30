import { useState, useRef } from 'react';

const PhotoUpload = ({ currentPhoto, onPhotoChange, label = "Загрузить фото", disabled = false }) => {
    const [preview, setPreview] = useState(currentPhoto);
    const fileInputRef = useRef(null);

    const handleFileSelect = async (e) => {
        if (disabled) return;
        const file = e.target.files?.[0];
        if (!file) return;

        // Create preview
        const reader = new FileReader();
        reader.onloadend = () => {
            setPreview(reader.result);
        };
        reader.readAsDataURL(file);

        // Convert to base64 for backend
        const base64 = await convertToBase64(file);
        onPhotoChange(base64);
    };

    const convertToBase64 = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = (error) => reject(error);
        });
    };

    const handleCameraClick = () => {
        if (disabled) return;
        // Trigger file input with camera capture
        fileInputRef.current.setAttribute('capture', 'environment');
        fileInputRef.current.click();
    };

    const handleGalleryClick = () => {
        if (disabled) return;
        // Trigger file input without camera capture
        fileInputRef.current.removeAttribute('capture');
        fileInputRef.current.click();
    };

    return (
        <div className={`space-y-2 ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
                disabled={disabled}
            />

            {preview ? (
                <div className="relative group overflow-hidden rounded-xl border-2 border-slate-200">
                    <img
                        src={preview}
                        alt="Preview"
                        className="w-full h-48 sm:h-56 object-cover"
                    />
                    {!disabled && (
                        <div className="absolute bottom-0 inset-x-0 bg-slate-900/70 backdrop-blur-sm p-3 flex items-center justify-center gap-3">
                            <button
                                onClick={handleCameraClick}
                                className="flex-1 py-2.5 bg-white text-slate-800 rounded-lg font-bold text-xs flex items-center justify-center gap-2 active:scale-95 transition-transform"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path>
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path>
                                </svg>
                                КАМЕРА
                            </button>
                            <button
                                onClick={handleGalleryClick}
                                className="flex-1 py-2.5 bg-slate-800 text-white rounded-lg font-bold text-xs flex items-center justify-center gap-2 active:scale-95 transition-transform"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                                </svg>
                                ГАЛЕРЕЯ
                            </button>
                        </div>
                    )}
                </div>
            ) : (
                <div className={`border-2 border-dashed border-slate-300 rounded-xl p-5 sm:p-8 text-center bg-slate-50/50 ${disabled ? 'opacity-50' : ''}`}>
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm border border-slate-100">
                            <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                            </svg>
                        </div>
                        <div className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">{label}</div>

                        <div className="flex gap-3 w-full max-w-xs">
                            <button
                                onClick={handleCameraClick}
                                disabled={disabled}
                                className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-100 active:scale-95 transition-transform"
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
                                className="flex-1 py-3 bg-slate-800 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-slate-100 active:scale-95 transition-transform"
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
