import 'package:flutter/material.dart';
import 'package:intl/intl.dart'; // 🟢 Import for date formatting
import '../models/niche.dart';
import '../services/api_service.dart';

class HeroSearchBar extends StatefulWidget {
  const HeroSearchBar({super.key});

  @override
  State<HeroSearchBar> createState() => _HeroSearchBarState();
}

class _HeroSearchBarState extends State<HeroSearchBar> {
  final TextEditingController _whereController = TextEditingController();
  final TextEditingController _whenController = TextEditingController();

  List<Niche> _niches = [];
  String? _selectedNiche;

  @override
  void initState() {
    super.initState();
    _loadNiches();
  }

  Future<void> _loadNiches() async {
    try {
      final niches = await ApiService().getNiches();
      if (mounted) setState(() => _niches = niches);
    } catch (e) {
      debugPrint("Error loading niches: $e");
    }
  }

  // 🟢 NEW: Function to pick a date
  Future<void> _pickDate() async {
    final DateTime? picked = await showDatePicker(
      context: context,
      initialDate: DateTime.now(),
      firstDate: DateTime.now(),
      lastDate: DateTime(2030),
      builder: (context, child) {
        return Theme(
          data: Theme.of(context).copyWith(
            colorScheme: const ColorScheme.light(
              primary: Color(0xFFD97757), // Match your brand color
            ),
          ),
          child: child!,
        );
      },
    );

    if (picked != null) {
      setState(() {
        // Format: "Oct 15, 2026" or "2026-10-15"
        _whenController.text = DateFormat.yMMMd().format(picked);
      });
    }
  }

  void _doSearch() {
    Navigator.pushNamed(
      context,
      '/explore',
      arguments: {'city': _whereController.text, 'niche': _selectedNiche},
    );
  }

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        bool isMobile = constraints.maxWidth < 800;

        return Container(
          height: isMobile ? null : 66,
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(isMobile ? 24 : 50),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.08),
                blurRadius: 20,
                offset: const Offset(0, 8),
              ),
            ],
            border: Border.all(color: Colors.grey.shade200),
          ),
          padding: const EdgeInsets.all(8),
          child: isMobile ? _buildMobileLayout() : _buildDesktopLayout(),
        );
      },
    );
  }

  // --- DESKTOP LAYOUT ---
  Widget _buildDesktopLayout() {
    return Row(
      children: [
        Expanded(
          flex: 3,
          child: _buildInputSegment(
            label: "Where",
            hint: "Destination / City",
            controller: _whereController,
            icon: null,
          ),
        ),
        _buildDivider(),

        Expanded(
          flex: 3,
          child: _buildInputSegment(
            label: "When",
            hint: "Travel Dates",
            controller: _whenController,
            icon: Icons.calendar_today,
            onTap: _pickDate, // 🟢 Connect the date picker here
          ),
        ),
        _buildDivider(),

        Expanded(flex: 3, child: _buildWhoDropdown()),

        Container(
          width: 50,
          height: 50,
          margin: const EdgeInsets.only(left: 8),
          decoration: const BoxDecoration(
            color: Color(0xFFD97757),
            shape: BoxShape.circle,
          ),
          child: IconButton(
            icon: const Icon(Icons.search, color: Colors.white),
            onPressed: _doSearch,
          ),
        ),
      ],
    );
  }

  // --- MOBILE LAYOUT ---
  Widget _buildMobileLayout() {
    return Column(
      children: [
        _buildInputSegment(
          label: "Where",
          hint: "Destination / City",
          controller: _whereController,
          icon: null,
        ),
        const Divider(height: 1),
        _buildInputSegment(
          label: "When",
          hint: "Travel Dates",
          controller: _whenController,
          icon: Icons.calendar_today,
          onTap: _pickDate, // 🟢 Connect here too
        ),
        const Divider(height: 1),
        _buildWhoDropdown(),
        const SizedBox(height: 12),
        SizedBox(
          width: double.infinity,
          height: 48,
          child: ElevatedButton.icon(
            onPressed: _doSearch,
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFFD97757),
              foregroundColor: Colors.white,
              elevation: 0,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(30),
              ),
            ),
            icon: const Icon(Icons.search),
            label: const Text(
              "Search",
              style: TextStyle(fontWeight: FontWeight.bold),
            ),
          ),
        ),
      ],
    );
  }

  // --- HELPERS ---

  Widget _buildInputSegment({
    required String label,
    required String hint,
    required TextEditingController controller,
    IconData? icon,
    VoidCallback? onTap, // 🟢 Add optional onTap callback
  }) {
    return GestureDetector(
      onTap: onTap, // 🟢 Make the whole area clickable (handles icon clicks)
      behavior: HitTestBehavior.opaque,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisAlignment: MainAxisAlignment.center,
          mainAxisSize: MainAxisSize.min,
          children: [
            Row(
              children: [
                Text(
                  label,
                  style: const TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 12,
                    color: Colors.black,
                  ),
                ),
                if (icon != null) ...[
                  const SizedBox(width: 4),
                  Icon(icon, size: 12, color: Colors.grey),
                ],
              ],
            ),
            const SizedBox(height: 4),
            TextField(
              controller: controller,
              // 🟢 IMPORTANT: If onTap is provided, disable keyboard (readOnly)
              readOnly: onTap != null,
              onTap: onTap,
              decoration: InputDecoration(
                isDense: true,
                contentPadding: EdgeInsets.zero,
                hintText: hint,
                hintStyle: TextStyle(color: Colors.grey.shade400, fontSize: 14),
                border: InputBorder.none,
              ),
              style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w500),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildWhoDropdown() {
    // ... (Your existing _buildWhoDropdown code) ...
    // Note: Copied from your file for completeness if you replace the whole file,
    // otherwise just keep your existing method.
    return InkWell(
      onTap: () {
        showModalBottomSheet(
          context: context,
          builder: (context) => ListView(
            padding: const EdgeInsets.all(16),
            children: _niches
                .map(
                  (n) => ListTile(
                    title: Text(n.displayName),
                    onTap: () {
                      setState(() => _selectedNiche = n.displayName);
                      Navigator.pop(context);
                    },
                  ),
                )
                .toList(),
          ),
        );
      },
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisAlignment: MainAxisAlignment.center,
          mainAxisSize: MainAxisSize.min,
          children: [
            const Row(
              children: [
                Text(
                  "Who",
                  style: TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 12,
                    color: Colors.black,
                  ),
                ),
                SizedBox(width: 4),
                Icon(Icons.keyboard_arrow_down, size: 14, color: Colors.grey),
              ],
            ),
            const SizedBox(height: 4),
            Text(
              _selectedNiche ?? "Type of local consultant",
              style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w500,
                color: _selectedNiche == null
                    ? Colors.grey.shade400
                    : Colors.black,
              ),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDivider() {
    return Container(width: 1, height: 32, color: Colors.grey.shade200);
  }
}
