'use client';

import { useEffect } from 'react';
import { X, Mouse, Square, Keyboard } from 'lucide-react';

interface GearModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GearModal({ isOpen, onClose }: GearModalProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      <div className="gear-overlay open" onClick={onClose} />
      <div className="gear-modal open">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">My gear</h2>
          <button onClick={onClose} className="opacity-50 hover:opacity-100">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="gear-list">
          <div className="gear-row">
            <Mouse className="w-5 h-5 opacity-50" />
            <div>
              <div className="font-medium">op18k</div>
              <div className="text-xs text-gray-500">Mouse</div>
            </div>
          </div>
          <div className="gear-row">
            <Square className="w-5 h-5 opacity-50" />
            <div>
              <div className="font-medium">Artisan Zero Soft</div>
              <div className="text-xs text-gray-500">Mousepad</div>
            </div>
          </div>
          <div className="gear-row">
            <Keyboard className="w-5 h-5 opacity-50" />
            <div>
              <div className="font-medium">Nano 68 pro</div>
              <div className="text-xs text-gray-500">Keyboard</div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
