import React, { useEffect, useRef, useState } from 'react';

declare global {
    interface Window {
        JitsiMeetExternalAPI: any;
    }
}

interface OnlineLessonRoomProps {
    roomName: string;
    userName: string;
    userEmail?: string;
    isTeacher: boolean;
    onClose: () => void;
}

const OnlineLessonRoom: React.FC<OnlineLessonRoomProps> = ({
    roomName,
    userName,
    userEmail,
    isTeacher,
    onClose
}) => {
    const jitsiContainerRef = useRef<HTMLDivElement>(null);
    const [api, setApi] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!window.JitsiMeetExternalAPI) {
            console.error("Jitsi Meet API not loaded");
            setLoading(false);
            return;
        }

        const domain = 'meet.jit.si';
        const options = {
            roomName: roomName,
            width: '100%',
            height: '100%',
            parentNode: jitsiContainerRef.current,
            userInfo: {
                displayName: userName,
                email: userEmail
            },
            configOverwrite: {
                startWithAudioMuted: true,
                startWithVideoMuted: false,
                prejoinPageEnabled: false,
                disableDeepLinking: true,
            },
            interfaceConfigOverwrite: {
                TOOLBAR_BUTTONS: [
                    'microphone', 'camera', 'closedcaptions', 'desktop', 'fullscreen',
                    'fodeviceselection', 'hangup', 'profile', 'chat', 'recording',
                    'livestreaming', 'etherpad', 'sharedvideo', 'settings', 'raisehand',
                    'videoquality', 'filmstrip', 'invite', 'feedback', 'stats', 'shortcuts',
                    'tileview', 'videobackgroundblur', 'download', 'help', 'mute-everyone',
                    'security'
                ],
                SHOW_JITSI_WATERMARK: false,
                SHOW_WATERMARK_FOR_GUESTS: false,
                DEFAULT_REMOTE_DISPLAY_NAME: 'Öğrenci',
            },
            lang: 'tr'
        };

        const newApi = new window.JitsiMeetExternalAPI(domain, options);
        setApi(newApi);
        setLoading(false);

        newApi.addEventListeners({
            videoConferenceLeft: () => {
                onClose();
            },
            readyToClose: () => {
                onClose();
            }
        });

        return () => {
            newApi.dispose();
        };
    }, [roomName, userName, userEmail, onClose]);

    return (
        <div className="fixed inset-0 z-50 bg-black flex flex-col">
            {loading && (
                <div className="absolute inset-0 flex items-center justify-center text-white">
                    <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary"></div>
                    <span className="ml-4 text-xl">Ders odası hazırlanıyor...</span>
                </div>
            )}
            <div className="relative flex-1 w-full h-full" ref={jitsiContainerRef}></div>

            {/* Custom Control Bar (Optional - Jitsi has its own, but we can add a wrapper header) */}
            <div className="absolute top-4 left-4 z-50">
                <button
                    onClick={onClose}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 transition-colors"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                    Dersi Kapat
                </button>
            </div>
        </div>
    );
};

export default OnlineLessonRoom;
