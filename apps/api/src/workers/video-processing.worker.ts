import 'dotenv/config';
import * as fs from 'node:fs';
import * as fsp from 'node:fs/promises';
import * as os from 'node:os';
import * as path from 'node:path';
import { Worker, type Job } from 'bullmq';
import Redis from 'ioredis';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from 'ffmpeg-static';
import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { PrismaClient } from '@prisma/client';
import { VideoStatus } from '@faro/types';
import { validateEnv } from '../config/env.validation';
import { VIDEO_PROCESSING_QUEUE, type VideoProcessingJob } from '../queue/queue.constants';

const env = validateEnv(process.env);
if (ffmpegPath) ffmpeg.setFfmpegPath(ffmpegPath);

const prisma = new PrismaClient();
const s3 = new S3Client({
  endpoint: env.S3_ENDPOINT,
  region: env.S3_REGION,
  forcePathStyle: env.S3_FORCE_PATH_STYLE,
  credentials: { accessKeyId: env.S3_ACCESS_KEY_ID, secretAccessKey: env.S3_SECRET_ACCESS_KEY },
});

async function downloadToFile(key: string, destPath: string): Promise<void> {
  const response = await s3.send(new GetObjectCommand({ Bucket: env.S3_BUCKET, Key: key }));
  const body = response.Body as NodeJS.ReadableStream;
  await new Promise<void>((resolve, reject) => {
    const writeStream = fs.createWriteStream(destPath);
    body.pipe(writeStream);
    writeStream.on('finish', resolve);
    writeStream.on('error', reject);
    body.on('error', reject);
  });
}

async function uploadFile(key: string, filePath: string, contentType: string): Promise<void> {
  const buffer = await fsp.readFile(filePath);
  await s3.send(
    new PutObjectCommand({ Bucket: env.S3_BUCKET, Key: key, Body: buffer, ContentType: contentType }),
  );
}

function transcodeTo720p(inputPath: string, outputPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .videoCodec('libx264')
      .audioCodec('aac')
      .outputOptions([
        '-vf scale=-2:720',
        '-preset veryfast',
        '-crf 23',
        '-movflags +faststart',
        '-max_muxing_queue_size 1024',
      ])
      .on('error', reject)
      .on('end', () => resolve())
      .save(outputPath);
  });
}

function extractThumbnail(inputPath: string, outputDir: string, fileName: string): Promise<void> {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .on('error', reject)
      .on('end', () => resolve())
      .screenshots({ timestamps: ['1'], filename: fileName, folder: outputDir, size: '720x?' });
  });
}

async function processJob(job: Job<VideoProcessingJob>): Promise<void> {
  const { videoId } = job.data;
  const video = await prisma.video.findUnique({ where: { id: videoId } });
  if (!video) return;

  const tmpDir = await fsp.mkdtemp(path.join(os.tmpdir(), 'faro-video-'));
  const extension = video.storageKey.split('.').pop() ?? 'mp4';
  const originalPath = path.join(tmpDir, `original.${extension}`);
  const processedPath = path.join(tmpDir, 'processed.mp4');
  const thumbnailName = 'thumbnail.jpg';

  try {
    await downloadToFile(video.storageKey, originalPath);
    await transcodeTo720p(originalPath, processedPath);
    await extractThumbnail(originalPath, tmpDir, thumbnailName);

    const processedKey = `videos/${video.creatorId}/${video.id}/720p.mp4`;
    const thumbnailKey = `videos/${video.creatorId}/${video.id}/thumbnail.jpg`;
    await uploadFile(processedKey, processedPath, 'video/mp4');
    await uploadFile(thumbnailKey, path.join(tmpDir, thumbnailName), 'image/jpeg');

    const publicUrl = env.S3_PUBLIC_URL.replace(/\/$/, '');
    await prisma.video.update({
      where: { id: videoId },
      data: {
        status: VideoStatus.READY,
        videoUrl: `${publicUrl}/${processedKey}`,
        thumbnailUrl: `${publicUrl}/${thumbnailKey}`,
      },
    });
    // eslint-disable-next-line no-console
    console.log(`[video-worker] Vídeo ${videoId} procesado correctamente`);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(`[video-worker] Error procesando vídeo ${videoId}`, error);
    await prisma.video.update({ where: { id: videoId }, data: { status: VideoStatus.FAILED } });
    throw error;
  } finally {
    await fsp.rm(tmpDir, { recursive: true, force: true }).catch(() => undefined);
  }
}

const connection = new Redis(env.REDIS_URL, { maxRetriesPerRequest: null });

const worker = new Worker<VideoProcessingJob>(VIDEO_PROCESSING_QUEUE, processJob, {
  connection,
  concurrency: 2,
});

worker.on('completed', (job) => console.log(`[video-worker] Job ${job.id} completado`));
worker.on('failed', (job, err) => console.error(`[video-worker] Job ${job?.id} falló`, err));

// eslint-disable-next-line no-console
console.log('[video-worker] Worker de transcodificación de vídeo iniciado');

process.on('SIGTERM', async () => {
  await worker.close();
  await prisma.$disconnect();
  process.exit(0);
});
