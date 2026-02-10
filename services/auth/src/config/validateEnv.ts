export function validateEnvironment(): void {
    const requiredEnvVars = [
        'SUPABASE_URL',
        'SUPABASE_ANON_KEY',
        'JWT_SECRET'
    ];

    const missing: string[] = [];

    for (const envVar of requiredEnvVars) {
        if (!process.env[envVar]) {
            missing.push(envVar);
        }
    }

    if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
        console.error('❌ JWT_SECRET must be at least 32 characters long');
        process.exit(1);
    }

    if (missing.length > 0) {
        console.error('❌ Missing required environment variables:');
        missing.forEach(v => console.error(`   - ${v}`));
        console.error('\n💡 Create a .env file with these variables.');
        process.exit(1);
    }

    console.log('✅ Environment variables validated');
}
