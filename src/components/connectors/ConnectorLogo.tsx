import { Database, FileSpreadsheet, Mail, Calendar, MessageSquare, Cloud } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ConnectorLogoProps {
  type: string;
  className?: string;
  size?: number;
}

/**
 * Connector Logo Component
 * Uses brand-colored icons for each connector type
 */
export const ConnectorLogo = ({ type, className, size = 24 }: ConnectorLogoProps) => {
  const logoConfig: Record<string, { icon: any; bgColor: string; iconColor: string }> = {
    s3: {
      icon: Cloud,
      bgColor: 'bg-orange-100',
      iconColor: 'text-orange-600',
    },
    google_sheets: {
      icon: FileSpreadsheet,
      bgColor: 'bg-green-100',
      iconColor: 'text-green-600',
    },
    gmail: {
      icon: Mail,
      bgColor: 'bg-red-100',
      iconColor: 'text-red-600',
    },
    google_calendar: {
      icon: Calendar,
      bgColor: 'bg-blue-100',
      iconColor: 'text-blue-600',
    },
    slack: {
      icon: MessageSquare,
      bgColor: 'bg-purple-100',
      iconColor: 'text-purple-600',
    },
  };

  const config = logoConfig[type] || { icon: Database, bgColor: 'bg-gray-100', iconColor: 'text-gray-600' };
  const Icon = config.icon;

  return (
    <div className={cn('flex items-center justify-center rounded-lg p-2', config.bgColor, className)}>
      <Icon className={cn(config.iconColor)} size={size} />
    </div>
  );
};
