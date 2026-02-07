class Niche {
  final int id;
  final String slug;
  final String displayName;

  Niche({required this.id, required this.slug, required this.displayName});

  factory Niche.fromJson(Map<String, dynamic> json) {
    return Niche(
      id: json['id'],
      slug: json['slug'],
      displayName: json['display_name'],
    );
  }
}