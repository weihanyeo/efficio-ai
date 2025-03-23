'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, X, GitCommit, GitPullRequest, MessageSquare, Bot, GitBranch } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useWorkspace } from '../contexts/WorkspaceContext';
import type { Notification, SupabaseError } from '../types';

export const NotificationsPanel = () => {
  const navigate = useRouter();
  const { currentWorkspace } = useWorkspace();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (currentWorkspace?.id) {
      fetchNotifications();
      subscribeToNewNotifications();
    }

    return () => {
      supabase.removeAllChannels();
    };
  }, [currentWorkspace?.id]);

  const fetchNotifications = async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) throw new Error('No authenticated user');

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('workspace_id', currentWorkspace?.id)
        .eq('recipient_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50) as { data: Notification[] | null; error: SupabaseError | null };

      if (error) throw error;

      if (data) {
        setNotifications(data);
        setUnreadCount(data.filter(n => !n.is_read).length);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setError('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const subscribeToNewNotifications = () => {
    const channel = supabase
      .channel('notification_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `workspace_id=eq.${currentWorkspace?.id}`
        },
        async (payload) => {
          const { data } = await supabase
            .from('notifications')
            .select('*')
            .eq('id', payload.new.id)
            .single() as { data: Notification };

          if (data) {
            setNotifications(prev => [data, ...prev]);
            if (!data.is_read) {
              setUnreadCount(prev => prev + 1);
            }
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      if (error) throw error;

      setNotifications(prev =>
        prev.map(n =>
          n.id === notificationId ? { ...n, is_read: true } : n
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('workspace_id', currentWorkspace?.id)
        .eq('is_read', false);

      if (error) throw error;

      setNotifications(prev =>
        prev.map(n => ({ ...n, is_read: true }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'commit':
        return <GitCommit className="w-4 h-4 text-green-400" />;
      case 'pr':
        return <GitPullRequest className="w-4 h-4 text-purple-400" />;
      case 'mention':
        return <MessageSquare className="w-4 h-4 text-blue-400" />;
      case 'ai':
        return <Bot className="w-4 h-4 text-indigo-400" />;
      default:
        return <GitBranch className="w-4 h-4 text-gray-400" />;
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
    return null;
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 hover:bg-muted rounded-md group"
      >
        <Bell className="w-4 h-4 text-gray-400 group-hover:text-foreground" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-indigo-500 text-foreground text-xs rounded-full flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-muted border border-muted rounded-lg shadow-lg z-50">
          <div className="p-3 border-b border-muted flex items-center justify-between">
            <h3 className="font-medium">Notifications</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-muted rounded-md"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="max-h-[400px] overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-gray-400">
                Loading...
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-400">
                No notifications
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-3 hover:bg-secondary cursor-pointer ${
                    !notification.is_read ? 'bg-secondary' : ''
                  }`}
                  onClick={() => {
                    if (!notification.is_read) {
                      handleMarkAsRead(notification.id);
                    }
                    if (notification.action_url) {
                      navigate.push(notification.action_url);
                    }
                    setIsOpen(false);
                  }}
                >
                  <div className="flex items-start gap-3">
                    {getNotificationIcon(notification.type)}
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${!notification.is_read ? 'text-foreground' : 'text-gray-300'}`}>
                        {notification.title}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {notification.description}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatTimeAgo(notification.created_at)}
                      </p>
                    </div>
                    {!notification.is_read && (
                      <div className="w-2 h-2 rounded-full bg-indigo-500 mt-1" />
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="p-3 border-t border-muted flex justify-between">
            <button
              onClick={handleMarkAllAsRead}
              className="text-sm text-indigo-400 hover:text-indigo-300"
            >
              Mark all as read
            </button>
            <button
              onClick={() => navigate.push('/activity')}
              className="text-sm text-gray-400 hover:text-gray-300"
            >
              View all
            </button>
          </div>
        </div>
      )}
    </div>
  );
};