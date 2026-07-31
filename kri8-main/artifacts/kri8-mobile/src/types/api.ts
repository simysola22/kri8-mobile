// ============================================================
// API types — derived from lib/api-spec/openapi.yaml
// Keep in sync with the backend OpenAPI spec.
// ============================================================

export interface User {
  id: number;
  clerkUserId: string;
  email: string;
  name: string | null;
  username: string | null;
  bio: string | null;
  avatarUrl: string | null;
  isPublic: boolean;
  themePreference: ThemeName;
  createdAt: string;
}

export interface UserPublic {
  id: number;
  name: string | null;
  username: string | null;
  bio: string | null;
  avatarUrl: string | null;
}

export interface UserUpdate {
  name?: string;
  username?: string;
  bio?: string;
  avatarUrl?: string;
  isPublic?: boolean;
  themePreference?: ThemeName;
}

export interface Idea {
  id: number;
  userId: number;
  title: string;
  insight: string | null;
  origin: string | null;
  notes: string | null;
  videoEditingNotes: string | null;
  createdDate: string;
  usedDate: string | null;
  customDate: string | null;
  isUsed: boolean;
  branchCount: number;
  parentIdeaId: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface IdeaDetail extends Idea {
  branches: Idea[];
}

export interface IdeaInput {
  title: string;
  insight?: string;
  origin?: string;
  notes?: string;
  videoEditingNotes?: string;
  customDate?: string;
}

export interface IdeaUpdate {
  title?: string;
  insight?: string;
  origin?: string;
  notes?: string;
  videoEditingNotes?: string;
  customDate?: string;
  usedDate?: string;
  isUsed?: boolean;
}

export interface IdeaStats {
  total: number;
  used: number;
  unused: number;
  withBranches: number;
  totalBranches: number;
  createdThisWeek: number;
  createdThisMonth: number;
}

export interface BranchInput {
  title: string;
  insight?: string;
  notes?: string;
  videoEditingNotes?: string;
}

export interface MarkUsedInput {
  usedDate?: string;
}

export interface PublicProfile {
  user: UserPublic;
  ideas: IdeaDetail[];
}

export interface FriendRequest {
  id: number;
  requesterId: number;
  addresseeId: number;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
  updatedAt: string;
}

export interface FriendsList {
  friends: UserPublic[];
  pendingReceived: FriendRequest[];
  pendingSent: FriendRequest[];
}

export interface Message {
  id: number;
  senderId: number;
  receiverId: number;
  content: string;
  isRead: boolean;
  createdAt: string;
}

export interface MessageInput {
  content: string;
}

export interface TrendDashboard {
  topics: TrendTopic[];
  hashtags: TrendHashtag[];
  categories: string[];
}

export interface TrendTopic {
  title: string;
  description?: string;
  relevance?: number;
}

export interface TrendHashtag {
  tag: string;
  count?: number;
}

export interface TrendAnalysis {
  relevance: number;
  opportunities: string[];
  suggestedAngles: string[];
  keywords: string[];
}

export interface TrendInspiration {
  ideas: string[];
  hooks: string[];
  questions: string[];
  titlePatterns: string[];
}

export type ThemeName =
  | 'midnight'
  | 'ocean-deep'
  | 'monochrome'
  | 'cyber'
  | 'aurora'
  | 'nature'
  | 'sky'
  | 'crimson';

export interface HealthStatus {
  status: string;
}
