import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../models/city.dart';

const Color kPrimary = Color(0xFFC46A4A);

class RegisterScreen extends StatefulWidget {
  const RegisterScreen({super.key});

  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  final _formKey = GlobalKey<FormState>();
  final _apiService = ApiService();

  final _nameController = TextEditingController();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();

  bool _isLoading = false;
  String _selectedRole = 'traveler';
  int? _selectedCityId;
  List<City> _cities = [];

  @override
  void initState() {
    super.initState();
    _loadCities();
  }

  Future<void> _loadCities() async {
    try {
      final cities = await _apiService.getCities();
      if (!mounted) return; // FIX: Async gap check
      setState(() => _cities = cities);
    } catch (e) {
      if (!mounted) return; // FIX: Async gap check
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text("Could not load cities: $e")));
    }
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;

    if (_selectedRole == 'consultant' && _selectedCityId == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("Please select your city to become a consultant.")),
      );
      return;
    }

    setState(() => _isLoading = true);

    try {
      await _apiService.register(
        fullName: _nameController.text,
        email: _emailController.text,
        password: _passwordController.text,
        role: _selectedRole,
        cityId: _selectedCityId,
      );

      if (!mounted) return; // FIX: Async gap check
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("Registration Successful! Please Login.")),
      );
      
      Navigator.pop(context); 

    } catch (e) {
      if (!mounted) return; // FIX: Async gap check
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text("Error: ${e.toString().replaceAll('Exception: ', '')}")),
      );
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(title: const Text("Join AskLocal"), backgroundColor: Colors.white, foregroundColor: Colors.black, elevation: 0),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const Text("Create Account", style: TextStyle(fontSize: 28, fontWeight: FontWeight.bold, color: kPrimary)),
              const SizedBox(height: 8),
              const Text("Start your journey as a traveler or a local expert.", style: TextStyle(color: Colors.grey)),
              const SizedBox(height: 32),

              TextFormField(
                controller: _nameController,
                decoration: _inputDecoration("Full Name", Icons.person),
                validator: (v) => v!.isEmpty ? "Name is required" : null,
              ),
              const SizedBox(height: 16),

              TextFormField(
                controller: _emailController,
                decoration: _inputDecoration("Email", Icons.email),
                validator: (v) => v!.contains("@") ? null : "Enter a valid email",
              ),
              const SizedBox(height: 16),

              TextFormField(
                controller: _passwordController,
                decoration: _inputDecoration("Password", Icons.lock),
                obscureText: true,
                validator: (v) => v!.length < 6 ? "Password must be 6+ chars" : null,
              ),
              const SizedBox(height: 24),

              const Text("I want to sign up as a:", style: TextStyle(fontWeight: FontWeight.bold)),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(child: _buildRoleCard("Traveler", "traveler", Icons.flight_takeoff)),
                  const SizedBox(width: 12),
                  Expanded(child: _buildRoleCard("Local Guide", "consultant", Icons.map)),
                ],
              ),

              if (_selectedRole == 'consultant') ...[
                const SizedBox(height: 24),
                DropdownButtonFormField<int>(
                  decoration: _inputDecoration("Select your City", Icons.location_city),
                  initialValue: _selectedCityId,
                  items: _cities.map((city) {
                    return DropdownMenuItem(value: city.id, child: Text("${city.name}, ${city.country}"));
                  }).toList(),
                  onChanged: (val) => setState(() => _selectedCityId = val),
                  hint: const Text("Where are you based?"),
                ),
              ],

              const SizedBox(height: 32),

              ElevatedButton(
                onPressed: _isLoading ? null : _submit,
                style: ElevatedButton.styleFrom(
                  backgroundColor: kPrimary,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                ),
                child: _isLoading 
                    ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                    : const Text("Register", style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
              ),
            ],
          ),
        ),
      ),
    );
  }

  InputDecoration _inputDecoration(String label, IconData icon) {
    return InputDecoration(
      labelText: label,
      prefixIcon: Icon(icon, color: kPrimary),
      border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
      focusedBorder: OutlineInputBorder(borderSide: const BorderSide(color: kPrimary, width: 2), borderRadius: BorderRadius.circular(8)),
    );
  }

  Widget _buildRoleCard(String title, String value, IconData icon) {
    final isSelected = _selectedRole == value;
    return GestureDetector(
      onTap: () => setState(() => _selectedRole = value),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 16),
        decoration: BoxDecoration(
          // FIX: Use withValues for new Flutter versions
          color: isSelected ? kPrimary.withValues(alpha: 0.1) : Colors.white,
          border: Border.all(color: isSelected ? kPrimary : Colors.grey.shade300, width: 2),
          borderRadius: BorderRadius.circular(8),
        ),
        child: Column(
          children: [
            Icon(icon, color: isSelected ? kPrimary : Colors.grey, size: 28),
            const SizedBox(height: 8),
            Text(title, style: TextStyle(color: isSelected ? kPrimary : Colors.grey, fontWeight: FontWeight.bold)),
          ],
        ),
      ),
    );
  }
}