'use client';

import { useState, useEffect } from 'react';
import { BentoCard } from '@/components/ui/BentoCard';
import { Clock } from 'lucide-react';

export function TimeCard() {
  const [time, setTime] = useState('00:00');
  const [seconds, setSeconds] = useState('00');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const parts = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Europe/Stockholm',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      }).formatToParts(now);
      const get = (type: string) => parts.find(p => p.type === type)?.value ?? '00';
      setTime(`${get('hour')}:${get('minute')}`);
      setSeconds(get('second'));
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <BentoCard colSpan={2} className="time-card">
      <span className="text-label">Local Time</span>
      <div className="time-card-content">
        <div className="time-display">
          {time}
          <span className="time-seconds">:{seconds}</span>
        </div>
        <div className="time-location">
          <Clock className="w-3 h-3 opacity-50" />
          <span>Stockholm</span>
        </div>
      </div>
    </BentoCard>
  );
}