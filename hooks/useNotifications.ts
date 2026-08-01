import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';

export interface Notification {
  id: string;
  type: 'assignment' | 'feedback' | 'alert' | 'performance' | 'system';
  title: string;
  message: string;
  time: string;
  timestamp: number;
  read: boolean;
  link?: 'dashboard' | 'analyze' | 'history' | 'settings' | 'evaluation' | 'usage' | 'roster' | 'pricing' | 'training' | 'admin' | 'terms' | 'privacy' | 'account' | 'notifications';
  targetId?: string;
}

const LAST_GEN_KEY = 'revuqa_last_gen';

export function useNotifications(userId?: string) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const pendingNotificationsRef = useRef<Omit<Notification, 'id' | 'timestamp' | 'time' | 'read'>[]>([]);
  const batchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch notifications from Supabase
  useEffect(() => {
    if (!userId) {
      setNotifications([]);
      return;
    }

    const fetchNotifications = async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('timestamp', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Failed to fetch notifications:', error);
        return;
      }

      if (data) {
        setNotifications(data.map(n => ({
          id: n.id,
          type: n.type,
          title: n.title,
          message: n.message,
          time: n.time,
          timestamp: n.timestamp,
          read: n.read,
          link: n.link,
          targetId: n.target_id
        })));
      }
    };

    fetchNotifications();

    // Set up realtime subscription
    const subscription = supabase
      .channel('notifications_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` }, 
        () => {
          fetchNotifications();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [userId]);

  const markAsRead = async (id: string) => {
    if (!userId) return;
    
    // Optimistic update
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', id)
      .eq('user_id', userId);
      
    if (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    if (!userId) return;
    
    // Optimistic update
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', userId)
      .eq('read', false);
      
    if (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const deleteNotification = async (id: string) => {
    if (!userId) return;
    
    // Optimistic update
    setNotifications(prev => prev.filter(n => n.id !== id));
    
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);
      
    if (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const deleteAllNotifications = async () => {
    if (!userId) return;
    
    // Optimistic update
    setNotifications([]);
    
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('user_id', userId);
      
    if (error) {
      console.error('Error deleting all notifications:', error);
    }
  };

  const addNotification = async (notification: Omit<Notification, 'id' | 'timestamp' | 'time' | 'read'>) => {
    if (!userId) return;
    
    pendingNotificationsRef.current.push(notification);

    if (batchTimeoutRef.current) {
      clearTimeout(batchTimeoutRef.current);
    }

    batchTimeoutRef.current = setTimeout(async () => {
      const pending = [...pendingNotificationsRef.current];
      pendingNotificationsRef.current = [];

      if (pending.length === 0) return;

      const grouped: any[] = [];
      const analysisComplete = pending.filter(n => n.title === 'Analysis Complete');
      const others = pending.filter(n => n.title !== 'Analysis Complete');

      if (analysisComplete.length > 1) {
        grouped.push({
          user_id: userId,
          type: 'feedback',
          title: 'Batch Analysis Complete',
          message: `Your AI analysis for ${analysisComplete.length} recent support tickets is complete.`,
          time: 'Just now',
          timestamp: Date.now(),
          read: false,
          link: 'history'
        });
      } else if (analysisComplete.length === 1) {
        grouped.push({
          user_id: userId,
          type: analysisComplete[0].type,
          title: analysisComplete[0].title,
          message: analysisComplete[0].message,
          time: 'Just now',
          timestamp: Date.now(),
          read: false,
          link: analysisComplete[0].link,
          target_id: analysisComplete[0].targetId
        });
      }

      others.forEach(n => {
        grouped.push({
          user_id: userId,
          type: n.type,
          title: n.title,
          message: n.message,
          time: 'Just now',
          timestamp: Date.now(),
          read: false,
          link: n.link,
          target_id: n.targetId
        });
      });

      const { error } = await supabase
        .from('notifications')
        .insert(grouped);
        
      if (error) {
        console.error('Error adding notifications:', error);
      }
    }, 1500); // 1.5 second batch window
  };

  return {
    notifications,
    markAsRead,
    markAllAsRead,
    addNotification,
    deleteNotification,
    deleteAllNotifications
  };
}
