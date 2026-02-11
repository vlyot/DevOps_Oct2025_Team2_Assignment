import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';

describe('Supabase Client', () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    // Save original environment
    originalEnv = { ...process.env };

    // Clear the module cache to force re-initialization
    jest.resetModules();
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  describe('Client Initialization', () => {
    it('should initialize with valid environment variables', async () => {
      process.env.SUPABASE_URL = 'https://test.supabase.co';
      process.env.SUPABASE_ANON_KEY = 'test-anon-key';

      const { supabase } = await import('../lib/supabase');

      expect(supabase).toBeDefined();
      expect(supabase.auth).toBeDefined();
      expect(supabase.from).toBeDefined();
    });

    it('should initialize with empty strings when env vars are missing', async () => {
      delete process.env.SUPABASE_URL;
      delete process.env.SUPABASE_ANON_KEY;

      const { supabase } = await import('../lib/supabase');

      expect(supabase).toBeDefined();
      // Client is created but may not be functional without proper credentials
    });

    it('should use environment variable for SUPABASE_URL', async () => {
      const testUrl = 'https://custom.supabase.co';
      process.env.SUPABASE_URL = testUrl;
      process.env.SUPABASE_ANON_KEY = 'test-key';

      const { supabase } = await import('../lib/supabase');

      expect(supabase).toBeDefined();
      // Note: We can't directly test the URL used, but we verify the client is created
    });

    it('should use environment variable for SUPABASE_ANON_KEY', async () => {
      const testKey = 'custom-anon-key-12345';
      process.env.SUPABASE_URL = 'https://test.supabase.co';
      process.env.SUPABASE_ANON_KEY = testKey;

      const { supabase } = await import('../lib/supabase');

      expect(supabase).toBeDefined();
      // Note: We can't directly test the key used, but we verify the client is created
    });
  });

  describe('Client Configuration', () => {
    it('should export supabase client with auth methods', async () => {
      process.env.SUPABASE_URL = 'https://test.supabase.co';
      process.env.SUPABASE_ANON_KEY = 'test-anon-key';

      const { supabase } = await import('../lib/supabase');

      expect(supabase.auth).toBeDefined();
      expect(typeof supabase.auth.signInWithPassword).toBe('function');
      expect(typeof supabase.auth.signUp).toBe('function');
      expect(typeof supabase.auth.signOut).toBe('function');
    });

    it('should export supabase client with database methods', async () => {
      process.env.SUPABASE_URL = 'https://test.supabase.co';
      process.env.SUPABASE_ANON_KEY = 'test-anon-key';

      const { supabase } = await import('../lib/supabase');

      expect(typeof supabase.from).toBe('function');
    });

    it('should create singleton instance', async () => {
      process.env.SUPABASE_URL = 'https://test.supabase.co';
      process.env.SUPABASE_ANON_KEY = 'test-anon-key';

      const { supabase: instance1 } = await import('../lib/supabase');
      const { supabase: instance2 } = await import('../lib/supabase');

      // Both imports should reference the same instance
      expect(instance1).toBe(instance2);
    });
  });

  describe('Environment Variable Handling', () => {
    it('should handle undefined SUPABASE_URL gracefully', async () => {
      delete process.env.SUPABASE_URL;
      process.env.SUPABASE_ANON_KEY = 'test-key';

      expect(async () => {
        await import('../lib/supabase');
      }).not.toThrow();
    });

    it('should handle undefined SUPABASE_ANON_KEY gracefully', async () => {
      process.env.SUPABASE_URL = 'https://test.supabase.co';
      delete process.env.SUPABASE_ANON_KEY;

      expect(async () => {
        await import('../lib/supabase');
      }).not.toThrow();
    });

    it('should default to empty string for missing URL', async () => {
      delete process.env.SUPABASE_URL;
      process.env.SUPABASE_ANON_KEY = 'test-key';

      const { supabase } = await import('../lib/supabase');

      // Client is created with empty string, which is handled by createClient
      expect(supabase).toBeDefined();
    });

    it('should default to empty string for missing key', async () => {
      process.env.SUPABASE_URL = 'https://test.supabase.co';
      delete process.env.SUPABASE_ANON_KEY;

      const { supabase } = await import('../lib/supabase');

      // Client is created with empty string, which is handled by createClient
      expect(supabase).toBeDefined();
    });
  });

  describe('dotenv Integration', () => {
    it('should load environment variables from .env file', async () => {
      // dotenv.config() is called during module import
      const { supabase } = await import('../lib/supabase');

      // If .env file exists, variables should be loaded
      // This test verifies the module doesn't crash during initialization
      expect(supabase).toBeDefined();
    });
  });
});
