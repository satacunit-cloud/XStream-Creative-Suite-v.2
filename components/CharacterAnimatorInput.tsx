import React, { useState, useRef } from 'react';
import { UploadIcon, CloseIcon, MotionIcon, SparklesIcon } from './icons';
import { ImageFile, openSelectKey } from '../services/geminiService';

type ApiKeyStatus = 'checking' | 'not-selected' | 'selected';

interface CharacterAnimatorInputProps {
  isLoading: boolean;
  onAnimate: (characterImage: ImageFile, motion: string) => void;
  apiKeyStatus: ApiKeyStatus;
  setApiKeyStatus: (status: ApiKeyStatus) => void;
}

const fileToImageFile = (file: File): Promise<ImageFile> => {
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

const ImageUploader: React.FC<{
    label: string;
    imagePreview: string | null;
    onImageChange: (file: File) => void;
    onImageRemove: () => void;
}> = ({ label, imagePreview, onImageChange, onImageRemove }) => {
    const inputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            onImageChange(file);
        }
    };

    const handleRemove = () => {
        onImageRemove();
        if (inputRef.current) inputRef.current.value = "";
    };

    return (
        <div className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-gray-600 rounded-lg w-full h-full">
            <h3 className="text-lg font-semibold text-gray-300 mb-2">{label}</h3>
            {imagePreview ? (
                <div className="relative">
                    <img src={imagePreview} alt="Preview" className="h-40 w-40 object-cover rounded-md" />
                    <button type="button" onClick={handleRemove} className="absolute top-0 right-0 -mt-2 -mr-2 bg-red-600 rounded-full p-1 text-white" title="Remove image">
                        <CloseIcon className="h-4 w-4"/>
                    </button>
                </div>
            ) : (
                <button type="button" onClick={() => inputRef.current?.click()} className="flex flex-col items-center text-gray-400 hover:text-white h-40 w-40 justify-center">
                    <UploadIcon className="h-8 w-8 mb-2" />
                    <span>Upload Image</span>
                    <input type="file" accept="image/*" ref={inputRef} onChange={handleFileChange} className="hidden" />
                </button>
            )}
        </div>
    );
};


export const CharacterAnimatorInput: React.FC<CharacterAnimatorInputProps> = ({ isLoading, onAnimate, apiKeyStatus, setApiKeyStatus }) => {
    const [characterImage, setCharacterImage] = useState<File | null>(null);
    const [characterImagePreview, setCharacterImagePreview] = useState<string | null>(null);
    const [motion, setMotion] = useState('');

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
    
    const handleSelectKey = async () => {
        await openSelectKey();
        // Assume key selection is successful and optimistically update UI
        setApiKeyStatus('selected');
    };

    if (apiKeyStatus === 'checking') {
        return <div className="text-center p-8">Checking API key status...</div>;
    }
    
    if (apiKeyStatus === 'not-selected') {
        return (
             <div className="w-full bg-gray-800 p-6 rounded-lg shadow-lg text-center">
                <h2 className="text-2xl font-bold text-white mb-4">API Key Required</h2>
                <p className="text-gray-400 mb-6">
                    The Character Animator uses a powerful video model (Veo) which requires you to select an API key associated with a billed project. This is a one-time setup.
                    <br />
                    For more information, please see the <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:underline">billing documentation</a>.
                </p>
                <button 
                    onClick={handleSelectKey}
                    className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-lg flex items-center justify-center mx-auto"
                >
                    <SparklesIcon className="h-5 w-5 mr-2" />
                    Select API Key to Continue
                </button>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="w-full bg-gray-800 p-6 rounded-lg shadow-lg space-y-6">
            <h2 className="text-2xl font-bold text-white text-center">Animate a Character</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <ImageUploader 
                    label="Character Image"
                    imagePreview={characterImagePreview}
                    onImageChange={handleCharacterImageChange}
                    onImageRemove={removeCharacterImage}
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
