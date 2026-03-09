"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Upload, FileText, Trash2, Download, Loader2, FolderOpen, Eye, ExternalLink, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogTitle, DialogTrigger, DialogHeader, DialogDescription } from "@/components/ui/dialog";
import Image from "next/image";
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
    const [previewFile, setPreviewFile] = useState<{ url: string; type: string; name: string } | null>(null);

    const bucketName = "caso-archivos";
    const folderPath = `${casoId}/`;

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

    const handleDownload = async (fileName: string) => {
        const { data } = supabase.storage.from(bucketName).getPublicUrl(`${folderPath}${fileName}`);
        if (data?.publicUrl) {
            window.open(data.publicUrl, "_blank");
        }
    };

    const handleDownloadZip = async () => {
        if (archivos.length === 0) return;
        setDownloadingZip(true);
        toast.loading("Preparando ZIP...");

        try {
            const zip = new JSZip();

            // Loop through all files and fetch their blobs
            for (const archivo of archivos) {
                // We use getPublicUrl since it's a public bucket. Otherwise download() is needed.
                const { data } = supabase.storage.from(bucketName).getPublicUrl(`${folderPath}${archivo.name}`);

                if (data?.publicUrl) {
                    try {
                        const response = await fetch(data.publicUrl);
                        const blob = await response.blob();
                        // Strip internal Supabase timestamp prefix if needed, or keep original name
                        const cleanName = archivo.name.replace(/^\d+_/, "");
                        zip.file(cleanName, blob);
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

    const handlePreview = async (fileName: string) => {
        const { data } = supabase.storage.from(bucketName).getPublicUrl(`${folderPath}${fileName}`);
        if (data?.publicUrl) {
            const ext = fileName.split('.').pop()?.toLowerCase();
            const isImage = ["jpg", "jpeg", "png", "gif", "webp"].includes(ext || "");
            const isPdf = ext === "pdf";

            if (isImage) {
                setPreviewFile({ url: data.publicUrl, type: "image", name: fileName.replace(/^\d+_/, "") });
            } else if (isPdf) {
                setPreviewFile({ url: data.publicUrl, type: "pdf", name: fileName.replace(/^\d+_/, "") });
            } else {
                // For others like DOCX, force open in new tab
                window.open(data.publicUrl, "_blank");
            }
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

            {/* Lista de archivos */}
            {loading ? (
                <div className="flex items-center justify-center py-4">
                    <Loader2 className="w-5 h-5 animate-spin text-text-muted" />
                </div>
            ) : archivos.length === 0 ? (
                <p className="text-xs text-text-muted text-center py-4">Sin archivos adjuntos.</p>
            ) : (
                <div className="space-y-1">
                    {archivos.map(archivo => (
                        <div
                            key={archivo.id || archivo.name}
                            className="flex items-center justify-between bg-bg-tertiary border border-border rounded-md px-3 py-2 group hover:border-border-hover transition-colors"
                        >
                            <div
                                className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer"
                                onClick={() => handlePreview(archivo.name)}
                            >
                                {["jpg", "jpeg", "png", "gif", "webp"].includes(archivo.name.split('.').pop()?.toLowerCase() || "") ? (
                                    <ImageIcon className="w-5 h-5 text-brand-secondary shrink-0" />
                                ) : (
                                    <FileText className="w-5 h-5 text-text-muted shrink-0" />
                                )}
                                <div className="min-w-0">
                                    <p className="text-sm font-medium text-text-primary truncate">{archivo.name.replace(/^\d+_/, "")}</p>
                                    <p className="text-[10px] text-text-muted">
                                        {formatBytes(archivo.metadata?.size || 0)}
                                        {archivo.created_at && ` · ${format(new Date(archivo.created_at), "dd/MM/yy HH:mm")}`}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button variant="ghost" size="sm" onClick={() => handlePreview(archivo.name)}
                                    className="h-8 w-8 p-0 text-brand-secondary hover:text-brand-secondary-hover bg-brand-secondary/5" title="Visualizar">
                                    <Eye className="w-4 h-4" />
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => handleDownload(archivo.name)}
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

            {/* Lightbox / Preview Dialog */}
            <Dialog open={!!previewFile} onOpenChange={(open) => !open && setPreviewFile(null)}>
                <DialogContent className="max-w-4xl bg-bg-primary border-border p-1">
                    <DialogHeader className="p-4 pb-0">
                        <DialogTitle className="text-text-primary truncate pr-8">{previewFile?.name}</DialogTitle>
                        <DialogDescription className="sr-only">Previsualización de imagen del caso</DialogDescription>
                    </DialogHeader>
                    {previewFile?.type === "image" && (
                        <div className="relative w-full h-[75vh] flex items-center justify-center bg-bg-secondary/50 p-4">
                            {/* Using standard img for zoom capability and auto-sizing within container */}
                            <img
                                src={previewFile.url}
                                alt={previewFile.name}
                                className="max-w-full max-h-full object-contain rounded-md shadow-sm"
                            />
                        </div>
                    )}
                    {previewFile?.type === "pdf" && (
                        <div className="relative w-full h-[75vh] flex items-center justify-center bg-bg-secondary/20 p-2">
                            <iframe
                                src={`${previewFile.url}#view=FitH`}
                                title={previewFile.name}
                                className="w-full h-full rounded-sm border-0"
                            />
                        </div>
                    )}
                    <div className="p-2 flex justify-end">
                        <Button
                            variant="default"
                            className="bg-brand-primary hover:bg-brand-primary-hover text-white flex items-center gap-2 text-sm"
                            onClick={() => window.open(previewFile?.url, "_blank")}
                        >
                            <ExternalLink className="w-4 h-4" />
                            Abrir original
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
