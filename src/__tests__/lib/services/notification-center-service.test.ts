import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NotificationCenterService } from '../../../lib/services/notification-center-service';

// Mock the database
const mockDb = {
  select: vi.fn(),
  insert: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
};

vi.mock('../../../lib/db', () => ({
  db: mockDb
}));

vi.mock('../../../lib/db/schema', () => ({
  alerts: {
    id: 'id',
    userId: 'userId',
    alertType: 'alertType',
    message: 'message',
    status: 'status',
    priority: 'priority',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  },
  notificationPreferences: {
    id: 'id',
    userId: 'userId',
    alertType: 'alertType',
    emailEnabled: 'emailEnabled',
    pushEnabled: 'pushEnabled',
    inAppEnabled: 'inAppEnabled'
  },
  notificationHistory: {
    id: 'id',
    userId: 'userId',
    notificationId: 'notificationId',
    action: 'action',
    timestamp: 'timestamp'
  }
}));

describe('NotificationCenterService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getNotifications', () => {
    it('should retrieve notifications with default parameters', async () => {
      const mockNotifications: any[] = [
        {
          id: '1',
          userId: 'user123',
          alertType: 'credit_usage',
          message: 'Test notification',
          status: 'triggered',
          priority: 'high',
          triggeredAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      const mockCount = { count: 1 };

      // Mock the db calls for both notifications and count
      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          leftJoin: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              orderBy: vi.fn().mockReturnValue({
                limit: vi.fn().mockReturnValue({
                  offset: vi.fn().mockResolvedValue(mockNotifications)
                })
              })
            })
          })
        })
      }).mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([mockCount])
        })
      });

      const result = await NotificationCenterService.getNotifications('user123');

      expect(result.notifications).toEqual(mockNotifications);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(20);
    });

    it('should handle filtering by status', async () => {
      const mockNotifications: any[] = [];
      const mockCount = { count: 0 };

      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          leftJoin: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              orderBy: vi.fn().mockReturnValue({
                limit: vi.fn().mockReturnValue({
                  offset: vi.fn().mockResolvedValue(mockNotifications)
                })
              })
            })
          })
        })
      }).mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([mockCount])
        })
      });

      const filters = { status: 'triggered' as const };
      await NotificationCenterService.getNotifications('user123', filters);

      expect(mockDb.select).toHaveBeenCalledTimes(2);
    });

    it('should handle search functionality', async () => {
      const mockNotifications: any[] = [];
      const mockCount = { count: 0 };

      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          leftJoin: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              orderBy: vi.fn().mockReturnValue({
                limit: vi.fn().mockReturnValue({
                  offset: vi.fn().mockResolvedValue(mockNotifications)
                })
              })
            })
          })
        })
      }).mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([mockCount])
        })
      });

      const filters = { search: 'credit' };
      await NotificationCenterService.getNotifications('user123', filters);

      expect(mockDb.select).toHaveBeenCalledTimes(2);
    });

    it('should handle pagination options', async () => {
      const mockNotifications: any[] = [];
      const mockCount = { count: 0 };

      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          leftJoin: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              orderBy: vi.fn().mockReturnValue({
                limit: vi.fn().mockReturnValue({
                  offset: vi.fn().mockResolvedValue(mockNotifications)
                })
              })
            })
          })
        })
      }).mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([mockCount])
        })
      });

      const paginationOptions = { page: 2, limit: 10 };
      const result = await NotificationCenterService.getNotifications(
        'user123', 
        {}, 
        {}, 
        paginationOptions
      );

      expect(result.pagination.page).toBe(2);
      expect(result.pagination.limit).toBe(10);
    });
  });

  describe('getNotificationSummary', () => {
    it('should retrieve notification summary', async () => {
      const mockSummary = {
        unread: 5,
        high: 2,
        medium: 3,
        low: 0,
        archived: 1,
        total: 9
      };

      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([mockSummary])
        })
      });

      const result = await NotificationCenterService.getNotificationSummary('user123');

      expect(result).toEqual(mockSummary);
      expect(mockDb.select).toHaveBeenCalled();
    });
  });

  describe('groupNotifications', () => {
    it('should group notifications by type', async () => {
      const mockNotifications = [
        {
          alerts: {
            id: '1',
            userId: 'user123',
            alertType: 'credit_usage',
            message: 'Test notification 1',
            status: 'triggered',
            priority: 'high',
            triggeredAt: new Date(),
            createdAt: new Date(),
            updatedAt: new Date()
          },
          accounts: null
        }
      ];

      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          leftJoin: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              orderBy: vi.fn().mockResolvedValue(mockNotifications)
            })
          })
        })
      });

      const grouped = await NotificationCenterService.groupNotifications('user123', { 
        groupByType: true,
        groupByAccount: false,
        groupByTimeframe: false
      });

      expect(Array.isArray(grouped)).toBe(true);
      expect(mockDb.select).toHaveBeenCalled();
    });

    it('should handle empty notification list', async () => {
      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          leftJoin: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              orderBy: vi.fn().mockResolvedValue([])
            })
          })
        })
      });

      const grouped = await NotificationCenterService.groupNotifications('user123');

      expect(Array.isArray(grouped)).toBe(true);
    });
  });

  describe('updateNotificationStatus', () => {
    it('should update notification status', async () => {
      // Mock finding the notification first
      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([{ id: 'notification-id', userId: 'user123' }])
          })
        })
      });

      // Mock the update operation
      mockDb.update.mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([])
        })
      });

      await NotificationCenterService.updateNotificationStatus('user123', 'notification-id', 'acknowledge');

      expect(mockDb.select).toHaveBeenCalled();
      expect(mockDb.update).toHaveBeenCalled();
    });

    it('should handle bulk status updates', async () => {
      const notificationIds = ['1', '2', '3'];

      // Mock finding notifications for each update
      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([{ id: '1', userId: 'user123' }])
          })
        })
      });

      mockDb.update.mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([])
        })
      });

      for (const id of notificationIds) {
        await NotificationCenterService.updateNotificationStatus('user123', id, 'markAsRead');
      }

      expect(mockDb.select).toHaveBeenCalledTimes(3);
      expect(mockDb.update).toHaveBeenCalledTimes(3);
    });
  });

  describe('getUserNotificationPreferences', () => {
    it('should retrieve user notification preferences', async () => {
      const mockPreferences: any[] = [
        {
          id: '1',
          userId: 'user123',
          alertType: 'credit_usage',
          emailEnabled: true,
          pushEnabled: false,
          inAppEnabled: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(mockPreferences)
        })
      });

      const result = await NotificationCenterService.getUserNotificationPreferences('user123');

      expect(Array.isArray(result)).toBe(true);
      expect(mockDb.select).toHaveBeenCalled();
    });
  });

  describe('shouldSendNotification', () => {
    it('should determine if notification should be sent', async () => {
      const mockPreferences: any[] = [];

      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(mockPreferences)
        })
      });

      const result = await NotificationCenterService.shouldSendNotification('user123', 'credit_usage', 'email');

      expect(typeof result).toBe('boolean');
      expect(mockDb.select).toHaveBeenCalled();
    });

    it('should handle different notification channels', async () => {
      const mockPreferences: any[] = [];

      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(mockPreferences)
        })
      });

      const channels = ['email', 'push', 'inApp'] as const;
      
      for (const channel of channels) {
        const result = await NotificationCenterService.shouldSendNotification('user123', 'credit_usage', channel);
        expect(typeof result).toBe('boolean');
      }

      expect(mockDb.select).toHaveBeenCalledTimes(3);
    });
  });
});
