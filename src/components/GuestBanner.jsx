import React from 'react';
import { Info, X } from 'lucide-react';

const GuestBanner = ({ onLogin, onDismiss }) => {
    return (
        <div className="bg-blue-600 text-white px-4 py-3 shadow-md relative animate-in slide-in-from-top duration-300">
            <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 pr-8">
                <div className="flex items-center gap-3">
                    <div className="bg-white/20 p-2 rounded-full">
                        <Info className="w-5 h-5" />
                    </div>
                    <p className="text-sm font-medium">
                        Welcome! You are currently in <span className="font-bold text-blue-100">Guest Mode</span>.
                        Log in to save your work to Google Drive and access it from anywhere.
                    </p>
                </div>
            </div>
            <button
                onClick={onDismiss}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-blue-200 hover:text-white hover:bg-blue-500/50 rounded-full transition-colors"
                aria-label="Dismiss"
            >
                <X className="w-5 h-5" />
            </button>
        </div>
    );
};

export default GuestBanner;
