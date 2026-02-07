import 'package:flutter/material.dart';
import '../models/consultant_profile.dart';
import '../utils/image_helper.dart'; // 🟢 FIX: Import Helper

class ConsultantCardCompact extends StatelessWidget {
  final ConsultantProfile consultant;

  const ConsultantCardCompact({super.key, required this.consultant});

  @override
  Widget build(BuildContext context) {
    // 🟢 FIX: Use ImageHelper
    final avatarUrl = ImageHelper.getAvatarUrl(consultant.avatarUrl);

    return GestureDetector(
      onTap: () {
        Navigator.pushNamed(context, '/consultant/${consultant.id}');
      },
      child: Container(
        width: 200, 
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: Colors.grey.shade200),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.05),
              blurRadius: 10,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // --- FIXED IMAGE SECTION ---
            Stack(
              children: [
                Container(
                  width: 80, // radius 40 * 2
                  height: 80,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: Colors.grey[200],
                  ),
                  child: ClipOval(
                    child: (avatarUrl != null && avatarUrl.isNotEmpty)
                        ? Image.network(
                            avatarUrl,
                            fit: BoxFit.cover,
                            errorBuilder: (context, error, stackTrace) {
                              return const Icon(Icons.person, color: Colors.grey);
                            },
                          )
                        : const Icon(Icons.person, color: Colors.grey),
                  ),
                ),
                // ... (Badges and Text remain unchanged)
                 if (consultant.badges.isNotEmpty)
                  Positioned(
                    right: 0,
                    top: 0,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                      decoration: BoxDecoration(
                        color: Colors.orange, 
                        borderRadius: BorderRadius.circular(8)
                      ),
                      child: const Text("Top Rated", style: TextStyle(fontSize: 8, color: Colors.white)),
                    ),
                  ),
              ],
            ),
            const SizedBox(height: 12),

            Text(
              consultant.fullName,
              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
              maxLines: 1, 
              overflow: TextOverflow.ellipsis,
            ),
            
            Text(
              consultant.city,
              style: TextStyle(color: Colors.grey[500], fontSize: 12),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
            const SizedBox(height: 8),

            Text(
              consultant.bio,
              textAlign: TextAlign.center,
              style: TextStyle(color: Colors.grey[600], fontSize: 12, height: 1.4),
              maxLines: 2, 
              overflow: TextOverflow.ellipsis,
            ),

            const Spacer(), 

            if (consultant.niches.isNotEmpty)
              Container(
                margin: const EdgeInsets.symmetric(vertical: 8),
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  border: Border.all(color: const Color(0xFFC46A4A).withValues(alpha: 0.3)),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(
                  consultant.niches.first,
                  style: const TextStyle(fontSize: 10, color: Color(0xFFC46A4A)),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ),

            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () {
                   Navigator.pushNamed(context, '/consultant/${consultant.id}');
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFFC46A4A),
                  foregroundColor: Colors.white,
                  padding: EdgeInsets.zero,
                  minimumSize: const Size(0, 36),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                ),
                child: const Text("Ask this local", style: TextStyle(fontSize: 12)),
              ),
            ),
          ],
        ),
      ),
    );
  }
}