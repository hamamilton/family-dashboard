import { GripHorizontal, Calendar, ExternalLink } from 'lucide-react';

export function LittleVillageEvents() {
    return (
        <div className="flex flex-col h-full bg-slate-900 border-2 border-slate-300 dark:border-rose-900 shadow-lg dark:shadow-[0_0_30px_rgba(244,63,94,0.1)] relative overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-6 pb-4 flex-none border-b border-slate-200 dark:border-rose-900/50 bg-white dark:bg-black z-10">
                <div className="flex items-center gap-4">
                    <GripHorizontal size={24} className="drag-handle cursor-grab active:cursor-grabbing text-slate-400 hover:text-rose-400 transition-colors flex-none" />
                    <Calendar size={24} className="text-rose-500 drop-shadow-[0_0_8px_rgba(244,63,94,0.6)]" />
                    <h2 className="text-2xl font-black uppercase tracking-widest text-rose-600 dark:text-rose-400 drop-shadow-sm dark:drop-shadow-[0_0_10px_rgba(244,63,94,0.6)] truncate">
                        Little Village
                    </h2>
                </div>
                <a 
                    href="https://littlevillagemag.com/events/" 
                    target="_blank" 
                    rel="noreferrer"
                    className="text-slate-400 hover:text-rose-400 transition-colors"
                    title="Open Full Calendar"
                >
                    <ExternalLink size={20} />
                </a>
            </div>

            {/* Content Area - Iframe Wrapper */}
            <div className="flex-1 w-full bg-white overflow-hidden relative" style={{ minHeight: '500px' }}>
                <iframe 
                    src="https://littlevillagemag.com/events/show/?location=Iowa+City,+IA&distance=25"
                    className="absolute top-0 left-0 w-full h-full border-none"
                    title="Little Village Event Calendar"
                />
            </div>
        </div>
    );
}
