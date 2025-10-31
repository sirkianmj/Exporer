'use client';

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FileText } from 'lucide-react';
import { useLanguage } from './language-context';
import { i18n } from '@/lib/i18n';

interface RightSidebarProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  title: string;
  content: string;
}

export function RightSidebar({
  isOpen,
  onOpenChange,
  title,
  content,
}: RightSidebarProps) {
  const { language } = useLanguage();
  const t = i18n[language];
  
  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg w-[90vw] bg-card/95 backdrop-blur-sm">
        <SheetHeader className="mb-4">
          <SheetTitle className="flex items-center gap-3">
            <FileText className="w-6 h-6 text-primary" />
            {t.sourceDocument}
          </SheetTitle>
          <SheetDescription>{title}</SheetDescription>
        </SheetHeader>
        <ScrollArea className="h-[calc(100vh-8rem)] pr-4">
          <p className="text-base text-muted-foreground whitespace-pre-wrap leading-relaxed">
            {content}
          </p>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
