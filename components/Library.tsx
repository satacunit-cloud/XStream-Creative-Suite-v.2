import React, { useState, useRef, useEffect } from 'react';
import { LibraryItem } from '../App';
import { Lightbox } from './Lightbox';
import { DotsVerticalIcon, UsersIcon, ShirtIcon, ScissorsIcon } from './icons';

type Tool = 'face-swap' | 'clothing-swap' | 'background-remover';

interface LibraryProps {
    creations: LibraryItem[];
    onBack: () => void;
    onUseImage: (imageUrl: string, targetTool: Tool) => void;
}

const useOutsideClick = (ref: React.RefObject<HTMLDivElement>, callback: () => void) => {
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (ref.current && !ref.current.contains(event.target as Node)) {
                callback();
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [ref, callback]);
};

export const Library: React.FC<LibraryProps> = ({ creations, onBack, onUseImage }) => {
    const [lightboxImage, setLightboxImage] = useState<string | null>(null);
    const [activeMenu, setActiveMenu] = useState<number | null>(null);
    const menuRef = useRef<HTMLDivElement>(null);
    
    useOutsideClick(menuRef, () => setActiveMenu(null));

    const menuOptions: { label: string, tool: Tool, icon: React.ReactNode }[] = [
        { label: 'Use in Face Swap', tool: 'face-swap', icon: <UsersIcon className="w-5 h-5 mr-2" /> },
        { label: 'Use in Clothing Swap', tool: 'clothing-swap', icon: <ShirtIcon className="w-5 h-5 mr-2" /> },
        { label: 'Remove Background', tool: 'background-remover', icon: <ScissorsIcon className="w-5 h-5 mr-2" /> },
    ];

    return (
        <div className="w-full max-w-7xl mx-auto flex flex-col items-center">
            {lightboxImage && <Lightbox imageUrl={lightboxImage} onClose={() => setLightboxImage(null)} />}
            <div className="self-start mb-6">
                <button onClick={onBack} className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg">
                    &larr; Back to Menu
                </button>
            </div>

            <div className="w-full text-center mb-8 fade-in">
                <h1 className="text-4xl font-extrabold text-white">Creations Library</h1>
                <p className="text-lg text-gray-400 mt-2">All images you've generated in this session.</p>
            </div>

            {creations.length === 0 ? (
                <div className="text-center bg-gray-800 p-10 rounded-lg fade-in">
                    <p className="text-xl text-gray-400">Your library is empty.</p>
                    <p className="text-gray-500 mt-2">Go back to the menu to start creating!</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 w-full">
                    {creations.map((item, index) => (
                        <div 
                            key={index} 
                            className="bg-gray-800 p-4 rounded-lg shadow-lg flex flex-col fade-in group"
                            style={{ animationDelay: `${index * 100}ms` }}
                        >
                             <div className="flex justify-between items-center mb-4">
                                <h2 className="text-lg font-bold text-purple-400">{item.type}</h2>
                                {item.imageUrl && (
                                    <div className="relative">
                                        <button onClick={() => setActiveMenu(activeMenu === index ? null : index)} className="text-gray-400 hover:text-white p-1 rounded-full">
                                            <DotsVerticalIcon className="w-6 h-6" />
                                        </button>
                                        {activeMenu === index && (
                                            <div ref={menuRef} className="absolute right-0 mt-2 w-56 bg-gray-700 rounded-md shadow-lg z-10 py-1">
                                                {menuOptions.map(option => (
                                                    <button key={option.tool} onClick={() => { onUseImage(item.imageUrl, option.tool); setActiveMenu(null); }} className="w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-purple-600 flex items-center">
                                                        {option.icon}
                                                        {option.label}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                            <div className="flex-grow cursor-pointer" onClick={() => item.imageUrl && setLightboxImage(item.imageUrl)}>
                                {item.videoUrl ? (
                                     <div>
                                        <p className="text-sm text-center text-gray-400 mb-1">Animated Result</p>
                                        <video src={item.videoUrl} controls autoPlay loop className="w-full h-auto rounded-md object-cover aspect-square" />
                                    </div>
                                ) : item.originalUrl ? (
                                    <div className="grid grid-cols-2 gap-2">
                                        <div onClick={(e) => { e.stopPropagation(); setLightboxImage(item.originalUrl!)}}>
                                            <p className="text-sm text-center text-gray-400 mb-1">Original</p>
                                            <img src={item.originalUrl} alt="Original" className="w-full h-auto rounded-md object-cover aspect-square" />
                                        </div>
                                        <div onClick={(e) => { e.stopPropagation(); setLightboxImage(item.imageUrl)}}>
                                            <p className="text-sm text-center text-gray-400 mb-1">Result</p>
                                            <img src={item.imageUrl} alt="Result" className="w-full h-auto rounded-md object-cover aspect-square" />
                                        </div>
                                    </div>
                                ) : (
                                    <img src={item.imageUrl} alt="Creative Assistant Result" className="w-full h-auto rounded-md object-cover aspect-square" />
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};