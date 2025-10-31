'use client';

import { useState, useImperativeHandle, forwardRef } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { FileText, Search, LoaderCircle } from 'lucide-react';
import { intelligentQandA } from '@/ai/flows/intelligent-q-and-a';
import { useToast } from '@/hooks/use-toast';
import type { Document } from './types';
import { DebugLogViewer } from './debug-log-viewer';
import { useLanguage } from './language-context';
import { i18n } from '@/lib/i18n';

interface QandAViewProps {
  onCitationClick: (index: number) => void;
  selectedSources: string[];
  documents: Document[];
  setDocuments: (documents: Document[]) => void;
  onDocumentClick: (doc: Document) => void;
}

export const QandAView = forwardRef((
  { 
    onCitationClick, 
    selectedSources, 
    documents, 
    setDocuments,
    onDocumentClick
  }: QandAViewProps,
  ref
) => {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [debugLog, setDebugLog] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { language } = useLanguage();
  const t = i18n[language];

  const handleSearch = async (searchQuery: string = question) => {
    if (!searchQuery.trim()) {
      toast({
        variant: 'destructive',
        title: t.error,
        description: t.emptyQuestion,
      });
      return;
    }
    setQuestion(searchQuery);
    setIsLoading(true);
    setAnswer('');
    setDebugLog('');
    try {
      const result = await intelligentQandA({ question: searchQuery, selectedSources, documents, language });
      setAnswer(result.answer);
      setDebugLog(result.debugLog || '');

      if (result.documents) {
        const currentDocIds = new Set(documents.map(d => d.id));
        const newDocs = result.documents.filter(newDoc => !documents.some(d => d.url === newDoc.url));

        // Re-ID new docs to avoid conflicts
        let nextId = documents.length > 0 ? Math.max(...documents.map(d => d.id)) + 1 : 1;
        const reIdedNewDocs = newDocs.map(doc => ({ ...doc, id: nextId++ }));
        
        setDocuments([...documents, ...reIdedNewDocs]);
      }
    } catch (error) {
      console.error('Error getting answer:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
      toast({
        variant: 'destructive',
        title: t.error,
        description: t.errorGettingAnswer,
      });
      setDebugLog(prev => `${prev}\n\n[FATAL CLIENT ERROR]\n${errorMessage}\n${(error as Error).stack}`);
    } finally {
      setIsLoading(false);
    }
  };

  useImperativeHandle(ref, () => ({
    handleSearch(query: string) {
      handleSearch(query);
    }
  }));
  
  const renderAnswerWithCitations = () => {
    if (!answer) return null;
    
    const parts = answer.split(/(\[doc(\d+)\])/g);

    return parts.map((part, index) => {
      const match = part.match(/\[doc(\d+)\]/);
      if (match) {
        const citationNumber = parseInt(match[1], 10);
        return (
          <Button
            key={index}
            variant="link"
            className="p-1 h-auto text-base text-primary"
            onClick={() => onCitationClick(citationNumber)}
          >
            {`[${citationNumber}]`}
          </Button>
        );
      }
      return part;
    });
  };


  return (
    <div className="max-w-4xl mx-auto p-6 lg:p-8 flex flex-col gap-8">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          placeholder={t.askAQuestion}
          className="pl-12 h-12 text-lg"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          disabled={isLoading}
        />
        <Button 
          className="absolute right-2 top-1/2 -translate-y-1/2" 
          onClick={() => handleSearch()}
          disabled={isLoading}
        >
          {isLoading ? <LoaderCircle className="animate-spin" /> : t.ask}
        </Button>
      </div>

      {isLoading && (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline">{t.synthesizingAnswer}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-base leading-relaxed">
            <div className="flex items-center gap-4">
              <LoaderCircle className="w-8 h-8 animate-spin text-primary" />
              <p>{t.pleaseWait}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {!isLoading && answer && (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline">{t.synthesizedAnswer}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-base leading-relaxed">
            <p>
              {renderAnswerWithCitations()}
            </p>
          </CardContent>
        </Card>
      )}

      {!isLoading && !answer && !debugLog && (
         <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline">{t.askAQuestionTitle}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              {t.askAQuestionDescription}
            </p>
          </CardContent>
        </Card>
      )}
      
      {debugLog && <DebugLogViewer logs={debugLog} />}


      <div>
        <h3 className="text-xl font-bold font-headline mb-4">{t.sourceDocuments}</h3>
        {documents.length === 0 ? (
          <p className="text-muted-foreground">{t.noDocumentsYet}</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {documents.map((doc) => (
              <Card key={doc.id} className="hover:bg-card/70 transition-colors cursor-pointer" onClick={() => onDocumentClick(doc)}>
                <CardHeader className="flex flex-row items-center gap-4 space-y-0">
                  <FileText className="w-8 h-8 text-primary" />
                  <div className="flex-1">
                    <CardTitle className="text-lg">
                      {doc.title}
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground line-clamp-2 mb-3">
                    {doc.content}
                  </p>
                  <Badge variant="secondary">{t.docId}: {doc.id}</Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
});

QandAView.displayName = 'QandAView';
