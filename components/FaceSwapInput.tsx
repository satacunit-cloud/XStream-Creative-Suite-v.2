import React, { useState, useEffect } from 'react';
import { UsersIcon } from './icons';
import { ImageFile } from '../services/geminiService';
import { ImageDropzone, fileToImageFile } from './ImageDropzone';

interface FaceSwapInputProps {
  isLoading: boolean;
  onGenerate: (sourceImage: ImageFile, faceImage: ImageFile) => void;
  onStartOver: () => void;
  initialImage: {file: File, url: string} | null;
}

export const FaceSwapInput: React.FC<FaceSwapInputProps> = ({ isLoading, onGenerate, onStartOver, initialImage }) => {
    const [sourceImage, setSourceImage] = useState<File | null>(null);
    const [sourceImagePreview, setSourceImagePreview] = useState<string | null>(null);
    const [faceImage, setFaceImage] = useState<File | null>(null);
    const [faceImagePreview, setFaceImagePreview] = useState<string | null>(null);

    useEffect(() => {
        if (initialImage) {
            handleSourceImageChange(initialImage.file);
        }
    }, [initialImage]);

    const handleSourceImageChange = (file: File) => {
        setSourceImage(file);
        setSourceImagePreview(URL.createObjectURL(file));
    };

    const handleFaceImageChange = (file: File) => {
        setFaceImage(file);
        setFaceImagePreview(URL.createObjectURL(file));
    };

    const removeSourceImage = () => {
        setSourceImage(null);
        setSourceImagePreview(null);
    };

    const removeFaceImage = () => {
        setFaceImage(null);
        setFaceImagePreview(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (sourceImage && faceImage && !isLoading) {
            const sourceImageFile = await fileToImageFile(sourceImage);
            const faceImageFile = await fileToImageFile(faceImage);
            onGenerate(sourceImageFile, faceImageFile);
        }
    };
    
    const handleReset = () => {
        removeSourceImage();
        removeFaceImage();
        onStartOver();
    }

    return (
        <form onSubmit={handleSubmit} className="w-full bg-gray-800 p-6 rounded-lg shadow-lg">
            <div className="flex flex-col md:flex-row gap-6 mb-6">
                <ImageDropzone 
                    label="Original Photo"
                    helpText="Upload the main image here."
                    imagePreview={sourceImagePreview}
                    onImageChange={handleSourceImageChange}
                    onImageRemove={removeSourceImage}
                />
                <ImageDropzone 
                    label="Face to Use"
                    helpText="Upload an image with the face you want to use."
                    imagePreview={faceImagePreview}
                    onImageChange={handleFaceImageChange}
                    onImageRemove={removeFaceImage}
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
                        disabled={isLoading || !sourceImage || !faceImage} 
                        className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center transition-colors disabled:bg-gray-500 disabled:cursor-not-allowed"
                    >
                        <UsersIcon className="h-5 w-5 mr-2" />
                        {isLoading ? 'Generating...' : 'Generate Face Swap'}
                    </button>
                    <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-max max-w-xs bg-gray-900/90 backdrop-blur-sm text-white text-xs rounded-lg py-1.5 px-3 opacity-0 group-hover:opacity-100 group-hover:scale-100 scale-95 transition-all duration-300 pointer-events-none">
                       Start the face swap process.
                       <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-gray-900/90"></div>
                    </div>
                </div>
            </div>
        </form>
    );
};