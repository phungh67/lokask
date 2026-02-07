class Message {
  final int id;
  final String conversationId;
  final String senderId;
  final String content;
  final bool isRead;
  final bool isMe; // This comes from your backend logic!
  final DateTime createdAt;

  Message({
    required this.id,
    required this.conversationId,
    required this.senderId,
    required this.content,
    required this.isRead,
    required this.isMe,
    required this.createdAt,
  });

  factory Message.fromJson(Map<String, dynamic> json) {
    return Message(
      id: json['id'],
      conversationId: json['conversation_id'],
      senderId: json['sender_id'],
      content: json['content'],
      isRead: json['is_read'] ?? false,
      isMe: json['is_me'] ?? false,
      createdAt: DateTime.parse(json['created_at']),
    );
  }
}