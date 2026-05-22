import { Package, Coupon } from "../types";

export interface PricingResult {
  subtotal: number;
  productionsTotal: number;
  discountAmount: number;
  total: number;
  chargedItems: { name: string; price: number }[];
  appliedCouponCode: string | null;
  selectedProductions: string[];
}

export function calculatePricing(
  pkg: Package | null | undefined,
  optionIndex: number,
  prodParam: string | null | undefined,
  coupon: Coupon | null | undefined
): PricingResult {
  if (!pkg) {
    return {
      subtotal: 0,
      productionsTotal: 0,
      discountAmount: 0,
      total: 0,
      chargedItems: [],
      appliedCouponCode: null,
      selectedProductions: []
    };
  }

  // Validate option
  const validOptionIndex = optionIndex >= 0 && optionIndex < pkg.options.length ? optionIndex : 0;
  const option = pkg.options[validOptionIndex];
  
  let subtotal = Number(option?.price) || 0;
  if (isNaN(subtotal) || subtotal < 0) subtotal = 0;

  const chargedItems: { name: string; price: number }[] = [
    { name: `Pacote: ${option?.name || 'Padrão'}`, price: subtotal }
  ];

  let productionsTotal = 0;
  const validatedProductions: string[] = [];

  // Parse requested productions.
  // legacy "1" means they selected the legacy production.
  const requestedIds = prodParam ? prodParam.split(',').map(s => s.trim()).filter(Boolean) : [];

  // 1. Process new productions array if it exists
  if (pkg.productions && Array.isArray(pkg.productions)) {
    pkg.productions.forEach(prod => {
      if (prod.enabled && requestedIds.includes(prod.id)) {
        const prodPrice = Number(prod.price) || 0;
        if (!isNaN(prodPrice) && prodPrice >= 0) {
          productionsTotal += prodPrice;
          validatedProductions.push(prod.id);
          chargedItems.push({ name: `Produção: ${prod.name}`, price: prodPrice });
        }
      }
    });
  }

  // 2. Handle legacy production fallback
  // If the user requested '1' (or 'legacy') and the package only has legacy `hasProduction`
  if (
    pkg.hasProduction && 
    (requestedIds.includes('1') || requestedIds.includes('legacy')) &&
    (!pkg.productions || pkg.productions.length === 0)
  ) {
    const prodPrice = Number(pkg.productionPrice) || 0;
    if (!isNaN(prodPrice) && prodPrice >= 0) {
      productionsTotal += prodPrice;
      validatedProductions.push('legacy');
      chargedItems.push({ name: `Produção: ${pkg.productionDesc || 'Opcional'}`, price: prodPrice });
    }
  }

  const totalBeforeDiscount = subtotal + productionsTotal;
  let discountAmount = 0;
  let appliedCouponCode = null;

  if (coupon && coupon.active && coupon.value !== undefined) {
    const value = Number(coupon.value) || 0;
    if (!isNaN(value) && value > 0) {
      if (coupon.type === 'percentage') {
        discountAmount = totalBeforeDiscount * (value / 100);
      } else {
        discountAmount = value;
      }
      appliedCouponCode = coupon.code;
    }
  }

  // Ensure discount doesn't exceed total and total isn't negative
  discountAmount = Math.min(discountAmount, totalBeforeDiscount);
  if (isNaN(discountAmount) || discountAmount < 0) discountAmount = 0;

  let total = totalBeforeDiscount - discountAmount;
  if (isNaN(total) || total < 0) total = 0;

  return {
    subtotal,
    productionsTotal,
    discountAmount,
    total,
    chargedItems,
    appliedCouponCode,
    selectedProductions: validatedProductions
  };
}
