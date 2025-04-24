'use client';

import React from 'react';
import { Users, Star, Clock, Code } from 'lucide-react';

interface Reviewer {
  id: string;
  name: string;
  avatar: string;
  expertise: string[];
  recentActivity: string;
  availability: 'high' | 'medium' | 'low';
  relevanceScore: number;
}

export default function RecommendedReviewers() {
  const reviewers: Reviewer[] = [
    {
      id: '1',
      name: 'John Smith',
      avatar: 'JS',
      expertise: ['Authentication', 'OAuth', 'Security'],
      recentActivity: 'Reviewed 5 PRs this week',
      availability: 'medium',
      relevanceScore: 95
    },
    {
      id: '2',
      name: 'Alex Kim',
      avatar: 'AK',
      expertise: ['NextAuth', 'API Routes', 'Middleware'],
      recentActivity: 'Contributed to auth module last month',
      availability: 'high',
      relevanceScore: 92
    },
    {
      id: '3',
      name: 'Maria Patel',
      avatar: 'MP',
      expertise: ['React', 'TypeScript', 'UI Components'],
      recentActivity: 'Created LoginForm component',
      availability: 'medium',
      relevanceScore: 87
    },
    {
      id: '4',
      name: 'David Lee',
      avatar: 'DL',
      expertise: ['Testing', 'CI/CD', 'Performance'],
      recentActivity: 'Improved test coverage last week',
      availability: 'low',
      relevanceScore: 78
    }
  ];

  const getAvailabilityIcon = (availability: string) => {
    switch (availability) {
      case 'high':
        return <div className="w-2 h-2 rounded-full bg-green-500"></div>;
      case 'medium':
        return <div className="w-2 h-2 rounded-full bg-amber-500"></div>;
      case 'low':
        return <div className="w-2 h-2 rounded-full bg-red-500"></div>;
      default:
        return <div className="w-2 h-2 rounded-full bg-gray-500"></div>;
    }
  };

  const getAvailabilityText = (availability: string) => {
    switch (availability) {
      case 'high':
        return 'High Availability';
      case 'medium':
        return 'Medium Availability';
      case 'low':
        return 'Low Availability';
      default:
        return 'Unknown Availability';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Users className="text-violet-500 w-5 h-5" />
        <h3 className="font-semibold">Recommended Reviewers</h3>
      </div>
      
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">
          AI-suggested team members who would be most appropriate to review specific parts of the code.
        </p>
        
        <div className="space-y-3">
          {reviewers.map(reviewer => (
            <div key={reviewer.id} className="bg-card border border-border rounded-md p-3">
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-sm">
                    {reviewer.avatar}
                  </div>
                  <div>
                    <h4 className="font-medium text-sm">{reviewer.name}</h4>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      {getAvailabilityIcon(reviewer.availability)}
                      <span>{getAvailabilityText(reviewer.availability)}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                  <span className="text-sm font-medium">{reviewer.relevanceScore}%</span>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-1 mb-2">
                {reviewer.expertise.map((skill, index) => (
                  <span 
                    key={index} 
                    className="px-2 py-0.5 bg-primary/10 text-primary rounded-full text-xs"
                  >
                    {skill}
                  </span>
                ))}
              </div>
              
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="w-3 h-3" />
                <span>{reviewer.recentActivity}</span>
              </div>
            </div>
          ))}
        </div>
        
        <div className="flex justify-end">
          <button className="text-sm text-primary flex items-center gap-1">
            <Code className="w-4 h-4" />
            <span>Auto-assign reviewers</span>
          </button>
        </div>
      </div>
    </div>
  );
}
