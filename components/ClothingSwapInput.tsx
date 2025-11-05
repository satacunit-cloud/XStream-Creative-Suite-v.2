import React, { useState, useEffect } from 'react';
import { ShirtIcon } from './icons';
import { ImageFile } from '../services/geminiService';
import { ImageDropzone, fileToImageFile } from './ImageDropzone';

interface ClothingSwapInputProps {
  isLoading: boolean;
  onGenerate: (personImage: ImageFile, clothingImage: ImageFile) => void;
  onStartOver: () => void;
  initialImage: {file: File, url: string} | null;
}

export const ClothingSwapInput: React.FC<ClothingSwapInputProps> = ({ isLoading, onGenerate, onStartOver, initialImage }) => {
    const [personImage, setPersonImage] = useState<File | null>(null);
    const [personImagePreview, setPersonImagePreview] = useState<string | null>(null);
    const [clothingImage, setClothingImage] = useState<File | null>(null);
    const [clothingImagePreview, setClothingImagePreview] = useState<string | null>(null);

    useEffect(() => {
        if (initialImage) {
            // Decide which uploader to populate. Let's assume the user wants to swap clothing ONTO the library image.
            handlePersonImageChange(initialImage.file);
        }
    }, [initialImage]);

    const handlePersonImageChange = (file: File) => {
        setPersonImage(file);
        setPersonImagePreview(URL.createObjectURL(file));
    };

    const handleClothingImageChange = (file: File) => {
        setClothingImage(file);
        setClothingImagePreview(URL.createObjectURL(file));
    };

    const removePersonImage = () => {
        setPersonImage(null);
        setPersonImagePreview(null);
    };

    const removeClothingImage = () => {
        setClothingImage(null);
        setClothingImagePreview(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (personImage && clothingImage && !isLoading) {
            const personImageFile = await fileToImageFile(personImage);
            const clothingImageFile = await fileToImageFile(clothingImage);
            onGenerate(personImageFile, clothingImageFile);
        }
    };

    const handleReset = () => {
        removePersonImage();
        removeClothingImage();
        onStartOver();
    }

    return (
        <form onSubmit={handleSubmit} className="w-full bg-gray-800 p-6 rounded-lg shadow-lg">
            <div className="flex flex-col md:flex-row gap-6 mb-6">
                <ImageDropzone 
                    label="Photo of Person"
                    helpText="Upload the photo of the person who will wear the clothes."
                    imagePreview={personImagePreview}
                    onImageChange={handlePersonImageChange}
                    onImageRemove={removePersonImage}
                />
                <ImageDropzone 
                    label="Photo of Clothing"
                    helpText="Upload the photo of the clothing item."
                    imagePreview={clothingImagePreview}
                    onImageChange={handleClothingImageChange}
                    onImageRemove={removeClothingImage}
                />
            </div>
            <div className="flex gap-4">
                 <div className="relative group w-full">
                    <button type="button" onClick={handleReset} className="w-full bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-4 rounded-lg">Reset</button>
                    <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-max max-w-xs bg-gray-900/90 backdrop-blur-sm text-white text-xs rounded-lg py-1.5 px-3 opacity-0 group-hover:opacity-100 group-hover:scale-100 scale-95 transition-all duration-300 pointer-events-none">
                        Clear both uploaded images.
                        <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-gray-900/90"></div>
                    </div>
                </div>
                 <div className="relative group w-full">
                    <button 
                        type="submit" 
                        disabled={isLoading || !personImage || !clothingImage} 
                        className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center transition-colors disabled:bg-gray-500 disabled:cursor-not-allowed"
                    >
                        <ShirtIcon className="h-5 w-5 mr-2" />
                        {isLoading ? 'Generating...' : 'Generate Clothing Swap (BETA)'}
                    </button>
                     <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-max max-w-xs bg-gray-900/90 backdrop-blur-sm text-white text-xs rounded-lg py-1.5 px-3 opacity-0 group-hover:opacity-100 group-hover:scale-100 scale-95 transition-all duration-300 pointer-events-none">
                        Start the clothing swap process.
                        <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-gray-900/90"></div>
                    </div>
                </div>
            </div>
        </form>
    );
};