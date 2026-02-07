import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../models/consultant_profile.dart';
import '../providers/auth_provider.dart';
import '../services/api_service.dart';
import 'chat_screen.dart';
import 'login_screen.dart';

class ConsultantDetailScreen extends StatefulWidget {
  final ConsultantProfile consultant;

  const ConsultantDetailScreen({super.key, required this.consultant});

  @override
  State<ConsultantDetailScreen> createState() => _ConsultantDetailScreenState();
}

class _ConsultantDetailScreenState extends State<ConsultantDetailScreen> {
  bool _isLoading = false;

  Future<void> _onMessageTap() async {
    final auth = Provider.of<AuthProvider>(context, listen: false);

    // 1. If not logged in, force login
    if (!auth.isLoggedIn) {
      Navigator.push(context, MaterialPageRoute(builder: (_) => const LoginScreen()));
      return;
    }

    setState(() => _isLoading = true);

    try {
      // 2. Call API to start/get conversation
      final api = ApiService();
      final conversation = await api.startChat(widget.consultant.id, auth.token!);

      if (!mounted) return;

      // 3. Navigate to Chat Screen
      Navigator.push(
        context,
        MaterialPageRoute(builder: (_) => ChatScreen(conversation: conversation)),
      );
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text("Error: $e")));
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(widget.consultant.fullName)),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header: Avatar + Name
            Center(
              child: Column(
                children: [
                  Container(
                    width: 100, // 2x radius of 50
                    height: 100,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withValues(alpha: 0.1),
                          blurRadius: 10,
                          offset: const Offset(0, 5),
                        ),
                      ],
                    ),
                    child: ClipOval(
                      child: Image.network(
                        ApiService.getValidAvatarUrl(
                          widget.consultant.avatarUrl,
                          name: widget.consultant.fullName, // Pass name for Initials fallback
                        ),
                        fit: BoxFit.cover,
                        // This Error Builder catches 404s and shows a grey icon instead of crashing
                        errorBuilder: (context, error, stackTrace) {
                          return Container(
                            color: Colors.grey[200],
                            alignment: Alignment.center,
                            child: const Icon(Icons.person, size: 50, color: Colors.grey),
                          );
                        },
                        // Optional: Show a spinner while loading
                        loadingBuilder: (context, child, loadingProgress) {
                          if (loadingProgress == null) return child;
                          return Container(
                            color: Colors.grey[100],
                            alignment: Alignment.center,
                            child: const CircularProgressIndicator(strokeWidth: 2),
                          );
                        },
                      ),
                    ),
                  ),
                  // --- FIX END ---
                  
                  const SizedBox(height: 16),
                  Text(
                    widget.consultant.fullName, 
                    style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold)
                  ),
                  Text(
                    "\$${widget.consultant.hourlyRate}/hr", 
                    style: const TextStyle(fontSize: 18, color: Color(0xFFC46A4A))
                  ),
                ],
              ),
            ),
            const SizedBox(height: 32),
            
            const Text("About", style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            const SizedBox(height: 8),
            Text(
              widget.consultant.bio, 
              style: const TextStyle(height: 1.5, color: Colors.grey)
            ),
            
            const SizedBox(height: 40),

            // --- THE MESSAGE BUTTON ---
            SizedBox(
              width: double.infinity,
              height: 50,
              child: ElevatedButton.icon(
                onPressed: _isLoading ? null : _onMessageTap,
                icon: const Icon(Icons.chat_bubble_outline, color: Colors.white),
                label: _isLoading 
                    ? const CircularProgressIndicator(color: Colors.white)
                    : const Text(
                        "Message Me", 
                        style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white)
                      ),
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFFC46A4A),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}