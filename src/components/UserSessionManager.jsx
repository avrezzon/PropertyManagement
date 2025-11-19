import React, { useState, useEffect } from 'react';
import { useGoogleLogin, googleLogout } from '@react-oauth/google';
import axios from 'axios';
import { Save, Upload, Download, LogIn, LogOut, User, FileJson, AlertCircle } from 'lucide-react';

const UserSessionManager = ({ currentData, onLoad, isDirty, user, onLoginSuccess, onLogout }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [successMsg, setSuccessMsg] = useState(null);
    const [userProfile, setUserProfile] = useState(null);

    // Clear messages after 3 seconds
    useEffect(() => {
        if (successMsg || error) {
            const timer = setTimeout(() => {
                setSuccessMsg(null);
                setError(null);
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [successMsg, error]);

    // --- Google Auth ---
    const login = useGoogleLogin({
        onSuccess: async (tokenResponse) => {
            console.log('Google Login Success - Token Response:', tokenResponse);
            try {
                console.log('Fetching user info...');
                const userInfo = await axios.get(
                    'https://www.googleapis.com/oauth2/v3/userinfo',
                    { headers: { Authorization: `Bearer ${tokenResponse.access_token}` } },
                );
                console.log('User Info Fetched:', userInfo.data);

                // Pass both the token and the user info up to the parent
                onLoginSuccess({
                    token: tokenResponse,
                    profile: userInfo.data
                });
            } catch (error) {
                console.error('Failed to fetch user info:', error);
            }
        },
        onError: error => console.error('Google Login Failed:', error),
        scope: 'https://www.googleapis.com/auth/drive.file profile email',
    });

    useEffect(() => {
        if (user) {
            axios
                .get(`https://www.googleapis.com/oauth2/v1/userinfo?access_token=${user.access_token}`, {
                    headers: {
                        Authorization: `Bearer ${user.access_token}`,
                        Accept: 'application/json'
                    }
                })
                .then((res) => {
                    setUserProfile(res.data);
                })
                .catch((err) => console.log(err));
        } else {
            setUserProfile(null);
        }
    }, [user]);

    const handleLogout = () => {
        googleLogout();
        onLogout();
        setSuccessMsg('Logged out successfully');
    };

    // --- Drive API ---
    const saveToDrive = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const fileContent = JSON.stringify(currentData, null, 2);
            const fileMetadata = {
                name: 'rental_forecast_config.json',
                mimeType: 'application/json',
            };

            // 1. Search for existing file
            const searchResponse = await axios.get(
                'https://www.googleapis.com/drive/v3/files',
                {
                    headers: { Authorization: `Bearer ${user.access_token}` },
                    params: {
                        q: "name = 'rental_forecast_config.json' and trashed = false",
                        spaces: 'drive',
                    },
                }
            );

            const files = searchResponse.data.files;

            if (files.length > 0) {
                // Update existing
                const fileId = files[0].id;
                await axios.patch(
                    `https://www.googleapis.com/drive/v3/files/${fileId}?uploadType=media`,
                    fileContent,
                    {
                        headers: {
                            Authorization: `Bearer ${user.access_token}`,
                            'Content-Type': 'application/json',
                        },
                    }
                );
                setSuccessMsg('Session saved to Drive!');
            } else {
                // Create new
                const form = new FormData();
                form.append('metadata', new Blob([JSON.stringify(fileMetadata)], { type: 'application/json' }));
                form.append('file', new Blob([fileContent], { type: 'application/json' }));

                await axios.post(
                    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
                    form,
                    {
                        headers: { Authorization: `Bearer ${user.access_token}` },
                    }
                );
                setSuccessMsg('New session file created in Drive!');
            }
        } catch (err) {
            console.error(err);
            setError('Failed to save to Drive');
        } finally {
            setLoading(false);
        }
    };

    const loadFromDrive = async () => {
        if (!user) return;
        setLoading(true);
        try {
            // 1. Search for file
            const searchResponse = await axios.get(
                'https://www.googleapis.com/drive/v3/files',
                {
                    headers: { Authorization: `Bearer ${user.access_token}` },
                    params: {
                        q: "name = 'rental_forecast_config.json' and trashed = false",
                        spaces: 'drive',
                    },
                }
            );

            const files = searchResponse.data.files;

            if (files.length > 0) {
                const fileId = files[0].id;
                // 2. Download content
                const fileResponse = await axios.get(
                    `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
                    {
                        headers: { Authorization: `Bearer ${user.access_token}` },
                    }
                );
                onLoad(fileResponse.data);
                setSuccessMsg('Session loaded from Drive!');
            } else {
                setError('No configuration file found in Drive.');
            }
        } catch (err) {
            console.error(err);
            setError('Failed to load from Drive');
        } finally {
            setLoading(false);
        }
    };

    // --- Guest Mode ---
    const downloadJson = async () => {
        const jsonString = JSON.stringify(currentData, null, 2);

        try {
            // Try using the File System Access API (Chrome, Edge, Opera)
            if (window.showSaveFilePicker) {
                const handle = await window.showSaveFilePicker({
                    suggestedName: 'rental_forecast_config.json',
                    types: [{
                        description: 'JSON File',
                        accept: { 'application/json': ['.json'] },
                    }],
                });
                const writable = await handle.createWritable();
                await writable.write(jsonString);
                await writable.close();
                setSuccessMsg('File saved successfully!');
            } else {
                // Fallback for other browsers (Firefox, Safari)
                const blob = new Blob([jsonString], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = "rental_forecast_config.json";
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
            }
        } catch (err) {
            // User cancelled or error occurred
            if (err.name !== 'AbortError') {
                console.error('Failed to save file:', err);
                setError('Failed to save file');
            }
        }
    };

    const uploadJson = (event) => {
        const fileReader = new FileReader();
        fileReader.readAsText(event.target.files[0], "UTF-8");
        fileReader.onload = (e) => {
            try {
                const parsedData = JSON.parse(e.target.result);
                onLoad(parsedData);
                setSuccessMsg('Session loaded from file!');
            } catch (err) {
                setError('Invalid JSON file');
            }
        };
    };

    return (
        <div className="bg-white border-b border-slate-200 px-4 py-3 flex flex-col md:flex-row justify-between items-center gap-4 shadow-sm">
            <div className="flex items-center gap-4">
                {user ? (
                    <div className="flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200">
                        <User className="w-4 h-4" />
                        <span className="font-medium">{userProfile ? `Hi, ${userProfile.given_name || userProfile.name}` : 'Logged In'}</span>
                    </div>
                ) : (
                    <div className="flex items-center gap-2 text-sm text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full">
                        <User className="w-4 h-4" />
                        <span className="font-medium">Guest Mode</span>
                    </div>
                )}

                {/* Status Messages */}
                {loading && <span className="text-xs text-blue-600 animate-pulse">Syncing...</span>}
                {error && <span className="text-xs text-rose-600 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {error}</span>}
                {successMsg && <span className="text-xs text-emerald-600">{successMsg}</span>}
            </div>

            <div className="flex items-center gap-2">
                {user ? (
                    <>
                        <button
                            onClick={saveToDrive}
                            className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors border ${isDirty ? 'bg-blue-600 text-white border-blue-700 hover:bg-blue-700' : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'}`}
                            title="Save to Google Drive"
                        >
                            <Save className="w-4 h-4" /> Save
                        </button>
                        <button
                            onClick={loadFromDrive}
                            className="flex items-center gap-2 px-3 py-1.5 bg-white text-slate-700 border border-slate-300 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
                            title="Load from Google Drive"
                        >
                            <Download className="w-4 h-4" /> Load
                        </button>
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-2 px-3 py-1.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-lg text-sm font-medium hover:bg-rose-100 transition-colors ml-2"
                        >
                            <LogOut className="w-4 h-4" /> Logout
                        </button>
                    </>
                ) : (
                    <>
                        <button
                            onClick={downloadJson}
                            className="flex items-center gap-2 px-3 py-1.5 bg-white text-slate-700 border border-slate-300 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
                            title="Download JSON"
                        >
                            <FileJson className="w-4 h-4" /> Export
                        </button>
                        <label className="flex items-center gap-2 px-3 py-1.5 bg-white text-slate-700 border border-slate-300 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors cursor-pointer">
                            <Upload className="w-4 h-4" /> Import
                            <input type="file" accept=".json" onChange={uploadJson} className="hidden" />
                        </label>
                        <button
                            onClick={() => login()}
                            className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white border border-blue-700 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors ml-2 shadow-sm"
                        >
                            <LogIn className="w-4 h-4" /> Login with Google
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};

export default UserSessionManager;
