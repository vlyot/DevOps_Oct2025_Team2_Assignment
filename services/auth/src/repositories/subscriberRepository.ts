import { createClient } from '@supabase/supabase-js';
import { Subscriber } from '../models/Subscriber';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

export class SubscriberRepository {
  /**
   * Add a new subscriber
   */
  async subscribe(email: string, role?: string): Promise<Subscriber | null> {
    const { data, error} = await supabase
      .from('email_subscribers')
      .insert({
        email,
        is_active: true,
        role: role || 'stakeholder'
      })
      .select()
      .single();

    if (error) {
      // If email already exists, update to active
      if (error.code === '23505') {
        return this.reactivate(email, role);
      }
      console.error('[Subscriber] Subscribe error:', error);
      return null;
    }

    return data;
  }

  /**
   * Reactivate an existing subscription
   */
  async reactivate(email: string, role?: string): Promise<Subscriber | null> {
    const updateData: any = {
      is_active: true,
      subscribed_at: new Date().toISOString()
    };

    if (role) {
      updateData.role = role;
    }

    const { data, error } = await supabase
      .from('email_subscribers')
      .update(updateData)
      .eq('email', email)
      .select()
      .single();

    if (error) {
      console.error('[Subscriber] Reactivate error:', error);
      return null;
    }

    return data;
  }

  /**
   * Unsubscribe an email (soft delete)
   */
  async unsubscribe(email: string): Promise<boolean> {
    const { error } = await supabase
      .from('email_subscribers')
      .update({ is_active: false })
      .eq('email', email);

    if (error) {
      console.error('[Subscriber] Unsubscribe error:', error);
      return false;
    }

    return true;
  }

  /**
   * Get all active subscribers
   */
  async getActiveSubscribers(): Promise<string[]> {
    const { data, error } = await supabase
      .from('email_subscribers')
      .select('email')
      .eq('is_active', true);

    if (error) {
      console.error('[Subscriber] Get active error:', error);
      return [];
    }

    return data.map(sub => sub.email);
  }

  /**
   * Get active subscribers filtered by role
   */
  async getActiveSubscribersByRole(roles: string[]): Promise<string[]> {
    if (roles.length === 0) {
      return this.getActiveSubscribers();
    }

    const { data, error } = await supabase
      .from('email_subscribers')
      .select('email')
      .eq('is_active', true)
      .in('role', roles);

    if (error) {
      console.error('[Subscriber] Get by role error:', error);
      return this.getActiveSubscribers();
    }

    return data.map(sub => sub.email);
  }

  /**
   * Check if an email is subscribed
   */
  async isSubscribed(email: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('email_subscribers')
      .select('is_active')
      .eq('email', email)
      .single();

    if (error) return false;
    return data?.is_active || false;
  }

  /**
   * Get all subscribers (admin only - returns full data)
   */
  async getAllSubscribers(): Promise<Subscriber[]> {
    const { data, error } = await supabase
      .from('email_subscribers')
      .select('*')
      .order('subscribed_at', { ascending: false });

    if (error) {
      console.error('[Subscriber] Get all error:', error);
      return [];
    }

    return data;
  }
}

export const subscriberRepository = new SubscriberRepository();
