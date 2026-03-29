# PetFood Scanner - Publication Guide

This guide provides instructions for publishing the PetFood Scanner app to Google Play Store and Apple App Store.

## Pre-Publication Checklist

### ✅ Security & Compliance
- [x] HTTPS-only communication (Supabase uses HTTPS by default)
- [x] Secure authentication with encrypted passwords
- [x] API keys stored in environment variables (not in code)
- [x] No sensitive data in plain text
- [x] Protection against common vulnerabilities

### ✅ Legal & Privacy
- [x] Privacy Policy screen implemented
- [x] Terms of Service screen implemented
- [x] GDPR consent system with user opt-in
- [x] Email usage disclosure
- [x] Legal section accessible from Profile
- [x] User rights (access, deletion, portability) explained

### ✅ Permissions
- [x] Camera permission with clear explanation
- [x] Only essential permissions requested
- [x] Permission explanations in multiple languages

### ✅ User Experience
- [x] Error handling without crashes
- [x] React Native errors suppressed in production
- [x] Responsive design for different screen sizes
- [x] Multi-language support (English, Spanish, and more)
- [x] Premium Pet Advisor text updated (no AI reference)
- [x] Reports generated in user's selected language

### ✅ App Configuration
- [x] App name: PetFood Scanner
- [x] Package identifiers configured
- [x] Version numbers set
- [x] Icons and splash screens configured
- [x] Camera permissions declared in manifests
- [x] EAS build configuration ready

## Building for Production

### Android (Google Play Store)

#### 1. Install EAS CLI
```bash
npm install -g eas-cli
```

#### 2. Login to Expo
```bash
eas login
```

#### 3. Configure Project
```bash
eas build:configure
```

#### 4. Build Android App Bundle
```bash
eas build --platform android --profile production
```

This creates an AAB file ready for Google Play Store submission.

#### 5. Download the Build
Once the build completes, download the `.aab` file from the EAS dashboard.

### iOS (Apple App Store)

#### 1. Build iOS App
```bash
eas build --platform ios --profile production
```

#### 2. Download the Build
Download the `.ipa` file from the EAS dashboard.

## Google Play Store Submission

### Prerequisites
- Google Play Developer Account ($25 one-time fee)
- App signing key (automatically managed by EAS)
- Store listing assets (screenshots, descriptions)

### Steps

1. **Create App in Play Console**
   - Go to Google Play Console
   - Click "Create app"
   - Fill in app details

2. **Upload AAB**
   - Go to "Release" > "Production"
   - Create new release
   - Upload the AAB file from EAS

3. **Store Listing**
   - Add app description
   - Upload screenshots (different screen sizes)
   - Add app icon
   - Select category: "Health & Fitness" or "Lifestyle"

4. **Content Rating**
   - Complete questionnaire
   - App is suitable for all ages

5. **Privacy Policy**
   - The app includes Privacy Policy accessible within the app
   - You may need to host it on a public URL for store requirements

6. **App Content**
   - Declare that app uses camera for barcode scanning
   - Confirm GDPR compliance

7. **Submit for Review**
   - Review and submit
   - Typically takes 1-3 days for review

## Apple App Store Submission

### Prerequisites
- Apple Developer Account ($99/year)
- App Store Connect access
- Store listing assets

### Steps

1. **Create App in App Store Connect**
   - Log in to App Store Connect
   - Click "My Apps" > "+"
   - Fill in app information

2. **Upload Build**
   - Use Transporter app or EAS Submit
   - Upload the `.ipa` file

3. **App Information**
   - Add app description
   - Upload screenshots (different device sizes)
   - Select category
   - Set age rating

4. **Privacy Information**
   - Declare data collection (email, pet info, scan history)
   - Link to Privacy Policy (must be publicly accessible URL)

5. **Submit for Review**
   - Add review notes if needed
   - Submit
   - Typically takes 1-3 days for review

## Store Listing Recommendations

### App Description (English)
```
PetFood Scanner helps you make informed decisions about your pet's nutrition. Simply scan any pet food barcode to get instant health analysis and recommendations.

Features:
• Barcode scanning for instant product analysis
• Health score based on nutritional content
• Ingredient warnings for harmful additives
• Better alternative suggestions
• Premium Pet Advisor with personalized recommendations
• Multi-language support
• Scan history and favorites

Premium Features:
• Personalized pet care recommendations
• Nutrition advice tailored to your pet
• Activity suggestions
• Cost optimization tips
• Veterinary care guidance

Your pet's health is important. Make better choices with PetFood Scanner.
```

### App Description (Spanish)
```
PetFood Scanner te ayuda a tomar decisiones informadas sobre la nutrición de tu mascota. Simplemente escanea cualquier código de barras de alimento para mascotas para obtener análisis de salud instantáneo y recomendaciones.

Características:
• Escaneo de códigos de barras para análisis instantáneo
• Puntuación de salud basada en contenido nutricional
• Advertencias sobre ingredientes dañinos
• Sugerencias de mejores alternativas
• Asesor Premium con recomendaciones personalizadas
• Soporte multiidioma
• Historial de escaneos y favoritos

Funciones Premium:
• Recomendaciones personalizadas de cuidado de mascotas
• Consejos de nutrición adaptados a tu mascota
• Sugerencias de actividades
• Consejos de optimización de costos
• Guía de cuidado veterinario

La salud de tu mascota es importante. Toma mejores decisiones con PetFood Scanner.
```

### Keywords
- pet food
- pet nutrition
- barcode scanner
- dog food
- cat food
- pet health
- nutrition analysis
- pet care

### Category Suggestions
- Primary: Health & Fitness
- Secondary: Lifestyle

### Age Rating
- All ages
- No mature content
- No violence
- No gambling

## Post-Publication

### Monitor Reviews
- Respond to user feedback
- Address bugs quickly
- Consider feature requests

### Update Process
1. Increment version in `app.json`
2. Increment `versionCode` (Android) and `buildNumber` (iOS)
3. Build new version with EAS
4. Submit update through respective stores

### Analytics & Monitoring
- Monitor crash reports
- Track user engagement
- Analyze premium conversion rates

## Privacy Policy Hosting

While the Privacy Policy is accessible within the app, both Google Play and Apple App Store require a publicly accessible URL. Options:

1. **GitHub Pages** (Free)
   - Create a simple HTML page
   - Host on GitHub Pages

2. **Your Website**
   - Host on your domain

3. **Legal Doc Services**
   - Use services like TermsFeed, PrivacyPolicies.com

## Support & Contact

Ensure you provide support contact information:
- Support email
- Website (if applicable)
- In-app feedback mechanism

## Compliance Notes

### GDPR Compliance ✓
- User consent system implemented
- Data access and deletion rights explained
- Privacy policy comprehensive
- User can withdraw consent

### Google Play Policies ✓
- Proper permission usage
- Clear permission explanations
- No deceptive behavior
- Appropriate content rating

### Apple Guidelines ✓
- Clear app purpose
- No private API usage
- Proper data handling
- Kids category compliance (if applicable)

## Monetization (Future Implementation)

The app is designed to support:
- **Free tier with ads** (not yet implemented)
- **Premium subscription** (implemented via Supabase)

To add advertising:
1. Choose ad provider (Google AdMob, Facebook Audience Network)
2. Integrate SDK
3. Implement ad placements
4. Update privacy policy with ad disclosure
5. Resubmit to stores

## Environment Variables for Production

Ensure your production environment has:
- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`

These should be configured in your build secrets (not in code).

## Final Notes

- Test thoroughly before each submission
- Keep app updated with security patches
- Monitor for policy changes from stores
- Maintain good communication with users
- Follow store guidelines strictly

Good luck with your app publication! 🚀
