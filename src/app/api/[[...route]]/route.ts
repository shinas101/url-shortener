import { handle } from 'hono/vercel';
import app from '@/api';

export const POST = handle(app);
