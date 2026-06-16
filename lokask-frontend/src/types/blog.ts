export interface Blog {
  id: string;
  authorId: string;
  title: string;
  summary: string;
  coverImageUrl: string;
  content: string;
  createdAt: string;
  authorName?: string;
  authorAvatar?: string;

  // should be calculate later (backend logic)
  category?: string; 
  readTime?: string; 
  viewsCount?: number; 
}