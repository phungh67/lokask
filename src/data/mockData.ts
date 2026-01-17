export interface Consultant {
  id: string;
  name: string;
  city: string;
  tag: string;
  rating: number;
  helpedCount: number;
  avatarUrl: string;
  coverUrl: string;
}

export interface Destination {
  slug: string;
  name: string;
  imageUrl: string;
}

export interface Idea {
  id: string;
  title: string;
  desc: string;
  destination: string;
  imageUrl: string;
}

export const consultants: Consultant[] = [
  {
    id: "1",
    name: "Giulia",
    city: "Rome",
    tag: "Food & neighborhoods",
    rating: 4.9,
    helpedCount: 150,
    avatarUrl: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=150&h=150&fit=crop&crop=face",
    coverUrl: "https://images.unsplash.com/photo-1552566626-52f8b828add9?w=400&h=200&fit=crop"
  },
  {
    id: "2",
    name: "Marco",
    city: "Rome",
    tag: "History & Art",
    rating: 4.9,
    helpedCount: 150,
    avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
    coverUrl: "https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=400&h=200&fit=crop"
  },
  {
    id: "3",
    name: "Eriva",
    city: "Rome",
    tag: "History & Art",
    rating: 4.9,
    helpedCount: 150,
    avatarUrl: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
    coverUrl: "https://images.unsplash.com/photo-1515542622106-78bda8ba0e5b?w=400&h=200&fit=crop"
  },
  {
    id: "4",
    name: "Velaman",
    city: "Rome",
    tag: "Food & neighborhoods",
    rating: 4.9,
    helpedCount: 150,
    avatarUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
    coverUrl: "https://images.unsplash.com/photo-1529260830199-42c24126f198?w=400&h=200&fit=crop"
  },
  {
    id: "5",
    name: "Sophie",
    city: "Paris",
    tag: "Hidden gems & nightlife",
    rating: 4.8,
    helpedCount: 120,
    avatarUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face",
    coverUrl: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=400&h=200&fit=crop"
  },
  {
    id: "6",
    name: "Kenji",
    city: "Tokyo",
    tag: "Nature & outdoors",
    rating: 4.9,
    helpedCount: 200,
    avatarUrl: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&h=150&fit=crop&crop=face",
    coverUrl: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=400&h=200&fit=crop"
  }
];

export const destinations: Destination[] = [
  { slug: "rome", name: "Rome", imageUrl: "https://images.unsplash.com/photo-1529260830199-42c24126f198?w=600&h=400&fit=crop" },
  { slug: "paris", name: "Paris", imageUrl: "https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=600&h=400&fit=crop" },
  { slug: "london", name: "London", imageUrl: "https://images.unsplash.com/photo-1486299267070-83823f5448dd?w=600&h=400&fit=crop" },
  { slug: "new-york", name: "New York", imageUrl: "https://images.unsplash.com/photo-1485871981521-5b1fd3805eee?w=600&h=400&fit=crop" },
  { slug: "tokyo", name: "Tokyo", imageUrl: "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=600&h=400&fit=crop" },
  { slug: "barcelona", name: "Barcelona", imageUrl: "https://images.unsplash.com/photo-1539037116277-4db20889f2d4?w=600&h=400&fit=crop" },
  { slug: "amsterdam", name: "Amsterdam", imageUrl: "https://images.unsplash.com/photo-1534351590666-13e3e96b5017?w=600&h=400&fit=crop" },
  { slug: "dubai", name: "Dubai", imageUrl: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=600&h=400&fit=crop" },
  { slug: "sydney", name: "Sydney", imageUrl: "https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=600&h=400&fit=crop" },
  { slug: "lisbon", name: "Lisbon", imageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&h=400&fit=crop" },
  { slug: "singapore", name: "Singapore", imageUrl: "https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=600&h=400&fit=crop" },
  { slug: "bali", name: "Bali", imageUrl: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=600&h=400&fit=crop" }
];

export const ideas: Idea[] = [
  {
    id: "1",
    title: "Where to find the best carbonara",
    desc: "Skip the tourist traps and eat where Romans actually go.",
    destination: "Rome",
    imageUrl: "https://images.unsplash.com/photo-1612874742237-6526221588e3?w=600&h=400&fit=crop"
  },
  {
    id: "2",
    title: "Hidden courtyards of the Marais",
    desc: "Quiet spots locals retreat to away from the crowds.",
    destination: "Paris",
    imageUrl: "https://images.unsplash.com/photo-1550340499-a6c60fc8287c?w=600&h=400&fit=crop"
  },
  {
    id: "3",
    title: "Morning fish markets in Tsukiji",
    desc: "Experience Tokyo's food culture before the tourists wake up.",
    destination: "Tokyo",
    imageUrl: "https://images.unsplash.com/photo-1580822184713-fc5400e7fe10?w=600&h=400&fit=crop"
  },
  {
    id: "4",
    title: "Secret viewpoints over Barcelona",
    desc: "The best sunset spots that aren't on Instagram yet.",
    destination: "Barcelona",
    imageUrl: "https://images.unsplash.com/photo-1583422409516-2895a77efded?w=600&h=400&fit=crop"
  },
  {
    id: "5",
    title: "Borough Market on a weekday",
    desc: "How to enjoy London's famous market without the weekend chaos.",
    destination: "London",
    imageUrl: "https://images.unsplash.com/photo-1528698827591-e19ccd7bc23d?w=600&h=400&fit=crop"
  },
  {
    id: "6",
    title: "Brooklyn neighborhoods worth exploring",
    desc: "Beyond Williamsburg: where New Yorkers actually hang out.",
    destination: "New York",
    imageUrl: "https://images.unsplash.com/photo-1555109307-f7d9da25c244?w=600&h=400&fit=crop"
  }
];

export const whoFilterOptions = [
  "Food & neighborhoods",
  "History & art",
  "Hidden gems & nightlife",
  "Family travel & parks",
  "Nature & outdoors",
  "Budget travel"
];
