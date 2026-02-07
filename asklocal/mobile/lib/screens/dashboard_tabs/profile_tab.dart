import 'dart:typed_data'; // 🟢 FIX: For Web Bytes
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';
import '../../services/api_service.dart';
import '../../utils/image_helper.dart'; // 🟢 FIX: Import Helper

class ProfileTab extends StatefulWidget {
  const ProfileTab({super.key});

  @override
  State<ProfileTab> createState() => _ProfileTabState();
}

class _ProfileTabState extends State<ProfileTab> {
  final _formKey = GlobalKey<FormState>();
  final _apiService = ApiService();
  final _picker = ImagePicker();

  final _bioController = TextEditingController();
  final _rateController = TextEditingController();

  bool _isLoading = true;
  bool _isUploading = false;
  bool _isConsultant = false;

  @override
  void initState() {
    super.initState();
    _fetchProfileData();
  }

  Future<void> _fetchProfileData() async {
    final userId = Provider.of<AuthProvider>(
      context,
      listen: false,
    ).user?['id'];
    if (userId == null) return;
    try {
      final profile = await _apiService.getConsultantByUserId(userId);
      if (!mounted) return;
      if (profile != null) {
        setState(() {
          _isConsultant = true;
          _bioController.text = profile.bio;
          _rateController.text = profile.hourlyRate.toString();
          _isLoading = false;
        });
      } else {
        setState(() {
          _isConsultant = false;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _pickAndUploadImage() async {
    final auth = Provider.of<AuthProvider>(context, listen: false);

    try {
      final XFile? pickedFile = await _picker.pickImage(
        source: ImageSource.gallery,
      );
      if (pickedFile == null) return;

      if (!mounted) return; // Safety check for UI updates

      setState(() => _isUploading = true);

      final Uint8List bytes = await pickedFile.readAsBytes();
      final String filename = pickedFile.name;

      final newAvatarUrl = await _apiService.uploadAvatar(
        bytes,
        filename,
        auth.token!,
      );

      auth.updateUserAvatar(newAvatarUrl);

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text("Avatar updated successfully!")),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text("Upload failed: $e")));
      }
    } finally {
      if (mounted) setState(() => _isUploading = false);
    }
  }

  Future<void> _saveProfile() async {
    if (!_formKey.currentState!.validate()) return;
    ScaffoldMessenger.of(
      context,
    ).showSnackBar(const SnackBar(content: Text("Saving...")));
  }

  @override
  Widget build(BuildContext context) {
    final auth = Provider.of<AuthProvider>(context);
    final user = auth.user;

    // Use ImageHelper
    final avatarUrl = ImageHelper.getAvatarUrl(
      user?['avatar_url'] ?? user?['avatarUrl'],
    );

    if (_isLoading) {
      return const Center(child: CircularProgressIndicator());
    }

    return SingleChildScrollView(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            "My Profile",
            style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 24),

          _sectionTitle("Basic Information"),
          Container(
            padding: const EdgeInsets.all(24),
            decoration: _boxDecoration(),
            child: Row(
              children: [
                // --- AVATAR + EDIT BUTTON ---
                Stack(
                  children: [
                    Container(
                      width: 80,
                      height: 80,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: Colors.grey[200],
                        border: Border.all(color: Colors.grey.shade300),
                      ),
                      child: ClipOval(
                        child: _isUploading
                            ? const Center(
                                child: CircularProgressIndicator(
                                  strokeWidth: 2,
                                ),
                              )
                            : (avatarUrl != null && avatarUrl.isNotEmpty
                                  ? Image.network(
                                      avatarUrl,
                                      fit: BoxFit.cover,
                                      errorBuilder: (c, e, s) => const Icon(
                                        Icons.person,
                                        size: 40,
                                        color: Colors.grey,
                                      ),
                                    )
                                  : const Icon(
                                      Icons.person,
                                      size: 40,
                                      color: Colors.grey,
                                    )),
                      ),
                    ),
                    Positioned(
                      bottom: 0,
                      right: 0,
                      child: GestureDetector(
                        onTap: _isUploading ? null : _pickAndUploadImage,
                        child: Container(
                          padding: const EdgeInsets.all(6),
                          decoration: const BoxDecoration(
                            color: Color(0xFFC46A4A),
                            shape: BoxShape.circle,
                          ),
                          child: const Icon(
                            Icons.camera_alt,
                            size: 16,
                            color: Colors.white,
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
                // -----------------------------
                const SizedBox(width: 24),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      user?['full_name'] ?? "User",
                      style: const TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 18,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      user?['email'] ?? "",
                      style: const TextStyle(color: Colors.grey),
                    ),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 32),

          // ... (Consultant/Traveler forms remain standard)
          if (_isConsultant) ...[
            _sectionTitle("Consultant Details"),
            Container(
              padding: const EdgeInsets.all(24),
              decoration: _boxDecoration(),
              child: Form(
                key: _formKey,
                child: Column(
                  children: [
                    TextFormField(
                      controller: _bioController,
                      maxLines: 4,
                      decoration: _inputDecoration(
                        "Bio",
                        "Tell travelers about yourself...",
                      ),
                    ),
                    const SizedBox(height: 20),
                    TextFormField(
                      controller: _rateController,
                      keyboardType: TextInputType.number,
                      decoration: _inputDecoration(
                        "Hourly Rate (\$)",
                        "e.g. 50",
                      ),
                    ),
                    const SizedBox(height: 24),
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton(
                        onPressed: _saveProfile,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFFC46A4A),
                          padding: const EdgeInsets.symmetric(vertical: 16),
                        ),
                        child: const Text(
                          "Save Changes",
                          style: TextStyle(fontWeight: FontWeight.bold),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ] else ...[
            Container(
              padding: const EdgeInsets.all(32),
              width: double.infinity,
              decoration: _boxDecoration(),
              child: Column(
                children: [
                  const Icon(Icons.map, size: 48, color: Colors.grey),
                  const SizedBox(height: 16),
                  const Text(
                    "Want to earn money showing your city?",
                    style: TextStyle(fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 8),
                  const Text(
                    "Become a Local Guide today and start getting bookings.",
                  ),
                  const SizedBox(height: 24),
                  OutlinedButton(
                    onPressed: () {},
                    child: const Text("Register as Local Guide"),
                  ),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }

  BoxDecoration _boxDecoration() {
    return BoxDecoration(
      color: Colors.white,
      borderRadius: BorderRadius.circular(12),
      border: Border.all(color: Colors.grey.shade200),
    );
  }

  InputDecoration _inputDecoration(String label, String hint) {
    return InputDecoration(
      labelText: label,
      hintText: hint,
      border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
      alignLabelWithHint: true,
    );
  }

  Widget _sectionTitle(String title) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Text(
        title,
        style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 16),
      ),
    );
  }
}
