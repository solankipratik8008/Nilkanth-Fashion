import { FabricType, Design } from '@/types';

export const fabricPricing: Record<FabricType, number> = {
  cotton: 15,
  silk: 45,
  satin: 35,
  chiffon: 25,
  velvet: 55,
  georgette: 28,
  organza: 30,
  linen: 20,
  crepe: 22,
  net: 18,
  brocade: 60,
  chanderi: 40,
  banarasi: 70,
  other: 20,
};

export const complexityMultiplier: Record<string, number> = {
  simple: 1.0,
  medium: 1.5,
  complex: 2.0,
  premium: 3.0,
};

export const deliveryCharges = {
  local: 15,
  provincial: 25,
  national: 40,
  international: 80,
};

export const calculateEstimatedPrice = (
  design: Design,
  fabricType: FabricType,
  fabricSource: 'self-provided' | 'nilkanth-sources'
): number => {
  const tailoringBase = design.basePrice;
  const fabricCost = fabricSource === 'nilkanth-sources' ? fabricPricing[fabricType] * 5 : 0;
  const complexityFactor = complexityMultiplier[design.complexity] || 1;
  const total = tailoringBase * complexityFactor + fabricCost;
  return Math.round(total);
};

export const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: 'CAD',
  }).format(price);
};

export const getProductionTimeline = (category: string): string => {
  if (category === 'bridal-wear') return '3-5 weeks';
  if (category.includes('traditional')) return '1-2 weeks';
  return '1 week';
};
