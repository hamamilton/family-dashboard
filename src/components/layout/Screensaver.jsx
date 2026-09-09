import { useState, useEffect } from 'react';
import { usePhotos } from '../../hooks/usePhotos';
import { useDadJoke } from '../../hooks/useDadJoke';
export function Screensaver({ onWake }) {
    const { photos } = usePhotos();
    const { fetchJoke } = useDadJoke();
    const [currentTime, setCurrentTime] = useState(new Date());
    const [visibleItems, setVisibleItems] = useState([]);
    const [particles, setParticles] = useState([]);

    // Generate background particles once
    useEffect(() => {
        const p = Array.from({ length: 25 }).map((_, i) => ({
            id: i,
            left: Math.random() * 100 + '%',
            size: Math.random() * 15 + 5 + 'px',
            animationDuration: Math.random() * 25 + 15 + 's',
            animationDelay: Math.random() * -20 + 's', // negative to start immediately spread out
            opacity: Math.random() * 0.4 + 0.1
        }));
        setParticles(p);
    }, []);

    // Update time every minute
    useEffect(() => {
        const timerId = setInterval(() => {
            setCurrentTime(new Date());
        }, 60000);
        return () => clearInterval(timerId);
    }, []);

    // Deal a new card or joke every 8 seconds
    useEffect(() => {
        if (!photos || photos.length === 0) return;
        
        let currentIndex = 0;
        let itemCounter = 0;
        
        const addItem = async () => {
            let isJoke = false;
            let jokeText = '';
            
            itemCounter++;
            if (itemCounter % 4 === 0) {
                jokeText = await fetchJoke();
                if (jokeText) {
                    isJoke = true;
                }
            }

            const rotation = Math.floor(Math.random() * 30) - 15;
            const xOffset = Math.floor(Math.random() * 150) - 75;
            const yOffset = Math.floor(Math.random() * 100) - 50; 
            
            const newItem = {
                type: isJoke ? 'joke' : 'photo',
                text: jokeText,
                dataUrl: isJoke ? null : photos[currentIndex].dataUrl,
                rotation,
                xOffset,
                yOffset,
                key: `item-${Date.now()}`,
                color: isJoke ? ['bg-yellow-200', 'bg-cyan-200', 'bg-fuchsia-200'][Math.floor(Math.random() * 3)] : 'bg-white'
            };
            
            setVisibleItems(prev => {
                const newArr = [...prev, newItem];
                // Keep max 4 items (rolling buffer)
                if (newArr.length > 4) {
                    return newArr.slice(newArr.length - 4);
                }
                return newArr;
            });
            
            if (!isJoke) {
                currentIndex++;
                if (currentIndex >= photos.length) currentIndex = 0;
            }
        };

        setVisibleItems([]);
        addItem();
        
        const interval = setInterval(addItem, 8000);
        return () => clearInterval(interval);
    }, [photos, fetchJoke]);

    const formattedTime = currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const formattedDate = currentTime.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });

    return (
        <div 
            className="fixed inset-0 z-[100] bg-slate-900 flex flex-col justify-end cursor-pointer overflow-hidden select-none"
            onClick={onWake}
        >
            {/* Full Screen Layout for Photos & Jokes */}
            <div className="absolute inset-0 flex flex-col relative overflow-hidden pointer-events-none bg-slate-900">
                <div className="h-full w-full relative overflow-hidden flex items-center justify-center">
                    {/* Background Particles */}
                    {particles.map(p => (
                        <div 
                            key={p.id}
                            className="particle"
                            style={{
                                left: p.left,
                                width: p.size,
                                height: p.size,
                                bottom: '-10%',
                                animation: `drift-up ${p.animationDuration} linear infinite`,
                                animationDelay: p.animationDelay,
                                opacity: p.opacity
                            }}
                        />
                    ))}

                    {visibleItems.map((item, i) => {
                        // The oldest item fades out when there are 4 items
                        const isFading = visibleItems.length === 4 && i === 0;
                        
                        return (
                            <div 
                                key={item.key}
                                className={`absolute shadow-2xl p-4 ${item.type === 'photo' ? 'pb-12 bg-white' : `p-8 pb-8 ${item.color}`} rounded-sm pointer-events-none transition-all duration-[2000ms] ease-in-out ${isFading ? 'opacity-0 scale-90 translate-y-8' : 'opacity-100 scale-100'}`}
                                style={{
                                    transform: `translate(${item.xOffset}px, ${item.yOffset}px) rotate(${item.rotation}deg)`,
                                    zIndex: i,
                                    maxWidth: '80%',
                                    maxHeight: '80%'
                                }}
                            >
                                <div className="washi-tape"></div>
                                <div className="animate-drop-in w-full h-full flex items-center justify-center overflow-hidden">
                                    <div className="animate-ken-burns w-full h-full flex items-center justify-center">
                                        {item.type === 'photo' ? (
                                            <img 
                                                src={item.dataUrl} 
                                                className="w-full h-full object-contain pointer-events-none drop-shadow-md" 
                                                style={{ maxHeight: '70vh' }}
                                                alt=""
                                            />
                                        ) : (
                                            <div className="text-3xl md:text-5xl lg:text-6xl font-black text-slate-800 tracking-wide text-center leading-relaxed font-sans p-8" style={{ maxHeight: '70vh', maxWidth: '50vw' }}>
                                                "{item.text}"
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                    <div className="absolute inset-0 bg-black/10 pointer-events-none z-[998]" />
                </div>
            </div>

            {/* Linear Gradient Overlay for text readability (only at the bottom) */}
            <div className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none z-[999]" />

            <div className="relative z-[1000] p-8 md:p-12 flex justify-end w-full">
                {/* Lower Right: Date and Time */}
                <div className="text-white text-right">
                    <div className="text-5xl md:text-6xl font-black tracking-widest drop-shadow-lg">{formattedTime}</div>
                    <div className="text-xl md:text-2xl font-medium tracking-wide text-white/90 mt-2 drop-shadow-md">{formattedDate}</div>
                </div>
            </div>

            {/* Top Left: Floating 'Tap to wake' prompt */}
            <div className="hidden md:block absolute top-8 left-8 bg-black/40 backdrop-blur-sm px-4 py-2 rounded-full border border-white/20 text-white/70 text-sm tracking-widest uppercase animate-pulse z-[1000]">
                Tap anywhere to wake
            </div>
        </div>
    );
}
