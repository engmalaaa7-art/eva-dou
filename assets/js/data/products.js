/**
 * Eva Dou - Product Data Catalog
 * 6 Signature Body Splash & Mist Products with Official English Slogans
 */

const EVA_DOU_PRODUCTS = [
  {
    id: "eva-splash-burberry-hai",
    name: "Burberry Hai",
    slug: "burberry-hai",
    category: "body-splash",
    categoryLabel: "Body Splash & Mist",
    badge: "Bestseller",
    slogan: "Elegance that accompanies your every step.",
    shortDescription: "Elegance that accompanies your every step.",
    fullDescription: "Burberry Hai embodies timeless British elegance and refined allure. Opening with luminous notes of sun-drenched orchard blossoms and sweet mandarin, it settles into a heart of white peony and lavender. The lingering finish envelops your skin in velvety amber, soft musk, and comforting vanilla cream.",
    fragranceNotes: {
      top: "Crisp Apple, Fresh Mandarin, Orchard Blossom",
      heart: "White Peony, Soft Lavender, Freesia",
      base: "Golden Amber, Sheer Musk, Vanilla Cream"
    },
    variants: [
      { size: "250 Ml", price: 150, isDefault: true }
    ],
    cardImage: "assets/images/products/burberry-hai/photo.jpg",
    modalImage: "assets/images/products/burberry-hai/about.jpg"
  },
  {
    id: "eva-splash-good-girl",
    name: "Good Girl",
    slug: "good-girl",
    category: "body-splash",
    categoryLabel: "Body Splash & Mist",
    badge: "Signature",
    slogan: "Unforgettable allure and effortless confidence.",
    shortDescription: "Unforgettable allure and effortless confidence.",
    fullDescription: "Good Girl is an intoxicating contrast of light and shadow, created for the modern woman who embraces her duality. Radiant tuberose and sambac jasmine bring bright femininity, while dark roasted tonka bean and rich cocoa add an irresistible, seductive depth.",
    fragranceNotes: {
      top: "Almond, Bergamot, Coffee Blossom",
      heart: "Sambac Jasmine, Tuberose, Crystal Orris",
      base: "Tonka Bean, Roasted Cocoa, Sandalwood, Vanilla"
    },
    variants: [
      { size: "250 Ml", price: 150, isDefault: true }
    ],
    cardImage: "assets/images/products/good-girl/photo.jpg",
    modalImage: "assets/images/products/good-girl/about.jpg"
  },
  {
    id: "eva-splash-scanda",
    name: "Scandal",
    slug: "scanda",
    category: "body-splash",
    categoryLabel: "Body Splash & Mist",
    badge: "Trending",
    slogan: "A scent that announces your presence effortlessly.",
    shortDescription: "A scent that announces your presence effortlessly.",
    fullDescription: "Scandal is bold, sensual, and undeniably captivating. It opens with refreshing blood orange and citrus nectar before yielding to a rich heart of wild gardenia and honey nectar. The base lingers warmly with patchouli and golden caramel notes.",
    fragranceNotes: {
      top: "Blood Orange, Mandarin Nectar",
      heart: "Golden Honey, Gardenia, Peach Blossom",
      base: "Patchouli, Warm Caramel, Beeswax"
    },
    variants: [
      { size: "250 Ml", price: 150, isDefault: true }
    ],
    cardImage: "assets/images/products/scanda/photo.jpg",
    modalImage: "assets/images/products/scanda/about.jpg"
  },
  {
    id: "eva-splash-so-sexy",
    name: "So Sexy",
    slug: "so-sexy",
    category: "body-splash",
    categoryLabel: "Body Splash & Mist",
    badge: "Sensual Choice",
    slogan: "Because true attraction begins with an irresistible scent.",
    shortDescription: "Because true attraction begins with an irresistible scent.",
    fullDescription: "So Sexy is designed to make heads turn. Infused with tropical passion fruit, sparkling nectarine, and delicate pink lotus, this mist wraps you in an enchanting aura of confidence and irresistible feminine glamour.",
    fragranceNotes: {
      top: "Purple Passion Fruit, Sparkling Nectarine",
      heart: "Pink Lotus, Blooming Rose Petals, Jasmine Mist",
      base: "Blonde Woods, Sheer Musk, Cashmere Amber"
    },
    variants: [
      { size: "250 Ml", price: 150, isDefault: true }
    ],
    cardImage: "assets/images/products/so-sexy/photo.jpg",
    modalImage: "assets/images/products/so-sexy/about.jpg"
  },
  {
    id: "eva-splash-strawberry",
    name: "Strawberry",
    slug: "strawberry",
    category: "body-splash",
    categoryLabel: "Body Splash & Mist",
    badge: "Sweet Delight",
    slogan: "Sweet strawberry freshness from the very first mist.",
    shortDescription: "Sweet strawberry freshness from the very first mist.",
    fullDescription: "Strawberry is a playful, mouth-watering celebration of sweet summer fruits. Vibrant wild strawberry accords intertwine with pink sugar and velvety whipped cream to deliver an addictive, uplifting scent that stays fresh all day.",
    fragranceNotes: {
      top: "Wild Strawberry, Red Raspberry Nectar",
      heart: "Pink Sugar Blossom, Cotton Candy Accord",
      base: "Whipped Vanilla Cream, Soft White Musk"
    },
    variants: [
      { size: "250 Ml", price: 150, isDefault: true }
    ],
    cardImage: "assets/images/products/strawberry/photo.jpg",
    modalImage: "assets/images/products/strawberry/about.jpg"
  },
  {
    id: "eva-splash-yara-candy",
    name: "Yara Candy",
    slug: "yara-candy",
    category: "body-splash",
    categoryLabel: "Body Splash & Mist",
    badge: "Hot Pick",
    slogan: "Femininity begins with a touch of sweet luxury.",
    shortDescription: "Femininity begins with a touch of sweet luxury.",
    fullDescription: "Yara Candy is an irresistible cloud of sweetness and oriental luxury. Succulent candied berries and creamy coconut milk melt into a soft heart of heliotrope and vanilla orchid, finished with a velvety cloud of powdered marshmallow.",
    fragranceNotes: {
      top: "Candied Berries, Coconut Milk, Fizzy Citrus",
      heart: "Heliotrope, Vanilla Orchid, Pink Peony",
      base: "Powdered Marshmallow, Sandalwood, Musk"
    },
    variants: [
      { size: "250 Ml", price: 150, isDefault: true }
    ],
    cardImage: "assets/images/products/yara-candy/photo.jpg",
    modalImage: "assets/images/products/yara-candy/about.jpg"
  }
];

if (typeof window !== 'undefined') {
  window.EVA_DOU_PRODUCTS = EVA_DOU_PRODUCTS;
}
