import type { Service } from "@/lib/types";

export const services: Service[] = [
  {
    id: "electrical",
    title: "Electrical",
    description:
      "Expert electricians for wiring, installations, repairs, and upgrades. From switches to complete rewiring.",
    icon: "Zap",
    slug: "electrical",
    subCategories: [
      {
        id: "breaker-repair",
        title: "Breaker Replacement Visit",
        description: "Inspection and replacement support for faulty MCB/breakers.",
        price: 399,
        duration: "45 min",
        rating: 4.8,
        reviews: 212,
        tag: "Repair Care"
      },
      {
        id: "fan-install",
        title: "Ceiling Fan Installation",
        description: "Complete installation and wiring of ceiling fans.",
        price: 800,
        duration: "60 min",
        rating: 4.9,
        reviews: 145,
      },
    ],
  },
  {
    id: "plumbing",
    title: "Plumbing",
    description:
      "Professional plumbers for leak fixes, pipe installations, water heater repairs, and bathroom fittings.",
    icon: "Droplets",
    slug: "plumbing",
    subCategories: [
      {
        id: "geyser-repair",
        title: "Plumbing & Geyser Repair Visits",
        description: "Trusted technicians for leaks, taps and water heaters.",
        price: 500,
        duration: "60 min",
        rating: 4.7,
        reviews: 320,
        tag: "Repair Care"
      },
      {
        id: "motor-install",
        title: "Water Motor Installation",
        description: "Installation and fixing of water pump motors.",
        price: 1200,
        duration: "90 min",
        rating: 4.6,
        reviews: 89,
      }
    ],
  },
  {
    id: "hvac",
    title: "AC & HVAC",
    description:
      "AC installation, servicing, gas refilling, and complete HVAC solutions for residential and commercial spaces.",
    icon: "Wind",
    slug: "hvac",
    subCategories: [
      {
        id: "ac-service",
        title: "AC Regular Service",
        description: "Complete cleaning and servicing of AC units for optimal cooling.",
        price: 1500,
        originalPrice: 2000,
        duration: "60 min",
        rating: 4.9,
        reviews: 512,
        tag: "ESSENTIAL"
      },
      {
        id: "ac-gas",
        title: "AC Gas Refill",
        description: "Refrigerant check and refill for split and window ACs.",
        price: 3500,
        duration: "45 min",
        rating: 4.8,
        reviews: 215,
      }
    ],
  },
  {
    id: "painting",
    title: "Painting",
    description:
      "Interior & exterior painting, wall textures, waterproofing coats, and premium finish painting services.",
    icon: "Paintbrush",
    slug: "painting",
  },
  {
    id: "cleaning",
    title: "Cleaning",
    description:
      "Deep cleaning, sanitization, sofa cleaning, carpet washing, and post-construction cleanup services.",
    icon: "Sparkles",
    slug: "cleaning",
    subCategories: [
      {
        id: "carpet-dry",
        title: "Carpet Dry Cleaning",
        description: "Deep cleaning for rugs and carpets with vacuuming, foam treatment and stain spotting.",
        price: 1200,
        originalPrice: 1600,
        duration: "60 min",
        rating: 4.75,
        reviews: 310,
        tag: "DUST CARE"
      },
      {
        id: "sofa-shampoo",
        title: "Sofa Shampoo Cleaning",
        description: "Fabric-safe shampoo and wet vacuum cleaning for sofa sets and cushions.",
        price: 3499,
        originalPrice: 4500,
        duration: "90 min",
        rating: 4.8,
        reviews: 522,
        tag: "FRESH LOOK"
      },
      {
        id: "water-tank",
        title: "Water Tank Cleaning",
        description: "Underground and overhead tank cleaning and disinfection.",
        price: 2500,
        duration: "120 min",
        rating: 4.9,
        reviews: 180,
        tag: "ESSENTIAL"
      }
    ],
  },
  {
    id: "carpentry",
    title: "Carpentry",
    description:
      "Custom furniture, cabinet making, door repairs, wood polishing, and complete woodwork solutions.",
    icon: "Hammer",
    slug: "carpentry",
  },
  {
    id: "home-automation",
    title: "Home Automation",
    description:
      "Smart home setup, automated lighting, voice-controlled systems, and IoT device installation.",
    icon: "Cpu",
    slug: "home-automation",
  },
  {
    id: "solar",
    title: "Solar",
    description:
      "Solar panel installation, inverter setup, battery systems, and net metering solutions for homes.",
    icon: "Sun",
    slug: "solar",
  },
  {
    id: "security",
    title: "Security",
    description:
      "CCTV cameras, alarm systems, access control, video doorbells, and complete security solutions.",
    icon: "Shield",
    slug: "security",
  },
  {
    id: "appliance-repair",
    title: "Appliance Repair",
    description:
      "Washing machine, refrigerator, microwave, oven, and all home appliance repair and maintenance.",
    icon: "Wrench",
    slug: "appliance-repair",
  },
  {
    id: "handyman",
    title: "Handyman",
    description:
      "General home repairs, furniture assembly, mounting, drilling, and miscellaneous fix-it tasks.",
    icon: "HardHat",
    slug: "handyman",
  },
  {
    id: "pest-control",
    title: "Pest Control",
    description:
      "Termite treatment, fumigation, rodent control, mosquito spraying, and complete pest management.",
    icon: "Bug",
    slug: "pest-control",
  },
  {
    id: "glass-work",
    title: "Glass Work",
    description:
      "Glass cutting, window installation, mirror fitting, glass door repairs, and tempered glass solutions.",
    icon: "GlassWater",
    slug: "glass-work",
  },
  {
    id: "aluminium-work",
    title: "Aluminium Work",
    description:
      "Aluminium windows, sliding doors, partitions, kitchen cabinets, and aluminium fabrication.",
    icon: "Frame",
    slug: "aluminium-work",
  },
  {
    id: "civil-work",
    title: "Civil Work",
    description:
      "Masonry, concrete work, structural repairs, flooring, and complete civil construction services.",
    icon: "Building",
    slug: "civil-work",
  },
  {
    id: "water-tank-cleaning",
    title: "Water Tank Cleaning",
    description:
      "Underground and overhead tank cleaning, disinfection, and water quality improvement services.",
    icon: "Container",
    slug: "water-tank-cleaning",
  },
  {
    id: "generator-repair",
    title: "Generator Repair",
    description:
      "Generator servicing, repair, installation, and maintenance for residential and commercial generators.",
    icon: "BatteryCharging",
    slug: "generator-repair",
  },
  {
    id: "cctv-installation",
    title: "CCTV Installation",
    description:
      "Professional CCTV camera installation, DVR/NVR setup, remote viewing, and surveillance solutions.",
    icon: "Camera",
    slug: "cctv-installation",
  },
  {
    id: "internet-networking",
    title: "Internet & Networking",
    description:
      "WiFi setup, network cabling, router configuration, LAN installation, and connectivity solutions.",
    icon: "Wifi",
    slug: "internet-networking",
  },
  {
    id: "furniture-assembly",
    title: "Furniture Assembly",
    description:
      "Assembly of flat-pack furniture, office desks, beds, wardrobes, and modular kitchen cabinets.",
    icon: "Armchair",
    slug: "furniture-assembly",
  },
  {
    id: "interior-design",
    title: "Interior Design",
    description:
      "Complete interior design, space planning, color consultation, and home renovation design services.",
    icon: "Palette",
    slug: "interior-design",
  },
  {
    id: "garden-services",
    title: "Garden Services",
    description:
      "Lawn care, landscaping, tree pruning, garden maintenance, and outdoor beautification services.",
    icon: "Flower2",
    slug: "garden-services",
  },
  {
    id: "tile-installation",
    title: "Tile Installation",
    description:
      "Floor tiles, wall tiles, bathroom tiling, kitchen backsplash, and all types of tile work.",
    icon: "LayoutGrid",
    slug: "tile-installation",
  },
  {
    id: "roof-waterproofing",
    title: "Roof Waterproofing",
    description:
      "Roof coating, waterproofing treatment, leak sealing, and heat-proofing solutions for all roof types.",
    icon: "Umbrella",
    slug: "roof-waterproofing",
  },
];
