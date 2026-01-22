import { ConversationSummary } from "@/components/chat/types";

export interface DashboardTraveller {
  id: string;
  name: string;
  avatar: string;
  isOnline: boolean;
}

export interface DashboardMessage {
  id: string;
  content: string;
  sender: "traveller" | "consultant";
  timestamp: Date;
  type: "text" | "image" | "location";
  locationData?: {
    name: string;
    image: string;
    hashtags: string[];
  };
}

export interface DashboardConversation {
  id: string;
  traveller: DashboardTraveller;
  context: string;
  lastMessage: string;
  status: "active" | "new" | "booked" | "waiting" | "archived";
  unreadCount: number;
  isTyping: boolean;
  timestamp: Date;
  messages: DashboardMessage[];
  summary: ConversationSummary;
}

export interface DashboardConsultant {
  id: string;
  name: string;
  city: string;
  country: string;
  avatar: string;
  photo: string;
  isOnline: boolean;
  weeklyEarnings: number;
}

// Sample consultant (logged in user)
export const currentConsultant: DashboardConsultant = {
  id: "giulia-1",
  name: "Giulia",
  city: "Rome",
  country: "Italy",
  avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop",
  photo: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop",
  isOnline: true,
  weeklyEarnings: 450,
};

// Sample conversations
export const mockConversations: DashboardConversation[] = [
  {
    id: "conv-1",
    traveller: {
      id: "sarah-1",
      name: "Sarah Chen",
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop",
      isOnline: true,
    },
    context: "Rome trip",
    lastMessage: "What about food near Trastevere?",
    status: "active",
    unreadCount: 2,
    isTyping: false,
    timestamp: new Date(Date.now() - 2 * 60 * 1000), // 2 min ago
    messages: [
      {
        id: "msg-1",
        content: "Hi Giulia! I'm planning a trip to Rome next month and I'd love to explore some hidden gems.",
        sender: "traveller",
        timestamp: new Date(Date.now() - 60 * 60 * 1000),
        type: "text",
      },
      {
        id: "msg-2",
        content: "Ciao Sarah! Welcome! I'd be happy to help you discover the real Rome. What are you most interested in - food, history, art, or local neighborhoods?",
        sender: "consultant",
        timestamp: new Date(Date.now() - 55 * 60 * 1000),
        type: "text",
      },
      {
        id: "msg-3",
        content: "Definitely food and local neighborhoods! I want to eat where the locals eat.",
        sender: "traveller",
        timestamp: new Date(Date.now() - 50 * 60 * 1000),
        type: "text",
      },
      {
        id: "msg-4",
        content: "Perfect! Then you must visit Testaccio - it's the original foodie neighborhood of Rome. Here's one of my favorite spots:",
        sender: "consultant",
        timestamp: new Date(Date.now() - 45 * 60 * 1000),
        type: "text",
      },
      {
        id: "msg-5",
        content: "",
        sender: "consultant",
        timestamp: new Date(Date.now() - 44 * 60 * 1000),
        type: "location",
        locationData: {
          name: "Mercato di Testaccio",
          image: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400&h=300&fit=crop",
          hashtags: ["local", "market", "food"],
        },
      },
      {
        id: "msg-6",
        content: "This looks amazing! What about food near Trastevere?",
        sender: "traveller",
        timestamp: new Date(Date.now() - 2 * 60 * 1000),
        type: "text",
      },
    ],
    summary: {
      preferences: ["authentic local food", "hidden neighborhoods", "walking tours"],
      placesmentioned: ["Testaccio", "Trastevere", "Mercato di Testaccio"],
      decisions: ["explore Trastevere afternoon", "avoid tourist traps"],
      nextSteps: ["send local trattoria list", "recommend walking route"],
    },
  },
  {
    id: "conv-2",
    traveller: {
      id: "mike-1",
      name: "Mike Johnson",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
      isOnline: false,
    },
    context: "First time in Rome",
    lastMessage: "",
    status: "new",
    unreadCount: 1,
    isTyping: true,
    timestamp: new Date(Date.now() - 5 * 60 * 1000), // 5 min ago
    messages: [
      {
        id: "msg-1",
        content: "Hey! This is my first time visiting Rome. Can you help me plan a 3-day itinerary?",
        sender: "traveller",
        timestamp: new Date(Date.now() - 5 * 60 * 1000),
        type: "text",
      },
    ],
    summary: {
      preferences: ["first-time visitor", "comprehensive itinerary"],
      placesmentioned: ["Rome"],
      decisions: [],
      nextSteps: ["discuss trip duration", "understand interests"],
    },
  },
  {
    id: "conv-3",
    traveller: {
      id: "emma-1",
      name: "Emma Wilson",
      avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop",
      isOnline: true,
    },
    context: "Anniversary trip",
    lastMessage: "We booked the restaurant you suggested!",
    status: "booked",
    unreadCount: 0,
    isTyping: false,
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    messages: [
      {
        id: "msg-1",
        content: "We booked the restaurant you suggested! So excited for our anniversary dinner.",
        sender: "traveller",
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
        type: "text",
      },
    ],
    summary: {
      preferences: ["romantic dining", "special occasion"],
      placesmentioned: ["Ristorante Aroma"],
      decisions: ["booked anniversary dinner"],
      nextSteps: ["confirm reservation details"],
    },
  },
  {
    id: "conv-4",
    traveller: {
      id: "david-1",
      name: "David Park",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop",
      isOnline: false,
    },
    context: "Art & museums",
    lastMessage: "Thanks for the Vatican tips!",
    status: "waiting",
    unreadCount: 0,
    isTyping: false,
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
    messages: [
      {
        id: "msg-1",
        content: "Thanks for the Vatican tips! Will definitely book the early morning slot.",
        sender: "traveller",
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
        type: "text",
      },
    ],
    summary: {
      preferences: ["art museums", "skip-the-line access"],
      placesmentioned: ["Vatican", "Sistine Chapel"],
      decisions: ["early morning Vatican visit"],
      nextSteps: ["follow up on booking"],
    },
  },
  {
    id: "conv-5",
    traveller: {
      id: "lisa-1",
      name: "Lisa Martinez",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop",
      isOnline: false,
    },
    context: "Family vacation",
    lastMessage: "Kids loved the gelato tour idea!",
    status: "active",
    unreadCount: 0,
    isTyping: false,
    timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 min ago
    messages: [
      {
        id: "msg-1",
        content: "Kids loved the gelato tour idea! Any other family-friendly suggestions?",
        sender: "traveller",
        timestamp: new Date(Date.now() - 30 * 60 * 1000),
        type: "text",
      },
    ],
    summary: {
      preferences: ["family-friendly", "kid activities", "gelato"],
      placesmentioned: ["Giolitti", "Villa Borghese"],
      decisions: ["gelato tour confirmed"],
      nextSteps: ["suggest Villa Borghese activities"],
    },
  },
];

// Helper to get conversation counts by status
export const getConversationCounts = () => {
  const counts = {
    all: mockConversations.length,
    new: mockConversations.filter((c) => c.status === "new").length,
    booked: mockConversations.filter((c) => c.status === "booked").length,
    archived: mockConversations.filter((c) => c.status === "archived").length,
  };
  return counts;
};

// Helper to format relative time
export const formatRelativeTime = (date: Date): string => {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return "now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
};
