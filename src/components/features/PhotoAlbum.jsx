import { useState, useRef } from 'react';
import { Camera, GripHorizontal, ChevronLeft, ChevronRight, Upload, Trash2, Image as ImageIcon } from 'lucide-react';
import { usePhotos } from '../../hooks/usePhotos';

export function PhotoAlbum() {
    const { photos, loading, addPhoto, deletePhoto } = usePhotos();
    const [currentIndex, setCurrentIndex] = useState(0);
    const fileInputRef = useRef(null);

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (file) {
            await addPhoto(file);
            setCurrentIndex(0); // Go to newest photo
        }
        // Reset input
        e.target.value = null;
    };

    const handleNext = () => {
        setCurrentIndex((prev) => (prev + 1) % photos.length);
    };

    const handlePrev = () => {
        setCurrentIndex((prev) => (prev - 1 + photos.length) % photos.length);
    };

    const handleDelete = () => {
        if (photos.length > 0) {
            const idToDelete = photos[currentIndex].id;
            deletePhoto(idToDelete);
            // Adjust index if we deleted the last item
            if (currentIndex === photos.length - 1) {
                setCurrentIndex(Math.max(0, currentIndex - 1));
            }
        }
    };

    return (
        <div className="flex flex-col h-full bg-slate-900 border-2 border-slate-300 dark:border-rose-900 shadow-lg dark:shadow-[0_0_30px_rgba(244,63,94,0.1)] relative">
            <div className="flex items-center justify-between p-6 pb-4 flex-none border-b border-slate-200 dark:border-rose-900/50 bg-white dark:bg-black z-10">
                <div className="flex items-center gap-4">
                    <GripHorizontal size={24} className="drag-handle cursor-grab active:cursor-grabbing text-slate-400 hover:text-rose-400 transition-colors flex-none" />
                    <Camera size={24} className="text-rose-500 drop-shadow-[0_0_8px_rgba(244,63,94,0.6)]" />
                    <h2 className="text-2xl font-black uppercase tracking-widest text-rose-600 dark:text-rose-400 drop-shadow-sm dark:drop-shadow-[0_0_10px_rgba(244,63,94,0.6)]">
                        Memory Bank
                    </h2>
                </div>
                
                <div className="flex items-center gap-2">
                    <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center gap-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 px-4 py-2 text-xs font-black uppercase tracking-widest transition-colors border border-rose-500/30"
                    >
                        <Upload size={16} />
                        <span className="hidden sm:inline">Upload</span>
                    </button>
                    <input 
                        type="file" 
                        accept="image/*" 
                        ref={fileInputRef} 
                        onChange={handleFileChange} 
                        className="hidden" 
                    />
                </div>
            </div>

            <div className="flex-1 relative overflow-hidden bg-black flex items-center justify-center">
                {loading ? (
                    <div className="text-rose-500 animate-pulse font-mono tracking-widest uppercase">Initializing...</div>
                ) : photos.length === 0 ? (
                    <div className="flex flex-col items-center gap-4 text-slate-500 font-mono">
                        <ImageIcon size={64} className="opacity-20" />
                        <p className="uppercase tracking-widest text-xs font-bold">No memories found.</p>
                        <button 
                            onClick={() => fileInputRef.current?.click()}
                            className="mt-4 text-rose-400 hover:text-rose-300 underline underline-offset-4 uppercase tracking-widest text-xs"
                        >
                            Upload your first photo
                        </button>
                    </div>
                ) : (
                    <>
                        {/* Current Photo */}
                        <img 
                            src={photos[currentIndex]?.dataUrl} 
                            alt={`Memory ${currentIndex + 1}`} 
                            className="w-full h-full object-contain animate-in fade-in duration-500"
                        />

                        {/* Navigation Overlay */}
                        {photos.length > 1 && (
                            <>
                                <button 
                                    onClick={handlePrev}
                                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-rose-500/50 text-white p-2 rounded-full backdrop-blur-sm transition-all"
                                >
                                    <ChevronLeft size={32} />
                                </button>
                                <button 
                                    onClick={handleNext}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-rose-500/50 text-white p-2 rounded-full backdrop-blur-sm transition-all"
                                >
                                    <ChevronRight size={32} />
                                </button>
                                
                                {/* Indicators */}
                                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                                    {photos.map((_, idx) => (
                                        <div 
                                            key={idx} 
                                            className={`h-1.5 rounded-full transition-all ${idx === currentIndex ? 'w-6 bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)]' : 'w-2 bg-white/30'}`} 
                                        />
                                    ))}
                                </div>
                            </>
                        )}

                        {/* Delete Button overlay */}
                        <button 
                            onClick={handleDelete}
                            className="absolute top-4 right-4 bg-black/50 hover:bg-red-600/80 text-white p-2 backdrop-blur-sm transition-all border border-red-500/30 group"
                            title="Delete Photo"
                        >
                            <Trash2 size={20} className="group-hover:scale-110 transition-transform" />
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}
