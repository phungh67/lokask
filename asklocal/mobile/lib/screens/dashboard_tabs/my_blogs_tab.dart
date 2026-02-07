import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../models/blog.dart';
import '../../providers/auth_provider.dart';
import '../../services/api_service.dart';
import '../../utils/image_helper.dart';
import '../create_blog_screen.dart'; // Ensure you import the screen we created earlier

class MyBlogsTab extends StatefulWidget {
  const MyBlogsTab({super.key});

  @override
  State<MyBlogsTab> createState() => _MyBlogsTabState();
}

class _MyBlogsTabState extends State<MyBlogsTab> {
  final ApiService _api = ApiService();
  late Future<List<Blog>> _myBlogsFuture;

  @override
  void initState() {
    super.initState();
    _refreshBlogs();
  }

  void _refreshBlogs() {
    final userId = Provider.of<AuthProvider>(context, listen: false).user?['id'];
    setState(() {
      _myBlogsFuture = _api.getBlogs(authorId: userId);
    });
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Text("My Blogs", style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold)),
            ElevatedButton.icon(
              onPressed: () async {
                // Wait for the result. If true, refresh the list.
                final result = await Navigator.push(
                  context,
                  MaterialPageRoute(builder: (_) => const CreateBlogScreen()),
                );
                if (result == true) {
                  _refreshBlogs();
                }
              },
              icon: const Icon(Icons.edit),
              label: const Text("Write New"),
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFFC46A4A),
                foregroundColor: Colors.white,
              ),
            ),
          ],
        ),
        const SizedBox(height: 24),
        Expanded(
          child: FutureBuilder<List<Blog>>(
            future: _myBlogsFuture,
            builder: (context, snapshot) {
              if (snapshot.connectionState == ConnectionState.waiting) {
                return const Center(child: CircularProgressIndicator());
              }
              if (!snapshot.hasData || snapshot.data!.isEmpty) {
                return Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.article_outlined, size: 64, color: Colors.grey[300]),
                      const SizedBox(height: 16),
                      Text("You haven't written any blogs yet.", style: TextStyle(color: Colors.grey[600])),
                    ],
                  ),
                );
              }

              return ListView.separated(
                itemCount: snapshot.data!.length,
                separatorBuilder: (c, i) => const SizedBox(height: 16),
                itemBuilder: (context, index) {
                  final blog = snapshot.data![index];
                  return _buildBlogTile(blog);
                },
              );
            },
          ),
        ),
      ],
    );
  }

  Widget _buildBlogTile(Blog blog) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey.shade200),
      ),
      child: ListTile(
        contentPadding: const EdgeInsets.all(12),
        leading: Container(
          width: 80,
          height: 80,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(8),
            color: Colors.grey[200],
            image: DecorationImage(
              image: NetworkImage(ImageHelper.getAvatarUrl(blog.coverImageUrl) ?? ""),
              fit: BoxFit.cover,
              onError: (e, s) {},
            ),
          ),
        ),
        title: Text(blog.title, style: const TextStyle(fontWeight: FontWeight.bold)),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const SizedBox(height: 4),
            Text(
              blog.summary, 
              maxLines: 2, 
              overflow: TextOverflow.ellipsis,
              style: TextStyle(fontSize: 12, color: Colors.grey[600]),
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                Icon(Icons.location_on, size: 12, color: Colors.grey[500]),
                const SizedBox(width: 4),
                Text(blog.city, style: TextStyle(fontSize: 12, color: Colors.grey[500])),
                const SizedBox(width: 16),
                Icon(Icons.star, size: 12, color: Colors.amber),
                const SizedBox(width: 4),
                Text("${blog.rating.toStringAsFixed(1)} Rating", style: TextStyle(fontSize: 12, color: Colors.grey[500])),
              ],
            )
          ],
        ),
        trailing: IconButton(
          icon: const Icon(Icons.arrow_forward_ios, size: 16),
          onPressed: () {
            // Navigate to Detail Screen (TODO)
          },
        ),
      ),
    );
  }
}