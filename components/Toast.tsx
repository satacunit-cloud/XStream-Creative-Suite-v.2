import React, { useState, useEffect } from 'react';

export interface ToastData {
    id: number;
    message: string;
}

interface ToastProps extends ToastData {
    onDismiss: (id: number) => void;
}

export const Toast: React.FC<ToastProps> = ({ id, message, onDismiss }) => {
    const [visible, setVisible] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setVisible(false);
            // Wait for fade-out animation to complete before removing from DOM
            setTimeout(() => onDismiss(id), 500);
        }, 3000); // Toast visible for 3 seconds

        return () => clearTimeout(timer);
    }, [id, onDismiss]);

    return (
        <div
            className={`bg-green-500 text-white font-bold py-2 px-4 rounded-lg shadow-lg transition-all duration-500 ${visible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-full'}`}
        >
            {message}
        </div>
    );
};