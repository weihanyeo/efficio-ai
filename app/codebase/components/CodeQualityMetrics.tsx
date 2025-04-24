'use client';

import React from 'react';
import { BarChart2, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface QualityMetric {
  name: string;
  before: number;
  after: number;
  unit: string;
  higherIsBetter: boolean;
}

export default function CodeQualityMetrics() {
  const qualityMetrics: QualityMetric[] = [
    {
      name: 'Code Coverage',
      before: 72,
      after: 78,
      unit: '%',
      higherIsBetter: true
    },
    {
      name: 'Maintainability Index',
      before: 65,
      after: 68,
      unit: '',
      higherIsBetter: true
    },
    {
      name: 'Cyclomatic Complexity',
      before: 12,
      after: 10,
      unit: '',
      higherIsBetter: false
    },
    {
      name: 'Technical Debt',
      before: 24,
      after: 22,
      unit: 'days',
      higherIsBetter: false
    },
    {
      name: 'Code Duplication',
      before: 8.5,
      after: 7.2,
      unit: '%',
      higherIsBetter: false
    }
  ];

  const getPercentChange = (before: number, after: number) => {
    const change = ((after - before) / before) * 100;
    return change.toFixed(1);
  };

  const getChangeIcon = (metric: QualityMetric) => {
    const percentChange = parseFloat(getPercentChange(metric.before, metric.after));
    
    if (Math.abs(percentChange) < 1) {
      return <Minus className="w-4 h-4 text-gray-500" />;
    }
    
    const isPositiveChange = percentChange > 0;
    const isImprovement = (isPositiveChange && metric.higherIsBetter) || 
                          (!isPositiveChange && !metric.higherIsBetter);
    
    return isImprovement 
      ? <TrendingUp className="w-4 h-4 text-green-500" /> 
      : <TrendingDown className="w-4 h-4 text-red-500" />;
  };

  const getChangeColor = (metric: QualityMetric) => {
    const percentChange = parseFloat(getPercentChange(metric.before, metric.after));
    
    if (Math.abs(percentChange) < 1) {
      return 'text-gray-500';
    }
    
    const isPositiveChange = percentChange > 0;
    const isImprovement = (isPositiveChange && metric.higherIsBetter) || 
                          (!isPositiveChange && !metric.higherIsBetter);
    
    return isImprovement ? 'text-green-500' : 'text-red-500';
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <BarChart2 className="text-green-500 w-5 h-5" />
        <h3 className="font-semibold">Code Quality Metrics</h3>
      </div>
      
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Comparison of code quality metrics before and after the changes.
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
              {qualityMetrics.map((metric, index) => (
                <tr key={index} className="border-b border-border/50">
                  <td className="py-2">{metric.name}</td>
                  <td className="text-right py-2">{metric.before}{metric.unit}</td>
                  <td className="text-right py-2">{metric.after}{metric.unit}</td>
                  <td className="text-right py-2 flex items-center justify-end gap-1">
                    {getChangeIcon(metric)}
                    <span className={getChangeColor(metric)}>
                      {getPercentChange(metric.before, metric.after)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="p-3 bg-green-50 border border-green-200 rounded-md">
          <p className="text-sm text-green-800">
            <strong>Analysis:</strong> Overall code quality has improved with this PR.
            The authentication implementation has increased test coverage and reduced complexity.
          </p>
        </div>
      </div>
    </div>
  );
}
