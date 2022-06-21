import { Request, Response } from "express";
import { createFFmpeg } from "@ffmpeg/ffmpeg";
import moment from 'moment';

import PQueue from "p-queue";
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

export async function extractFrameBySecond(req: Request, res: Response) {
  try {
    // Get the second from query
    const second = Number(req.query.s);
    
    // Convert the second to ffmpeg time format
    const time = moment().startOf('day')
        .seconds(second)
        .format('HH:mm:ss.SSS');
        console.log(time);

    // Read the video from buffer
    const videoData = req["file"].buffer;

    // Create the ffmpeg instance
    const ffmpeg = await getFFmpeg();

    const inputFileName = `input-video`;
    const outputFileName = `thumbnail${second}.png`;
    let outputData = null;

    // Handle several requests
    await requestQueue.add(async () => {
        try {
            ffmpeg.FS("writeFile", inputFileName, videoData);
            
        } catch (error) {
            throw "File was not found"
        }

      await ffmpeg.run(
        "-ss",
        time,
        "-i",
        inputFileName,
        "-frames:v",
        "1",
        outputFileName
      );

      outputData = ffmpeg.FS("readFile", outputFileName);
      ffmpeg.FS("unlink", inputFileName);
      ffmpeg.FS("unlink", outputFileName);
    });

    res.writeHead(200, {
      "Content-Type": "image/png",
      "Content-Disposition": `attachment;filename=${outputFileName}`,
      "Content-Length": outputData.length,
    });
    res.end(Buffer.from(outputData, "binary"));
  } catch (error) {
    console.error(error);
    res.status(500).json({status: 500, error: error});
  }
}

export async function extractFrameByFrameNumber(req: Request, res: Response) {
    try {
      // Get the second from query
      const frame = Number(req.query.frame);
      
      // Read the video from buffer
      const videoData = req["file"].buffer;
  
      // Create the ffmpeg instance
      const ffmpeg = await getFFmpeg();
  
      const inputFileName = `input-video`;
      const outputFileName = `thumbnail${frame}.png`;
      let outputData = null;
  
      // Handle several requests
      await requestQueue.add(async () => {
          try {
              ffmpeg.FS("writeFile", inputFileName, videoData);
              
          } catch (error) {
              throw "File was not found"
          }
          //ffmpeg -i <input> -vf "select=eq(n\,34)" -vframes 1 out.png

        await ffmpeg.run(
          "-i",
          inputFileName,
          "-vf",
          `select=eq(n\\,${frame})`,
          "-frames:v",
          "1",
          outputFileName
        );
  
        outputData = ffmpeg.FS("readFile", outputFileName);
        ffmpeg.FS("unlink", inputFileName);
        ffmpeg.FS("unlink", outputFileName);
      });
  
      res.writeHead(200, {
        "Content-Type": "image/png",
        "Content-Disposition": `attachment;filename=${outputFileName}`,
        "Content-Length": outputData.length,
      });
      res.end(Buffer.from(outputData, "binary"));
    } catch (error) {
      console.error(error);
      res.status(500).json({status: 500, error: error});
    }
  }
