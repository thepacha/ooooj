import { useState, useEffect } from 'react';
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

  useEffect(() => {
    if (!userId) return;

    // Generate recurring notifications
    const lastGenStr = localStorage.getItem(LAST_GEN_KEY);
    const lastGen = lastGenStr ? JSON.parse(lastGenStr) : {
      fourHour: 0,
      daily: 0,
      weekly: 0,
      monthly: 0
    };

    const now = Date.now();
    const newNotifications: Omit<Notification, 'id'>[] = [];
    const updatedGen = { ...lastGen };

    // 4 hours = 4 * 60 * 60 * 1000 = 14400000
    if (now - lastGen.fourHour > 14400000) {
      newNotifications.push({
        type: 'performance',
        title: '4-Hour Performance Update',
        message: 'Your team has completed 12 evaluations in the last 4 hours. Average score: 85%.',
        time: 'Just now',
        timestamp: now,
        read: false,
        link: 'dashboard'
      });
      updatedGen.fourHour = now;
    }

    // Daily = 24 * 60 * 60 * 1000 = 86400000
    if (now - lastGen.daily > 86400000) {
      newNotifications.push({
        type: 'performance',
        title: 'Daily Performance Summary',
        message: "Yesterday's top performer was Sarah Smith with a 92% average score.",
        time: 'Just now',
        timestamp: now,
        read: false,
        link: 'roster'
      });
      updatedGen.daily = now;
    }

    // Weekly = 7 * 24 * 60 * 60 * 1000 = 604800000
    if (now - lastGen.weekly > 604800000) {
      newNotifications.push({
        type: 'performance',
        title: 'Weekly Performance Report',
        message: "Your team's weekly average improved by 3% compared to last week.",
        time: 'Just now',
        timestamp: now,
        read: false,
        link: 'dashboard'
      });
      updatedGen.weekly = now;
    }

    // Monthly = 30 * 24 * 60 * 60 * 1000 = 2592000000
    if (now - lastGen.monthly > 2592000000) {
      newNotifications.push({
        type: 'performance',
        title: 'Monthly Performance Review',
        message: 'Monthly goals achieved! 450 total evaluations completed this month.',
        time: 'Just now',
        timestamp: now,
        read: false,
        link: 'history'
      });
      updatedGen.monthly = now;
    }

    if (newNotifications.length > 0) {
      const insertNotifications = async () => {
        const recordsToInsert = newNotifications.map(n => ({
          user_id: userId,
          type: n.type,
          title: n.title,
          message: n.message,
          time: n.time,
          timestamp: n.timestamp,
          read: n.read,
          link: n.link,
          target_id: n.targetId
        }));

        const { error } = await supabase
          .from('notifications')
          .insert(recordsToInsert);

        if (error) {
          console.error('Error inserting recurring notifications:', error);
        } else {
          localStorage.setItem(LAST_GEN_KEY, JSON.stringify(updatedGen));
        }
      };
      
      insertNotifications();
    }
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
    
    const newNotif = {
      user_id: userId,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      time: 'Just now',
      timestamp: Date.now(),
      read: false,
      link: notification.link,
      target_id: notification.targetId
    };
    
    const { error } = await supabase
      .from('notifications')
      .insert([newNotif]);
      
    if (error) {
      console.error('Error adding notification:', error);
    }
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
