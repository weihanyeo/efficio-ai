"use client"
import React from 'react';
import { X, Download, GitCommit, Calendar, Clock, User, GitBranch, FileText, RefreshCw } from 'lucide-react';

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

interface UpdateDetailModalProps {
  update: ProjectUpdate;
  onClose: () => void;
}

const UpdateTypeIcon = ({ type }: { type: ProjectUpdate['type'] }) => {
  switch (type) {
    case 'commit':
      return <GitCommit className="w-5 h-5 text-green-400" />;
    case 'issue':
      return <FileText className="w-5 h-5 text-blue-400" />;
    case 'status':
      return <RefreshCw className="w-5 h-5 text-purple-400" />;
    case 'comment':
      return <FileText className="w-5 h-5 text-orange-400" />;
    default:
      return <FileText className="w-5 h-5 text-gray-400" />;
  }
};

export const UpdateDetailModal = ({ update, onClose }: UpdateDetailModalProps) => {
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="w-full max-w-2xl bg-background rounded-lg" onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded bg-border">
              <UpdateTypeIcon type={update.type} />
            </div>
            <div>
              <h2 className="text-lg font-semibold">{update.title}</h2>
              <div className="flex items-center gap-4 mt-1 text-sm text-gray-400">
                <span>{update.project}</span>
                <span>•</span>
                <span>{formatTimeAgo(update.timestamp)}</span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-border rounded-md"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          <div className="space-y-6">
            {/* Description */}
            <div>
              <h3 className="text-sm font-medium text-gray-400 mb-2">Description</h3>
              <p className="text-gray-300">{update.description}</p>
            </div>

            {/* Metadata */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-2 text-sm">
                  <User className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-400">Author</span>
                </div>
                <p className="mt-1">{update.author}</p>
              </div>
              <div className="p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-400">Date</span>
                </div>
                <p className="mt-1">{update.timestamp.toLocaleDateString()}</p>
              </div>
            </div>

            {/* Details */}
            {update.details && (
              <div>
                <h3 className="text-sm font-medium text-gray-400 mb-3">Details</h3>
                <div className="space-y-2">
                  {Object.entries(update.details).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <span className="text-gray-400">{key}</span>
                      <span>{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Related Items */}
            {update.type === 'commit' && (
              <div>
                <h3 className="text-sm font-medium text-gray-400 mb-3">Related Changes</h3>
                <div className="space-y-2">
                  <div className="p-3 bg-muted rounded-lg flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <GitBranch className="w-4 h-4 text-gray-400" />
                      <span>feature/auth</span>
                    </div>
                    <span className="text-sm text-gray-400">5 files changed</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="mt-6 flex justify-end">
            <button className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-muted/80">
              <Download className="w-4 h-4" />
              Download Details
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};