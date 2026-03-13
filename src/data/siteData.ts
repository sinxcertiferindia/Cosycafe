import heroImg from "@/assets/hero-jodhpur.jpg";
import guesthouseImg from "@/assets/guesthouse-exterior.jpg";
import rooftopDiningImg from "@/assets/rooftop-dining.jpg";
import blueCityViewImg from "@/assets/blue-city-view.jpg";
import culturalEveningImg from "@/assets/cultural-evening.jpg";
import roomNeelaMahalImg from "@/assets/room-neela-mahal.jpg";
import sunsetFortImg from "@/assets/sunset-fort.jpg";
import foodRajasthaniImg from "@/assets/food-rajasthani.jpg";
import blueAlleyImg from "@/assets/blue-alley.jpg";
import diningCandlelightImg from "@/assets/dining-candlelight.jpg";
import guestMomentImg from "@/assets/guest-moment.jpg";

export const siteConfig = {
  name: "The Cosy Guest House",
  tagline: "Experience Jodhpur From The Heart of Blue City",
  description: "A cozy heritage guest house offering rooftop dining, beautiful rooms and unforgettable views of Mehrangarh Fort.",
  phone: "+91 98765 43210",
  email: "info@castleviewjodhpur.com",
  whatsapp: "+919876543210",
  instagram: "https://instagram.com/castleviewjodhpur",
  address: {
    line1: "27, Brahampuri, Chune ki Chowk",
    line2: "Navchokiya",
    city: "Jodhpur, Rajasthan 342001",
  },
};

export const navLinks = [
  { label: "Experiences", href: "#experiences" },
  { label: "Stay", href: "#stay" },
  { label: "Dining", href: "#dining" },
  { label: "Travel Stories", href: "#travel-stories" },
  { label: "About Us", href: "#our-story" },
  { label: "Contact Us", href: "#footer" },
];

export const heroData = {
  image: heroImg,
  headline: "Experience Jodhpur From The Heart of Blue City",
  subtext: "A cozy heritage guest house offering rooftop dining, beautiful rooms and unforgettable views of Mehrangarh Fort.",
};

export const storyData = {
  image: guesthouseImg,
  title: "Our Story",
  subtitle: "A Legacy of Hospitality",
  paragraphs: [
    "Nestled in the ancient lanes of Brahampuri, Castle View Guest House is a family-run heritage property that has been welcoming travelers for over 40 years.",
    "Founded by our grandfather, this haveli was transformed into a guest house with one simple vision — to offer every guest the warmth of a Rajasthani home with the charm of the Blue City at their doorstep.",
    "Today, we continue that tradition, blending authentic hospitality with modern comforts, while our rooftop offers one of the most breathtaking views of Mehrangarh Fort and the sprawling blue cityscape below.",
  ],
};

export const experiencesData = [
  {
    id: "rooftop-dining",
    title: "Rooftop Dining",
    description: "Savor authentic Rajasthani cuisine under the open sky with panoramic views of Mehrangarh Fort.",
    image: rooftopDiningImg,
  },
  {
    id: "blue-city-views",
    title: "Blue City Views",
    description: "Wake up to the mesmerizing blue-washed houses stretching across the ancient cityscape.",
    image: blueCityViewImg,
  },
  {
    id: "cultural-evenings",
    title: "Cultural Evenings",
    description: "Immerse yourself in traditional Rajasthani music and folk performances in our heritage courtyard.",
    image: culturalEveningImg,
  },
];

export const roomData = {
  name: "Neela Mahal",
  tagline: "Where Blue City Dreams Come Alive",
  description: "Inspired by the iconic blue-washed homes of Jodhpur, Neela Mahal is our signature room that captures the essence of the Blue City. Every detail — from hand-painted walls to traditional jharokha windows — tells a story of Rajasthani artistry.",
  images: [roomNeelaMahalImg, blueCityViewImg, rooftopDiningImg],
  features: [
    "Inspired by Blue City architecture",
    "Fully blue themed interiors",
    "Comfortable queen-size bed",
    "Air conditioned rooms",
    "Attached bathroom",
    "Free WiFi",
    "Hot and cold water",
    "Rooftop or city view",
  ],
};

export const diningData = {
  title: "Rooftop Restaurant",
  subtitle: "Dine With The Fort In Sight",
  description: "Our rooftop restaurant is more than just a place to eat — it's an experience. With uninterrupted views of Mehrangarh Fort and the Blue City, every meal becomes a memory.",
  highlights: [
    "Rooftop seating with uninterrupted Blue City views",
    "Sunset dining tables",
    "Authentic Rajasthani cuisine",
    "North Indian and Continental dishes",
    "Perfect for couples and families",
    "Candlelight dinners",
  ],
  images: [diningCandlelightImg, rooftopDiningImg, foodRajasthaniImg],
};

export const facilitiesData = [
  { icon: "Wifi", label: "Free WiFi" },
  { icon: "Snowflake", label: "AC Rooms" },
  { icon: "UtensilsCrossed", label: "Rooftop Dining" },
  { icon: "Leaf", label: "Healthy Environment" },
  { icon: "Heart", label: "Cozy Ambience" },
  { icon: "Castle", label: "Fort View Rooms" },
  { icon: "Compass", label: "Travel Assistance" },
  { icon: "Droplets", label: "Hot Water" },
];

export const galleryData = [
  { src: roomNeelaMahalImg, alt: "Neela Mahal Room" },
  { src: foodRajasthaniImg, alt: "Rajasthani Thali" },
  { src: rooftopDiningImg, alt: "Rooftop Dining" },
  { src: blueCityViewImg, alt: "Blue City Panorama" },
  { src: guestMomentImg, alt: "Happy Guests" },
  { src: sunsetFortImg, alt: "Sunset at Mehrangarh Fort" },
  { src: blueAlleyImg, alt: "Blue City Alley" },
  { src: diningCandlelightImg, alt: "Candlelight Dinner" },
];

export const travelStoriesData = [
  {
    id: "exploring-blue-city",
    title: "Exploring the Blue City",
    excerpt: "Wander through the ancient indigo lanes of Brahampuri and discover why Jodhpur earned its famous name.",
    image: blueAlleyImg,
  },
  {
    id: "sunset-mehrangarh",
    title: "Sunset at Mehrangarh Fort",
    excerpt: "There's nothing quite like watching the sun dip behind the mighty Mehrangarh as the city turns golden.",
    image: sunsetFortImg,
  },
  {
    id: "best-rooftop-dining",
    title: "Best Rooftop Dining in Jodhpur",
    excerpt: "A guide to the most unforgettable rooftop dining experiences in the Blue City of Rajasthan.",
    image: rooftopDiningImg,
  },
];
