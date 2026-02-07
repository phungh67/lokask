import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'providers/auth_provider.dart';
import 'screens/home_screen.dart';
import 'screens/login_screen.dart';
import 'screens/register_screen.dart';
import 'screens/dashboard_screen.dart';
import 'screens/explorer_screen.dart'; // Make sure this matches your filename (might be explore_locals_screen.dart)
import 'screens/consultant_profile_screen.dart';
import 'screens/blog_detail_screen.dart';
import 'models/blog.dart'; // <--- 🟢 Import Blog model for arguments

import 'utils/nav_key.dart';
import 'utils/app_scroll_behavior.dart';

void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthProvider()),
      ],
      child: MaterialApp(
        title: 'Lokask',
        debugShowCheckedModeBanner: false,
        navigatorKey: navigatorKey,
        theme: ThemeData(
          primarySwatch: Colors.orange,
          scaffoldBackgroundColor: const Color(0xFFFDFCF8),
          useMaterial3: true,
        ),

        scrollBehavior: AppScrollBehavior(),
        
        // --- 1. STATIC ROUTES ---
        routes: {
          '/': (context) => const HomeScreen(),
          '/login': (context) => const LoginScreen(),
          '/register': (context) => const RegisterScreen(),
          '/dashboard': (context) => const DashboardScreen(),
        },
        
        // --- 2. DYNAMIC ROUTES ---
        onGenerateRoute: (settings) {
          final uri = Uri.parse(settings.name ?? "/");

          // Case A: Explore Screen
          if (uri.path == '/explore') {
            final args = settings.arguments as Map<String, dynamic>?;
            return MaterialPageRoute(
              builder: (_) => ExploreScreen(
                initialCity: args?['city'],
                initialNiche: args?['niche'],
              ),
              settings: settings,
            );
          }

          // Case B: Consultant Profile (/consultant/123)
          if (uri.pathSegments.length == 2 && uri.pathSegments[0] == 'consultant') {
            final id = uri.pathSegments[1];
            return MaterialPageRoute(
              builder: (_) => ConsultantProfileScreen(consultantId: id),
              settings: settings,
            );
          }

          // 🟢 Case C: Blog Details (/blog/123)
          if (uri.pathSegments.length == 2 && uri.pathSegments[0] == 'blog') {
            final id = uri.pathSegments[1];
            // Check if we passed the full Blog object (fast load) or just the ID (refresh)
            final extraBlog = settings.arguments as Blog?; 
            
            return MaterialPageRoute(
              builder: (_) => BlogDetailScreen(blogId: id, blog: extraBlog),
              settings: settings,
            );
          }

          // Case D: Fallback / 404
          return MaterialPageRoute(
            builder: (_) => const HomeScreen(),
            settings: const RouteSettings(name: '/'), 
          );
        },
      ),
    );
  }
}