import React from 'react';
import { Sermon } from '../types';
import { PlayCircleIcon, CheckCircleIcon, ArrowRightIcon } from './icons';

interface SermonViewProps {
  sermon: Sermon;
  onBack: () => void;
  isCompleted: boolean;
  onToggleComplete: (id: number) => void;
  surahName: string;
}

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="mb-8">
        <h3 className="text-2xl font-bold font-amiri text-teal-800 border-b-2 border-teal-200 pb-2 mb-4">{title}</h3>
        {children}
    </div>
);

export const SermonView: React.FC<SermonViewProps> = ({ sermon, onBack, isCompleted, onToggleComplete, surahName }) => {
  return (
    <div className="p-4 md:p-8 bg-white max-w-4xl mx-auto">
        <button onClick={onBack} className="flex items-center gap-2 text-teal-700 hover:text-teal-900 mb-6 font-semibold">
            <ArrowRightIcon />
            <span>العودة إلى القائمة</span>
        </button>
        
        <header className="text-center mb-8 border-b-4 border-gray-100 pb-6">
            <p className="text-lg text-gray-500">{`سورة ${surahName}${sermon.pageNumber > 0 ? ` - الصفحة ${sermon.pageNumber}` : ''}`}</p>
            <h1 className="text-4xl md:text-5xl font-bold font-amiri text-gray-800 mt-2">{sermon.title}</h1>
            <p className="text-md text-gray-600 mt-3">{`الآيات المعتمدة: ${sermon.verses}`}</p>
        </header>

        <div className="space-y-6">
            <div className="flex justify-center items-center gap-4 mb-8">
                <button 
                    onClick={() => onToggleComplete(sermon.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full font-semibold transition-colors ${isCompleted ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                >
                    <CheckCircleIcon className="w-5 h-5"/>
                    <span>{isCompleted ? 'تم إتمامها' : 'إتمام الخطبة'}</span>
                </button>
                 <button className="flex items-center gap-2 px-4 py-2 rounded-full bg-gray-200 text-gray-700 hover:bg-gray-300 font-semibold transition-colors"  title="سيتم تفعيلها لاحقًا">
                    <PlayCircleIcon className="w-5 h-5"/>
                    <span>استماع (قريبًا)</span>
                </button>
            </div>


            {/* Khutbah 1 */}
            <div className="p-6 border border-gray-200 rounded-lg bg-gray-50/50">
                <h2 className="text-3xl font-bold font-amiri text-center text-teal-900 mb-6">الخطبة الأولى: {sermon.khutbah1.title}</h2>
                
                <Section title="الآيات المعتمدة">
                    <p className="text-xl leading-loose font-amiri text-gray-800 text-center bg-white p-4 rounded-md shadow-sm">{sermon.khutbah1.verses}</p>
                </Section>
                
                <Section title="تفسير لطيف">
                    <p className="text-lg leading-relaxed text-gray-700">{sermon.khutbah1.tafsir}</p>
                </Section>

                <Section title="تأملات عميقة">
                    <p className="text-lg leading-relaxed text-gray-700">{sermon.khutbah1.reflections}</p>
                </Section>
                
                <Section title="رسائل إيمانية">
                    <ul className="space-y-4">
                        {sermon.khutbah1.messages.map((item, index) => (
                            <li key={index} className="p-4 bg-white rounded-lg shadow-sm border-r-4 border-teal-500">
                                <p className="flex items-start">
                                    <span className="text-teal-600 font-bold me-2 text-xl">◆</span>
                                    <span className="text-lg font-semibold text-gray-800">{item.message}</span>
                                </p>
                                <p className="mt-2 ms-7 text-md text-gray-600 leading-relaxed">{item.explanation}</p>
                            </li>
                        ))}
                    </ul>
                </Section>

                <Section title="دعوة للاستغفار والتوبة">
                    <p className="text-lg leading-relaxed text-gray-700 italic">{sermon.khutbah1.repentance}</p>
                </Section>
            </div>
            
            {/* Khutbah 2 */}
            <div className="p-6 border border-gray-200 rounded-lg bg-gray-50/50">
                <h2 className="text-3xl font-bold font-amiri text-center text-teal-900 mb-6">الخطبة الثانية</h2>
                
                <Section title="حديث نبوي">
                    <div className="bg-white p-4 rounded-md shadow-sm">
                        <p className="text-lg leading-relaxed font-semibold text-gray-800">{sermon.khutbah2.hadith.text}</p>
                        <p className="text-sm text-gray-500 mt-2 text-start pt-2 border-t border-gray-100">
                            <span className="font-bold">درجة الحديث:</span> {sermon.khutbah2.hadith.authenticity}
                        </p>
                    </div>
                </Section>

                <Section title="تأمل في الحديث">
                    <p className="text-lg leading-relaxed text-gray-700">{sermon.khutbah2.hadithReflection}</p>
                </Section>

                <Section title="دعاء ختامي">
                    <p className="text-lg leading-loose text-gray-700">{sermon.khutbah2.dua}</p>
                </Section>
            </div>
            
            <div className="text-center text-xl font-bold text-teal-800 py-4 mt-8">
                ... وأقم الصلاة
            </div>
        </div>
    </div>
  );
};