import React, { useState, useEffect } from 'react';
import { ScissorsIcon } from './icons';
import { ImageFile } from '../services/geminiService';
import { ImageDropzone, fileToImageFile } from './ImageDropzone';

interface BackgroundRemoverInputProps {
  isLoading: boolean;
  onGenerate: (image: ImageFile) => void;
  initialImage: {file: File, url: string} | null;
}

export const BackgroundRemoverInput: React.FC<BackgroundRemoverInputProps> = ({ isLoading, onGenerate, initialImage }) => {
    const [image, setImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    useEffect(() => {
        if (initialImage) {
            handleImageChange(initialImage.file);
        }
    }, [initialImage]);

    const handleImageChange = (file: File) => {
        setImage(file);
        setImagePreview(URL.createObjectURL(file));
    };

    const removeImage = () => {
        setImage(null);
        setImagePreview(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (image && !isLoading) {
            const imageFile = await fileToImageFile(image);
            onGenerate(imageFile);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="w-full bg-gray-800 p-6 rounded-lg shadow-lg">
            <div className="flex flex-col items-center gap-6 mb-6">
                <ImageDropzone 
                    label="Image to Edit"
                    helpText="Upload an image to remove its background."
                    imagePreview={imagePreview}
                    onImageChange={handleImageChange}
                    onImageRemove={removeImage}
                    className="h-64"
                />
            </div>
             <div className="relative group w-full">
                <button 
                    type="submit" 
                    disabled={isLoading || !image} 
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center transition-colors disabled:bg-gray-500 disabled:cursor-not-allowed"
                >
                    <ScissorsIcon className="h-5 w-5 mr-2" />
                    {isLoading ? 'Removing Background...' : 'Remove Background'}
                </button>
                <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-max max-w-xs bg-gray-900/90 backdrop-blur-sm text-white text-xs rounded-lg py-1.5 px-3 opacity-0 group-hover:opacity-100 group-hover:scale-100 scale-95 transition-all duration-300 pointer-events-none">
                   Start the background removal process.
                   <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-gray-900/90"></div>
                </div>
            </div>
        </form>
    );
};