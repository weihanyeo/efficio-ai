'use client';

import React, { useState } from 'react';
import { 
  GitPullRequest, 
  FileCode, 
  AlertTriangle, 
  Check, 
  Clock, 
  BarChart, 
  Users, 
  Shield, 
  GitBranch, 
  GitCommit,
  ChevronDown,
  ChevronRight,
  FileText,
  Eye
} from 'lucide-react';

// Import all the components
import DocumentationSuggestions from './components/DocumentationSuggestions';
import PerformanceImpact from './components/PerformanceImpact';
import DependencyGraph from './components/DependencyGraph';
import TimelineView from './components/TimelineView';
import SecurityScan from './components/SecurityScan';
import CodeQualityMetrics from './components/CodeQualityMetrics';
import RecommendedReviewers from './components/RecommendedReviewers';

export default function CodebasePage() {
  const [activeTab, setActiveTab] = useState('changes');
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    'summary': true,
    'impact': false,
    'coverage': false,
    'review': false,
    'docs': false,
    'performance': false,
    'dependencies': false,
    'timeline': false,
    'reviewers': false,
    'security': false,
    'quality': false
  });

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  return (
    <div className="container mx-auto p-6">
      <header className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Codebase Analysis</h1>
        <p className="text-muted-foreground">
          Comprehensive analysis and insights for your codebase changes
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <div className="bg-card rounded-lg shadow-sm border border-border p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <GitPullRequest className="text-primary" />
                <h2 className="text-xl font-semibold">Pull Request #128</h2>
              </div>
              <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                Ready to merge
              </span>
            </div>
            <h3 className="text-lg font-medium mb-2">
              Implement user authentication flow with OAuth providers
            </h3>
            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
              <span className="flex items-center gap-1">
                <FileCode className="w-4 h-4" />
                12 files changed
              </span>
              <span className="flex items-center gap-1">
                <GitCommit className="w-4 h-4" />
                8 commits
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                Updated 2 hours ago
              </span>
            </div>
          </div>

          {/* Code Change Summary */}
          <div className="bg-card rounded-lg shadow-sm border border-border p-4 mb-6">
            <button 
              className="flex items-center justify-between w-full"
              onClick={() => toggleSection('summary')}
            >
              <div className="flex items-center gap-2">
                <FileText className="text-primary w-5 h-5" />
                <h3 className="font-semibold">Code Change Summary</h3>
              </div>
              {expandedSections.summary ? (
                <ChevronDown className="w-5 h-5 text-muted-foreground" />
              ) : (
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              )}
            </button>
            
            {expandedSections.summary && (
              <div className="mt-4 pl-7">
                <div className="space-y-3">
                  <p className="text-sm">
                    This PR implements a complete user authentication flow with support for multiple OAuth providers
                    (Google, GitHub, and Microsoft). Key changes include:
                  </p>
                  <ul className="list-disc pl-5 text-sm space-y-2">
                    <li>
                      <span className="font-medium">auth/AuthProvider.tsx</span>: New context provider for auth state management
                    </li>
                    <li>
                      <span className="font-medium">api/auth/[...nextauth].ts</span>: NextAuth configuration with multiple providers
                    </li>
                    <li>
                      <span className="font-medium">components/LoginForm.tsx</span>: UI components for authentication
                    </li>
                    <li>
                      <span className="font-medium">middleware.ts</span>: Route protection for authenticated routes
                    </li>
                  </ul>
                </div>
              </div>
            )}
          </div>

          {/* Potential Impact Analysis */}
          <div className="bg-card rounded-lg shadow-sm border border-border p-4 mb-6">
            <button 
              className="flex items-center justify-between w-full"
              onClick={() => toggleSection('impact')}
            >
              <div className="flex items-center gap-2">
                <AlertTriangle className="text-amber-500 w-5 h-5" />
                <h3 className="font-semibold">Potential Impact Analysis</h3>
              </div>
              {expandedSections.impact ? (
                <ChevronDown className="w-5 h-5 text-muted-foreground" />
              ) : (
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              )}
            </button>
            
            {expandedSections.impact && (
              <div className="mt-4 pl-7">
                <div className="space-y-4">
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 rounded-full bg-red-500 mt-2"></div>
                    <div>
                      <h4 className="font-medium">High Impact</h4>
                      <p className="text-sm text-muted-foreground">User session handling and protected routes</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 rounded-full bg-amber-500 mt-2"></div>
                    <div>
                      <h4 className="font-medium">Medium Impact</h4>
                      <p className="text-sm text-muted-foreground">API authentication and token validation</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500 mt-2"></div>
                    <div>
                      <h4 className="font-medium">Low Impact</h4>
                      <p className="text-sm text-muted-foreground">UI components and styling</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Timeline View */}
          <div className="bg-card rounded-lg shadow-sm border border-border p-4 mb-6">
            <button 
              className="flex items-center justify-between w-full"
              onClick={() => toggleSection('timeline')}
            >
              <div className="flex items-center gap-2">
                <Clock className="text-purple-500 w-5 h-5" />
                <h3 className="font-semibold">Timeline View</h3>
              </div>
              {expandedSections.timeline ? (
                <ChevronDown className="w-5 h-5 text-muted-foreground" />
              ) : (
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              )}
            </button>
            
            {expandedSections.timeline && (
              <div className="mt-4 pl-7">
                <TimelineView />
              </div>
            )}
          </div>
          
          {/* Dependency Graph */}
          <div className="bg-card rounded-lg shadow-sm border border-border p-4 mb-6">
            <button 
              className="flex items-center justify-between w-full"
              onClick={() => toggleSection('dependencies')}
            >
              <div className="flex items-center gap-2">
                <GitBranch className="text-indigo-500 w-5 h-5" />
                <h3 className="font-semibold">Dependency Graph</h3>
              </div>
              {expandedSections.dependencies ? (
                <ChevronDown className="w-5 h-5 text-muted-foreground" />
              ) : (
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              )}
            </button>
            
            {expandedSections.dependencies && (
              <div className="mt-4 pl-7">
                <DependencyGraph />
              </div>
            )}
          </div>
          
          {/* Security Scan Results */}
          <div className="bg-card rounded-lg shadow-sm border border-border p-4 mb-6">
            <button 
              className="flex items-center justify-between w-full"
              onClick={() => toggleSection('security')}
            >
              <div className="flex items-center gap-2">
                <Shield className="text-red-500 w-5 h-5" />
                <h3 className="font-semibold">Security Scan Results</h3>
              </div>
              {expandedSections.security ? (
                <ChevronDown className="w-5 h-5 text-muted-foreground" />
              ) : (
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              )}
            </button>
            
            {expandedSections.security && (
              <div className="mt-4 pl-7">
                <SecurityScan />
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          {/* Test Coverage Visualization */}
          <div className="bg-card rounded-lg shadow-sm border border-border p-4">
            <button 
              className="flex items-center justify-between w-full"
              onClick={() => toggleSection('coverage')}
            >
              <div className="flex items-center gap-2">
                <Check className="text-green-500 w-5 h-5" />
                <h3 className="font-semibold">Test Coverage</h3>
              </div>
              {expandedSections.coverage ? (
                <ChevronDown className="w-5 h-5 text-muted-foreground" />
              ) : (
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              )}
            </button>
            
            {expandedSections.coverage && (
              <div className="mt-4">
                <div className="mb-3">
                  <div className="flex justify-between text-sm mb-1">
                    <span>Overall Coverage</span>
                    <span className="font-medium">78%</span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full" style={{ width: '78%' }}></div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>auth/AuthProvider.tsx</span>
                      <span className="font-medium">92%</span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-1.5">
                      <div className="bg-green-500 h-1.5 rounded-full" style={{ width: '92%' }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>api/auth/[...nextauth].ts</span>
                      <span className="font-medium">85%</span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-1.5">
                      <div className="bg-green-500 h-1.5 rounded-full" style={{ width: '85%' }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>components/LoginForm.tsx</span>
                      <span className="font-medium text-amber-500">64%</span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-1.5">
                      <div className="bg-amber-500 h-1.5 rounded-full" style={{ width: '64%' }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>middleware.ts</span>
                      <span className="font-medium text-red-500">45%</span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-1.5">
                      <div className="bg-red-500 h-1.5 rounded-full" style={{ width: '45%' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Review Status Tracker */}
          <div className="bg-card rounded-lg shadow-sm border border-border p-4">
            <button 
              className="flex items-center justify-between w-full"
              onClick={() => toggleSection('review')}
            >
              <div className="flex items-center gap-2">
                <Eye className="text-blue-500 w-5 h-5" />
                <h3 className="font-semibold">Review Status</h3>
              </div>
              {expandedSections.review ? (
                <ChevronDown className="w-5 h-5 text-muted-foreground" />
              ) : (
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              )}
            </button>
            
            {expandedSections.review && (
              <div className="mt-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500"></div>
                      <span className="text-sm">Approved</span>
                    </div>
                    <span className="text-sm font-medium">2</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                      <span className="text-sm">Changes Requested</span>
                    </div>
                    <span className="text-sm font-medium">1</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                      <span className="text-sm">Pending Review</span>
                    </div>
                    <span className="text-sm font-medium">1</span>
                  </div>
                </div>
                
                <div className="mt-4 pt-4 border-t border-border">
                  <h4 className="text-sm font-medium mb-2">Reviewers</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs">JD</div>
                        <span className="text-sm">Jane Doe</span>
                      </div>
                      <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full">Approved</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs">JS</div>
                        <span className="text-sm">John Smith</span>
                      </div>
                      <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full">Approved</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs">AK</div>
                        <span className="text-sm">Alex Kim</span>
                      </div>
                      <span className="text-xs px-2 py-1 bg-amber-100 text-amber-800 rounded-full">Changes Requested</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs">MP</div>
                        <span className="text-sm">Maria Patel</span>
                      </div>
                      <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full">Pending</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* AI Documentation Suggestions */}
          <div className="bg-card rounded-lg shadow-sm border border-border p-4">
            <button 
              className="flex items-center justify-between w-full"
              onClick={() => toggleSection('docs')}
            >
              <div className="flex items-center gap-2">
                <FileText className="text-amber-500 w-5 h-5" />
                <h3 className="font-semibold">Documentation Suggestions</h3>
              </div>
              {expandedSections.docs ? (
                <ChevronDown className="w-5 h-5 text-muted-foreground" />
              ) : (
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              )}
            </button>
            
            {expandedSections.docs && (
              <div className="mt-4">
                <DocumentationSuggestions />
              </div>
            )}
          </div>
          
          {/* Performance Impact Estimation */}
          <div className="bg-card rounded-lg shadow-sm border border-border p-4">
            <button 
              className="flex items-center justify-between w-full"
              onClick={() => toggleSection('performance')}
            >
              <div className="flex items-center gap-2">
                <BarChart className="text-blue-500 w-5 h-5" />
                <h3 className="font-semibold">Performance Impact</h3>
              </div>
              {expandedSections.performance ? (
                <ChevronDown className="w-5 h-5 text-muted-foreground" />
              ) : (
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              )}
            </button>
            
            {expandedSections.performance && (
              <div className="mt-4">
                <PerformanceImpact />
              </div>
            )}
          </div>
          
          {/* Code Quality Metrics */}
          <div className="bg-card rounded-lg shadow-sm border border-border p-4">
            <button 
              className="flex items-center justify-between w-full"
              onClick={() => toggleSection('quality')}
            >
              <div className="flex items-center gap-2">
                <BarChart className="text-green-500 w-5 h-5" />
                <h3 className="font-semibold">Code Quality Metrics</h3>
              </div>
              {expandedSections.quality ? (
                <ChevronDown className="w-5 h-5 text-muted-foreground" />
              ) : (
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              )}
            </button>
            
            {expandedSections.quality && (
              <div className="mt-4">
                <CodeQualityMetrics />
              </div>
            )}
          </div>
          
          {/* Recommended Reviewers */}
          <div className="bg-card rounded-lg shadow-sm border border-border p-4">
            <button 
              className="flex items-center justify-between w-full"
              onClick={() => toggleSection('reviewers')}
            >
              <div className="flex items-center gap-2">
                <Users className="text-violet-500 w-5 h-5" />
                <h3 className="font-semibold">Recommended Reviewers</h3>
              </div>
              {expandedSections.reviewers ? (
                <ChevronDown className="w-5 h-5 text-muted-foreground" />
              ) : (
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              )}
            </button>
            
            {expandedSections.reviewers && (
              <div className="mt-4">
                <RecommendedReviewers />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
