'use client';

import { useState, useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { LeftSidebar } from '@/components/knowledge-explorer/left-sidebar';
import { QandAView } from '@/components/knowledge-explorer/qa-view';
import { TemporalView } from '@/components/knowledge-explorer/temporal-view';
import { GraphView } from '@/components/knowledge-explorer/graph-view';
import { RightSidebar } from '@/components/knowledge-explorer/right-sidebar';
import type { ViewType } from '@/components/knowledge-explorer/types';
import type { Document } from '@/components/knowledge-explorer/types';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import ErrorBoundary from '@/components/ui/error-boundary';
import { LanguageProvider, useLanguage } from '@/components/knowledge-explorer/language-context';

const MapView = dynamic(() => import('@/components/knowledge-explorer/map-view'), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full p-6 lg:p-8 flex flex-col gap-6">
      <Skeleton className="h-12 w-1/3" />
      <Card className="flex-1">
        <CardContent className="h-full w-full p-0">
          <Skeleton className="h-full w-full" />
        </CardContent>
      </Card>
    </div>
  ),
});

function AppContent() {
  const [activeView, setActiveView] = useState<ViewType>('qa');
  const [isRightSidebarOpen, setRightSidebarOpen] = useState(false);
  const [rightSidebarData, setRightSidebarData] = useState<Document | null>(null);
  const [selectedSources, setSelectedSources] = useState<string[]>(['Default Library']);
  const [documents, setDocuments] = useState<Document[]>([]);
  const qaViewRef = useRef<{ handleSearch: (query: string) => void }>(null);
  const { language } = useLanguage();

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = language === 'fa' ? 'rtl' : 'ltr';
    document.body.style.fontFamily = language === 'fa' ? "'Vazirmatn', sans-serif" : "'Inter', sans-serif";
  }, [language]);


  const handleCitationClick = (citationIndex: number) => {
    const doc = documents.find(d => d.id === citationIndex);
    if (doc) {
      setRightSidebarData(doc);
      setRightSidebarOpen(true);
    }
  };
  
  const handleDocumentClick = (doc: Document) => {
    setRightSidebarData(doc);
    setRightSidebarOpen(true);
  }

  const handleLocationSearch = (query: string) => {
    setActiveView('qa');
    // Use a timeout to ensure the QandAView is rendered before calling its method
    setTimeout(() => {
      qaViewRef.current?.handleSearch(query);
    }, 100);
  };

  return (
    <div className="flex flex-1 bg-transparent text-foreground w-full">
      <LeftSidebar 
        activeView={activeView} 
        setActiveView={setActiveView}
        selectedSources={selectedSources}
        setSelectedSources={setSelectedSources}
      />
      <main className="flex-1 flex flex-col min-w-0">
        <div className="flex-1 overflow-y-auto relative">
          <div style={{ display: activeView === 'qa' ? 'block' : 'none' }} className="w-full h-full">
            <QandAView
              ref={qaViewRef}
              onCitationClick={handleCitationClick} 
              selectedSources={selectedSources}
              documents={documents}
              setDocuments={setDocuments}
              onDocumentClick={handleDocumentClick}
            />
          </div>
          <div style={{ display: activeView === 'map' ? 'block' : 'none' }} className="w-full h-full">
            <ErrorBoundary>
              <MapView onLocationSearch={handleLocationSearch} />
            </ErrorBoundary>
          </div>
           <div style={{ display: activeView === 'temporal' ? 'block' : 'none' }} className="w-full h-full">
            <TemporalView documents={documents} />
          </div>
          <div style={{ display: activeView === 'graph' ? 'block' : 'none' }} className="w-full h-full">
            <GraphView documents={documents} />
          </div>
        </div>
      </main>
      <RightSidebar
        isOpen={isRightSidebarOpen}
        onOpenChange={setRightSidebarOpen}
        title={rightSidebarData?.title ?? 'No document selected'}
        content={rightSidebarData?.content ?? ''}
      />
    </div>
  );
}

export default function Home() {
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  )
}
