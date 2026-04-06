import express from 'express';
import cors from 'cors';
import { initDB } from './db';
import projectsRouter from './routes/projects';

const app = express();
const PORT = parseInt(process.env.PORT || '3001');

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Routes
app.use('/api/projects', projectsRouter);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

async function start() {
  try {
    await initDB();
    console.log('Database connected and initialized');
  } catch (err) {
    console.warn('Database not available - running without persistence:', (err as Error).message);
    console.warn('The frontend will use localStorage as fallback.');
  }

  app.listen(PORT, () => {
    console.log(`FortiDoc API server running on port ${PORT}`);
  });
}

start();
