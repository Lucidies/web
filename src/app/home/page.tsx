'use client';

import { useState } from 'react';
import { ProfileCard } from '@/components/bento/ProfileCard';
import { TimeCard } from '@/components/bento/TimeCard';
import { WeatherCard } from '@/components/bento/WeatherCard';
import { ActivityCard } from '@/components/bento/ActivityCard';
import { RecentStreams } from '@/components/bento/RecentStreams';
import { SteamActivity } from '@/components/bento/SteamActivity';
import { GearButton } from '@/components/bento/GearButton';
import { GearModal } from '@/components/modals/GearModal';

export default function HomePage() {
  const [isGearModalOpen, setIsGearModalOpen] = useState(false);

  return (
    <>
      <main className="bento-container">
        {/* Row 1: Profile Card (full width - 4 cols) */}
        <ProfileCard />

        {/* Row 2: Time (2 cols) + Weather (2 cols) */}
        <TimeCard />
        <WeatherCard />

        {/* Row 3: Activity/Now Playing (3 cols) + Gear (1 col) */}
        <ActivityCard />
        <GearButton onClick={() => setIsGearModalOpen(true)} />

        {/* Row 4: Recent Streams (2 cols) + Steam Activity (2 cols) */}
        <RecentStreams />
        <SteamActivity />
      </main>

      <GearModal isOpen={isGearModalOpen} onClose={() => setIsGearModalOpen(false)} />
    </>
  );
}
