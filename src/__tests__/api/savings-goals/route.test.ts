import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/savings-goals/route';
import { PUT, DELETE } from '@/app/api/savings-goals/[id]/route';
import { savingsService } from '@/lib/services/savings-service';
import { auth } from '@clerk/nextjs/server';

// Mock Clerk auth
vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(),
}));

// Mock savings service
vi.mock('@/lib/services/savings-service', () => ({
  savingsService: {
    getUserGoals: vi.fn(),
    getGoalAnalytics: vi.fn(),
    createGoal: vi.fn(),
    updateGoal: vi.fn(),
    deleteGoal: vi.fn(),
  },
}));

describe('Savings Goals API', () => {
  const mockUserId = 'user_123';
  const mockGoalId = 'goal_123';

  beforeEach(() => {
    vi.clearAllMocks();
    // Default auth mock to return authenticated user
    vi.mocked(auth).mockResolvedValue({ userId: mockUserId } as any);
  });

  describe('GET /api/savings-goals', () => {
    it('should return goals and analytics for authenticated user', async () => {
      const mockGoals = [
        {
          id: mockGoalId,
          name: 'Emergency Fund',
          targetAmount: 5000,
          currentAmount: 2500,
          progressPercentage: 50,
        },
      ];

      const mockAnalytics = {
        totalGoals: 1,
        activeGoals: 1,
        completedGoals: 0,
        totalTargetAmount: 5000,
        totalCurrentAmount: 2500,
        averageProgress: 50,
      };

      (savingsService.getUserGoals as any).mockResolvedValue(mockGoals);
      (savingsService.getGoalAnalytics as any).mockResolvedValue(mockAnalytics);

      const response = await GET();
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.goals).toEqual(mockGoals);
      expect(responseData.analytics).toEqual(mockAnalytics);
      expect(savingsService.getUserGoals).toHaveBeenCalledWith(mockUserId);
      expect(savingsService.getGoalAnalytics).toHaveBeenCalledWith(mockUserId);
    });

    it('should return 401 for unauthenticated user', async () => {
      vi.mocked(auth).mockResolvedValue({ userId: null } as any);

      const response = await GET();
      const responseData = await response.json();

      expect(response.status).toBe(401);
      expect(responseData.error).toBe('Unauthorized');
    });

    it('should handle service errors', async () => {
      (savingsService.getUserGoals as any).mockRejectedValue(new Error('Service error'));

      const response = await GET();
      const responseData = await response.json();

      expect(response.status).toBe(500);
      expect(responseData.error).toBe('Failed to fetch savings goals');
    });
  });

  describe('POST /api/savings-goals', () => {
    it('should create new goal with valid data', async () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1); // One year in the future
      
      const goalData = {
        name: 'Emergency Fund',
        description: 'Save for emergencies',
        targetAmount: 5000,
        targetDate: futureDate.toISOString(),
        accountId: '550e8400-e29b-41d4-a716-446655440000', // Valid UUID
        categoryId: '550e8400-e29b-41d4-a716-446655440001', // Valid UUID
        priority: 5,
      };

      const mockCreatedGoal = {
        id: mockGoalId,
        userId: mockUserId,
        name: goalData.name,
        description: goalData.description,
        targetAmount: goalData.targetAmount.toString(),
        targetDate: goalData.targetDate,
        accountId: goalData.accountId,
        categoryId: goalData.categoryId,
        priority: goalData.priority.toString(),
        createdAt: futureDate.toISOString(), // String format for JSON
        updatedAt: futureDate.toISOString(), // String format for JSON
      };

      (savingsService.createGoal as any).mockResolvedValue(mockCreatedGoal);

      const request = new NextRequest('http://localhost/api/savings-goals', {
        method: 'POST',
        body: JSON.stringify(goalData),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(201);
      expect(responseData).toEqual(mockCreatedGoal);
      expect(savingsService.createGoal).toHaveBeenCalledWith(mockUserId, expect.any(Object));
    });

    it('should return 400 for invalid data', async () => {
      const invalidData = {
        name: '', // empty name should fail validation
        targetAmount: -100, // negative amount should fail
      };

      const request = new NextRequest('http://localhost/api/savings-goals', {
        method: 'POST',
        body: JSON.stringify(invalidData),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.error).toBe('Validation error');
      expect(responseData.details).toBeDefined();
    });

    it('should return 401 for unauthenticated user', async () => {
      vi.mocked(auth).mockResolvedValue({ userId: null } as any);

      const request = new NextRequest('http://localhost/api/savings-goals', {
        method: 'POST',
        body: JSON.stringify({}),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(401);
      expect(responseData.error).toBe('Unauthorized');
    });
  });

  describe('PUT /api/savings-goals/[id]', () => {
    it('should update goal with valid data', async () => {
      const updateData = {
        name: 'Updated Emergency Fund',
        targetAmount: 6000,
      };

      const mockUpdatedGoal = {
        id: mockGoalId,
        userId: mockUserId,
        name: updateData.name,
        targetAmount: updateData.targetAmount.toString(),
        updatedAt: '2025-08-28T14:49:58.998Z', // String format for JSON
      };

      (savingsService.updateGoal as any).mockResolvedValue(mockUpdatedGoal);

      const request = new NextRequest(`http://localhost/api/savings-goals/${mockGoalId}`, {
        method: 'PUT',
        body: JSON.stringify(updateData),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await PUT(request, { params: { id: mockGoalId } });
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData).toEqual(mockUpdatedGoal);
      expect(savingsService.updateGoal).toHaveBeenCalledWith(mockGoalId, mockUserId, expect.any(Object));
    });

    it('should return 404 if goal not found', async () => {
      (savingsService.updateGoal as any).mockRejectedValue(new Error('Goal not found'));

      const request = new NextRequest(`http://localhost/api/savings-goals/${mockGoalId}`, {
        method: 'PUT',
        body: JSON.stringify({ name: 'Updated' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await PUT(request, { params: { id: mockGoalId } });
      const responseData = await response.json();

      expect(response.status).toBe(404);
      expect(responseData.error).toBe('Goal not found');
    });
  });

  describe('DELETE /api/savings-goals/[id]', () => {
    it('should delete goal successfully', async () => {
      (savingsService.deleteGoal as any).mockResolvedValue(undefined);

      const request = new NextRequest(`http://localhost/api/savings-goals/${mockGoalId}`, {
        method: 'DELETE',
      });

      const response = await DELETE(request, { params: { id: mockGoalId } });
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.message).toBe('Goal deleted successfully');
      expect(savingsService.deleteGoal).toHaveBeenCalledWith(mockGoalId, mockUserId);
    });

    it('should return 404 if goal not found', async () => {
      (savingsService.deleteGoal as any).mockRejectedValue(new Error('Goal not found'));

      const request = new NextRequest(`http://localhost/api/savings-goals/${mockGoalId}`, {
        method: 'DELETE',
      });

      const response = await DELETE(request, { params: { id: mockGoalId } });
      const responseData = await response.json();

      expect(response.status).toBe(404);
      expect(responseData.error).toBe('Goal not found');
    });

    it('should return 401 for unauthenticated user', async () => {
      vi.mocked(auth).mockResolvedValue({ userId: null } as any);

      const request = new NextRequest(`http://localhost/api/savings-goals/${mockGoalId}`, {
        method: 'DELETE',
      });

      const response = await DELETE(request, { params: { id: mockGoalId } });
      const responseData = await response.json();

      expect(response.status).toBe(401);
      expect(responseData.error).toBe('Unauthorized');
    });
  });
});
