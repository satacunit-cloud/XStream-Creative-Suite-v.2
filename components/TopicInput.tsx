import React, { useState, useRef, useEffect } from 'react';
import { ImageFile, CreativeControls } from '../services/geminiService';
import { CloseIcon, PencilIcon, SparklesIcon, MagicWandIcon, FastForwardIcon, PlusIcon, AudioIcon, CheckIcon, ShuffleIcon } from './icons';
import { ImageDropzone } from './ImageDropzone';

type Stage = 'prompt' | 'content' | 'iterate';

interface TopicInputProps {
    stage: Stage;
    onGeneratePrompt: (topic: string, sourceImage: ImageFile | null, assets: ImageFile[], audio: File | null, controls: CreativeControls) => void;
    onGenerateContent: (prompt: string) => void;
    onIterateImage: (prompt: string) => void;
    onStartOver: () => void;
    detailedPrompt: string;
    isLoading: boolean;
    generateLyricsFlag: boolean;
    setGenerateLyricsFlag: (flag: boolean) => void;
    isViewingLatest: boolean;
    onGoToLatest: () => void;
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

const ARTISTIC_STYLES = ['Photorealistic', 'Impressionistic', 'Surreal', 'Cyberpunk', 'Hyper Realistic', 'Anime', 'Toon', 'Painting', 'Graffiti'];
const GENRES = ['None', 'Pop', 'Rock', 'Hip Hop', 'EDM', 'Country', 'Jazz', 'Classical', 'R&B', 'Metal', 'Folk', 'Indie', 'Punk', 'Reggae'];
const LIGHTING_OPTIONS = ['Cinematic', 'Golden Hour', 'Blue Hour', 'Neon', 'Studio', 'Natural', 'High-Key', 'Low-Key'];
const MOODS = ['Joyful', 'Romantic', 'Ominous', 'Mysterious', 'Peaceful', 'Energetic', 'Melancholic', 'Whimsical'];
const CAMERA_ANGLES = ['Eye-Level', 'Low Angle', 'High Angle', 'Close-up', 'Wide Shot', 'Dutch Angle', 'Over-the-Shoulder'];
const ASPECT_RATIOS = ['16:9', '9:16', '1:1', '4:3', '3:4'];

const getRandomItem = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

export const TopicInput: React.FC<TopicInputProps> = ({
    stage, onGeneratePrompt, onGenerateContent, onIterateImage, onStartOver,
    detailedPrompt, isLoading, generateLyricsFlag, setGenerateLyricsFlag, isViewingLatest, onGoToLatest
}) => {
    const [topic, setTopic] = useState('');
    const [sourceImage, setSourceImage] = useState<ImageFile | null>(null);
    const [sourceImagePreview, setSourceImagePreview] = useState<string | null>(null);
    const [assetLibrary, setAssetLibrary] = useState<ImageFile[]>([]);
    const [selectedAssets, setSelectedAssets] = useState<ImageFile[]>([]);
    const [sourceAudio, setSourceAudio] = useState<File | null>(null);
    const [editedPrompt, setEditedPrompt] = useState('');
    const [iterationPrompt, setIterationPrompt] = useState('');
    const assetInputRef = useRef<HTMLInputElement>(null);
    const audioInputRef = useRef<HTMLInputElement>(null);
    const [controls, setControls] = useState<CreativeControls>({
        artisticStyle: 'Photorealistic',
        aspectRatio: '16:9',
        genre: 'None',
        lighting: 'Cinematic',
        mood: 'Neutral',
        cameraAngle: 'Medium Shot',
    });

    useEffect(() => {
        setEditedPrompt(detailedPrompt);
    }, [detailedPrompt]);

    const handleSourceImageChange = async (file: File) => {
        setSourceImagePreview(URL.createObjectURL(file));
        const imageFile = await fileToImageFile(file);
        setSourceImage(imageFile);
    };

    const handleRemoveSourceImage = () => {
        setSourceImage(null);
        setSourceImagePreview(null);
    }

    const handleAssetChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files) {
            const newAssets = await Promise.all(Array.from(files).map(fileToImageFile));
            setAssetLibrary(prev => [...prev, ...newAssets]);
        }
    };

    const handleAudioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) setSourceAudio(file);
    };

    const toggleAssetSelection = (asset: ImageFile) => {
        setSelectedAssets(prev => {
            if (prev.some(a => a.data === asset.data)) {
                return prev.filter(a => a.data !== asset.data);
            } else {
                return [...prev, asset];
            }
        });
    };

    const removeAsset = (assetToRemove: ImageFile) => {
        setAssetLibrary(prev => prev.filter(a => a.data !== assetToRemove.data));
        setSelectedAssets(prev => prev.filter(a => a.data !== assetToRemove.data));
    };

    const handleSubmitPrompt = (e: React.FormEvent) => {
        e.preventDefault();
        onGeneratePrompt(topic, sourceImage, selectedAssets, sourceAudio, controls);
    };

    const handleSubmitContent = (e: React.FormEvent) => {
        e.preventDefault();
        onGenerateContent(editedPrompt);
    };

    const handleSubmitIteration = (e: React.FormEvent) => {
        e.preventDefault();
        onIterateImage(iterationPrompt);
        setIterationPrompt('');
    };

    const randomizeControls = () => {
        setControls(c => ({
            ...c,
            artisticStyle: getRandomItem(ARTISTIC_STYLES),
            genre: getRandomItem(GENRES),
            lighting: getRandomItem(LIGHTING_OPTIONS),
            mood: getRandomItem(MOODS),
            cameraAngle: getRandomItem(CAMERA_ANGLES),
        }));
    };

    const resetAll = () => {
        setTopic('');
        setSourceImage(null);
        setSourceImagePreview(null);
        setAssetLibrary([]);
        setSelectedAssets([]);
        setSourceAudio(null);
        onStartOver();
    };

    if (stage === 'content' || stage === 'iterate') {
        const isContentStage = stage === 'content';
        const isIterateStage = stage === 'iterate';

        return (
            <div className="w-full bg-gray-800 p-6 rounded-lg shadow-lg">
                {isContentStage && (
                    <form onSubmit={handleSubmitContent} className="space-y-4">
                        <h2 className="text-xl font-bold text-white mb-2">Review & Generate</h2>
                        <p className="text-gray-400">The AI has crafted a detailed prompt based on your input. You can edit it below before generating the final content.</p>
                        <textarea
                            value={editedPrompt}
                            onChange={(e) => setEditedPrompt(e.target.value)}
                            rows={6}
                            className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg p-3 focus:ring-purple-500 focus:border-purple-500"
                        />
                        <div className="flex gap-4">
                            <button type="button" onClick={resetAll} className="w-full bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-4 rounded-lg">Start Over</button>
                            <button type="submit" disabled={isLoading} className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center transition-colors disabled:bg-gray-500">
                                <SparklesIcon className="h-5 w-5 mr-2" />
                                {isLoading ? 'Generating...' : 'Generate Content'}
                            </button>
                        </div>
                    </form>
                )}
                {isIterateStage && (
                    <div className="space-y-4">
                         <h2 className="text-xl font-bold text-white mb-2">Iterate on this Image</h2>
                         {!isViewingLatest ? (
                            <div className="bg-yellow-900/50 p-4 rounded-lg text-center">
                                <p className="text-yellow-300">You are viewing an older generation. Iteration is only possible on the latest image.</p>
                                <button onClick={onGoToLatest} className="mt-2 bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center mx-auto">
                                    <FastForwardIcon className="h-5 w-5 mr-2" />
                                    Go to Latest Image
                                </button>
                            </div>
                         ) : (
                            <form onSubmit={handleSubmitIteration} className="flex gap-4">
                                <input
                                    type="text"
                                    value={iterationPrompt}
                                    onChange={(e) => setIterationPrompt(e.target.value)}
                                    placeholder="e.g., 'add a hat' or 'make it nighttime'"
                                    className="flex-grow bg-gray-700 border border-gray-600 text-white rounded-lg p-3"
                                    disabled={isLoading}
                                />
                                <button type="submit" disabled={isLoading || !iterationPrompt.trim()} className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center disabled:bg-gray-500 h-full">
                                    <MagicWandIcon className="h-5 w-5 mr-2" />
                                    {isLoading ? '...' : 'Regenerate'}
                                </button>
                            </form>
                         )}
                         <button type="button" onClick={resetAll} className="w-full bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-4 rounded-lg">Start Over</button>
                    </div>
                )}
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmitPrompt} className="w-full bg-gray-800 p-6 rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold text-white mb-6">1. Provide Your Creative Input</h2>
            <div className="space-y-6">
                <textarea
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="Start with a topic or a description... (e.g., 'a lone astronaut on a red planet')"
                    rows={3}
                    className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg p-3"
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <ImageDropzone 
                        label="Source Image (Optional)"
                        helpText="Upload an image to edit or use as inspiration."
                        imagePreview={sourceImagePreview}
                        onImageChange={handleSourceImageChange}
                        onImageRemove={handleRemoveSourceImage}
                    />
                    <div className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-gray-600 rounded-lg">
                         <h3 className="text-lg font-semibold text-gray-300 mb-2">Audio Input (Optional)</h3>
                         {sourceAudio ? (
                             <div className="relative text-center">
                                 <AudioIcon className="h-16 w-16 mx-auto text-purple-400" />
                                 <p className="text-gray-300 mt-2 truncate max-w-xs">{sourceAudio.name}</p>
                                 <button type="button" onClick={() => { setSourceAudio(null); if (audioInputRef.current) audioInputRef.current.value = ""; }} className="absolute top-0 right-0 -mt-2 -mr-2 bg-red-600 rounded-full p-1 text-white" title="Remove audio">
                                    <CloseIcon className="h-4 w-4" />
                                 </button>
                             </div>
                         ) : (
                            <div className="relative group">
                                <button type="button" onClick={() => audioInputRef.current?.click()} className="flex flex-col items-center text-gray-400 hover:text-white h-40 w-40 justify-center">
                                    <AudioIcon className="h-8 w-8 mb-2" /><span>Upload Audio</span>
                                    <input type="file" accept="audio/*" ref={audioInputRef} onChange={handleAudioChange} className="hidden" />
                                </button>
                             </div>
                         )}
                    </div>
                </div>

                <div>
                    <h3 className="text-lg font-semibold text-gray-300 mb-2">Asset Library (Optional)</h3>
                     <div className="bg-gray-700/50 p-4 rounded-lg">
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-4">
                            {assetLibrary.map((asset, index) => (
                                 <div key={index} className="relative group">
                                    <button type='button' onClick={() => toggleAssetSelection(asset)} className="w-full h-full" title="Click to select/deselect this asset">
                                        <img src={`data:${asset.type};base64,${asset.data}`} alt={`Asset ${index + 1}`} className="w-full h-24 object-cover rounded-md" />
                                         {selectedAssets.some(a => a.data === asset.data) && (
                                            <div className="absolute inset-0 bg-black/70 flex items-center justify-center rounded-md">
                                                <CheckIcon className="h-10 w-10 text-green-400" />
                                            </div>
                                        )}
                                    </button>
                                    <button type="button" onClick={() => removeAsset(asset)} className="absolute top-0 right-0 -mt-2 -mr-2 bg-red-600 rounded-full p-1 text-white opacity-0 group-hover:opacity-100 transition-opacity" title="Remove asset from library">
                                        <CloseIcon className="h-4 w-4" />
                                    </button>
                                </div>
                            ))}
                            <button type="button" onClick={() => assetInputRef.current?.click()} className="flex flex-col items-center justify-center text-gray-400 hover:text-white border-2 border-dashed border-gray-600 rounded-lg h-24" title="Add more assets to the library">
                                <PlusIcon className="h-6 w-6" />
                            </button>
                            <input type="file" accept="image/*" multiple ref={assetInputRef} onChange={handleAssetChange} className="hidden" />
                        </div>
                        <p className="text-xs text-gray-500">Add reference images (characters, objects, styles). Click an image to select/deselect it for the next generation.</p>
                     </div>
                </div>
            </div>

            <div className='flex justify-between items-center'>
                <h2 className="text-2xl font-bold text-white mb-6 mt-8">2. Set Creative Direction</h2>
                <div className="relative group">
                    <button type="button" onClick={randomizeControls} className="mb-6 mt-8 bg-gray-700 hover:bg-gray-600 text-white font-bold p-2 rounded-full">
                        <ShuffleIcon className="h-5 w-5" />
                    </button>
                     <div className="absolute right-0 bottom-full mb-2 w-max max-w-xs bg-gray-900/90 backdrop-blur-sm text-white text-xs rounded-lg py-1.5 px-3 opacity-0 group-hover:opacity-100 group-hover:scale-100 scale-95 transition-all duration-300 pointer-events-none">
                        Randomize Controls
                        <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-gray-900/90"></div>
                    </div>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Artistic Style</label>
                        <select value={controls.artisticStyle} onChange={(e) => setControls(c => ({...c, artisticStyle: e.target.value}))} className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2.5">
                            {ARTISTIC_STYLES.map(s => <option key={s}>{s}</option>)}
                        </select>
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Genre Cover Style</label>
                        <select value={controls.genre} onChange={(e) => setControls(c => ({...c, genre: e.target.value}))} className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2.5">
                           {GENRES.map(g => <option key={g}>{g}</option>)}
                        </select>
                    </div>
                </div>
                 <div className="space-y-4">
                     <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Lighting</label>
                        <select value={controls.lighting} onChange={(e) => setControls(c => ({...c, lighting: e.target.value}))} className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2.5">
                            {LIGHTING_OPTIONS.map(l => <option key={l}>{l}</option>)}
                        </select>
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Mood</label>
                        <select value={controls.mood} onChange={(e) => setControls(c => ({...c, mood: e.target.value}))} className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2.5">
                            {MOODS.map(m => <option key={m}>{m}</option>)}
                        </select>
                    </div>
                </div>
                <div className="space-y-4">
                     <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Camera Angle</label>
                        <select value={controls.cameraAngle} onChange={(e) => setControls(c => ({...c, cameraAngle: e.target.value}))} className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2.5">
                            {CAMERA_ANGLES.map(a => <option key={a}>{a}</option>)}
                        </select>
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Aspect Ratio</label>
                        <select disabled={!!sourceImage} value={controls.aspectRatio} onChange={(e) => setControls(c => ({...c, aspectRatio: e.target.value}))} className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2.5 disabled:bg-gray-600 disabled:cursor-not-allowed">
                            {ASPECT_RATIOS.map(r => <option key={r}>{r}</option>)}
                        </select>
                    </div>
                </div>
            </div>

             {controls.genre !== 'None' && (
                <div className="mt-6 bg-gray-700/50 p-4 rounded-lg">
                    <label className="flex items-center gap-3 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={generateLyricsFlag}
                            onChange={(e) => setGenerateLyricsFlag(e.target.checked)}
                            className="w-5 h-5 text-purple-600 bg-gray-700 border-gray-500 rounded focus:ring-purple-600"
                        />
                         <span className="text-gray-300">Generate Song Lyrics for this concept</span>
                    </label>
                </div>
            )}

            <div className="mt-8 flex gap-4">
                 <button type="button" onClick={resetAll} className="w-full bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-4 rounded-lg">Reset</button>
                 <button type="submit" disabled={isLoading} className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center">
                    <PencilIcon className="h-5 w-5 mr-2" />
                    {isLoading ? 'Generating...' : 'Generate Prompt'}
                </button>
            </div>
        </form>
    );
};