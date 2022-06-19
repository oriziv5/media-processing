import express from 'express';
import multer from 'multer';
import PQueue from 'p-queue';
import cors from 'cors';
import { createFFmpeg } from '@ffmpeg/ffmpeg';

const requestQueue = new PQueue({ concurrency: 1 });
let ffmpegLoadingPromise;
let ffmpegInstance;

const app = express();
app.use(cors());
const port = 3000;
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 }
});

async function createFFmpegInstance() {
  ffmpegInstance = createFFmpeg({ log: true });
  ffmpegLoadingPromise = ffmpegInstance.load();
}

createFFmpegInstance();

async function getFFmpeg() {
  if (ffmpegLoadingPromise) {
      await ffmpegLoadingPromise;
      ffmpegLoadingPromise = undefined;
  }

  return ffmpegInstance;
}

app.post('/test', upload.single('video'), async (req, res) => {
    try {
        const videoData = req['file'].buffer;

        const ffmpeg = await getFFmpeg();

        const inputFileName = `input-video`;
        const outputFileName = `thumbnail.png`;
        let outputData = null;

        await requestQueue.add(async () => {
            ffmpeg.FS('writeFile', inputFileName, videoData);

            await ffmpeg.run(
                '-ss', '00:00:02.000',
                '-i', inputFileName,
                '-frames:v', '1',
                outputFileName
            );

            outputData = ffmpeg.FS('readFile', outputFileName);
            ffmpeg.FS('unlink', inputFileName);
            ffmpeg.FS('unlink', outputFileName);
        });

        res.writeHead(200, {
            'Content-Type': 'image/png',
            'Content-Disposition': `attachment;filename=${outputFileName}`,
            'Content-Length': outputData.length
        });
        res.end(Buffer.from(outputData, 'binary'));
    } catch(error) {
        console.error(error);
        res.sendStatus(500);
    }
});


app.listen(port, () => {
  console.log(`Timezones by location application is running on port ${port}.`);
});