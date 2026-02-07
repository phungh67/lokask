class ImageHelper {
  // Base Domain
  static const String _minioDomain = "http://localhost:9000";

  // Bucket Names
  static const String _assetsBucket = "screens";       // Static app images (hero, destinations)
  static const String _userBucket = "user-avatars";    // User profile pictures
  static const String _travelBucket = "travel-photos"; // Blog covers & uploaded travel content

  // ---------------------------------------------------------------------------
  // 1. Generic URL Fixer (Internal Helper)
  // ---------------------------------------------------------------------------
  // Fixes connection issues (e.g., Port 9001 -> 9000) for any full URL.
  static String? fixUrl(String? url) {
    if (url == null || url.isEmpty) return null;

    if (url.startsWith("http")) {
      return url
          .replaceAll(":9001", ":9000")               // Fix Console -> API Port
          .replaceAll("minio:9000", "localhost:9000") // Fix Docker -> Localhost
          .replaceAll("localhost:9001", "localhost:9000"); // Extra safety
    }
    return url;
  }

  // ---------------------------------------------------------------------------
  // 2. Public Methods for Each Bucket
  // ---------------------------------------------------------------------------

  // A. User Avatars (Used in Profile, Blog Author, Consultant Card)
  static String? getAvatarUrl(String? path) {
    if (path == null || path.isEmpty) return null;
    
    // If it's already a full URL (e.g. Google Auth), just fix ports
    if (path.startsWith("http")) return fixUrl(path);
    
    // Otherwise, append the User Bucket
    return "$_minioDomain/$_userBucket/$path";
  }
  
  // B. App Assets (Used in Destination Cards, Hero Images)
  static String getAssetUrl(String path) {
    if (path.isEmpty) return "";
    if (path.startsWith("http")) return fixUrl(path)!;
    
    return "$_minioDomain/$_assetsBucket/$path";
  }

  // C. Travel Photos (Used in Blog Covers, Idea Cards)
  static String? getTravelUrl(String? path) {
    if (path == null || path.isEmpty) return null;
    if (path.startsWith("http")) return fixUrl(path);

    return "$_minioDomain/$_travelBucket/$path";
  }
}