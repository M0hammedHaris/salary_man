'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, Calendar, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface NotificationHistoryProps {
  userId: string;
}

interface HistoryItem {
  id: string;
  title: string;
  message: string;
  channel: string;
  status: string;
  sentAt: string;
  deliveredAt?: string;
  readAt?: string;
  notificationType: string;
}

export function NotificationHistory({ userId }: NotificationHistoryProps) {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [channelFilter, setChannelFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const loadHistory = useCallback(async () => {
    try {
      setLoading(true);
      
      const params = new URLSearchParams({
        search: searchTerm,
        channel: channelFilter === 'all' ? '' : channelFilter,
        status: statusFilter === 'all' ? '' : statusFilter,
        limit: '50'
      });

      const response = await fetch(`/api/notifications/history?${params}`);
      if (response.ok) {
        const data = await response.json();
        setHistory(data.history || []);
      }
    } catch (error) {
      console.error('Failed to load notification history:', error);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, channelFilter, statusFilter]);

  useEffect(() => {
    if (userId) {
      loadHistory();
    }
  }, [userId, searchTerm, channelFilter, statusFilter, loadHistory]);

  const exportHistory = async () => {
    try {
      const params = new URLSearchParams({
        search: searchTerm,
        channel: channelFilter === 'all' ? '' : channelFilter,
        status: statusFilter === 'all' ? '' : statusFilter,
        format: 'csv'
      });

      const response = await fetch(`/api/notifications/history/export?${params}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `notification-history-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Failed to export history:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered': return 'default';
      case 'read': return 'secondary';
      case 'failed': return 'destructive';
      case 'sent': return 'outline';
      default: return 'outline';
    }
  };

  const getChannelColor = (channel: string) => {
    switch (channel) {
      case 'email': return 'blue';
      case 'push': return 'green';
      case 'inApp': return 'purple';
      case 'sms': return 'orange';
      default: return 'gray';
    }
  };

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString();
  };

  return (
    <div className="space-y-4">
      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search notification history..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        <Select value={channelFilter} onValueChange={setChannelFilter}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Channel" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Channels</SelectItem>
            <SelectItem value="email">Email</SelectItem>
            <SelectItem value="push">Push</SelectItem>
            <SelectItem value="inApp">In-App</SelectItem>
            <SelectItem value="sms">SMS</SelectItem>
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="sent">Sent</SelectItem>
            <SelectItem value="delivered">Delivered</SelectItem>
            <SelectItem value="read">Read</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
          </SelectContent>
        </Select>

        <Button variant="outline" onClick={exportHistory}>
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </div>

      {/* History List */}
      <ScrollArea className="h-[500px] w-full border rounded-lg">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        ) : history.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
            <Calendar className="h-12 w-12 mb-2 opacity-50" />
            <p>No notification history found</p>
          </div>
        ) : (
          <div className="p-4 space-y-2">
            {history.map((item) => (
              <Card key={item.id} className="hover:bg-muted/50 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant="outline" 
                            className={`border-${getChannelColor(item.channel)}-500 text-${getChannelColor(item.channel)}-700`}
                          >
                            {item.channel}
                          </Badge>
                          <Badge variant={getStatusColor(item.status)}>
                            {item.status}
                          </Badge>
                          <Badge variant="secondary">
                            {item.notificationType.replace(/_/g, ' ')}
                          </Badge>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {formatRelativeTime(item.sentAt)}
                        </span>
                      </div>
                      
                      <h4 className="font-medium leading-none mb-1">
                        {item.title}
                      </h4>
                      <p className="text-sm text-muted-foreground mb-2">
                        {item.message}
                      </p>
                      
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>Sent: {new Date(item.sentAt).toLocaleString()}</span>
                        {item.deliveredAt && (
                          <span>Delivered: {new Date(item.deliveredAt).toLocaleString()}</span>
                        )}
                        {item.readAt && (
                          <span>Read: {new Date(item.readAt).toLocaleString()}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
