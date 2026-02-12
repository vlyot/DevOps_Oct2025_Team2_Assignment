import { supabase } from '../lib/supabase';
import { Subscriber } from '../models/Subscriber';

export class SubscriberRepository {
  async subscribe(email: string, role?: string): Promise<Subscriber> {
    const { data, error } = await supabase
      .from('subscribers')
      .insert({
        email,
        role,
        is_active: true,
        subscribed_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async unsubscribe(email: string): Promise<boolean> {
    const { error } = await supabase
      .from('subscribers')
      .update({ is_active: false })
      .eq('email', email);

    if (error) throw error;
    return true;
  }

  async isSubscribed(email: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('subscribers')
      .select('is_active')
      .eq('email', email)
      .single();

    if (error) return false;
    return data?.is_active ?? false;
  }

  async getAllSubscribers(): Promise<Subscriber[]> {
    const { data, error} = await supabase
      .from('subscribers')
      .select('*')
      .eq('is_active', true);

    if (error) throw error;
    return data || [];
  }
}

export const subscriberRepository = new SubscriberRepository();
