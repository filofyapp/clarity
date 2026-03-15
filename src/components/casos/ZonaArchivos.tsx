"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Upload, FileText, Trash2, Download, Loader2, FolderOpen, Eye, ExternalLink, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogTitle, DialogHeader, DialogDescription } from "@/components/ui/dialog";
import JSZip from "jszip";
import { saveAs } from "file-saver";

interface ZonaArchivosProps {
    casoId: string;
}

interface ArchivoItem {
    name: string;
    id: string;
    created_at: string;
    metadata: Record<string, any> | null;
}

export function ZonaArchivos({ casoId }: ZonaArchivosProps) {
    const supabase = createClient();
    const [archivos, setArchivos] = useState<ArchivoItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [downloadingZip, setDownloadingZip] = useState(false);
    const [dragActive, setDragActive] = useState(false);
    const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

    const bucketName = "caso-archivos";
    const folderPath = `${casoId}/`;

    // Helpers
    const isImage = (name: string) => ["jpg", "jpeg", "png", "gif", "webp"].includes(name.split('.').pop()?.toLowerCase() || "");
    const isPdf = (name: string) => name.split('.').pop()?.toLowerCase() === "pdf";
    const cleanName = (name: string) => name.replace(/^\d+_/, "");
    const getPublicUrl = (name: string) => supabase.storage.from(bucketName).getPublicUrl(`${folderPath}${name}`).data?.publicUrl || "";

    // Separate images and documents
    const imageFiles = archivos.filter(a => isImage(a.name));
    const docFiles = archivos.filter(a => !isImage(a.name));

    // Previewable files (images + PDFs) for lightbox navigation
    const previewableFiles = archivos.filter(a => isImage(a.name) || isPdf(a.name));

    const fetchArchivos = useCallback(async () => {
        setLoading(true);
        const { data, error } = await supabase.storage.from(bucketName).list(folderPath, {
            sortBy: { column: "created_at", order: "desc" },
        });
        if (!error && data) {
            setArchivos(data.filter((f: any) => f.name !== ".emptyFolderPlaceholder") as ArchivoItem[]);
        }
        setLoading(false);
    }, [casoId]);

    useEffect(() => { fetchArchivos(); }, [fetchArchivos]);

    // Keyboard navigation for lightbox
    useEffect(() => {
        if (lightboxIndex === null) return;
        const handler = (e: KeyboardEvent) => {
            if (e.key === "ArrowRight") navigateLightbox(1);
            else if (e.key === "ArrowLeft") navigateLightbox(-1);
            else if (e.key === "Escape") setLightboxIndex(null);
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [lightboxIndex, previewableFiles.length]);

    const navigateLightbox = (dir: number) => {
        if (lightboxIndex === null) return;
        const next = lightboxIndex + dir;
        if (next >= 0 && next < previewableFiles.length) {
            setLightboxIndex(next);
        }
    };

    const openLightbox = (archivo: ArchivoItem) => {
        const idx = previewableFiles.findIndex(a => a.name === archivo.name);
        if (idx >= 0) setLightboxIndex(idx);
    };

    const handleUpload = async (files: FileList | null) => {
        if (!files || files.length === 0) return;
        setUploading(true);

        let uploadedCount = 0;
        for (const file of Array.from(files)) {
            const fileName = `${Date.now()}_${file.name}`;
            const { error } = await supabase.storage.from(bucketName).upload(`${folderPath}${fileName}`, file);
            if (error) {
                toast.error(`Error subiendo ${file.name}: ${error.message}`);
            } else {
                uploadedCount++;
            }
        }

        if (uploadedCount > 0) {
            toast.success(`${uploadedCount} archivo${uploadedCount > 1 ? "s" : ""} subido${uploadedCount > 1 ? "s" : ""}`);
            fetchArchivos();
        }
        setUploading(false);
    };

    const handleDelete = async (fileName: string) => {
        const { error } = await supabase.storage.from(bucketName).remove([`${folderPath}${fileName}`]);
        if (error) {
            toast.error("Error eliminando archivo");
        } else {
            toast.success("Archivo eliminado");
            setArchivos(prev => prev.filter(a => a.name !== fileName));
        }
    };

    const handleDownloadZip = async () => {
        if (archivos.length === 0) return;
        setDownloadingZip(true);
        toast.loading("Preparando ZIP...");

        try {
            const zip = new JSZip();
            for (const archivo of archivos) {
                const url = getPublicUrl(archivo.name);
                if (url) {
                    try {
                        const response = await fetch(url);
                        const blob = await response.blob();
                        zip.file(cleanName(archivo.name), blob);
                    } catch (err) {
                        console.error("Failed to fetch file for ZIP", archivo.name, err);
                    }
                }
            }
            const content = await zip.generateAsync({ type: "blob" });
            saveAs(content, `Expediente_${casoId.substring(0, 8)}.zip`);
            toast.dismiss();
            toast.success("Siniestro descargado exitosamente");
        } catch (error: any) {
            toast.dismiss();
            toast.error("Error al generar el ZIP");
        } finally {
            setDownloadingZip(false);
        }
    };

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
        if (e.type === "dragleave") setDragActive(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        handleUpload(e.dataTransfer.files);
    };

    const formatBytes = (bytes: number) => {
        if (!bytes) return "—";
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / 1048576).toFixed(1)} MB`;
    };

    // Current lightbox file
    const currentPreview = lightboxIndex !== null ? previewableFiles[lightboxIndex] : null;
    const currentUrl = currentPreview ? getPublicUrl(currentPreview.name) : "";
    const currentType = currentPreview ? (isImage(currentPreview.name) ? "image" : "pdf") : "";

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="font-semibold text-text-primary text-lg flex items-center gap-2">
                    <FolderOpen className="w-5 h-5 text-brand-secondary" /> Archivos del Expediente
                </h3>

                {archivos.length > 0 && (
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={handleDownloadZip}
                        disabled={downloadingZip}
                        className="text-text-primary border-border hover:bg-bg-tertiary"
                    >
                        {downloadingZip ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2 text-brand-primary" />}
                        Descargar Todo (.zip)
                    </Button>
                )}
            </div>

            {/* Drag & Drop Zone */}
            <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-lg p-6 text-center transition-all cursor-pointer ${dragActive
                    ? "border-brand-primary bg-brand-primary/5"
                    : "border-border hover:border-border-hover"
                    }`}
                onClick={() => document.getElementById(`file-input-${casoId}`)?.click()}
            >
                <input
                    id={`file-input-${casoId}`}
                    type="file"
                    multiple
                    className="hidden"
                    onChange={e => handleUpload(e.target.files)}
                />
                {uploading ? (
                    <div className="flex items-center justify-center gap-2 text-brand-primary">
                        <Loader2 className="w-5 h-5 animate-spin" /> Subiendo...
                    </div>
                ) : (
                    <div className="space-y-2">
                        <Upload className="w-8 h-8 text-text-muted mx-auto" />
                        <p className="text-sm text-text-secondary">
                            Arrastrá archivos acá o <span className="text-brand-primary underline">seleccioná</span>
                        </p>
                        <p className="text-xs text-text-muted">PDF, fotos, documentos — máx 50MB por archivo</p>
                    </div>
                )}
            </div>

            {/* Content */}
            {loading ? (
                <div className="flex items-center justify-center py-4">
                    <Loader2 className="w-5 h-5 animate-spin text-text-muted" />
                </div>
            ) : archivos.length === 0 ? (
                <p className="text-xs text-text-muted text-center py-4">Sin archivos adjuntos.</p>
            ) : (
                <div className="space-y-4">
                    {/* Image Thumbnails Grid */}
                    {imageFiles.length > 0 && (
                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                            {imageFiles.map(archivo => (
                                <div
                                    key={archivo.id || archivo.name}
                                    className="group relative aspect-square rounded-lg overflow-hidden border border-border bg-bg-tertiary cursor-pointer hover:border-brand-primary transition-colors"
                                    onClick={() => openLightbox(archivo)}
                                >
                                    <img
                                        src={getPublicUrl(archivo.name)}
                                        alt={cleanName(archivo.name)}
                                        className="w-full h-full object-cover"
                                        loading="lazy"
                                    />
                                    {/* Overlay on hover */}
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                                        <Eye className="w-6 h-6 text-white drop-shadow-md" />
                                    </div>
                                    {/* Delete button */}
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleDelete(archivo.name); }}
                                        className="absolute top-1 right-1 h-6 w-6 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-red-600 transition-all"
                                        title="Eliminar"
                                    >
                                        <Trash2 className="w-3 h-3" />
                                    </button>
                                    {/* Name overlay */}
                                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-1.5 py-1">
                                        <p className="text-[10px] text-white truncate">{cleanName(archivo.name)}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Document Files (non-image) */}
                    {docFiles.length > 0 && (
                        <div className="space-y-1">
                            {docFiles.map(archivo => (
                                <div
                                    key={archivo.id || archivo.name}
                                    className="flex items-center justify-between bg-bg-tertiary border border-border rounded-md px-3 py-2 group hover:border-border-hover transition-colors"
                                >
                                    <div
                                        className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer"
                                        onClick={() => {
                                            if (isPdf(archivo.name)) {
                                                openLightbox(archivo);
                                            } else {
                                                window.open(getPublicUrl(archivo.name), "_blank");
                                            }
                                        }}
                                    >
                                        <FileText className="w-5 h-5 text-text-muted shrink-0" />
                                        <div className="min-w-0">
                                            <p className="text-sm font-medium text-text-primary truncate">{cleanName(archivo.name)}</p>
                                            <p className="text-[10px] text-text-muted">
                                                {formatBytes(archivo.metadata?.size || 0)}
                                                {archivo.created_at && ` · ${format(new Date(archivo.created_at), "dd/MM/yy HH:mm")}`}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        {isPdf(archivo.name) && (
                                            <Button variant="ghost" size="sm" onClick={() => openLightbox(archivo)}
                                                className="h-8 w-8 p-0 text-brand-secondary hover:text-brand-secondary-hover bg-brand-secondary/5" title="Visualizar">
                                                <Eye className="w-4 h-4" />
                                            </Button>
                                        )}
                                        <Button variant="ghost" size="sm" onClick={() => window.open(getPublicUrl(archivo.name), "_blank")}
                                            className="h-8 w-8 p-0 text-text-muted hover:text-text-primary" title="Abrir en pestaña nueva">
                                            <ExternalLink className="w-4 h-4" />
                                        </Button>
                                        <Button variant="ghost" size="sm" onClick={() => handleDelete(archivo.name)}
                                            className="h-8 w-8 p-0 text-text-muted hover:text-danger hover:bg-danger/10" title="Eliminar">
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Lightbox with Navigation */}
            <Dialog open={lightboxIndex !== null} onOpenChange={(open) => !open && setLightboxIndex(null)}>
                <DialogContent className="max-w-5xl bg-bg-primary border-border p-0 gap-0">
                    <DialogHeader className="p-4 pb-2">
                        <DialogTitle className="text-text-primary truncate pr-12 text-sm">
                            {currentPreview ? cleanName(currentPreview.name) : ""}
                            {previewableFiles.length > 1 && (
                                <span className="text-text-muted font-normal ml-2">
                                    ({(lightboxIndex ?? 0) + 1} / {previewableFiles.length})
                                </span>
                            )}
                        </DialogTitle>
                        <DialogDescription className="sr-only">Previsualización de archivo del caso</DialogDescription>
                    </DialogHeader>

                    {/* Image viewer */}
                    {currentPreview && currentType === "image" && (
                        <div className="relative w-full h-[75vh] flex items-center justify-center bg-black/20 select-none">
                            <img
                                src={currentUrl}
                                alt={cleanName(currentPreview.name)}
                                className="max-w-full max-h-full object-contain"
                                draggable={false}
                            />
                        </div>
                    )}

                    {/* PDF viewer */}
                    {currentPreview && currentType === "pdf" && (
                        <div className="relative w-full h-[75vh] bg-bg-secondary/20 p-2">
                            <iframe
                                src={`${currentUrl}#view=FitH`}
                                title={cleanName(currentPreview.name)}
                                className="w-full h-full rounded-sm border-0"
                            />
                        </div>
                    )}

                    {/* Navigation arrows */}
                    {previewableFiles.length > 1 && (
                        <>
                            <button
                                onClick={() => navigateLightbox(-1)}
                                disabled={lightboxIndex === 0}
                                className="absolute left-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 disabled:opacity-20 disabled:cursor-not-allowed transition-all z-10"
                            >
                                <ChevronLeft className="w-6 h-6" />
                            </button>
                            <button
                                onClick={() => navigateLightbox(1)}
                                disabled={lightboxIndex === previewableFiles.length - 1}
                                className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 disabled:opacity-20 disabled:cursor-not-allowed transition-all z-10"
                            >
                                <ChevronRight className="w-6 h-6" />
                            </button>
                        </>
                    )}

                    {/* Bottom bar */}
                    <div className="p-3 flex justify-end gap-2 border-t border-border">
                        <Button
                            variant="outline"
                            size="sm"
                            className="text-text-primary border-border"
                            onClick={() => window.open(currentUrl, "_blank")}
                        >
                            <ExternalLink className="w-4 h-4 mr-2" />
                            Abrir original
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            className="text-text-muted border-border hover:text-danger hover:border-danger"
                            onClick={() => {
                                if (currentPreview) {
                                    handleDelete(currentPreview.name);
                                    setLightboxIndex(null);
                                }
                            }}
                        >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Eliminar
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
