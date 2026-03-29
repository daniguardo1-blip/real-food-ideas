# Design System Documentation

## Overview

This app now features a modern, premium design system with consistent styling across all screens. The design follows industry best practices for health and wellness apps, with a clean, professional aesthetic.

## Design Philosophy

- **Minimalist & Clean**: Generous whitespace, clear hierarchy
- **Professional**: Premium feel with subtle shadows and smooth interactions
- **Accessible**: High contrast ratios, clear typography, large touch targets
- **Consistent**: Unified color palette, spacing, and component styles

## Color Palette

### Primary Colors
- **Primary**: `#6366F1` (Indigo) - Main brand color
- **Primary Dark**: `#4F46E5` - Hover/active states
- **Primary Light**: `#818CF8` - Backgrounds, accents

### Secondary Colors
- **Secondary**: `#10B981` (Green) - Success, positive actions
- **Accent**: `#F59E0B` (Amber) - Warnings, highlights

### Semantic Colors
- **Success**: `#10B981` (Green)
- **Error**: `#EF4444` (Red)
- **Warning**: `#F59E0B` (Amber)
- **Info**: `#3B82F6` (Blue)

### Neutral Colors
- **Background**: `#F8FAFC` (Light gray)
- **Surface**: `#FFFFFF` (White)
- **Surface Alt**: `#F1F5F9` (Light gray alternative)

### Text Colors
- **Primary**: `#0F172A` (Dark slate)
- **Secondary**: `#64748B` (Medium gray)
- **Tertiary**: `#94A3B8` (Light gray)
- **Inverse**: `#FFFFFF` (White on dark backgrounds)

### Border Colors
- **Light**: `#E2E8F0`
- **Medium**: `#CBD5E1`

## Typography

### Font Sizes & Weights
- **H1**: 32px, Bold (700)
- **H2**: 24px, Semi-bold (600)
- **H3**: 20px, Semi-bold (600)
- **Body**: 16px, Regular (400)
- **Body Small**: 14px, Regular (400)
- **Caption**: 12px, Regular (400)

### Line Heights
- **Headings**: 120-125% of font size
- **Body text**: 150% of font size

## Spacing System

Based on an 8px grid:
- **XS**: 4px
- **SM**: 8px
- **MD**: 16px
- **LG**: 24px
- **XL**: 32px
- **XXL**: 48px

## Border Radius

- **SM**: 8px
- **MD**: 12px
- **LG**: 16px
- **XL**: 20px
- **Full**: 9999px (circular)

## Shadows

### Small Shadow
```
shadowColor: '#000'
shadowOffset: { width: 0, height: 1 }
shadowOpacity: 0.05
shadowRadius: 2
elevation: 2
```

### Medium Shadow
```
shadowColor: '#000'
shadowOffset: { width: 0, height: 2 }
shadowOpacity: 0.08
shadowRadius: 4
elevation: 3
```

### Large Shadow
```
shadowColor: '#000'
shadowOffset: { width: 0, height: 4 }
shadowOpacity: 0.12
shadowRadius: 8
elevation: 5
```

## Reusable Components

### Card
A container component with background, padding, and shadow.

Variants:
- `default`: Small shadow
- `elevated`: Medium shadow
- `outlined`: Border instead of shadow

### Button
Interactive button with multiple variants and sizes.

Variants:
- `primary`: Primary color background
- `secondary`: Secondary color background
- `outline`: Transparent with border
- `ghost`: Transparent, no border

Sizes:
- `small`: Compact padding
- `medium`: Standard padding (default)
- `large`: Generous padding

### Input
Text input field with label and error handling.

Features:
- Label text
- Error message display
- Left/right icon support
- Consistent border styling

### EmptyState
Component for displaying empty states with icon, title, description, and optional action button.

### TouchableScale
Animated touchable component with scale feedback on press.

## Screen Layouts

### Header Pattern
All screens use a consistent header:
- 60px top padding
- Large title (32px, bold)
- Subtitle (16px, secondary color)
- Optional icon badge on right
- Subtle shadow

### Content Layout
- 24px horizontal padding
- Generous vertical spacing between sections
- Card-based grouping of related content
- Bottom padding to account for tab bar

### Navigation
- Bottom tab bar with 5 main sections
- 70px height with shadow
- Active state: Primary color
- Inactive state: Tertiary text color
- Icons: 24px with 2px stroke width

## Interactive Elements

### Touch Feedback
- `activeOpacity: 0.7` for basic touchables
- Scale animation (0.95) for cards and buttons
- Smooth transitions (spring animations)

### Loading States
- Centered ActivityIndicator
- Skeleton screens for data loading
- Loading text with secondary color

### Empty States
- Large icon (64px) in tertiary color
- Title text (20px, semi-bold)
- Description text (14px, secondary)
- Optional action button

## Best Practices

1. **Always use theme constants** instead of hardcoded values
2. **Maintain consistent spacing** using the 8px grid
3. **Use Card components** for grouping related content
4. **Apply proper shadows** for depth and hierarchy
5. **Ensure high contrast** for text readability
6. **Add touch feedback** to all interactive elements
7. **Handle empty states** gracefully
8. **Keep loading states** informative but subtle

## File Structure

```
lib/
  theme.ts                 # Design system constants

components/
  ui/
    Card.tsx              # Card container component
    Button.tsx            # Button component
    Input.tsx             # Text input component
    EmptyState.tsx        # Empty state component
    TouchableScale.tsx    # Animated touchable component

app/
  (tabs)/
    _layout.tsx           # Tab navigation with updated styles
    index.tsx             # Scanner screen (modern UI)
    servicios.tsx         # Services grid (card layout)
    history.tsx           # History list (card layout)
    profile.tsx           # Profile (updated styles)

  health-calendar/
    index.tsx             # Health calendar (modern UI)
```

## Usage Examples

### Using Theme Constants
```typescript
import { theme } from '@/lib/theme';

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.background,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
  },
  title: {
    ...theme.typography.h1,
    color: theme.colors.text.primary,
  },
});
```

### Using Card Component
```typescript
import { Card } from '@/components/ui/Card';

<Card variant="elevated" style={{ marginBottom: 16 }}>
  <Text>Card content</Text>
</Card>
```

### Using Button Component
```typescript
import { Button } from '@/components/ui/Button';

<Button
  title="Save"
  onPress={handleSave}
  variant="primary"
  size="large"
  loading={saving}
/>
```

## Migration Notes

All main screens have been updated to use the new design system:
- Scanner screen (index.tsx)
- Services screen (servicios.tsx)
- Health calendar
- History screen
- Profile screen (partial)

The tab navigation, AppHeader component, and all UI components now use the new theme constants for consistent styling across the app.
