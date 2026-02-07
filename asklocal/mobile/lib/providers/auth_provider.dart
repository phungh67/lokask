// import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../services/api_service.dart'; // Import your service

class AuthProvider with ChangeNotifier {
  String? _token;
  Map<String, dynamic>? _user;
  bool _isInitialized = false;
  final ApiService _apiService = ApiService(); // Instance

  bool get isLoggedIn => _token != null;
  String? get token => _token;
  Map<String, dynamic>? get user => _user;
  bool get isInitialized => _isInitialized;

  void updateUserAvatar(String newUrl) {
    if (_user != null) {
      _user!['avatar_url'] = newUrl;
      // It is legal to call notifyListeners here because we are INSIDE the class
      notifyListeners(); 
    }
  }

  // --- 1. LOGIN ---
  Future<void> login(String token, Map<String, dynamic> userData) async {
    _token = token;
    _user = userData;
    _isInitialized = true;
    notifyListeners();

    // Save simple token to disk
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('auth_token', token);
    // Note: We don't strictly need to save 'user_data' anymore 
    // because we fetch it fresh on every startup!
  }

  // --- 2. LOGOUT ---
  Future<void> logout() async {
    if (_token != null) {
      await _apiService.logout(_token!);
    }

    _token = null;
    _user = null;
    _isInitialized = true;
    notifyListeners();

    final prefs = await SharedPreferences.getInstance();
    await prefs.clear();
  }

  // --- 3. AUTO-LOGIN (The "Check Redis" Logic) ---
  Future<void> tryAutoLogin() async {
    final prefs = await SharedPreferences.getInstance();
    
    // A. Do we even have a candidate token?
    if (!prefs.containsKey('auth_token')) {
      _isInitialized = true;
      notifyListeners();
      return;
    }

    final candidateToken = prefs.getString('auth_token')!;

    try {
      // B. THE VERIFICATION CALL
      // We ask the backend: "Is this token still valid?"
      final freshUserData = await _apiService.getMe(candidateToken);

      // C. Success! Server said 200 OK.
      _token = candidateToken;
      _user = freshUserData; // Update with freshest data (e.g. new avatar)
      
    } catch (e) {
      // D. Failure! Server said 401 (Session Expired/Banned)
      // The token is trash. Delete it.
      await prefs.clear();
      _token = null;
      _user = null;
    }

    _isInitialized = true;
    notifyListeners();
  }
}