
import React, { useState, useEffect } from 'react';
import { FaceSwapInput } from './FaceSwapInput';
import { LoadingSpinner } from './LoadingSpinner';
import { ImageFile, performFaceSwap } from '../services/geminiService';
import { LibraryItem } from '../App';
import { SaveIcon, CheckIcon, EditIcon, UndoIcon, RedoIcon } from './icons';
import { ImageEditor } from './ImageEditor';
import { BeforeAfterSlider } from './BeforeAfterSlider';
import { urlToImageFile } from './ImageDropzone';

interface FaceSwapProps {
    onBack: () => void;
    onCreationComplete: (item: LibraryItem) => void;
    addToast: (message: string) => void;
    initialImage?: string;
    onClearInitialImage: () => void;
}

const FACE_SWAP_LOADING_MESSAGES = [
    'Performing digital cosmetic surgery...',
    'Analyzing facial structures...',
    'Blending pixels seamlessly...',
    'Finding the perfect match...',
];

export const FaceSwap: React.FC<FaceSwapProps> = ({ onBack, onCreationComplete, addToast, initialImage, onClearInitialImage }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [editHistory, setEditHistory] = useState<string[]>([]);
    const [editHistoryIndex, setEditHistoryIndex] = useState(-1);
    const [originalImage, setOriginalImage] = useState<string | null>(null);
    const [isSaved, setIsSaved] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [initialImageFile, setInitialImageFile] = useState<{file: File, url: string} | null>(null);

    const result = editHistory.length > 0 ? editHistory[editHistoryIndex] : null;
    const canUndo = editHistoryIndex > 0;
    const canRedo = editHistoryIndex < editHistory.length - 1;

    useEffect(() => {
        if (initialImage) {
            urlToImageFile(initialImage)
                .then(({ file }) => {
                    setInitialImageFile({ file, url: initialImage });
                })
                .catch(err => {
                    console.error("Failed to load initial image:", err);
                    addToast("Error loading image from library.");
                })
                .finally(() => {
                    onClearInitialImage();
                });
        }
    }, [initialImage, onClearInitialImage, addToast]);

    useEffect(() => {
        // Fix: Changed NodeJS.Timeout to ReturnType<typeof setInterval> for browser compatibility.
        let interval: ReturnType<typeof setInterval>;
        if (isLoading) {
            setLoadingMessage(FACE_SWAP_LOADING_MESSAGES[0]);
            interval = setInterval(() => {
                setLoadingMessage(prev => {
                    const currentIndex = FACE_SWAP_LOADING_MESSAGES.indexOf(prev);
                    const nextIndex = (currentIndex + 1) % FACE_SWAP_LOADING_MESSAGES.length;
                    return FACE_SWAP_LOADING_MESSAGES[nextIndex];
                });
            }, 2500);
        }
        return () => clearInterval(interval);
    }, [isLoading]);


    const handleFaceSwapGenerate = async (sourceImage: ImageFile, faceImage: ImageFile) => {
        setIsLoading(true);
        setError(null);
        setEditHistory([]);
        setEditHistoryIndex(-1);
        setIsSaved(false);
        const originalImageUrl = `data:${sourceImage.type};base64,${sourceImage.data}`;
        setOriginalImage(originalImageUrl);

        try {
            const imageUrl = await performFaceSwap(sourceImage, faceImage);
            setEditHistory([imageUrl]);
            setEditHistoryIndex(0);
        } catch (e: any) {
            setError(e.message || 'An unknown error occurred.');
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleSave = () => {
        if (result && originalImage && !isSaved) {
            onCreationComplete({ type: 'Face Swap', originalUrl: originalImage, imageUrl: result });
            setIsSaved(true);
        } else if (isSaved) {
            addToast("Already saved!");
        }
    };

    const handleEditComplete = (newImageUrl: string) => {
        const newHistory = editHistory.slice(0, editHistoryIndex + 1);
        newHistory.push(newImageUrl);
        setEditHistory(newHistory);
        setEditHistoryIndex(newHistory.length - 1);
        setIsEditing(false);
        setIsSaved(false); // Allow saving the newly edited version
    };

    const handleUndo = () => {
        if (canUndo) setEditHistoryIndex(editHistoryIndex - 1);
    };

    const handleRedo = () => {
        if (canRedo) setEditHistoryIndex(editHistoryIndex + 1);
    };

    const handleStartOver = () => {
        setEditHistory([]);
        setEditHistoryIndex(-1);
        setError(null);
        setOriginalImage(null);
        setIsSaved(false);
        setIsEditing(false);
        setInitialImageFile(null);
    };

    const renderContent = () => {
        if (isLoading) {
            return <LoadingSpinner message={loadingMessage} />;
        }
        if (error) {
            return (
                <div className="text-center p-4 bg-red-900/50 rounded-lg max-w-md mx-auto fade-in">
                    <p className="text-red-400 font-semibold text-lg">Error</p>
                    <p className="text-gray-300 mt-2">{error}</p>
                    <button onClick={handleStartOver} className="mt-6 bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg">
                        Try Again
                    </button>
                </div>
            );
        }
        if (result && originalImage) {
            return (
                <div className="text-center w-full max-w-4xl mx-auto fade-in">
                    {isEditing && (
                        <ImageEditor
                            isOpen={isEditing}
                            imageUrl={result}
                            onClose={() => setIsEditing(false)}
                            onSave={handleEditComplete}
                        />
                    )}
                    <h2 className="text-3xl font-bold mb-6 text-white">Face Swap Result</h2>
                    <div className="max-w-xl mx-auto">
                        <BeforeAfterSlider beforeImage={originalImage} afterImage={result} />
                    </div>
                     <div className="flex justify-center items-center gap-4 mt-8">
                        <button onClick={handleStartOver} className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-6 rounded-lg">
                            Create Another
                        </button>
                        <button onClick={() => setIsEditing(true)} className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-6 rounded-lg flex items-center gap-2">
                            <EditIcon className="h-5 w-5" />
                            Edit
                        </button>
                         <div className="flex items-center gap-1 bg-gray-700 rounded-lg p-1">
                            <button onClick={handleUndo} disabled={!canUndo} title="Undo" className="p-2 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-600"><UndoIcon className="h-5 w-5" /></button>
                            <button onClick={handleRedo} disabled={!canRedo} title="Redo" className="p-2 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-600"><RedoIcon className="h-5 w-5" /></button>
                        </div>
                        <button onClick={handleSave} disabled={isSaved} className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-lg flex items-center gap-2 disabled:bg-gray-500 disabled:cursor-not-allowed">
                            {isSaved ? <CheckIcon className="h-5 w-5" /> : <SaveIcon className="h-5 w-5" />}
                            {isSaved ? 'Saved' : 'Save to Library'}
                        </button>
                    </div>
                </div>
            );
        }
        return <FaceSwapInput isLoading={isLoading} onGenerate={handleFaceSwapGenerate} onStartOver={handleStartOver} initialImage={initialImageFile} />;
    };

     return (
        <div className="w-full max-w-4xl mx-auto flex flex-col items-center">
            <div className="self-start mb-6">
                <button onClick={onBack} className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg">
                    &larr; Back to Menu
                </button>
            </div>
            <div className="w-full">
                {renderContent()}
            </div>
        </div>
    );
};
