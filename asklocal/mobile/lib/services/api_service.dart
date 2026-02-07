import 'dart:convert';
import 'dart:io';
import 'package:flutter/foundation.dart'; // Required for debugPrint and kIsWeb
import 'package:http/http.dart' as http;
import 'package:http_parser/http_parser.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
import '../utils/nav_key.dart';

import '../models/consultant_profile.dart';
import '../models/niche.dart';
import '../models/city.dart';
import '../models/conversation.dart';
import '../models/message.dart';
import '../models/blog.dart';

class ApiService {
  // --- 1. ROBUST BASE URL (EC2 + Localhost Support) ---
  static String get baseUrl {
    // A. Check for Docker/Build-time argument first (For EC2 Deployment)
    // Run: flutter build web --dart-define=API_BASE_URL=http://ec2-xx.../api/v1
    const envUrl = String.fromEnvironment('API_BASE_URL');
    if (envUrl.isNotEmpty) {
      return envUrl;
    }

    // B. Fallback to your existing logic
    if (kIsWeb) {
      return "http://localhost:8080/api/v1";
    }
    try {
      if (Platform.isAndroid) {
        return "http://10.0.2.2:8080/api/v1";
      }
    } catch (e) {
      return "http://localhost:8080/api/v1";
    }
    return "http://localhost:8080/api/v1";
  }

  // --- 2. CENTRALIZED RESPONSE HANDLER (The "Auto-Logout" Fix) ---
  static dynamic _processResponse(http.Response response) {
    // A. SECURITY: Check for Expired Token (401)
    if (response.statusCode == 401) {
      final context = navigatorKey.currentContext;

      if (context != null) {
        // 1. Log out locally
        Provider.of<AuthProvider>(context, listen: false).logout();

        // 2. Force Redirect to Login (Wipe history)
        navigatorKey.currentState?.pushNamedAndRemoveUntil(
          '/login',
          (route) => false,
        );
      }
      throw Exception('Session expired. Please log in again.');
    }

    // B. Check for Server Errors
    if (response.statusCode >= 400) {
      String message = 'Server error';
      try {
        final body = json.decode(response.body);
        message = body['error'] ?? body['message'] ?? 'Unknown error';
      } catch (_) {
        message = 'Error: ${response.statusCode} ${response.reasonPhrase}';
      }
      throw Exception(message);
    }

    // C. Success: Return Decoded JSON
    // Handle empty body cases (like 204 No Content)
    if (response.body.isEmpty) return null;
    return json.decode(response.body);
  }

  // --- AVATAR HELPER (Kept your robust version) ---
  static String getValidAvatarUrl(String? url, {String? name}) {
    if (url == null || url.isEmpty) return "";
    if (url.contains("unsplash.com") || url.contains("pravatar.cc")) return "";

    String finalUrl = url;
    if (url.startsWith('/')) {
      finalUrl = "http://localhost:9000$url";
    }
    if (!kIsWeb && finalUrl.contains("localhost")) {
      try {
        if (Platform.isAndroid) {
          finalUrl = finalUrl.replaceFirst("localhost", "10.0.2.2");
        }
      } catch (e) {
        /* ignore */
      }
    }
    if (kIsWeb && finalUrl.contains("localhost")) {
      return "$finalUrl?v=${DateTime.now().millisecondsSinceEpoch}";
    }
    return finalUrl;
  }

  // --- API CALLS (Refactored to use _processResponse) ---

  Future<List<City>> getCities() async {
    final response = await http.get(Uri.parse('$baseUrl/cities'));
    // We handle the response manually here or use _processResponse
    // Using manual here is fine since it's public data, but _processResponse is safer
    final data = _processResponse(response);
    return (data as List).map((json) => City.fromJson(json)).toList();
  }

  // AUTH (Login/Register) - We do NOT use _processResponse here
  // because 401 on Login means "Wrong Password", we don't want to redirect loop.
  Future<bool> register({
    required String email,
    required String password,
    required String fullName,
    required String role,
    int? cityId,
  }) async {
    final url = Uri.parse('$baseUrl/auth/register');
    final body = {
      "email": email,
      "password": password,
      "full_name": fullName,
      "role": role,
      if (cityId != null) "city_id": cityId,
    };
    final response = await http.post(
      url,
      headers: {"Content-Type": "application/json"},
      body: json.encode(body),
    );
    if (response.statusCode == 201) return true;

    // Manual error handling for Auth
    final errorData = json.decode(response.body);
    throw Exception(errorData['error'] ?? 'Registration failed');
  }

  Future<Map<String, dynamic>> login(String email, String password) async {
    final url = Uri.parse('$baseUrl/auth/login');
    final response = await http.post(
      url,
      headers: {"Content-Type": "application/json"},
      body: json.encode({"email": email, "password": password}),
    );
    if (response.statusCode == 200) return json.decode(response.body);

    final errorData = json.decode(response.body);
    throw Exception(errorData['error'] ?? 'Login failed');
  }

  Future<Map<String, dynamic>> getMe(String token) async {
    final url = Uri.parse('$baseUrl/auth/me');
    final response = await http.get(
      url,
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer $token",
      },
    );

    // Use our helper to handle 401s automatically
    return _processResponse(response);
  }

  Future<void> logout(String token) async {
    try {
      final url = Uri.parse('$baseUrl/auth/logout');
      await http.post(
        url,
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer $token",
        },
      );
    } catch (e) {
      // If logout fails (e.g. server down), we don't care.
      // We will wipe the local token anyway.
      debugPrint("Server logout failed: $e");
    }
  }

  // --- PROTECTED ROUTES (These use _processResponse for Auto-Logout) ---

  Future<List<Conversation>> getInbox(String token) async {
    final url = Uri.parse('$baseUrl/conversations');
    final response = await http.get(
      url,
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer $token",
      },
    );

    final data = _processResponse(response); // <--- Auto-Logout enabled
    if (data == null) return [];
    return (data as List).map((item) => Conversation.fromJson(item)).toList();
  }

  Future<String> uploadAvatar(
    Uint8List fileBytes,
    String filename,
    String token,
  ) async {
    final uri = Uri.parse('$baseUrl/users/avatar');

    var request = http.MultipartRequest('POST', uri);
    request.headers['Authorization'] = 'Bearer $token';

    request.files.add(
      http.MultipartFile.fromBytes('avatar', fileBytes, filename: filename),
    );

    final streamedResponse = await request.send();
    final response = await http.Response.fromStream(streamedResponse);

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      return data['avatar_url'];
    } else {
      throw Exception('Failed to upload avatar: ${response.body}');
    }
  }

  Future<List<Message>> getMessages(String conversationId, String token) async {
    final url = Uri.parse('$baseUrl/conversations/$conversationId/messages');
    final response = await http.get(
      url,
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer $token",
      },
    );

    final data = _processResponse(response);
    if (data == null) return [];
    return (data as List).map((item) => Message.fromJson(item)).toList();
  }

  Future<void> sendMessage(
    String conversationId,
    String content,
    String token,
  ) async {
    final url = Uri.parse('$baseUrl/conversations/$conversationId/messages');
    final response = await http.post(
      url,
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer $token",
      },
      body: json.encode({"content": content}),
    );
    _processResponse(response); // Check for 401/Errors
  }

  Future<Conversation> startChat(String consultantId, String token) async {
    final url = Uri.parse('$baseUrl/conversations');
    final response = await http.post(
      url,
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer $token",
      },
      body: json.encode({"consultant_id": consultantId}),
    );

    final data = _processResponse(response);
    return Conversation.fromJson(data);
  }

  Future<ConsultantProfile?> getConsultantByUserId(String userId) async {
    final url = Uri.parse('$baseUrl/users/$userId/consultant');
    try {
      final response = await http.get(url);
      if (response.statusCode == 404) return null;

      final data = _processResponse(response);
      return ConsultantProfile.fromJson(data);
    } catch (e) {
      debugPrint("Error fetching profile: $e");
      return null;
    }
  }

  Future<ConsultantProfile> getConsultant(String id) async {
    final url = Uri.parse('$baseUrl/consultants/$id');
    try {
      final response = await http.get(url);
      final data = _processResponse(response);
      return ConsultantProfile.fromJson(data);
    } catch (e) {
      // If _processResponse threw the Session Expired error, rethrow it
      if (e.toString().contains("Session expired")) rethrow;
      throw Exception("Failed to load consultant");
    }
  }

  Future<List<ConsultantProfile>> getConsultants({
    String? city,
    String? country,
  }) async {
    Map<String, String> queryParams = {};
    if (city != null && city.isNotEmpty) queryParams['city'] = city;
    if (country != null && country.isNotEmpty) queryParams['country'] = country;

    final uri = Uri.parse(
      '$baseUrl/consultants',
    ).replace(queryParameters: queryParams);

    try {
      final response = await http.get(uri);
      final data = _processResponse(response);
      return (data as List)
          .map((item) => ConsultantProfile.fromJson(item))
          .toList();
    } catch (e) {
      return [];
    }
  }

  Future<List<Niche>> getNiches() async {
    final url = Uri.parse('$baseUrl/niches');
    try {
      final response = await http.get(url);
      final data = _processResponse(response);
      return (data as List).map((item) => Niche.fromJson(item)).toList();
    } catch (e) {
      debugPrint("Error fetching niches: $e");
      return [];
    }
  }

  // for blog section
  // 1. Fetch Blogs (Dynamic Filter)
  Future<List<Blog>> getBlogs({String? city, String? authorId}) async {
    String url = "$baseUrl/blogs";
    // Build query parameters
    List<String> queryParams = [];
    if (city != null && city.isNotEmpty) queryParams.add("city=$city");
    if (authorId != null && authorId.isNotEmpty) {
      queryParams.add("author_id=$authorId");
    }

    if (queryParams.isNotEmpty) {
      url += "?${queryParams.join("&")}";
    }

    final response = await http.get(Uri.parse(url));
    if (response.statusCode == 200) {
      final List<dynamic> data = json.decode(response.body);
      return data.map((json) => Blog.fromJson(json)).toList();
    }
    return [];
  }

  // 2. Create Blog (Multipart Upload)
  Future<void> createBlog({
    required String title,
    required String summary,
    required String content,
    required String city,
    required Uint8List coverImageBytes,
    required String filename,
    required String token,
  }) async {
    final uri = Uri.parse("$baseUrl/blogs");
    final request = http.MultipartRequest('POST', uri);

    request.headers['Authorization'] = "Bearer $token";
    request.fields['title'] = title;
    request.fields['summary'] = summary;
    request.fields['content'] = content;
    request.fields['city'] = city;
    request.fields['country'] = "Unknown"; // You can add country picker later

    // Attach File
    request.files.add(
      http.MultipartFile.fromBytes(
        'cover_image',
        coverImageBytes,
        filename: filename,
        contentType: MediaType('image', 'jpeg'), // Adjust based on file type
      ),
    );

    final response = await request.send();
    if (response.statusCode != 201) {
      final respStr = await response.stream.bytesToString();
      throw Exception("Failed to create blog: $respStr");
    }
  }

  // get blog
  Future<Blog> getBlogById(String id) async {
    final response = await http.get(Uri.parse("$baseUrl/blogs/$id"));
    if (response.statusCode == 200) {
      return Blog.fromJson(json.decode(response.body));
    }
    throw Exception("Blog not found");
  }
}
