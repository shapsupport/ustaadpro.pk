export type RewardCalculation = {
  enabled: boolean;
  pointValue: number;
  minimumRedeem: number;
  points: number;
  balanceValue: number;
  maxDiscount: number;
  redeemablePoints: number;
  redeemableValue: number;
  canRedeem: boolean;
  pointsNeeded: number;
};

export function calculateRewards({ enabled, points, pointValue, minimumRedeem, subtotal, maxDiscountPercent }: {
  enabled: boolean;
  points: number;
  pointValue: number;
  minimumRedeem: number;
  subtotal: number;
  maxDiscountPercent: number;
}): RewardCalculation {
  const safePointValue = Math.max(1, Number(pointValue || 25));
  const safeMinimum = Math.max(0, Number(minimumRedeem || 0));
  const safePoints = Math.max(0, Number(points || 0));
  const balanceValue = safePoints * safePointValue;
  const maxDiscount = Math.floor((Math.max(0, Number(subtotal || 0)) * Math.max(0, Number(maxDiscountPercent || 0))) / 100);
  const redeemablePoints = Math.floor(Math.min(balanceValue, maxDiscount) / safePointValue);
  const redeemableValue = redeemablePoints * safePointValue;
  return {
    enabled,
    pointValue: safePointValue,
    minimumRedeem: safeMinimum,
    points: safePoints,
    balanceValue,
    maxDiscount,
    redeemablePoints,
    redeemableValue,
    canRedeem: enabled && balanceValue >= safeMinimum && redeemablePoints > 0 && redeemableValue >= safeMinimum,
    pointsNeeded: Math.max(0, Math.ceil((safeMinimum - balanceValue) / safePointValue)),
  };
}
