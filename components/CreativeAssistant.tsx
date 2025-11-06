
import React, { useState, useEffect } from 'react';
import { TopicInput } from './TopicInput';
import { LoadingSpinner } from './LoadingSpinner';
import { ImageFile, CreativeControls, generateTextStream, generateLyricsStream, generateDetailedPromptFromText, generateDetailedPromptFromImage, generateImage, AudioInput } from '../services/geminiService';
import { ImageIcon, TextIcon, MusicNoteIcon, SaveIcon, CheckIcon, EditIcon } from './icons';
import { LibraryItem } from '../App';
import { ImageEditor } from './ImageEditor';
import { BeforeAfterSlider } from './BeforeAfterSlider';

declare global {
  interface Window {
    marked: any;
  }
}

interface CreativeAssistantProps {
  onBack: () => void;
  onCreationComplete: (item: LibraryItem) => void;
  addToast: (message: string) => void;
}

const CREATIVE_ASSISTANT_LOADING_MESSAGES = [
    'Consulting the digital muse...',
    'Painting with pixels...',
    'Formulating a witty response...',
    'Reticulating splines...',
    'Aligning cosmic energies...',
];

export const CreativeAssistant: React.FC<CreativeAssistantProps> = ({ onBack, onCreationComplete, addToast }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [topic, setTopic] = useState('');
    const [sourceImage, setSourceImage] = useState<ImageFile | null>(null);
    const [assetLibrary, setAssetLibrary] = useState<ImageFile[]>([]);
    const [sourceAudio, setSourceAudio] = useState<File | null>(null);
    const [generateLyricsFlag, setGenerateLyricsFlag] = useState(false);
    const [controls, setControls] = useState<CreativeControls>({
        artisticStyle: 'Photorealistic',
        aspectRatio: '16:9',
        genre: 'None',
        lighting: 'Cinematic',
        mood: 'Neutral',
        cameraAngle: 'Medium Shot',
    });

    const [stage, setStage] = useState<'prompt' | 'content' | 'iterate'>('prompt');
    const [detailedPrompt, setDetailedPrompt] = useState('');
    const [textResult, setTextResult] = useState('');
    const [lyricsResult, setLyricsResult] = useState('');
    const [imageHistory, setImageHistory] = useState<string[]>([]);
    const [currentHistoryIndex, setCurrentHistoryIndex] = useState(0);
    const [savedImageUrls, setSavedImageUrls] = useState<string[]>([]);
    const [editingImage, setEditingImage] = useState<string | null>(null);

     useEffect(() => {
        // Fix: Changed NodeJS.Timeout to ReturnType<typeof setInterval> for browser compatibility.
        let interval: ReturnType<typeof setInterval>;
        if (isLoading) {
            setLoadingMessage(CREATIVE_ASSISTANT_LOADING_MESSAGES[0]);
            interval = setInterval(() => {
                setLoadingMessage(prev => {
                    const currentIndex = CREATIVE_ASSISTANT_LOADING_MESSAGES.indexOf(prev);
                    const nextIndex = (currentIndex + 1) % CREATIVE_ASSISTANT_LOADING_MESSAGES.length;
                    return CREATIVE_ASSISTANT_LOADING_MESSAGES[nextIndex];
                });
            }, 2500);
        }
        return () => clearInterval(interval);
    }, [isLoading]);

    const handleGeneratePrompt = async (
        currentTopic: string,
        currentSourceImage: ImageFile | null,
        currentAssets: ImageFile[],
        currentAudio: File | null,
        currentControls: CreativeControls,
    ) => {
        setIsLoading(true);
        setError(null);
        setTopic(currentTopic);
        setSourceImage(currentSourceImage);
        setAssetLibrary(currentAssets);
        setSourceAudio(currentAudio);
        setControls(currentControls);

        try {
            let generatedPrompt: string;
            if (currentSourceImage) {
                generatedPrompt = await generateDetailedPromptFromImage(currentTopic, currentSourceImage, currentAssets, currentAudio, currentControls);
            } else {
                generatedPrompt = await generateDetailedPromptFromText(currentTopic, currentAssets, currentAudio, currentControls);
            }
            setDetailedPrompt(generatedPrompt);
            setStage('content');
        } catch (e: any) {
            setError(e.message || 'Failed to generate prompt.');
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleGenerateContent = async (finalPrompt: string) => {
        setIsLoading(true);
        setError(null);
        setDetailedPrompt(finalPrompt);
        setTextResult('');
        setLyricsResult('');

        try {
            // Generate image first and await it
            const imageResult = await generateImage(finalPrompt, sourceImage, assetLibrary, controls.aspectRatio);
            setImageHistory([imageResult.imageUrl]);
            setCurrentHistoryIndex(0);

            // Concurrently stream text and lyrics
            const streamPromises = [];
            
            const textStreamPromise = (async () => {
                const stream = generateTextStream(topic, sourceImage, assetLibrary, sourceAudio);
                for await (const chunk of stream) {
                    setTextResult(prev => prev + chunk);
                }
            })();
            streamPromises.push(textStreamPromise);

            if (generateLyricsFlag && controls.genre !== 'None') {
                const lyricsStreamPromise = (async () => {
                    const stream = generateLyricsStream(topic || finalPrompt, controls.genre);
                    for await (const chunk of stream) {
                        setLyricsResult(prev => prev + chunk);
                    }
                })();
                streamPromises.push(lyricsStreamPromise);
            }

            await Promise.all(streamPromises);
            setStage('iterate');
        } catch (e: any) {
            setError(e.message || 'An error occurred during content generation.');
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleIterateImage = async (iterationPrompt: string) => {
        setIsLoading(true);
        setError(null);
    
        const lastImage = imageHistory[imageHistory.length - 1];
        const lastImageFile: ImageFile = {
            data: lastImage.split(',')[1],
            type: lastImage.match(/data:(image\/[^;]+);/)?.[1] || 'image/png'
        };
    
        try {
            // FIX: Directly generate the image using the iteration prompt as an editing instruction.
            // Pass an empty array for assets to avoid confusing the model with old references.
            const imageResult = await generateImage(iterationPrompt, lastImageFile, [], controls.aspectRatio);
            
            const newHistory = [...imageHistory, imageResult.imageUrl];
            setImageHistory(newHistory);
            setCurrentHistoryIndex(newHistory.length - 1);
        } catch (e: any) {
            setError(e.message || "Failed to iterate on the image.");
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleStartOver = () => {
        setIsLoading(false);
        setError(null);
        setTopic('');
        setSourceImage(null);
        setAssetLibrary([]);
        setSourceAudio(null);
        setStage('prompt');
        setDetailedPrompt('');
        setTextResult('');
        setLyricsResult('');
        setImageHistory([]);
        setCurrentHistoryIndex(0);
        setSavedImageUrls([]);
        setEditingImage(null);
    };

    const handleSaveToLibrary = () => {
        const currentImage = imageHistory[currentHistoryIndex];
        if (currentImage && !savedImageUrls.includes(currentImage)) {
            onCreationComplete({ type: "Jackson's Creative AI", imageUrl: currentImage });
            setSavedImageUrls(prev => [...prev, currentImage]);
        } else {
            addToast("Already saved!");
        }
    };

    const handleEditComplete = (newImageUrl: string) => {
        // Treat edit as a new step in history, allowing "undo" by selecting previous image
        const newHistory = [...imageHistory, newImageUrl];
        setImageHistory(newHistory);
        setCurrentHistoryIndex(newHistory.length - 1);
        setEditingImage(null);
        // The new image is not in savedImageUrls, so it's inherently "unsaved".
    };

    const renderResults = () => {
        const currentImage = imageHistory[currentHistoryIndex];
        const previousImage = imageHistory[currentHistoryIndex - 1];
        const isCurrentSaved = savedImageUrls.includes(currentImage);
        
        return (
            <div className="w-full max-w-7xl mx-auto fade-in">
                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="flex flex-col gap-4">
                        <div className="flex justify-between items-center gap-4">
                            <h2 className="text-2xl font-bold text-white flex items-center gap-2"><ImageIcon className="h-6 w-6 text-purple-400" /> Image Output</h2>
                            <div className='flex items-center gap-2'>
                                <div className="relative group">
                                    <button onClick={() => setEditingImage(currentImage)} className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-3 rounded-lg flex items-center gap-2">
                                        <EditIcon className="h-5 w-5"/>
                                        Edit
                                    </button>
                                </div>
                                <div className="relative group">
                                    <button onClick={handleSaveToLibrary} disabled={isCurrentSaved} className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-3 rounded-lg flex items-center gap-2 disabled:bg-gray-500 disabled:cursor-not-allowed">
                                        {isCurrentSaved ? <CheckIcon className="h-5 w-5" /> : <SaveIcon className="h-5 w-5" />}
                                        {isCurrentSaved ? 'Saved' : 'Save to Library'}
                                    </button>
                                </div>
                            </div>
                        </div>
                        
                        <div className="bg-gray-800 p-4 rounded-lg">
                           {previousImage ? (
                                <BeforeAfterSlider beforeImage={previousImage} afterImage={currentImage} />
                           ) : (
                            <img src={currentImage} alt="Current creative result" className="w-full h-auto rounded-lg" />
                           )}
                        </div>

                         {imageHistory.length > 1 && (
                            <div>
                                <h3 className="text-lg font-semibold mb-2">Generation History</h3>
                                <div className="flex gap-2 overflow-x-auto bg-gray-800 p-2 rounded-lg">
                                    {imageHistory.map((img, index) => (
                                        <button 
                                            key={index} 
                                            onClick={() => setCurrentHistoryIndex(index)} 
                                            className={`rounded-md overflow-hidden flex-shrink-0 border-4 ${index === currentHistoryIndex ? 'border-purple-500' : 'border-transparent'}`}
                                            title={`View generation ${index + 1}`}
                                        >
                                            <img src={img} alt={`History ${index + 1}`} className="h-24 w-24 object-cover" />
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="flex flex-col gap-8">
                         {textResult && (
                            <div className="bg-gray-800 p-6 rounded-lg fade-in">
                                <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2"><TextIcon className="h-6 w-6 text-purple-400"/> Conversational Answer</h2>
                                <div className="prose prose-invert max-w-none text-gray-300" dangerouslySetInnerHTML={{ __html: window.marked.parse(textResult) }}></div>
                            </div>
                        )}
                        {lyricsResult && (
                             <div className="bg-gray-800 p-6 rounded-lg fade-in" style={{ animationDelay: '150ms' }}>
                                <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2"><MusicNoteIcon className="h-6 w-6 text-purple-400"/> Generated Lyrics</h2>
                                <pre className="whitespace-pre-wrap font-sans text-gray-300">{lyricsResult}</pre>
                            </div>
                        )}
                    </div>
                 </div>
            </div>
        )
    }

    if (isLoading && stage !== 'iterate') {
        return <LoadingSpinner message={loadingMessage} />;
    }
    
    if (error) {
        return (
            <div className="text-center p-4 bg-red-900/50 rounded-lg max-w-md mx-auto fade-in">
                <p className="text-red-400 font-semibold text-lg">An Error Occurred</p>
                <p className="text-gray-300 mt-2">{error}</p>
                <div className="relative group mt-6 inline-block">
                    <button onClick={handleStartOver} className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg">
                        Start Over
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full max-w-7xl mx-auto flex flex-col items-center">
            {editingImage && (
                <ImageEditor 
                    isOpen={!!editingImage}
                    imageUrl={editingImage}
                    onClose={() => setEditingImage(null)}
                    onSave={handleEditComplete}
                />
            )}
            <div className="self-start mb-6 relative group">
                <button onClick={onBack} className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg">
                    &larr; Back to Menu
                </button>
            </div>
            <div className="w-full">
                <TopicInput
                    stage={stage}
                    onGeneratePrompt={handleGeneratePrompt}
                    onGenerateContent={handleGenerateContent}
                    onIterateImage={handleIterateImage}
                    onStartOver={handleStartOver}
                    detailedPrompt={detailedPrompt}
                    isLoading={isLoading}
                    generateLyricsFlag={generateLyricsFlag}
                    setGenerateLyricsFlag={setGenerateLyricsFlag}
                    isViewingLatest={currentHistoryIndex === imageHistory.length - 1}
                    onGoToLatest={() => setCurrentHistoryIndex(imageHistory.length - 1)}
                />
                
                {(stage === 'iterate' && imageHistory.length > 0) && (
                     <div className="mt-12">
                         {renderResults()}
                     </div>
                )}
            </div>
        </div>
    )
};
