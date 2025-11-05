
import React, { useState, useRef, useEffect } from 'react';
import { MotionIcon } from './icons';
import { ImageFile } from '../services/geminiService';
import { ImageDropzone, fileToImageFile } from './ImageDropzone';

interface CharacterAnimatorInputProps {
  isLoading: boolean;
  onAnimate: (characterImage: ImageFile, motion: string) => void;
  initialImage: {file: File, url: string} | null;
}


export const CharacterAnimatorInput: React.FC<CharacterAnimatorInputProps> = ({ isLoading, onAnimate, initialImage }) => {
    const [characterImage, setCharacterImage] = useState<File | null>(null);
    const [characterImagePreview, setCharacterImagePreview] = useState<string | null>(null);
    const [motion, setMotion] = useState('');

    useEffect(() => {
        if (initialImage) {
            handleCharacterImageChange(initialImage.file);
        }
    }, [initialImage]);

    const handleCharacterImageChange = (file: File) => {
        setCharacterImage(file);
        setCharacterImagePreview(URL.createObjectURL(file));
    };
    
    const removeCharacterImage = () => {
        setCharacterImage(null);
        setCharacterImagePreview(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (characterImage && motion.trim() && !isLoading) {
            const characterImageFile = await fileToImageFile(characterImage);
            onAnimate(characterImageFile, motion);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="w-full bg-gray-800 p-6 rounded-lg shadow-lg space-y-6">
            <h2 className="text-2xl font-bold text-white text-center">Animate a Character</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <ImageDropzone 
                    label="Character Image"
                    helpText="Upload a clear image of the character you want to animate."
                    imagePreview={characterImagePreview}
                    onImageChange={handleCharacterImageChange}
                    onImageRemove={removeCharacterImage}
                    className="h-64"
                />
                <div className="flex flex-col">
                     <label htmlFor="motion-input" className="text-lg font-semibold text-gray-300 mb-2">Motion Description</label>
                     <textarea
                        id="motion-input"
                        value={motion}
                        onChange={(e) => setMotion(e.target.value)}
                        placeholder="Describe the action... (e.g., 'waving hello', 'doing a celebratory dance', 'juggling apples')"
                        rows={6}
                        className="w-full flex-grow bg-gray-700 border border-gray-600 text-white rounded-lg p-3"
                    />
                </div>
            </div>
            <button 
                type="submit" 
                disabled={isLoading || !characterImage || !motion.trim()} 
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center transition-colors disabled:bg-gray-500 disabled:cursor-not-allowed"
            >
                <MotionIcon className="h-5 w-5 mr-2" />
                {isLoading ? 'Animating...' : 'Animate Character'}
            </button>
        </form>
    );
};
