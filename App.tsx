
import React, { useState, useMemo, useEffect } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { allSermons as initialSermons } from './data/sermons';
import { surahs } from './data/surahs';
import { Sermon, GeneratedSermonContent } from './types';
import { Sidebar } from './components/Sidebar';
import { SermonView } from './components/SermonView';
import { GenerateSermonModal } from './components/GenerateSermonModal';
import { useProgress } from './hooks/useProgress';
import { SearchIcon, BookOpenIcon, CheckCircleIcon, MenuIcon, PlusCircleIcon } from './components/icons';

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


const App: React.FC = () => {
    const [sermons, setSermons] = useState<Sermon[]>(initialSermons);
    const [selectedSermonId, setSelectedSermonId] = useState<number | null>(null);
    const [selectedSurah, setSelectedSurah] = useState<number | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [isSidebarOpen, setSidebarOpen] = useState(false);
    
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
    }, []);

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
                if (searchTerm) {
                    const lowerCaseSearch = searchTerm.toLowerCase();
                    const surahName = surahs.find(s => s.number === sermon.surahNumber)?.name.toLowerCase() || '';
                    return (
                        sermon.title.toLowerCase().includes(lowerCaseSearch) ||
                        sermon.verses.toLowerCase().includes(lowerCaseSearch) ||
                        sermon.khutbah1.tafsir.toLowerCase().includes(lowerCaseSearch) ||
                        sermon.khutbah2.hadith.text.toLowerCase().includes(lowerCaseSearch) ||
                        surahName.includes(lowerCaseSearch)
                    );
                }
                return true;
            });
    }, [selectedSurah, searchTerm, sermons]);

    const handleSelectSermon = (id: number) => {
        setSelectedSermonId(id);
        setSidebarOpen(false);
    };

    const handleBackToList = () => {
        setSelectedSermonId(null);
    };
    
    const handleSelectSurah = (surahNumber: number | null) => {
        setSelectedSurah(surahNumber);
        setSelectedSermonId(null); 
        setSidebarOpen(false);
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

        const userPrompt = `مهمتك: قم بتوليد خطبة جمعة متكاملة، عميقة، ومفصلة (حوالي 2500-3000 كلمة) معتمدة على مصادر إسلامية موثوقة ومتفق عليها.
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
                id: sermons.length + 1,
                surahNumber: surahNumber,
                pageNumber: 0, // Generated sermons don't have a page number
                ...generatedContent
            };

            setSermons(prev => [...prev, newSermon]);
            setModalOpen(false);

        } catch (e) {
            console.error("Failed to generate sermon:", e);
            let errorMessage = "فشل توليد الخطبة. قد يكون هناك مشكلة في الشبكة أو في الرد من الخادم. يرجى المحاولة مرة أخرى.";
            if (e instanceof Error && e.message.includes('JSON')) {
                errorMessage = `فشل توليد الخطبة بسبب خطأ في تنسيق الرد من الخادم. نرجو المحاولة مرة أخرى. (تفاصيل الخطأ: ${e.message})`;
            }
            setGenerationError(errorMessage);
        } finally {
            setGenerating(false);
        }
    };


    const selectedSermon = sermons.find(s => s.id === selectedSermonId);
    const surahName = selectedSurah ? surahs.find(s => s.number === selectedSurah)?.name : 'كل الخطب';

    return (
        <div className="bg-gray-50 min-h-screen">
            <Sidebar
                surahs={surahs}
                selectedSurah={selectedSurah}
                onSelectSurah={handleSelectSurah}
                progress={progress}
                completedCount={completedCount}
                totalSermons={sermons.length}
                isOpen={isSidebarOpen}
            />

            <main className="md:ms-64 transition-all duration-300">
                 <header className="sticky top-0 bg-white/80 backdrop-blur-lg border-b border-gray-200 z-30 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-y-4">
                        <div className="flex items-center gap-4">
                            <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="md:hidden text-gray-600">
                                <MenuIcon />
                            </button>
                            <h1 className="text-2xl font-bold text-teal-800 hidden sm:block">منبر الجمعة</h1>
                        </div>
                        
                        <div className="flex items-center gap-x-4 gap-y-2 flex-wrap justify-end w-full md:w-auto">
                            <div className="relative max-w-[16rem] flex-grow md:flex-grow-0">
                                <input
                                    type="text"
                                    placeholder="ابحث بالآية أو الكلمة..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full px-4 py-2 pe-10 border border-gray-300 rounded-full focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition"
                                />
                                <div className="absolute inset-y-0 end-0 flex items-center pe-3 pointer-events-none">
                                    <SearchIcon className="w-5 h-5 text-gray-400" />
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                 <input
                                    type="password"
                                    placeholder="مفتاح API الخاص بك"
                                    value={apiKey}
                                    onChange={(e) => handleApiKeyChange(e.target.value)}
                                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition w-40 md:w-48"
                                    aria-label="API Key Input"
                                />
                                 <a 
                                    href="https://aistudio.google.com/app/apikey" 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    className="flex-shrink-0 px-3 py-2 bg-blue-500 text-white rounded-lg text-sm font-semibold hover:bg-blue-600 transition-colors whitespace-nowrap"
                                    title="الحصول على مفتاح API مجاني من Google AI Studio"
                                >
                                    احصل على مفتاح
                                </a>
                            </div>
                        </div>
                    </div>
                </header>

                <div className="p-4 md:p-6">
                    {selectedSermon ? (
                        <SermonView
                            sermon={selectedSermon}
                            onBack={handleBackToList}
                            isCompleted={isCompleted(selectedSermon.id)}
                            onToggleComplete={toggleComplete}
                            surahName={surahs.find(s => s.number === selectedSermon.surahNumber)?.name || ''}
                        />
                    ) : (
                        <div>
                            <div className="mb-6 p-4 bg-white rounded-lg border border-gray-200 flex flex-wrap justify-between items-center gap-4">
                               <div className="flex items-center gap-3">
                                    <BookOpenIcon className="w-6 h-6 text-teal-600"/>
                                    <div>
                                        <h2 className="text-2xl font-bold text-gray-800">
                                            {`عرض خطب: ${surahName}`}
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
                                    <span>توليد خطبة جديدة</span>
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
                             {filteredSermons.length === 0 && (
                                <div className="text-center py-16 text-gray-500">
                                    <p className="text-xl">لم يتم العثور على نتائج.</p>
                                    <p>حاول تغيير فلتر السورة أو مصطلح البحث.</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </main>
             {isSidebarOpen && (
                <div 
                    onClick={() => setSidebarOpen(false)} 
                    className="fixed inset-0 bg-black/50 z-30 md:hidden"
                ></div>
            )}
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
