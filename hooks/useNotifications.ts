import { useState, useEffect } from 'react';
import { generateId } from '../lib/utils';

export interface Notification {
  id: string;
  type: 'assignment' | 'feedback' | 'alert' | 'performance' | 'system';
  title: string;
  message: string;
  time: string;
  timestamp: number;
  read: boolean;
}

const STORAGE_KEY = 'revuqa_notifications';
const LAST_GEN_KEY = 'revuqa_last_gen';

const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: '1',
    type: 'assignment',
    title: 'New Assignment',
    message: 'You have been assigned to review "Q3 Sales Call - John Doe".',
    time: '10m ago',
    timestamp: Date.now() - 10 * 60 * 1000,
    read: false,
  },
  {
    id: '2',
    type: 'feedback',
    title: 'Feedback Ready',
    message: 'Your recent roleplay session has been evaluated.',
    time: '1h ago',
    timestamp: Date.now() - 60 * 60 * 1000,
    read: false,
  },
  {
    id: '3',
    type: 'alert',
    title: 'Score Below Threshold',
    message: 'Agent Sarah Smith scored 65% on Objection Handling.',
    time: '2h ago',
    timestamp: Date.now() - 2 * 60 * 60 * 1000,
    read: true,
  }
];

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        console.error('Failed to parse notifications', e);
      }
    }
    return MOCK_NOTIFICATIONS;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    // Generate recurring notifications
    const lastGenStr = localStorage.getItem(LAST_GEN_KEY);
    const lastGen = lastGenStr ? JSON.parse(lastGenStr) : {
      fourHour: 0,
      daily: 0,
      weekly: 0,
      monthly: 0
    };

    const now = Date.now();
    const newNotifications: Notification[] = [];
    const updatedGen = { ...lastGen };

    // 4 hours = 4 * 60 * 60 * 1000 = 14400000
    if (now - lastGen.fourHour > 14400000) {
      newNotifications.push({
        id: generateId(),
        type: 'performance',
        title: '4-Hour Performance Update',
        message: 'Your team has completed 12 evaluations in the last 4 hours. Average score: 85%.',
        time: 'Just now',
        timestamp: now,
        read: false
      });
      updatedGen.fourHour = now;
    }

    // Daily = 24 * 60 * 60 * 1000 = 86400000
    if (now - lastGen.daily > 86400000) {
      newNotifications.push({
        id: generateId(),
        type: 'performance',
        title: 'Daily Performance Summary',
        message: 'Yesterday\'s top performer was Sarah Smith with a 92% average score.',
        time: 'Just now',
        timestamp: now,
        read: false
      });
      updatedGen.daily = now;
    }

    // Weekly = 7 * 24 * 60 * 60 * 1000 = 604800000
    if (now - lastGen.weekly > 604800000) {
      newNotifications.push({
        id: generateId(),
        type: 'performance',
        title: 'Weekly Performance Report',
        message: 'Your team\'s weekly average improved by 3% compared to last week.',
        time: 'Just now',
        timestamp: now,
        read: false
      });
      updatedGen.weekly = now;
    }

    // Monthly = 30 * 24 * 60 * 60 * 1000 = 2592000000
    if (now - lastGen.monthly > 2592000000) {
      newNotifications.push({
        id: generateId(),
        type: 'performance',
        title: 'Monthly Performance Review',
        message: 'Monthly goals achieved! 450 total evaluations completed this month.',
        time: 'Just now',
        timestamp: now,
        read: false
      });
      updatedGen.monthly = now;
    }

    if (newNotifications.length > 0) {
      setNotifications(prev => {
        const updated = [...newNotifications, ...prev];
        // Keep only top 50 notifications to prevent localstorage bloat
        return updated.slice(0, 50);
      });
      localStorage.setItem(LAST_GEN_KEY, JSON.stringify(updatedGen));
    }
  }, []);

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const addNotification = (notification: Omit<Notification, 'id' | 'timestamp' | 'time' | 'read'>) => {
    const newNotif: Notification = {
      ...notification,
      id: generateId(),
      timestamp: Date.now(),
      time: 'Just now',
      read: false
    };
    setNotifications(prev => [newNotif, ...prev].slice(0, 50));
  };

  return {
    notifications,
    markAsRead,
    markAllAsRead,
    addNotification
  };
}
