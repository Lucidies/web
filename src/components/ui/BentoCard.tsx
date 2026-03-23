import { cn } from '@/lib/utils';

interface BentoCardProps {
  className?: string;
  children: React.ReactNode;
  colSpan?: 1 | 2 | 3 | 4;
  rowSpan?: 1 | 2 | 3;
  onClick?: () => void;
  hover?: boolean;
  style?: React.CSSProperties;
  gridArea?: string;
}

export function BentoCard({
  className,
  children,
  colSpan = 1,
  rowSpan = 1,
  onClick,
  hover = false,
  style,
  gridArea,
}: BentoCardProps) {
  const colSpanClass = {
    1: '',
    2: 'col-span-2',
    3: 'col-span-3',
    4: 'col-span-4',
  }[colSpan];

  const rowSpanClass = {
    1: '',
    2: 'row-span-2',
    3: 'row-span-3',
  }[rowSpan];

  const gridStyle = gridArea ? { ...style, gridArea } : style;

  return (
    <div
      className={cn(
        'bento-card',
        colSpanClass,
        rowSpanClass,
        hover && 'bento-card-hover',
        className
      )}
      onClick={onClick}
      style={gridStyle}
    >
      {children}
    </div>
  );
}
