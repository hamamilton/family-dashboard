import { useState, useEffect } from 'react';
import { usePhotos } from '../../hooks/usePhotos';
import { Star } from 'lucide-react';
import { SideQuest } from '../features/SideQuest';

export function Screensaver({ onWake, childrenProfiles, profiles }) {
    const { photos } = usePhotos();
    const [currentTime, setCurrentTime] = useState(new Date());
    const [visiblePhotos, setVisiblePhotos] = useState([]);

    // Update time every minute
    useEffect(() => {
        const timerId = setInterval(() => {
            setCurrentTime(new Date());
        }, 60000); // 1 minute
        return () => clearInterval(timerId);
    }, []);

    // Deal a new card every 8 seconds
    useEffect(() => {
        if (!photos || photos.length === 0) return;
        
        const addPhoto = (index) => {
            const photo = photos[index];
            const rotation = Math.floor(Math.random() * 30) - 15; // -15 to +15 degrees
            const xOffset = Math.floor(Math.random() * 200) - 100; // -100px to +100px
            const yOffset = Math.floor(Math.random() * 100) - 50; // -50px to +50px
            
            setVisiblePhotos(prev => [...prev, {
                ...photo,
                rotation,
                xOffset,
                yOffset,
                key: `${photo.id}-${Date.now()}`
            }]);
        };

        let currentIndex = 0;
        setVisiblePhotos([]); // reset on mount
        addPhoto(0);
        
        const photoInterval = setInterval(() => {
            currentIndex++;
            if (currentIndex >= photos.length) {
                // Clear the stack and start over
                setVisiblePhotos([]);
                currentIndex = 0;
            }
            addPhoto(currentIndex);
        }, 8000); // 8 seconds
        
        return () => clearInterval(photoInterval);
    }, [photos]);

    const formattedTime = currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const formattedDate = currentTime.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });

    return (
        <div 
            className="fixed inset-0 z-[100] bg-slate-900 flex flex-col justify-end cursor-pointer overflow-hidden select-none"
            onClick={onWake}
        >
            {/* The table / card stack background */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                {visiblePhotos.map((photo, i) => (
                    <div 
                        key={photo.key}
                        className="absolute shadow-2xl bg-white p-4 pb-12 rounded-sm pointer-events-none transition-transform"
                        style={{
                            transform: `translate(${photo.xOffset}px, ${photo.yOffset}px) rotate(${photo.rotation}deg)`,
                            zIndex: i,
                            maxWidth: '70vw',
                            maxHeight: '70vh'
                        }}
                    >
                        <div className="animate-drop-in w-full h-full">
                            <img 
                                src={photo.dataUrl} 
                                className="w-full h-full object-contain pointer-events-none" 
                                style={{ maxHeight: '60vh' }}
                                alt=""
                            />
                        </div>
                    </div>
                ))}
            </div>
            
            {/* Linear Gradient Overlay for text readability (only at the bottom) */}
            <div className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none z-[999]" />

            <div className="relative z-[1000] p-12 flex justify-between items-end w-full">
                {/* Lower Left: Date and Time */}
                <div className="text-white">
                    <div className="text-6xl font-black tracking-widest drop-shadow-lg">{formattedTime}</div>
                    <div className="text-2xl font-medium tracking-wide text-white/90 mt-2 drop-shadow-md">{formattedDate}</div>
                </div>

                {/* Lower Right: Children XP */}
                <div className="flex flex-col gap-4 max-w-sm w-full">
                    {childrenProfiles && childrenProfiles.map(child => (
                        <div key={child.id} className="bg-black/60 backdrop-blur-md rounded-2xl p-4 border border-white/20 flex items-center justify-between shadow-2xl">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center font-bold text-white text-lg shadow-lg">
                                    {child.name.charAt(0)}
                                </div>
                                <div className="font-bold text-white tracking-widest text-lg">{child.name}</div>
                            </div>
                            <div className="flex items-center gap-2 bg-white/10 px-3 py-1 rounded-full">
                                <Star className={`w-5 h-5 ${child.is_op ? 'text-amber-400 fill-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.8)] animate-pulse' : 'text-blue-400'}`} />
                                <span className="font-black text-white">{child.xp_balance} XP</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            
            {/* Top Left: Side Quest */}
            <div 
                className="absolute top-8 left-8 z-[1000]"
                onClick={(e) => e.stopPropagation()}
            >
                <SideQuest profiles={profiles} compact={true} />
            </div>

            {/* Floating 'Tap to wake' prompt */}
            <div className="absolute top-8 right-8 bg-black/40 backdrop-blur-sm px-4 py-2 rounded-full border border-white/20 text-white/70 text-sm tracking-widest uppercase animate-pulse z-[1000]">
                Tap anywhere to wake
            </div>
        </div>
    );
}
