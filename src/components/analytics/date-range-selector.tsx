"use client";

import React, { useState } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CalendarIcon, ChevronDownIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import type { DateRange, DateRangeType } from '@/lib/types/analytics';
import { DATE_RANGE_PRESETS, getPresetDateRange, validateDateRange } from '@/lib/utils/analytics-utils';

interface DateRangeSelectorProps {
  value: DateRange;
  onChange: (dateRange: DateRange) => void;
  className?: string;
  disabled?: boolean;
}

export function DateRangeSelector({ value, onChange, className, disabled }: DateRangeSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<DateRangeType['value']>('month');
  const [customRange, setCustomRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: value.startDate,
    to: value.endDate,
  });

  // Handle preset selection
  const handlePresetChange = (preset: DateRangeType['value']) => {
    setSelectedPreset(preset);
    
    if (preset !== 'custom') {
      const newRange = getPresetDateRange(preset);
      onChange(newRange);
      setIsOpen(false);
    }
  };

  // Handle custom date selection
  const handleCustomDateSelect = (range: { from?: Date; to?: Date } | undefined) => {
    if (!range) return;
    
    const customRange = {
      from: range.from,
      to: range.to,
    };
    
    setCustomRange(customRange);
    
    if (customRange.from && customRange.to) {
      const validation = validateDateRange(customRange.from, customRange.to);
      if (validation.isValid) {
        onChange({ startDate: customRange.from, endDate: customRange.to });
        setIsOpen(false);
      }
    }
  };

  // Format the display text
  const getDisplayText = () => {
    if (selectedPreset !== 'custom') {
      const preset = DATE_RANGE_PRESETS.find(p => p.value === selectedPreset);
      return preset?.label || 'Select Range';
    }
    
    if (value.startDate && value.endDate) {
      return `${format(value.startDate, 'MMM dd, yyyy')} - ${format(value.endDate, 'MMM dd, yyyy')}`;
    }
    
    return 'Select Custom Range';
  };

  return (
    <div className={cn('flex flex-col space-y-2', className)}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={isOpen}
            className={cn(
              'w-[300px] justify-between',
              !value && 'text-muted-foreground'
            )}
            disabled={disabled}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {getDisplayText()}
            <ChevronDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Card className="border-0 shadow-none">
            <CardHeader className="pb-4">
              <CardTitle className="text-sm font-medium">Select Date Range</CardTitle>
              <CardDescription className="text-xs">
                Choose a preset range or select custom dates
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Preset Selection */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">
                  Quick Select
                </label>
                <Select
                  value={selectedPreset}
                  onValueChange={(value: DateRangeType['value']) => handlePresetChange(value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select preset" />
                  </SelectTrigger>
                  <SelectContent>
                    {DATE_RANGE_PRESETS.map((preset) => (
                      <SelectItem key={preset.value} value={preset.value}>
                        {preset.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Custom Date Picker */}
              {selectedPreset === 'custom' && (
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">
                    Custom Range
                  </label>
                  <Calendar
                    mode="range"
                    defaultMonth={customRange.from}
                    selected={{ from: customRange.from, to: customRange.to }}
                    onSelect={handleCustomDateSelect}
                    numberOfMonths={2}
                    disabled={(date) => {
                      const maxFuture = new Date();
                      maxFuture.setDate(maxFuture.getDate() + 30);
                      return date > maxFuture;
                    }}
                  />
                  {customRange.from && customRange.to && (
                    <div className="text-xs text-muted-foreground p-2 bg-muted rounded">
                      {format(customRange.from, 'MMM dd, yyyy')} -{' '}
                      {format(customRange.to, 'MMM dd, yyyy')}
                    </div>
                  )}
                </div>
              )}

              {/* Apply Button for Custom Range */}
              {selectedPreset === 'custom' && customRange.from && customRange.to && (
                <Button
                  onClick={() => {
                    const validation = validateDateRange(customRange.from!, customRange.to!);
                    if (validation.isValid) {
                      onChange({ startDate: customRange.from!, endDate: customRange.to! });
                      setIsOpen(false);
                    }
                  }}
                  className="w-full"
                  size="sm"
                >
                  Apply Custom Range
                </Button>
              )}
            </CardContent>
          </Card>
        </PopoverContent>
      </Popover>
    </div>
  );
}

// Hook for managing date range state
export function useDateRange(initialRange?: DateRange) {
  const [dateRange, setDateRange] = useState<DateRange>(
    initialRange || getPresetDateRange('month')
  );

  const updateDateRange = (newRange: DateRange) => {
    const validation = validateDateRange(newRange.startDate, newRange.endDate);
    if (validation.isValid) {
      setDateRange(newRange);
      return true;
    }
    return false;
  };

  return {
    dateRange,
    setDateRange: updateDateRange,
    validation: validateDateRange(dateRange.startDate, dateRange.endDate),
  };
}
