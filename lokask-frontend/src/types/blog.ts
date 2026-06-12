export interface Blog {
  id: string;
  title: string;
  summary: string;
  coverImageUrl: string;
  createdAt: string;
  authorName?: string;
  authorAvatar?: string;

  // should be calculate later (backend logic)
  category?: string; 
  readTime?: string; 
  viewsCount?: number; 
}