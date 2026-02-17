# 🎬 Animation Guide

## Overview
This document describes all animations implemented in the Direct Access for Farmers frontend application. Animations are designed to be **smooth, performant, and user-friendly** while maintaining accessibility.

---

## 🎨 Animation Categories

### 1. **Page & Route Transitions**
- **Fade In/Out**: Smooth page transitions when navigating
- **Slide Up**: Content appears from bottom
- **Scale In**: Content scales up from center

### 2. **Scroll-Triggered Animations**
- **AnimateOnScroll**: Components animate when entering viewport
- **Stagger Animations**: Sequential animations for lists/grids
- **Threshold Control**: Animations trigger at customizable scroll positions

### 3. **Micro-Interactions**
- **Hover Effects**: Cards, buttons, and interactive elements
- **Click Feedback**: Button press animations
- **Loading States**: Skeleton loaders with shimmer effect

### 4. **Component Animations**
- **Product Cards**: Hover scale, image zoom, badge entrance
- **Stat Cards**: Icon rotation, value scaling
- **Category Pills**: Scale on selection
- **Buttons**: Hover scale, pulse effects

---

## 📦 Animation Components

### `AnimateOnScroll`
Animates children when they enter the viewport.

```tsx
import { AnimateOnScroll } from '@/components/animations';

<AnimateOnScroll animation="slide-up" delay={0.2}>
  <YourComponent />
</AnimateOnScroll>
```

**Props:**
- `animation`: 'fade-in' | 'slide-up' | 'slide-in-right' | 'slide-in-left' | 'scale-in' | 'zoom-in'
- `delay`: Number (seconds) - Delay before animation starts
- `duration`: Number (seconds) - Animation duration
- `threshold`: Number (0-1) - Viewport intersection threshold
- `once`: Boolean - Animate only once (default: true)

---

### `StaggerContainer`
Applies staggered animations to multiple children.

```tsx
import { StaggerContainer } from '@/components/animations';

<StaggerContainer staggerDelay={0.1} animation="slide-up">
  {items.map(item => <Item key={item.id} />)}
</StaggerContainer>
```

**Props:**
- `staggerDelay`: Number (seconds) - Delay between each child
- `animation`: 'fade-in' | 'slide-up' | 'slide-in-right' | 'scale-in'
- `className`: String - Additional CSS classes

---

### `PageTransition`
Provides smooth transitions between routes (optional, can be added to App.tsx).

```tsx
import { PageTransition } from '@/components/animations';

<PageTransition>
  <Routes>...</Routes>
</PageTransition>
```

---

## 🎭 Available Animations (Tailwind Classes)

### Entrance Animations
- `animate-fade-in` - Fade in from transparent
- `animate-slide-up` - Slide up from bottom
- `animate-slide-down` - Slide down from top
- `animate-slide-in-right` - Slide in from right
- `animate-slide-in-left` - Slide in from left
- `animate-scale-in` - Scale up from 95% to 100%
- `animate-zoom-in` - Zoom in from 80% to 100%
- `animate-bounce-in` - Bounce entrance effect

### Exit Animations
- `animate-fade-out` - Fade out to transparent
- `animate-scale-out` - Scale down from 100% to 95%
- `animate-zoom-out` - Zoom out from 100% to 80%

### Continuous Animations
- `animate-float` - Gentle floating motion (3s)
- `animate-float-slow` - Slower floating motion (4s)
- `animate-pulse-slow` - Slow pulsing opacity (3s)
- `animate-spin-slow` - Slow rotation (3s)
- `animate-shimmer` - Shimmer loading effect (2s)
- `animate-heartbeat` - Heartbeat pulse effect
- `animate-wiggle` - Subtle wiggle motion
- `animate-shake` - Shake animation

### Utility Animations
- `animate-slide-fade` - Combined slide and fade
- `transition-all duration-300` - Smooth transitions
- `hover:scale-105` - Hover scale effect

---

## 🎯 Implementation Examples

### Product Cards
```tsx
// Enhanced hover effects
<div className="card-product group animate-fade-in hover:scale-[1.02] transition-all duration-300">
  <img className="group-hover:scale-110 transition-transform duration-700" />
</div>
```

### Stat Cards
```tsx
<div className="stat-card animate-slide-up hover:scale-[1.02] group">
  <Icon className="group-hover:scale-110 group-hover:rotate-3" />
</div>
```

### Category Pills
```tsx
<button className="hover:scale-105 transition-all duration-300">
  {/* Active state with scale */}
</button>
```

### Marketplace Grid
```tsx
<StaggerContainer staggerDelay={0.05} animation="slide-up">
  {products.map(product => <ProductCard key={product.id} />)}
</StaggerContainer>
```

---

## 📍 Where Animations Are Used

### Landing Page (`src/pages/Landing.tsx`)
- ✅ Hero section: Fade-in, slide-up
- ✅ Stats section: Staggered slide-up
- ✅ Features: Scroll-triggered fade-in with stagger
- ✅ How It Works: Staggered scale-in
- ✅ Featured Products: Staggered slide-up
- ✅ Testimonials: Staggered slide-up
- ✅ CTA Section: Zoom-in animation

### Marketplace (`src/pages/Marketplace.tsx`)
- ✅ Category pills: Slide-in-right with stagger
- ✅ Product grid: Staggered slide-up
- ✅ Empty state: Bounce-in icon
- ✅ Filter panel: Slide-up

### Product Cards (`src/components/product/ProductCard.tsx`)
- ✅ Card hover: Scale effect
- ✅ Image hover: Zoom effect (110%)
- ✅ Badges: Bounce-in with delay
- ✅ Overall: Fade-in entrance

### Dashboard Stat Cards (`src/components/dashboard/StatCard.tsx`)
- ✅ Card hover: Scale and shadow
- ✅ Icon hover: Scale and rotate
- ✅ Value hover: Scale effect
- ✅ Trend: Slide-fade animation

---

## ⚡ Performance Considerations

### Best Practices
1. **Use CSS animations** over JavaScript when possible
2. **Limit simultaneous animations** - Use stagger delays
3. **Respect prefers-reduced-motion** (can be added)
4. **Use transform/opacity** - GPU accelerated
5. **Avoid animating layout properties** (width, height, margin)

### Performance Optimizations
- ✅ All animations use `transform` and `opacity` (GPU accelerated)
- ✅ Stagger delays prevent layout thrashing
- ✅ Intersection Observer for scroll animations (efficient)
- ✅ `once` prop prevents re-animations on scroll

---

## 🎨 Animation Timing

### Standard Durations
- **Fast**: 0.2s - Button clicks, quick feedback
- **Medium**: 0.3-0.5s - Card hovers, transitions
- **Slow**: 0.7-1s - Image zooms, complex animations

### Easing Functions
- `ease-out` - Most common (natural deceleration)
- `ease-in-out` - Smooth start and end
- `linear` - Constant speed (shimmer, spin)

---

## 🔧 Customization

### Adding New Animations

1. **Add keyframes to `tailwind.config.ts`**:
```typescript
keyframes: {
  "your-animation": {
    "0%": { /* start state */ },
    "100%": { /* end state */ },
  },
},
```

2. **Add animation class**:
```typescript
animation: {
  "your-animation": "your-animation 0.5s ease-out",
},
```

3. **Use in components**:
```tsx
<div className="animate-your-animation">Content</div>
```

---

## 📱 Mobile Considerations

- ✅ All animations are **mobile-friendly**
- ✅ Touch interactions trigger hover states
- ✅ Reduced motion on smaller screens (can be enhanced)
- ✅ Performance optimized for low-end devices

---

## ♿ Accessibility

### Current Implementation
- ✅ Animations don't interfere with functionality
- ✅ No auto-playing animations
- ✅ User-triggered only

### Future Enhancements (Optional)
- Add `prefers-reduced-motion` media query support
- Disable animations for users who prefer reduced motion
- Ensure animations don't cause motion sickness

---

## 🎓 Animation Principles Applied

1. **Purposeful**: Every animation serves a purpose
2. **Subtle**: Not distracting from content
3. **Consistent**: Similar elements animate similarly
4. **Fast**: Quick enough to feel responsive
5. **Smooth**: No janky or stuttering animations

---

## 📊 Animation Summary

| Component | Animation Type | Duration | Trigger |
|-----------|---------------|----------|---------|
| Product Cards | Fade-in, Hover Scale | 0.3s | Mount, Hover |
| Stat Cards | Slide-up, Hover | 0.3s | Mount, Hover |
| Category Pills | Slide-in-right | 0.3s | Mount |
| Marketplace Grid | Staggered Slide-up | 0.5s | Mount |
| Landing Sections | Scroll-triggered | 0.5s | Scroll |
| Buttons | Hover Scale | 0.3s | Hover |
| Images | Zoom on Hover | 0.7s | Hover |

---

## 🚀 Quick Start

To use animations in your components:

1. **Import animation components**:
```tsx
import { AnimateOnScroll, StaggerContainer } from '@/components/animations';
```

2. **Wrap with animation**:
```tsx
<AnimateOnScroll animation="slide-up">
  <YourComponent />
</AnimateOnScroll>
```

3. **Or use Tailwind classes directly**:
```tsx
<div className="animate-fade-in hover:scale-105 transition-all">
  Content
</div>
```

---

## 📝 Notes

- All animations are **production-ready**
- Animations enhance UX without being distracting
- Performance optimized for mobile devices
- Easy to customize and extend

---

**Happy Animating! 🎉**





