export interface Video {
  id: string;
  title: string;
  description: string;
  driveFileId: string;
  driveUrl: string;
  embedUrl: string;
  thumbnailUrl: string;
  uploaderUid: string;
  uploaderName: string;
  uploaderAvatar: string;
  uploaderHandle: string;
  category: string;
  tags: string[];
  views: number;
  likesCount: number;
  dislikesCount: number;
  commentsCount: number;
  duration: string;
  createdAt: string; // ISO string
}

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL: string;
  handle: string;
  subscribersCount: number;
  bio?: string;
  bannerURL?: string;
  joinedAt: string;
}

export interface Comment {
  id: string;
  videoId: string;
  userId: string;
  userName: string;
  userAvatar: string;
  text: string;
  likes: number;
  createdAt: string;
}

export type Category = 
  | 'All'
  | 'Cinema & Films'
  | 'Music & Audio'
  | 'Coding & Tech'
  | 'Science & Wonders'
  | 'Gaming'
  | 'Podcasts & Talks'
  | 'Art & Animation'
  | 'Culture & Travel'
  | 'Documentaries';

export const CATEGORIES: Category[] = [
  'All',
  'Cinema & Films',
  'Music & Audio',
  'Coding & Tech',
  'Science & Wonders',
  'Gaming',
  'Podcasts & Talks',
  'Art & Animation',
  'Culture & Travel',
  'Documentaries'
];
