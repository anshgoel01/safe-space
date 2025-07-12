import { useState } from 'react';
import { Navigation } from '@/components/Navigation';
import { HomeSection } from '@/components/sections/HomeSection';
import { FacialSection } from '@/components/sections/FacialSection';
import { AudioSection } from '@/components/sections/AudioSection';
import { PhysiologicalSection } from '@/components/sections/PhysiologicalSection';
import { SurveySection } from '@/components/sections/SurveySection';
import { FusionSection } from '@/components/sections/FusionSection';
import { AdvisorSection } from '@/components/sections/AdvisorSection';

const Index = () => {
  const [activeSection, setActiveSection] = useState('home');

  const renderSection = () => {
    switch (activeSection) {
      case 'home':
        return <HomeSection />;
      case 'facial':
        return <FacialSection />;
      case 'audio':
        return <AudioSection />;
      case 'physiological':
        return <PhysiologicalSection />;
      case 'survey':
        return <SurveySection />;
      case 'fusion':
        return <FusionSection />;
      case 'advisor':
        return <AdvisorSection />;
      default:
        return <HomeSection />;
    }
  };

  return (
    <div className="min-h-screen bg-background font-inter">
      <div className="container mx-auto px-4 py-8">
        <Navigation 
          activeSection={activeSection} 
          onSectionChange={setActiveSection} 
        />
        <main className="animate-fade-in">
          {renderSection()}
        </main>
      </div>
    </div>
  );
};

export default Index;
