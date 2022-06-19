import express from 'express';
import cors from 'cors';
import router from './router.js';

const oneYear = 1 * 365 * 24 * 60 * 60 * 1000;
const port = process.env.PORT || 3000;
const app = express();

app.use(
  express.static('../client', {
      maxAge: oneYear,
  })
);
app.set('trust proxy', 1);
app.use(cors());
app.disable('x-powered-by');
app.use(express.json({ limit: '150kb' }));
app.use(express.urlencoded({ limit: '150kb', extended: true }));
app.use(router);
app.use((req, res) => {
  res.status(404).send({ url: req.originalUrl + ' not found' });
});

app.listen(port, () => {
  console.log(`Timezones by location application is running on port ${port}.`);
});