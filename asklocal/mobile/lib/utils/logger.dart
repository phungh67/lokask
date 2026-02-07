import 'package:logger/logger.dart';

final logger = Logger(
  printer: PrettyPrinter(
    methodCount: 0, // Minimize noise
    errorMethodCount: 5, // Show trace on errors
    lineLength: 80,
    colors: true, 
    printEmojis: true,
  ),
);