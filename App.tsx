
import React, { useState } from 'react';
import { CreativeAssistant } from './components/CreativeAssistant';
import { FaceSwap } from './components/FaceSwap';
import { ClothingSwap } from './components/ClothingSwap';
import { Library } from './components/Library';
import { BackgroundRemover } from './components/BackgroundRemover';
import { SparklesIcon, UsersIcon, ShirtIcon, LibraryIcon, ScissorsIcon } from './components/icons';
import { Toast, ToastData } from './components/Toast';

export interface LibraryItem {
  type: string;
  imageUrl: string;
  originalUrl?: string;
  videoUrl?: string;
}

type Tool = 'menu' | 'jacksons-creative-ai' | 'face-swap' | 'clothing-swap' | 'background-remover' | 'library';

const App: React.FC = () => {
    const [currentTool, setCurrentTool] = useState<Tool>('menu');
    const [libraryCreations, setLibraryCreations] = useState<LibraryItem[]>([]);
    const [toasts, setToasts] = useState<ToastData[]>([]);
    const [imageForTool, setImageForTool] = useState<{ url: string, targetTool: Tool } | null>(null);

    const addToast = (message: string) => {
        setToasts(prev => [...prev, { id: Date.now(), message }]);
    };

    const removeToast = (id: number) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    };

    const handleCreationComplete = (item: LibraryItem) => {
        setLibraryCreations(prev => [item, ...prev]);
        addToast("Saved to Library!");
    };

    const handleUseImageInTool = (imageUrl: string, targetTool: Tool) => {
        setImageForTool({ url: imageUrl, targetTool });
        setCurrentTool(targetTool);
    };

    const clearImageForTool = () => {
        setImageForTool(null);
    };

    const renderTool = () => {
        let initialImage: string | undefined = undefined;
        if (imageForTool && imageForTool.targetTool === currentTool) {
            initialImage = imageForTool.url;
        }

        switch (currentTool) {
            case 'jacksons-creative-ai':
                return <CreativeAssistant onBack={() => setCurrentTool('menu')} addToast={addToast} onCreationComplete={handleCreationComplete} />;
            case 'face-swap':
                return <FaceSwap onBack={() => setCurrentTool('menu')} addToast={addToast} onCreationComplete={handleCreationComplete} initialImage={initialImage} onClearInitialImage={clearImageForTool} />;
            case 'clothing-swap':
                return <ClothingSwap onBack={() => setCurrentTool('menu')} addToast={addToast} onCreationComplete={handleCreationComplete} initialImage={initialImage} onClearInitialImage={clearImageForTool} />;
            case 'background-remover':
                return <BackgroundRemover onBack={() => setCurrentTool('menu')} addToast={addToast} onCreationComplete={handleCreationComplete} initialImage={initialImage} onClearInitialImage={clearImageForTool} />;
            case 'library':
                return <Library creations={libraryCreations} onBack={() => setCurrentTool('menu')} onUseImage={handleUseImageInTool} />;
            case 'menu':
            default:
                return (
                    <div className="w-full max-w-5xl mx-auto text-center fade-in">
                        <h1 className="text-5xl md:text-6xl font-extrabold animate-gradient bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 bg-clip-text text-transparent [text-shadow:0_0_15px_rgba(192,132,252,0.5)]">XStream Creative Suite</h1>
                        <p className="text-xl text-gray-400 mt-4">Your AI-powered suite for creative content generation.</p>
                        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8">
                            <MenuButton
                                icon={<SparklesIcon />}
                                title="Jackson's Creative AI"
                                description="Generate rich, detailed images and text from a simple prompt, then iterate."
                                onClick={() => setCurrentTool('jacksons-creative-ai')}
                            />
                            <MenuButton
                                icon={<UsersIcon />}
                                title="Face Swap"
                                description="Swap faces between two images with a single click."
                                onClick={() => setCurrentTool('face-swap')}
                            />
                            <MenuButton
                                icon={<ShirtIcon />}
                                title="Clothing Swap (BETA)"
                                description="Virtually try on clothes by swapping outfits between images."
                                onClick={() => setCurrentTool('clothing-swap')}
                            />
                            <MenuButton
                                icon={<ScissorsIcon />}
                                title="Background Remover"
                                description="Remove an image's background, then generate a new one, upload your own, or apply a green screen."
                                onClick={() => setCurrentTool('background-remover')}
                            />
                        </div>
                        <div className="mt-10">
                            <MenuButton
                                icon={<LibraryIcon className="h-6 w-6" />}
                                title={`View Library (${libraryCreations.length})`}
                                description="Browse all the creations you've made in this session."
                                onClick={() => setCurrentTool('library')}
                                isLibraryButton={true}
                            />
                        </div>
                    </div>
                );
        }
    }

    return (
        <div className="bg-gray-900 text-white min-h-screen p-4 sm:p-6 lg:p-8 flex items-center justify-center">
             <main className="container mx-auto">
                {renderTool()}
             </main>
             <div className="fixed top-5 right-5 z-50 space-y-3">
                {toasts.map(toast => (
                    <Toast key={toast.id} {...toast} onDismiss={removeToast} />
                ))}
            </div>
        </div>
    );
};

interface MenuButtonProps {
    icon: React.ReactNode;
    title: string;
    description: string;
    onClick: () => void;
    isLibraryButton?: boolean;
}

const MenuButton: React.FC<MenuButtonProps> = ({ icon, title, description, onClick, isLibraryButton }) => (
    <div className="relative group">
        <button 
            onClick={onClick} 
            className={`w-full h-full bg-gray-800 p-6 rounded-lg text-left transition-all duration-300 transform hover:-translate-y-2 hover:shadow-2xl hover:shadow-purple-500/20 animate-gradient bg-gradient-to-br from-gray-800 to-gray-900 ${isLibraryButton ? 'inline-flex items-center justify-center gap-2' : ''}`}
        >
            <div className={`text-purple-400 w-10 h-10 mb-4 ${isLibraryButton ? 'mb-0' : ''}`}>{icon}</div>
            <div className={isLibraryButton ? '' : 'w-full'}>
                <h2 className={`font-bold text-white ${isLibraryButton ? 'text-lg' : 'text-2xl mb-2'}`}>{title}</h2>
                {!isLibraryButton && <p className="text-gray-400">{description}</p>}
            </div>
        </button>
        <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-max max-w-xs bg-gray-900/90 backdrop-blur-sm text-white text-xs rounded-lg py-1.5 px-3 opacity-0 group-hover:opacity-100 group-hover:scale-100 scale-95 transition-all duration-300 pointer-events-none">
            {description}
            <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-gray-900/90"></div>
        </div>
    </div>
);


export default App;