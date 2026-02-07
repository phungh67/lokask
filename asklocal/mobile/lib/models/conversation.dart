class Conversation {
  final String id;
  final String travelerId;
  final String consultantId;
  final String? lastMessage;
  final DateTime lastMessageAt;
  final String otherUserName;
  final String? otherUserAvatar;
  final int unreadCount;

  Conversation({
    required this.id,
    required this.travelerId,
    required this.consultantId,
    this.lastMessage,
    required this.lastMessageAt,
    required this.otherUserName,
    this.otherUserAvatar,
    required this.unreadCount,
  });

  factory Conversation.fromJson(Map<String, dynamic> json) {
    return Conversation(
      id: json['id'],
      travelerId: json['traveler_id'],
      consultantId: json['consultant_id'],
      lastMessage: json['last_message'],
      // Parse timestamp or default to now if null
      lastMessageAt: json['last_message_at'] != null 
          ? DateTime.parse(json['last_message_at']) 
          : DateTime.now(),
      otherUserName: json['other_user_name'] ?? "Unknown User",
      otherUserAvatar: json['other_user_avatar'],
      unreadCount: json['unread_count'] ?? 0,
    );
  }
}