

import React, { useState, useMemo, useEffect } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { allSermons as initialSermons } from './data/sermons';
import { surahs } from './data/surahs';
import { Sermon, GeneratedSermonContent } from './types';
import { Sidebar } from './components/Sidebar';
import { SermonView } from './components/SermonView';
import { GenerateSermonModal } from './components/GenerateSermonModal';
import { Footer } from './components/Footer';
import { useProgress } from './hooks/useProgress';
import { SearchIcon, BookOpenIcon, CheckCircleIcon, PlusCircleIcon, MenuIcon } from './components/icons';

const SERMONS_STORAGE_KEY = 'juma_sermons_data_v1';

const SermonCard: React.FC<{ sermon: Sermon; onSelect: (id: number) => void; isCompleted: boolean }> = ({ sermon, onSelect, isCompleted }) => (
    <div
        onClick={() => onSelect(sermon.id)}
        className="bg-white p-5 rounded-lg border border-gray-200 hover:border-teal-400 hover:shadow-md transition-all cursor-pointer group"
    >
        <div className="flex justify-between items-start">
            <div>
                <h3 className="text-xl font-bold text-gray-800 group-hover:text-teal-700">{sermon.title}</h3>
                <p className="text-sm text-gray-500 mt-1">{`سورة ${surahs.find(s => s.number === sermon.surahNumber)?.name || ''} - ${sermon.verses}`}</p>
            </div>
            {isCompleted && <CheckCircleIcon className="w-6 h-6 text-green-500 flex-shrink-0" />}
        </div>
    </div>
);

const WelcomeGuide = () => (
    <div className="text-center py-10 px-6 bg-white rounded-lg border border-gray-200 mt-6">
        <h2 className="font-amiri text-4xl text-gray-800 mb-4">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</h2>
        <p className="text-xl text-teal-700 font-semibold mb-6">ابدأ رحلتك في إعداد خطب الجمعة بضغطة زر</p>
        
        <div className="text-start max-w-3xl mx-auto space-y-6">
            <div className="bg-orange-50 border-r-4 border-orange-400 p-4 rounded-md">
                <h3 className="font-bold text-orange-800">ملاحظة هامة ومسؤولية المراجعة</h3>
                <p className="text-orange-700 mt-2">
                    هذه الأداة تستخدم الذكاء الاصطناعي لإنشاء مسودات الخطب. أنت المسؤول مسؤولية كاملة عن مراجعة المحتوى وتدقيقه شرعيًا ولغويًا قبل استخدامه. لا تعتمد على المخرجات بشكل أعمى.
                </p>
            </div>

            <div>
                <h3 className="text-2xl font-bold font-amiri text-gray-700 mb-3">دليل الاستخدام السريع</h3>
                <ol className="list-decimal list-inside space-y-3 text-gray-600">
                    <li>
                        <strong>الحصول على مفتاح API:</strong>
                        {' '}توجه إلى <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-semibold">Google AI Studio</a> لإنشاء مفتاح API مجاني.
                    </li>
                    <li>
                        <strong>إدخال المفتاح:</strong>
                        {' '}قم بلصق المفتاح الذي حصلت عليه في خانة "أدخل مفتاح Apikey هنا" في الشريط العلوي. سيتم حفظه تلقائيًا في متصفحك.
                    </li>
                    <li>
                        <strong>إنشاء خطبة جديدة:</strong>
                        {' '}اضغط على زر "إنشاء خطبة جديدة". اختر السورة، ويمكنك اختياريًا تحديد مقطع معين من السورة لتركيز الخطبة عليه.
                    </li>
                    <li>
                        <strong>المراجعة والاستخدام:</strong>
                        {' '}بعد الإنشاء، ستظهر الخطبة في القائمة. اضغط عليها لقراءتها ومراجعتها.
                    </li>
                </ol>
            </div>
        </div>
    </div>
);


const App: React.FC = () => {
    const [sermons, setSermons] = useState<Sermon[]>(() => {
        try {
            const storedSermons = localStorage.getItem(SERMONS_STORAGE_KEY);
            if (storedSermons) {
                return JSON.parse(storedSermons);
            }
        } catch (e) {
            console.error("Failed to load sermons from localStorage", e);
            localStorage.removeItem(SERMONS_STORAGE_KEY);
        }
        return initialSermons;
    });
    
    const [selectedSermonId, setSelectedSermonId] = useState<number | null>(null);
    const [selectedSurah, setSelectedSurah] = useState<number | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    
    const [isSidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 768);
    
    const [isModalOpen, setModalOpen] = useState(false);
    const [isGenerating, setGenerating] = useState(false);
    const [generationError, setGenerationError] = useState<string | null>(null);
    
    const [apiKey, setApiKey] = useState('');

    const { progress, completedCount, toggleComplete, isCompleted } = useProgress(sermons.length);

    useEffect(() => {
        const savedKey = localStorage.getItem('gemini_api_key');
        if (savedKey) {
            setApiKey(savedKey);
        }

        const handleResize = () => {
            if (window.innerWidth < 768) {
              setSidebarOpen(false);
            } else {
              setSidebarOpen(true);
            }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        try {
            localStorage.setItem(SERMONS_STORAGE_KEY, JSON.stringify(sermons));
        } catch (e) {
            console.error("Failed to save sermons to localStorage", e);
        }
    }, [sermons]);

    useEffect(() => {
        // When the user starts searching, take them back to the list view
        // to see the search results.
        if (searchTerm.trim() !== '') {
            setSelectedSermonId(null);
        }
    }, [searchTerm]);

    const handleApiKeyChange = (newKey: string) => {
        setApiKey(newKey);
        localStorage.setItem('gemini_api_key', newKey);
    };

    const filteredSermons = useMemo(() => {
        return sermons
            .filter(sermon => {
                if (selectedSurah && sermon.surahNumber !== selectedSurah) {
                    return false;
                }

                const lowerCaseSearch = searchTerm.toLowerCase().trim();
                if (!lowerCaseSearch) {
                    return true;
                }

                const surahName = surahs.find(s => s.number === sermon.surahNumber)?.name.toLowerCase() || '';

                // Combine all searchable text fields from the sermon into one string for a comprehensive search.
                const contentToSearch = [
                    sermon.title,
                    sermon.verses,
                    sermon.khutbah1.title,
                    sermon.khutbah1.verses,
                    sermon.khutbah1.tafsir,
                    sermon.khutbah1.reflections,
                    sermon.khutbah1.repentance,
                    ...sermon.khutbah1.messages.flatMap(msg => [msg.message, msg.explanation]),
                    sermon.khutbah2.hadith.text,
                    sermon.khutbah2.hadithReflection,
                    sermon.khutbah2.dua,
                    surahName,
                ].join(' ').toLowerCase();

                return contentToSearch.includes(lowerCaseSearch);
            })
            .sort((a,b) => b.id - a.id); // Show newest first
    }, [selectedSurah, searchTerm, sermons]);

    const handleSelectSermon = (id: number) => {
        setSelectedSermonId(id);
        if (window.innerWidth < 768) {
            setSidebarOpen(false);
        }
    };

    const handleBackToList = () => {
        setSelectedSermonId(null);
    };
    
    const handleSelectSurah = (surahNumber: number | null) => {
        setSelectedSurah(surahNumber);
        setSelectedSermonId(null);
        if (window.innerWidth < 768) {
            setSidebarOpen(false);
        }
    };

    const handleGenerateSermon = async (surahNumber: number, topic: string) => {
        setGenerating(true);
        setGenerationError(null);

        const finalApiKey = apiKey || process.env.API_KEY;
        if (!finalApiKey) {
            setGenerationError("الرجاء إدخال مفتاح API في الشريط العلوي للمتابعة.");
            setGenerating(false);
            return;
        }

        const surahName = surahs.find(s => s.number === surahNumber)?.name;
        
        const schema = {
            type: Type.OBJECT,
            properties: {
                title: { type: Type.STRING, description: "عنوان رئيسي جذاب للخطبة كلها." },
                verses: { type: Type.STRING, description: `مرجع للآيات المعتمدة (مثال: '${surahName}: ١-٥').` },
                khutbah1: {
                    type: Type.OBJECT,
                    properties: {
                        title: { type: Type.STRING, description: "عنوان للخطبة الأولى." },
                        verses: { type: Type.STRING, description: "النص الكامل للآيات القرآنية محور الخطبة، مع التشكيل الكامل." },
                        tafsir: { type: Type.STRING, description: "تفسير وشرح للآيات، معتمدًا على كتب التفسير الموثوقة مثل تفسير ابن كثير والطبري والسعدي." },
                        reflections: { type: Type.STRING, description: "تأملات إيمانية وعملية وعميقة جدًا وموسعة مستنبطة من الآيات." },
                        messages: {
                            type: Type.ARRAY,
                            description: "ثلاث رسائل إيمانية عملية وواضحة على الأقل.",
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    message: { type: Type.STRING, description: "رسالة موجزة وقوية." },
                                    explanation: { type: Type.STRING, description: "شرح موسع لكيفية تطبيق الرسالة عمليًا في حياة المسلم اليومية." },
                                },
                                required: ['message', 'explanation']
                            }
                        },
                        repentance: { type: Type.STRING, description: "دعوة مؤثرة وقصيرة للتوبة والاستغفار في نهاية الخطبة الأولى." },
                    },
                    required: ['title', 'verses', 'tafsir', 'reflections', 'messages', 'repentance']
                },
                khutbah2: {
                    type: Type.OBJECT,
                    properties: {
                        hadith: {
                            type: Type.OBJECT,
                            properties: {
                                text: { type: Type.STRING, description: "النص الكامل للحديث مع التشكيل الكامل." },
                                authenticity: { type: Type.STRING, description: "درجة صحة الحديث (مثال: 'متفق عليه', 'صحيح البخاري', 'رواه مسلم')." },
                            },
                            required: ['text', 'authenticity']
                        },
                        hadithReflection: { type: Type.STRING, description: "شرح وتأمل في الحديث وكيف يرتبط بالآيات وموضوع الخطبة." },
                        dua: { type: Type.STRING, description: "دعاء ختامي شامل ومؤثر وجامع." },
                    },
                    required: ['hadith', 'hadithReflection', 'dua']
                },
            },
            required: ['title', 'verses', 'khutbah1', 'khutbah2']
        };

        const systemInstruction = `أنت خبير في الشريعة الإسلامية وخطيب جمعة، متخصص في توليد محتوى عالي الجودة وموثوق باللغة العربية الفصحى. مهمتك هي توليد خطبة جمعة متكاملة بناء على الطلب.`;

        const userPrompt = `مهمتك: قم بإنشاء خطبة جمعة متكاملة، عميقة، ومفصلة (حوالي 2500-3000 كلمة) معتمدة على مصادر إسلامية موثوقة ومتفق عليها.
الموضوع: سورة "${surahName}".
${topic ? `التركيز الخاص: "${topic}".` : 'التركيز العام: أهم مقاصد السورة.'}

يجب أن تكون الخطبة ذات جودة عالية جدًا، وتتضمن تفسيرًا عميقًا، تأملات عملية وثرية، ورسائل إيمانية واضحة، مع حديث صحيح ودعاء مؤثر في الخطبة الثانية.`;

        try {
            const ai = new GoogleGenAI({ apiKey: finalApiKey });
            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: userPrompt,
                config: {
                    systemInstruction: systemInstruction,
                    responseMimeType: "application/json",
                    responseSchema: schema,
                },
            });
            
            const generatedContent: GeneratedSermonContent = JSON.parse(response.text.trim());

            const newSermon: Sermon = {
                id: Date.now(), // Use timestamp for a unique ID
                surahNumber: surahNumber,
                pageNumber: 0, // Generated sermons don't have a page number
                ...generatedContent
            };

            setSermons(prev => [newSermon, ...prev]);
            setModalOpen(false);
            handleSelectSermon(newSermon.id);

        } catch (e) {
            console.error("Failed to generate sermon:", e);
            let errorMessage = "فشل إنشاء الخطبة. قد يكون هناك مشكلة في الشبكة أو في الرد من الخادم. يرجى المحاولة مرة أخرى.";
            if (e instanceof Error && e.message.includes('API key')) {
                errorMessage = 'فشل التحقق من مفتاح API. يرجى التأكد من صحة المفتاح وأنه فعال.';
            } else if (e instanceof Error && e.message.includes('JSON')) {
                errorMessage = `فشل إنشاء الخطبة بسبب خطأ في تنسيق الرد من الخادم. نرجو المحاولة مرة أخرى. (تفاصيل الخطأ: ${e.message})`;
            }
            setGenerationError(errorMessage);
        } finally {
            setGenerating(false);
        }
    };

    const handleToggleSidebar = () => {
      setSidebarOpen(prev => !prev);
    };

    const selectedSermon = sermons.find(s => s.id === selectedSermonId);
    const surahName = selectedSermon ? (surahs.find(s => s.number === selectedSermon.surahNumber)?.name || '') : (selectedSurah ? surahs.find(s => s.number === selectedSurah)?.name : 'كل الخطب');

    return (
        <div className="bg-gray-100 min-h-screen relative md:flex">
            <Sidebar
                surahs={surahs}
                selectedSurah={selectedSurah}
                onSelectSurah={handleSelectSurah}
                progress={progress}
                completedCount={completedCount}
                totalSermons={sermons.length}
                isOpen={isSidebarOpen}
                onToggle={handleToggleSidebar}
            />

            <div className={`flex-1 flex flex-col transition-all duration-300 ${isSidebarOpen ? 'md:mr-64' : 'mr-0'}`}>
                <header className="sticky top-0 bg-teal-800 text-white border-b border-teal-900/50 z-20 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-y-4">
                        <div className="flex items-center gap-4">
                              <button 
                                className="p-1" 
                                onClick={handleToggleSidebar}
                                aria-label="Toggle Menu"
                            >
                                <MenuIcon className="w-6 h-6"/>
                            </button>
                            <h1 className="text-2xl font-bold">منبر الجمعة</h1>
                        </div>
                        
                        <div className="flex items-center gap-x-4 gap-y-2 flex-wrap justify-end w-full md:w-auto">
                            <div className="relative max-w-[16rem] flex-grow md:flex-grow-0">
                                <input
                                    type="text"
                                    placeholder="ابحث بالآية أو الكلمة..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full px-4 py-2 pe-10 bg-teal-700/80 border border-teal-600 text-white rounded-full focus:ring-2 focus:ring-teal-400 focus:bg-teal-700 transition placeholder:text-teal-200/80 placeholder:font-semibold"
                                />
                                <div className="absolute inset-y-0 end-0 flex items-center pe-3 pointer-events-none">
                                    <SearchIcon className="w-5 h-5 text-teal-300" />
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <input
                                    type="password"
                                    placeholder="أدخل مفتاح Apikey هنا"
                                    value={apiKey}
                                    onChange={(e) => handleApiKeyChange(e.target.value)}
                                    className="px-3 py-2 bg-teal-700/80 border border-teal-600 text-white rounded-lg focus:ring-2 focus:ring-teal-400 focus:bg-teal-700 transition w-40 md:w-48 placeholder:text-teal-200/80 placeholder:font-semibold"
                                    aria-label="API Key Input"
                                />
                                <a 
                                    href="https://aistudio.google.com/app/apikey" 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    className="flex-shrink-0 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors whitespace-nowrap"
                                    title="الحصول على مفتاح API مجاني من Google AI Studio"
                                >
                                    احصل على Apikey
                                </a>
                            </div>
                        </div>
                    </div>
                </header>

                <main className="flex-1">
                    <div className="p-4 md:p-6">
                        {selectedSermon ? (
                            <SermonView
                                sermon={selectedSermon}
                                onBack={handleBackToList}
                                isCompleted={isCompleted(selectedSermon.id)}
                                onToggleComplete={toggleComplete}
                                surahName={surahName}
                            />
                        ) : (
                            <div>
                                <div className="mb-6 p-4 bg-white rounded-lg border border-gray-200 flex flex-wrap justify-between items-center gap-4">
                                <div className="flex items-center gap-3">
                                        <BookOpenIcon className="w-6 h-6 text-teal-600"/>
                                        <div>
                                            <h2 className="text-2xl font-bold text-gray-800">
                                                {`عرض خطب: ${selectedSurah ? surahName : 'كل الخطب'}`}
                                            </h2>
                                            <p className="text-gray-600">{`${filteredSermons.length} خطبة متاحة`}</p>
                                        </div>
                                </div>
                                <button 
                                    onClick={() => {
                                        setGenerationError(null);
                                        setModalOpen(true);
                                    }} 
                                    className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg font-semibold hover:bg-teal-700 transition-colors">
                                        <PlusCircleIcon className="w-5 h-5"/>
                                        <span>إنشاء خطبة جديدة</span>
                                    </button>
                                </div>
                                <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-4">
                                    {filteredSermons.map(sermon => (
                                        <SermonCard
                                            key={sermon.id}
                                            sermon={sermon}
                                            onSelect={handleSelectSermon}
                                            isCompleted={isCompleted(sermon.id)}
                                        />
                                    ))}
                                </div>
                                {filteredSermons.length === 0 && searchTerm && (
                                    <div className="text-center py-16 text-gray-500">
                                        <p className="text-xl">لم يتم العثور على نتائج.</p>
                                        <p>حاول تغيير فلتر السورة أو مصطلح البحث.</p>
                                    </div>
                                )}
                                {sermons.length === 0 && !searchTerm && (
                                    <WelcomeGuide />
                                )}
                            </div>
                        )}
                    </div>
                </main>

                <Footer />
            </div>

            <GenerateSermonModal 
                isOpen={isModalOpen}
                onClose={() => setModalOpen(false)}
                onGenerate={handleGenerateSermon}
                surahs={surahs}
                isGenerating={isGenerating}
                error={generationError}
                apiKey={apiKey}
            />
        </div>
    );
};

export default App;
