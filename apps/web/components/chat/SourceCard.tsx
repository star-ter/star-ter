'use client';

import { Database } from 'lucide-react';
import type { Source } from './types';

interface SourceCardProps {
  source: Source;
}

export function SourceCard({ source }: SourceCardProps) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-background rounded-xl border border-border min-w-[180px]">
      <div className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center shrink-0">
        <Database className="w-4 h-4 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-caption font-medium text-foreground truncate">
          {source.displayName}
        </p>
        <p className="text-tiny text-muted-foreground truncate">
          {source.source}
        </p>
      </div>
    </div>
  );
}
