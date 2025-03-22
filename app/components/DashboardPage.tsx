'use client';

import React from "react";
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
  Activity
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

export const DashboardPage: React.FC<{ className?: string }> = ({ className = "" }) => {
  const navigate = useRouter();
  const { currentWorkspace } = useWorkspace();

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
    <div className="flex justify-center w-full">
      <div className="w-full max-w-7xl p-6 space-y-8">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Projects */}
          <div className="bg-card p-5 rounded-lg border border-border shadow-sm hover:border-muted transition-colors">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-muted-foreground">Projects</h3>
              <GitPullRequest className="w-5 h-5 text-primary" />
            </div>
            <div className="flex items-baseline">
              <span className="text-3xl font-semibold">{stats.active_projects}</span>
              <span className="text-sm text-muted-foreground ml-2">/ {stats.total_projects} total</span>
            </div>
          </div>

          {/* Issues */}
          <div className="bg-card p-5 rounded-lg border border-border shadow-sm hover:border-muted transition-colors">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-muted-foreground">Issues</h3>
              <AlertCircle className="w-5 h-5 text-yellow-400" />
            </div>
            <div className="flex items-baseline">
              <span className="text-3xl font-semibold">{stats.open_issues}</span>
              <span className="text-sm text-muted-foreground ml-2">/ {stats.total_issues} total</span>
            </div>
          </div>

          {/* Velocity */}
          <div className="bg-card p-5 rounded-lg border border-border shadow-sm hover:border-muted transition-colors">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-muted-foreground">Velocity</h3>
              <Zap className="w-5 h-5 text-yellow-400" />
            </div>
            <div className="flex items-center">
              <span className="text-3xl font-semibold">{stats?.velocity?.current || 0}</span>
              <div className="flex items-center ml-2">
                {stats?.velocity?.trend && getTrendIcon(stats.velocity.trend)}
                <span className="text-sm text-muted-foreground ml-1">
                  vs {stats?.velocity?.previous || 0}
                </span>
              </div>
            </div>
          </div>

          {/* Code Quality */}
          <div className="bg-card p-5 rounded-lg border border-border shadow-sm hover:border-muted transition-colors">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-muted-foreground">Code Quality</h3>
              <BarChart className="w-5 h-5 text-blue-400" />
            </div>
            <div className="flex items-center">
              <span className="text-3xl font-semibold">{stats?.code_quality?.score || 0}%</span>
              <div className="flex items-center ml-2">
                {stats?.code_quality?.trend && getTrendIcon(stats.code_quality.trend)}
                <span className="text-sm text-muted-foreground ml-1">
                  vs {stats?.code_quality?.previous || 0}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
          <div className="space-y-4">
            {activities.length > 0 ? (
              activities.map((activity) => (
                <div
                  key={activity.id}
                  className="bg-card p-4 rounded-lg border border-border hover:bg-secondary/50 transition-colors cursor-pointer shadow-sm"
                  onClick={() => {
                    if (activity.type === 'issue') {
                      navigate.push(`/issues/${activity.target_id}`);
                    } else if (activity.type === 'pull_request') {
                      navigate.push(`/pull-requests/${activity.target_id}`);
                    }
                  }}
                >
                  <div className="flex items-start">
                    <div className="mr-3 mt-1">{getActivityIcon(activity.type)}</div>
                    <div>
                      <div className="font-medium">{activity.title}</div>
                      <div className="text-sm text-muted-foreground mt-1">
                        {activity.actor?.full_name} • {activity.project?.title}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-card p-5 rounded-lg border border-border text-center text-muted-foreground">
                No recent activity found
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}