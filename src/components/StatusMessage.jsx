import React from 'react';

const StatusMessage = ({ statusMessage }) => {
    if (!statusMessage) return null;

    return (
        <div
            className={`fixed top-4 left-1/2 transform -translate-x-1/2 px-5 py-3 rounded-full shadow-lg z-50 transition-opacity duration-300
            ${statusMessage.isError ? 'bg-red-500' : 'bg-green-500'} text-white font-semibold`}
        >
            {statusMessage.message}
        </div>
    );
};

export default StatusMessage;
