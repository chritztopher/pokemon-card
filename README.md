# Pokemon Card - Pure JavaScript

A complete Pokemon card component with 3D tilt effects, holographic shine, and spring animations - converted from Svelte to pure JavaScript, CSS, and HTML.

## ✨ Features

- 🎮 **Interactive 3D Tilt** - Mouse/touch tilt effects with smooth animations
- 🌈 **Holographic Rainbow Shine** - Beautiful rainbow holographic effects with glitter
- 📱 **Device Orientation** - Gyroscope support for mobile tilt effects
- ⚡ **Spring Animations** - Physics-based smooth animations
- 🎯 **Click to Expand** - Click cards to expand with smooth scaling
- ⌨️ **Keyboard Accessible** - Full keyboard navigation support
- 🎨 **Multiple Card Types** - Support for all Pokemon types and rarities
- 📏 **Responsive Design** - Works perfectly on desktop and mobile

## 🚀 Quick Start

1. **Serve the files**: Use any HTTP server (Python, Node.js, Live Server, etc.)
2. **Open demo**: Visit `demo.html` for multiple card examples
3. **Custom card**: Visit `christopher-card.html` for the custom card

```bash
# Using Python
python3 -m http.server 8080

# Using Node.js
npx serve .

# Then visit: http://localhost:8080/demo.html
```

## 📁 Project Structure

```
pokemon-card/
├── 📄 demo.html              # Multiple cards demo
├── 📄 christopher-card.html  # Custom Christopher Giroux card
├── 📄 index.html            # Basic single card example
├── 📄 holo-test.html        # Holographic effects test
├── 📄 README.md             # This file
├── 📁 css/
│   ├── base.css             # Core card styles and animations
│   ├── cards.css            # Card variables and base setup
│   └── rainbow-holo.css     # Holographic rainbow effects
├── 📁 js/
│   ├── components/
│   │   └── PokemonCard.js   # Main card component class
│   ├── stores/
│   │   └── stores.js        # State management system
│   └── utils/
│       ├── math.js          # Math utility functions
│       └── spring.js        # Spring animation system
├── 📁 img/
│   ├── glitter.png          # Glitter sparkle texture
│   ├── grain.webp           # Film grain texture
│   └── illusion-mask.png    # Illusion masking effect
└── 📁 assets/
    └── cards/
        └── PokePoke.png     # Custom card image
```

## 🎮 Usage

### Basic Card

```html
<div id="my-card"></div>

<script type="module">
import { PokemonCard } from './js/components/PokemonCard.js';

const card = new PokemonCard(document.getElementById('my-card'), {
    name: "Pikachu",
    types: ["Lightning"],
    rarity: "Rare Rainbow",
    img: "https://images.pokemontcg.io/sv3pt5/141.png"
});
</script>
```

### Full Configuration

```javascript
const cardOptions = {
    id: "unique-card-id",           // Unique identifier
    name: "Pokemon Name",           // Card name
    number: "025",                  // Card number
    set: "base1",                   // Set identifier
    types: ["Lightning"],           // Type(s) - array or string
    subtypes: ["Basic"],            // Subtype(s)
    supertype: "Pokémon",          // Supertype
    rarity: "Rare Rainbow",         // Rarity level
    img: "image-url",              // Card image URL
    back: "back-image.jpg",        // Custom back image (optional)
    foil: "foil-overlay.png",      // Foil overlay (optional)
    mask: "mask-image.png",        // Masking image (optional)
    showcase: false                // Auto-animation on load
};

const card = new PokemonCard(container, cardOptions);
```

## 🎨 Card Types & Effects

The component supports all Pokemon card types with unique glow colors:

- ⚡ **Lightning** - Bright yellow glow
- 🔥 **Fire** - Orange-red glow
- 💧 **Water** - Blue glow
- 🌿 **Grass** - Green glow
- 🔮 **Psychic** - Purple glow
- 👊 **Fighting** - Brown glow
- 🌑 **Darkness** - Dark blue glow
- ⚙️ **Metal** - Gray glow
- 🐉 **Dragon** - Gold glow
- 🧚 **Fairy** - Pink glow

## 🌈 Holographic Effects

The holographic system includes:

1. **Rainbow Gradients** - Dynamic color-shifting backgrounds
2. **Glitter Sparkles** - Moving sparkle overlays
3. **Film Grain** - Subtle texture for authenticity
4. **Illusion Masking** - Advanced masking for special cards
5. **Dynamic Lighting** - Cursor-following light effects

## 📱 Mobile Features

- **Touch Events** - Full touch interaction support
- **Device Orientation** - Gyroscope tilt effects
- **Responsive Layout** - Adapts to different screen sizes
- **Performance Optimized** - Smooth on mobile browsers

## ⌨️ Accessibility

- **Keyboard Navigation** - Tab through cards, Enter to activate
- **Screen Reader Support** - Proper ARIA labels
- **Focus Management** - Clear focus indicators
- **Motion Preferences** - Respects reduced motion settings

## 🔧 Advanced Usage

### Multiple Cards
```javascript
// Cards automatically manage shared state
const card1 = new PokemonCard(container1, options1);
const card2 = new PokemonCard(container2, options2);
// Only one card can be active/expanded at a time
```

### State Management
```javascript
import { activeCard } from './js/stores/stores.js';

// Subscribe to active card changes
activeCard.subscribe(card => {
    console.log('Active card changed:', card?.options.name);
});
```

### Cleanup
```javascript
// Clean up when removing cards
card.destroy();
```

## 🎯 Demo Pages

1. **`demo.html`** - Multi-card showcase with Pikachu and Charizard
2. **`christopher-card.html`** - Custom card example with showcase animation
3. **`index.html`** - Basic single card implementation
4. **`holo-test.html`** - Holographic effects testing page

## 🚀 Performance

- **Hardware Accelerated** - Uses CSS transforms and will-change
- **Optimized Animations** - RequestAnimationFrame-based springs
- **Efficient Rendering** - Minimal reflows and repaints
- **Memory Management** - Proper cleanup and garbage collection

## 🛠️ Development

The component is built with vanilla JavaScript ES6+ modules:

- **No Dependencies** - Pure JavaScript, HTML, and CSS
- **Modern Standards** - ES6 modules, CSS custom properties
- **Type Friendly** - Easy to add TypeScript definitions
- **Framework Agnostic** - Works with any framework or none

## 🎉 Credits

Successfully converted from the original Svelte Pokemon card component while preserving 100% of the functionality and visual effects. The conversion includes:

- Complete spring animation system replacement
- Custom state management solution
- Device orientation handling
- All interactive effects and styling
- Full holographic effect system

Perfect for integration into any HTML/CSS/JavaScript project!