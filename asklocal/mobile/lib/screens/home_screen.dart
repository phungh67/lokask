import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../services/api_service.dart';
import '../models/consultant_profile.dart';
import '../models/blog.dart';
import '../widgets/hero_search_bar.dart';
import '../widgets/consultant_card_compact.dart';
import '../widgets/destination_card.dart';
import '../widgets/idea_card.dart';
import '../widgets/navbar.dart';
import '../utils/image_helper.dart';
import 'explorer_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  final ApiService _api = ApiService();

  late Future<List<ConsultantProfile>> _topLocalsFuture;
  late Future<List<ConsultantProfile>> _thailandLocalsFuture;
  late Future<List<ConsultantProfile>> _parisLocalsFuture;

  final List<Map<String, String>> _destinations = [
    {"city": "Rome", "img": "home/destinations/rome.jpg"},
    {"city": "Paris", "img": "home/destinations/paris.jpg"},
    {"city": "London", "img": "home/destinations/london.jpg"},
    {"city": "New York", "img": "home/destinations/new_york.jpg"},
    {"city": "Tokyo", "img": "home/destinations/tokyo.jpg"},
  ];

  late Future<List<Blog>> _blogsFuture;

  @override
  void initState() {
    super.initState();
    _topLocalsFuture = _api.getConsultants();
    _thailandLocalsFuture = _api.getConsultants(country: "TH");
    _parisLocalsFuture = _api.getConsultants(city: "Paris");
    _blogsFuture = _api.getBlogs();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFFDFCF8),
      body: CustomScrollView(
        slivers: [
          const SliverToBoxAdapter(child: Navbar()),
          SliverToBoxAdapter(child: _buildHeroSection()),

          // --- DESTINATIONS LIST ---
          SliverToBoxAdapter(
            child: SizedBox(
              height: 140,
              child: ListView.separated(
                padding: const EdgeInsets.symmetric(horizontal: 24),
                scrollDirection: Axis.horizontal,
                itemCount: _destinations.length,
                separatorBuilder: (c, i) => const SizedBox(width: 16),
                itemBuilder: (context, index) {
                  final city = _destinations[index]["city"]!;
                  final imgPath = _destinations[index]["img"]!;

                  return InkWell(
                    borderRadius: BorderRadius.circular(16),
                    onTap: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (_) => ExploreScreen(initialCity: city),
                        ),
                      );
                    },
                    child: DestinationCard(
                      city: city,
                      imageUrl: ImageHelper.getAssetUrl(imgPath),
                    ),
                  );
                },
              ),
            ),
          ),

          const SliverToBoxAdapter(child: SizedBox(height: 40)),

          // --- TOP LOCALS ---
          _buildSectionHeader(
            "Top locals travellers trust",
            onSeeAll: () {
              Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => const ExploreScreen()),
              );
            },
          ),
          _buildConsultantList(_topLocalsFuture),

          const SliverToBoxAdapter(child: SizedBox(height: 40)),

          // --- THAILAND LOCALS ---
          _buildSectionHeader(
            "Wonderful locals in Thailand",
            onSeeAll: () {
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (_) => const ExploreScreen(initialCountry: "TH"),
                ),
              );
            },
          ),
          _buildConsultantList(_thailandLocalsFuture),

          const SliverToBoxAdapter(child: SizedBox(height: 40)),

          // --- PARIS LOCALS ---
          _buildSectionHeader(
            "Most asked local in Paris",
            onSeeAll: () {
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (_) => const ExploreScreen(initialCity: "Paris"),
                ),
              );
            },
          ),
          _buildConsultantList(_parisLocalsFuture),

          const SliverToBoxAdapter(child: SizedBox(height: 60)),

          // --- BLOG IDEAS (Updated) ---
          _buildSectionHeader("Ideas locals often recommend", onSeeAll: () {}),
          SliverPadding(
            padding: const EdgeInsets.symmetric(horizontal: 24),
            sliver: SliverToBoxAdapter(
              child: SizedBox(
                height: 280,
                child: FutureBuilder<List<Blog>>(
                  future: _blogsFuture,
                  builder: (context, snapshot) {
                    if (snapshot.connectionState == ConnectionState.waiting) {
                      return const Center(child: CircularProgressIndicator());
                    }
                    if (!snapshot.hasData || snapshot.data!.isEmpty) {
                      return Container(
                        alignment: Alignment.center,
                        child: const Text(
                          "No blogs yet.",
                          style: TextStyle(color: Colors.grey),
                        ),
                      );
                    }

                    final blogs = snapshot.data!;

                    return ListView.separated(
                      scrollDirection: Axis.horizontal,
                      itemCount: blogs.length,
                      separatorBuilder: (c, i) => const SizedBox(width: 16),
                      itemBuilder: (context, index) {
                        final blog = blogs[index];

                        // 🟢 UPDATED: Use Named Route for URL persistence (/blog/123)
                        return InkWell(
                          borderRadius: BorderRadius.circular(16),
                          onTap: () {
                            Navigator.pushNamed(
                              context,
                              '/blog/${blog.id}',
                              arguments: blog, // Pass data for instant load
                            );
                          },
                          child: IdeaCard(
                            // 🟢 Use getTravelUrl for blogs (travel-photos bucket)
                            imageUrl:
                                ImageHelper.getTravelUrl(blog.coverImageUrl) ??
                                "",
                            city: blog.city,
                            title: blog.title,
                            description: blog.summary,
                          ),
                        );
                      },
                    );
                  },
                ),
              ),
            ),
          ),

          const SliverToBoxAdapter(child: SizedBox(height: 100)),
        ],
      ),
    );
  }

  // ... (Rest of your helper methods like _buildSectionHeader remain unchanged)

  Widget _buildSectionHeader(String title, {required VoidCallback onSeeAll}) {
    return SliverPadding(
      padding: const EdgeInsets.fromLTRB(24, 0, 24, 20),
      sliver: SliverToBoxAdapter(
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              title,
              style: GoogleFonts.libreBaskerville(
                fontSize: 22,
                fontWeight: FontWeight.bold,
                color: const Color(0xFF1A1A1A),
              ),
            ),
            TextButton(
              onPressed: onSeeAll,
              style: TextButton.styleFrom(
                foregroundColor: const Color(0xFFD97757),
              ),
              child: const Row(
                children: [
                  Text(
                    "See more",
                    style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold),
                  ),
                  SizedBox(width: 4),
                  Icon(Icons.arrow_forward, size: 14),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildConsultantList(Future<List<ConsultantProfile>> future) {
    return SliverPadding(
      padding: const EdgeInsets.symmetric(horizontal: 24),
      sliver: SliverToBoxAdapter(
        child: SizedBox(
          height: 380,
          child: FutureBuilder<List<ConsultantProfile>>(
            future: future,
            builder: (context, snapshot) {
              if (snapshot.connectionState == ConnectionState.waiting) {
                return const Center(child: CircularProgressIndicator());
              }
              if (!snapshot.hasData || snapshot.data!.isEmpty) {
                return Container(
                  alignment: Alignment.center,
                  child: const Text("Coming soon to this region!"),
                );
              }

              final list = snapshot.data!.take(4).toList();

              return ListView.separated(
                scrollDirection: Axis.horizontal,
                itemCount: list.length,
                separatorBuilder: (c, i) => const SizedBox(width: 20),
                itemBuilder: (context, index) {
                  return ConsultantCardCompact(consultant: list[index]);
                },
              );
            },
          ),
        ),
      ),
    );
  }

  Widget _buildHeroSection() {
    return LayoutBuilder(
      builder: (context, constraints) {
        bool isDesktop = constraints.maxWidth > 900;

        // 1. Define the Text Content (Title, Search, AND Trust Badges)
        Widget textContent = Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(
              "Ask locals. Travel with\nconfidence.",
              style: GoogleFonts.libreBaskerville(
                fontSize: isDesktop ? 56 : 36,
                fontWeight: FontWeight.bold,
                height: 1.1,
                color: const Color(0xFF1A1A1A),
              ),
            ),
            const SizedBox(height: 16),
            Text(
              "Find real people who live there and get honest advice before your trip.",
              style: TextStyle(
                fontSize: 18,
                color: Colors.grey.shade600,
                height: 1.5,
              ),
            ),
            const SizedBox(height: 40),
            const HeroSearchBar(),

            // 🟢 CORRECT PLACE: Inside the children list of the Column
            if (isDesktop) ...[
              const SizedBox(height: 48),
              Row(
                children: [
                  _buildTrustBadge(
                    Icons.verified_user_outlined,
                    "Verified Locals",
                  ),
                  const SizedBox(width: 24),
                  _buildTrustBadge(Icons.chat_bubble_outline, "Direct Chat"),
                  const SizedBox(width: 24),
                  _buildTrustBadge(Icons.payment, "Secure Payment"),
                ],
              ),
            ],
          ],
        );

        // 2. Define the Image Card
        Widget imageCard = Container(
          // Adjusted height to reduce blank space
          height: isDesktop ? 450 : 300,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(30),
            image: DecorationImage(
              image: NetworkImage(
                ImageHelper.getAssetUrl("home/hero/siwa_oasis.jpg"),
              ),
              fit: BoxFit.cover,
            ),
          ),
          alignment: Alignment.bottomLeft,
          child: Padding(
            padding: const EdgeInsets.all(24.0),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: 0.2),
                    shape: BoxShape.circle,
                    border: Border.all(color: Colors.white, width: 1.5),
                  ),
                  child: const Icon(Icons.play_arrow, color: Colors.white),
                ),
                const SizedBox(height: 16),
                const Text(
                  "Siwa Oasis, Egypt",
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 24,
                    fontWeight: FontWeight.bold,
                    fontFamily: 'Serif',
                  ),
                ),
                const Text(
                  "Lorem ipsum dolor sit amet...",
                  style: TextStyle(color: Colors.white70, fontSize: 14),
                ),
              ],
            ),
          ),
        );

        // 3. Return the Layout (Desktop vs Mobile)
        if (isDesktop) {
          return Padding(
            padding: const EdgeInsets.fromLTRB(24, 24, 24, 60),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                Expanded(flex: 5, child: imageCard),
                const SizedBox(width: 60),
                Expanded(flex: 6, child: textContent),
              ],
            ),
          );
        } else {
          return Padding(
            padding: const EdgeInsets.fromLTRB(24, 24, 24, 40),
            child: Column(
              children: [textContent, const SizedBox(height: 40), imageCard],
            ),
          );
        }
      },
    );
  }

  // helper method inside the class
  Widget _buildTrustBadge(IconData icon, String label) {
    return Row(
      children: [
        Icon(icon, color: Colors.grey, size: 20),
        const SizedBox(width: 8),
        Text(
          label,
          style: TextStyle(
            color: Colors.grey[600],
            fontSize: 13,
            fontWeight: FontWeight.w500,
          ),
        ),
      ],
    );
  }
}
