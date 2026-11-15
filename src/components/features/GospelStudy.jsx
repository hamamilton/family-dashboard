import { useState, useMemo } from 'react';
import { Book, Quote, ExternalLink, GripHorizontal, ChevronLeft, ChevronRight, Calendar } from 'lucide-react';

const CFM_SCHEDULE = [
    { start: '2026-01-05', end: '2026-01-11', title: 'Moses 1; Abraham 3', theme: 'This Is My Work and My Glory', quote: 'For behold, this is my work and my glory—to bring to pass the immortality and eternal life of man.', verse: 'Moses 1:39' },
    { start: '2026-01-12', end: '2026-01-18', title: 'Genesis 1–2; Moses 2–3; Abraham 4–5', theme: 'In the Beginning God Created the Heaven and the Earth', quote: 'And God saw every thing that he had made, and, behold, it was very good.', verse: 'Genesis 1:31' },
    { start: '2026-01-19', end: '2026-01-25', title: 'Genesis 3–4; Moses 4–5', theme: 'The Fall of Adam and Eve', quote: 'Adam fell that men might be; and men are, that they might have joy.', verse: '2 Nephi 2:25 / Moses 5:10' },
    { start: '2026-01-26', end: '2026-02-01', title: 'Genesis 5; Moses 6', theme: 'Teach These Things Freely unto Your Children', quote: 'Teach these things freely unto your children: that all men, everywhere, must repent.', verse: 'Moses 6:57' },
    { start: '2026-02-02', end: '2026-02-08', title: 'Moses 7', theme: 'The Lord Called His People Zion', quote: 'And the Lord called his people Zion, because they were of one heart and one mind, and dwelt in righteousness.', verse: 'Moses 7:18' },
    { start: '2026-02-09', end: '2026-02-15', title: 'Genesis 6–11; Moses 8', theme: 'Noah Found Grace in the Eyes of the Lord', quote: 'Noah was a just man and perfect in his generations, and Noah walked with God.', verse: 'Genesis 6:9' },
    { start: '2026-02-16', end: '2026-02-22', title: 'Genesis 12–17; Abraham 1–2', theme: 'To Be a Greater Follower of Righteousness', quote: 'I sought for the blessings of the fathers, and the right whereunto I should be ordained to administer the same.', verse: 'Abraham 1:2' },
    { start: '2026-02-23', end: '2026-03-01', title: 'Genesis 18–23', theme: 'Is Any Thing Too Hard for the Lord?', quote: 'Is any thing too hard for the Lord? At the time appointed I will return unto thee.', verse: 'Genesis 18:14' },
    { start: '2026-03-02', end: '2026-03-08', title: 'Genesis 24–27', theme: 'The Covenant Path', quote: 'The Lord God of heaven... he shall send his angel before thee.', verse: 'Genesis 24:7' },
    { start: '2026-03-09', end: '2026-03-15', title: 'Genesis 28–33', theme: 'Surely the Lord Is in This Place', quote: 'Surely the Lord is in this place; and I knew it not... this is none other but the house of God.', verse: 'Genesis 28:16–17' },
    { start: '2026-03-16', end: '2026-03-22', title: 'Genesis 37–41', theme: 'The Lord Was with Joseph', quote: 'And the Lord was with Joseph, and he was a prosperous man.', verse: 'Genesis 39:2' },
    { start: '2026-03-23', end: '2026-03-29', title: 'Genesis 42–50', theme: 'God Meant It unto Good', quote: 'As for you, ye thought evil against me; but God meant it unto good, to bring to pass, as it is this day, to save much people alive.', verse: 'Genesis 50:20' },
    { start: '2026-03-30', end: '2026-04-05', title: 'Easter', theme: 'He Will Swallow Up Death in Victory', quote: 'He will swallow up death in victory; and the Lord God will wipe away tears from off all faces.', verse: 'Isaiah 25:8' },
    { start: '2026-04-06', end: '2026-04-12', title: 'Exodus 1–6', theme: 'I Have Remembered My Covenant', quote: 'I have surely seen the affliction of my people... and I know their sorrows; and I am come down to deliver them.', verse: 'Exodus 3:7–8' },
    { start: '2026-04-13', end: '2026-04-19', title: 'Exodus 7–13', theme: 'Remember This Day, in Which Ye Came Out', quote: 'Remember this day, in which ye came out from Egypt, out of the house of bondage; for by strength of hand the Lord brought you out.', verse: 'Exodus 13:3' },
    { start: '2026-04-20', end: '2026-04-26', title: 'Exodus 14–17', theme: 'Stand Still, and See the Salvation of the Lord', quote: 'Fear ye not, stand still, and see the salvation of the Lord, which he will shew to you to day.', verse: 'Exodus 14:13' },
    { start: '2026-04-27', end: '2026-05-03', title: 'Exodus 18–20', theme: 'All That the Lord Hath Spoken We Will Do', quote: 'If ye will obey my voice indeed, and keep my covenant, then ye shall be a peculiar treasure unto me above all people.', verse: 'Exodus 19:5' },
    { start: '2026-05-04', end: '2026-05-10', title: 'Exodus 24; 31–34', theme: 'My Presence Shall Go with Thee', quote: 'My presence shall go with thee, and I will give thee rest.', verse: 'Exodus 33:14' },
    { start: '2026-05-11', end: '2026-05-17', title: 'Exodus 35–40; Leviticus 1; 16; 19', theme: 'Holiness unto the Lord', quote: 'Ye shall be holy: for I the Lord your God am holy.', verse: 'Leviticus 19:2' },
    { start: '2026-05-18', end: '2026-05-24', title: 'Numbers 11–14; 20–24; 27', theme: 'Rebel Not Ye against the Lord', quote: 'Only rebel not ye against the Lord, neither fear ye the people of the land... the Lord is with us: fear them not.', verse: 'Numbers 14:9' },
    { start: '2026-05-25', end: '2026-05-31', title: 'Deuteronomy 6–8; 15; 18; 29–30; 34', theme: 'Beware Lest Thou Forget the Lord', quote: 'Thou shalt love the Lord thy God with all thine heart, and with all thy soul, and with all thy might.', verse: 'Deuteronomy 6:5' },
    { start: '2026-06-01', end: '2026-06-07', title: 'Joshua 1–8; 23–24', theme: 'Be Strong and of a Good Courage', quote: 'Be strong and of a good courage; be not afraid, neither be thou dismayed: for the Lord thy God is with thee whithersoever thou goest.', verse: 'Joshua 1:9' },
    { start: '2026-06-08', end: '2026-06-14', title: 'Judges 2–4; 6–8; 13–16', theme: 'The Lord Raised Up a Deliverer', quote: 'The Lord is with thee, thou mighty man of valour... Go in this thy might, and thou shalt save Israel.', verse: 'Judges 6:12, 14' },
    { start: '2026-06-15', end: '2026-06-21', title: 'Ruth; 1 Samuel 1–3', theme: 'My Heart Rejoiceth in the Lord', quote: 'Whither thou goest, I will go; and where thou lodgest, I will lodge: thy people shall be my people, and thy God my God.', verse: 'Ruth 1:16' },
    { start: '2026-06-22', end: '2026-06-28', title: '1 Samuel 8–10; 13; 15–18', theme: 'The Battle Is the Lord\'s', quote: 'The Lord seeth not as man seeth; for man looketh on the outward appearance, but the Lord looketh on the heart.', verse: '1 Samuel 16:7' },
    { start: '2026-06-29', end: '2026-07-05', title: '2 Samuel 5–7; 11–12; 1 Kings 3; 8; 11', theme: 'Thy Kingdom Shall Be Established', quote: 'Give therefore thy servant an understanding heart to judge thy people, that I may discern between good and bad.', verse: '1 Kings 3:9' },
    { start: '2026-07-06', end: '2026-07-12', title: '1 Kings 17–19', theme: 'If the Lord Be God, Follow Him', quote: 'And after the earthquake a fire; but the Lord was not in the fire: and after the fire a still small voice.', verse: '1 Kings 19:12' },
    { start: '2026-07-13', end: '2026-07-19', title: '2 Kings 2–7', theme: 'There Is a Prophet in Israel', quote: 'Fear not: for they that be with us are more than they that be with them.', verse: '2 Kings 6:16' },
    { start: '2026-07-20', end: '2026-07-26', title: '2 Kings 17–25', theme: 'He Trusted in the Lord God of Israel', quote: 'He trusted in the Lord God of Israel... For he clave to the Lord, and departed not from following him.', verse: '2 Kings 18:5–6' },
    { start: '2026-07-27', end: '2026-08-02', title: 'Ezra 1; 3–7; Nehemiah 2; 4–6; 8', theme: 'The Hand of My God Was Good Upon Me', quote: 'The joy of the Lord is your strength.', verse: 'Nehemiah 8:10' },
    { start: '2026-08-03', end: '2026-08-09', title: 'Esther', theme: 'For Such a Time as This', quote: 'Who knoweth whether thou art come to the kingdom for such a time as this?', verse: 'Esther 4:14' },
    { start: '2026-08-10', end: '2026-08-16', title: 'Job 1–3; 12–14; 19; 21–24; 38–40; 42', theme: 'Yet Will I Trust in Him', quote: 'For I know that my redeemer liveth, and that he shall stand at the latter day upon the earth.', verse: 'Job 19:25' },
    { start: '2026-08-17', end: '2026-08-23', title: 'Psalms 1–2; 8; 19–33; 40; 46', theme: 'The Lord Is My Shepherd', quote: 'The Lord is my shepherd; I shall not want. He maketh me to lie down in green pastures: he leadeth me beside the still waters.', verse: 'Psalm 23:1–2' },
    { start: '2026-08-24', end: '2026-08-30', title: 'Psalms 49–51; 61–66; 69–72; 77–78; 85–86', theme: 'Create in Me a Clean Heart, O God', quote: 'Create in me a clean heart, O God; and renew a right spirit within me. Cast me not away from thy presence.', verse: 'Psalm 51:10–11' },
    { start: '2026-08-31', end: '2026-09-06', title: 'Psalms 102–103; 110; 116–119; 127–128; 135–139; 146–150', theme: 'Praise Ye the Lord', quote: 'Thy word is a lamp unto my feet, and a light unto my path.', verse: 'Psalm 119:105' },
    { start: '2026-09-07', end: '2026-09-13', title: 'Proverbs 1–4; 15–16; 22; 31; Ecclesiastes 1–3; 11–12', theme: 'Trust in the Lord with All Thine Heart', quote: 'Trust in the Lord with all thine heart; and lean not unto thine own understanding. In all thy ways acknowledge him, and he shall direct thy paths.', verse: 'Proverbs 3:5–6' },
    { start: '2026-09-14', end: '2026-09-20', title: 'Isaiah 1–12', theme: 'God Is My Salvation', quote: 'Come now, and let us reason together, saith the Lord: though your sins be as scarlet, they shall be as white as snow.', verse: 'Isaiah 1:18' },
    { start: '2026-09-21', end: '2026-09-27', title: 'Isaiah 13–14; 24–30; 35', theme: 'A Marvellous Work and a Wonder', quote: 'Strengthen ye the weak hands, and confirm the feeble knees. Say to them that are of a fearful heart, Be strong, fear not.', verse: 'Isaiah 35:3–4' },
    { start: '2026-09-28', end: '2026-10-04', title: 'Isaiah 40–49', theme: 'Comfort Ye My People', quote: 'Fear thou not; for I am with thee: be not dismayed; for I am thy God: I will strengthen thee; yea, I will help thee.', verse: 'Isaiah 41:10' },
    { start: '2026-10-05', end: '2026-10-11', title: 'Isaiah 50–57', theme: 'He Hath Borne Our Griefs, and Carried Our Sorrows', quote: 'Surely he hath borne our griefs, and carried our sorrows... and with his stripes we are healed.', verse: 'Isaiah 53:4–5' },
    { start: '2026-10-12', end: '2026-10-18', title: 'Isaiah 58–66', theme: 'The Spirit of the Lord God Is Upon Me', quote: 'Is not this the fast that I have chosen? to loose the bands of wickedness, to undo the heavy burdens, and to let the oppressed go free?', verse: 'Isaiah 58:6' },
    { start: '2026-10-19', end: '2026-10-25', title: 'Jeremiah 1–3; 7; 16–18; 20', theme: 'Before I Formed Thee in the Belly I Knew Thee', quote: 'Before I formed thee in the belly I knew thee; and before thou camest forth out of the womb I sanctified thee, and I ordained thee a prophet.', verse: 'Jeremiah 1:5' },
    { start: '2026-10-26', end: '2026-11-01', title: 'Jeremiah 30–33; 36; Lamentations 1; 3', theme: 'I Will Make a New Covenant with Them', quote: 'For I know the thoughts that I think toward you, saith the Lord, thoughts of peace, and not of evil, to give you an expected end.', verse: 'Jeremiah 29:11' },
    { start: '2026-11-02', end: '2026-11-08', title: 'Ezekiel 1–3; 33–34; 36–37; 47', theme: 'A New Heart Also Will I Give You', quote: 'A new heart also will I give you, and a new spirit will I put within you: and I will take away the stony heart out of your flesh.', verse: 'Ezekiel 36:26' },
    { start: '2026-11-09', end: '2026-11-15', title: 'Daniel 1–6', theme: 'There Is No Other God That Can Deliver', quote: 'If it be so, our God whom we serve is able to deliver us from the burning fiery furnace, and he will deliver us.', verse: 'Daniel 3:17' },
    { start: '2026-11-16', end: '2026-11-22', title: 'Hosea 1–6; 10–14; Joel', theme: 'I Will Love Them Freely', quote: 'I will heal their backsliding, I will love them freely: for mine anger is turned away.', verse: 'Hosea 14:4' },
    { start: '2026-11-23', end: '2026-11-29', title: 'Amos; Obadiah', theme: 'Seek Ye the Lord, and Ye Shall Live', quote: 'Surely the Lord God will do nothing, but he revealeth his secret unto his servants the prophets.', verse: 'Amos 3:7' },
    { start: '2026-11-30', end: '2026-12-06', title: 'Jonah; Micah', theme: 'He Delighteth in Mercy', quote: 'He hath shewed thee, O man, what is good; and what doth the Lord require of thee, but to do justly, and to love mercy, and to walk humbly with thy God?', verse: 'Micah 6:8' },
    { start: '2026-12-07', end: '2026-12-13', title: 'Nahum; Habakkuk; Zephaniah', theme: 'The Lord Is a Strong Hold in the Day of Trouble', quote: 'The Lord is good, a strong hold in the day of trouble; and he knoweth them that trust in him.', verse: 'Nahum 1:7' },
    { start: '2026-12-14', end: '2026-12-20', title: 'Haggai; Zechariah 1–3; 7–14; Malachi', theme: 'Holiness unto the Lord', quote: 'Bring ye all the tithes into the storehouse... and prove me now herewith, saith the Lord of hosts, if I will not open you the windows of heaven.', verse: 'Malachi 3:10' },
    { start: '2026-12-21', end: '2026-12-27', title: 'Christmas', theme: 'He Shall Be Called Wonderful, Counsellor', quote: 'For unto us a child is born, unto us a son is given: and the government shall be upon his shoulder: and his name shall be called Wonderful, Counsellor.', verse: 'Isaiah 9:6' },
    { start: '2026-12-28', end: '2027-01-03', title: 'Year-End Study & Wrap-Up', theme: 'Search the Scriptures', quote: 'Search the scriptures; for in them ye think ye have eternal life: and they are they which testify of me.', verse: 'John 5:39' },
];

export function GospelStudy() {
    const today = new Date();
    
    // Find index of current lesson based on today's local date
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    
    const currentIndex = useMemo(() => {
        const found = CFM_SCHEDULE.findIndex(item => todayStr >= item.start && todayStr <= item.end);
        if (found !== -1) return found;
        
        // If beyond end of schedule or before start, find closest
        if (todayStr > CFM_SCHEDULE[CFM_SCHEDULE.length - 1].end) {
            return CFM_SCHEDULE.length - 1;
        }
        return 0;
    }, [todayStr]);

    const [selectedOffset, setSelectedOffset] = useState(0);

    const activeIndex = Math.max(0, Math.min(CFM_SCHEDULE.length - 1, currentIndex + selectedOffset));
    const currentLesson = CFM_SCHEDULE[activeIndex];
    const isCurrentWeek = activeIndex === currentIndex;

    const handlePrev = () => {
        if (activeIndex > 0) setSelectedOffset(prev => prev - 1);
    };

    const handleNext = () => {
        if (activeIndex < CFM_SCHEDULE.length - 1) setSelectedOffset(prev => prev + 1);
    };

    const handleJumpToCurrent = () => {
        setSelectedOffset(0);
    };

    const formatDateRange = (start, end) => {
        const s = new Date(start + 'T00:00:00');
        const e = new Date(end + 'T00:00:00');
        const sMonth = s.toLocaleDateString('en-US', { month: 'short' });
        const eMonth = e.toLocaleDateString('en-US', { month: 'short' });
        if (sMonth === eMonth) {
            return `${sMonth} ${s.getDate()} – ${e.getDate()}`;
        }
        return `${sMonth} ${s.getDate()} – ${eMonth} ${e.getDate()}`;
    };

    return (
        <div className="flex flex-col h-full bg-white dark:bg-slate-950 border-2 border-amber-200 dark:border-amber-900 shadow-lg p-6 font-mono relative overflow-hidden group">
            {/* Background Decorative Element */}
            <div className="absolute -right-12 -top-12 w-32 h-32 bg-amber-400/5 rounded-full blur-3xl group-hover:bg-amber-400/10 transition-all duration-1000" />
            
            <div className="flex items-center justify-between gap-4 mb-6 flex-none">
                <div className="flex items-center gap-4 min-w-0">
                    <GripHorizontal size={24} className="drag-handle cursor-grab active:cursor-grabbing text-slate-300 hover:text-amber-400 transition-colors flex-none" />
                    <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-widest text-amber-600 dark:text-amber-400 drop-shadow-sm truncate">
                        &gt; Come, Follow Me
                    </h2>
                </div>

                {/* Week Navigation Controls */}
                <div className="flex items-center gap-1.5 flex-none bg-amber-50 dark:bg-amber-950/40 p-1 rounded border border-amber-200 dark:border-amber-900/60">
                    <button
                        onClick={handlePrev}
                        disabled={activeIndex === 0}
                        className="p-1 text-slate-600 dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        title="Previous week"
                    >
                        <ChevronLeft size={16} />
                    </button>
                    {!isCurrentWeek ? (
                        <button
                            onClick={handleJumpToCurrent}
                            className="px-2 py-0.5 text-[10px] font-black uppercase bg-amber-500 text-black rounded hover:bg-amber-400 transition-colors flex items-center gap-1"
                            title="Return to current week"
                        >
                            <Calendar size={11} />
                            Today
                        </button>
                    ) : (
                        <span className="px-2 text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                            Current
                        </span>
                    )}
                    <button
                        onClick={handleNext}
                        disabled={activeIndex === CFM_SCHEDULE.length - 1}
                        className="p-1 text-slate-600 dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        title="Next week"
                    >
                        <ChevronRight size={16} />
                    </button>
                </div>
            </div>

            <div className="flex-1 flex flex-col gap-6">
                <div className="bg-amber-50/50 dark:bg-amber-900/10 p-4 border-l-4 border-amber-400 relative">
                    <div className="flex items-center justify-between text-amber-700 dark:text-amber-500 font-bold text-xs tracking-widest uppercase mb-1">
                        <span className="flex items-center gap-1.5">
                            <Book size={13} />
                            {isCurrentWeek ? "This Week's Study" : "Lesson Overview"}
                        </span>
                        <span className="text-[11px] font-mono px-2 py-0.5 bg-amber-100 dark:bg-amber-950/60 rounded border border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300">
                            {formatDateRange(currentLesson.start, currentLesson.end)}
                        </span>
                    </div>
                    <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase leading-tight mt-2">
                        {currentLesson.title}
                    </h3>
                    <p className="text-xs text-amber-600 dark:text-amber-500 font-bold mt-1.5 tracking-wider italic">
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
                        Source: Church of Jesus Christ // 2026 Old Testament
                    </div>
                    <a 
                        href="https://www.churchofjesuschrist.org/study/come-follow-me" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 bg-amber-600 hover:bg-amber-500 text-white px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-all shadow-sm hover:shadow"
                        style={{ clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%)' }}
                    >
                        Study Guide <ExternalLink size={10} />
                    </a>
                </div>
            </div>
        </div>
    );
}
