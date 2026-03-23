'use client';

import { Settings } from 'lucide-react';
import { BentoCard } from '@/components/ui/BentoCard';

interface GearButtonProps {
  onClick: () => void;
}

export function GearButton({ onClick }: GearButtonProps) {
  return (
    <BentoCard
      className="gear-card"
      hover
      onClick={onClick}
    >
      <Settings className="w-6 h-6 opacity-50 gear-icon" />
    </BentoCard>
  );
}
