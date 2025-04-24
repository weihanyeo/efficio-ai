'use client';

import React from 'react';
import { GitCommit, Clock, GitMerge, GitPullRequest } from 'lucide-react';

interface TimelineEvent {
  id: string;
  type: 'commit' | 'review' | 'comment' | 'merge';
  title: string;
  description: string;
  author: string;
  time: string;
  avatar: string;
}

export default function TimelineView() {
  const timelineEvents: TimelineEvent[] = [
    {
      id: '1',
      type: 'commit',
      title: 'Initial implementation of AuthProvider',
      description: 'Created the basic structure for authentication context',
      author: 'Jane Doe',
      time: '2 days ago',
      avatar: 'JD'
    },
    {
      id: '2',
      type: 'commit',
      title: 'Add NextAuth configuration',
      description: 'Set up OAuth providers and callbacks',
      author: 'Jane Doe',
      time: '2 days ago',
      avatar: 'JD'
    },
    {
      id: '3',
      type: 'commit',
      title: 'Create login form components',
      description: 'UI for authentication with provider buttons',
      author: 'Jane Doe',
      time: '1 day ago',
      avatar: 'JD'
    },
    {
      id: '4',
      type: 'review',
      title: 'Code review requested',
      description: 'Requested review from John Smith and Alex Kim',
      author: 'Jane Doe',
      time: '1 day ago',
      avatar: 'JD'
    },
    {
      id: '5',
      type: 'comment',
      title: 'Review comment',
      description: 'Consider adding refresh token handling for better session management',
      author: 'Alex Kim',
      time: '22 hours ago',
      avatar: 'AK'
    },
    {
      id: '6',
      type: 'commit',
      title: 'Add refresh token handling',
      description: 'Implemented token refresh mechanism',
      author: 'Jane Doe',
      time: '18 hours ago',
      avatar: 'JD'
    },
    {
      id: '7',
      type: 'commit',
      title: 'Implement route protection middleware',
      description: 'Added middleware for protected routes',
      author: 'Jane Doe',
      time: '12 hours ago',
      avatar: 'JD'
    },
    {
      id: '8',
      type: 'review',
      title: 'Approved',
      description: 'Changes look good!',
      author: 'John Smith',
      time: '5 hours ago',
      avatar: 'JS'
    }
  ];

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'commit':
        return <GitCommit className="w-4 h-4" />;
      case 'review':
        return <GitPullRequest className="w-4 h-4" />;
      case 'comment':
        return <Clock className="w-4 h-4" />;
      case 'merge':
        return <GitMerge className="w-4 h-4" />;
      default:
        return <GitCommit className="w-4 h-4" />;
    }
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case 'commit':
        return 'bg-blue-500';
      case 'review':
        return 'bg-purple-500';
      case 'comment':
        return 'bg-amber-500';
      case 'merge':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Clock className="text-purple-500 w-5 h-5" />
        <h3 className="font-semibold">Timeline View</h3>
      </div>
      
      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border"></div>
        
        <div className="space-y-4 ml-4 pl-6">
          {timelineEvents.map((event, index) => (
            <div key={event.id} className="relative">
              {/* Timeline dot */}
              <div className={`absolute -left-6 w-4 h-4 rounded-full ${getEventColor(event.type)} flex items-center justify-center text-white`}>
                {getEventIcon(event.type)}
              </div>
              
              <div className="bg-card border border-border rounded-md p-3">
                <div className="flex justify-between items-start mb-1">
                  <h4 className="font-medium text-sm">{event.title}</h4>
                  <span className="text-xs text-muted-foreground">{event.time}</span>
                </div>
                <p className="text-sm text-muted-foreground mb-2">{event.description}</p>
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-xs">
                    {event.avatar}
                  </div>
                  <span className="text-xs">{event.author}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
