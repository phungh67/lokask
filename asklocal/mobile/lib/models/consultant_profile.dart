class Badge {
  final String id;
  final String iconName; // e.g., "emoji_events"
  final String title;
  final String description;

  Badge({
    required this.id,
    required this.iconName,
    required this.title,
    required this.description,
  });

  factory Badge.fromJson(Map<String, dynamic> json) {
    return Badge(
      id: json['id'] ?? '',
      iconName: json['icon_name'] ?? 'check_circle',
      title: json['title'] ?? '',
      description: json['description'] ?? '',
    );
  }
}

class Review {
  final String id;
  final String reviewerName;
  final String reviewerAvatar;
  final int rating;
  final String comment;
  final bool verifiedStay;
  final String date;

  Review({
    required this.id,
    required this.reviewerName,
    required this.reviewerAvatar,
    required this.rating,
    required this.comment,
    required this.verifiedStay,
    required this.date,
  });

  factory Review.fromJson(Map<String, dynamic> json) {
    return Review(
      id: json['id'] ?? '',
      reviewerName: json['reviewer_name'] ?? 'Anonymous',
      reviewerAvatar: json['reviewer_avatar'] ?? '',
      rating: json['rating'] ?? 5,
      comment: json['comment'] ?? '',
      verifiedStay: json['verified_stay'] ?? false,
      date: json['date'] ?? '',
    );
  }
}

class ConsultantProfile {
  final String id;
  final String fullName;
  final String avatarUrl;
  final String bio;
  final double hourlyRate;
  final double rating;
  final bool isVerified;
  final String city;
  final String country;

  final String languages;
  final String responseTime;

  final List<Badge> badges;

  final List<Review> reviews;

  final List<String> niches;
  final List<String> portfolio;

  ConsultantProfile({
    required this.id,
    required this.fullName,
    required this.avatarUrl,
    required this.bio,
    required this.hourlyRate,
    required this.rating,
    required this.isVerified,
    required this.city,
    required this.country,
    required this.badges,
    required this.languages,
    required this.responseTime,
    required this.reviews,
    required this.niches,
    required this.portfolio,
  });

  factory ConsultantProfile.fromJson(Map<String, dynamic> json) {
    var reviewList = json['reviews'] as List?;

    List<Review> reviews = reviewList != null
        ? reviewList.map((i) => Review.fromJson(i)).toList()
        : [];

    var badgeList = json['badges'] as List?;
    List<Badge> badges = badgeList != null
        ? badgeList.map((i) => Badge.fromJson(i)).toList()
        : [];

    return ConsultantProfile(
      id: json['id'],
      fullName: json['full_name'],
      avatarUrl: json['avatar_url'] ?? '',
      bio: json['bio'] ?? '',
      // Handle int to double conversion safely
      hourlyRate: (json['hourly_rate'] as num).toDouble(),
      rating: (json['rating'] as num).toDouble(),
      isVerified: json['is_verified'],
      city: json['city'],
      country: json['country'],
      languages: json['languages'] ?? 'English',
      responseTime: json['response_time'] ?? 'Within 24h',

      badges: badges,
      reviews: reviews,
      
      niches: List<String>.from(json['niches'] ?? []),
      portfolio: List<String>.from(json['portfolio'] ?? []),
    );
  }
}
  // DEVOPS FIX: Android Emulator sees 'localhost' as its own device.
//   // We must map 'localhost' -> '10.0.2.2' for Android to reach the host machine.
//   static String _fixLocalhost(String url) {
//     if (url.contains('localhost') || url.contains('127.0.0.1')) {
//       // Platform check logic should ideally be here, simplified for brevity
//       return url.replaceFirst('localhost', '10.0.2.2');
//     }
//     return url;
//   }
// }