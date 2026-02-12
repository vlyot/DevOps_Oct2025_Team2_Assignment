import { useEffect, useState } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export default function EmailSubscription() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Check subscription status on mount
  useEffect(() => {
    const storedEmail = localStorage.getItem('userEmail');
    if (storedEmail) {
      setEmail(storedEmail);
      checkSubscription(storedEmail);
    }
  }, []);

  const checkSubscription = async (emailToCheck: string) => {
    try {
      const response = await fetch(`${API_URL}/subscribe/status?email=${encodeURIComponent(emailToCheck)}`);
      const data = await response.json();
      setSubscribed(data.subscribed);
    } catch (error) {
      console.error('Failed to check subscription:', error);
    }
  };

  const handleSubscribe = async () => {
    if (!email) {
      setMessage('Please enter a valid email address');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const response = await fetch(`${API_URL}/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setSubscribed(true);
        setMessage('✅ Successfully subscribed to notifications!');
        localStorage.setItem('userEmail', email);
      } else {
        setMessage(`❌ ${data.error || 'Failed to subscribe'}`);
      }
    } catch (error) {
      setMessage('❌ Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleUnsubscribe = async () => {
    setLoading(true);
    setMessage('');

    try {
      const response = await fetch(`${API_URL}/unsubscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setSubscribed(false);
        setMessage('✅ Successfully unsubscribed from notifications');
      } else {
        setMessage(`❌ ${data.error || 'Failed to unsubscribe'}`);
      }
    } catch (error) {
      setMessage('❌ Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      border: '1px solid #ddd',
      borderRadius: '8px',
      padding: '20px',
      marginTop: '20px',
      backgroundColor: '#f9f9f9',
    }}>
      <h2 style={{ marginTop: 0 }}>📧 Email Notifications</h2>
      <p style={{ color: '#666' }}>
        Subscribe to receive notifications about all user management actions (create, update, delete).
      </p>

      <div style={{ marginBottom: '15px' }}>
        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
          Email Address:
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          disabled={subscribed}
          style={{
            width: '100%',
            padding: '10px',
            fontSize: '14px',
            borderRadius: '4px',
            border: '1px solid #ccc',
            boxSizing: 'border-box',
          }}
        />
      </div>

      {message && (
        <div style={{
          padding: '10px',
          marginBottom: '15px',
          borderRadius: '4px',
          backgroundColor: message.includes('✅') ? '#d4edda' : '#f8d7da',
          color: message.includes('✅') ? '#155724' : '#721c24',
        }}>
          {message}
        </div>
      )}

      <div style={{ display: 'flex', gap: '10px' }}>
        {!subscribed ? (
          <button
            onClick={handleSubscribe}
            disabled={loading || !email}
            style={{
              padding: '10px 20px',
              fontSize: '14px',
              fontWeight: 'bold',
              color: 'white',
              backgroundColor: '#28a745',
              border: 'none',
              borderRadius: '4px',
              cursor: loading || !email ? 'not-allowed' : 'pointer',
              opacity: loading || !email ? 0.6 : 1,
            }}
          >
            {loading ? 'Subscribing...' : 'Subscribe'}
          </button>
        ) : (
          <button
            onClick={handleUnsubscribe}
            disabled={loading}
            style={{
              padding: '10px 20px',
              fontSize: '14px',
              fontWeight: 'bold',
              color: 'white',
              backgroundColor: '#dc3545',
              border: 'none',
              borderRadius: '4px',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1,
            }}
          >
            {loading ? 'Unsubscribing...' : 'Unsubscribe'}
          </button>
        )}
      </div>

      {subscribed && (
        <p style={{ marginTop: '15px', color: '#28a745', fontWeight: 'bold' }}>
          ✅ You are currently subscribed to notifications
        </p>
      )}
    </div>
  );
}
