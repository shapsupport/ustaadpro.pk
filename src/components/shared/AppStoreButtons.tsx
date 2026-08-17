import { appLinks } from "@/lib/constants";

export function AppStoreButtons({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`flex min-w-0 ${compact ? "flex-col" : "flex-col min-[420px]:flex-row"} gap-3`}>
      <a
        href={appLinks.googlePlay}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Find Ustaad Pro on Google Play"
        className="inline-flex h-[52px] w-full max-w-[172px] min-w-0 items-center justify-center overflow-hidden rounded-lg shadow-lg transition hover:-translate-y-0.5 hover:opacity-90"
      >
        {/* Google supplies this official badge with transparent outer padding. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://play.google.com/intl/en_us/badges/static/images/badges/en_badge_web_generic.png"
          alt="Get it on Google Play"
          className="h-[128%] w-[112%] max-w-none object-fill"
        />
      </a>
      <a
        href={appLinks.appStore}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Find Ustaad Pro on the Apple App Store"
        className="inline-flex h-[52px] w-full max-w-[172px] min-w-0 items-center justify-center overflow-hidden rounded-lg shadow-lg transition hover:-translate-y-0.5 hover:opacity-90"
      >
        {/* Apple supplies this official badge as a hosted SVG. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://developer.apple.com/assets/elements/badges/download-on-the-app-store.svg"
          alt="Download on the App Store"
          className="h-full w-full object-fill"
        />
      </a>
    </div>
  );
}
