import React, { useState, useRef, DragEvent } from 'react';
import { UploadIcon, CloseIcon } from './icons';
import { ImageFile } from '../services/geminiService';

interface ImageDropzoneProps {
    label: string;
    helpText: string;
    imagePreview: string | null;
    onImageChange: (file: File) => void;
    onImageRemove: () => void;
    className?: string;
}

export const fileToImageFile = (file: File): Promise<ImageFile> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => {
            if (event.target && typeof event.target.result === 'string') {
                const base64 = event.target.result.split(',')[1];
                resolve({ data: base64, type: file.type });
            } else {
                reject(new Error('Failed to read file.'));
            }
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
};

export const urlToImageFile = async (url: string): Promise<{ file: File, imageFile: ImageFile }> => {
    const response = await fetch(url);
    const blob = await response.blob();
    const file = new File([blob], "imported_image.png", { type: blob.type });
    const imageFile = await fileToImageFile(file);
    return { file, imageFile };
};

export const ImageDropzone: React.FC<ImageDropzoneProps> = ({ label, helpText, imagePreview, onImageChange, onImageRemove, className = '' }) => {
    const [isDragging, setIsDragging] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            onImageChange(file);
        }
    };

    const handleRemove = (e: React.MouseEvent) => {
        e.stopPropagation();
        onImageRemove();
        if (inputRef.current) inputRef.current.value = "";
    };
    
    const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };
    const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };
    const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
    };
    const handleDrop = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file && file.type.startsWith('image/')) {
            onImageChange(file);
        }
    };

    const containerClasses = `flex flex-col items-center justify-center p-4 border-2 border-dashed rounded-lg w-full h-full transition-colors ${isDragging ? 'border-purple-500 bg-purple-900/50' : 'border-gray-600'}`;

    return (
        <div 
            className={`${containerClasses} ${className}`}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
        >
            <h3 className="text-lg font-semibold text-gray-300 mb-2">{label}</h3>
            {imagePreview ? (
                <div className="relative">
                    <img src={imagePreview} alt="Preview" className="h-40 w-auto max-w-full object-contain rounded-md" />
                    <button type="button" onClick={handleRemove} className="absolute top-0 right-0 -mt-2 -mr-2 bg-red-600 rounded-full p-1 text-white z-10" title="Remove image">
                        <CloseIcon className="h-4 w-4"/>
                    </button>
                </div>
            ) : (
                <div className="relative group cursor-pointer">
                    <div className="flex flex-col items-center text-gray-400 hover:text-white h-40 w-40 justify-center">
                        <UploadIcon className="h-8 w-8 mb-2" />
                        <span>Upload or Drop</span>
                        <input type="file" accept="image/*" ref={inputRef} onChange={handleFileChange} className="hidden" />
                    </div>
                    <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-max max-w-xs bg-gray-900/90 backdrop-blur-sm text-white text-xs rounded-lg py-1.5 px-3 opacity-0 group-hover:opacity-100 group-hover:scale-100 scale-95 transition-all duration-300 pointer-events-none">
                        {helpText}
                        <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-gray-900/90"></div>
                    </div>
                </div>
            )}
        </div>
    );
};