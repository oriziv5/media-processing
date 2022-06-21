import express from 'express';
import cors from 'cors';
import router from './router.js';
import path from 'path';
import {fileURLToPath} from 'url';

const oneYear = 1 * 365 * 24 * 60 * 60 * 1000;
const port = process.env.PORT || 3000;
const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(
  express.static(path.join(__dirname, '../client'), {
      maxAge: oneYear,
  })
);
app.set('trust proxy', 1);
app.use(cors());
app.disable('x-powered-by');
app.use(express.json({ limit: '150kb' }));
app.use(express.urlencoded({ limit: '150kb', extended: true }));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(router);
app.use((req, res) => {
  res.status(404).send({ url: req.originalUrl + ' not found' });
});

app.listen(port, () => {
  console.log(`Timezones by location application is running on port ${port}.`);
});