import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';

import '../models/consultant_profile.dart';
import '../models/conversation.dart';

import '../widgets/login_dialog.dart';
import '../services/api_service.dart';
import '../widgets/consultant_card_compact.dart';
import '../widgets/navbar.dart'; // <--- Import Navbar
import '../providers/auth_provider.dart';
import '../utils/image_helper.dart';
import 'chat_screen.dart';

const Color kPrimary = Color(0xFFC46A4A);
const Color kGoldBg = Color(0xFFFFFBEB);
const Color kGoldText = Color(0xFFB45309);

class ConsultantProfileScreen extends StatefulWidget {
  final String consultantId;

  const ConsultantProfileScreen({super.key, required this.consultantId});

  @override
  State<ConsultantProfileScreen> createState() =>
      _ConsultantProfileScreenState();
}

class _ConsultantProfileScreenState extends State<ConsultantProfileScreen> {
  late Future<ConsultantProfile> _profileFuture;
  late Future<List<ConsultantProfile>> _otherLocalsFuture;
  ConsultantProfile? _fetchedProfile;
  bool _isButtonLoading = false;

  @override
  void initState() {
    super.initState();
    _profileFuture = ApiService().getConsultant(widget.consultantId);
  }

  Future<void> _onAskLocalPressed() async {
    final auth = Provider.of<AuthProvider>(context, listen: false);
    if (!auth.isLoggedIn) {
      LoginDialog.show(context);
      return;
    }
    setState(() => _isButtonLoading = true);
    try {
      final api = ApiService();
      var conversation = await api.startChat(widget.consultantId, auth.token!);
      if (!mounted) return;
      if (_fetchedProfile != null) {
        conversation = Conversation(
          id: conversation.id,
          travelerId: conversation.travelerId,
          consultantId: conversation.consultantId,
          lastMessageAt: conversation.lastMessageAt,
          lastMessage: conversation.lastMessage,
          unreadCount: conversation.unreadCount,
          otherUserName: _fetchedProfile!.fullName,
          otherUserAvatar: _fetchedProfile!.avatarUrl,
        );
      }
      Navigator.push(context, MaterialPageRoute(builder: (_) => ChatScreen(conversation: conversation)));
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text("Error: $e")));
    } finally {
      if (mounted) setState(() => _isButtonLoading = false);
    }
  }

  IconData _getIconFromName(String name) {
    switch (name) {
      case 'calendar_today': return Icons.calendar_today;
      case 'fiber_new': return Icons.fiber_new;
      case 'emoji_events': return Icons.emoji_events;
      case 'thumb_up': return Icons.thumb_up_alt_outlined;
      case 'fingerprint': return Icons.fingerprint;
      case 'verified_user': return Icons.verified_user_outlined;
      case 'bolt': return Icons.bolt;
      default: return Icons.check_circle_outline;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      // REMOVED: Default AppBar
      // ADDED: Column structure with Navbar
      body: Column(
        children: [
          const Navbar(), 
          Expanded(
            child: FutureBuilder<ConsultantProfile>(
              future: _profileFuture,
              builder: (context, snapshot) {
                if (snapshot.connectionState == ConnectionState.waiting) {
                  return const Center(child: CircularProgressIndicator(color: kPrimary));
                }
                if (!snapshot.hasData) return const Center(child: Text("Profile not found"));
            
                final p = snapshot.data!;
                _fetchedProfile = p;
                _otherLocalsFuture = ApiService().getConsultants(city: p.city);
            
                return SingleChildScrollView(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Padding(
                        padding: const EdgeInsets.all(24.0),
                        child: Column(
                          children: [
                            Center(child: _buildProfileHeaderCard(p)),
                            const SizedBox(height: 32),
                            Text(
                              "Seamless Travel Experiences with ${p.fullName.split(' ')[0]}",
                              style: GoogleFonts.libreBaskerville(fontSize: 28, fontWeight: FontWeight.bold),
                            ),
                            const SizedBox(height: 16),
                            Text(
                              p.bio,
                              style: const TextStyle(fontSize: 16, height: 1.6, color: Color(0xFF4B5563)),
                            ),
                          ],
                        ),
                      ),
                      if (p.rating >= 4.8)
                        Container(
                          margin: const EdgeInsets.symmetric(horizontal: 24),
                          padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 20),
                          decoration: BoxDecoration(
                            color: kGoldBg,
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: kGoldText.withValues(alpha: 0.2)),
                          ),
                          child: Row(
                            children: [
                              const Icon(Icons.emoji_events, color: kGoldText, size: 28),
                              const SizedBox(width: 16),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    const Text("Local Favorite", style: TextStyle(color: kGoldText, fontWeight: FontWeight.bold, fontSize: 16)),
                                    Text("One of the most loved locals in ${p.city}", style: TextStyle(color: kGoldText.withValues(alpha: 0.8), fontSize: 13)),
                                  ],
                                ),
                              ),
                              Column(
                                children: [
                                  Text("${p.rating}", style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
                                  const Text("Rating", style: TextStyle(fontSize: 10, color: Colors.grey)),
                                ],
                              ),
                            ],
                          ),
                        ),
                      const SizedBox(height: 40),
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 24),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text("About ${p.fullName.split(' ')[0]}", style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold)),
                            const SizedBox(height: 16),
                            Row(
                              children: [
                                Expanded(child: _buildInfoCard(Icons.translate, "LANGUAGES", p.languages)),
                                const SizedBox(width: 16),
                                Expanded(child: _buildInfoCard(Icons.access_time, "RESPONSE TIME", p.responseTime)),
                              ],
                            ),
                            const SizedBox(height: 32),
                            ...p.badges.map((badge) => _buildTrustItem(_getIconFromName(badge.iconName), badge.title, badge.description)),
                          ],
                        ),
                      ),
                      const SizedBox(height: 40),
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 24),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text("Highlighted reviews (${p.reviews.length})", style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold)),
                            const SizedBox(height: 20),
                            if (p.reviews.isEmpty) const Text("No reviews yet.", style: TextStyle(color: Colors.grey)),
                            ...p.reviews.map((r) => Padding(padding: const EdgeInsets.only(bottom: 16.0), child: _buildReviewCard(r))),
                          ],
                        ),
                      ),
                      const SizedBox(height: 40),
                      const Divider(thickness: 1, height: 1),
                      const SizedBox(height: 40),
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 24),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text("Other locals in ${p.city}", style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold)),
                            const Icon(Icons.arrow_forward, size: 20),
                          ],
                        ),
                      ),
                      const SizedBox(height: 20),
                      SizedBox(
                        height: 380,
                        child: FutureBuilder<List<ConsultantProfile>>(
                          future: _otherLocalsFuture,
                          builder: (context, snapshot) {
                            if (!snapshot.hasData) return const Center(child: CircularProgressIndicator());
                            final others = snapshot.data!.where((c) => c.id != p.id).take(5).toList();
                            if (others.isEmpty) return const Center(child: Text("No other locals found."));
                            return ListView.separated(
                              padding: const EdgeInsets.symmetric(horizontal: 24),
                              scrollDirection: Axis.horizontal,
                              itemCount: others.length,
                              separatorBuilder: (c, i) => const SizedBox(width: 20),
                              itemBuilder: (context, index) {
                                return ConsultantCardCompact(consultant: others[index]);
                              },
                            );
                          },
                        ),
                      ),
                      const SizedBox(height: 100),
                    ],
                  ),
                );
              },
            ),
          ),
        ],
      ),
      bottomNavigationBar: Container(
        padding: const EdgeInsets.all(24),
        decoration: BoxDecoration(color: Colors.white, boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.05), blurRadius: 10, offset: const Offset(0, -4))]),
        child: ElevatedButton(
          onPressed: _isButtonLoading ? null : _onAskLocalPressed,
          style: ElevatedButton.styleFrom(backgroundColor: kPrimary, foregroundColor: Colors.white, padding: const EdgeInsets.symmetric(vertical: 16), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(50))),
          child: _isButtonLoading ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2)) : const Text("Ask this local"),
        ),
      ),
    );
  }

  Widget _buildProfileHeaderCard(ConsultantProfile p) {
    final avatarUrl = ImageHelper.getAvatarUrl(p.avatarUrl);

    return Container(
      width: 280,
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: Colors.white, 
        borderRadius: BorderRadius.circular(24), 
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.08), 
            blurRadius: 24, 
            offset: const Offset(0, 8)
          )
        ]
      ),
      child: Column(
        children: [
          Container(
            width: 120, height: 120,
            decoration: BoxDecoration(
              shape: BoxShape.circle, 
              color: Colors.grey[200],
              border: p.rating >= 4.8 
                  ? Border.all(color: const Color(0xFFD88C1D), width: 3)
                  : null,
            ),
            child: ClipOval(
              child: (avatarUrl != null && avatarUrl.isNotEmpty)
                  ? Image.network(
                      avatarUrl,
                      fit: BoxFit.cover,
                      errorBuilder: (context, error, stackTrace) {
                        return const Icon(Icons.person, size: 50, color: Colors.grey);
                      },
                    )
                  : const Icon(Icons.person, size: 50, color: Colors.grey),
            ),
          ),
          const SizedBox(height: 16),
          Text(p.fullName, style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold)),
          Text("${p.city}, ${p.country}", style: const TextStyle(color: Colors.grey)),
          const SizedBox(height: 16),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: List.generate(5, (index) => Icon(index < p.rating.floor() ? Icons.star : Icons.star_border, color: Colors.amber, size: 18)),
          ),
        ],
      ),
    );
  }

  Widget _buildInfoCard(IconData icon, String label, String value) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(color: Colors.grey[50], borderRadius: BorderRadius.circular(12)),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(icon, size: 16, color: kPrimary),
              const SizedBox(width: 8),
              Text(label, style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.grey)),
            ],
          ),
          const SizedBox(height: 8),
          Text(value, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w500), maxLines: 2, overflow: TextOverflow.ellipsis),
        ],
      ),
    );
  }

  Widget _buildTrustItem(IconData icon, String title, String subtitle) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 24.0),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, color: kPrimary, size: 28),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                const SizedBox(height: 4),
                Text(subtitle, style: TextStyle(color: Colors.grey[600], fontSize: 14)),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildReviewCard(Review r) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(border: Border.all(color: Colors.grey.shade200), borderRadius: BorderRadius.circular(12)),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              ...List.generate(5, (i) => const Icon(Icons.star, color: Colors.amber, size: 14)),
              const SizedBox(width: 8),
              Text("${r.rating}.0", style: const TextStyle(fontWeight: FontWeight.bold)),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
               Container(
                width: 24, height: 24,
                decoration: BoxDecoration(shape: BoxShape.circle, color: Colors.grey[200]),
                child: const Icon(Icons.person, size: 16, color: Colors.grey),
              ),
              const SizedBox(width: 8),
              Text(r.reviewerName, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
              if (r.verifiedStay) Text(" • Verified booking", style: TextStyle(color: Colors.grey[500], fontSize: 12)),
            ],
          ),
          const SizedBox(height: 12),
          Text(r.comment, style: const TextStyle(fontStyle: FontStyle.italic, color: Color(0xFF4B5563))),
        ],
      ),
    );
  }
}