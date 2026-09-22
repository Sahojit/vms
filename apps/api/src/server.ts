import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { pinoHttp } from 'pino-http';

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.WEB_URL ?? 'http://localhost:5173', credentials: true }));
app.use(pinoHttp());
app.use(express.json());

app.get('/api/v1/health', (_req, res) => {
  res.json({ status: 'ok' });
});

const port = Number(process.env.API_PORT ?? 4000);
app.listen(port, () => {
  console.log(`API listening on :${port}`);
});
