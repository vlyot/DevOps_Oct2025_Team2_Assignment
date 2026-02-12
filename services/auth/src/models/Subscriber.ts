export interface Subscriber {
  id: string;
  email: string;
  subscribed_at: string;
  is_active: boolean;
  role?: 'admin' | 'developer' | 'stakeholder';
  notification_types?: string[];
}

export interface SubscribeRequest {
  email: string;
  role?: string;
  notification_types?: string[];
}
