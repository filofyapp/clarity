"use client";

import { useState, useEffect, useCallback } from "react";
import { X, ChevronLeft, ChevronRight, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

export interface LightboxImage {
    url: string;
    nombre: string;
}

interface ImageLightboxProps {
    images: LightboxImage[];
    initialIndex?: number;
    open: boolean;
    onClose: () => void;
}

export function ImageLightbox({ images, initialIndex = 0, open, onClose }: ImageLightboxProps) {
    const [currentIndex, setCurrentIndex] = useState(initialIndex);

    // Sync index when images or initialIndex change
    useEffect(() => {
        setCurrentIndex(initialIndex);
    }, [initialIndex, open]);

    // Keyboard navigation
    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (!open) return;
        if (e.key === "ArrowLeft") {
            setCurrentIndex(prev => prev > 0 ? prev - 1 : images.length - 1);
        } else if (e.key === "ArrowRight") {
            setCurrentIndex(prev => prev < images.length - 1 ? prev + 1 : 0);
        } else if (e.key === "Escape") {
            onClose();
        }
    }, [open, images.length, onClose]);

    useEffect(() => {
        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [handleKeyDown]);

    if (images.length === 0) return null;

    const current = images[currentIndex];
    if (!current) return null;

    const handleDownload = () => {
        const a = document.createElement("a");
        a.href = current.url;
        a.download = current.nombre;
        a.target = "_blank";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    return (
        <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
            <DialogContent className="max-w-[95vw] sm:max-w-4xl bg-black/95 border-none p-0 flex flex-col h-[90vh] shadow-2xl">
                <DialogTitle className="sr-only">Visor de imágenes</DialogTitle>

                {/* Header Controls */}
                <div className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between p-4 bg-gradient-to-b from-black/60 to-transparent">
                    <div className="flex items-center gap-2">
                        <span className="text-white/90 text-sm font-medium">
                            {currentIndex + 1} de {images.length}
                        </span>
                        <span className="text-white/60 text-xs truncate max-w-[200px] hidden sm:inline-block">
                            {current.nombre}
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-white hover:bg-white/20"
                            onClick={handleDownload}
                        >
                            <Download className="w-4 h-4 mr-2" />
                            Descargar
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="text-white hover:bg-white/20 rounded-full"
                            onClick={onClose}
                        >
                            <X className="w-5 h-5" />
                        </Button>
                    </div>
                </div>

                {/* Main Image Area */}
                <div 
                    className="flex-1 relative flex items-center justify-center p-4 cursor-pointer"
                    onClick={onClose}
                >
                    {images.length > 1 && (
                        <Button
                            variant="ghost"
                            size="icon"
                            className="absolute left-2 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 rounded-full w-12 h-12 z-50 hidden sm:flex"
                            onClick={(e) => { e.stopPropagation(); setCurrentIndex(prev => prev > 0 ? prev - 1 : images.length - 1); }}
                        >
                            <ChevronLeft className="w-8 h-8" />
                        </Button>
                    )}

                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={current.url}
                        alt={current.nombre}
                        className="max-w-full max-h-full object-contain cursor-default"
                        onClick={(e) => e.stopPropagation()}
                    />

                    {images.length > 1 && (
                        <Button
                            variant="ghost"
                            size="icon"
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 rounded-full w-12 h-12 z-50 hidden sm:flex"
                            onClick={(e) => { e.stopPropagation(); setCurrentIndex(prev => prev < images.length - 1 ? prev + 1 : 0); }}
                        >
                            <ChevronRight className="w-8 h-8" />
                        </Button>
                    )}
                </div>

                {/* Thumbnail strip */}
                {images.length > 1 && (
                    <div className="h-20 bg-black/80 flex items-center justify-center gap-2 px-4 overflow-x-auto custom-scrollbar">
                        {images.map((img, idx) => (
                            <button
                                key={idx}
                                onClick={() => setCurrentIndex(idx)}
                                className={`relative h-14 w-14 shrink-0 rounded overflow-hidden transition-all ${idx === currentIndex ? 'ring-2 ring-brand-primary opacity-100 scale-105' : 'opacity-50 hover:opacity-100'}`}
                            >
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={img.url} alt="" className="absolute inset-0 w-full h-full object-cover" />
                            </button>
                        ))}
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
