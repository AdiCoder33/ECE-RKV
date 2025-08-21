import React, { useState } from 'react';
import MarksOverview from './MarksOverview';
import MarksUpload from './MarksUpload';
import { useSearchParams } from 'react-router-dom';

const THEME = {
  bgBeige: '#fbf4ea',
  accent: '#8b0000',
};

const Marks: React.FC = () => {
  const [searchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const [tab, setTab] = useState(tabParam === 'upload' ? 'upload' : 'overview');

  return (
    <div
      className="p-0 flex items-center justify-center min-h-screen"
      style={{ backgroundColor: THEME.bgBeige }}
    >
      <div className="w-full max-w-5xl">
        <div className="w-full mb-4">
          <div className="grid w-full grid-cols-2 rounded-lg overflow-hidden border border-[#b86b2e] bg-white shadow">
            <button
              className={`flex-1 py-2 text-center font-semibold transition-all text-base
                ${tab === 'overview'
                  ? 'bg-[#fde8e6] text-[#8b0000] border-b-4 border-[#8b0000]'
                  : 'bg-white text-[#8b0000] hover:bg-[#f3f3f3] border-b-4 border-transparent'}
              `}
              onClick={() => setTab('overview')}
              type="button"
            >
              View Marks
            </button>
            <button
              className={`flex-1 py-2 text-center font-semibold transition-all text-base
                ${tab === 'upload'
                  ? 'bg-[#fde8e6] text-[#8b0000] border-b-4 border-[#8b0000]'
                  : 'bg-white text-[#8b0000] hover:bg-[#f3f3f3] border-b-4 border-transparent'}
              `}
              onClick={() => setTab('upload')}
              type="button"
            >
              Upload Marks
            </button>
          </div>
        </div>
        {/* Animated tab content */}
        <div className="relative min-h-[400px]">
          <div
            className={`absolute inset-0 w-full transition-all duration-300 ${
              tab === 'overview'
                ? 'opacity-100 translate-x-0 z-10'
                : 'opacity-0 -translate-x-8 pointer-events-none z-0'
            }`}
          >
            {tab === 'overview' && <MarksOverview />}
          </div>
          <div
            className={`absolute inset-0 w-full transition-all duration-300 ${
              tab === 'upload'
                ? 'opacity-100 translate-x-0 z-10'
                : 'opacity-0 translate-x-8 pointer-events-none z-0'
            }`}
          >
            {tab === 'upload' && <MarksUpload />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Marks;

