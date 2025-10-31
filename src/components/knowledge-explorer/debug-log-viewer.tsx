'use client';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Card, CardContent } from '@/components/ui/card';
import { Terminal } from 'lucide-react';
import { useLanguage } from './language-context';
import { i18n } from '@/lib/i18n';

interface DebugLogViewerProps {
  logs: string;
}

export function DebugLogViewer({ logs }: DebugLogViewerProps) {
  const { language } = useLanguage();
  const t = i18n[language];
  if (!logs) return null;

  return (
    <Accordion type="single" collapsible className="w-full">
      <AccordionItem value="item-1">
        <AccordionTrigger>
          <div className="flex items-center gap-2 font-headline">
            <Terminal className="w-5 h-5" />
            <span>{t.showDebugLogs}</span>
          </div>
        </AccordionTrigger>
        <AccordionContent>
          <Card className="bg-black/80 border-border font-code">
            <CardContent className="p-4">
              <pre className="text-xs text-green-300 whitespace-pre-wrap break-all">
                {logs}
              </pre>
            </CardContent>
          </Card>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
