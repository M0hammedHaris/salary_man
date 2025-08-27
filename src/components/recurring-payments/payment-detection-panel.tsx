"use client";

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import {
  Brain,
  TrendingUp,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Eye,
} from 'lucide-react';
import type { RecurringPaymentDetection } from '../../lib/types/bill-types';

interface PaymentDetectionPanelProps {
  detections: RecurringPaymentDetection[];
  isLoading?: boolean;
  onRunDetection: () => void;
  onConfirmPattern: (detectionId: string) => void;
  onDismissPattern: (detectionId: string) => void;
}

export function PaymentDetectionPanel({
  detections,
  isLoading = false,
  onRunDetection,
  onConfirmPattern,
  onDismissPattern,
}: PaymentDetectionPanelProps) {
  const newPatterns = detections?.filter(d => d.isNewPattern) || [];
  const existingPatterns = detections?.filter(d => !d.isNewPattern) || [];

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600 bg-green-100';
    if (confidence >= 0.6) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getConfidenceLabel = (confidence: number) => {
    if (confidence >= 0.8) return 'High';
    if (confidence >= 0.6) return 'Medium';
    return 'Low';
  };

  const getRiskColor = (risk: number) => {
    if (risk >= 0.7) return 'text-red-600';
    if (risk >= 0.4) return 'text-yellow-600';
    return 'text-green-600';
  };

  const formatCurrency = (amount: number | string) => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return `₹${numAmount.toLocaleString()}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Brain className="h-6 w-6 text-primary" />
          <div>
            <h2 className="text-xl font-semibold">Pattern Detection</h2>
            <p className="text-sm text-muted-foreground">
              AI-powered analysis of your transaction patterns
            </p>
          </div>
        </div>
        <Button onClick={onRunDetection} disabled={isLoading}>
          {isLoading ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4 mr-2" />
              Run Detection
            </>
          )}
        </Button>
      </div>

      {/* Detection Results */}
      {detections && detections.length > 0 ? (
        <div className="space-y-6">
          {/* New Patterns */}
          {newPatterns.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <AlertTriangle className="h-5 w-5 text-blue-600" />
                  <span>New Patterns Detected ({newPatterns.length})</span>
                </CardTitle>
                <CardDescription>
                  These patterns were automatically detected from your transaction history
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {newPatterns.map((detection, index) => (
                  <div key={index} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="font-medium">{detection.suggestedName}</h3>
                          <Badge className={getConfidenceColor(detection.pattern.confidence)}>
                            {getConfidenceLabel(detection.pattern.confidence)} Confidence
                          </Badge>
                          <Badge variant="outline" className={getRiskColor(detection.riskScore)}>
                            Risk: {Math.round(detection.riskScore * 100)}%
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Amount</p>
                            <p className="font-medium">
                              {formatCurrency(detection.pattern.averageAmount.toString())}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Frequency</p>
                            <p className="font-medium capitalize">{detection.pattern.frequency}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Last Occurrence</p>
                            <p className="font-medium">
                              {new Date(detection.pattern.lastOccurrence).toLocaleDateString()}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Next Expected</p>
                            <p className="font-medium">
                              {new Date(detection.pattern.nextExpectedDate).toLocaleDateString()}
                            </p>
                          </div>
                        </div>

                        <div className="mt-3 text-sm">
                          <p className="text-muted-foreground">Pattern:</p>
                          <p className="font-mono text-xs bg-muted p-2 rounded">
                            {detection.pattern.merchantPattern}
                          </p>
                        </div>

                        <div className="mt-3 text-sm">
                          <p className="text-muted-foreground">Category:</p>
                          <p className="font-medium">{detection.suggestedCategory}</p>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between">
                      <div className="text-sm text-muted-foreground">
                        Based on {detection.pattern.amounts.length} transactions
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onDismissPattern(detection.pattern.id)}
                        >
                          Dismiss
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => onConfirmPattern(detection.pattern.id)}
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Create Payment
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Existing Patterns */}
          {existingPatterns.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span>Confirmed Patterns ({existingPatterns.length})</span>
                </CardTitle>
                <CardDescription>
                  These patterns match existing recurring payments
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {existingPatterns.map((detection, index) => (
                  <div key={index} className="border rounded-lg p-4 bg-green-50 border-green-200">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="font-medium">{detection.suggestedName}</h3>
                          <Badge className="bg-green-100 text-green-800">
                            Matched
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Amount</p>
                            <p className="font-medium">
                              {formatCurrency(detection.pattern.averageAmount.toString())}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Frequency</p>
                            <p className="font-medium capitalize">{detection.pattern.frequency}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Status</p>
                            <p className="font-medium text-green-600">Tracking Active</p>
                          </div>
                        </div>
                      </div>
                      <Button size="sm" variant="ghost">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      ) : (
        <Card>
          <CardContent className="py-8">
            <div className="text-center">
              <Brain className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No Patterns Detected</h3>
              <p className="text-muted-foreground mb-4">
                {isLoading
                  ? "Analyzing your transaction history..."
                  : "Run pattern detection to identify recurring payment opportunities"}
              </p>
              {!isLoading && (
                <Button onClick={onRunDetection}>
                  <Brain className="h-4 w-4 mr-2" />
                  Start Pattern Analysis
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Detection Info */}
      <Alert>
        <TrendingUp className="h-4 w-4" />
        <AlertTitle>How Pattern Detection Works</AlertTitle>
        <AlertDescription>
          <p>
            Our AI analyzes your transaction history to identify recurring payment patterns based on:
          </p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>Merchant name similarity and transaction amounts</li>
            <li>Payment frequency and timing consistency</li>
            <li>Account and category correlation</li>
          </ul>
          <p className="mt-2">
            High-confidence patterns can be automatically converted to recurring payments.
          </p>
        </AlertDescription>
      </Alert>
    </div>
  );
}
