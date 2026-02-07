class Blog {
  final String id;
  final String authorId;
  final String title;
  final String summary;
  final String content;
  final String coverImageUrl;
  final String city;
  final String authorName;
  final String authorAvatar;
  final DateTime createdAt;

  final double rating;
  final int reviewCount;

  Blog({
    required this.id,
    required this.authorId,
    required this.title,
    required this.summary,
    required this.content,
    required this.coverImageUrl,
    required this.city,
    required this.authorName,
    required this.authorAvatar,
    required this.createdAt,
    required this.rating,
    required this.reviewCount,
  });

  factory Blog.fromJson(Map<String, dynamic> json) {
    return Blog(
      id: json['id'] ?? "",
      authorId: json['author_id'] ?? "",
      title: json['title'] ?? "Untitled",
      summary: json['summary'] ?? "",
      content: json['content'] ?? "",
      coverImageUrl: json['cover_image_url'] ?? "",
      city: json['city'] ?? "",
      authorName: json['author_name'] ?? "Unknown",
      authorAvatar: json['author_avatar'] ?? "",
      createdAt: DateTime.tryParse(json['created_at'] ?? "") ?? DateTime.now(),
      rating: (json['rating'] ?? 0).toDouble(),
      reviewCount: json['review_count'] ?? 0,
    );
  }
}
