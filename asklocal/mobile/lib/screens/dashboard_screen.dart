import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
import '../utils/image_helper.dart';
import '../utils/logger.dart';
import '../widgets/navbar.dart'; // <--- Import Navbar
import 'dashboard_tabs/inbox_tab.dart';
import 'dashboard_tabs/bookings_tab.dart';
import 'dashboard_tabs/profile_tab.dart';
import 'dashboard_tabs/my_blogs_tab.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  int _selectedIndex = 0;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _checkSession();
    });
  }

  Future<void> _checkSession() async {
    final auth = Provider.of<AuthProvider>(context, listen: false);
    if (auth.isLoggedIn) {
      setState(() => _isLoading = false);
      return;
    }
    await auth.tryAutoLogin();
    if (!mounted) return;

    if (auth.isLoggedIn) {
      setState(() => _isLoading = false);
    } else {
      Navigator.of(context).pushReplacementNamed('/');
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = Provider.of<AuthProvider>(context);
    final user = auth.user;

    // Fix: Use helper to get clean URL (Port 9000)
    final avatarUrl = ImageHelper.getAvatarUrl(user?['avatar_url'] ?? user?['avatarUrl']);
    
    // Debugging logs
    if (user != null) {
      logger.d("Raw DB URL: ${user['avatar_url']}");
      logger.i("Fixed URL: $avatarUrl"); 
    }

    if (_isLoading) {
      return const Scaffold(
        body: Center(
          child: CircularProgressIndicator(color: Color(0xFFC46A4A)),
        ),
      );
    }

    return Scaffold(
      backgroundColor: Colors.grey[50],
      // 🟢 CHANGE: Use Column to place Navbar on top
      body: Column(
        children: [
          const Navbar(), // <--- 1. Top Navigation Bar
          
          // 2. Main Dashboard Content (Sidebar + Tabs)
          Expanded( 
            child: Row(
              children: [
                // --- SIDEBAR ---
                Container(
                  width: 250,
                  decoration: BoxDecoration(
                    color: Colors.white,
                    border: Border(right: BorderSide(color: Colors.grey.shade200)),
                  ),
                  child: Column(
                    children: [
                      const SizedBox(height: 32),
                      

                      // User Tile (Click -> Profile Tab)
                      ListTile(
                        onTap: () {
                          setState(() => _selectedIndex = 2);
                        },
                        leading: CircleAvatar(
                          radius: 24,
                          backgroundColor: Colors.grey[200],
                          child: ClipOval(
                            child: avatarUrl != null
                                ? Image.network(
                                    avatarUrl,
                                    fit: BoxFit.cover,
                                    width: 48,
                                    height: 48,
                                    errorBuilder: (context, error, stackTrace) {
                                      return const Icon(Icons.person, color: Colors.grey);
                                    },
                                  )
                                : const Icon(Icons.person, color: Colors.grey),
                          ),
                        ),
                        title: Text(
                          user?['full_name'] ?? "User",
                          style: const TextStyle(fontWeight: FontWeight.bold),
                          overflow: TextOverflow.ellipsis,
                        ),
                        subtitle: Text(
                          user?['email'] ?? "",
                          style: const TextStyle(fontSize: 10),
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      const Divider(height: 40),

                      // Sidebar Links
                      _sidebarItem(0, "Inbox", Icons.mail_outline, badgeCount: 5), 
                      // TODO: Dynamic Badge
                      _sidebarItem(1, "Bookings", Icons.calendar_today_outlined),
                      _sidebarItem(2, "Profile", Icons.person_outline),
                      _sidebarItem(3, "My Blogs", Icons.article_outlined),

                      const Spacer(),
                      const Divider(),

                      // Logout
                      ListTile(
                        leading: const Icon(Icons.logout, size: 20, color: Color(0xFFC46A4A)),
                        title: const Text(
                          "Log out",
                          style: TextStyle(color: Color(0xFFC46A4A), fontWeight: FontWeight.bold),
                        ),
                        onTap: () {
                          auth.logout();
                          Navigator.pushNamedAndRemoveUntil(context, '/', (route) => false);
                        },
                      ),
                      const SizedBox(height: 20),
                    ],
                  ),
                ),

                // --- MAIN CONTENT AREA ---
                Expanded(
                  child: Padding(
                    padding: const EdgeInsets.all(32.0),
                    child: IndexedStack(
                      index: _selectedIndex,
                      children: const [InboxTab(), BookingsTab(), ProfileTab(), MyBlogsTab()],
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _sidebarItem(int index, String title, IconData icon, {int? badgeCount}) {
    final isSelected = _selectedIndex == index;
    return ListTile(
      leading: Icon(
        icon,
        color: isSelected ? const Color(0xFFC46A4A) : Colors.grey,
      ),
      title: Text(
        title,
        style: TextStyle(
          color: isSelected ? const Color(0xFFC46A4A) : Colors.black87,
          fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
        ),
      ),
      trailing: badgeCount != null
          ? Container(
              padding: const EdgeInsets.all(6),
              decoration: const BoxDecoration(
                color: Color(0xFFC46A4A),
                shape: BoxShape.circle,
              ),
              child: Text(
                "$badgeCount",
                style: const TextStyle(color: Colors.white, fontSize: 10),
              ),
            )
          : null,
      tileColor: isSelected ? const Color(0xFFC46A4A).withValues(alpha: 0.1) : null,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
      onTap: () => setState(() => _selectedIndex = index),
      contentPadding: const EdgeInsets.symmetric(horizontal: 24, vertical: 4),
    );
  }
}