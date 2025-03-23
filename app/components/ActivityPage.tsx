'use client';
import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from "next/navigation";
import {
  GitCommit,
  GitPullRequest,
  MessageSquare,
  Calendar,
  Clock,
  Search,
  Activity,
  ChevronDown
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useWorkspace } from '../contexts/WorkspaceContext';
import type { ActivityFeed } from '../types';
import type { Database } from '../types/database.types';

type ActivityRow = Database['public']['Tables']['activity_feed']['Row'];

export const ActivityPage = () => {
  const navigate = useRouter();
  const [filter, setFilter] = React.useState<'all' | 'unread' | 'mentions'>('all');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [activities, setActivities] = useState<ActivityFeed[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { currentWorkspace } = useWorkspace();
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 20;
  const pollInterval = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (!currentWorkspace?.id) return;

    const loadActivities = async (loadMore = false) => {
      try {
        if (!loadMore) {
          setLoading(true);
        }
        const currentPage = loadMore ? page + 1 : 0;

        let query = supabase
          .from('activity_feed')
          .select(`
            *,
            actor:profiles(*),
            project:projects(*)
          `)
          .eq('workspace_id', currentWorkspace.id)
          .order('created_at', { ascending: false })
          .range(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE - 1);

        // Apply filters
        if (filter === 'mentions') {
          query = query.eq('type', 'comment');
        }

        // Apply search
        if (searchQuery) {
          query = query.or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
        }

        const { data, error } = await query;

        if (error) throw error;

        if (data) {
          const typedData = data as unknown as ActivityFeed[];
          
          // Only update if data has actually changed
          setActivities(prev => {
            const newData = loadMore ? [...prev, ...typedData] : typedData;
            if (JSON.stringify(prev) === JSON.stringify(newData)) {
              return prev;
            }
            return newData;
          });
          
          setHasMore(data.length === PAGE_SIZE);
          setPage(currentPage);
        }
      } catch (error) {
        console.error('Error fetching activities:', error);
        setError('Failed to load activities');
      } finally {
        setLoading(false);
      }
    };

    // Initial load
    loadActivities();

    // Set up polling only for the first page
    pollInterval.current = setInterval(() => loadActivities(false), 10000);

    return () => {
      if (pollInterval.current) {
        clearInterval(pollInterval.current);
      }
    };
  }, [currentWorkspace?.id, filter, searchQuery]);

  const getActivityIcon = (type: ActivityFeed['type']) => {
    switch (type) {
      case 'commit':
        return <GitCommit className="w-4 h-4 text-green-400" />;
      case 'pr':
        return <GitPullRequest className="w-4 h-4 text-purple-400" />;
      case 'comment':
        return <MessageSquare className="w-4 h-4 text-blue-400" />;
      case 'status_change':
        return <Activity className="w-4 h-4 text-indigo-400" />;
      default:
        return <Activity className="w-4 h-4 text-gray-400" />;
    }
  };

  const getActivityTypeColor = (type: ActivityFeed['type']) => {
    switch (type) {
      case 'commit':
        return 'bg-green-500/20 text-green-400';
      case 'pr':
        return 'bg-purple-500/20 text-purple-400';
      case 'comment':
        return 'bg-blue-500/20 text-blue-400';
      case 'status_change':
        return 'bg-primary-500/20 text-indigo-400';
      default:
        return 'bg-gray-500/20 text-gray-400';
    }
  };

  const formatTimeAgo = (date: string) => {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'just now';
  };

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center text-red-400">
        {error}
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-hidden flex flex-col">
      <header className="h-14 border-b border-muted flex items-center justify-between px-6">
        <h2 className="text-lg font-semibold">Activity</h2>
        <div className="flex items-center gap-4">
          <div className="flex rounded-md overflow-hidden border border-border">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 text-sm ${
                filter === 'all' ? 'bg-border text-foreground' : 'text-gray-400 hover:bg-muted'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('mentions')}
              className={`px-3 py-1.5 text-sm ${
                filter === 'mentions' ? 'bg-border text-foreground' : 'text-gray-400 hover:bg-muted'
              }`}
            >
              Mentions
            </button>
          </div>
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search activity..."
              className="w-64 pl-10 pr-4 py-1.5 bg-muted border border-border rounded-md text-sm focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-auto">
        <div className="max-w-4xl mx-auto py-6">
          <div className="space-y-4">
            {activities.map((activity) => (
              <div
                key={activity.id}
                className={`p-4 bg-muted border border-muted rounded-lg hover:border-border transition-colors cursor-pointer`}
                onClick={() => {
                  if (activity.metadata && activity.metadata.issue_id) {
                    navigate.push(`/issues/${activity.metadata.issue_id}`);
                  }
                }}
              >
                <div className="flex items-start gap-4">
                  <div className={`p-2 rounded ${getActivityTypeColor(activity.type)}`}>
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="font-medium">
                          {activity.title}
                        </h3>
                        <p className="text-sm text-gray-400 mt-1">
                          {activity.description}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-gray-500">
                        <Clock className="w-4 h-4" />
                        {formatTimeAgo(activity.created_at)}
                      </div>
                    </div>
                    <div className="mt-3 flex items-center gap-4">
                      <div className="flex items-center gap-2 text-sm text-gray-400">
                        <Calendar className="w-4 h-4" />
                        {new Date(activity.created_at).toLocaleDateString()}
                      </div>
                      {activity.actor && (
                        <span className="text-sm text-gray-400">
                          by {activity.actor.full_name}
                        </span>
                      )}
                      {activity.project && (
                        <span className="text-sm text-gray-400">
                          in {activity.project.title}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {loading && (
              <div className="text-center py-4 text-gray-400">
                Loading...
              </div>
            )}
            {!loading && hasMore && (
              <button
                onClick={() => loadActivities(true)}
                className="w-full py-3 bg-muted border border-muted rounded-lg hover:bg-secondary transition-colors text-gray-400"
              >
                Load More
                <ChevronDown className="w-4 h-4 inline-block ml-2" />
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};