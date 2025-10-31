'use client';

import { Card } from '@/components/ui/card';
import React, { useMemo, useState, useEffect } from 'react';
import type { Document } from './types';
import { extractEntities, type ExtractEntitiesOutput } from '@/ai/flows/extract-entities-flow';
import { LoaderCircle } from 'lucide-react';
import { useLanguage } from './language-context';
import { i18n } from '@/lib/i18n';

const ENTITY_COLORS: Record<string, string> = {
  'Garden': 'hsl(var(--chart-2))',
  'Person': 'hsl(var(--chart-3))',
  'Dynasty': 'hsl(var(--chart-5))',
  'Location': 'hsl(var(--chart-4))',
  'Element': 'hsl(var(--chart-1))',
  'Concept': 'hsl(var(--primary))',
  'Date': 'hsl(var(--muted-foreground))',
  // Persian mappings
  'باغ': 'hsl(var(--chart-2))',
  'شخص': 'hsl(var(--chart-3))',
  'سلسله': 'hsl(var(--chart-5))',
  'مکان': 'hsl(var(--chart-4))',
  'عنصر': 'hsl(var(--chart-1))',
  'مفهوم': 'hsl(var(--primary))',
  'تاریخ': 'hsl(var(--muted-foreground))',
};

type Node = {
  id: string;
  label: string;
  group: string;
  x: number;
  y: number;
  color: string;
  size: number;
};

type Edge = {
  from: string;
  to: string;
};

const processEntitiesForGraph = (entityData: ExtractEntitiesOutput): { nodes: Node[], edges: Edge[] } => {
  if (!entityData || entityData.length === 0) {
    return { nodes: [], edges: [] };
  }

  const nodesMap: Map<string, Node> = new Map();
  const relations: Map<string, Set<string>> = new Map();

  entityData.forEach(docEntities => {
    const uniqueEntitiesInDoc = new Set(docEntities.entities.map(e => `${e.type}::${e.name}`));

    docEntities.entities.forEach(entity => {
      const nodeId = `${entity.type}::${entity.name}`;
      if (!nodesMap.has(nodeId)) {
        nodesMap.set(nodeId, {
          id: nodeId,
          label: entity.name,
          group: entity.type,
          x: Math.random() * 100,
          y: Math.random() * 100,
          color: ENTITY_COLORS[entity.type] || 'hsl(var(--foreground))',
          size: 60, // Base size
        });
      }
      // Increase size for every mention
      const node = nodesMap.get(nodeId)!;
      nodesMap.set(nodeId, { ...node, size: Math.min(node.size + 5, 150) });
    });

    const docEntityList = Array.from(uniqueEntitiesInDoc);
    for (let i = 0; i < docEntityList.length; i++) {
      for (let j = i + 1; j < docEntityList.length; j++) {
        const entityA = docEntityList[i];
        const entityB = docEntityList[j];
        if (!relations.has(entityA)) relations.set(entityA, new Set());
        if (!relations.has(entityB)) relations.set(entityB, new Set());
        relations.get(entityA)!.add(entityB);
        relations.get(entityB)!.add(entityA);
      }
    }
  });

  const edges: Edge[] = [];
  relations.forEach((toSet, from) => {
    toSet.forEach(to => {
      if (!edges.some(e => (e.from === from && e.to === to) || (e.from === to && e.to === from))) {
        edges.push({ from, to });
      }
    });
  });

  return { nodes: Array.from(nodesMap.values()), edges };
};


export function GraphView({ documents }: { documents: Document[] }) {
  const [graphData, setGraphData] = useState<{ nodes: Node[], edges: Edge[] }>({ nodes: [], edges: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { language } = useLanguage();
  const t = i18n[language];

  useEffect(() => {
    const generateGraph = async () => {
      if (documents.length === 0) {
        setIsLoading(false);
        setGraphData({ nodes: [], edges: [] });
        return;
      }
      
      setIsLoading(true);
      setError(null);
      try {
        const documentsToProcess = documents.map(({ id, content }) => ({ id, content }));
        const entities = await extractEntities({ documents: documentsToProcess, language });
        const processedData = processEntitiesForGraph(entities);
        setGraphData(processedData);
      } catch (e) {
        console.error("Failed to generate graph:", e);
        setError(t.graphGenerationFailed);
      } finally {
        setIsLoading(false);
      }
    };

    generateGraph();
  }, [documents, language, t.graphGenerationFailed]);

  const { nodes, edges } = graphData;
  const getNodeById = (id: string) => nodes.find(n => n.id === id);
  
  if (isLoading) {
    return (
      <div className="h-full w-full p-6 lg:p-8 flex flex-col gap-6 items-center justify-center">
         <div className="flex items-center gap-4 text-xl">
            <LoaderCircle className="w-8 h-8 animate-spin text-primary" />
            <h1 className="font-headline">{t.analyzingAndBuildingGraph}</h1>
        </div>
        <p className="text-muted-foreground">
          {t.analyzingAndBuildingGraphDescription}
        </p>
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="h-full w-full p-6 lg:p-8 flex flex-col gap-6 items-center justify-center">
        <h1 className="text-3xl font-bold font-headline tracking-tight">{t.graphViewTitle}</h1>
        <p className="text-muted-foreground">
          {t.noDocumentsToAnalyze}
        </p>
      </div>
    );
  }
  
  if (error) {
    return (
       <div className="h-full w-full p-6 lg:p-8 flex flex-col gap-6 items-center justify-center">
        <h1 className="text-3xl font-bold font-headline tracking-tight text-destructive">{t.graphGenerationFailed}</h1>
        <p className="text-muted-foreground max-w-md text-center">
          {error}
        </p>
      </div>
    )
  }
  
  if (nodes.length < 2 || edges.length === 0) {
    return (
      <div className="h-full w-full p-6 lg:p-8 flex flex-col gap-6 items-center justify-center">
        <h1 className="text-3xl font-bold font-headline tracking-tight">{t.graphViewTitle}</h1>
        <p className="text-muted-foreground max-w-md text-center">
          {t.notEnoughConcepts}
        </p>
      </div>
    );
  }

  return (
    <div className="h-full w-full p-6 lg:p-8 flex flex-col gap-6">
      <h1 className="text-3xl font-bold font-headline tracking-tight">{t.graphViewTitle}</h1>
      <Card className="flex-1 relative overflow-hidden bg-transparent border-0 shadow-none" style={{ perspective: '1000px' }}>
        <svg className="absolute top-0 left-0 w-full h-full" style={{ pointerEvents: 'none' }}>
          {edges.map((edge, index) => {
            const fromNode = getNodeById(edge.from);
            const toNode = getNodeById(edge.to);
            if (!fromNode || !toNode) return null;
            
            const x1 = fromNode.x;
            const y1 = fromNode.y;
            const x2 = toNode.x;
            const y2 = toNode.y;

            return (
              <line
                key={index}
                x1={`${x1}%`}
                y1={`${y1}%`}
                x2={`${x2}%`}
                y2={`${y2}%`}
                stroke="hsl(var(--border) / 0.5)"
                strokeWidth="1"
              />
            );
          })}
        </svg>

        {nodes.map(node => (
          <div
            key={node.id}
            className="absolute flex items-center justify-center p-2 rounded-full transition-all duration-300 ease-in-out hover:scale-110 hover:shadow-2xl group"
            style={{
              left: `calc(${node.x}% - ${node.size / 2}px)`,
              top: `calc(${node.y}% - ${node.size / 2}px)`,
              width: `${node.size}px`,
              height: `${node.size}px`,
              transformStyle: 'preserve-3d',
              transform: 'translateZ(0)',
              background: 'radial-gradient(circle, hsl(var(--card) / 0.8) 0%, transparent 70%)'
            }}
          >
            <div
              className="absolute inset-0 rounded-full border-2 transition-transform duration-300 ease-in-out group-hover:translate-z-[20px] group-hover:scale-105"
              style={{
                borderColor: node.color,
                boxShadow: `0 0 15px 5px ${node.color}33`,
              }}
            ></div>
             <div className="relative z-10 text-center text-sm font-medium text-foreground p-2 break-words transition-transform duration-300 ease-in-out group-hover:translate-z-[40px] group-hover:scale-110">
              <div className="font-bold">{node.label}</div>
              <div className="text-xs text-muted-foreground">{node.group}</div>
            </div>
          </div>
        ))}
      </Card>
    </div>
  );
}
