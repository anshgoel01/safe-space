import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Activity, Camera, Mic, Watch, ClipboardList, Brain, Bot } from 'lucide-react';

interface NavigationProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

const navigationItems = [
  { id: 'home', label: 'Home', icon: Activity },
  { id: 'facial', label: 'Facial', icon: Camera },
  { id: 'audio', label: 'Audio', icon: Mic },
  { id: 'physiological', label: 'Wearable', icon: Watch },
  { id: 'survey', label: 'Survey', icon: ClipboardList },
  { id: 'fusion', label: 'Results', icon: Brain },
  { id: 'advisor', label: 'AI Advisor', icon: Bot },
];

export const Navigation = ({ activeSection, onSectionChange }: NavigationProps) => {
  return (
    <Card className="bg-gradient-card shadow-card border-0 mb-6">
      <nav className="flex flex-wrap justify-center gap-2 p-4">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.id;
          
          return (
            <Button
              key={item.id}
              variant={isActive ? "default" : "ghost"}
              className={`
                flex items-center gap-2 px-4 py-2 transition-all duration-200
                ${isActive 
                  ? 'bg-gradient-primary text-white shadow-glow' 
                  : 'hover:bg-accent hover:text-accent-foreground'
                }
              `}
              onClick={() => onSectionChange(item.id)}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline">{item.label}</span>
            </Button>
          );
        })}
      </nav>
    </Card>
  );
};