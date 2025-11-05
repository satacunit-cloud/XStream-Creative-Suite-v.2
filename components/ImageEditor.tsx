
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { UndoIcon, RedoIcon } from './icons';

interface ImageEditorProps {
    isOpen: boolean;
    imageUrl: string | null;
    onClose: () => void;
    onSave: (newImageUrl: string) => void;
}

type Filter = 'none' | 'grayscale' | 'sepia' | 'invert' | 'brightness' | 'contrast' | 'blur';

const FILTERS: { name: string; value: Filter; style: string }[] = [
    { name: 'Normal', value: 'none', style: 'none' },
    { name: 'Grayscale', value: 'grayscale', style: 'grayscale(100%)' },
    { name: 'Sepia', value: 'sepia', style: 'sepia(100%)' },
    { name: 'Invert', value: 'invert', style: 'invert(100%)' },
    { name: 'Brighten', value: 'brightness', style: 'brightness(130%)' },
    { name: 'Darken', value: 'none', style: 'brightness(70%)' }, // Note: no unique filter type, handled by style
    { name: 'Contrast+', value: 'contrast', style: 'contrast(150%)' },
    { name: 'Blur', value: 'blur', style: 'blur(4px)' },
];

export const ImageEditor: React.FC<ImageEditorProps> = ({ isOpen, imageUrl, onClose, onSave }) => {
    const [history, setHistory] = useState<string[]>(['none']);
    const [historyIndex, setHistoryIndex] = useState(0);
    const imageRef = useRef<HTMLImageElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const currentFilter = history[historyIndex] || 'none';
    const canUndo = historyIndex > 0;
    const canRedo = historyIndex < history.length - 1;

    useEffect(() => {
        // Reset filter when a new image is opened
        if (isOpen) {
            setHistory(['none']);
            setHistoryIndex(0);
        }
    }, [isOpen, imageUrl]);

    const applyFilter = (filterStyle: string) => {
        const newHistory = history.slice(0, historyIndex + 1);
        newHistory.push(filterStyle);
        setHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
    };

    const handleUndo = () => {
        if (canUndo) {
            setHistoryIndex(historyIndex - 1);
        }
    };

    const handleRedo = () => {
        if (canRedo) {
            setHistoryIndex(historyIndex + 1);
        }
    };

    const handleSave = useCallback(() => {
        if (!imageRef.current || !canvasRef.current || !imageUrl) return;

        const image = imageRef.current;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        if (!ctx) return;

        // Use naturalWidth/Height to get original dimensions
        canvas.width = image.naturalWidth;
        canvas.height = image.naturalHeight;
        
        ctx.filter = currentFilter;
        ctx.drawImage(image, 0, 0);

        const dataUrl = canvas.toDataURL('image/png');
        onSave(dataUrl);
        onClose();
    }, [currentFilter, imageUrl, onClose, onSave]);

    if (!isOpen || !imageUrl) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4 fade-in">
            <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
                <div className="p-4 border-b border-gray-700 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-white">Image Editor</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white">&times;</button>
                </div>

                <div className="p-6 flex-grow overflow-y-auto flex flex-col md:flex-row gap-6">
                    {/* Image Preview */}
                    <div className="flex-grow flex items-center justify-center bg-gray-900/50 rounded-lg p-2">
                        <img 
                            ref={imageRef}
                            src={imageUrl} 
                            alt="Editing preview" 
                            className="max-w-full max-h-[60vh] object-contain"
                            style={{ filter: currentFilter }}
                            crossOrigin="anonymous" // Important for canvas
                        />
                        {/* Hidden canvas for processing */}
                        <canvas ref={canvasRef} className="hidden"></canvas>
                    </div>

                    {/* Controls */}
                    <div className="w-full md:w-64 flex-shrink-0">
                        <h3 className="text-lg font-semibold text-gray-300 mb-4">Controls</h3>
                        <div className="flex justify-center gap-4 mb-4">
                            <button onClick={handleUndo} disabled={!canUndo} className="disabled:opacity-50 disabled:cursor-not-allowed bg-gray-700 hover:bg-gray-600 p-2 rounded-full" title="Undo"><UndoIcon className="w-5 h-5" /></button>
                            <button onClick={handleRedo} disabled={!canRedo} className="disabled:opacity-50 disabled:cursor-not-allowed bg-gray-700 hover:bg-gray-600 p-2 rounded-full" title="Redo"><RedoIcon className="w-5 h-5" /></button>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-300 mb-4">Filters</h3>
                        <div className="grid grid-cols-2 gap-3">
                            {FILTERS.map(f => (
                                <button
                                    key={f.name}
                                    onClick={() => applyFilter(f.style)}
                                    className={`p-2 rounded-md text-sm transition-colors ${currentFilter === f.style ? 'bg-purple-600 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}
                                >
                                    {f.name}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
                
                <div className="p-4 border-t border-gray-700 flex justify-end gap-4">
                    <button onClick={onClose} className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg">
                        Cancel
                    </button>
                    <button onClick={handleSave} className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg">
                        Apply & Save
                    </button>
                </div>
            </div>
        </div>
    );
};
