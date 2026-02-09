export interface Consultant {
  id: string;
  name: string;
  city: string;
  tag: string;
  tags: string[];
  quote: string;
  rating: number;
  helpedCount: number;
  avatarUrl: string;
  coverUrl: string;
  isHighlyTrusted?: boolean;
  bio?: string;
  languages?: string[];
  responseTime?: string;
  galleryImages?: string[];
}

// top local to test Jane local
export const topLocals = [
  {
    id: "jane-1",
    name: "Jane Local",
    avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Jane", // Or your local image
    coverUrl: "https://images.unsplash.com/photo-1493246507139-91e8fad9978e?auto=format&fit=crop&w=400&q=80",
    bio: "I know every coffee shop in the city.",
    quote: "Live like a local, not a tourist.",
    rating: 5.0,
    helpedCount: 150,
    isHighlyTrusted: true,
    tag: "quick",
    tags: ["Coffee", "Photography"],
    city: "Heraklion",
    country: "Greece"
  },
  // ... add other top locals (Alessandro, Sakura, etc.) here
];

// Gallery images by city for consultants
const cityGalleryImages: Record<string, string[]> = {
  "Rome": [
    "https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1515542622106-78bda8ba0e5b?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1529260830199-42c24126f198?w=800&h=600&fit=crop",
  ],
  "Paris": [
    "https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1550340499-a6c60fc8287c?w=800&h=600&fit=crop",
  ],
  "Tokyo": [
    "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1536098561742-ca998e48cbcc?w=800&h=600&fit=crop",
  ],
  "Bangkok": [
    "https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1563492065599-3520f775eeed?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1506665531195-3566af2b4dfa?w=800&h=600&fit=crop",
  ],
  "Chiang Mai": [
    "https://images.unsplash.com/photo-1528181304800-259b08848526?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1512553631425-adbb0e4df7ed?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1569936890410-5063755b3b9a?w=800&h=600&fit=crop",
  ],
  "Phuket": [
    "https://images.unsplash.com/photo-1589394815804-964ed0be2eb5?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1537956965359-7573183d8f53?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1519451241324-20b4ea2c4220?w=800&h=600&fit=crop",
  ],
  "Krabi": [
    "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1506665531195-3566af2b4dfa?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=800&h=600&fit=crop",
  ],
  "Chiang Rai": [
    "https://images.unsplash.com/photo-1569936890410-5063755b3b9a?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1528181304800-259b08848526?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1512553631425-adbb0e4df7ed?w=800&h=600&fit=crop",
  ],
};

// Helper function to get gallery images for a consultant
export const getGalleryImages = (consultant: Consultant): string[] => {
  if (consultant.galleryImages && consultant.galleryImages.length > 0) {
    return consultant.galleryImages;
  }
  return cityGalleryImages[consultant.city] || [consultant.coverUrl, consultant.coverUrl, consultant.coverUrl];
};

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

export interface Review {
  id: string;
  consultantId: string;
  reviewerName: string;
  reviewerAvatar: string;
  rating: number;
  comment: string;
  date: string;
  tripType?: string;
}

export const consultants: Consultant[] = [
  {
    id: "1",
    name: "Giulia",
    city: "Rome",
    tag: "Food & neighborhoods",
    tags: ["Food", "Neighborhoods"],
    quote: "I help travellers eat like locals, not tourists.",
    rating: 4.9,
    helpedCount: 150,
    avatarUrl: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=400&h=500&fit=crop&crop=face",
    coverUrl: "https://images.unsplash.com/photo-1552566626-52f8b828add9?w=400&h=200&fit=crop",
    bio: "Born and raised in Trastevere, I've spent my life exploring Rome's culinary scene. From hidden trattorias to the best gelato spots, I know where Romans actually eat. Let me guide you through authentic Roman cuisine.",
    languages: ["Italian", "English", "Spanish"],
    responseTime: "Usually within 2 hours"
  },
  {
    id: "2",
    name: "Marco",
    city: "Rome",
    tag: "History & Art",
    tags: ["History", "Art"],
    quote: "Rome's history comes alive when you know where to look.",
    rating: 4.9,
    helpedCount: 150,
    avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=500&fit=crop&crop=face",
    coverUrl: "https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=400&h=200&fit=crop",
    bio: "Art historian by training, Roman by heart. I'll take you beyond the Colosseum to discover the hidden layers of history that make this city eternal.",
    languages: ["Italian", "English"],
    responseTime: "Usually within 3 hours"
  },
  {
    id: "3",
    name: "Eriva",
    city: "Rome",
    tag: "History & Art",
    tags: ["History", "Art"],
    quote: "Every corner of Rome tells a story.",
    rating: 4.9,
    helpedCount: 150,
    avatarUrl: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=500&fit=crop&crop=face",
    coverUrl: "https://images.unsplash.com/photo-1515542622106-78bda8ba0e5b?w=400&h=200&fit=crop",
    bio: "I grew up running through the ancient streets of Rome. Now I share those secret paths with travelers who want more than just selfies.",
    languages: ["Italian", "English", "French"],
    responseTime: "Usually within 1 hour"
  },
  {
    id: "4",
    name: "Velaman",
    city: "Rome",
    tag: "Food & neighborhoods",
    tags: ["Food", "Neighborhoods"],
    quote: "The best trattorias are never on the main streets.",
    rating: 4.9,
    helpedCount: 150,
    avatarUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=500&fit=crop&crop=face",
    coverUrl: "https://images.unsplash.com/photo-1529260830199-42c24126f198?w=400&h=200&fit=crop",
    bio: "Former chef turned local guide. I know every back alley restaurant where the food is incredible and the prices are fair.",
    languages: ["Italian", "English"],
    responseTime: "Usually within 4 hours"
  },
  {
    id: "5",
    name: "Sophie",
    city: "Paris",
    tag: "Hidden gems & nightlife",
    tags: ["Hidden gems", "Nightlife"],
    quote: "Paris has secrets only locals know.",
    rating: 4.8,
    helpedCount: 120,
    avatarUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=500&fit=crop&crop=face",
    coverUrl: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=400&h=200&fit=crop",
    bio: "Paris native who loves showing visitors the city beyond the postcard views. From hidden speakeasies to secret gardens.",
    languages: ["French", "English"],
    responseTime: "Usually within 2 hours"
  },
  {
    id: "6",
    name: "Kenji",
    city: "Tokyo",
    tag: "Nature & outdoors",
    tags: ["Nature", "Outdoors"],
    quote: "Tokyo is more than neon lights and crowds.",
    rating: 4.9,
    helpedCount: 200,
    avatarUrl: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=500&fit=crop&crop=face",
    coverUrl: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=400&h=200&fit=crop",
    bio: "I'll show you the peaceful side of Tokyo - tranquil gardens, mountain trails, and nature escapes just minutes from the city center.",
    languages: ["Japanese", "English"],
    responseTime: "Usually within 3 hours"
  }
];

// Thailand-based consultants for the carousel
export const thailandConsultants: Consultant[] = [
  {
    id: "th-1",
    name: "Niran",
    city: "Bangkok",
    tag: "Street food & markets",
    tags: ["Street food", "Hidden markets"],
    quote: "I show you where Bangkok locals really eat.",
    rating: 4.9,
    helpedCount: 180,
    avatarUrl: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&h=500&fit=crop&crop=face",
    coverUrl: "https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=400&h=200&fit=crop",
    isHighlyTrusted: true,
    bio: "Street food is my passion. I've been eating at the same stalls my grandmother took me to as a child. Let me share Bangkok's real flavors with you.",
    languages: ["Thai", "English", "Mandarin"],
    responseTime: "Usually within 1 hour"
  },
  {
    id: "th-2",
    name: "Suda",
    city: "Chiang Mai",
    tag: "Temples & culture",
    tags: ["Temples", "Culture"],
    quote: "I help you understand the spiritual side of Thailand.",
    rating: 4.9,
    helpedCount: 145,
    avatarUrl: "https://images.unsplash.com/photo-1534751516642-a1af1ef26a56?w=400&h=500&fit=crop&crop=face",
    coverUrl: "https://images.unsplash.com/photo-1528181304800-259b08848526?w=400&h=200&fit=crop",
    bio: "Growing up near the old city temples, I learned meditation and Buddhist traditions from monks. I share this spiritual heritage with respectful travelers.",
    languages: ["Thai", "English"],
    responseTime: "Usually within 2 hours"
  },
  {
    id: "th-3",
    name: "Korn",
    city: "Phuket",
    tag: "Beaches & islands",
    tags: ["Beaches", "Islands"],
    quote: "Best beaches without the tourist crowds.",
    rating: 4.8,
    helpedCount: 210,
    avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=500&fit=crop&crop=face",
    coverUrl: "https://images.unsplash.com/photo-1589394815804-964ed0be2eb5?w=400&h=200&fit=crop",
    bio: "Former diving instructor who knows every hidden cove and secret beach in Southern Thailand. I'll help you escape the crowds.",
    languages: ["Thai", "English"],
    responseTime: "Usually within 3 hours"
  },
  {
    id: "th-4",
    name: "Ploy",
    city: "Bangkok",
    tag: "Nightlife & rooftops",
    tags: ["Nightlife", "Rooftops"],
    quote: "Bangkok nightlife like a local, not a tourist.",
    rating: 4.9,
    helpedCount: 165,
    avatarUrl: "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=400&h=500&fit=crop&crop=face",
    coverUrl: "https://images.unsplash.com/photo-1563492065599-3520f775eeed?w=400&h=200&fit=crop",
    isHighlyTrusted: true,
    bio: "From underground jazz bars to the best rooftop views, I know where Bangkok comes alive after dark. Skip the tourist traps and party with locals.",
    languages: ["Thai", "English", "Korean"],
    responseTime: "Usually within 2 hours"
  },
  {
    id: "th-5",
    name: "Tawan",
    city: "Krabi",
    tag: "Nature & adventures",
    tags: ["Nature", "Adventures"],
    quote: "Adventure beyond the guidebooks.",
    rating: 4.8,
    helpedCount: 130,
    avatarUrl: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=400&h=500&fit=crop&crop=face",
    coverUrl: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=400&h=200&fit=crop",
    bio: "Rock climbing guide and nature enthusiast. I'll take you to waterfalls, caves, and viewpoints that most tourists never see.",
    languages: ["Thai", "English"],
    responseTime: "Usually within 4 hours"
  },
  {
    id: "th-6",
    name: "Mai",
    city: "Chiang Rai",
    tag: "Hill tribes & traditions",
    tags: ["Hill tribes", "Traditions"],
    quote: "Authentic hill tribe experiences, respectfully.",
    rating: 4.9,
    helpedCount: 95,
    avatarUrl: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&h=500&fit=crop&crop=face",
    coverUrl: "https://images.unsplash.com/photo-1569936890410-5063755b3b9a?w=400&h=200&fit=crop",
    isHighlyTrusted: true,
    bio: "I connect travelers with hill tribe communities in ethical, meaningful ways. Learn traditional crafts, share meals, and understand our culture.",
    languages: ["Thai", "English", "Akha"],
    responseTime: "Usually within 3 hours"
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

// Paris-based consultants for the carousel
export const parisConsultants: Consultant[] = [
  {
    id: "pa-1",
    name: "Sophie",
    city: "Paris",
    tag: "Hidden gems & nightlife",
    tags: ["Hidden gems", "Nightlife"],
    quote: "Paris has secrets only locals know.",
    rating: 4.8,
    helpedCount: 120,
    avatarUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=500&fit=crop&crop=face",
    coverUrl: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=400&h=200&fit=crop",
    bio: "Paris native who loves showing visitors the city beyond the postcard views. From hidden speakeasies to secret gardens, I know every corner of this magical city.",
    languages: ["French", "English"],
    responseTime: "Usually within 2 hours"
  },
  {
    id: "pa-2",
    name: "Antoine",
    city: "Paris",
    tag: "Wine & cuisine",
    tags: ["Wine", "Cuisine"],
    quote: "French gastronomy beyond the Michelin stars.",
    rating: 4.9,
    helpedCount: 185,
    avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=500&fit=crop&crop=face",
    coverUrl: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&h=200&fit=crop",
    bio: "Trained sommelier with a passion for French cuisine. I'll guide you through wine regions, bistros, and food markets that define authentic Parisian dining.",
    languages: ["French", "English", "Italian"],
    responseTime: "Usually within 3 hours"
  },
  {
    id: "pa-3",
    name: "Camille",
    city: "Paris",
    tag: "Art & museums",
    tags: ["Art", "Museums"],
    quote: "I show you art beyond the Louvre queues.",
    rating: 4.9,
    helpedCount: 160,
    avatarUrl: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=500&fit=crop&crop=face",
    coverUrl: "https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=400&h=200&fit=crop",
    isHighlyTrusted: true,
    bio: "Art history graduate from the Sorbonne. I've spent years exploring every museum, gallery, and street art corner of Paris. From impressionism to contemporary installations, I'll help you discover art that speaks to your soul.",
    languages: ["French", "English", "Spanish"],
    responseTime: "Usually within 1 hour"
  },
  {
    id: "pa-4",
    name: "Lucas",
    city: "Paris",
    tag: "Fashion & shopping",
    tags: ["Fashion", "Shopping"],
    quote: "Parisian style without the tourist prices.",
    rating: 4.8,
    helpedCount: 140,
    avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=500&fit=crop&crop=face",
    coverUrl: "https://images.unsplash.com/photo-1550340499-a6c60fc8287c?w=400&h=200&fit=crop",
    bio: "Fashion industry insider who knows where to find the best vintage shops, emerging designers, and secret sales that tourists never discover.",
    languages: ["French", "English"],
    responseTime: "Usually within 2 hours"
  },
  {
    id: "pa-5",
    name: "Margot",
    city: "Paris",
    tag: "Cafés & bakeries",
    tags: ["Cafés", "Bakeries"],
    quote: "The best croissants are never near the Eiffel Tower.",
    rating: 4.9,
    helpedCount: 195,
    avatarUrl: "https://images.unsplash.com/photo-1534751516642-a1af1ef26a56?w=400&h=500&fit=crop&crop=face",
    coverUrl: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&h=200&fit=crop",
    bio: "Former pastry chef turned café connoisseur. I've tested every croissant in Paris (tough job!) and know exactly where to find the flakiest, most buttery perfection.",
    languages: ["French", "English", "Portuguese"],
    responseTime: "Usually within 2 hours"
  },
  {
    id: "pa-6",
    name: "Théo",
    city: "Paris",
    tag: "Jazz & nightlife",
    tags: ["Jazz", "Nightlife"],
    quote: "Paris after midnight is a different city.",
    rating: 4.8,
    helpedCount: 110,
    avatarUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=500&fit=crop&crop=face",
    coverUrl: "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=400&h=200&fit=crop",
    bio: "Jazz musician by night, local guide by day. I know every underground jazz club, late-night bar, and secret venue where Parisians actually hang out.",
    languages: ["French", "English"],
    responseTime: "Usually within 4 hours"
  }
];

export const reviews: Review[] = [
  // Camille (pa-3) reviews
  {
    id: "r1",
    consultantId: "pa-3",
    reviewerName: "Sarah M.",
    reviewerAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face",
    rating: 5,
    comment: "Camille was absolutely amazing! She took us to galleries I never would have found on my own. Her knowledge of art history made every piece come alive. The Musée de l'Orangerie visit was a highlight of our trip.",
    date: "2025-12-15",
    tripType: "Couple"
  },
  {
    id: "r2",
    consultantId: "pa-3",
    reviewerName: "John D.",
    reviewerAvatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face",
    rating: 5,
    comment: "Best local guide experience ever! Camille's passion for art is contagious. She helped us skip the Louvre crowds and showed us incredible street art in the 13th arrondissement.",
    date: "2025-11-28",
    tripType: "Solo"
  },
  {
    id: "r3",
    consultantId: "pa-3",
    reviewerName: "Emma L.",
    reviewerAvatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face",
    rating: 5,
    comment: "Our family had an incredible time with Camille. She made art accessible and fun for our kids, and we discovered so many hidden gems. Highly recommend for families!",
    date: "2025-11-10",
    tripType: "Family"
  },
  {
    id: "r4",
    consultantId: "pa-3",
    reviewerName: "Michael R.",
    reviewerAvatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face",
    rating: 4,
    comment: "Very knowledgeable about Parisian art scene. Camille responded quickly and gave excellent recommendations. The only reason for 4 stars is we wished we had more time!",
    date: "2025-10-22",
    tripType: "Couple"
  },
  {
    id: "r5",
    consultantId: "pa-3",
    reviewerName: "Lisa T.",
    reviewerAvatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop&crop=face",
    rating: 5,
    comment: "Camille is a treasure! Her insider tips for the Musée d'Orsay saved us hours of queuing. She also recommended the perfect café nearby for our après-museum croissants.",
    date: "2025-10-05",
    tripType: "Friends"
  },
  // Sophie (pa-1) reviews
  {
    id: "r6",
    consultantId: "pa-1",
    reviewerName: "David K.",
    reviewerAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face",
    rating: 5,
    comment: "Sophie showed us Paris nightlife we never knew existed. The speakeasy she recommended was incredible!",
    date: "2025-12-01",
    tripType: "Couple"
  },
  // Niran (th-1) reviews
  {
    id: "r7",
    consultantId: "th-1",
    reviewerName: "Alex P.",
    reviewerAvatar: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=100&h=100&fit=crop&crop=face",
    rating: 5,
    comment: "Niran took us to street food stalls that blew our minds. Authentic Thai flavors at unbelievable prices. A must for foodies!",
    date: "2025-12-10",
    tripType: "Solo"
  },
  // Giulia (1) reviews
  {
    id: "r8",
    consultantId: "1",
    reviewerName: "Rachel B.",
    reviewerAvatar: "https://images.unsplash.com/photo-1534751516642-a1af1ef26a56?w=100&h=100&fit=crop&crop=face",
    rating: 5,
    comment: "Giulia's food recommendations were perfect. We ate the best carbonara of our lives in a tiny trattoria she suggested.",
    date: "2025-11-20",
    tripType: "Couple"
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
