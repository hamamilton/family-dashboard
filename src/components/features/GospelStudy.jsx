import { Book, Quote, ExternalLink, GripHorizontal } from 'lucide-react';

const CFM_SCHEDULE = [
    { start: '2026-05-04', end: '2026-05-10', title: 'Numbers 11–14; 20–24; 27', theme: 'Spirit of Prophecy' },
    { start: '2026-05-11', end: '2026-05-17', title: 'Deuteronomy 6–8; 15; 18; 29–30; 34', theme: 'Beware Lest Thou Forget the Lord', quote: 'Thou shalt love the Lord thy God with all thine heart, and with all thy soul, and with all thy might.', verse: 'Deuteronomy 6:5' },
    { start: '2026-05-18', end: '2026-05-24', title: 'Joshua 1–6; 23–24', theme: 'Be Strong and of a Good Courage' },
    { start: '2026-05-25', end: '2026-05-31', title: 'Judges 2–4; 6–8; 13–16', theme: 'The Lord Raised Up a Deliverer' },
];

export function GospelStudy() {
    const today = new Date('2026-05-13'); // Fixed for demo based on user metadata
    
    const currentLesson = CFM_SCHEDULE.find(item => {
        const start = new Date(item.start);
        const end = new Date(item.end);
        return today >= start && today <= end;
    }) || CFM_SCHEDULE[1];

    return (
        <div className="flex flex-col h-full bg-white dark:bg-slate-950 border-2 border-amber-200 dark:border-amber-900 shadow-lg p-6 font-mono relative overflow-hidden group">
            {/* Background Decorative Element */}
            <div className="absolute -right-12 -top-12 w-32 h-32 bg-amber-400/5 rounded-full blur-3xl group-hover:bg-amber-400/10 transition-all duration-1000" />
            
            <div className="flex items-center gap-6 mb-6 flex-none">
                <GripHorizontal size={24} className="drag-handle cursor-grab active:cursor-grabbing text-slate-300 hover:text-amber-400 transition-colors flex-none" />
                <h2 className="text-3xl font-black uppercase tracking-widest text-amber-600 dark:text-amber-400 drop-shadow-sm">
                    &gt; Come, Follow Me
                </h2>
                <div className="h-[2px] flex-1 bg-gradient-to-r from-amber-400 to-transparent" />
            </div>

            <div className="flex-1 flex flex-col gap-6">
                <div className="bg-amber-50/50 dark:bg-amber-900/10 p-4 border-l-4 border-amber-400">
                    <div className="flex items-center gap-2 text-amber-700 dark:text-amber-500 font-bold text-xs tracking-widest uppercase mb-1">
                        <Book size={12} />
                        Current Study
                    </div>
                    <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase leading-tight">
                        {currentLesson.title}
                    </h3>
                    <p className="text-xs text-amber-600 dark:text-amber-500 font-bold mt-1 tracking-wider italic">
                        "{currentLesson.theme}"
                    </p>
                </div>

                <div className="flex-1 flex flex-col justify-center py-4 px-2 relative">
                    <Quote className="absolute -top-2 -left-2 text-amber-200 dark:text-amber-900/30" size={64} />
                    <div className="relative z-10">
                        <p className="text-lg md:text-xl font-bold text-slate-700 dark:text-slate-300 leading-relaxed tracking-tight">
                            {currentLesson.quote || "The Lord is my strength and song, and is become my salvation."}
                        </p>
                        <p className="text-sm font-black text-amber-600 dark:text-amber-500 mt-4 uppercase tracking-[0.2em]">
                            — {currentLesson.verse || "Exodus 15:2"}
                        </p>
                    </div>
                </div>

                <div className="flex justify-between items-end flex-none mt-auto pt-4 border-t border-amber-100 dark:border-amber-900/30">
                    <div className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">
                        Source: Church of Jesus Christ // 2026 Cycle
                    </div>
                    <a 
                        href="https://www.churchofjesuschrist.org/study/come-follow-me" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 bg-amber-600 hover:bg-amber-500 text-white px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-all"
                        style={{ clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%)' }}
                    >
                        Study Guide <ExternalLink size={10} />
                    </a>
                </div>
            </div>
        </div>
    );
}
