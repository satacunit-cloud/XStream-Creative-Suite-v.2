import React, { useState, useRef, useCallback, MouseEvent, TouchEvent } from 'react';

interface BeforeAfterSliderProps {
    beforeImage: string;
    afterImage: string;
}

export const BeforeAfterSlider: React.FC<BeforeAfterSliderProps> = ({ beforeImage, afterImage }) => {
    const [sliderPos, setSliderPos] = useState(50);
    const [isDragging, setIsDragging] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const handleMove = useCallback((clientX: number) => {
        if (!isDragging || !containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        let newSliderPos = ((clientX - rect.left) / rect.width) * 100;
        newSliderPos = Math.max(0, Math.min(100, newSliderPos));
        setSliderPos(newSliderPos);
    }, [isDragging]);

    const handleMouseMove = useCallback((e: globalThis.MouseEvent) => {
        handleMove(e.clientX);
    }, [handleMove]);

    const handleTouchMove = useCallback((e: globalThis.TouchEvent) => {
        handleMove(e.touches[0].clientX);
    }, [handleMove]);

    const handleMouseUp = useCallback(() => {
        setIsDragging(false);
    }, []);

    const handleTouchEnd = useCallback(() => {
        setIsDragging(false);
    }, []);
    
    React.useEffect(() => {
        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('touchmove', handleTouchMove);
            window.addEventListener('mouseup', handleMouseUp);
            window.addEventListener('touchend', handleTouchEnd);
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('touchmove', handleTouchMove);
            window.removeEventListener('mouseup', handleMouseUp);
            window.removeEventListener('touchend', handleTouchEnd);
        };
    }, [isDragging, handleMouseMove, handleTouchMove, handleMouseUp, handleTouchEnd]);

    const handleMouseDown = (e: MouseEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleTouchStart = (e: TouchEvent<HTMLDivElement>) => {
        setIsDragging(true);
    };

    return (
        <div 
            ref={containerRef}
            className="relative w-full aspect-square select-none overflow-hidden rounded-lg group"
        >
            <img 
                src={beforeImage} 
                alt="Before" 
                className="absolute top-0 left-0 w-full h-full object-contain"
            />
            <div 
                className="absolute top-0 left-0 w-full h-full object-contain overflow-hidden" 
                style={{ clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }}
            >
                <img 
                    src={afterImage} 
                    alt="After" 
                    className="absolute top-0 left-0 w-full h-full object-contain"
                />
            </div>
            <div 
                className="absolute top-0 h-full w-1 bg-white/50 cursor-ew-resize opacity-0 group-hover:opacity-100 transition-opacity" 
                style={{ left: `${sliderPos}%`, transform: 'translateX(-50%)' }}
                onMouseDown={handleMouseDown}
                onTouchStart={handleTouchStart}
            >
                <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 bg-white rounded-full h-10 w-10 flex items-center justify-center shadow-lg">
                    <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 9l4-4 4 4m0 6l-4 4-4-4"></path>
                    </svg>
                </div>
            </div>
        </div>
    );
};