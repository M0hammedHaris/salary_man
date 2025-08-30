import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SavingsService } from '@/lib/services/savings-service';
import { db } from '@/lib/db';
import { savingsGoals } from '@/lib/db/schema';

// Mock the database
vi.mock('@/lib/db', () => ({
  db: {
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    query: {
      savingsGoals: {
        findMany: vi.fn(),
        findFirst: vi.fn(),
      },
      accounts: {
        findFirst: vi.fn(),
      },
      goalMilestones: {
        findMany: vi.fn(),
      },
      goalProgressHistory: {
        findMany: vi.fn(),
      },
    },
  },
}));

describe('SavingsService', () => {
  let savingsService: SavingsService;
  const mockUserId = 'user_123';
  const mockAccountId = 'account_123';
  const mockGoalId = 'goal_123';

  beforeEach(() => {
    savingsService = new SavingsService();
    vi.clearAllMocks();
  });

  describe('createGoal', () => {
    it('should create a new savings goal with milestones', async () => {
      const mockAccount = {
        id: mockAccountId,
        userId: mockUserId,
        balance: '1000.00',
        name: 'Test Account',
      };

      const mockGoalData = {
        name: 'Emergency Fund',
        description: 'Save for emergencies',
        targetAmount: '5000.00',
        targetDate: new Date('2024-12-31'),
        accountId: mockAccountId,
        priority: '5',
      };

      const mockCreatedGoal = {
        id: mockGoalId,
        userId: mockUserId,
        ...mockGoalData,
        currentAmount: '1000.00',
        initialBalance: '1000.00',
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Mock database calls
      (db.query.accounts.findFirst as any).mockResolvedValue(mockAccount);
      (db.insert as any).mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([mockCreatedGoal]),
        }),
      });

      const result = await savingsService.createGoal(mockUserId, mockGoalData);

      expect(db.query.accounts.findFirst).toHaveBeenCalledWith({
        where: expect.any(Object),
      });
      expect(db.insert).toHaveBeenCalledTimes(2); // goal + milestones
      expect(result).toEqual(mockCreatedGoal);
    });

    it('should throw error if account not found', async () => {
      (db.query.accounts.findFirst as any).mockResolvedValue(null);

      const mockGoalData = {
        name: 'Emergency Fund',
        targetAmount: '5000.00',
        targetDate: new Date('2024-12-31'),
        accountId: 'invalid_account',
        priority: '5',
      };

      await expect(savingsService.createGoal(mockUserId, mockGoalData))
        .rejects.toThrow('Account not found');
    });
  });

  describe('getUserGoals', () => {
    it('should return user goals with progress information', async () => {
      const mockGoalsWithDetails = [
        {
          id: mockGoalId,
          userId: mockUserId,
          name: 'Emergency Fund',
          description: 'Save for emergencies',
          targetAmount: '5000.00',
          currentAmount: '2500.00',
          targetDate: new Date('2024-12-31'),
          status: 'active',
          priority: '5',
          account: { name: 'Savings Account' },
          category: { name: 'Savings', color: '#green' },
          milestones: [
            {
              id: 'milestone_1',
              milestonePercentage: '25.00',
              targetAmount: '1250.00',
              isAchieved: true,
              achievedAmount: '1250.00',
              achievedAt: new Date(),
              notified: true,
            },
            {
              id: 'milestone_2',
              milestonePercentage: '50.00',
              targetAmount: '2500.00',
              isAchieved: true,
              achievedAmount: '2500.00',
              achievedAt: new Date(),
              notified: false,
            },
          ],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const mockProgressHistory = [
        {
          goalId: mockGoalId,
          changeAmount: '100.00',
          recordedAt: new Date(),
        },
      ];

      (db.query.savingsGoals.findMany as any).mockResolvedValue(mockGoalsWithDetails);
      (db.query.goalProgressHistory.findMany as any).mockResolvedValue(mockProgressHistory);

      const result = await savingsService.getUserGoals(mockUserId);

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: mockGoalId,
        name: 'Emergency Fund',
        targetAmount: 5000,
        currentAmount: 2500,
        progressPercentage: 50,
        remainingAmount: 2500,
        accountName: 'Savings Account',
        categoryName: 'Savings',
      });
      expect(result[0].milestones).toHaveLength(2);
    });
  });

  describe('updateGoalProgress', () => {
    it('should update goal progress and check milestones', async () => {
      const mockGoal = {
        id: mockGoalId,
        userId: mockUserId,
        currentAmount: '2000.00',
        targetAmount: '5000.00',
        account: { balance: '2500.00' },
      };

      (db.query.savingsGoals.findFirst as any).mockResolvedValue(mockGoal);
      (db.update as any).mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(undefined),
        }),
      });
      (db.insert as any).mockReturnValue({
        values: vi.fn().mockResolvedValue(undefined),
      });
      (db.query.goalMilestones.findMany as any).mockResolvedValue([]);

      const result = await savingsService.updateGoalProgress(mockGoalId, mockUserId);

      expect(result.previousAmount).toBe(2000);
      expect(result.newAmount).toBe(2500);
      expect(result.changeAmount).toBe(500);
      expect(result.progressPercentage).toBe(50);
    });

    it('should throw error if goal not found', async () => {
      (db.query.savingsGoals.findFirst as any).mockResolvedValue(null);

      await expect(savingsService.updateGoalProgress('invalid_goal', mockUserId))
        .rejects.toThrow('Goal not found');
    });
  });

  describe('getGoalAnalytics', () => {
    it('should calculate goal analytics correctly', async () => {
      const mockGoals = [
        {
          id: 'goal_1',
          status: 'active',
          targetAmount: '5000.00',
          currentAmount: '2500.00',
          targetDate: new Date('2024-12-31'),
        },
        {
          id: 'goal_2',
          status: 'completed',
          targetAmount: '3000.00',
          currentAmount: '3000.00',
          targetDate: new Date('2024-06-30'),
        },
      ];

      const mockProgressHistory = [
        { changeAmount: '100.00', recordedAt: new Date() },
      ];

      (db.query.savingsGoals.findMany as any).mockResolvedValue(mockGoals);
      (db.query.goalProgressHistory.findMany as any).mockResolvedValue(mockProgressHistory);
      (db.query.goalMilestones.findMany as any)
        .mockResolvedValueOnce([]) // upcoming milestones
        .mockResolvedValueOnce([]); // recent achievements

      const result = await savingsService.getGoalAnalytics(mockUserId);

      expect(result.totalGoals).toBe(2);
      expect(result.activeGoals).toBe(1);
      expect(result.completedGoals).toBe(1);
      expect(result.totalTargetAmount).toBe(8000);
      expect(result.totalCurrentAmount).toBe(5500);
      expect(result.averageProgress).toBe(68.75); // (5500/8000) * 100
    });
  });

  describe('updateGoal', () => {
    it('should update goal and recalculate milestones if target amount changed', async () => {
      const mockUpdatedGoal = {
        id: mockGoalId,
        userId: mockUserId,
        name: 'Updated Goal',
        targetAmount: '6000.00',
      };

      (db.update as any).mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([mockUpdatedGoal]),
          }),
        }),
      });

      const updates = {
        name: 'Updated Goal',
        targetAmount: '6000.00',
      };

      const result = await savingsService.updateGoal(mockGoalId, mockUserId, updates);

      expect(result).toEqual(mockUpdatedGoal);
      expect(db.update).toHaveBeenCalledTimes(5); // goal update + 4 milestone updates
    });

    it('should throw error if goal not found during update', async () => {
      (db.update as any).mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([]),
          }),
        }),
      });

      await expect(savingsService.updateGoal('invalid_goal', mockUserId, { name: 'Updated' }))
        .rejects.toThrow('Goal not found');
    });
  });

  describe('deleteGoal', () => {
    it('should delete goal if it exists', async () => {
      const mockGoal = { id: mockGoalId, userId: mockUserId };

      (db.query.savingsGoals.findFirst as any).mockResolvedValue(mockGoal);
      (db.delete as any).mockReturnValue({
        where: vi.fn().mockResolvedValue(undefined),
      });

      await savingsService.deleteGoal(mockGoalId, mockUserId);

      expect(db.delete).toHaveBeenCalledWith(savingsGoals);
    });

    it('should throw error if goal not found during delete', async () => {
      (db.query.savingsGoals.findFirst as any).mockResolvedValue(null);

      await expect(savingsService.deleteGoal('invalid_goal', mockUserId))
        .rejects.toThrow('Goal not found');
    });
  });

  describe('getTimelineProjection', () => {
    it('should calculate timeline projection correctly', async () => {
      const mockGoal = {
        id: mockGoalId,
        userId: mockUserId,
        currentAmount: '2500.00',
        targetAmount: '5000.00',
        targetDate: new Date('2024-12-31'),
      };

      const mockProgressHistory = [
        {
          changeAmount: '100.00',
          recordedAt: new Date(Date.now() - 86400000), // yesterday
        },
        {
          changeAmount: '50.00',
          recordedAt: new Date(Date.now() - 2 * 86400000), // 2 days ago
        },
      ];

      (db.query.savingsGoals.findFirst as any).mockResolvedValue(mockGoal);
      (db.query.goalProgressHistory.findMany as any).mockResolvedValue(mockProgressHistory);

      const result = await savingsService.getTimelineProjection(mockGoalId, mockUserId);

      expect(result.goalId).toBe(mockGoalId);
      expect(result.currentAmount).toBe(2500);
      expect(result.targetAmount).toBe(5000);
      expect(result.projectionData).toBeDefined();
      expect(Array.isArray(result.projectionData)).toBe(true);
    });

    it('should throw error if goal not found for projection', async () => {
      (db.query.savingsGoals.findFirst as any).mockResolvedValue(null);

      await expect(savingsService.getTimelineProjection('invalid_goal', mockUserId))
        .rejects.toThrow('Goal not found');
    });
  });
});
