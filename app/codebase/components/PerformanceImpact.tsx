'use client';

import React from 'react';
import { BarChart, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface PerformanceMetric {
  name: string;
  before: number;
  after: number;
  unit: string;
}

export default function PerformanceImpact() {
  const performanceMetrics: PerformanceMetric[] = [
    {
      name: 'Page Load Time',
      before: 1.2,
      after: 1.35,
      unit: 's'
    },
    {
      name: 'First Contentful Paint',
      before: 0.8,
      after: 0.85,
      unit: 's'
    },
    {
      name: 'Time to Interactive',
      before: 1.5,
      after: 1.6,
      unit: 's'
    },
    {
      name: 'Bundle Size',
      before: 245,
      after: 258,
      unit: 'KB'
    },
    {
      name: 'Memory Usage',
      before: 42,
      after: 45,
      unit: 'MB'
    }
  ];

  const getPercentChange = (before: number, after: number) => {
    const change = ((after - before) / before) * 100;
    return change.toFixed(1);
  };

  const getChangeIcon = (before: number, after: number) => {
    const percentChange = parseFloat(getPercentChange(before, after));
    
    if (Math.abs(percentChange) < 1) {
      return <Minus className="w-4 h-4 text-gray-500" />;
    }
    
    return percentChange > 0 
      ? <TrendingUp className="w-4 h-4 text-red-500" /> 
      : <TrendingDown className="w-4 h-4 text-green-500" />;
  };

  const getChangeColor = (before: number, after: number) => {
    const percentChange = parseFloat(getPercentChange(before, after));
    
    if (Math.abs(percentChange) < 1) {
      return 'text-gray-500';
    }
    
    return percentChange > 0 ? 'text-red-500' : 'text-green-500';
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <BarChart className="text-blue-500 w-5 h-5" />
        <h3 className="font-semibold">Performance Impact Estimation</h3>
      </div>
      
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Estimated performance changes based on similar code patterns and historical data.
        </p>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 font-medium">Metric</th>
                <th className="text-right py-2 font-medium">Before</th>
                <th className="text-right py-2 font-medium">After</th>
                <th className="text-right py-2 font-medium">Change</th>
              </tr>
            </thead>
            <tbody>
              {performanceMetrics.map((metric, index) => (
                <tr key={index} className="border-b border-border/50">
                  <td className="py-2">{metric.name}</td>
                  <td className="text-right py-2">{metric.before} {metric.unit}</td>
                  <td className="text-right py-2">{metric.after} {metric.unit}</td>
                  <td className="text-right py-2 flex items-center justify-end gap-1">
                    {getChangeIcon(metric.before, metric.after)}
                    <span className={getChangeColor(metric.before, metric.after)}>
                      {getPercentChange(metric.before, metric.after)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
          <p className="text-sm text-blue-800">
            <strong>Analysis:</strong> The authentication changes have a minor impact on performance metrics.
            The slight increases in load time and bundle size are expected due to the addition of OAuth libraries.
          </p>
        </div>
      </div>
    </div>
  );
}
