import { apiService } from './api';

export interface EmailMessage {
  id: string;
  from: string;
  subject: string;
  body: string;
  date: string;
  isRead: boolean;
  hasAttachments: boolean;
}

export interface EmailAccount {
  id: string;
  email: string;
  provider: 'gmail' | 'outlook';
  isConnected: boolean;
  lastSync?: string;
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'object' && error !== null && 'message' in error &&
      typeof error.message === 'string') {
    return error.message;
  }
  return fallback;
}

class EmailService {
  /**
   * Begin the provider OAuth flow. The browser navigates only after the API
   * returns a validated authorization URL.
   */
  async getAuthorizationUrl(provider: 'gmail' | 'outlook'): Promise<string> {
    try {
      const response = await apiService.post<{ authorizationUrl: string }>(
        `/emails/connect/${provider}`
      );
      return response.authorizationUrl;
    } catch (error) {
      throw new Error(getErrorMessage(error, `Failed to connect ${provider} account`));
    }
  }

  /**
   * Get connected email accounts
   */
  async getConnectedAccounts(): Promise<EmailAccount[]> {
    try {
      return await apiService.get<EmailAccount[]>('/emails/accounts');
    } catch (error) {
      throw new Error(getErrorMessage(error, 'Failed to fetch email accounts'));
    }
  }

  /**
   * Disconnect email account
   */
  async disconnectAccount(accountId: string): Promise<void> {
    try {
      await apiService.delete(`/emails/accounts/${accountId}`);
    } catch (error) {
      throw new Error(getErrorMessage(error, 'Failed to disconnect email account'));
    }
  }

  /**
   * Get emails from a specific account
   */
  async getEmails(accountId: string, limit: number = 20): Promise<EmailMessage[]> {
    try {
      return await apiService.get<EmailMessage[]>(`/emails/${accountId}`, {
        params: { limit },
      });
    } catch (error) {
      throw new Error(getErrorMessage(error, 'Failed to fetch emails'));
    }
  }

  /**
   * Get a single email
   */
  async getEmail(accountId: string, emailId: string): Promise<EmailMessage> {
    try {
      return await apiService.get<EmailMessage>(`/emails/${accountId}/${emailId}`);
    } catch (error) {
      throw new Error(getErrorMessage(error, 'Failed to fetch email'));
    }
  }

  /**
   * Mark email as read
   */
  async markAsRead(accountId: string, emailId: string): Promise<void> {
    try {
      await apiService.patch(`/emails/${accountId}/${emailId}`, {
        isRead: true,
      });
    } catch (error) {
      throw new Error(getErrorMessage(error, 'Failed to mark email as read'));
    }
  }

  /**
   * Sync emails from account
   */
  async syncEmails(accountId: string): Promise<EmailMessage[]> {
    try {
      return await apiService.post<EmailMessage[]>(`/emails/${accountId}/sync`);
    } catch (error) {
      throw new Error(getErrorMessage(error, 'Failed to sync emails'));
    }
  }

  /**
   * Search emails
   */
  async searchEmails(
    accountId: string,
    query: string
  ): Promise<EmailMessage[]> {
    try {
      return await apiService.get<EmailMessage[]>(`/emails/${accountId}/search`, {
        params: { q: query },
      });
    } catch (error) {
      throw new Error(getErrorMessage(error, 'Failed to search emails'));
    }
  }
}

export const emailService = new EmailService();
