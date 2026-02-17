# 🎬 Where to See Animations - Quick Guide

## 🚀 Quick Start
1. **Start the dev server**: `npm run dev`
2. **Open**: `http://localhost:8080`
3. **Follow the guide below** to see each animation

---

## 📍 Animation Locations

### 1. **Landing Page** (`/`)
**Best place to see most animations!**

#### Hero Section (Top of page)
- ✅ **Fade-in animation** - Title and description appear smoothly
- ✅ **Slide-up animation** - Buttons slide up with delay
- ✅ **Floating emoji** - "🌾" badge has gentle float animation

**How to see:**
- Refresh the page or navigate to `/`
- Watch the hero content fade and slide in

---

#### Stats Section (Scroll down a bit)
- ✅ **Staggered slide-up** - Each stat card appears one after another
- ✅ **Hover scale** - Hover over any stat card to see it scale up
- ✅ **Floating emojis** - Emojis have slow float animation

**How to see:**
- Scroll down from hero section
- Watch 4 stat cards animate in sequence (0.1s delay between each)
- Hover over any card to see scale effect

---

#### Features Section (Keep scrolling)
- ✅ **Scroll-triggered fade-in** - Section fades in when you scroll to it
- ✅ **Staggered slide-up** - 4 feature cards appear one by one
- ✅ **Hover effects** - Cards scale and icons rotate on hover

**How to see:**
- Scroll to "Why Choose Us?" section
- Watch section fade in, then cards slide up in sequence
- Hover over any feature card to see:
  - Card scales up (1.05x)
  - Icon scales and rotates slightly

---

#### How It Works Section
- ✅ **Scroll-triggered fade-in**
- ✅ **Staggered scale-in** - Steps appear with scale effect
- ✅ **Hover effects** - Icons rotate and scale
- ✅ **Floating icons** - Step icons have gentle float

**How to see:**
- Scroll to "How It Works" section
- Watch 3 steps animate in sequence (0.15s delay)
- Hover over each step to see icon animations

---

#### Featured Products Section
- ✅ **Scroll-triggered fade-in**
- ✅ **Staggered slide-up** - Product cards appear one by one
- ✅ **Product card animations** (see Product Cards section below)

**How to see:**
- Scroll to "Fresh From Farms" section
- Watch 3 product cards slide up in sequence
- Hover over cards for zoom effects

---

#### Testimonials Section
- ✅ **Scroll-triggered fade-in**
- ✅ **Staggered slide-up** - Testimonial cards appear sequentially
- ✅ **Hover scale** - Cards scale up on hover

**How to see:**
- Scroll to "What Farmers Say" section
- Watch 3 testimonial cards animate in
- Hover over cards to see scale effect

---

#### CTA Section (Bottom)
- ✅ **Zoom-in animation** - Entire section zooms in
- ✅ **Pulse button** - "Get Started" button has slow pulse

**How to see:**
- Scroll to bottom of landing page
- Watch section zoom in
- See button pulsing gently

---

### 2. **Marketplace Page** (`/marketplace`)
**Great for product card animations!**

#### Category Pills (Top)
- ✅ **Slide-in-right** - Pills slide in from right with stagger
- ✅ **Scale on selection** - Selected category scales up (1.05x)
- ✅ **Hover scale** - All pills scale on hover

**How to see:**
- Navigate to `/marketplace`
- Watch category pills slide in one by one
- Click different categories to see scale effect
- Hover over any pill to see scale

---

#### Product Grid
- ✅ **Staggered slide-up** - Products appear one after another (0.05s delay)
- ✅ **Fade-in** - Each card fades in
- ✅ **Hover effects** - See Product Cards section

**How to see:**
- Scroll down to product grid
- Watch products animate in sequence (very fast stagger)
- Hover over any product card

---

#### Empty State
- ✅ **Bounce-in** - Search emoji bounces in
- ✅ **Fade-in** - Text fades in

**How to see:**
- Search for something that doesn't exist (e.g., "xyz123")
- Watch the empty state animate

---

### 3. **Product Cards** (Everywhere products are shown)
**Best hover animations!**

#### On Product Cards:
- ✅ **Fade-in on mount** - Cards fade in when loaded
- ✅ **Hover scale** - Card scales to 1.02x on hover
- ✅ **Image zoom** - Product image zooms to 110% on hover (0.7s)
- ✅ **Badge bounce-in** - "Organic" and "Negotiable" badges bounce in with delay
- ✅ **Shadow increase** - Shadow becomes more prominent on hover

**How to see:**
- Go to `/marketplace` or landing page
- Hover over any product card
- Watch:
  - Card slightly scales up
  - Image zooms in smoothly
  - Shadow becomes more prominent

---

### 4. **Dashboard Stat Cards** (Farmer/Buyer/Admin Dashboards)
**Smooth card animations!**

#### Stat Cards:
- ✅ **Slide-up on mount** - Cards slide up when dashboard loads
- ✅ **Hover scale** - Card scales to 1.02x
- ✅ **Icon rotation** - Icon rotates 3° and scales on hover
- ✅ **Value scale** - Number scales up slightly on hover
- ✅ **Shadow increase** - Shadow becomes more prominent

**How to see:**
- Login as Farmer/Buyer/Admin
- Go to dashboard (`/farmer/dashboard`, `/buyer/dashboard`, or `/admin/dashboard`)
- Watch stat cards slide up
- Hover over any stat card to see:
  - Card scales up
  - Icon rotates and scales
  - Value number scales up
  - Shadow increases

---

### 5. **Buttons** (Throughout the app)
**Subtle but effective!**

#### Button Animations:
- ✅ **Hover scale** - Buttons scale to 1.05x on hover
- ✅ **Smooth transitions** - All transitions are 300ms
- ✅ **CTA pulse** - Landing page CTA button has slow pulse

**How to see:**
- Hover over any button in the app
- See smooth scale effect
- Check landing page CTA button for pulse

---

## 🎯 Best Places to See Animations

### **#1 Recommendation: Landing Page**
Navigate to `/` and slowly scroll down. You'll see:
- Hero fade-in
- Stats stagger
- Features scroll-triggered
- Products stagger
- Testimonials stagger
- CTA zoom-in

### **#2 Recommendation: Marketplace**
Navigate to `/marketplace` and:
- Watch category pills slide in
- See product grid stagger
- Hover over product cards

### **#3 Recommendation: Dashboard**
Login and go to dashboard:
- Watch stat cards slide up
- Hover over stat cards

---

## 🖱️ How to Trigger Animations

### Scroll Animations
- **Just scroll!** - Scroll down any page to trigger scroll-based animations
- **Refresh page** - Refresh to see entrance animations again

### Hover Animations
- **Hover over cards** - Product cards, stat cards, feature cards
- **Hover over buttons** - Any button in the app
- **Hover over images** - Product images zoom in

### Click Animations
- **Click category pills** - See scale effect on selection
- **Click buttons** - See smooth transitions

---

## 📱 Mobile Testing

All animations work on mobile too!
- **Touch to hover** - Touch elements to trigger hover animations
- **Scroll** - Scroll animations work the same way
- **Performance** - Optimized for mobile devices

---

## 🔄 To See Animations Again

1. **Refresh the page** - Entrance animations replay
2. **Navigate away and back** - Route changes trigger animations
3. **Scroll up and down** - Scroll-triggered animations replay (if `once={false}`)

---

## 🎬 Animation Checklist

Use this checklist to see all animations:

- [ ] Landing page hero fade-in
- [ ] Stats staggered slide-up
- [ ] Features scroll-triggered fade-in
- [ ] How It Works staggered scale-in
- [ ] Featured products stagger
- [ ] Testimonials stagger
- [ ] CTA zoom-in
- [ ] Marketplace category pills slide-in
- [ ] Product grid stagger
- [ ] Product card hover (scale + image zoom)
- [ ] Stat card hover (scale + icon rotate)
- [ ] Button hover scale
- [ ] Empty state bounce-in

---

## 💡 Pro Tips

1. **Slow scroll** - Scroll slowly to see animations better
2. **Hover slowly** - Move mouse slowly over elements
3. **Open DevTools** - Use browser DevTools to slow down animations (if needed)
4. **Mobile view** - Test on mobile or responsive mode
5. **Different browsers** - Test in Chrome, Firefox, Safari

---

## 🐛 If Animations Don't Show

1. **Check console** - Look for any errors
2. **Hard refresh** - Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
3. **Clear cache** - Clear browser cache
4. **Check Tailwind** - Ensure Tailwind is compiling correctly

---

**Happy Animating! 🎉**





