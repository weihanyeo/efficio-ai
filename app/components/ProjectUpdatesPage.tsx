"use client"
import React, { useState, useEffect } from 'react';
import { Download, FileText, GitCommit, Calendar, Clock, Filter, Search, ArrowUpRight, BarChart2, Printer, RefreshCw } from 'lucide-react';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { projectsApi } from '../lib/api';
import { UpdateDetailModal } from './UpdateDetailModal';

interface ProjectUpdate {
  id: string;
  type: 'commit' | 'issue' | 'status' | 'comment';
  title: string;
  description: string;
  project: string;
  author: string;
  timestamp: Date;
  details?: {
    [key: string]: any;
  };
}

const mockUpdates: ProjectUpdate[] = [
  {
    id: '1',
    type: 'commit',
    title: 'Implement user authentication',
    description: 'Added OAuth2 integration and JWT token handling',
    project: 'Frontend App',
    author: 'Alice Johnson',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
    details: {
      commitHash: 'abc123',
      branch: 'feature/auth',
      filesChanged: 5
    }
  },
  {
    id: '2',
    type: 'issue',
    title: 'Fix login page responsiveness',
    description: 'Updated layout to work better on mobile devices',
    project: 'Frontend App',
    author: 'Bob Smith',
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
    details: {
      status: 'In Progress',
      priority: 'High',
      assignee: 'Bob Smith'
    }
  },
  {
    id: '3',
    type: 'status',
    title: 'Project status updated',
    description: 'Project moved from Planning to In Progress',
    project: 'Frontend App',
    author: 'Carol White',
    timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    details: {
      oldStatus: 'Planning',
      newStatus: 'In Progress',
      reason: 'Development phase started'
    }
  }
];

const UpdateTypeIcon = ({ type }: { type: ProjectUpdate['type'] }) => {
  switch (type) {
    case 'commit':
      return <GitCommit className="w-4 h-4 text-green-400" />;
    case 'issue':
      return <FileText className="w-4 h-4 text-blue-400" />;
    case 'status':
      return <RefreshCw className="w-4 h-4 text-purple-400" />;
    case 'comment':
      return <FileText className="w-4 h-4 text-orange-400" />;
    default:
      return <FileText className="w-4 h-4 text-gray-400" />;
  }
};

const UpdateCard = ({ update, onClick }: { update: ProjectUpdate; onClick: (update: ProjectUpdate) => void }) => {
  const [showDetails, setShowDetails] = useState(false);

  const formatTimeAgo = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'just now';
  };

  return (
    <div 
      className="p-4 bg-card border border-border rounded-lg hover:bg-secondary transition-colors cursor-pointer group"
      onClick={() => onClick(update)}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded bg-secondary">
            <UpdateTypeIcon type={update.type} />
          </div>
          <div>
            <h3 className="font-medium group-hover:text-primary transition-colors">
              {update.title}
            </h3>
            <p className="text-sm text-gray-400 mt-1">{update.description}</p>
            <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>{update.timestamp.toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>{formatTimeAgo(update.timestamp)}</span>
              </div>
            </div>
          </div>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowDetails(!showDetails);
          }}
          className="p-2 hover:bg-secondary rounded-md"
        >
          <ArrowUpRight className="w-4 h-4 text-gray-400" />
        </button>
      </div>

      {showDetails && update.details && (
        <div className="mt-4 pt-4 border-t border-border">
          <h4 className="text-sm font-medium mb-2">Details</h4>
          <div className="space-y-2">
            {Object.entries(update.details).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between text-sm">
                <span className="text-gray-400">{key}</span>
                <span>{value}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export const ProjectUpdatesPage= () => {
  const [updates, setUpdates] = useState<ProjectUpdate[]>(mockUpdates);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'commits' | 'issues' | 'status'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<'day' | 'week' | 'month'>('week');
  const { currentWorkspace } = useWorkspace();
  const [selectedUpdate, setSelectedUpdate] = useState<ProjectUpdate | null>(null);

  useEffect(() => {
    if (!currentWorkspace) return;

    const loadUpdates = async () => {
      setLoading(true);
      try {
        // In a real app, you would fetch updates from your API
        // const data = await updatesApi.list(currentWorkspace.id);
        // setUpdates(data);
      } catch (err) {
        console.error('Failed to load updates:', err);
      } finally {
        setLoading(false);
      }
    };

    loadUpdates();
  }, [currentWorkspace]);

  const filteredUpdates = updates.filter(update => {
    if (filter !== 'all' && update.type !== filter) return false;
    if (searchQuery) {
      return (
        update.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        update.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    return true;
  });

  const handleGenerateReport = async () => {
    try {
      // In a real app, you would call your API to generate the report
      console.log('Generating report...');
    } catch (err) {
      console.error('Failed to generate report:', err);
    }
  };

  const handleDownloadReport = async () => {
    try {
      // In a real app, you would download the report file
      console.log('Downloading report...');
    } catch (err) {
      console.error('Failed to download report:', err);
    }
  };

  const handleUpdateClick = (update: ProjectUpdate) => {
    setSelectedUpdate(update);
  };

  const handleCloseModal = () => {
    setSelectedUpdate(null);
  };

  return (
    <div className="flex-1 overflow-hidden flex flex-col">
      <header className="h-14 border-b border-border flex items-center justify-between px-6">
        <h2 className="text-lg font-semibold">Project Updates</h2>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search updates..."
              className="w-64 pl-10 pr-4 py-1.5 bg-secondary border border-border rounded-md text-sm focus:outline-none focus:ring-primary focus:ring-2"
            />
          </div>
          <button
            onClick={handleGenerateReport}
            className="flex items-center gap-2 px-3 py-1.5 bg-primary text-primary-foreground rounded-md hover:bg-primary/80"
          >
            <BarChart2 className="w-4 h-4" />
            Generate Report
          </button>
          <button
            onClick={handleDownloadReport}
            className="flex items-center gap-2 px-3 py-1.5 bg-secondary rounded-md text-muted-foreground hover:bg-muted"
          >
            <Download className="w-4 h-4" />
            Download Report
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-auto">
        <div className="p-6">
          {/* Filters */}
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as typeof filter)}
                className="px-3 py-1.5 bg-secondary border border-border rounded-md text-sm focus:outline-none focus:ring-primary focus:ring-2"
              >
                <option value="all">All Updates</option>
                <option value="commits">Commits</option>
                <option value="issues">Issues</option>
                <option value="status">Status Changes</option>
              </select>
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value as typeof dateRange)}
                className="px-3 py-1.5 bg-secondary border border-border rounded-md text-sm focus:outline-none focus:ring-primary focus:ring-2"
              >
                <option value="day">Last 24 Hours</option>
                <option value="week">Last Week</option>
                <option value="month">Last Month</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400">Project:</span>
              <select
                value={selectedProject || ''}
                onChange={(e) => setSelectedProject(e.target.value || null)}
                className="px-3 py-1.5 bg-secondary border border-border rounded-md text-sm focus:outline-none focus:ring-primary focus:ring-2"
              >
                <option value="">All Projects</option>
                <option value="1">Frontend App</option>
                <option value="2">Backend API</option>
              </select>
            </div>
          </div>

          {/* Updates List */}
          <div className="space-y-4">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
              </div>
            ) : filteredUpdates.length > 0 ? (
              filteredUpdates.map((update) => (
                <UpdateCard key={update.id} update={update} onClick={handleUpdateClick} />
              ))
            ) : (
              <div className="text-center py-12 text-gray-400">
                No updates found
              </div>
            )}
          </div>
        </div>
      </div>

      {selectedUpdate && (
        <UpdateDetailModal update={selectedUpdate} onClose={handleCloseModal} />
      )}
    </div>
  );
};