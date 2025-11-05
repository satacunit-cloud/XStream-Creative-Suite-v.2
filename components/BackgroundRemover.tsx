
import React, { useState, useRef, useEffect } from 'react';
import { BackgroundRemoverInput } from './BackgroundRemoverInput';
import { LoadingSpinner } from './LoadingSpinner';
import { ImageFile, performBackgroundRemoval, compositeWithGeneratedBackground, compositeWithUploadedBackground } from '../services/geminiService';
import { LibraryItem } from '../App';
import { SaveIcon, CheckIcon, UploadIcon, SparklesIcon, EditIcon, UndoIcon, RedoIcon } from './icons';
import { ImageEditor } from './ImageEditor';
import { fileToImageFile, urlToImageFile } from './ImageDropzone';
import { BeforeAfterSlider } from './BeforeAfterSlider';

interface BackgroundRemoverProps {
    onBack: () => void;
    onCreationComplete: (item: LibraryItem) => void;
    addToast: (message: string) => void;
    initialImage?: string;
    onClearInitialImage: () => void;
}

const BG_REMOVER_LOADING_MESSAGES = [
    'Finding the edges...',
    'Isolating the subject...',
    'Creating a clean cutout...',
    'This may take a moment...',
];

const createGreenScreenImage = (foregroundUrl: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      img.crossOrigin = 'Anonymous';
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        if (ctx) {
          ctx.fillStyle = '#00FF00'; // Green screen color
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0);
          resolve(canvas.toDataURL('image/png'));
        } else {
          reject(new Error('Could not get canvas context'));
        }
      };
      img.onerror = (err) => reject(err);
      img.src = foregroundUrl;
    });
  };

export const BackgroundRemover: React.FC<BackgroundRemoverProps> = ({ onBack, onCreationComplete, addToast, initialImage, onClearInitialImage }) => {
    // FIX: Refactored to use a separate isLoading state to resolve TS error and align with other components.
    const [stage, setStage] = useState<'input' | 'editing' | 'result'>('input');
    const [isLoading, setIsLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState('');
    const [error, setError] = useState<string | null>(null);
    
    const [originalImage, setOriginalImage] = useState<string | null>(null);
    const [foregroundImage, setForegroundImage] = useState<string | null>(null);
    const [editHistory, setEditHistory] = useState<string[]>([]);
    const [editHistoryIndex, setEditHistoryIndex] = useState(-1);
    const [initialImageFile, setInitialImageFile] = useState<{file: File, url: string} | null>(null);

    const [isSaved, setIsSaved] = useState(false);
    const [isCutoutSaved, setIsCutoutSaved] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [backgroundPrompt, setBackgroundPrompt] = useState('');
    const backgroundUploadRef = useRef<HTMLInputElement>(null);

    const finalResult = editHistory.length > 0 ? editHistory[editHistoryIndex] : null;
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
            setLoadingMessage(BG_REMOVER_LOADING_MESSAGES[0]);
            interval = setInterval(() => {
                setLoadingMessage(prev => {
                    const currentIndex = BG_REMOVER_LOADING_MESSAGES.indexOf(prev);
                    const nextIndex = (currentIndex + 1) % BG_REMOVER_LOADING_MESSAGES.length;
                    return BG_REMOVER_LOADING_MESSAGES[nextIndex];
                });
            }, 2500);
        }
        return () => clearInterval(interval);
    }, [isLoading]);

    const handleInitialRemoval = async (image: ImageFile) => {
        setIsLoading(true);
        setError(null);
        setEditHistory([]);
        setEditHistoryIndex(-1);
        setIsSaved(false);
        setIsCutoutSaved(false);

        const originalImageUrl = `data:${image.type};base64,${image.data}`;
        setOriginalImage(originalImageUrl);

        try {
            const imageUrl = await performBackgroundRemoval(image);
            setForegroundImage(imageUrl);
            setStage('editing');
        } catch (e: any) {
            setError(e.message || 'An unknown error occurred.');
            setStage('input');
        } finally {
            setIsLoading(false);
        }
    };

    const handleGenerateBackground = async () => {
        if (!foregroundImage || !backgroundPrompt.trim()) return;
        setIsLoading(true);
        setLoadingMessage('Generating new background...');
        setError(null);
        try {
            const foregroundFile = { data: foregroundImage.split(',')[1], type: 'image/png' };
            const result = await compositeWithGeneratedBackground(foregroundFile, backgroundPrompt);
            setEditHistory([result]);
            setEditHistoryIndex(0);
            setStage('result');
        } catch (e: any) {
            setError(e.message || 'Failed to generate background.');
            setStage('editing');
        } finally {
            setIsLoading(false);
        }
    };

    const handleUploadBackground = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !foregroundImage) return;

        setIsLoading(true);
        setLoadingMessage('Compositing images...');
        setError(null);
        try {
            const backgroundFile = await fileToImageFile(file);
            const foregroundFile = { data: foregroundImage.split(',')[1], type: 'image/png' };
            const result = await compositeWithUploadedBackground(foregroundFile, backgroundFile);
            setEditHistory([result]);
            setEditHistoryIndex(0);
            setStage('result');
        } catch (e: any) {
             setError(e.message || 'Failed to composite images.');
             setStage('editing');
        } finally {
            setIsLoading(false);
        }
    };

    const handleGreenScreen = async () => {
        if (!foregroundImage) return;
        setIsLoading(true);
        setLoadingMessage('Applying green screen...');
        try {
            const result = await createGreenScreenImage(foregroundImage);
            setEditHistory([result]);
            setEditHistoryIndex(0);
            setStage('result');
        } catch (e: any) {
            setError(e.message || 'Failed to apply green screen.');
            setStage('editing');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = () => {
        if (finalResult && originalImage && !isSaved) {
            onCreationComplete({ type: 'Background Edit', originalUrl: originalImage, imageUrl: finalResult });
            setIsSaved(true);
        } else if (isSaved) {
            addToast("Already saved!");
        }
    };

    const handleSaveCutout = () => {
        if (foregroundImage && !isCutoutSaved) {
            onCreationComplete({ type: 'Foreground Cutout', imageUrl: foregroundImage });
            setIsCutoutSaved(true);
        } else if(isCutoutSaved) {
            addToast("Cutout already saved!");
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
        setStage('input');
        setError(null);
        setOriginalImage(null);
        setForegroundImage(null);
        setEditHistory([]);
        setEditHistoryIndex(-1);
        setIsSaved(false);
        setIsCutoutSaved(false);
        setIsEditing(false);
        setBackgroundPrompt('');
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
                    <button onClick={() => { setError(null); setStage('editing'); }} className="mt-6 bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg">
                        Try Again
                    </button>
                </div>
            );
        }
        if (stage === 'result' && finalResult && originalImage) {
             return (
                <div className="text-center w-full max-w-4xl mx-auto fade-in">
                    {isEditing && (
                        <ImageEditor
                            isOpen={isEditing}
                            imageUrl={finalResult}
                            onClose={() => setIsEditing(false)}
                            onSave={handleEditComplete}
                        />
                    )}
                    <h2 className="text-3xl font-bold mb-6 text-white">Result</h2>
                     <div className="max-w-xl mx-auto">
                        <BeforeAfterSlider beforeImage={originalImage} afterImage={finalResult} />
                    </div>
                     <div className="flex justify-center items-center gap-4 mt-8">
                        <button onClick={handleStartOver} className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-6 rounded-lg">
                            Start Over
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
        if (stage === 'editing' && foregroundImage) {
            return (
                <div className="w-full max-w-4xl mx-auto fade-in">
                    <h2 className="text-3xl font-bold mb-2 text-center text-white">Background Removed</h2>
                    <p className='text-center text-gray-400 mb-6'>Now, what would you like to do with the background?</p>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                        <div className='text-center'>
                            <h3 className="text-xl font-semibold mb-2 text-pink-400">Foreground Cutout</h3>
                            <div className="bg-gray-700 p-2 rounded-lg inline-block" style={{ background: 'url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAAXNSR0IArs4c6QAAACRJREFUOE9jZGBgEGHAD97/D0Anio2JtP8/AwPjA+OOgVwGAA2jCoS5nSgzAAAAAElFTkSuQmCC) repeat' }}>
                                <img src={foregroundImage} alt="Foreground cutout" className="max-w-full h-auto rounded-lg shadow-lg" style={{ maxHeight: '400px' }} />
                            </div>
                            <button onClick={handleSaveCutout} disabled={isCutoutSaved} className="mt-4 bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2 disabled:bg-gray-500 disabled:cursor-not-allowed mx-auto">
                                {isCutoutSaved ? <CheckIcon className="h-5 w-5" /> : <SaveIcon className="h-5 w-5" />}
                                {isCutoutSaved ? 'Cutout Saved' : 'Save Cutout'}
                            </button>
                        </div>

                        <div className="space-y-4 bg-gray-800 p-6 rounded-lg">
                            {/* Generate */}
                            <div>
                                <label className="block text-lg font-semibold text-gray-300 mb-2">1. Generate New Background</label>
                                <div className="flex gap-2">
                                    <input type="text" value={backgroundPrompt} onChange={(e) => setBackgroundPrompt(e.target.value)} placeholder="e.g., 'a vibrant cityscape at night'" className="flex-grow bg-gray-700 border border-gray-600 text-white rounded-lg p-3" />
                                    <button onClick={handleGenerateBackground} disabled={!backgroundPrompt.trim()} className="bg-purple-600 hover:bg-purple-700 text-white font-bold p-3 rounded-lg flex items-center justify-center disabled:bg-gray-500"><SparklesIcon className="h-5 w-5" /></button>
                                </div>
                            </div>
                            {/* Upload */}
                            <div>
                                <label className="block text-lg font-semibold text-gray-300 mb-2">2. Replace with Upload</label>
                                <input type="file" accept="image/*" ref={backgroundUploadRef} onChange={handleUploadBackground} className="hidden" />
                                <button onClick={() => backgroundUploadRef.current?.click()} className="w-full bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2">
                                    <UploadIcon className="h-5 w-5" /> Upload Background Image
                                </button>
                            </div>
                            {/* Green Screen */}
                            <div>
                                <label className="block text-lg font-semibold text-gray-300 mb-2">3. Use a Green Screen</label>
                                <button onClick={handleGreenScreen} className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg">Apply Green Screen</button>
                            </div>
                        </div>
                    </div>
                     <div className="text-center mt-8">
                        <button onClick={handleStartOver} className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg">
                            Start Over
                        </button>
                    </div>
                </div>
            )
        }
        return <BackgroundRemoverInput isLoading={isLoading} onGenerate={handleInitialRemoval} initialImage={initialImageFile} />;
    };

     return (
        <div className="w-full max-w-5xl mx-auto flex flex-col items-center">
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