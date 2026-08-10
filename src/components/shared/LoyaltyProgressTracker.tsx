"use client";

import { Gift, CheckCircle2, LockKeyhole } from "lucide-react";

// Every 9th order (after 8 are completed) gets PKR 200 loyalty discount.
// completedOrders % 9 = how many blocks to fill (0-8).
// When blocksFilled === 8, the next booking is eligible for PKR 200 OFF.

const ORDERS_PER_CYCLE = 9; // 9th order = discount
const BLOCKS = 8; // 8 blocks shown (1-8)
const DISCOUNT_VALUE = 200;

interface LoyaltyProgressTrackerProps {
  /** Total number of completed eligible orders */
  completedOrders: number;
  /** Compact mode for embedding in sidebars / stats sections */
  compact?: boolean;
  /** Show the reward unlock summary card alongside the tracker */
  showSummaryCard?: boolean;
  /** Number of completed reward cycles */
  completedCycles?: number;
}

export function LoyaltyProgressTracker({
  completedOrders,
  compact = false,
  showSummaryCard = false,
  completedCycles = 0,
}: LoyaltyProgressTrackerProps) {
  // How many blocks are filled in the current cycle (0-8)
  const blocksFilled = completedOrders % ORDERS_PER_CYCLE;
  // True when user has 8 completed orders in this cycle → next booking gets PKR 200 OFF
  const rewardReady = blocksFilled === BLOCKS;

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex gap-0.5">
          {Array.from({ length: BLOCKS }).map((_, i) => (
            <div
              key={i}
              className={`h-2.5 w-2.5 rounded-sm transition-colors ${
                i < blocksFilled
                  ? "bg-emerald-500"
                  : rewardReady
                  ? "bg-emerald-500"
                  : "bg-slate-200"
              }`}
            />
          ))}
        </div>
        <span className="text-xs font-bold text-slate-600">
          {rewardReady ? (
            <span className="text-emerald-600">PKR 200 OFF Ready!</span>
          ) : (
            `${blocksFilled}/8`
          )}
        </span>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${showSummaryCard ? "" : ""}`}>
      {/* Header */}
      <div className="flex items-center gap-2">
        <Gift className="h-5 w-5 text-emerald-600" />
        <h2 className="text-xl font-black text-slate-900">
          Eight-order loyalty reward
        </h2>
        {rewardReady && (
          <span className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-700 ring-1 ring-emerald-300 animate-pulse">
            <CheckCircle2 className="h-3.5 w-3.5" />
            PKR 200 OFF Ready!
          </span>
        )}
      </div>

      <p className="text-sm leading-6 text-slate-600">
        Complete 8 eligible orders to unlock a <strong>PKR 200 discount</strong> on
        your next (9th) booking. After the discount is applied, your counter resets
        and the next cycle begins.
      </p>

      {/* Progress text */}
      <div className="flex justify-between text-xs font-bold">
        <span className="text-slate-600">
          {rewardReady
            ? "8 of 8 orders completed — discount ready!"
            : `${blocksFilled} of 8 orders toward the next reward`}
        </span>
        <span className={rewardReady ? "text-emerald-700" : "text-slate-500"}>
          PKR {rewardReady ? DISCOUNT_VALUE : blocksFilled * 25} / PKR {DISCOUNT_VALUE}
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full transition-all duration-700 ${
            rewardReady
              ? "bg-gradient-to-r from-emerald-500 to-lime-400"
              : "bg-gradient-to-r from-emerald-500 to-lime-400"
          }`}
          style={{ width: rewardReady ? "100%" : `${(blocksFilled / BLOCKS) * 100}%` }}
        />
      </div>

      {/* 8 Block grid */}
      <div className="grid grid-cols-8 gap-1.5">
        {Array.from({ length: BLOCKS }).map((_, i) => {
          const filled = i < blocksFilled || rewardReady;
          return (
            <div
              key={i}
              className={`flex h-10 flex-col items-center justify-center rounded-xl text-xs font-black transition-all duration-300 ${
                filled
                  ? "bg-emerald-500 text-white shadow-sm shadow-emerald-500/30"
                  : "bg-slate-100 text-slate-400"
              }`}
            >
              {i + 1}
            </div>
          );
        })}
      </div>

      <p className="text-[11px] text-slate-500">
        Each admin-confirmed service order increases your progress. After the 9th (discounted) order, the counter resets for the next cycle.
      </p>

      {/* Reward summary card */}
      {showSummaryCard && (
        <div
          className={`rounded-2xl p-5 text-center ${
            completedCycles > 0
              ? "bg-emerald-50 text-emerald-900 ring-1 ring-emerald-200"
              : "bg-slate-100 text-slate-700"
          }`}
        >
          {completedCycles > 0 ? (
            <CheckCircle2 className="mx-auto h-9 w-9 text-emerald-600" />
          ) : (
            <LockKeyhole className="mx-auto h-9 w-9 text-slate-400" />
          )}
          <p className="mt-3 text-sm font-bold">
            {completedCycles > 0
              ? `${completedCycles} reward${completedCycles > 1 ? "s" : ""} unlocked`
              : `${BLOCKS - blocksFilled} more order${
                  BLOCKS - blocksFilled === 1 ? "" : "s"
                } to unlock`}
          </p>
          <p className="mt-1 text-2xl font-black">
            PKR {(completedCycles * DISCOUNT_VALUE).toLocaleString("en-PK")}
          </p>
          <p className="mt-1 text-xs opacity-70">Eligible discount value</p>
        </div>
      )}
    </div>
  );
}

/**
 * Badge shown inside order/admin detail when a PKR 200 loyalty discount was applied.
 */
export function LoyaltyDiscountBadge({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-black text-emerald-700 ring-1 ring-emerald-300 ${className}`}
    >
      <Gift className="h-3 w-3" />
      PKR 200 Loyalty Discount Applied
    </span>
  );
}

export { ORDERS_PER_CYCLE, BLOCKS, DISCOUNT_VALUE };
