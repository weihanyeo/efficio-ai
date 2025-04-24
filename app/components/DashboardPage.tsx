'use client';

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  GitPullRequest,
  GitCommit,
  CheckCircle,
  AlertCircle,
  Zap,
  TrendingUp,
  TrendingDown,
  BarChart,
  Activity,
  Calendar,
  Clock,
  Users,
  User,
  PieChart,
  Shield,
  Target,
  Flag,
  AlarmClock,
  Brain,
  CheckSquare,
  Clock3,
  Filter,
  ArrowUpCircle,
  Circle,
  XCircle,
  Layers,
  AlertTriangle,
  Info,
  HelpCircle,
  ChevronUp,
  Plus,
  MessageCircle
} from 'lucide-react';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { useActivityFeed, useWorkspaceStats } from '../hooks/useDashboardQueries';
import type { ActivityFeed } from '../types';

const getActivityIcon = (type: ActivityFeed['type']) => {
  switch (type) {
    case 'pr':
      return <GitPullRequest className="w-4 h-4 text-primary" />;
    case 'commit':
      return <GitCommit className="w-4 h-4 text-green-400" />;
    case 'issue':
      return <AlertCircle className="w-4 h-4 text-yellow-400" />;
    default:
      return <Activity className="w-4 h-4 text-muted-foreground" />;
  }
};

const getTrendIcon = (trend: 'up' | 'down') => {
  if (trend === 'up') {
    return <TrendingUp className="w-4 h-4 text-green-400" />;
  }
  return <TrendingDown className="w-4 h-4 text-destructive" />;
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'in-progress':
      return <Circle className="w-4 h-4 text-blue-400" />;
    case 'blocked':
      return <XCircle className="w-4 h-4 text-red-400" />;
    case 'completed':
      return <CheckCircle className="w-4 h-4 text-green-400" />;
    default:
      return <Clock3 className="w-4 h-4 text-muted-foreground" />;
  }
};

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'high':
      return 'text-red-400';
    case 'medium':
      return 'text-yellow-400';
    case 'low':
      return 'text-green-400';
    default:
      return 'text-muted-foreground';
  }
};

// Tooltip component for displaying helpful information
interface TooltipProps {
  text: string;
  children: React.ReactNode;
}

const Tooltip: React.FC<TooltipProps> = ({ text, children }) => {
  return (
    <div className="tooltip">
      {children}
      <span className="tooltip-text">{text}</span>
    </div>
  );
};

// Animation helper for scroll-based reveals
const useScrollAnimation = () => {
  useEffect(() => {
    const animateOnScroll = () => {
      const elements = document.querySelectorAll('.animate-on-scroll');
      
      elements.forEach(element => {
        const elementPosition = element.getBoundingClientRect().top;
        const windowHeight = window.innerHeight;
        
        if (elementPosition < windowHeight - 100) {
          element.classList.add('animate-reveal');
        }
      });
    };
    
    window.addEventListener('scroll', animateOnScroll);
    // Initial check
    setTimeout(animateOnScroll, 100);
    
    return () => window.removeEventListener('scroll', animateOnScroll);
  }, []);
};

// Function to calculate the average velocity from workspace stats
const calculateAverageVelocity = (stats: any[]): number => {
  if (!stats || stats.length === 0) return 0;
  
  // Assuming each stats object has a velocityPoints property
  const totalVelocity = stats.reduce((sum, stat) => {
    // Use a default value of 0 if velocityPoints is undefined
    return sum + (stat.velocity?.current || 0);
  }, 0);
  
  return Math.round(totalVelocity / stats.length);
};

// Function to get the velocity trend (increasing, decreasing, stable)
const getVelocityTrend = (stats: any[]): string => {
  if (!stats || stats.length < 2) return 'stable';
  
  // Sort by date to compare most recent sprints
  const sortedStats = [...stats].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  
  if (sortedStats.length >= 2) {
    const current = sortedStats[0].velocity?.current || 0;
    const previous = sortedStats[1].velocity?.current || 0;
    
    if (current > previous) return 'increasing';
    if (current < previous) return 'decreasing';
  }
  
  return 'stable';
};

export const DashboardPage: React.FC<{ className?: string }> = ({ className = "" }) => {
  const navigate = useRouter();
  const { currentWorkspace } = useWorkspace();
  const [taskFilter, setTaskFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [showFloatingHeader, setShowFloatingHeader] = useState(false);
  const dashboardRef = useRef<HTMLDivElement>(null);
  
  // Initialize scroll animations
  useScrollAnimation();

  // Handle scroll for floating header
  useEffect(() => {
    const handleScroll = () => {
      if (dashboardRef.current) {
        const scrollPosition = window.scrollY;
        setShowFloatingHeader(scrollPosition > 200);
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const {
    data: activities = [],
    loading: activitiesLoading,
    error: activitiesError
  } = useActivityFeed(currentWorkspace?.id);

  const {
    data: stats,
    loading: statsLoading,
    error: statsError
  } = useWorkspaceStats(currentWorkspace?.id);

  console.log('Dashboard rendering with:', {
    currentWorkspaceId: currentWorkspace?.id,
    activities: activities.length,
    activitiesLoading,
    activitiesError,
    stats,
    statsLoading,
    statsError
  });

  const loading = activitiesLoading || statsLoading;
  const error = activitiesError || statsError;

  // Mock data for dashboard visualizations
  const mockData = {
    projectHealth: {
      status: 'yellow',
      overallScore: 78,
      burndown: [
        { day: 'Mon', remaining: 45 },
        { day: 'Tue', remaining: 38 },
        { day: 'Wed', remaining: 30 },
        { day: 'Thu', remaining: 22 },
        { day: 'Fri', remaining: 15 }
      ],
      milestones: [
        { name: 'MVP Release', daysLeft: 2, percentComplete: 85 },
        { name: 'User Testing', daysLeft: 5, percentComplete: 40 },
        { name: 'Final Delivery', daysLeft: 12, percentComplete: 20 }
      ],
      riskAlerts: [
        { task: 'API Integration', reason: 'Dependency on external team, may cause delays' },
        { task: 'Performance Testing', reason: 'Resource allocation insufficient for timeline' }
      ]
    },
    teamPerformance: {
      capacityUtilization: 85,
      resolutionTime: 2.5,
      workDistribution: [
        { member: 'Alex', tasks: 8 },
        { member: 'Jamie', tasks: 12 },
        { member: 'Taylor', tasks: 6 },
        { member: 'Morgan', tasks: 10 }
      ],
      insights: [
        'Consider redistributing tasks from Jamie to Alex to balance workload',
        'Team velocity is increasing but code quality metrics are declining',
        'Sprint planning efficiency can be improved by 15% based on historical data',
        'Consider allocating more time for code reviews to reduce technical debt'
      ]
    },
    personalFocus: {
      tasks: [
        { name: 'Implement login page', status: 'in-progress', priority: 'high', dueDate: '2025-04-08', blockers: 1, comments: 2, daysLeft: 3, percentComplete: 60 },
        { name: 'Fix navigation bug', status: 'not-started', priority: 'medium', dueDate: '2025-04-10', blockers: 0, comments: 0, daysLeft: 5, percentComplete: 0 },
        { name: 'Add unit tests for API', status: 'blocked', priority: 'high', dueDate: '2025-04-07', blockers: 2, comments: 1, daysLeft: 1, percentComplete: 20 },
        { name: 'Update documentation', status: 'not-started', priority: 'low', dueDate: '2025-04-15', blockers: 0, comments: 0, daysLeft: 7, percentComplete: 0 },
      ],
      calendar: [
        { title: 'Daily Standup', time: '09:30 AM', date: '2025-04-07', type: 'meeting', description: 'Discuss ongoing tasks and blockers' },
        { title: 'Sprint Planning', time: '02:00 PM', date: '2025-04-08', type: 'meeting', description: 'Plan tasks for the upcoming sprint' },
        { title: 'Client Demo', time: '11:00 AM', date: '2025-04-10', type: 'deadline', description: 'Prepare for the client demo' },
      ],
      metrics: {
        taskCompletion: 85,
        codeQuality: 92,
        velocity: 15,
      },
      aiRecommendations: [
        { task: 'Fix navigation bug', reason: 'Blocking 3 other tasks in the current sprint' },
        { task: 'Review PR #42', reason: 'Has been open for 3 days and is needed for the upcoming release' },
      ]
    }
  };

  useEffect(() => {
    // Animation for elements that should animate when they scroll into view
    const animateOnScroll = () => {
      const elements = document.querySelectorAll('.animate-on-scroll');
      
      elements.forEach(element => {
        // Make all elements visible immediately for now to fix the issue
        element.classList.add('animate-visible');
        
        // Original animation code (commented out for now)
        /*
        const elementTop = element.getBoundingClientRect().top;
        const elementBottom = element.getBoundingClientRect().bottom;
        
        // Check if element is in viewport
        if (elementTop < window.innerHeight && elementBottom > 0) {
          element.classList.add('animate-visible');
        }
        */
      });
      
      // Count-up animation for numeric values
      const countElements = document.querySelectorAll('.animate-count-up');
      countElements.forEach(element => {
        if (!element.classList.contains('counting')) {
          element.classList.add('counting');
          
          const targetValue = parseInt(element.getAttribute('data-value') || '0', 10);
          const duration = 1500; // ms
          const startTime = performance.now();
          let currentValue = 0;
          
          const updateCount = (timestamp: number) => {
            const elapsed = timestamp - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Easing function for smoother animation
            const easeOutQuad = (t: number) => t * (2 - t);
            const easedProgress = easeOutQuad(progress);
            
            currentValue = Math.floor(easedProgress * targetValue);
            element.textContent = element.textContent?.replace(/\d+/, currentValue.toString()) || currentValue.toString();
            
            if (progress < 1) {
              requestAnimationFrame(updateCount);
            }
          };
          
          requestAnimationFrame(updateCount);
        }
      });
    };
    
    // Run animation check on scroll
    window.addEventListener('scroll', animateOnScroll);
    // Initial check for elements already in view
    animateOnScroll();
    
    return () => {
      window.removeEventListener('scroll', animateOnScroll);
    };
  }, []);

  if (loading || !stats) {
    return (
      <div className="flex justify-center w-full">
        <div className="w-full max-w-7xl p-6">
          <div className="animate-pulse">
            <div className="h-8 bg-secondary rounded w-1/4 mb-4"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-secondary rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center w-full">
        <div className="w-full max-w-7xl p-6">
          <div className="p-6 text-red-400 bg-card rounded-lg border border-border">
            Error loading dashboard data. Please try again later.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-center w-full" ref={dashboardRef}>
      {/* Floating summary header */}
      {showFloatingHeader && (
        <div className="fixed top-0 left-0 right-0 bg-background/80 backdrop-blur-sm z-40 border-b border-border shadow-sm transition-all duration-300 transform translate-y-0">
        <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-2 sm:space-x-4">
            <h2 className="text-base sm:text-lg font-semibold">Project Dashboard</h2>
            <div className="hidden md:flex items-center space-x-4">
              <div className="flex items-center text-sm">
                <div className="w-2 h-2 rounded-full bg-yellow-400 mr-2"></div>
                <span>Health: {mockData.projectHealth.overallScore}%</span>
              </div>
              <div className="flex items-center text-sm">
                <Zap className="w-4 h-4 text-primary mr-1" />
                <span>Velocity: {calculateAverageVelocity([stats])}</span>
              </div>
            </div>
          </div>
          <button 
            onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})}
            className="p-1 rounded-full bg-primary/10 hover:bg-primary/20 transition-colors"
          >
            <ChevronUp className="w-5 h-5 text-primary" />
          </button>
        </div>
      </div>
      )}

      <div className="w-full max-w-7xl px-4 sm:px-6 py-4 sm:py-6 space-y-6 sm:space-y-8">
        <h1 className="text-xl sm:text-2xl font-bold">Dashboard</h1>
        
        {/* Stats Grid - Summary Row */}
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 animate-on-scroll">
          {/* Projects */}
          <div className="bg-card p-3 sm:p-4 md:p-5 rounded-lg border border-border shadow-sm hover:border-muted transition-colors hover:shadow-md">
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <h3 className="text-xs sm:text-sm font-medium text-muted-foreground">Projects</h3>
              <Tooltip text="Total number of active projects in your workspace">
                <div className="flex items-center">
                  <GitPullRequest className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                  <HelpCircle className="w-3 h-3 text-muted-foreground ml-1" />
                </div>
              </Tooltip>
            </div>
            <div className="flex items-baseline">
              <span className="text-2xl sm:text-3xl font-semibold">{stats.active_projects}</span>
              <span className="text-xs sm:text-sm text-muted-foreground ml-2">/ {stats.total_projects} total</span>
            </div>
          </div>

          {/* Issues */}
          <div className="bg-card p-3 sm:p-4 md:p-5 rounded-lg border border-border shadow-sm hover:border-muted transition-colors hover:shadow-md">
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <h3 className="text-xs sm:text-sm font-medium text-muted-foreground">Issues</h3>
              <Tooltip text="Open issues requiring attention">
                <div className="flex items-center">
                  <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400" />
                  <HelpCircle className="w-3 h-3 text-muted-foreground ml-1" />
                </div>
              </Tooltip>
            </div>
            <div className="flex items-baseline">
              <span className="text-2xl sm:text-3xl font-semibold">{stats.open_issues}</span>
              <span className="text-xs sm:text-sm text-muted-foreground ml-2">/ {stats.total_issues} total</span>
            </div>
          </div>

          {/* Velocity */}
          <div className="bg-card p-3 sm:p-4 md:p-5 rounded-lg border border-border shadow-sm hover:border-muted transition-colors hover:shadow-md">
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <h3 className="text-xs sm:text-sm font-medium text-muted-foreground">Velocity</h3>
              <Tooltip text="Story points completed per sprint">
                <div className="flex items-center">
                  <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400" />
                  <HelpCircle className="w-3 h-3 text-muted-foreground ml-1" />
                </div>
              </Tooltip>
            </div>
            <div className="flex items-center">
              <span className="text-2xl sm:text-3xl font-semibold">{calculateAverageVelocity([stats])}</span>
              <div className="flex items-center ml-2">
                {getVelocityTrend([stats]) === 'up' ? (
                  <TrendingUp className="w-3 h-3 text-green-400" />
                ) : (
                  <TrendingDown className="w-3 h-3 text-destructive" />
                )}
                <span className="text-xs sm:text-sm text-muted-foreground ml-1">
                  vs {stats?.velocity?.previous || 0}
                </span>
              </div>
            </div>
          </div>

          {/* Code Quality */}
          <div className="bg-card p-3 sm:p-4 md:p-5 rounded-lg border border-border shadow-sm hover:border-muted transition-colors hover:shadow-md">
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <h3 className="text-xs sm:text-sm font-medium text-muted-foreground">Code Quality</h3>
              <Tooltip text="Measured by test coverage, linting, and code reviews">
                <div className="flex items-center">
                  <BarChart className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
                  <HelpCircle className="w-3 h-3 text-muted-foreground ml-1" />
                </div>
              </Tooltip>
            </div>
            <div className="flex items-center">
              <span className="text-2xl sm:text-3xl font-semibold">{stats?.code_quality?.score || 0}%</span>
              <div className="flex items-center ml-2">
                {stats?.code_quality?.trend && getTrendIcon(stats.code_quality.trend)}
                <span className="text-xs sm:text-sm text-muted-foreground ml-1">
                  vs {stats?.code_quality?.previous || 0}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Project Health Overview */}
        <div className="animate-on-scroll">
          <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 flex items-center gap-2 border-b pb-2">
            <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
            Project Health Overview
          </h2>
          <div className="grid grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-2">
            {/* Overall Health & Burndown */}
            <div className="bg-card p-3 sm:p-5 rounded-lg border border-border shadow-sm hover:shadow-md transition-all duration-300">
              <div className="flex flex-col sm:flex-row justify-between items-start mb-3 sm:mb-4">
                <div>
                  <div className="flex items-center gap-1">
                    <h3 className="text-sm sm:text-md font-medium">Overall Health</h3>
                    <Tooltip text="Combined score based on sprint progress, open issues, and code quality">
                      <HelpCircle className="w-3 h-3 text-muted-foreground" />
                    </Tooltip>
                  </div>
                  <div className="flex items-center mt-2 sm:mt-3">
                    <div className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full ${
                      mockData.projectHealth.status === 'green' 
                        ? 'bg-green-400' 
                        : mockData.projectHealth.status === 'yellow' 
                          ? 'bg-yellow-400' 
                          : 'bg-red-400'
                    }`}></div>
                    <span className="text-xl sm:text-2xl font-semibold animate-count-up ml-2" data-value={mockData.projectHealth.overallScore}>
                      {mockData.projectHealth.overallScore}%
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 sm:mt-2">
                    {mockData.projectHealth.status === 'green' 
                      ? 'Project is on track' 
                      : mockData.projectHealth.status === 'yellow' 
                        ? 'Some attention needed' 
                        : 'Critical issues require attention'}
                  </p>
                </div>
                <div className="flex flex-col items-end mt-3 sm:mt-0">
                  <div className="flex items-center gap-1">
                    <span className="text-xs sm:text-sm font-medium">Sprint Burndown</span>
                    <Tooltip text="Tasks remaining each day of the sprint">
                      <HelpCircle className="w-3 h-3 text-muted-foreground" />
                    </Tooltip>
                  </div>
                  <div className="flex items-end h-16 sm:h-20 mt-2 gap-1">
                    {mockData.projectHealth.burndown.map((day, index) => (
                      <div key={index} className="flex flex-col items-center">
                        <div 
                          className="w-6 sm:w-8 bg-primary/70 rounded-sm" 
                          style={{ 
                            height: `${(day.remaining / 45) * 100}%`,
                            animationDelay: `${index * 100}ms`
                          }}
                        ></div>
                        <span className="text-[10px] sm:text-xs text-muted-foreground mt-1">{day.day}</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-[10px] sm:text-xs text-muted-foreground mt-1 sm:mt-2 text-right">
                    5 days remaining in sprint
                  </p>
                </div>
              </div>
              <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-border">
                <h4 className="text-xs sm:text-sm font-medium mb-1 sm:mb-2">Sprint Summary</h4>
                <p className="text-[10px] sm:text-xs text-muted-foreground">
                  Current sprint is 65% complete with 5 days remaining. The team is on track to meet most deliverables, but there are 2 blockers that need attention.
                </p>
              </div>
            </div>

            {/* Milestones & Deadlines */}
            <div className="bg-card p-3 sm:p-5 rounded-lg border border-border shadow-sm hover:shadow-md transition-all duration-300">
              <div className="flex items-center justify-between mb-2 sm:mb-3">
                <h3 className="text-sm sm:text-md font-medium">Milestones & Deadlines</h3>
                <Tooltip text="Upcoming project milestones and their completion status">
                  <Flag className="w-4 h-4 text-muted-foreground" />
                </Tooltip>
              </div>
              <div className="space-y-2 sm:space-y-4">
                {mockData.projectHealth.milestones.map((milestone, index) => (
                  <div 
                    key={index} 
                    className="flex flex-col p-2 sm:p-3 rounded-md animate-slide-in"
                    style={{ 
                      animationDelay: `${index * 100}ms`,
                      backgroundColor: milestone.daysLeft <= 3 ? 'rgba(239, 68, 68, 0.1)' : 'rgba(var(--secondary), 0.3)'
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 sm:gap-2">
                        <div className={`w-2 h-2 rounded-full ${
                          milestone.daysLeft <= 3 ? 'bg-red-400' : 
                          milestone.daysLeft <= 7 ? 'bg-yellow-400' : 'bg-green-400'
                        }`}></div>
                        <div className="text-xs sm:text-sm font-medium">{milestone.name}</div>
                      </div>
                      <div className={`text-[10px] sm:text-xs font-medium px-1.5 sm:px-2 py-0.5 rounded-full ${
                        milestone.daysLeft <= 3 ? 'bg-red-400/20 text-red-600' : 
                        milestone.daysLeft <= 7 ? 'bg-yellow-400/20 text-yellow-600' : 'bg-green-400/20 text-green-600'
                      }`}>
                        {milestone.daysLeft} days left
                      </div>
                    </div>
                    <div className="mt-2">
                      <div className="flex items-center justify-between text-[10px] sm:text-xs mb-1">
                        <span className="text-muted-foreground">Completion</span>
                        <span className="font-medium">{milestone.percentComplete}%</span>
                      </div>
                      <div className="w-full h-1 sm:h-1.5 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary rounded-full animate-grow-right" 
                          style={{ 
                            width: `${milestone.percentComplete}%`,
                            animationDelay: `${index * 150}ms`
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* AI-Powered Risk Alerts */}
            <div className="bg-card p-3 sm:p-5 rounded-lg border border-border shadow-sm hover:shadow-md transition-all duration-300 lg:col-span-2">
              <div className="flex items-center justify-between mb-2 sm:mb-3">
                <h3 className="text-sm sm:text-md font-medium flex items-center gap-1 sm:gap-2">
                  <AlertTriangle className="w-3 h-3 text-yellow-400" />
                  AI-Powered Risk Alerts
                </h3>
                <Tooltip text="AI-detected potential risks to project timeline or quality">
                  <HelpCircle className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground" />
                </Tooltip>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-4">
                {mockData.projectHealth.riskAlerts.map((alert, index) => (
                  <div 
                    key={index} 
                    className="p-2 sm:p-3 bg-yellow-400/10 border border-yellow-400/30 rounded-md animate-fade-in"
                    style={{ animationDelay: `${index * 150}ms` }}
                  >
                    <h4 className="text-xs sm:text-sm font-medium">{alert.task}</h4>
                    <p className="text-[10px] sm:text-sm text-muted-foreground mt-1">{alert.reason}</p>
                    <div className="flex justify-end mt-2">
                      <button className="text-[10px] sm:text-xs bg-yellow-400/20 text-yellow-600 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded hover:bg-yellow-400/30 transition-colors">
                        View Details
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Team Performance Metrics */}
        <div className="animate-on-scroll">
          <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 flex items-center gap-2 border-b pb-2">
            <Users className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
            Team Performance Metrics
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Team Capacity Utilization */}
            <div className="bg-card p-3 sm:p-5 rounded-lg border border-border shadow-sm hover:shadow-md transition-all duration-300">
              <div className="flex items-center justify-between mb-2 sm:mb-3">
                <h3 className="text-sm sm:text-md font-medium">Team Capacity</h3>
                <Tooltip text="Percentage of available team hours currently allocated to tasks">
                  <HelpCircle className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground" />
                </Tooltip>
              </div>
              <div className="relative pt-1">
                <div className="flex items-center justify-between mb-1 sm:mb-2">
                  <div>
                    <span className="text-[10px] sm:text-xs font-semibold inline-block text-primary">
                      Utilization
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] sm:text-xs font-semibold inline-block text-primary animate-count-up" data-value={mockData.teamPerformance.capacityUtilization}>
                      {mockData.teamPerformance.capacityUtilization}%
                    </span>
                  </div>
                </div>
                <div className="overflow-hidden h-1.5 sm:h-2 mb-1 sm:mb-2 text-xs flex rounded-full bg-muted">
                  <div 
                    style={{ width: `${mockData.teamPerformance.capacityUtilization}%` }} 
                    className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center animate-grow-right ${
                      mockData.teamPerformance.capacityUtilization > 90 ? 'bg-red-400' : 
                      mockData.teamPerformance.capacityUtilization > 75 ? 'bg-yellow-400' : 'bg-green-400'
                    }`}
                  ></div>
                </div>
                <div className="flex justify-between text-[10px] sm:text-xs text-muted-foreground">
                  <span>Underutilized</span>
                  <span>Optimal</span>
                  <span>Overallocated</span>
                </div>
              </div>
              <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-border">
                <div className="flex items-center justify-between text-[10px] sm:text-xs">
                  <span className="text-muted-foreground">3-Sprint Trend</span>
                  <div className="flex items-center gap-1">
                    <TrendingUp className="w-3 h-3 text-green-400" />
                    <span className="text-green-400">+8%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Issue Resolution Time */}
            <div className="bg-card p-3 sm:p-5 rounded-lg border border-border shadow-sm hover:shadow-md transition-all duration-300">
              <div className="flex items-center justify-between mb-2 sm:mb-3">
                <h3 className="text-sm sm:text-md font-medium">Resolution Time</h3>
                <Tooltip text="Average time to resolve issues over the last sprint">
                  <HelpCircle className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground" />
                </Tooltip>
              </div>
              <div className="flex items-center">
                <Clock className="w-6 h-6 sm:w-8 sm:h-8 text-primary mr-2 sm:mr-3 animate-pulse-slow" />
                <div>
                  <div className="text-lg sm:text-2xl font-semibold animate-count-up" data-value={mockData.teamPerformance.resolutionTime}>
                    {mockData.teamPerformance.resolutionTime} days
                  </div>
                  <div className="text-[10px] sm:text-xs text-muted-foreground">Average resolution time</div>
                </div>
              </div>
              <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-border">
                <div className="flex items-center justify-between text-[10px] sm:text-xs">
                  <span className="text-muted-foreground">Previous Sprint</span>
                  <div className="flex items-center gap-1">
                    <TrendingDown className="w-3 h-3 text-green-400" />
                    <span className="text-green-400">-0.5 days</span>
                  </div>
                </div>
                <div className="h-1 w-full bg-muted mt-1 sm:mt-2 rounded-full">
                  <div className="h-1 bg-green-400 rounded-full" style={{ width: '30%' }}></div>
                </div>
              </div>
            </div>

            {/* Team Velocity */}
            <div className="bg-card p-3 sm:p-5 rounded-lg border border-border shadow-sm hover:shadow-md transition-all duration-300">
              <div className="flex items-center justify-between mb-2 sm:mb-3">
                <h3 className="text-sm sm:text-md font-medium">Team Velocity</h3>
                <Tooltip text="Story points completed per sprint over time">
                  <HelpCircle className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground" />
                </Tooltip>
              </div>
              <div className="h-32 sm:h-40 flex flex-col">
                <div className="flex-1 flex items-end justify-between gap-1 sm:gap-2 mb-1 sm:mb-2">
                  {[
                    { sprint: 'Sprint 1', value: 28 },
                    { sprint: 'Sprint 2', value: 32 },
                    { sprint: 'Sprint 3', value: 35 },
                    { sprint: 'Sprint 4', value: 38 },
                    { sprint: 'Sprint 5', value: 42 }
                  ].map((data, index) => (
                    <div key={index} className="flex flex-col items-center flex-1">
                      <div 
                        className="w-full bg-gradient-to-t from-primary/70 to-primary/40 rounded-t-sm" 
                        style={{ 
                          height: `${(data.value / 45) * 100}%`,
                          transition: "height 1s ease-out",
                          transitionDelay: `${index * 100}ms`
                        }}
                      >
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-[10px] sm:text-xs font-medium text-white">{data.value}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between">
                  {[
                    { sprint: 'Sprint 1', value: 28 },
                    { sprint: 'Sprint 2', value: 32 },
                    { sprint: 'Sprint 3', value: 35 },
                    { sprint: 'Sprint 4', value: 38 },
                    { sprint: 'Sprint 5', value: 42 }
                  ].map((data, index) => (
                    <div key={index} className="text-[8px] sm:text-xs text-muted-foreground text-center flex-1">
                      {data.sprint}
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-2 sm:mt-3 text-[10px] sm:text-xs text-center">
                <div className="flex items-center justify-center gap-1 text-green-500">
                  <TrendingUp className="w-3 h-3" />
                  <span className="font-medium">+50%</span> increase over last 5 sprints
                </div>
                <div className="text-muted-foreground mt-1">
                  Consistent improvement in team performance
                </div>
              </div>
            </div>

            {/* Work Distribution */}
            <div className="bg-card p-3 sm:p-5 rounded-lg border border-border shadow-sm hover:shadow-md transition-all duration-300">
              <div className="flex items-center justify-between mb-2 sm:mb-3">
                <h3 className="text-sm sm:text-md font-medium">Work Distribution</h3>
                <Tooltip text="Tasks assigned per team member">
                  <HelpCircle className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground" />
                </Tooltip>
              </div>
              <div className="h-32 sm:h-40">
                {/* Horizontal bar chart */}
                <div className="h-full flex flex-col justify-around">
                  {mockData.teamPerformance.workDistribution.map((member, index) => (
                    <div key={index} className="flex items-center h-6 sm:h-8 gap-1 sm:gap-2">
                      <div className="w-12 sm:w-20 text-[10px] sm:text-sm truncate">{member.member}</div>
                      <div className="flex-1 h-full flex items-center">
                        <div 
                          className="h-4 sm:h-5 rounded-sm flex items-center" 
                          style={{ 
                            width: `${(member.tasks / 15) * 100}%`,
                            backgroundColor: `hsl(${210 + index * 30}, 70%, 60%)`,
                            transition: "width 1s ease-out",
                            transitionDelay: `${index * 100}ms`
                          }}
                        >
                          <span className="text-[10px] sm:text-xs font-medium text-white ml-1 sm:ml-2 truncate">
                            {member.tasks} tasks
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-2 sm:mt-3 text-[10px] sm:text-xs text-muted-foreground text-center">
                Recommended: Redistribute 2 tasks from Jamie to Taylor
              </div>
            </div>

            {/* AI-Based Team Insights */}
            <div className="bg-card p-3 sm:p-5 rounded-lg border border-border shadow-sm hover:shadow-md transition-all duration-300 lg:col-span-4">
              <div className="flex items-center justify-between mb-2 sm:mb-3">
                <h3 className="text-sm sm:text-md font-medium flex items-center gap-1 sm:gap-2">
                  <Brain className="w-3 h-3 sm:w-4 sm:h-4 text-purple-400" />
                  AI-Based Team Insights
                </h3>
                <Tooltip text="AI-generated recommendations based on team performance data">
                  <HelpCircle className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground" />
                </Tooltip>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-4">
                {mockData.teamPerformance.insights.map((insight, index) => (
                  <div 
                    key={index} 
                    className="p-2 sm:p-3 bg-purple-400/10 border border-purple-400/30 rounded-md animate-fade-in flex items-start gap-1 sm:gap-2"
                    style={{ animationDelay: `${index * 200}ms` }}
                  >
                    <Brain className="w-3 h-3 sm:w-4 sm:h-4 text-purple-400 mt-0.5" />
                    <div>
                      <p className="text-[10px] sm:text-sm ">{insight}</p>
                      <div className="relative flex justify-end mt-1 sm:mt-2">
                        <button className="text-[10px] sm:text-xs bg-purple-400/20 text-purple-600 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded hover:bg-purple-400/30 transition-colors">
                          Apply Suggestion
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Personal Focus Area */}
        <div className="animate-on-scroll">
          <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 flex items-center gap-2 border-b pb-2">
            <User className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
            Personal Focus Area
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {/* My Tasks */}
            <div className="bg-card p-3 sm:p-5 rounded-lg border border-border shadow-sm hover:shadow-md transition-all duration-300">
              <div className="flex items-center justify-between mb-2 sm:mb-3">
                <h3 className="text-sm sm:text-md font-medium">My Tasks</h3>
                <Tooltip text="Your assigned tasks for the current sprint">
                  <HelpCircle className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground" />
                </Tooltip>
              </div>
              <div className="space-y-2 sm:space-y-3">
                {mockData.personalFocus.tasks.map((task, index) => (
                  <div 
                    key={index} 
                    className="p-2 sm:p-3 border border-border rounded-md hover:bg-accent/50 transition-colors animate-slide-in"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 sm:gap-2">
                        <div className={`w-2 h-2 rounded-full ${
                          task.priority === 'high' ? 'bg-red-400' : 
                          task.priority === 'medium' ? 'bg-yellow-400' : 'bg-green-400'
                        }`}></div>
                        <div className="text-xs sm:text-sm font-medium">{task.name}</div>
                      </div>
                      <div className={`text-[10px] sm:text-xs font-medium px-1.5 sm:px-2 py-0.5 rounded-full ${
                        task.daysLeft <= 1 ? 'bg-red-400/20 text-red-600' : 
                        task.daysLeft <= 3 ? 'bg-yellow-400/20 text-yellow-600' : 'bg-green-400/20 text-green-600'
                      }`}>
                        {task.daysLeft} {task.daysLeft === 1 ? 'day' : 'days'} left
                      </div>
                    </div>
                    <div className="mt-1 sm:mt-2">
                      <div className="flex items-center justify-between text-[10px] sm:text-xs mb-1">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-medium">{task.percentComplete}%</span>
                      </div>
                      <div className="w-full h-1 sm:h-1.5 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary rounded-full animate-grow-right" 
                          style={{ 
                            width: `${task.percentComplete}%`,
                            animationDelay: `${index * 150}ms`
                          }}
                        ></div>
                      </div>
                    </div>
                    <div className="flex justify-between items-center mt-2 sm:mt-3">
                      <div className="flex gap-1">
                        {task.blockers > 0 && (
                          <Tooltip text={`${task.blockers} blocker${task.blockers > 1 ? 's' : ''}`}>
                            <div className="bg-red-400/20 text-red-600 p-0.5 sm:p-1 rounded-full">
                              <AlertTriangle className="w-2 h-2 sm:w-3 sm:h-3" />
                            </div>
                          </Tooltip>
                        )}
                        {task.comments > 0 && (
                          <Tooltip text={`${task.comments} comment${task.comments > 1 ? 's' : ''}`}>
                            <div className="bg-blue-400/20 text-blue-600 p-0.5 sm:p-1 rounded-full">
                              <MessageCircle className="w-2 h-2 sm:w-3 sm:h-3" />
                            </div>
                          </Tooltip>
                        )}
                      </div>
                      <button className="text-[10px] sm:text-xs bg-primary/20 text-primary px-1.5 sm:px-2 py-0.5 sm:py-1 rounded hover:bg-primary/30 transition-colors">
                        Update
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-center mt-3 sm:mt-4">
                <button className="text-xs sm:text-sm text-primary flex items-center gap-1 hover:underline">
                  <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                  Add New Task
                </button>
              </div>
            </div>

            {/* My Calendar */}
            <div className="bg-card p-3 sm:p-5 rounded-lg border border-border shadow-sm hover:shadow-md transition-all duration-300">
              <div className="flex items-center justify-between mb-2 sm:mb-3">
                <h3 className="text-sm sm:text-md font-medium">My Calendar</h3>
                <Tooltip text="Your upcoming meetings and deadlines">
                  <HelpCircle className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground" />
                </Tooltip>
              </div>
              <div className="space-y-2 sm:space-y-3">
                {mockData.personalFocus.calendar.map((event, index) => (
                  <div 
                    key={index} 
                    className="p-2 sm:p-3 border border-border rounded-md hover:bg-accent/50 transition-colors animate-slide-in"
                    style={{ 
                      animationDelay: `${index * 100}ms`,
                      borderLeft: `3px solid ${
                        event.type === 'meeting' ? 'var(--blue)' : 
                        event.type === 'deadline' ? 'var(--red)' : 'var(--green)'
                      }`
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 sm:gap-2">
                        {event.type === 'meeting' ? (
                          <Users className="w-3 h-3 sm:w-4 sm:h-4 text-blue-400" />
                        ) : event.type === 'deadline' ? (
                          <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-red-400" />
                        ) : (
                          <Calendar className="w-3 h-3 sm:w-4 sm:h-4 text-green-400" />
                        )}
                        <div className="text-xs sm:text-sm font-medium">{event.title}</div>
                      </div>
                      <div className="text-[10px] sm:text-xs text-muted-foreground">
                        {event.time}
                      </div>
                    </div>
                    <div className="mt-1 text-[10px] sm:text-xs text-muted-foreground">
                      {event.description}
                    </div>
                    {event.type === 'meeting' && (
                      <div className="flex justify-end mt-1 sm:mt-2">
                        <button className="text-[10px] sm:text-xs bg-blue-400/20 text-blue-600 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded hover:bg-blue-400/30 transition-colors">
                          Join Meeting
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

         {/* Performance Metrics */}
         <div className="bg-card p-5 rounded-lg border border-border shadow-sm hover:shadow-md transition-all duration-300 md:col-span-2">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-md font-medium">My Performance</h3>
                <Tooltip text="Your performance metrics compared to team averages">
                  <HelpCircle className="w-4 h-4 text-muted-foreground" />
                </Tooltip>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Task Completion Rate */}
                <div className="p-3 border border-border rounded-md">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Task Completion</span>
                    <Tooltip text="Percentage of assigned tasks completed on time">
                      <HelpCircle className="w-3 h-3 text-muted-foreground" />
                    </Tooltip>
                  </div>
                  <div className="flex items-center justify-center my-3">
                    <div className="relative w-24 h-24">
                      <svg className="w-full h-full" viewBox="0 0 100 100">
                        <circle 
                          className="text-muted stroke-current" 
                          strokeWidth="10" 
                          cx="50" 
                          cy="50" 
                          r="40" 
                          fill="transparent"
                        ></circle>
                        <circle 
                          className="text-primary stroke-current" 
                          strokeWidth="10" 
                          strokeLinecap="round" 
                          cx="50" 
                          cy="50" 
                          r="40" 
                          fill="transparent"
                          strokeDasharray={`${2 * Math.PI * 40}`}
                          strokeDashoffset={`${2 * Math.PI * 40 * (1 - mockData.personalFocus.metrics.taskCompletion / 100)}`}
                          transform="rotate(-90 50 50)"
                        ></circle>
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-2xl font-bold">
                          {mockData.personalFocus.metrics.taskCompletion}%
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>You: {mockData.personalFocus.metrics.taskCompletion}%</span>
                    <span>Team: 78%</span>
                  </div>
                </div>

                {/* Code Quality */}
                <div className="p-3 border border-border rounded-md">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Code Quality</span>
                    <Tooltip text="Composite score based on code reviews, test coverage, and linting metrics">
                      <HelpCircle className="w-3 h-3 text-muted-foreground" />
                    </Tooltip>
                  </div>
                  <div className="flex items-center justify-center my-4">
                    <div className="w-full">
                      {/* Radar chart representation */}
                      <div className="flex justify-around items-center">
                        <div className="flex flex-col items-center">
                          <div className="relative w-24 h-24">
                            <svg className="w-full h-full" viewBox="0 0 100 100">
                              <circle 
                                className="text-muted/20 stroke-current" 
                                strokeWidth="10" 
                                cx="50" 
                                cy="50" 
                                r="40" 
                                fill="transparent"
                              ></circle>
                              <circle 
                                className="text-green-500 stroke-current" 
                                strokeWidth="10" 
                                strokeLinecap="round" 
                                cx="50" 
                                cy="50" 
                                r="40" 
                                fill="transparent"
                                strokeDasharray={`${2 * Math.PI * 40}`}
                                strokeDashoffset={`${2 * Math.PI * 40 * (1 - mockData.personalFocus.metrics.codeQuality / 100)}`}
                                transform="rotate(-90 50 50)"
                                style={{ transition: "stroke-dashoffset 1s ease-out" }}
                              ></circle>
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center flex-col">
                              <span className="text-xl font-bold text-green-500">
                                {mockData.personalFocus.metrics.codeQuality}%
                              </span>
                              <span className="text-xs">You</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex flex-col items-center">
                          <div className="relative w-24 h-24">
                            <svg className="w-full h-full" viewBox="0 0 100 100">
                              <circle 
                                className="text-muted/20 stroke-current" 
                                strokeWidth="10" 
                                cx="50" 
                                cy="50" 
                                r="40" 
                                fill="transparent"
                              ></circle>
                              <circle 
                                className="text-blue-500 stroke-current" 
                                strokeWidth="10" 
                                strokeLinecap="round" 
                                cx="50" 
                                cy="50" 
                                r="40" 
                                fill="transparent"
                                strokeDasharray={`${2 * Math.PI * 40}`}
                                strokeDashoffset={`${2 * Math.PI * 40 * (1 - 82 / 100)}`}
                                transform="rotate(-90 50 50)"
                                style={{ transition: "stroke-dashoffset 1s ease-out" }}
                              ></circle>
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center flex-col">
                              <span className="text-xl font-bold text-blue-500">
                                82%
                              </span>
                              <span className="text-xs">Team</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-2 mt-3">
                        <div className="text-center">
                          <div className="text-xs font-medium">Test Coverage</div>
                          <div className="text-sm">
                            <span className="text-green-500">94%</span> / <span className="text-blue-500">85%</span>
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-xs font-medium">Lint Score</div>
                          <div className="text-sm">
                            <span className="text-green-500">90%</span> / <span className="text-blue-500">78%</span>
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-xs font-medium">Review Score</div>
                          <div className="text-sm">
                            <span className="text-green-500">92%</span> / <span className="text-blue-500">83%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Velocity */}
                <div className="p-3 border border-border rounded-md">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Velocity</span>
                    <Tooltip text="Story points completed per sprint">
                      <HelpCircle className="w-3 h-3 text-muted-foreground" />
                    </Tooltip>
                  </div>
                  <div className="flex items-center justify-center my-3">
                    <div className="text-center">
                      <div className="text-3xl font-bold flex items-center gap-2">
                        {mockData.personalFocus.metrics.velocity}
                        <span className="text-xs text-muted-foreground">points</span>
                      </div>
                      <div className="flex items-center justify-center mt-2 text-green-400">
                        <TrendingUp className="w-4 h-4 mr-1" />
                        <span className="text-sm">+3 from last sprint</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Team Average: 12</span>
                    <span>Your Trend: Increasing</span>
                  </div>
                </div>
              </div>
            </div>
      
        {/* Recent Activity */}
        <div>
          <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Recent Activity</h2>
          <div className="space-y-3 sm:space-y-4">
            {activities.length > 0 ? (
              activities.map((activity) => (
                <div
                  key={activity.id}
                  className="bg-card p-3 sm:p-4 rounded-lg border border-border hover:bg-secondary/50 transition-colors cursor-pointer shadow-sm"
                  onClick={() => {
                    if (activity.type === 'issue') {
                      navigate.push(`/issues/${activity.target_id}`);
                    } else if (activity.type === 'pr') {
                      navigate.push(`/pull-requests/${activity.target_id}`);
                    }
                  }}
                >
                  <div className="flex items-start">
                    <div className="mr-2 sm:mr-3 mt-1">{getActivityIcon(activity.type)}</div>
                    <div>
                      <div className="text-sm sm:text-base font-medium">{activity.title}</div>
                      <div className="text-xs sm:text-sm text-muted-foreground mt-1">
                        {activity.actor?.full_name} • {activity.project?.title}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-card p-4 rounded-lg border border-border text-center">
                <div className="text-muted-foreground text-sm">No recent activity</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};