export interface User {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: 'user' | 'admin';
  createdAt: Date;
  measurements?: Measurements;
  phone?: string;
  address?: Address;
}

export interface Address {
  street: string;
  city: string;
  province: string;
  postalCode: string;
  country: string;
}

export interface Measurements {
  bust?: number;
  shoulderWidth?: number;
  blouseWaist?: number;
  pantWaist?: number;
  hipCircumference?: number;
  neckRound?: number;
  sleeveLength?: number;
  armhole?: number;
  thighCircumference?: number;
  ankleOpening?: number;
  dressLength?: number;
  topLength?: number;
  bottomLength?: number;
  inseam?: number;
  outseam?: number;
  waistToFloor?: number;
  notes?: string;
}

export type Category =
  | 'girls-traditional'
  | 'girls-western'
  | 'women-traditional'
  | 'women-western'
  | 'bridal-wear';

export type Occasion = 'casual' | 'festive' | 'wedding' | 'party' | 'formal';

export type FabricType =
  | 'cotton'
  | 'silk'
  | 'satin'
  | 'chiffon'
  | 'velvet'
  | 'georgette'
  | 'organza'
  | 'linen'
  | 'crepe'
  | 'net'
  | 'brocade'
  | 'chanderi'
  | 'banarasi'
  | 'other';

export interface Design {
  id: string;
  name: string;
  category: Category;
  occasion: Occasion[];
  description: string;
  images: string[];
  fabrics: FabricType[];
  styleDetails: string[];
  basePrice: number;
  complexity: 'simple' | 'medium' | 'complex' | 'premium';
  productionTime: number; // days
  trending: boolean;
  featured: boolean;
  rating: number;
  reviewCount: number;
  tags: string[];
  colors: string[];
  createdAt: Date;
  updatedAt: Date;
  active: boolean;
}

export interface Review {
  id: string;
  designId: string;
  userId: string;
  userName: string;
  userPhoto?: string;
  rating: number;
  comment: string;
  createdAt: Date;
  approved: boolean;
}

export type OrderStatus =
  | 'pending'
  | 'design-approved'
  | 'design-rejected'
  | 'fabric-selection'
  | 'measurement-submitted'
  | 'price-confirmed'
  | 'in-production'
  | 'quality-check'
  | 'ready-for-delivery'
  | 'shipped'
  | 'delivered'
  | 'completed'
  | 'cancelled';

export type DeliveryMethod = 'home-delivery' | 'pickup';
export type FabricSource = 'self-provided' | 'nilkanth-sources';
export type SizeType = 'standard' | 'custom';
export type StandardSize = 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL' | 'XXXL';

export interface OrderItem {
  designId: string;
  designName: string;
  designImage: string;
  quantity: number;
  fabric: FabricType;
  fabricSource: FabricSource;
  sizeType: SizeType;
  standardSize?: StandardSize;
  measurements?: Measurements;
  specialInstructions?: string;
  basePrice: number;
  fabricCost: number;
  tailoringCost: number;
  totalItemPrice: number;
}

export interface Order {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  items: OrderItem[];
  status: OrderStatus;
  deliveryMethod: DeliveryMethod;
  deliveryAddress?: Address;
  deliveryCharge: number;
  subtotal: number;
  totalAmount: number;
  adminAdjustedPrice?: number;
  finalPrice?: number;
  estimatedDelivery: Date;
  notes?: string;
  adminNotes?: string;
  trackingNumber?: string;
  createdAt: Date;
  updatedAt: Date;
  isCustomDesign: boolean;
  customDesignRequestId?: string;
}

export interface CustomDesignRequest {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  designImages: string[];
  description: string;
  category: Category;
  occasion: Occasion;
  preferredFabric?: FabricType;
  budget?: number;
  status: 'pending' | 'approved' | 'rejected';
  adminNote?: string;
  estimatedPrice?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'order' | 'design' | 'general' | 'promo';
  read: boolean;
  createdAt: Date;
  link?: string;
}

export interface SiteSettings {
  heroTitle: string;
  heroSubtitle: string;
  heroBanners: string[];
  featuredDesignIds: string[];
  trendingDesignIds: string[];
  announcementBanner?: string;
  deliveryCharges: {
    local: number;
    provincial: number;
    national: number;
    international: number;
  };
  productionTimelines: {
    western: number;
    traditional: number;
    bridal: number;
  };
  pricingMultipliers: {
    simple: number;
    medium: number;
    complex: number;
    premium: number;
  };
  fabricPricing: Record<FabricType, number>;
  themeColor: string;
  accentColor: string;
}

export interface WishlistItem {
  designId: string;
  addedAt: Date;
}

export interface FilterOptions {
  category?: Category;
  occasions?: Occasion[];
  fabrics?: FabricType[];
  minPrice?: number;
  maxPrice?: number;
  trending?: boolean;
  search?: string;
  sortBy?: 'price-asc' | 'price-desc' | 'rating' | 'newest' | 'trending';
}
