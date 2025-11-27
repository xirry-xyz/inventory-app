import React from 'react';
import { X } from 'lucide-react';

const CustomModal = ({ title, children, isOpen, onClose }) => {
    const visibilityClass = isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none';

    return (
        <div
            className={`fixed inset-0 bg-gray-900 bg-opacity-70 z-50 flex justify-center items-center p-4 transition-opacity duration-300 ${visibilityClass}`}
            onClick={onClose}
            style={{ display: 'flex' }}
        >
            <div
                className={`bg-white rounded-4xl shadow-2xl p-6 w-full max-w-md transform transition-all duration-300 ${isOpen ? 'scale-100' : 'scale-95'}`}
                onClick={e => e.stopPropagation()}
            >
                <div className="flex justify-between items-center border-b border-gray-100 pb-3 mb-4">
                    <h3 className="text-xl font-bold text-gray-800">{title}</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100 transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>
                {children}
            </div>
        </div>
    );
};

export default CustomModal;
