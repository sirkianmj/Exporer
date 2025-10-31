'use client';

import {
  FileText,
  Languages,
  LineChart,
  Map,
  Search,
  Share2,
  UploadCloud,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Logo } from '@/components/icons/logo';
import type { ViewType } from './types';
import { useLanguage } from './language-context';
import { i18n } from '@/lib/i18n';

interface LeftSidebarProps {
  activeView: ViewType;
  setActiveView: (view: ViewType) => void;
  selectedSources: string[];
  setSelectedSources: (sources: string[]) => void;
}

export function LeftSidebar({ activeView, setActiveView, selectedSources, setSelectedSources }: LeftSidebarProps) {
  const { language, setLanguage } = useLanguage();
  const t = i18n[language];
  
  const navItems = [
    { id: 'qa', label: t.qa, icon: Search },
    { id: 'map', label: t.mapExplorer, icon: Map },
    { id: 'temporal', label: t.temporalAnalysis, icon: LineChart },
    { id: 'graph', label: t.knowledgeGraph, icon: Share2 },
  ];
  
  const sourceItems = [
      { id: 'Default Library', label: t.defaultLibrary },
      { id: 'My Local Files', label: t.myLocalFiles },
      { id: 'Online Sources', label: t.onlineSources },
  ];

  const handleSourceChange = (sourceId: string, checked: boolean) => {
    if (checked) {
      setSelectedSources([...selectedSources, sourceId]);
    } else {
      setSelectedSources(selectedSources.filter((s) => s !== sourceId));
    }
  };

  const handleLanguageChange = (checked: boolean) => {
    setLanguage(checked ? 'fa' : 'en');
  }
  
  return (
    <aside className="w-72 flex-shrink-0 bg-card/50 border-r border-border flex flex-col p-4">
      <div className="flex items-center gap-3 px-2 py-1">
        <Logo className="w-7 h-7 text-primary" />
        <h1 className="text-xl font-bold font-headline tracking-tight">
          {t.appTitle}
        </h1>
      </div>

      <Separator className="my-4" />
      
      <div className="flex flex-col gap-4 px-2">
        <div className="flex items-center justify-between">
            <Label htmlFor="language-switch" className="font-medium flex items-center gap-2">
              <Languages className="w-5 h-5" />
              <span>{t.persianLanguage}</span>
            </Label>
            <Switch
              id="language-switch"
              checked={language === 'fa'}
              onCheckedChange={handleLanguageChange}
            />
          </div>
      </div>

      <Separator className="my-4" />

      <div className="flex flex-col gap-4 px-2">
        <h2 className="text-sm font-semibold text-muted-foreground tracking-wider uppercase">
          {t.dataSources}
        </h2>
        {sourceItems.map((item) => (
          <div key={item.id} className="flex items-center justify-between">
            <Label htmlFor={item.id} className="font-medium">
              {item.label}
            </Label>
            <Switch
              id={item.id}
              checked={selectedSources.includes(item.id)}
              onCheckedChange={(checked) => handleSourceChange(item.id, checked)}
            />
          </div>
        ))}
      </div>

      <Separator className="my-4" />

      <nav className="flex-1 flex flex-col gap-1 px-2">
        {navItems.map((item) => (
          <Button
            key={item.id}
            variant={activeView === item.id ? 'secondary' : 'ghost'}
            className="justify-start gap-3"
            onClick={() => setActiveView(item.id as ViewType)}
          >
            <item.icon className="w-5 h-5" />
            <span>{item.label}</span>
          </Button>
        ))}
      </nav>

      <Separator className="my-4" />

      <div className="px-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button className="w-full" variant="default">
                <UploadCloud className="mr-2 h-5 w-5" />
                {t.uploadDocuments}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top" align="center">
              <p>{t.uploadTooltip}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </aside>
  );
}
