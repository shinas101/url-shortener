import { Hono } from 'hono';
import shortenRoute from './routes/shorten';
import verifyPasswordRoute from './routes/verify-password';

const app = new Hono();

app.route('/api/shorten', shortenRoute);
app.route('/api/verify-password', verifyPasswordRoute);

export default app;
export type AppType = typeof app;
