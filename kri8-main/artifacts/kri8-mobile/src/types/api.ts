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

export interface PublicIdea {
  id: number;
  title: string;
  insight: string | null;
  isUsed: boolean;
}

export interface PublicProfile {
  user: UserPublic;
  ideas: PublicIdea[];
  nextCursor: number | null;
}

export interface FriendRequest {
  id: number;
  requester?: UserPublic;
  addressee?: UserPublic;
  requesterId?: number;
  addresseeId?: number;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
  updatedAt?: string;
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

export interface Conversation {
  partner: UserPublic;
  lastMessage: Message;
  unreadCount: number;
}

export interface MessageInput {
  content: string;
}

export interface TrendDashboard {
  topics: TrendTopic[];
  hashtags: TrendHashtag[];
  categories: TrendCategory[];
  provider: 'mock' | 'youtube';
  source: 'mock' | 'youtube';
  fetchedAt: string | null;
  isStatic: boolean;
  metricsQuality: 'fixture' | 'estimated' | 'measured';
  dataKind: 'fixture' | 'popular_content' | 'historical_trends';
}

export interface TrendTopic {
  id: string;
  name: string;
  category: string;
  growthPercent: number | null;
  volume: number | null;
  platform: string;
  sourceUrl?: string;
  description?: string;
  channelTitle?: string;
  publishedAt?: string;
  likes?: number;
  comments?: number;
}

export interface TrendHashtag {
  tag: string;
  platform: string;
  volume: number | null;
  growthPercent: number | null;
}

export interface TrendCategory {
  name: string;
  growthPercent: number | null;
  topContent: string[];
}

export interface TrendAnalysis {
  canonicalQuery: string;
  relevanceScore: number | null;
  confidence: 'high' | 'medium' | 'low' | 'insufficient';
  scoringEvidence: string[];
  relatedTopics: TrendTopic[];
  relatedHashtags: TrendHashtag[];
  contentOpportunities: string[];
  formatAdaptations: string[];
  suggestedAngles: string[];
  audienceFit?: string;
  differentiation?: string;
  recommendedHook?: string;
  risks?: string[];
}

export interface TrendCreatorBreakdown {
  openingHook: string;
  structure: string[];
  whyItMayWork: string[];
  adaptationAngle: string;
  evidenceNote: string;
}

export interface TrendInspiration {
  canonicalQuery: string;
  relatedIdeas: string[];
  alternativeHooks: string[];
  titleSuggestions: string[];
  audienceQuestions: string[];
  source: 'openai';
  trendContextAvailable?: boolean;
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
