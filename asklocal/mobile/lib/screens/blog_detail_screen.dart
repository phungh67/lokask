import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:google_fonts/google_fonts.dart';
import '../models/blog.dart';
import '../services/api_service.dart';
import '../widgets/navbar.dart';
import '../utils/image_helper.dart';

class BlogDetailScreen extends StatefulWidget {
  final Blog? blog; // Passed from Home (Fast)
  final String? blogId; // Passed from URL (Refresh)

  const BlogDetailScreen({super.key, this.blog, this.blogId});

  @override
  State<BlogDetailScreen> createState() => _BlogDetailScreenState();
}

class _BlogDetailScreenState extends State<BlogDetailScreen> {
  Blog? _blogData;
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    if (widget.blog != null) {
      _blogData = widget.blog;
    } else if (widget.blogId != null) {
      _fetchBlog(widget.blogId!);
    }
  }

  Future<void> _fetchBlog(String id) async {
    setState(() => _isLoading = true);
    try {
      final blog = await ApiService().getBlogById(id);
      if (mounted) setState(() => _blogData = blog);
    } catch (e) {
      // Handle error
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Scaffold(
        body: Center(
          child: CircularProgressIndicator(color: Color(0xFFC46A4A)),
        ),
      );
    }

    /* TODO: Logout when F5 blog */

    if (_blogData == null) {
      return const Scaffold(body: Center(child: Text("Blog not found")));
    }

    final blog = _blogData!;
    final coverUrl = ImageHelper.getTravelUrl(blog.coverImageUrl);

    // 1. 🟢 Define the variable
    final authorAvatarUrl = ImageHelper.getAvatarUrl(blog.authorAvatar);

    final formattedDate = DateFormat.yMMMMd().format(blog.createdAt);

    return Scaffold(
      backgroundColor: Colors.white,
      body: Column(
        children: [
          const Navbar(),
          Expanded(
            child: SingleChildScrollView(
              child: Center(
                child: Container(
                  constraints: const BoxConstraints(maxWidth: 800),
                  padding: const EdgeInsets.symmetric(
                    horizontal: 24,
                    vertical: 40,
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // --- Tags & Date ---
                      Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 12,
                              vertical: 6,
                            ),
                            decoration: BoxDecoration(
                              color: const Color(
                                0xFFC46A4A,
                              ).withValues(alpha: 0.1),
                              borderRadius: BorderRadius.circular(20),
                            ),
                            child: Text(
                              blog.city.toUpperCase(),
                              style: const TextStyle(
                                color: Color(0xFFC46A4A),
                                fontWeight: FontWeight.bold,
                                fontSize: 12,
                                letterSpacing: 1.0,
                              ),
                            ),
                          ),
                          const SizedBox(width: 16),
                          Text(
                            formattedDate,
                            style: TextStyle(
                              color: Colors.grey[600],
                              fontSize: 14,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 24),

                      // --- Title ---
                      Text(
                        blog.title,
                        style: GoogleFonts.libreBaskerville(
                          fontSize: 36,
                          fontWeight: FontWeight.w900,
                          height: 1.2,
                        ),
                      ),
                      const SizedBox(height: 24),

                      // --- Author Section ---
                      Row(
                        children: [
                          CircleAvatar(
                            radius: 22,
                            backgroundColor: Colors.grey[200],
                            // 2. 🟢 USE the variable here!
                            backgroundImage:
                                (authorAvatarUrl != null &&
                                    authorAvatarUrl.isNotEmpty)
                                ? NetworkImage(authorAvatarUrl)
                                : null,
                            child:
                                (authorAvatarUrl == null ||
                                    authorAvatarUrl.isEmpty)
                                ? const Icon(Icons.person, color: Colors.grey)
                                : null,
                          ),
                          const SizedBox(width: 12),
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                blog.authorName,
                                style: const TextStyle(
                                  fontWeight: FontWeight.bold,
                                  fontSize: 15,
                                ),
                              ),
                              const Text(
                                "Local Expert",
                                style: TextStyle(
                                  color: Colors.grey,
                                  fontSize: 13,
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                      const SizedBox(height: 32),

                      // --- Cover Image ---
                      if (coverUrl != null)
                        ClipRRect(
                          borderRadius: BorderRadius.circular(16),
                          child: Container(
                            width: double.infinity,
                            height: 400,
                            color: Colors.grey[200],
                            child: Image.network(coverUrl, fit: BoxFit.cover),
                          ),
                        ),
                      const SizedBox(height: 40),

                      // --- Content ---
                      Text(
                        blog.content,
                        style: const TextStyle(
                          fontSize: 18,
                          height: 1.8,
                          color: Color(0xFF2D3748),
                        ),
                      ),

                      const SizedBox(height: 80),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}


