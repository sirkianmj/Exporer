'use client';

import 'leaflet/dist/leaflet.css';
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css';
import 'leaflet-defaulticon-compatibility';

import { Card } from '@/components/ui/card';
import { useState } from 'react';
import type { LatLng } from 'leaflet';
import MapWrapper from './map-wrapper';
import { useLanguage } from './language-context';
import { i18n } from '@/lib/i18n';

interface MapViewProps {
    onLocationSearch: (query: string) => void;
}

export default function MapView({ onLocationSearch }: MapViewProps) {
  const [clickedPosition, setClickedPosition] = useState<LatLng | null>(null);
  const { language } = useLanguage();
  const t = i18n[language];

  const handleSearch = () => {
    if (clickedPosition) {
      const { lat, lng } = clickedPosition;
      const query = t.geospatialSearchQuery(lat, lng);
      onLocationSearch(query);
    }
  }

  return (
    <div className="h-full w-full p-6 lg:p-8 flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold font-headline tracking-tight">{t.geospatialExplorer}</h1>
        <p className="text-muted-foreground">{t.geospatialExplorerDescription}</p>
      </div>
      <Card className="flex-1 overflow-hidden">
        <MapWrapper
            clickedPosition={clickedPosition}
            onSetClickedPosition={setClickedPosition}
            onSearch={handleSearch}
        />
      </Card>
    </div>
  );
}
