import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';

import '../../utils/image_helper.dart';

import '../../providers/auth_provider.dart';
import '../../services/api_service.dart';
import '../../models/conversation.dart';
import '../chat_screen.dart';

class InboxTab extends StatefulWidget {
  const InboxTab({super.key});

  @override
  State<InboxTab> createState() => _InboxTabState();
}

class _InboxTabState extends State<InboxTab> {
  final ApiService _apiService = ApiService();

  // 1. CHANGE THIS: Remove 'late', make it nullable '?'
  Future<List<Conversation>>? _inboxFuture;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _refreshInbox();
    });
  }

  void _refreshInbox() {
    // Check if mounted to prevent errors if user leaves screen quickly
    if (!mounted) return;

    final token = Provider.of<AuthProvider>(context, listen: false).token;
    if (token != null) {
      setState(() {
        _inboxFuture = _apiService.getInbox(token);
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    // 2. ADD THIS CHECK: If null, show loading instead of crashing
    if (_inboxFuture == null) {
      return const Center(child: CircularProgressIndicator());
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Text(
              "Inbox",
              style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
            ),
            IconButton(
              onPressed: _refreshInbox,
              icon: const Icon(Icons.refresh),
            ),
          ],
        ),
        const SizedBox(height: 16),

        Expanded(
          child: FutureBuilder<List<Conversation>>(
            future: _inboxFuture, // Now safe to use
            builder: (context, snapshot) {
              if (snapshot.connectionState == ConnectionState.waiting) {
                return const Center(child: CircularProgressIndicator());
              } else if (snapshot.hasError) {
                return Center(child: Text("Error: ${snapshot.error}"));
              } else if (!snapshot.hasData || snapshot.data!.isEmpty) {
                return _emptyState();
              }

              final conversations = snapshot.data!;

              return ListView.separated(
                itemCount: conversations.length,
                separatorBuilder: (c, i) => const Divider(height: 1),
                itemBuilder: (context, index) {
                  final chat = conversations[index];
                  return _chatTile(chat);
                },
              );
            },
          ),
        ),
      ],
    );
  }

  Widget _chatTile(Conversation chat) {
    final bool isUnread = chat.unreadCount > 0;

    return ListTile(
      contentPadding: const EdgeInsets.symmetric(horizontal: 0, vertical: 8),
      onTap: () async {
        await Navigator.push(
          context,
          MaterialPageRoute(builder: (_) => ChatScreen(conversation: chat)),
        );
        _refreshInbox();
      },
      leading: Stack(
        children: [
          CircleAvatar(
            radius: 28,
            backgroundColor: Colors.grey[200],
            child: ClipOval(
              // 🟢 FIX: Use ImageHelper
              child: Builder(
                builder: (context) {
                  final url = ImageHelper.getAvatarUrl(chat.otherUserAvatar);
                  if (url != null && url.isNotEmpty) {
                    return Image.network(url, fit: BoxFit.cover);
                  }
                  return const Icon(Icons.person, color: Colors.grey);
                },
              ),
            ),
          ),
          if (isUnread)
            Positioned(
              right: 0,
              top: 0,
              child: Container(
                width: 12,
                height: 12,
                decoration: BoxDecoration(
                  color: const Color(0xFFC46A4A),
                  shape: BoxShape.circle,
                  border: Border.all(color: Colors.white, width: 2),
                ),
              ),
            ),
        ],
      ),
      title: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            chat.otherUserName,
            style: TextStyle(
              fontWeight: isUnread ? FontWeight.bold : FontWeight.w600,
              fontSize: 16,
            ),
          ),
          Text(
            _formatDate(chat.lastMessageAt),
            style: TextStyle(
              color: isUnread ? const Color(0xFFC46A4A) : Colors.grey,
              fontSize: 12,
              fontWeight: isUnread ? FontWeight.bold : FontWeight.normal,
            ),
          ),
        ],
      ),
      subtitle: Padding(
        padding: const EdgeInsets.only(top: 4.0),
        child: Row(
          children: [
            Expanded(
              child: Text(
                chat.lastMessage ?? "No messages yet",
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: TextStyle(
                  color: isUnread ? Colors.black87 : Colors.grey,
                  fontWeight: isUnread ? FontWeight.w600 : FontWeight.normal,
                ),
              ),
            ),
            if (isUnread)
              Container(
                margin: const EdgeInsets.only(left: 8),
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                decoration: BoxDecoration(
                  color: const Color(0xFFC46A4A),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Text(
                  "${chat.unreadCount}",
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 10,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }

  Widget _emptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.mail_outline, size: 64, color: Colors.grey[300]),
          const SizedBox(height: 16),
          const Text("No messages yet", style: TextStyle(color: Colors.grey)),
        ],
      ),
    );
  }

  String _formatDate(DateTime date) {
    return DateFormat.jm().format(date);
  }
}
