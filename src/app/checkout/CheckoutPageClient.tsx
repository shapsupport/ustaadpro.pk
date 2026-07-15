"use client";

import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, CheckCircle2, CreditCard, FileImage, ShieldCheck, Wallet, MapPin, Navigation, Clock3, AlertCircle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/context/AuthContext";
import { useLocation } from "@/context/LocationContext";

type PaymentMethod = "cash" | "easypaisa" | "jazzcash";

type AdminSettings = {
  inspectionFee: number;
  serviceTaxPercent: number;
  currency: string;
  supportPhone: string;
  shippingCost: number;
  rewardEnabled: boolean;
  rewardMinimumRedeem: number;
  rewardPointValue: number;
  serviceRewardMaxDiscountPercent: number;
  serviceRewardPointsOnCompletion: number;
  shopRewardEarnPercent: number;
  shopRewardMaxDiscountPercent: number;
};

const defaultSettings: AdminSettings = {
  inspectionFee: 500,
  serviceTaxPercent: 10,
  currency: "PKR",
  supportPhone: "+923001234567",
  shippingCost: 201,
  rewardEnabled: true,
  rewardMinimumRedeem: 100,
  rewardPointValue: 25,
  serviceRewardMaxDiscountPercent: 10,
  serviceRewardPointsOnCompletion: 1,
  shopRewardEarnPercent: 0.5,
  shopRewardMaxDiscountPercent: 5,
};

const GUEST_DRAFT_STORAGE_KEY = "ustaadpro_guest_checkout_draft";

export default function CheckoutPageClient() {
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { location, setShowPicker, detectLocation, geoError } = useLocation();
  const serviceTitle = searchParams.get("serviceTitle") || "Selected service";
  const servicePrice = Number(searchParams.get("servicePrice") || 0);
  const workTitle = searchParams.get("workTitle") || "";

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [screenshotName, setScreenshotName] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [settings, setSettings] = useState<AdminSettings>(defaultSettings);
  const [draftReady, setDraftReady] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    houseNumber: "",
    landmark: "",
    gpsNote: "",
    preferredTime: "",
    notes: "",
  });

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE;

  useEffect(() => {
    let isMounted = true;

    fetch(`${API_BASE_URL}/api/admin/settings`)
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("Unable to load admin settings");
        }
        const data = (await response.json()) as Partial<AdminSettings>;
        if (isMounted) {
          setSettings({ ...defaultSettings, ...data });
        }
      })
      .catch(() => {
        if (isMounted) {
          setSettings(defaultSettings);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(GUEST_DRAFT_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<{
          formData: typeof formData;
          paymentMethod: PaymentMethod;
          screenshotName: string;
        }>;
        if (parsed.formData) {
          setFormData(parsed.formData);
        }
        if (parsed.paymentMethod) {
          setPaymentMethod(parsed.paymentMethod);
        }
        if (parsed.screenshotName) {
          setScreenshotName(parsed.screenshotName);
        }
        setDraftReady(true);
      }
    } catch { }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;

    const draft = {
      formData,
      paymentMethod,
      screenshotName,
      serviceTitle,
      workTitle,
      servicePrice,
      updatedAt: new Date().toISOString(),
    };

    if (!formData.fullName && !formData.phone && !formData.houseNumber && !formData.landmark && !formData.gpsNote && !formData.preferredTime && !formData.notes && !screenshotName && paymentMethod === "cash") {
      localStorage.removeItem(GUEST_DRAFT_STORAGE_KEY);
      setDraftReady(false);
      return;
    }

    localStorage.setItem(GUEST_DRAFT_STORAGE_KEY, JSON.stringify(draft));
    setDraftReady(true);
  }, [formData, paymentMethod, screenshotName, serviceTitle, workTitle, servicePrice, hydrated]);

  const isOnlinePayment = paymentMethod === "easypaisa" || paymentMethod === "jazzcash";
  const paymentLabel = useMemo(() => {
    if (paymentMethod === "easypaisa") return "EasyPaisa";
    if (paymentMethod === "jazzcash") return "JazzCash";
    return "Cash payment";
  }, [paymentMethod]);

  const subtotal = servicePrice;
  const serviceTaxAmount = subtotal * (settings.serviceTaxPercent / 100);
  const inspectionFee = settings.inspectionFee;
  const shippingFee = settings.shippingCost;
  const totalAmount = subtotal + serviceTaxAmount + inspectionFee + shippingFee;
  const rewardPointsEarned = Math.floor(subtotal / settings.rewardPointValue);
  const selectedLocation = location.shortLabel || location.label || "No location selected yet";
  const hasLocation = location.status === "serviceable" || location.status === "not-serviceable" || Boolean(location.label);

  const handleChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleDraftContinue = () => {
    setDraftReady(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    setError("");

    if (!formData.fullName || !formData.phone) {
      setError("Please add your name and phone number before continuing.");
      return;
    }

    if (!hasLocation) {
      setError("Please select your service location before placing the order.");
      return;
    }

    if (!formData.houseNumber && !formData.landmark) {
      setError("Please add house number or a landmark so the technician can find you easily.");
      return;
    }

    if (isOnlinePayment && !screenshotName) {
      setError("Please upload a payment screenshot to complete your booking request.");
      return;
    }

    const bookingRecord = {
      id: `booking-${Date.now()}`,
      serviceTitle,
      workTitle,
      servicePrice,
      paymentMethod,
      status: isOnlinePayment ? "Pending review" : "Processed",
      createdAt: new Date().toISOString(),
      userEmail: user?.email || "",
      customerName: formData.fullName,
      phone: formData.phone,
      address: `${selectedLocation} · ${formData.houseNumber || ""} · ${formData.landmark || ""}`.replace(/\s+/g, " ").trim(),
      preferredTime: formData.preferredTime,
      notes: formData.notes,
      screenshotName,
    };

    try {
      const stored = JSON.parse(localStorage.getItem("ustaadpro_bookings") || "[]");
      const next = [bookingRecord, ...stored];
      localStorage.setItem("ustaadpro_bookings", JSON.stringify(next));
    } catch { }

    localStorage.removeItem(GUEST_DRAFT_STORAGE_KEY);
    setDraftReady(false);
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-8">
        <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
          <Link href="/" className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-2 shadow-sm hover:text-primary">
            <ArrowLeft className="h-4 w-4" />
            Back home
          </Link>
        </div>

        {draftReady && !submitted ? (
          <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-4 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="flex items-center gap-2 text-sm font-semibold text-emerald-800">
                  <Sparkles className="h-4 w-4" />
                  You have an unfinished booking draft
                </p>
                <p className="mt-1 text-sm text-emerald-700">We saved your details so you can continue whenever you are ready.</p>
              </div>
              <button
                type="button"
                onClick={handleDraftContinue}
                className="inline-flex items-center justify-center rounded-2xl bg-white px-4 py-2 text-sm font-semibold text-emerald-700 shadow-sm"
              >
                Continue booking
              </button>
            </div>
          </div>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <Card className="border-slate-200 bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-slate-900">Book your service</CardTitle>
              <CardDescription className="text-sm text-slate-600">
                A quick and simple checkout with clear steps for location, timing, payment, and confirmation.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!submitted ? (
                <form className="space-y-6" onSubmit={handleSubmit}>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-sm font-semibold text-slate-800">1. Your details</p>
                    <div className="mt-4 grid gap-4 md:grid-cols-2">
                      <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-700" htmlFor="fullName">
                          Full name
                        </label>
                        <Input id="fullName" name="fullName" value={formData.fullName} onChange={handleChange} placeholder="Ayesha Khan" />
                      </div>
                      <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-700" htmlFor="phone">
                          Phone number
                        </label>
                        <Input id="phone" name="phone" value={formData.phone} onChange={handleChange} placeholder="03xx-xxxxxxx" />
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-slate-800">2. Service location</p>
                      <button
                        type="button"
                        onClick={() => setShowPicker(true)}
                        className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600"
                      >
                        Change location
                      </button>
                    </div>

                    {hasLocation ? (
                      <div className="mt-3 rounded-2xl border border-emerald-200 bg-white p-3 text-sm text-slate-700">
                        <div className="flex items-start gap-2">
                          <MapPin className="mt-0.5 h-4 w-4 text-primary" />
                          <div>
                            <p className="font-semibold text-slate-900">Selected location</p>
                            <p className="font-medium text-slate-700">{selectedLocation}</p>
                            <p className="mt-1 text-xs text-slate-500">Your saved service area will be used for this booking.</p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                        <div className="flex items-start gap-2">
                          <AlertCircle className="mt-0.5 h-4 w-4" />
                          <div>
                            <p className="font-semibold">Please select your location</p>
                            <p>We need your area first so the technician can reach you correctly.</p>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="mt-4 grid gap-4 md:grid-cols-2">
                      <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-700" htmlFor="houseNumber">
                          House / apartment / gate number
                        </label>
                        <Input id="houseNumber" name="houseNumber" value={formData.houseNumber} onChange={handleChange} placeholder="House 12, Flat 3, Gate A" />
                      </div>
                      <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-700" htmlFor="landmark">
                          Landmark or extra instructions
                        </label>
                        <Input id="landmark" name="landmark" value={formData.landmark} onChange={handleChange} placeholder="Near city hospital, blue gate, etc." />
                      </div>
                    </div>

                    <div className="mt-4">
                      <label className="mb-2 block text-sm font-semibold text-slate-700" htmlFor="gpsNote">
                        Exact GPS / landmark note
                      </label>
                      <Textarea id="gpsNote" name="gpsNote" value={formData.gpsNote} onChange={handleChange} placeholder="Add a nearby landmark, lane name, or exact place for easier arrival." />
                    </div>

                    <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="text-sm text-slate-600">
                        <p className="font-semibold text-slate-800">Use GPS for exact arrival</p>
                        <p>{geoError || "We will use your device location when available."}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => detectLocation()}
                        className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-50 px-3 py-2 text-sm font-semibold text-primary"
                      >
                        <Navigation className="h-4 w-4" />
                        Use GPS now
                      </button>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-sm font-semibold text-slate-800">3. Choose your time</p>
                    <div className="mt-4">
                      <label className="mb-2 block text-sm font-semibold text-slate-700" htmlFor="preferredTime">
                        Preferred date & time
                      </label>
                      <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2">
                        <Clock3 className="h-4 w-4 text-slate-400" />
                        <Input id="preferredTime" name="preferredTime" type="datetime-local" value={formData.preferredTime} onChange={handleChange} className="border-0 bg-transparent px-0 shadow-none" />
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-sm font-semibold text-slate-800">4. Payment</p>
                    <div className="mt-4 grid gap-3 md:grid-cols-3">
                      {[
                        { value: "cash", label: "Cash", icon: Wallet },
                        { value: "easypaisa", label: "EasyPaisa", icon: CreditCard },
                        { value: "jazzcash", label: "JazzCash", icon: CreditCard },
                      ].map(({ value, label, icon: Icon }) => {
                        const selected = paymentMethod === value;
                        return (
                          <button
                            key={value}
                            type="button"
                            onClick={() => {
                              setPaymentMethod(value as PaymentMethod);
                              if (value !== paymentMethod) {
                                setScreenshotName("");
                              }
                            }}
                            className={`flex items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-sm font-semibold transition ${selected ? "border-primary bg-emerald-50 text-primary shadow-sm" : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"}`}
                          >
                            <Icon className="h-4 w-4" />
                            {label}
                          </button>
                        );
                      })}
                    </div>

                    {isOnlinePayment ? (
                      <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                        <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-amber-800">
                          <FileImage className="h-4 w-4" />
                          Upload payment screenshot
                        </div>
                        <p className="mb-3 text-sm text-amber-700">
                          After sending the amount to {paymentLabel}, attach the confirmation screenshot so our team can verify it and confirm your booking.
                        </p>
                        <label className="flex cursor-pointer items-center justify-center rounded-xl border border-dashed border-amber-300 bg-white px-4 py-4 text-sm font-medium text-amber-700">
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(event) => {
                              const file = event.target.files?.[0];
                              setScreenshotName(file?.name || "");
                            }}
                          />
                          {screenshotName ? `Selected: ${screenshotName}` : "Choose screenshot"}
                        </label>
                      </div>
                    ) : (
                      <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
                        <div className="mb-1 flex items-center gap-2 font-semibold">
                          <ShieldCheck className="h-4 w-4" />
                          Cash payment selected
                        </div>
                        <p>Your booking will be processed for cash payment and confirmed directly.</p>
                      </div>
                    )}
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-sm font-semibold text-slate-800">5. Extra notes</p>
                    <div className="mt-3">
                      <label className="mb-2 block text-sm font-semibold text-slate-700" htmlFor="notes">
                        Anything else we should know?
                      </label>
                      <Textarea id="notes" name="notes" value={formData.notes} onChange={handleChange} placeholder="Parking available? Entry gate code?" />
                    </div>
                  </div>

                  {error ? <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}

                  <Button type="submit" className="w-full rounded-2xl bg-primary px-4 py-3 text-base font-semibold text-white hover:bg-emerald-700">
                    Place booking request
                  </Button>
                </form>
              ) : (
                <div className="space-y-4 rounded-3xl border border-emerald-200 bg-emerald-50 p-6">
                  <div className="flex items-center gap-2 text-emerald-800">
                    <CheckCircle2 className="h-5 w-5" />
                    <p className="text-lg font-semibold">Booking request received</p>
                  </div>
                  <p className="text-sm leading-6 text-emerald-700">
                    Thanks, {formData.fullName || "there"}. Your booking request for {serviceTitle} has been recorded. For {paymentLabel}, we will review the payment details and confirm your order once approved. For cash payments, the request will be processed directly.
                  </p>
                  <Link href="/" className="inline-flex items-center rounded-full bg-white px-4 py-2 text-sm font-semibold text-emerald-700 shadow-sm">
                    Back to services
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-slate-200 bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-slate-900">Booking summary</CardTitle>
              <CardDescription className="text-sm text-slate-600">
                A clear breakdown of your appointment and charges before confirmation.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Service</p>
                <p className="mt-1 text-lg font-semibold text-slate-900">{serviceTitle}</p>
                {workTitle ? <p className="text-sm text-slate-600">{workTitle}</p> : null}
                <p className="mt-3 text-3xl font-black text-slate-900">{settings.currency} {servicePrice.toLocaleString()}</p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
                <p className="font-semibold text-slate-900">Charges breakdown</p>
                <div className="mt-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span>Service subtotal</span>
                    <span>{settings.currency} {subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Inspection fee</span>
                    <span>{settings.currency} {inspectionFee.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Service tax ({settings.serviceTaxPercent}%)</span>
                    <span>{settings.currency} {serviceTaxAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Shipping</span>
                    <span>{settings.currency} {shippingFee.toLocaleString()}</span>
                  </div>
                </div>
                <div className="mt-4 border-t border-slate-200 pt-3 text-base font-semibold text-slate-900">
                  <div className="flex items-center justify-between">
                    <span>Total payable</span>
                    <span>{settings.currency} {totalAmount.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-emerald-50 p-4 text-sm text-emerald-800">
                <p className="font-semibold text-emerald-900">Guest checkout reminder</p>
                <ul className="mt-3 space-y-2">
                  <li>• Your details are saved automatically if you leave before placing the order.</li>
                  <li>• EasyPaisa and JazzCash require a payment screenshot before confirmation.</li>
                  <li>• You can return to this page later and continue from the banner at the top.</li>
                </ul>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
                <p className="font-semibold text-slate-900">Admin settings applied</p>
                <ul className="mt-3 space-y-2">
                  <li>• Rewards {settings.rewardEnabled ? "enabled" : "disabled"}</li>
                  <li>• Minimum redeem threshold: {settings.currency} {settings.rewardMinimumRedeem.toLocaleString()}</li>
                  <li>• Reward points earned on completion: {settings.serviceRewardPointsOnCompletion}</li>
                  <li>• Est. reward points for this booking: {rewardPointsEarned}</li>
                  <li>• Support: {settings.supportPhone}</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
