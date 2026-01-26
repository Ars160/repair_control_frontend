import { useState, useRef } from 'react';

const PhotoUpload = ({ currentPhoto, onPhotoChange, label = "Загрузить фото" }) => {
    const [preview, setPreview] = useState(currentPhoto);
    const fileInputRef = useRef(null);

    const handleFileSelect = async (e) => {
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
        // Trigger file input with camera capture
        fileInputRef.current.setAttribute('capture', 'environment');
        fileInputRef.current.click();
    };

    const handleGalleryClick = () => {
        // Trigger file input without camera capture
        fileInputRef.current.removeAttribute('capture');
        fileInputRef.current.click();
    };

    return (
        <div className="space-y-2">
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
            />

            {preview ? (
                <div className="relative group">
                    <img
                        src={preview}
                        alt="Preview"
                        className="w-full h-48 object-cover rounded-lg border-2 border-slate-200"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
                        <button
                            onClick={handleCameraClick}
                            className="px-3 py-2 bg-white text-slate-800 rounded-lg font-bold text-sm hover:bg-slate-100"
                        >
                            📷 Камера
                        </button>
                        <button
                            onClick={handleGalleryClick}
                            className="px-3 py-2 bg-white text-slate-800 rounded-lg font-bold text-sm hover:bg-slate-100"
                        >
                            🖼️ Галерея
                        </button>
                    </div>
                </div>
            ) : (
                <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center space-y-3">
                    <div className="text-slate-400 text-sm mb-2">{label}</div>
                    <div className="flex gap-2 justify-center">
                        <button
                            onClick={handleCameraClick}
                            className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 flex items-center gap-2"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path>
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path>
                            </svg>
                            Камера
                        </button>
                        <button
                            onClick={handleGalleryClick}
                            className="px-4 py-2 bg-slate-600 text-white rounded-lg font-bold hover:bg-slate-700 flex items-center gap-2"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                            </svg>
                            Галерея
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PhotoUpload;
