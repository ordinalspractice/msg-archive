import { z } from 'zod';

export const AttachmentSchema = z.object({
  uri: z.string(),
  creation_timestamp: z.number().optional(),
});

export const PhotoSchema = AttachmentSchema;
export const VideoSchema = AttachmentSchema;
export const AudioFileSchema = AttachmentSchema;

export const ReactionSchema = z.object({
  reaction: z.string(),
  actor: z.string(),
});

export const MessageSchema = z.object({
  sender_name: z.string(),
  timestamp_ms: z.number(),
  content: z.string().optional(),
  photos: z.array(PhotoSchema).optional(),
  videos: z.array(VideoSchema).optional(),
  audio_files: z.array(AudioFileSchema).optional(),
  reactions: z.array(ReactionSchema).optional(),
  is_unsent: z.boolean().optional(),
  type: z.string().optional(),
  sticker: z.object({ uri: z.string() }).optional(),
  gifs: z.array(z.object({ uri: z.string() })).optional(),
  files: z.array(AttachmentSchema).optional(),
  call_duration: z.number().optional(),
});

export const ParticipantSchema = z.object({
  name: z.string(),
});

export const ThreadSchema = z.object({
  participants: z.array(ParticipantSchema),
  messages: z.array(MessageSchema),
  title: z.string().optional(),
  is_still_participant: z.boolean().optional(),
  thread_type: z.string().optional(),
  thread_path: z.string().optional(),
});

export type Attachment = z.infer<typeof AttachmentSchema>;
export type Photo = z.infer<typeof PhotoSchema>;
export type Video = z.infer<typeof VideoSchema>;
export type AudioFile = z.infer<typeof AudioFileSchema>;
export type Reaction = z.infer<typeof ReactionSchema>;
export type Message = z.infer<typeof MessageSchema>;
export type Participant = z.infer<typeof ParticipantSchema>;
export type Thread = z.infer<typeof ThreadSchema>;

export interface ThreadMetadata {
  id: string;
  participants: Participant[];
  lastMessageTime: number;
  totalMessages: number;
  title?: string;
}

export interface ParsedThread {
  threadId: string;
  participants: Participant[];
  messages: Message[];
  title?: string;
}

export interface WorkerMessage {
  type: 'THREAD_PARSED' | 'WORKER_ERROR' | 'WORKER_COMPLETED' | 'PROGRESS';
  data?: any;
  error?: string;
  threadId?: string;
  progress?: number;
}
