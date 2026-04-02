export type BlogPost = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  coverImageUrl: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type BlogPostInput = {
  title: string;
  body: string;
  excerpt?: string;
  coverImageUrl: string;
  isActive?: boolean;
};
