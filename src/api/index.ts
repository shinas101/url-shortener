import { Hono } from 'hono';
import registerRoute from './routes/register';
import shortenRoute from './routes/shorten';
import verifyPasswordRoute from './routes/verify-password';

const app = new Hono();

app.route('/api/register', registerRoute);
app.route('/api/shorten', shortenRoute);
app.route('/api/verify-password', verifyPasswordRoute);

export default app;
export type AppType = typeof app;
