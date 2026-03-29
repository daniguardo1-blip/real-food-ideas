# Google Places API Setup Guide

This guide will help you set up Google Places API (New) for the Shelters/Donations feature.

## Overview

The app now uses **Google Places API (New)** to fetch real, verified animal shelter data based on user location input. This replaces the previous mock data with actual shelter information from Google's database.

## Prerequisites

- A Google Cloud account
- Billing enabled on your Google Cloud project
- Places API (New) enabled

## Setup Steps

### 1. Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Note your project ID

### 2. Enable Places API (New)

1. In the Google Cloud Console, go to **APIs & Services** > **Library**
2. Search for "Places API (New)"
3. Click on it and click **Enable**

### 3. Enable Billing

1. Go to **Billing** in the Google Cloud Console
2. Link a billing account to your project
3. Note: Places API (New) requires billing to be enabled

### 4. Create an API Key

1. Go to **APIs & Services** > **Credentials**
2. Click **Create Credentials** > **API Key**
3. Copy the generated API key
4. (Optional but recommended) Click **Restrict Key** to add restrictions:
   - Under **API restrictions**, select "Restrict key"
   - Choose "Places API (New)"
   - Under **Application restrictions**, consider adding:
     - HTTP referrers (for web)
     - iOS/Android app restrictions (for mobile)

### 5. Add API Key to Your Project

1. Open the `.env` file in your project root
2. Add your API key:

```env
EXPO_PUBLIC_GOOGLE_PLACES_API_KEY=your_api_key_here
```

3. Save the file
4. Restart your development server

## API Usage and Costs

### Pricing

Google Places API (New) uses the following pricing (as of 2024):

- **Text Search (New)**: $32 per 1,000 requests
- **Place Details (New)**: $17 per 1,000 requests

Each shelter search makes:
- 3 Text Search requests (one per query variant)
- 0 Place Details requests (unless website info is missing)

### Free Tier

Google Cloud provides a **$200 free credit** per month for all users.

### Cost Optimization

The implementation includes several cost optimizations:
- Uses field masks to request only necessary data
- Limits results to 10 per query
- Deduplicates results across queries
- Filters irrelevant results before displaying

## How It Works

### Search Flow

1. User enters a location (e.g., "Las Rozas de Madrid")
2. The app sends 3 search queries to Google Places API:
   - Spanish: "protectora animales en [location]"
   - Spanish: "refugio animales en [location]"
   - Spanish: "adopción perros gatos en [location]"
3. Results are filtered to show only relevant animal shelters
4. Up to 8 verified shelters are displayed

### Filtering Logic

The app filters results to show only relevant shelters by:
- Checking place types (animal_shelter, veterinary_care)
- Analyzing place names for keywords:
  - protectora, refugio, adopción, rescue, shelter, animal
- Excluding non-shelter businesses:
  - Pet stores, hotels, grooming services (unless clearly shelters)

## Testing

### Test Locations

Try these locations to test the feature:
- "Las Rozas de Madrid"
- "Madrid"
- "Barcelona"
- "Valencia"

### Without API Key

If no API key is configured, the app will:
- Log a warning to the console
- Show the "No verified shelters found" message
- Continue to work without crashing

## Troubleshooting

### No Results Appearing

1. Check that your API key is correctly added to `.env`
2. Verify billing is enabled in Google Cloud Console
3. Check that Places API (New) is enabled
4. Look for errors in the console/logs

### API Key Restrictions

If you restricted your API key:
- For web: Add your domain to allowed HTTP referrers
- For mobile: Add your iOS Bundle ID or Android package name

### Quota Exceeded

If you exceed your quota:
- Check usage in Google Cloud Console
- Consider increasing your budget
- Optimize searches (already implemented)

## Support

For issues with:
- **Google Places API**: [Google Places API Documentation](https://developers.google.com/maps/documentation/places/web-service/op-overview)
- **Billing**: [Google Cloud Billing Support](https://cloud.google.com/billing/docs/how-to/get-support)
- **This Implementation**: Check the code in `/lib/googlePlacesService.ts`

## Privacy and Data Usage

- User location searches are sent to Google Places API
- Google's Privacy Policy applies to API usage
- No user data is stored by the app
- Results are displayed in real-time and not cached
