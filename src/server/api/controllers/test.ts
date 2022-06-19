import { Request, Response } from "express";
import { createFFmpeg } from '@ffmpeg/ffmpeg';

import PQueue from 'p-queue';
let ffmpegLoadingPromise;
let ffmpegInstance;
const requestQueue = new PQueue({ concurrency: 1 });

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

export async function Test(req: Request, res: Response) {
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
}