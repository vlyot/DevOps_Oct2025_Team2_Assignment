export interface Subscriber {
  id: string;
  email: string;
  subscribed_at: string;
  is_active: boolean;
}

export interface SubscribeRequest {
  email: string;
}
