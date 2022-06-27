import { Request, Response } from "express";
import { createFFmpeg } from "@ffmpeg/ffmpeg";
import moment from "moment";
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
    const time = moment().startOf("day").seconds(second).format("HH:mm:ss.SSS");
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
        throw "File was not found";
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
    res.status(500).json({ status: 500, error: error });
  }
}

export async function extractFrameByFrameNumber(req: Request, res: Response) {
  const frame = Number(req.query.frame);
  try {
    // Get the second from query

    // Read the video from buffer
    const videoData = req["file"].buffer as Buffer;
    console.log(`Got file size of ${getFileSize(videoData.byteLength)}`);

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
        throw "File was not found";
      }
      //ffmpeg -i <input> -vf "select=eq(n\,34)" -vframes 1 out.png
      //ffmpeg -i input -vf yadif="deint=interlaced",select='eq(n\,125)',scale=trunc(ih*dar):ih,setsar=1/1 -frames:v 1 -q:v 2 out.jpg
      await ffmpeg.run(
        "-i",
        inputFileName,
        "-vf",
        `yadif=deint=interlaced,select=eq(n\\,${frame}),scale=trunc(ih*dar):ih,setsar=1/1`,
        "-frames:v",
        "1",
        "-q:v",
        "2",
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
    let message: string = error.toString();
    if (message.includes("Check if the path exists")) {
      message = `Frame ${frame} is not exist`;
    }
    res.status(500).json({ status: 500, error: message });
  }
}

// get human reable file size from bytes number
function getFileSize(bytes: number) { 
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  if (bytes == 0) return "0 Byte";
  const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)).toString());
  return Math.round(bytes / Math.pow(1024, i)) + " " + sizes[i];
}