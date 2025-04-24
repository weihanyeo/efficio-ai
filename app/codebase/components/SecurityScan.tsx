'use client';

import React from 'react';
import { Shield, AlertTriangle, AlertCircle, CheckCircle } from 'lucide-react';

interface SecurityIssue {
  id: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  file: string;
  line: number;
  status: 'open' | 'fixed' | 'false-positive';
}

export default function SecurityScan() {
  const securityIssues: SecurityIssue[] = [
    {
      id: '1',
      severity: 'high',
      title: 'Insecure authentication callback',
      description: 'The callback URL is not properly validated, which could lead to open redirect vulnerabilities.',
      file: 'api/auth/[...nextauth].ts',
      line: 42,
      status: 'open'
    },
    {
      id: '2',
      severity: 'medium',
      title: 'Missing rate limiting',
      description: 'Authentication endpoints should implement rate limiting to prevent brute force attacks.',
      file: 'api/auth/[...nextauth].ts',
      line: 78,
      status: 'open'
    },
    {
      id: '3',
      severity: 'low',
      title: 'Overly permissive CORS settings',
      description: 'CORS settings should be more restrictive to prevent cross-origin attacks.',
      file: 'middleware.ts',
      line: 15,
      status: 'fixed'
    },
    {
      id: '4',
      severity: 'medium',
      title: 'Insufficient session validation',
      description: 'Session tokens should be validated more thoroughly to prevent session hijacking.',
      file: 'auth/AuthProvider.tsx',
      line: 67,
      status: 'false-positive'
    }
  ];

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      case 'high':
        return <AlertTriangle className="w-4 h-4 text-orange-500" />;
      case 'medium':
        return <AlertTriangle className="w-4 h-4 text-amber-500" />;
      case 'low':
        return <AlertTriangle className="w-4 h-4 text-blue-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return (
          <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">
            Open
          </span>
        );
      case 'fixed':
        return (
          <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
            Fixed
          </span>
        );
      case 'false-positive':
        return (
          <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs">
            False Positive
          </span>
        );
      default:
        return null;
    }
  };

  const openIssuesCount = securityIssues.filter(issue => issue.status === 'open').length;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Shield className="text-red-500 w-5 h-5" />
        <h3 className="font-semibold">Security Scan Results</h3>
      </div>
      
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-center">
            <span className="text-2xl font-bold">{openIssuesCount}</span>
            <span className="text-xs text-muted-foreground">Open Issues</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-2xl font-bold">{securityIssues.length - openIssuesCount}</span>
            <span className="text-xs text-muted-foreground">Resolved</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span className="text-xs">Critical/High</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-amber-500"></div>
            <span className="text-xs">Medium</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <span className="text-xs">Low</span>
          </div>
        </div>
      </div>
      
      <div className="space-y-3">
        {securityIssues.map(issue => (
          <div key={issue.id} className="bg-card border border-border rounded-md p-3">
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center gap-2">
                {getSeverityIcon(issue.severity)}
                <h4 className="font-medium text-sm">{issue.title}</h4>
              </div>
              {getStatusBadge(issue.status)}
            </div>
            
            <p className="text-sm text-muted-foreground mb-2">{issue.description}</p>
            
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="font-medium">{issue.file}</span>
              <span>Line {issue.line}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
