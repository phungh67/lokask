import 'package:flutter/material.dart';
import '../models/consultant_profile.dart';
import '../models/niche.dart';
import '../services/api_service.dart';
import '../widgets/consultant_card.dart';
import '../widgets/navbar.dart';

class ExploreScreen extends StatefulWidget {
  final String? initialCity;
  final String? initialCountry;
  final String? initialNiche;

  const ExploreScreen({
    super.key, 
    this.initialCity, 
    this.initialNiche,
    this.initialCountry
  });

  @override
  State<ExploreScreen> createState() => _ExploreScreenState();
}

class _ExploreScreenState extends State<ExploreScreen> {
  final ApiService _api = ApiService();
  final TextEditingController _searchController = TextEditingController();

  late Future<List<ConsultantProfile>> _consultantsFuture;
  late Future<List<Niche>> _nichesFuture; 

  String? _selectedFilter; 

  @override
  void initState() {
    super.initState();
    _selectedFilter = widget.initialNiche;
    if (widget.initialCity != null) {
      _searchController.text = widget.initialCity!;
    }
    _nichesFuture = _api.getNiches();
    _consultantsFuture = _api.getConsultants(
      city: widget.initialCity,
      country: widget.initialCountry
    );
  }

  List<ConsultantProfile> _applyFilter(List<ConsultantProfile> all) {
    if (_selectedFilter == null || _selectedFilter == "All") {
      return all;
    }
    return all.where((p) {
      return p.niches.contains(_selectedFilter);
    }).toList();
  }

  void _onFilterSelected(String filterName) {
    setState(() {
      if (_selectedFilter == filterName) {
        _selectedFilter = null;
      } else {
        _selectedFilter = filterName;
      }
    });
  }

  void _search(String query) {
    setState(() {
      _consultantsFuture = _api.getConsultants(city: query);
    });
  }

  Widget _buildSearchBar() {
    return Container(
      width: 400, 
      height: 48,
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(50),
        border: Border.all(color: Colors.grey.shade300), 
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 10,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: TextField(
        controller: _searchController,
        onSubmitted: _search,
        decoration: const InputDecoration(
          hintText: "Where do you want to go?",
          hintStyle: TextStyle(color: Colors.grey),
          prefixIcon: Icon(Icons.search, color: Color(0xFFD97757)), 
          border: InputBorder.none,
          contentPadding: EdgeInsets.symmetric(horizontal: 20, vertical: 12),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFFAFAFA),
      body: SingleChildScrollView(
        child: Column(
          children: [
            const Navbar(),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 24),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Center(child: _buildSearchBar()),
                  const SizedBox(height: 48),

                  const Text(
                    "Explore locals",
                    style: TextStyle(
                      fontSize: 48,
                      fontWeight: FontWeight.bold,
                      fontFamily: 'Serif',
                      letterSpacing: -1.0,
                      color: Color(0xFF1A1A1A),
                    ),
                  ),
                  const SizedBox(height: 16),
                  const Text(
                    "Find real people who live in your destination and can give you honest, local advice.",
                    style: TextStyle(fontSize: 18, color: Colors.grey, height: 1.5),
                  ),

                  const SizedBox(height: 40),

                  // DYNAMIC FILTERS
                  FutureBuilder<List<Niche>>(
                    future: _nichesFuture,
                    builder: (context, snapshot) {
                      if (!snapshot.hasData) return const SizedBox(height: 40);
                      var niches = snapshot.data!;
                      return Wrap(
                        spacing: 12,
                        runSpacing: 12,
                        children: [
                          _buildFilterChip("All"),
                          ...niches.map((niche) => _buildFilterChip(niche.displayName)),
                        ],
                      );
                    },
                  ),

                  const SizedBox(height: 48),

                  // GRID
                  FutureBuilder<List<ConsultantProfile>>(
                    future: _consultantsFuture,
                    builder: (context, snapshot) {
                      if (snapshot.connectionState == ConnectionState.waiting) {
                        return const Center(child: CircularProgressIndicator(color: Color(0xFFD97757)));
                      }
                      if (!snapshot.hasData || snapshot.data!.isEmpty) {
                        return const Text("No locals found.");
                      }
                      final filteredList = _applyFilter(snapshot.data!);

                      if (filteredList.isEmpty) {
                        return const Padding(
                          padding: EdgeInsets.only(top: 40),
                          child: Text("No locals found for this filter.", style: TextStyle(color: Colors.grey)),
                        );
                      }

                      return LayoutBuilder(
                        builder: (context, constraints) {
                          double width = constraints.maxWidth;
                          int cols = 1;
                          
                          // FIXED: Added curly braces for linter compliance
                          if (width > 1200) {
                            cols = 5;
                          } else if (width > 992) {
                            cols = 4;
                          } else if (width > 768) {
                            cols = 3;
                          } else if (width > 576) {
                            cols = 2;
                          }

                          return GridView.builder(
                            shrinkWrap: true,
                            physics: const NeverScrollableScrollPhysics(),
                            gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                                crossAxisCount: cols,
                                crossAxisSpacing: 24,
                                mainAxisSpacing: 24,
                                childAspectRatio: 0.65,
                            ),
                            itemCount: filteredList.length,
                            itemBuilder: (context, index) {
                              final consultant = filteredList[index];
                              return ConsultantCard(profile: consultant);
                            },
                          );
                        },
                      );
                    },
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildFilterChip(String label) {
    bool isSelected = _selectedFilter == label || (_selectedFilter == null && label == "All");

    return GestureDetector(
      onTap: () => _onFilterSelected(label),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
        decoration: BoxDecoration(
          color: isSelected ? const Color(0xFFD97757) : const Color(0xFFF3F4F6),
          borderRadius: BorderRadius.circular(50),
        ),
        child: Text(
          label,
          style: TextStyle(
            color: isSelected ? Colors.white : const Color(0xFF4B5563),
            fontWeight: FontWeight.w500,
          ),
        ),
      ),
    );
  }
}