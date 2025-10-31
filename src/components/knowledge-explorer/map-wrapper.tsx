'use client';

import 'leaflet/dist/leaflet.css';
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css';
import 'leaflet-defaulticon-compatibility';

import React, { useEffect, useRef } from 'react';
import { Map, TileLayer, Marker } from 'leaflet';
import { renderToStaticMarkup } from 'react-dom/server';
import { useLanguage } from './language-context';
import { i18n } from '@/lib/i18n';


interface MapWrapperProps {
  clickedPosition: L.LatLng | null;
  onSetClickedPosition: (position: L.LatLng) => void;
  onSearch: () => void;
}

const MapWrapper: React.FC<MapWrapperProps> = ({ clickedPosition, onSetClickedPosition, onSearch }) => {
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<Map | null>(null);
    const markerRef = useRef<Marker | null>(null);
    const { language } = useLanguage();
    const t = i18n[language];

    // Initialize map
    useEffect(() => {
        if (mapRef.current && !mapInstanceRef.current) {
            const map = new Map(mapRef.current, {
                center: [32.4279, 53.6880], // Iran center
                zoom: 5,
                scrollWheelZoom: true,
            });

            new TileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            }).addTo(map);

            map.on('click', (e) => {
                onSetClickedPosition(e.latlng);
            });

            mapInstanceRef.current = map;
        }

        // Cleanup on unmount
        return () => {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove();
                mapInstanceRef.current = null;
            }
        };
    }, [onSetClickedPosition]);

    // Handle marker updates
    useEffect(() => {
        if (mapInstanceRef.current && clickedPosition) {
            // Remove existing marker
            if (markerRef.current) {
                markerRef.current.remove();
            }

            const newMarker = new Marker(clickedPosition).addTo(mapInstanceRef.current);
            
            const popupContent = document.createElement('div');
            popupContent.innerHTML = renderToStaticMarkup(
                <div className="flex flex-col gap-2 items-center p-1 font-sans">
                    <span className="font-bold text-base">{t.searchThisArea}</span>
                    <p className="text-sm text-gray-500">
                        Lat: {clickedPosition.lat.toFixed(4)}, Lng:{' '}
                        {clickedPosition.lng.toFixed(4)}
                    </p>
                </div>
            );
            
            const buttonContainer = document.createElement('div');
            const searchButton = document.createElement('button');
            searchButton.textContent = t.search;
            searchButton.className = 'bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium h-9 px-3';
            searchButton.onclick = onSearch;
            buttonContainer.appendChild(searchButton);
            popupContent.appendChild(buttonContainer);

            newMarker.bindPopup(popupContent).openPopup();
            markerRef.current = newMarker;
        }
    }, [clickedPosition, onSearch, t]);


    return <div ref={mapRef} style={{ height: '100%', width: '100%' }} />;
};

export default MapWrapper;
