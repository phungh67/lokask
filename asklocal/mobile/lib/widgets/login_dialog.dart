import 'package:flutter/material.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
import '../services/api_service.dart'; // <--- Add this import

class LoginDialog extends StatefulWidget {
  const LoginDialog({super.key});

  static void show(BuildContext context) {
    showDialog(
      context: context,
      barrierColor: Colors.black.withValues(alpha: 0.6),
      builder: (context) => const LoginDialog(),
    );
  }

  @override
  State<LoginDialog> createState() => _LoginDialogState();
}

enum LoginStep { email, password }

class _LoginDialogState extends State<LoginDialog> {
  // State
  LoginStep _step = LoginStep.email;
  bool _isLoading = false;
  String? _errorMessage;

  // Controllers
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();

  // Focus Nodes (To handle "Enter" key behavior)
  final _passwordFocusNode = FocusNode();

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    _passwordFocusNode.dispose();
    super.dispose();
  }

  // --- LOGIC: STEP 1 (Check Email) ---
  void _submitEmail() {
    final email = _emailController.text.trim();
    if (email.isEmpty || !email.contains('@')) {
      setState(() => _errorMessage = "Please enter a valid email address.");
      return;
    }

    setState(() {
      _errorMessage = null;
      _step = LoginStep.password; // Move to next step
    });

    // Auto-focus the password field after a short delay for UI to rebuild
    Future.delayed(const Duration(milliseconds: 100), () {
      _passwordFocusNode.requestFocus();
    });
  }

  // --- LOGIC: STEP 2 (Actual Login) ---
  Future<void> _submitLogin() async {
    final email = _emailController.text.trim();
    final password = _passwordController.text;

    if (password.isEmpty) {
      setState(() => _errorMessage = "Password cannot be empty.");
      return;
    }

    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      // 1. Call API directly to exchange credentials for Token + User Data
      final api = ApiService();
      final response = await api.login(email, password);

      // 2. Extract data (Assuming backend returns { "token": "...", "user": {...} })
      final String token = response['token'];
      final Map<String, dynamic> userData = response['user'];

      if (!mounted) return;

      // 3. Pass result to AuthProvider to update state & persistence
      await Provider.of<AuthProvider>(
        context,
        listen: false,
      ).login(token, userData);

      if (mounted) {
        Navigator.pop(context); // Close dialog on success
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          // Clean up error message
          _errorMessage = e.toString().replaceAll("Exception:", "").trim();
        });
      }
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  // --- UI: BACK BUTTON ---
  void _goBack() {
    setState(() {
      _step = LoginStep.email;
      _errorMessage = null;
      _passwordController.clear();
    });
  }

  @override
  Widget build(BuildContext context) {
    const kPrimary = Color(0xFFC46A4A);

    return Dialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
      backgroundColor: Colors.white,
      surfaceTintColor: Colors.white,
      child: ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: 500),
        child: Padding(
          padding: const EdgeInsets.all(32.0),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // HEADER
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  if (_step == LoginStep.password)
                    IconButton(
                      onPressed: _goBack,
                      icon: const Icon(Icons.arrow_back),
                      padding: EdgeInsets.zero,
                      constraints: const BoxConstraints(),
                      splashRadius: 20,
                    )
                  else
                    const SizedBox(width: 24), // Spacer to balance layout

                  Text(
                    _step == LoginStep.email
                        ? "Log in or sign up"
                        : "Welcome back",
                    style: GoogleFonts.libreBaskerville(
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                    ),
                  ),

                  IconButton(
                    onPressed: () => Navigator.pop(context),
                    icon: const Icon(Icons.close),
                    padding: EdgeInsets.zero,
                    constraints: const BoxConstraints(),
                    splashRadius: 20,
                  ),
                ],
              ),

              const SizedBox(height: 8),

              if (_step == LoginStep.password)
                Text(
                  _emailController.text,
                  textAlign: TextAlign.center,
                  style: const TextStyle(
                    color: kPrimary,
                    fontWeight: FontWeight.bold,
                  ),
                )
              else
                Text(
                  "Sign in to unlock the best of Lokask",
                  textAlign: TextAlign.center,
                  style: TextStyle(color: Colors.grey[600], fontSize: 14),
                ),

              const SizedBox(height: 24),

              // ERROR MESSAGE
              if (_errorMessage != null)
                Container(
                  margin: const EdgeInsets.only(bottom: 16),
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.red.shade50,
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: Colors.red.shade200),
                  ),
                  child: Row(
                    children: [
                      const Icon(
                        Icons.error_outline,
                        color: Colors.red,
                        size: 20,
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          _errorMessage!,
                          style: TextStyle(
                            color: Colors.red.shade800,
                            fontSize: 13,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),

              // --- STEP 1: EMAIL & SOCIALS ---
              if (_step == LoginStep.email) ...[
                TextField(
                  controller: _emailController,
                  autofocus: true,
                  keyboardType: TextInputType.emailAddress,
                  textInputAction: TextInputAction.continueAction,
                  onSubmitted: (_) => _submitEmail(), // Enter Key Logic
                  decoration: _inputDecoration("Email address"),
                ),

                const SizedBox(height: 16),

                SizedBox(
                  height: 50,
                  child: ElevatedButton(
                    onPressed: _submitEmail,
                    style: _primaryButtonStyle(kPrimary),
                    child: const Text(
                      "Continue",
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ),

                const SizedBox(height: 24),
                _buildDivider(),
                const SizedBox(height: 24),

                // Social Buttons
                Row(
                  children: [
                    Expanded(
                      child: _SocialButton(
                        icon: FontAwesomeIcons.google,
                        color: Colors.red,
                        label: "Google",
                        onTap: () {
                          /* TODO Google login*/
                        },
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: _SocialButton(
                        icon: FontAwesomeIcons.facebookF,
                        color: Colors.blue[800]!,
                        label: "Facebook",
                        onTap: () {
                          /* TODO Facebook login*/
                        },
                      ),
                    ),
                  ],
                ),
              ],

              // --- STEP 2: PASSWORD ---
              if (_step == LoginStep.password) ...[
                TextField(
                  controller: _passwordController,
                  focusNode: _passwordFocusNode,
                  obscureText: true,
                  textInputAction: TextInputAction.done,
                  onSubmitted: (_) => _submitLogin(), // Enter Key Logic
                  decoration: _inputDecoration("Password"),
                ),

                Align(
                  alignment: Alignment.centerRight,
                  child: TextButton(
                    onPressed: () {}, // TODO: Forgot Password
                    child: const Text(
                      "Forgot password?",
                      style: TextStyle(color: Colors.grey, fontSize: 12),
                    ),
                  ),
                ),

                const SizedBox(height: 8),

                SizedBox(
                  height: 50,
                  child: ElevatedButton(
                    onPressed: _isLoading ? null : _submitLogin,
                    style: _primaryButtonStyle(kPrimary),
                    child: _isLoading
                        ? const SizedBox(
                            height: 20,
                            width: 20,
                            child: CircularProgressIndicator(
                              color: Colors.white,
                              strokeWidth: 2,
                            ),
                          )
                        : const Text(
                            "Log in",
                            style: TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }

  // --- STYLES & HELPERS ---

  InputDecoration _inputDecoration(String label) {
    return InputDecoration(
      labelText: label,
      filled: true,
      fillColor: Colors.grey[50],
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: BorderSide(color: Colors.grey.shade300),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: BorderSide(color: Colors.grey.shade300),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: Color(0xFFC46A4A)),
      ),
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
    );
  }

  ButtonStyle _primaryButtonStyle(Color color) {
    return ElevatedButton.styleFrom(
      backgroundColor: color,
      foregroundColor: Colors.white,
      elevation: 0,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
    );
  }

  Widget _buildDivider() {
    return Row(
      children: [
        Expanded(child: Divider(color: Colors.grey[300])),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: Text(
            "or",
            style: TextStyle(color: Colors.grey[500], fontSize: 12),
          ),
        ),
        Expanded(child: Divider(color: Colors.grey[300])),
      ],
    );
  }
}

class _SocialButton extends StatelessWidget {
  final IconData icon;
  final Color color;
  final String label;
  final VoidCallback onTap;

  const _SocialButton({
    required this.icon,
    required this.color,
    required this.label,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return OutlinedButton.icon(
      onPressed: onTap,
      icon: Icon(icon, color: color, size: 20),
      label: Text(label, style: const TextStyle(color: Colors.black87)),
      style: OutlinedButton.styleFrom(
        padding: const EdgeInsets.symmetric(vertical: 16),
        side: BorderSide(color: Colors.grey.shade300),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        backgroundColor: Colors.white,
      ),
    );
  }
}
