
import React, { useState, useEffect } from 'react';
import { CharacterAnimatorInput } from './CharacterAnimatorInput';
import { LoadingSpinner } from './LoadingSpinner';
import { ImageFile, animateCharacter, checkHasApiKey, VEO_API_KEY_ERROR_MESSAGE, openSelectKey } from '../services/geminiService';
import { LibraryItem } from '../App';
import { urlToImageFile } from './ImageDropzone';
import { SparklesIcon } from './icons';

interface CharacterAnimatorProps {
    onBack: () => void;
    onCreationComplete: (item: LibraryItem) => void;
    initialImage?: string;
    onClearInitialImage: () => void;
}

type ApiKeyStatus = 'checking' | 'not-selected' | 'selected';

export const CharacterAnimator: React.FC<CharacterAnimatorProps> = ({ onBack, onCreationComplete, initialImage, onClearInitialImage }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [resultUrl, setResultUrl] = useState<string | null>(null);
    const [originalCharacterUrl, setOriginalCharacterUrl] = useState<string | null>(null);
    const [loadingMessage, setLoadingMessage] = useState('');
    const [apiKeyStatus, setApiKeyStatus] = useState<ApiKeyStatus>('checking');
    const [initialImageFile, setInitialImageFile] = useState<{file: File, url: string} | null>(null);

     useEffect(() => {
        checkHasApiKey().then(hasKey => {
            setApiKeyStatus(hasKey ? 'selected' : 'not-selected');
        });
    }, []);

    useEffect(() => {
        if (initialImage) {
            urlToImageFile(initialImage)
                .then(({ file }) => {
                    setInitialImageFile({ file, url: initialImage });
                })
                .catch(err => {
                    console.error("Failed to load initial image:", err);
                })
                .finally(() => {
                    onClearInitialImage();
                });
        }
    }, [initialImage, onClearInitialImage]);

    const handleAnimate = async (characterImage: ImageFile, motion: string) => {
        setIsLoading(true);
        setError(null);
        setResultUrl(null);
        const originalUrl = `data:${characterImage.type};base64,${characterImage.data}`;
        setOriginalCharacterUrl(originalUrl);
        setLoadingMessage('Preparing character for animation... this can take a few minutes.');
        try {
            const { videoUrl } = await animateCharacter(characterImage, motion);
            
            setLoadingMessage('Polling for video result...');
            
            const response = await fetch(`${videoUrl}&key=${process.env.API_KEY}`);
            if (!response.ok) {
                const errorText = await response.text();
                 if (errorText.includes(VEO_API_KEY_ERROR_MESSAGE)) {
                    setApiKeyStatus('not-selected');
                    throw new Error('API key is invalid. Please select a valid key.');
                }
                throw new Error(`Failed to download video: ${response.statusText} - ${errorText}`);
            }
            const videoBlob = await response.blob();
            const blobUrl = URL.createObjectURL(videoBlob);
            
            setResultUrl(blobUrl);
            onCreationComplete({ type: 'Character Animation', imageUrl: originalUrl, videoUrl: blobUrl });

        } catch (e: any) {
            setError(e.message || 'An unknown error occurred during animation.');
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleStartOver = () => {
        setIsLoading(false);
        setError(null);
        setResultUrl(null);
        setOriginalCharacterUrl(null);
        setInitialImageFile(null);
    };
    
    const handleSelectKey = async () => {
        await openSelectKey();
        // Assume key selection is successful and optimistically update UI
        setApiKeyStatus('selected');
    };

    const renderContent = () => {
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
        
        if (isLoading) {
            return <LoadingSpinner message={loadingMessage} />;
        }
        if (error) {
            return (
                <div className="text-center p-4 bg-red-900/50 rounded-lg max-w-md mx-auto fade-in">
                    <p className="text-red-400 font-semibold text-lg">Error</p>
                    <p className="text-gray-300 mt-2">{error}</p>
                    <button onClick={handleStartOver} className="mt-4 bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg">
                        Try Again
                    </button>
                </div>
            );
        }
        if (resultUrl) {
            return (
                <div className="text-center w-full max-w-2xl mx-auto fade-in">
                    <h2 className="text-3xl font-bold mb-6 text-white">Animation Complete!</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                        <div>
                             <h3 className="text-xl font-semibold mb-2 text-gray-300">Original Character</h3>
                             <img src={originalCharacterUrl!} alt="Original Character" className="w-full h-auto rounded-lg shadow-lg" />
                        </div>
                        <div>
                            <h3 className="text-xl font-semibold mb-2 text-pink-400">Animated Result</h3>
                            <video src={resultUrl} controls autoPlay loop className="w-full h-auto rounded-lg shadow-lg" />
                        </div>
                    </div>
                    <button onClick={handleStartOver} className="mt-8 bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-6 rounded-lg">
                        Animate Another
                    </button>
                </div>
            );
        }
        return (
            <CharacterAnimatorInput 
                isLoading={isLoading} 
                onAnimate={handleAnimate} 
                initialImage={initialImageFile}
            />
        );
    }

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
