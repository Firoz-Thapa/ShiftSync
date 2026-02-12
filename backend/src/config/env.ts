import { z } from 'zod';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('3001'),
  
  DB_HOST: z.string().default('mysql'),
  DB_PORT: z.string().default('3306'),
  DB_NAME: z.string().default('shiftsync'),
  DB_USER: z.string().default('root'),
  DB_PASSWORD: z.string().default('password'),
  
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters long'),
  
  CORS_ORIGIN: z.string().default('http://localhost:3000'),
});

function validateEnv() {
  try {
    const parsed = envSchema.parse(process.env);
    console.log('Environment variables validated successfully');
    return parsed;
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Invalid environment variables:');
      error.issues.forEach((issue) => {
        console.error(`  - ${issue.path.join('.')}: ${issue.message}`);
      });
    }
    console.error('\n Please check your .env file and ensure all required variables are set.\n');
    process.exit(1);
  }
}

export const env = validateEnv();

export type Env = z.infer<typeof envSchema>;