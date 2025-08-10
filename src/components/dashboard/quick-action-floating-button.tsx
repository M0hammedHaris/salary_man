"use client";

import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  Plus, 
  TrendingUp, 
  TrendingDown, 
  Receipt,
  RefreshCw,
  Camera,
  DollarSign
} from 'lucide-react';
import { useState } from 'react';

interface QuickActionFloatingButtonProps {
  className?: string;
}

export function QuickActionFloatingButton({ className = "" }: QuickActionFloatingButtonProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const quickActions = [
    {
      id: 'add-income',
      icon: <TrendingUp className="h-4 w-4" />,
      label: 'Add Income',
      color: 'text-green-600 hover:text-green-700',
      action: () => console.log('Add Income'),
    },
    {
      id: 'add-expense',
      icon: <TrendingDown className="h-4 w-4" />,
      label: 'Add Expense',
      color: 'text-red-600 hover:text-red-700',
      action: () => console.log('Add Expense'),
    },
    {
      id: 'transfer',
      icon: <RefreshCw className="h-4 w-4" />,
      label: 'Transfer Money',
      color: 'text-blue-600 hover:text-blue-700',
      action: () => console.log('Transfer Money'),
    },
    {
      id: 'scan-receipt',
      icon: <Camera className="h-4 w-4" />,
      label: 'Scan Receipt',
      color: 'text-purple-600 hover:text-purple-700',
      action: () => console.log('Scan Receipt'),
    },
  ];

  const getMostFrequentActions = () => {
    // In a real app, this would be based on user's transaction history
    // For now, return the first 3 most common actions
    return quickActions.slice(0, 3);
  };

  const frequentActions = getMostFrequentActions();

  return (
    <div className={`fixed bottom-6 right-6 z-50 ${className}`}>
      {/* Expanded Action Buttons */}
      {isExpanded && (
        <div className="absolute bottom-16 right-0 space-y-2 animate-in slide-in-from-bottom-2 duration-200">
          {frequentActions.map((action, index) => (
            <Tooltip key={action.id}>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="secondary"
                  className={`w-12 h-12 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 ${action.color} animate-in slide-in-from-bottom-1`}
                  style={{ animationDelay: `${index * 50}ms` }}
                  onClick={() => {
                    action.action();
                    setIsExpanded(false);
                  }}
                >
                  {action.icon}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left">
                <p>{action.label}</p>
              </TooltipContent>
            </Tooltip>
          ))}

          {/* All Actions Button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                variant="outline"
                className="w-12 h-12 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 animate-in slide-in-from-bottom-1"
                style={{ animationDelay: `${frequentActions.length * 50}ms` }}
                onClick={() => {
                  console.log('Show All Actions');
                  setIsExpanded(false);
                }}
              >
                <Receipt className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">
              <p>All Actions</p>
            </TooltipContent>
          </Tooltip>
        </div>
      )}

      {/* Main FAB */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            size="lg"
            className={`w-14 h-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 ${
              isExpanded ? 'rotate-45' : 'rotate-0'
            }`}
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <Plus className="h-6 w-6" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="left">
          <p>{isExpanded ? 'Close Actions' : 'Quick Actions'}</p>
        </TooltipContent>
      </Tooltip>

      {/* Context-sensitive quick action hint */}
      {!isExpanded && (
        <div className="absolute -top-12 right-0 bg-popover text-popover-foreground text-xs px-2 py-1 rounded shadow-md animate-pulse">
          <div className="flex items-center space-x-1">
            <DollarSign className="h-3 w-3" />
            <span>Add Transaction</span>
          </div>
        </div>
      )}

      {/* Backdrop overlay when expanded */}
      {isExpanded && (
        <div 
          className="fixed inset-0 bg-black/20 -z-10 animate-in fade-in-0 duration-200"
          onClick={() => setIsExpanded(false)}
        />
      )}
    </div>
  );
}
