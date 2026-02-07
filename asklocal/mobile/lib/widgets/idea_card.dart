import 'package:flutter/material.dart';
import '../utils/image_helper.dart'; // <--- Import Helper

class IdeaCard extends StatelessWidget {
  final String imageUrl;
  final String city;
  final String title;
  final String description;

  const IdeaCard({
    super.key, 
    required this.imageUrl, 
    required this.city,
    required this.title, 
    required this.description,
  });

  @override
  Widget build(BuildContext context) {
    // Fix the URL connection (Port 9001 -> 9000)
    // We assume the parent has already selected the correct bucket (Screen vs Travel)
    final fixedUrl = ImageHelper.fixUrl(imageUrl);

    return Container(
      width: 280,
      clipBehavior: Clip.antiAlias,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(20),
        color: Colors.grey[300],
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.1),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Stack(
        children: [
          // 1. Background Image (Safe & Fixed)
          Positioned.fill(
            child: (fixedUrl != null && fixedUrl.isNotEmpty)
                ? Image.network(
                    fixedUrl,
                    fit: BoxFit.cover,
                    errorBuilder: (context, error, stackTrace) {
                      return const Center(child: Icon(Icons.broken_image, color: Colors.white54));
                    },
                  )
                : const Center(child: Icon(Icons.image, color: Colors.white54)),
          ),

          // 2. Dark Gradient
          Positioned.fill(
            child: Container(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [
                    Colors.transparent,
                    Colors.black.withValues(alpha: 0.1),
                    Colors.black.withValues(alpha: 0.8), 
                  ],
                  stops: const [0.4, 0.7, 1.0],
                ),
              ),
            ),
          ),

          // 3. Content
          Padding(
            padding: const EdgeInsets.all(20.0),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.end,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: const Color(0xFFC46A4A),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    city,
                    style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold),
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  title,
                  style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold, height: 1.2),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 6),
                Text(
                  description,
                  style: TextStyle(color: Colors.white.withValues(alpha: 0.9), fontSize: 13, height: 1.4),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}