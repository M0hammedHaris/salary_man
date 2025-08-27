'use client';

import { CheckCheck, Mail, Archive, Trash2, X, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface BulkActionToolbarProps {
  selectedCount: number;
  onMarkAsRead: () => void;
  onMarkAsUnread: () => void;
  onArchive: () => void;
  onDelete: () => void;
  onSelectAll: () => void;
  onClearSelection: () => void;
}

export function BulkActionToolbar({
  selectedCount,
  onMarkAsRead,
  onMarkAsUnread,
  onArchive,
  onDelete,
  onSelectAll,
  onClearSelection,
}: BulkActionToolbarProps) {
  return (
    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border">
      <div className="flex items-center gap-2">
        <Badge variant="secondary" className="font-medium">
          {selectedCount} selected
        </Badge>
        <Separator orientation="vertical" className="h-4" />
        <Button variant="ghost" size="sm" onClick={onSelectAll}>
          <CheckCircle className="h-4 w-4 mr-1" />
          Select All
        </Button>
        <Button variant="ghost" size="sm" onClick={onClearSelection}>
          <X className="h-4 w-4 mr-1" />
          Clear
        </Button>
      </div>

      <div className="flex items-center gap-1">
        <Button variant="outline" size="sm" onClick={onMarkAsRead}>
          <CheckCheck className="h-4 w-4 mr-1" />
          Mark Read
        </Button>
        <Button variant="outline" size="sm" onClick={onMarkAsUnread}>
          <Mail className="h-4 w-4 mr-1" />
          Mark Unread
        </Button>
        <Button variant="outline" size="sm" onClick={onArchive}>
          <Archive className="h-4 w-4 mr-1" />
          Archive
        </Button>
        <Button variant="destructive" size="sm" onClick={onDelete}>
          <Trash2 className="h-4 w-4 mr-1" />
          Delete
        </Button>
      </div>
    </div>
  );
}
