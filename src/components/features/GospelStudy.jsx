import { Book, Quote, ExternalLink, GripHorizontal } from 'lucide-react';

const CFM_SCHEDULE = [
    { 
        start: '2026-05-11', 
        end: '2026-05-17', 
        title: 'Deuteronomy 6–8; 15; 18; 29–30; 34', 
        theme: 'Beware Lest Thou Forget the Lord',
        daily: [
            { day: 'Monday', reading: 'Deuteronomy 6', quote: 'Thou shalt love the Lord thy God with all thine heart...', verse: 'Deuteronomy 6:5' },
            { day: 'Tuesday', reading: 'Deuteronomy 7', quote: 'The Lord thy God hath chosen thee to be a special people...', verse: 'Deuteronomy 7:6' },
            { day: 'Wednesday', reading: 'Deuteronomy 8', quote: 'Lest when thou hast eaten and art full... then thine heart be lifted up...', verse: 'Deuteronomy 8:12-14' },
            { day: 'Thursday', reading: 'Deuteronomy 15', quote: 'For the poor shall never cease out of the land...', verse: 'Deuteronomy 15:11' },
            { day: 'Friday', reading: 'Deuteronomy 18', quote: 'The Lord thy God will raise up unto thee a Prophet...', verse: 'Deuteronomy 18:15' },
            { day: 'Saturday', reading: 'Deuteronomy 29–30', quote: 'I have set before thee life and death... therefore choose life.', verse: 'Deuteronomy 30:19' },
            { day: 'Sunday', reading: 'Deuteronomy 34', quote: 'And there arose not a prophet since in Israel like unto Moses.', verse: 'Deuteronomy 34:10' }
        ]
    },
    { 
        start: '2026-05-18', 
        end: '2026-05-24', 
        title: 'Joshua 1–6; 23–24', 
        theme: 'Be Strong and of a Good Courage',
        daily: [
            { day: 'Monday', reading: 'Joshua 1', quote: 'Be strong and of a good courage; be not afraid...', verse: 'Joshua 1:9' },
            { day: 'Tuesday', reading: 'Joshua 2', quote: 'For the Lord your God, he is God in heaven above...', verse: 'Joshua 2:11' },
            { day: 'Wednesday', reading: 'Joshua 3-4', quote: 'When your children ask their fathers in time to come...', verse: 'Joshua 4:21' },
            { day: 'Thursday', reading: 'Joshua 5-6', quote: 'Shout; for the Lord hath given you the city.', verse: 'Joshua 6:16' },
            { day: 'Friday', reading: 'Joshua 23', quote: 'Cleave unto the Lord your God, as ye have done unto this day.', verse: 'Joshua 23:8' },
            { day: 'Saturday', reading: 'Joshua 24:1-15', quote: 'Choose you this day whom ye will serve... but as for me and my house, we will serve the Lord.', verse: 'Joshua 24:15' },
            { day: 'Sunday', reading: 'Joshua 24:16-33', quote: 'The Lord our God will we serve, and his voice will we obey.', verse: 'Joshua 24:24' }
        ]
    }
];

export function GospelStudy() {
    const today = new Date();
    const dayOfWeek = today.toLocaleDateString('en-US', { weekday: 'long' });
    
    const currentLesson = CFM_SCHEDULE.find(item => {
        const start = new Date(item.start);
        const end = new Date(item.end);
        return today >= start && today <= end;
    }) || CFM_SCHEDULE[0];

    const todayStudy = currentLesson.daily?.find(d => d.day === dayOfWeek) || {
        reading: currentLesson.title,
        quote: "Thou shalt love the Lord thy God with all thine heart, and with all thy soul, and with all thy might.",
        verse: "Deuteronomy 6:5"
    };

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
                        {todayStudy.reading}
                    </h3>
                    <p className="text-xs text-amber-600 dark:text-amber-500 font-bold mt-1 tracking-wider italic">
                        Weekly Theme: {currentLesson.theme}
                    </p>
                </div>

                <div className="flex-1 flex flex-col justify-center py-4 px-2 relative">
                    <Quote className="absolute -top-2 -left-2 text-amber-200 dark:text-amber-900/30" size={64} />
                    <div className="relative z-10">
                        <p className="text-lg md:text-xl font-bold text-slate-700 dark:text-slate-300 leading-relaxed tracking-tight">
                            {todayStudy.quote}
                        </p>
                        <p className="text-sm font-black text-amber-600 dark:text-amber-500 mt-4 uppercase tracking-[0.2em]">
                            — {todayStudy.verse}
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
