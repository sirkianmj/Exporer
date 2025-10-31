'use client';

import {
  Line,
  LineChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart';
import type { ChartConfig } from '@/components/ui/chart';
import type { Document } from './types';
import { useMemo } from 'react';
import { useLanguage } from './language-context';
import { i18n } from '@/lib/i18n';

// Helper function to convert Persian/Arabic numbers to English
const toEnglishDigits = (str: string | null | undefined): string => {
    if (!str) return '';
    const persianNumbers = [/۰/g, /۱/g, /۲/g, /۳/g, /۴/g, /۵/g, /۶/g, /۷/g, /۸/g, /۹/g];
    const arabicNumbers  = [/٠/g, /١/g, /٢/g, /٣/g, /٤/g, /٥/g, /٦/g, /٧/g, /٨/g, /٩/g];
    let newStr = str.toString();
    for (let i = 0; i < 10; i++) {
        newStr = newStr.replace(persianNumbers[i], i.toString()).replace(arabicNumbers[i], i.toString());
    }
    return newStr;
};

// --- Calendar Conversion Functions ---

/**
 * Converts a Hijri Shamsi (Jalali/Persian) year to a Gregorian year.
 * This is an approximation suitable for historical timelines.
 * @param shamsiYear The Hijri Shamsi year.
 * @returns The approximate Gregorian year.
 */
const shamsiToGregorian = (shamsiYear: number): number => {
  return shamsiYear + 621;
};

/**
 * Converts a Hijri Qamari (Islamic lunar) year to a Gregorian year.
 * This is an approximation based on the average shorter length of the lunar year.
 * @param qamariYear The Hijri Qamari year.
 * @returns The approximate Gregorian year.
 */
const qamariToGregorian = (qamariYear: number): number => {
  return Math.floor(qamariYear * 0.97 + 622);
};


const processDocuments = (documents: Document[], language: 'en' | 'fa') => {
  const t = i18n[language];
  const TOPICS: Record<string, string[]> = {
    [t.topicDesign]: ['design', 'architecture', 'pavilion', 'chahar bagh', 'layout', 'water channel', 'avenue', 'courtyard', 'palace', 'طراحی', 'معماری', 'کوشک', 'چهارباغ', 'طرح', 'کانال آب', 'خیابان', 'حیاط', 'کاخ'],
    [t.topicHistory]: ['history', 'safavid', 'qajar', 'pahlavi', 'mughal', 'achaemenid', 'dynasty', 'ruler', 'shah', 'king', 'sultan', 'reign', 'تاریخ', 'صفویه', 'قاجار', 'پهلوی', 'مغول', 'هخامنشی', 'سلسله', 'حاکم', 'شاه', 'پادشاه', 'سلطان', 'سلطنت'],
    [t.topicCulture]: ['cultural', 'symbolism', 'poetry', 'paradise', 'art', 'religion', 'unesco', 'heritage', 'persian carpet', 'فرهنگی', 'نمادگرایی', 'شعر', 'پردیس', 'هنر', 'دین', 'یونسکو', 'میراث', 'فرش ایرانی'],
    [t.topicBotany]: ['botany', 'plants', 'trees', 'flowers', 'water', 'qanat', 'irrigation', 'cypresses', 'plane tree', 'fruit trees', 'گیاه شناسی', 'گیاهان', 'درختان', 'گل ها', 'آب', 'قنات', 'آبیاری', 'سرو', 'چنار', 'درختان میوه'],
  };

  const yearlyTopicCounts: Record<number, Record<string, number>> = {};

  documents.forEach(doc => {
    const originalContent = doc.content;
    const normalizedContent = toEnglishDigits(originalContent);
    const contentForKeywordMatching = originalContent.toLowerCase();

    // Regex to find years and optionally check for following calendar characters.
    const yearRegex = /\b(\d{3,4})\b/g;
    let match;
    const uniqueYears = new Set<number>();

    while ((match = yearRegex.exec(normalizedContent)) !== null) {
        let year = parseInt(match[1], 10);
        
        // Look for context around the year in the original text.
        // We search within a window of characters before and after the number.
        const matchIndex = match.index;
        const contextWindowAfter = originalContent.substring(matchIndex + match[0].length, matchIndex + match[0].length + 30).toLowerCase();
        const contextWindowBefore = originalContent.substring(Math.max(0, matchIndex - 30), matchIndex).toLowerCase();
        const fullContextWindow = contextWindowBefore + match[0] + contextWindowAfter;

        if (fullContextWindow.includes('هجری شمسی') || fullContextWindow.includes('ه.ش') || contextWindowAfter.trim().startsWith('ه') || contextWindowAfter.trim().startsWith('ش')) {
            year = shamsiToGregorian(year);
        } else if (fullContextWindow.includes('هجری قمری') || fullContextWindow.includes('ه.ق') || contextWindowAfter.trim().startsWith('ق')) {
            year = qamariToGregorian(year);
        } else if (contextWindowAfter.trim().startsWith('م')) {
            // It's explicitly Gregorian (Miladi), so do nothing.
        }
        
        // Add only valid Gregorian-range years to the set
        if (year > 500 && year < 2100) {
            uniqueYears.add(year);
        }
    }

    // Also handle centuries
    const centuryYearsRaw = normalizedContent.match(/\b(\d{1,2})(?:st|nd|rd|th)?\s*century\b/gi) || [];
    const persianCenturyYearsRaw = toEnglishDigits(originalContent).match(/(?:قرن|سده)\s*(\d{1,2})\b/g) || [];

    const centuryYears = centuryYearsRaw.map(c => {
       const centuryMatch = c.match(/\d{1,2}/);
       if (!centuryMatch) return null;
       const century = parseInt(centuryMatch[0], 10);
       return (century - 1) * 100 + 50; // Use midpoint of the century
    }).filter((y): y is number => y !== null);
    
    const persianCenturyYears = persianCenturyYearsRaw.map(c => {
       const centuryMatch = c.match(/\d{1,2}/);
       if (!centuryMatch) return null;
       const century = parseInt(centuryMatch[0], 10);
       // Assuming Persian centuries are Hijri Shamsi
       return shamsiToGregorian((century - 1) * 100 + 50);
    }).filter((y): y is number => y !== null);
    
    centuryYears.forEach(y => uniqueYears.add(y));
    persianCenturyYears.forEach(y => uniqueYears.add(y));

    if (uniqueYears.size > 0) {
      const docTopics = new Set<string>();

      Object.entries(TOPICS).forEach(([topic, keywords]) => {
        if (keywords.some(keyword => contentForKeywordMatching.includes(keyword))) {
          docTopics.add(topic);
        }
      });
      
      if (docTopics.size === 0) return;

      uniqueYears.forEach(year => {
        if (!yearlyTopicCounts[year]) {
          yearlyTopicCounts[year] = Object.keys(TOPICS).reduce((acc, topic) => {
            acc[topic] = 0;
            return acc;
          }, {} as Record<string, number>);
        }
        docTopics.forEach(topic => {
          yearlyTopicCounts[year][topic]++;
        });
      });
    }
  });

  const chartData = Object.entries(yearlyTopicCounts)
    .map(([year, counts]) => ({
      year: parseInt(year, 10),
      ...counts,
    }))
    .sort((a, b) => a.year - b.year);

  return chartData;
};

export function TemporalView({ documents }: { documents: Document[] }) {
  const { language } = useLanguage();
  const t = i18n[language];
  
  const chartConfig = useMemo(() => ({
    [t.topicDesign]: {
      label: t.topicDesign,
      color: 'hsl(var(--chart-1))',
    },
    [t.topicHistory]: {
      label: t.topicHistory,
      color: 'hsl(var(--chart-2))',
    },
    [t.topicCulture]: {
      label: t.topicCulture,
      color: 'hsl(var(--chart-3))',
    },
    [t.topicBotany]: {
      label: t.topicBotany,
      color: 'hsl(var(--chart-4))',
    },
  }), [t]) satisfies ChartConfig;
  
  const chartData = useMemo(() => processDocuments(documents, language), [documents, language]);

  if (documents.length === 0) {
    return (
      <div className="h-full w-full p-6 lg:p-8 flex flex-col gap-6 items-center justify-center">
        <h1 className="text-3xl font-bold font-headline tracking-tight">
          {t.temporalViewTitle}
        </h1>
        <p className="text-muted-foreground">
          {t.noDocumentsToAnalyze}
        </p>
      </div>
    );
  }
  
  if (chartData.length < 2) {
    return (
      <div className="h-full w-full p-6 lg:p-8 flex flex-col gap-6 items-center justify-center">
        <h1 className="text-3xl font-bold font-headline tracking-tight">
          {t.temporalViewTitle}
        </h1>
        <p className="text-muted-foreground">
          {t.notEnoughData}
        </p>
      </div>
    );
  }

  const minYear = chartData[0]?.year;
  const maxYear = chartData[chartData.length - 1]?.year;

  return (
    <div className="h-full w-full p-6 lg:p-8 flex flex-col gap-6">
      <h1 className="text-3xl font-bold font-headline tracking-tight">
        {t.temporalViewTitle}
      </h1>
      <Card className="flex-1">
        <CardHeader>
          <CardTitle>{t.chartTitle}</CardTitle>
          {minYear && maxYear && (
            <CardDescription>
              {t.chartDescription(minYear, maxYear)}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[50vh]">
            <LineChart
              data={chartData}
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis 
                dataKey="year" 
                tickLine={false} 
                axisLine={false}
                type="number"
                domain={['dataMin', 'dataMax']}
                tickFormatter={(tick) => Math.round(tick)}
                allowDuplicatedCategory={false}
              />
              <YAxis
                label={{
                  value: t.yAxisLabel,
                  angle: -90,
                  position: 'insideLeft',
                  style: { textAnchor: 'middle' },
                }}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <Tooltip
                cursor={{
                  stroke: 'hsl(var(--border))',
                  strokeWidth: 2,
                  strokeDasharray: '3 3',
                }}
                content={<ChartTooltipContent />}
              />
              <Legend content={<ChartLegendContent />} />
              {Object.keys(chartConfig).map((topic, index) => (
                 <Line
                    key={topic}
                    type="monotone"
                    dataKey={topic}
                    stroke={`hsl(var(--chart-${(index % 5) + 1}))`}
                    strokeWidth={2}
                    dot={true}
                 />
              ))}
            </LineChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
}
