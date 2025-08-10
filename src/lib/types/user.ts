export interface User {
  id: string; // Clerk user ID
  email: string;
  firstName: string;
  lastName: string;
  createdAt: Date;
  updatedAt: Date;
  preferences: UserPreferences;
}

export interface UserPreferences {
  currency: string; // ISO currency code (default: 'USD')
  dateFormat: string; // Date display preference
  alertThresholds: {
    creditCard: number; // Credit utilization alert percentage
    lowBalance: number; // Low account balance threshold
  };
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean; // Future implementation
  };
}

// Default user preferences
export const defaultUserPreferences: UserPreferences = {
  currency: 'USD',
  dateFormat: 'MM/dd/yyyy',
  alertThresholds: {
    creditCard: 80, // 80% utilization alert
    lowBalance: 100, // $100 low balance alert
  },
  notifications: {
    email: true,
    push: true,
    sms: false,
  },
};
