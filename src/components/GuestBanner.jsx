import React from 'react';
import { Info, X } from 'lucide-react';

// Updated with mountain background

const GuestBanner = ({ onLogin, onDismiss }) => {
    return (
        <div className="relative px-4 py-3 shadow-md overflow-hidden animate-in slide-in-from-top duration-300" style={{ backgroundImage: 'url(/mountain-bg.png)', backgroundSize: 'cover', backgroundPosition: 'center' }}>
            <div className="absolute inset-0 bg-blue-600/80 backdrop-blur-sm"></div>
            <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 pr-8 relative z-10">
                <div className="flex items-center gap-3">
                    <div className="bg-white/20 p-2 rounded-full">
                        <Info className="w-5 h-5 text-white" />
                    </div>
                    <p className="text-sm font-medium text-white">
                        Welcome! You are currently in <span className="font-bold text-blue-100">Guest Mode</span>.
                        Log in to save your work to Google Drive and access it from anywhere.
                    </p>
                </div>
            </div>
            <button
                onClick={onDismiss}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-blue-200 hover:text-white hover:bg-blue-500/50 rounded-full transition-colors z-10"
                aria-label="Dismiss"
            >
                <X className="w-5 h-5" />
            </button>
        </div>
    );
};

export default GuestBanner;
