import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';

import '../widgets/login_dialog.dart';
import '../providers/auth_provider.dart';
import '../utils/image_helper.dart';

class Navbar extends StatelessWidget {
  const Navbar({super.key});

  @override
  Widget build(BuildContext context) {
    final auth = Provider.of<AuthProvider>(context);
    final user = auth.user;
    
    final avatarUrl = ImageHelper.getAvatarUrl(user?['avatar_url'] ?? user?['avatarUrl']);
    final canGoBack = Navigator.of(context).canPop();

    return Container(
      color: Colors.white,
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          // 1. LOGO & BACK BUTTON
          Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              if (canGoBack)
                Padding(
                  padding: const EdgeInsets.only(right: 12.0),
                  child: IconButton(
                    icon: const Icon(Icons.arrow_back, color: Colors.black),
                    onPressed: () => Navigator.of(context).pop(),
                    tooltip: "Go back",
                  ),
                ),
              
              InkWell(
                onTap: () {
                  Navigator.pushNamedAndRemoveUntil(context, '/', (route) => false);
                },
                child: RichText(
                  text: TextSpan(
                    style: GoogleFonts.inter(fontSize: 28, fontWeight: FontWeight.w900),
                    children: const [
                      TextSpan(text: "Lok", style: TextStyle(color: Colors.black)),
                      TextSpan(text: "ask", style: TextStyle(color: Color(0xFFD97757))),  
                    ],
                  ),
                ),
              ),
            ],
          ),

          // 2. MENU ITEMS (Desktop vs Mobile)
          if (MediaQuery.of(context).size.width > 800)
            _buildDesktopMenu(context, auth, user, avatarUrl)
          else
            IconButton(
              icon: const Icon(Icons.menu),
              onPressed: () => _showMobileMenu(context, auth),
            ),
        ],
      ),
    );
  }

  // --- DESKTOP MENU ---
  Widget _buildDesktopMenu(BuildContext context, AuthProvider auth, Map<String, dynamic>? user, String? avatarUrl) {
    return Row(
      children: [
        _navLink(context, "How it works", onTap: () {}),
        const SizedBox(width: 24),
        
        _navLink(context, "Explore locals", onTap: () {
          Navigator.pushNamed(context, '/explore');
        }),
        const SizedBox(width: 24),

        if (auth.isLoggedIn) ...[
          _navLink(context, "Dashboard", onTap: () {
             Navigator.pushNamed(context, '/dashboard');
          }),
          const SizedBox(width: 12),
          
          InkWell(
            onTap: () {
              Navigator.pushNamed(context, '/dashboard');
            },
            child: CircleAvatar(
              backgroundColor: Colors.grey[200],
              radius: 20,
              child: ClipOval(
                child: (avatarUrl != null && avatarUrl.isNotEmpty)
                  ? Image.network(
                      avatarUrl,
                      fit: BoxFit.cover,
                      width: 40,
                      height: 40,
                      errorBuilder: (context, error, stackTrace) {
                        return _buildInitials(user);
                      },
                    )
                  : _buildInitials(user),
              ),
            ),
          )
        ] else ...[
          OutlinedButton(
            onPressed: () => LoginDialog.show(context),
            style: OutlinedButton.styleFrom(
              foregroundColor: Colors.black,
              side: BorderSide(color: Colors.grey.shade300),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
            ),
            child: const Text("Log in", style: TextStyle(fontWeight: FontWeight.bold)),
          ),
          const SizedBox(width: 12),
          ElevatedButton(
            onPressed: () => LoginDialog.show(context),
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.black,
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
            ),
            child: const Text("Sign up"),
          ),
        ],
      ],
    );
  }

  // --- MOBILE MENU (Bottom Sheet) ---
  void _showMobileMenu(BuildContext context, AuthProvider auth) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) {
        return Padding(
          padding: const EdgeInsets.symmetric(vertical: 24, horizontal: 16),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              ListTile(
                leading: const Icon(Icons.info_outline),
                title: const Text("How it works", style: TextStyle(fontWeight: FontWeight.bold)),
                onTap: () => Navigator.pop(context),
              ),
              ListTile(
                leading: const Icon(Icons.travel_explore),
                title: const Text("Explore locals", style: TextStyle(fontWeight: FontWeight.bold)),
                onTap: () {
                  Navigator.pop(context); // Close menu first
                  Navigator.pushNamed(context, '/explore');
                },
              ),
              const Divider(height: 30),
              
              if (auth.isLoggedIn) ...[
                ListTile(
                  leading: const Icon(Icons.dashboard_outlined),
                  title: const Text("Dashboard", style: TextStyle(fontWeight: FontWeight.bold)),
                  onTap: () {
                    Navigator.pop(context);
                    Navigator.pushNamed(context, '/dashboard');
                  },
                ),
                ListTile(
                  leading: const Icon(Icons.logout, color: Color(0xFFC46A4A)),
                  title: const Text("Log out", style: TextStyle(fontWeight: FontWeight.bold, color: Color(0xFFC46A4A))),
                  onTap: () {
                    auth.logout();
                    Navigator.pop(context);
                    Navigator.pushNamedAndRemoveUntil(context, '/', (route) => false);
                  },
                ),
              ] else ...[
                ListTile(
                  leading: const Icon(Icons.login),
                  title: const Text("Log in", style: TextStyle(fontWeight: FontWeight.bold)),
                  onTap: () {
                    Navigator.pop(context);
                    LoginDialog.show(context);
                  },
                ),
                ListTile(
                  leading: const Icon(Icons.person_add_alt),
                  title: const Text("Sign up", style: TextStyle(fontWeight: FontWeight.bold)),
                  onTap: () {
                    Navigator.pop(context);
                    LoginDialog.show(context);
                  },
                ),
              ],
            ],
          ),
        );
      },
    );
  }

  Widget _navLink(BuildContext context, String text, {required VoidCallback onTap}) {
    return InkWell(
      onTap: onTap,
      child: Text(
        text,
        style: const TextStyle(fontWeight: FontWeight.w500, fontSize: 15),
      ),
    );
  }

  Widget _buildInitials(Map<String, dynamic>? user) {
    return Text(
      (user != null && user['full_name'] != null && user['full_name'].isNotEmpty)
          ? user['full_name'][0].toUpperCase()
          : "U",
      style: const TextStyle(color: Colors.black, fontWeight: FontWeight.bold),
    );
  }
}