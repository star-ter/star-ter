'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { Image as ImageIcon, X } from 'lucide-react';
import { updateProfile } from '@/services/user/user.api';

type ProfileImageCropModalProps = {
  isOpen: boolean;
  imageUrl: string | null;
  fileName: string;
  onClose: () => void;
  onComplete: (key: string) => void;
  onReselect?: () => void;
};

export function ProfileImageCropModal({
  isOpen,
  imageUrl,
  fileName,
  onClose,
  onComplete,
}: ProfileImageCropModalProps) {
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [cropOffset, setCropOffset] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const dragOffsetRef = useRef({ x: 0, y: 0 });

  const CROPPER_SIZE = 224;
  const VIEW_SIZE = CROPPER_SIZE + 32;
  const OUTPUT_SIZE = 256;
  const MIN_ZOOM = 1;
  const MAX_ZOOM = 3;

  useEffect(() => {
    if (!isOpen) return;
    setIsUploadingImage(false);
    setUploadError(null);
    setCropOffset({ x: 0, y: 0 });
    setZoom(1);
    setImageSize({ width: 0, height: 0 });
  }, [isOpen]);

  const clampCropOffset = (
    nextOffset: { x: number; y: number },
    nextZoom = zoom,
    nextImageSize = imageSize,
  ) => {
    if (nextImageSize.width === 0 || nextImageSize.height === 0) {
      return nextOffset;
    }

    const baseScale = Math.max(
      VIEW_SIZE / nextImageSize.width,
      VIEW_SIZE / nextImageSize.height,
    );
    const scaledWidth = nextImageSize.width * baseScale * nextZoom;
    const scaledHeight = nextImageSize.height * baseScale * nextZoom;
    const maxOffsetX = Math.max(0, (scaledWidth - VIEW_SIZE) / 2);
    const maxOffsetY = Math.max(0, (scaledHeight - VIEW_SIZE) / 2);

    return {
      x: Math.min(maxOffsetX, Math.max(-maxOffsetX, nextOffset.x)),
      y: Math.min(maxOffsetY, Math.max(-maxOffsetY, nextOffset.y)),
    };
  };

  const cropImageToCircle = (
    sourceUrl: string,
    config: { offset: { x: number; y: number }; zoom: number },
  ) =>
    new Promise<Blob>((resolve, reject) => {
      const image = new Image();
      image.onload = () => {
        const naturalWidth = image.naturalWidth || image.width;
        const naturalHeight = image.naturalHeight || image.height;
        const baseScale = Math.max(
          VIEW_SIZE / naturalWidth,
          VIEW_SIZE / naturalHeight,
        );
        const scale = baseScale * config.zoom;
        const renderedWidth = naturalWidth * scale;
        const renderedHeight = naturalHeight * scale;
        const imageX = VIEW_SIZE / 2 + config.offset.x - renderedWidth / 2;
        const imageY = VIEW_SIZE / 2 + config.offset.y - renderedHeight / 2;
        const cropX = VIEW_SIZE / 2 - CROPPER_SIZE / 2;
        const cropY = VIEW_SIZE / 2 - CROPPER_SIZE / 2;
        const ratio = OUTPUT_SIZE / CROPPER_SIZE;
        const drawX = (imageX - cropX) * ratio;
        const drawY = (imageY - cropY) * ratio;
        const canvas = document.createElement('canvas');
        canvas.width = OUTPUT_SIZE;
        canvas.height = OUTPUT_SIZE;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('이미지 처리에 실패했습니다.'));
          return;
        }
        ctx.clearRect(0, 0, OUTPUT_SIZE, OUTPUT_SIZE);
        ctx.save();
        ctx.beginPath();
        ctx.arc(
          OUTPUT_SIZE / 2,
          OUTPUT_SIZE / 2,
          OUTPUT_SIZE / 2,
          0,
          Math.PI * 2,
        );
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(
          image,
          drawX,
          drawY,
          renderedWidth * ratio,
          renderedHeight * ratio,
        );
        ctx.restore();
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('이미지 처리에 실패했습니다.'));
              return;
            }
            resolve(blob);
          },
          'image/png',
          0.92,
        );
      };
      image.onerror = () => reject(new Error('이미지 로드에 실패했습니다.'));
      image.src = sourceUrl;
    });

  const handleConfirmCrop = async () => {
    if (!imageUrl) return;
    setIsUploadingImage(true);
    setUploadError(null);
    try {
      const blob = await cropImageToCircle(imageUrl, {
        offset: cropOffset,
        zoom,
      });
      const croppedFile = new File([blob], fileName || 'profile.png', {
        type: blob.type,
      });
      const response = await updateProfile({ file: croppedFile });
      if (!response.profile_image_key) {
        throw new Error('프로필 이미지 업데이트에 실패했습니다.');
      }
      onComplete(response.profile_image_key);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : '이미지 업로드에 실패했습니다.';
      setUploadError(message);
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    setIsDragging(true);
    dragStartRef.current = { x: event.clientX, y: event.clientY };
    dragOffsetRef.current = { ...cropOffset };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    const deltaX = event.clientX - dragStartRef.current.x;
    const deltaY = event.clientY - dragStartRef.current.y;
    const nextOffset = {
      x: dragOffsetRef.current.x + deltaX,
      y: dragOffsetRef.current.y + deltaY,
    };
    setCropOffset(clampCropOffset(nextOffset));
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    setIsDragging(false);
    event.currentTarget.releasePointerCapture(event.pointerId);
  };

  const hasImageSize = imageSize.width > 0 && imageSize.height > 0;
  const baseScale = hasImageSize
    ? Math.max(VIEW_SIZE / imageSize.width, VIEW_SIZE / imageSize.height)
    : 1;
  const renderScale = hasImageSize ? baseScale * zoom : 1;

  if (!isOpen || !imageUrl) return null;

  return (
    <motion.div
      key="profile-crop-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30"
    >
      <motion.div
        key="profile-crop"
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 8 }}
        className="w-[92vw] max-w-sm bg-white rounded-[28px] shadow-2xl border border-gray-100 overflow-hidden"
      >
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
          <p className="text-h5 font-bold text-slate-900">이미지 편집하기</p>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600"
            aria-label="닫기"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="p-6">
          <div
            className="relative mx-auto overflow-hidden rounded-2xl bg-slate-100 ring-1 ring-slate-200"
            style={{
              width: VIEW_SIZE,
              height: VIEW_SIZE,
              touchAction: 'none',
              cursor: isDragging ? 'grabbing' : 'grab',
            }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
          >
            <div
              className="absolute left-1/2 top-1/2 z-20"
              style={{
                width: CROPPER_SIZE,
                height: CROPPER_SIZE,
                borderRadius: '999px',
                boxShadow: '0 0 0 3px rgba(255,255,255,0.92)',
                transform: `translate(-50%, -50%)`,
                pointerEvents: 'none',
              }}
            />
            <div
              className="absolute left-1/2 top-1/2"
              style={{
                transform: `translate(-50%, -50%) translate(${cropOffset.x}px, ${cropOffset.y}px)`,
              }}
            >
              <div
                style={{
                  transform: `scale(${renderScale})`,
                  transformOrigin: 'center',
                }}
              >
                <img
                  src={imageUrl}
                  alt="선택한 이미지 미리보기"
                  onLoad={(event) => {
                    const target = event.currentTarget;
                    const naturalWidth = target.naturalWidth || target.width;
                    const naturalHeight = target.naturalHeight || target.height;
                    setImageSize({
                      width: naturalWidth,
                      height: naturalHeight,
                    });
                    setCropOffset((current) =>
                      clampCropOffset(current, zoom, {
                        width: naturalWidth,
                        height: naturalHeight,
                      }),
                    );
                  }}
                  className="select-none block max-w-none max-h-none"
                  style={{
                    width: `${imageSize.width || VIEW_SIZE}px`,
                    height: `${imageSize.height || VIEW_SIZE}px`,
                  }}
                  draggable={false}
                />
              </div>
            </div>
          </div>
          <div className="mt-5 flex items-center gap-3 text-slate-400">
            <ImageIcon className="w-4 h-4" />
            <input
              type="range"
              min={MIN_ZOOM}
              max={MAX_ZOOM}
              step="0.01"
              value={zoom}
              onChange={(event) => {
                const nextZoom = Number(event.target.value);
                setZoom(nextZoom);
                setCropOffset((current) => clampCropOffset(current, nextZoom));
              }}
              className="flex-1 accent-indigo-500"
            />
            <ImageIcon className="w-4 h-4" />
          </div>
          <div className="mt-5 flex items-center justify-between">
            <div className="flex items-center gap-3 ml-auto">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2 rounded-2xl border border-slate-200 text-caption font-bold text-slate-600 hover:bg-slate-50"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleConfirmCrop}
                disabled={isUploadingImage}
                className="px-5 py-2 rounded-2xl bg-indigo-500 text-white text-caption font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-600 transition-colors disabled:opacity-60"
              >
                {isUploadingImage ? '업로드 중...' : '적용하기'}
              </button>
            </div>
          </div>
          {uploadError && (
            <p className="mt-3 text-caption text-red-500">{uploadError}</p>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
