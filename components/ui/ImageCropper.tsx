
"use client";

import React, { useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import { MotionIcon } from "motion-icons-react";
import { getCroppedImg } from "../../lib/cropImage"; 

interface ImageCropperProps {
    imageSrc: string;
    onCropComplete: (file: Blob) => void;
    onCancel: () => void;
    aspectRatio?: number;
}

export function ImageCropper({ imageSrc, onCropComplete, onCancel, aspectRatio = 16 / 9 }: ImageCropperProps) {
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [rotation, setRotation] = useState(0);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

    const onCropChange = (crop: { x: number; y: number }) => setCrop(crop);
    const onZoomChange = (zoom: number) => setZoom(zoom);

    const onCropCompleteInternal = useCallback((_croppedArea: any, croppedAreaPixels: any) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    const handleSave = async () => {
        try {
            const croppedImageBlob = await getCroppedImg(imageSrc, croppedAreaPixels, rotation);
            if (croppedImageBlob) {
                onCropComplete(croppedImageBlob);
            }
        } catch (e) {
            console.error("Crop failed", e);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-zinc-900 border border-white/10 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
                
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-white/5">
                    <h3 className="text-lg font-semibold text-white">Crop Cover Image</h3>
                    <button onClick={onCancel} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                        <MotionIcon name="X" className="w-5 h-5 text-zinc-400" />
                    </button>
                </div>

                {/* Cropper Area */}
                <div className="relative w-full h-[400px] bg-black">
                    <Cropper
                        image={imageSrc}
                        crop={crop}
                        zoom={zoom}
                        rotation={rotation}
                        aspect={aspectRatio}
                        onCropChange={onCropChange}
                        onCropComplete={onCropCompleteInternal}
                        onZoomChange={onZoomChange}
                        onRotationChange={setRotation}
                        objectFit="horizontal-cover"
                    />
                </div>

                {/* Controls */}
                <div className="p-6 space-y-6">
                    
                    <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs font-medium text-zinc-400">
                            <span className="flex items-center gap-1"><MotionIcon name="ZoomOut" className="w-3 h-3"/> Zoom</span>
                            <span>{Math.round(zoom * 100)}%</span>
                        </div>
                        <input 
                            type="range" 
                            min={1} 
                            max={3} 
                            step={0.1}
                            value={zoom}
                            onChange={(e) => setZoom(Number(e.target.value))}
                            className="w-full h-1.5 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
                        />
                    </div>

                    <div className="space-y-2">
                         <div className="flex items-center justify-between text-xs font-medium text-zinc-400">
                             <span className="flex items-center gap-1"><MotionIcon name="RotateCw" className="w-3 h-3"/> Rotate</span>
                            <span>{rotation}°</span>
                        </div>
                         <input 
                            type="range" 
                            min={0} 
                            max={360} 
                            step={1}
                            value={rotation}
                            onChange={(e) => setRotation(Number(e.target.value))}
                            className="w-full h-1.5 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-zinc-500"
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-3 pt-2">
                        <button onClick={onCancel} className="px-4 py-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 text-sm font-medium transition-colors">
                            Cancel
                        </button>
                        <button onClick={handleSave} className="flex items-center gap-2 px-6 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-semibold transition-all shadow-lg hover:shadow-emerald-500/20">
                            <MotionIcon name="Check" className="w-4 h-4" />
                            Apply Crop
                        </button>
                    </div>

                </div>
            </div>
        </div>
    );
}
