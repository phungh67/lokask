import { ChatMessage, ConversationSummary } from "./types";

export const mockMessages: ChatMessage[] = [
  {
    id: "1",
    type: "text",
    content: "Hi Giulia! I'm visiting Rome next week. Any recommendations for local food markets?",
    sender: "user",
    timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 mins ago
  },
  {
    id: "2",
    type: "text",
    content: "Ciao! Welcome! 🇮🇹 You should definitely visit Campo de' Fiori and Testaccio Market! Both are amazing for authentic Roman food.",
    sender: "consultant",
    timestamp: new Date(Date.now() - 1000 * 60 * 28),
  },
  {
    id: "3",
    type: "image",
    content: "Here's what Testaccio looks like on a Saturday morning:",
    imageUrl: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400&h=300&fit=crop",
    sender: "consultant",
    timestamp: new Date(Date.now() - 1000 * 60 * 25),
  },
  {
    id: "4",
    type: "map",
    content: "This is the exact location - easy to reach by metro!",
    mapData: {
      name: "Mercato di Testaccio",
      address: "Via Beniamino Franklin, 00153 Roma RM, Italy",
      thumbnailUrl: "https://images.unsplash.com/photo-1569336415962-a4bd9f69cd83?w=400&h=200&fit=crop",
      mapsUrl: "https://maps.google.com/?q=Mercato+di+Testaccio",
    },
    sender: "consultant",
    timestamp: new Date(Date.now() - 1000 * 60 * 23),
  },
  {
    id: "5",
    type: "text",
    content: "Amazing! Any hidden gems nearby? Something off the beaten path?",
    sender: "user",
    timestamp: new Date(Date.now() - 1000 * 60 * 15),
  },
  {
    id: "6",
    type: "text",
    content: "Absolutely! There's a tiny pasta shop called 'Pasta e Vino' just around the corner. Locals love it but tourists rarely find it. I can share more spots like this! 😊",
    sender: "consultant",
    timestamp: new Date(Date.now() - 1000 * 60 * 12),
  },
];

export const mockSummary: ConversationSummary = {
  preferences: ["Local food markets", "Authentic experiences", "Hidden gems"],
  placesmentioned: ["Campo de' Fiori", "Testaccio Market", "Pasta e Vino"],
  decisions: ["Visit Testaccio on Saturday morning"],
  nextSteps: ["Get directions", "Ask for nearby restaurant recommendations"],
};
