import { handle } from 'hono/vercel';
import app from '@/api';

export const POST = handle(app);
export const GET = handle(app);
