import 'package:flutter/material.dart';
import '../models/consultant_profile.dart';
import '../utils/image_helper.dart'; // 🟢 FIX: Import Helper

class ConsultantCard extends StatelessWidget {
  final ConsultantProfile profile;
  final bool showMostAskedBadge;

  const ConsultantCard({
    super.key, 
    required this.profile,
    this.showMostAskedBadge = false,
  });

  @override
  Widget build(BuildContext context) {
    const kPrimary = Color(0xFFC46A4A);
    const kBadgeColor = Color(0xFFF2A93B); 
    const kGradientStart = Color(0xFFFDF8F6); 
    const kGradientEnd = Colors.white;

    // 🟢 FIX: Use ImageHelper
    final avatarUrl = ImageHelper.getAvatarUrl(profile.avatarUrl);

    return GestureDetector(
      onTap: () {
        Navigator.pushNamed(context, '/consultant/${profile.id}');
      },
      child: Stack(
        children: [
          Container(
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                colors: [kGradientStart, kGradientEnd],
              ),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: kPrimary.withValues(alpha: 0.1)),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.05),
                  blurRadius: 8,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            child: Padding(
              padding: const EdgeInsets.all(24.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.center,
                children: [
                  // --- AVATAR SECTION ---
                  Container(
                    width: 120,
                    height: 120,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      border: Border.all(
                        color: showMostAskedBadge || profile.rating >= 4.9 ? const Color(0xFFD88C1D) : Colors.transparent, 
                        width: 3
                      ),
                      color: Colors.grey[200],
                    ),
                    child: ClipOval(
                      child: (avatarUrl != null && avatarUrl.isNotEmpty)
                          ? Image.network(
                              avatarUrl,
                              fit: BoxFit.cover,
                              errorBuilder: (context, error, stackTrace) =>
                                  const Icon(Icons.person, color: Colors.grey, size: 40),
                            )
                          : const Icon(Icons.person, color: Colors.grey, size: 40),
                    ),
                  ),
                  // ... (Rest of the file remains unchanged)
                  const SizedBox(height: 16),
                  Text(
                    profile.fullName,
                    style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                    textAlign: TextAlign.center,
                    maxLines: 1, 
                    overflow: TextOverflow.ellipsis,
                  ),
                  Text(
                    profile.city,
                    style: TextStyle(color: Colors.grey[600], fontSize: 14),
                  ),
                  const SizedBox(height: 12),
                  Text(
                    "\"${profile.bio}\"",
                    style: TextStyle(fontSize: 13, color: Colors.grey[600], fontStyle: FontStyle.italic),
                    textAlign: TextAlign.center,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 16),
                  if (profile.niches.isNotEmpty)
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                      decoration: BoxDecoration(
                        border: Border.all(color: kPrimary.withValues(alpha: 0.3)),
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Text(
                        profile.niches[0],
                        style: const TextStyle(color: kPrimary, fontSize: 11, fontWeight: FontWeight.w600),
                      ),
                    ),
                  const SizedBox(height: 12),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(Icons.star, size: 16, color: Colors.amber),
                      const SizedBox(width: 4),
                      Text("${profile.rating}", style: const TextStyle(fontWeight: FontWeight.bold)),
                      Text(" | ${profile.hourlyRate.toInt()} helped", style: TextStyle(color: Colors.grey[500], fontSize: 12)),
                    ],
                  ),
                  const Spacer(),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: () {
                         Navigator.pushNamed(context, '/consultant/${profile.id}');
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: kPrimary,
                        foregroundColor: Colors.white,
                        elevation: 0,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(30)),
                        padding: const EdgeInsets.symmetric(vertical: 12),
                      ),
                      child: const Text("Ask this local", style: TextStyle(fontWeight: FontWeight.bold)),
                    ),
                  ),
                ],
              ),
            ),
          ),
          if (showMostAskedBadge || profile.rating >= 4.9)
            Positioned(
              top: 12,
              right: 12,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: kBadgeColor,
                  borderRadius: BorderRadius.circular(20),
                  boxShadow: [
                    BoxShadow(color: Colors.black.withValues(alpha: 0.1), blurRadius: 4),
                  ],
                ),
                child: const Row(
                  children: [
                    Icon(Icons.help_outline, size: 12, color: Colors.white),
                    SizedBox(width: 4),
                    Text(
                      "Most asked local",
                      style: TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold),
                    ),
                  ],
                ),
              ),
            ),
        ],
      ),
    );
  }
}