export const VIDEO_PROCESSING_QUEUE = 'video-processing';
export const NOTIFICATIONS_QUEUE = 'notifications';

export interface VideoProcessingJob {
  videoId: string;
}

export interface NotificationJob {
  notificationId: string;
}
