import React from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import MarksOverview from './MarksOverview';
import MarksUpload from './MarksUpload';
import { useSearchParams } from 'react-router-dom';

const THEME = {
  bgBeige: '#fbf4ea',
  accent: '#8b0000',
};

const Marks: React.FC = () => {
  const [searchParams] = useSearchParams();
  const tab = searchParams.get('tab');
  const defaultTab = tab === 'upload' ? 'upload' : 'overview';

  return (
    <div
      className="p-0 flex items-center justify-center min-h-screen"
      style={{ backgroundColor: THEME.bgBeige }}
    >
      <Tabs defaultValue={defaultTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger
            value="overview"
            className="data-[state=active]:bg-[#8b0000] data-[state=active]:text-white"
            style={{ color: THEME.accent }}
          >
            View Marks
          </TabsTrigger>
          <TabsTrigger
            value="upload"
            className="data-[state=active]:bg-[#8b0000] data-[state=active]:text-white"
            style={{ color: THEME.accent }}
          >
            Upload Marks
          </TabsTrigger>
        </TabsList>
        <TabsContent value="overview">
          <MarksOverview />
        </TabsContent>
        <TabsContent value="upload">
          <MarksUpload />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Marks;

