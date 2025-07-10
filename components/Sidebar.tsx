
import React from 'react';
import { Surah } from '../types';
import { ProgressBar } from './ProgressBar';
import { BookOpenIcon } from './icons';

interface SidebarProps {
  surahs: Surah[];
  selectedSurah: number | null;
  onSelectSurah: (surahNumber: number | null) => void;
  progress: number;
  completedCount: number;
  totalSermons: number;
  isOpen: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  surahs,
  selectedSurah,
  onSelectSurah,
  progress,
  completedCount,
  totalSermons,
  isOpen
}) => {
  return (
    <aside className={`fixed top-0 start-0 z-40 w-64 h-screen bg-gray-50 border-e border-gray-200 transition-transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
      <div className="h-full flex flex-col">
        <div className="p-4 text-center border-b">
          <h2 className="text-xl font-bold text-teal-800">فهرس السور</h2>
        </div>
        
        <ProgressBar progress={progress} completedCount={completedCount} totalCount={totalSermons} />

        <nav className="flex-1 overflow-y-auto">
          <ul className="text-gray-700">
            <li
              className={`px-4 py-2 cursor-pointer flex items-center gap-3 ${selectedSurah === null ? 'bg-teal-100 text-teal-800 font-bold' : 'hover:bg-gray-100'}`}
              onClick={() => onSelectSurah(null)}
            >
              <BookOpenIcon className="w-5 h-5"/>
              <span>عرض كل الخطب</span>
            </li>
            {surahs.map((surah) => (
              <li
                key={surah.number}
                className={`px-4 py-2 cursor-pointer flex justify-between items-center ${selectedSurah === surah.number ? 'bg-teal-100 text-teal-800 font-bold' : 'hover:bg-gray-100'}`}
                onClick={() => onSelectSurah(surah.number)}
              >
                <span>{`${surah.number}. ${surah.name}`}</span>
                <span className="text-xs font-mono text-gray-500">{surah.revelationType === 'Meccan' ? 'مكية' : 'مدنية'}</span>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </aside>
  );
};
