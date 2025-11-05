import React from 'react';

interface LightboxProps {
    imageUrl: string;
    onClose: () => void;
}

export const Lightbox: React.FC<LightboxProps> = ({ imageUrl, onClose }) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4 fade-in" onClick={onClose}>
            <button
                className="absolute top-4 right-4 text-white text-4xl hover:text-gray-300 z-10"
                onClick={onClose}
                aria-label="Close lightbox"
            >
                &times;
            </button>
            <div className="relative max-w-full max-h-full" onClick={(e) => e.stopPropagation()}>
                <img src={imageUrl} alt="Lightbox view" className="max-w-full max-h-[90vh] object-contain rounded-lg" />
            </div>
        </div>
    );
};