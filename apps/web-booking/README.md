# Beauty Platform - Modern Web Booking Interface

## 🎨 Design System

Современный дизайн вдохновленный Fresha с улучшениями:

- **Цветовая палитра**: Beauty purple (#b084ff) + Rose (#ff4d75)
- **Типографика**: Inter + Cal Sans для заголовков
- **Анимации**: Subtle micro-interactions и smooth transitions
- **Glassmorphism**: Современные эффекты стекла и размытия

## 🚀 Features

- ✅ **Modern Landing Page** - Fresha-inspired hero с градиентами
- ✅ **Interactive Booking Modal** - 3-step booking process
- ✅ **Embeddable Widget** - Floating booking widget для любых сайтов
- ✅ **Responsive Design** - Идеальная работа на всех устройствах
- ✅ **Beautiful Animations** - Smooth CSS transitions и keyframes
- ✅ **Glass Effects** - Современные backdrop-blur эффекты

## 🎯 Components

### Main Landing Page
- Hero section с анимированным фоном
- Features grid с hover effects
- Services showcase с emoji icons
- Tech stack presentation
- Fixed navigation с glass effect

### Booking Modal
- Multi-step процедура (Service → Date/Time → Details)
- Progress indicator
- Real-time validation
- Smooth transitions между шагами

### Embeddable Widget
- Floating position options (4 corners)
- Theme switching (light/dark)
- Custom color support
- Minimizable interface
- Trust indicators и social proof

## 🛠 Development

```bash
# Install dependencies
pnpm install

# Development server
pnpm dev

# Build for production
pnpm build

# Preview production build
pnpm preview
```

## 📦 Widget Integration

### Basic Usage
```html
<script src="https://designcorporation.github.io/beauty/dist/widget.js" 
        data-beauty-widget
        data-salon-slug="your-salon"
        data-theme="light"
        data-position="bottom-right"></script>
```

### Advanced Configuration
```javascript
window.BeautyWidget.init({
  salonSlug: 'demo-salon',
  theme: 'light', // 'light' | 'dark'
  position: 'bottom-right', // 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
  buttonText: 'Book Now',
  primaryColor: '#b084ff'
});
```

## 🎨 Tailwind Classes

### Custom Colors
- `beauty-*` - Primary purple palette
- `rose-*` - Secondary pink palette
- `gradient-beauty` - Main brand gradient

### Custom Components
- `btn-primary` - Primary gradient button
- `btn-secondary` - Secondary outlined button
- `card-hover` - Interactive card с hover effects
- `glass` - Glass morphism effect
- `text-gradient` - Gradient text effect

### Animations
- `animate-slide-up` - Slide up entrance
- `animate-scale-in` - Scale in entrance
- `animate-float` - Floating animation
- `animate-delay-*` - Staggered animation delays

## 🌐 Live Demo

- **Main Site**: https://designcorporation.github.io/beauty/
- **Widget Demo**: https://designcorporation.github.io/beauty/widget-demo.html
- **Widget Script**: https://designcorporation.github.io/beauty/dist/widget.js

## 📱 Responsive Breakpoints

- Mobile: 320px - 768px
- Tablet: 768px - 1024px  
- Desktop: 1024px+

## 🎭 Theme Variables

```css
:root {
  --beauty-primary: #b084ff;
  --beauty-secondary: #ff4d75;
  --beauty-gradient: linear-gradient(135deg, #b084ff 0%, #ff4d75 100%);
  --glass-bg: rgba(255, 255, 255, 0.8);
  --glass-border: rgba(255, 255, 255, 0.2);
}
```

## 📊 Performance

- Lighthouse Score: 90+ (mobile)
- First Contentful Paint: <1.5s
- Bundle Size: <150KB (gzipped)
- Widget Size: <50KB (gzipped)

## 🔧 Tech Stack

- **Framework**: React 18 + TypeScript
- **Styling**: Tailwind CSS + Custom components
- **Build**: Vite
- **Icons**: Lucide React
- **Animations**: CSS Keyframes + Transitions

## 🎨 Design Inspiration

Based on modern beauty platforms like:
- Fresha (primary inspiration)
- Calendly (booking flow)
- Stripe (clean UI patterns)
- Modern glassmorphism trends

## 📈 Future Enhancements

- [ ] Framer Motion для advanced animations
- [ ] React Query для API state management
- [ ] React Hook Form для enhanced forms
- [ ] Progressive Web App capabilities
- [ ] Advanced accessibility features
- [ ] Multi-theme support
- [ ] Real-time availability integration

---

Built with ❤️ by DesignCorporation