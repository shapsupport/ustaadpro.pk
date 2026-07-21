"use client";

import React, { useState } from "react";
import { Copy, Check, Upload, Banknote, CreditCard, Image as ImageIcon, X, ShieldCheck } from "lucide-react";

interface EasyPaisaPaymentSectionProps {
  paymentMethod: string;
  onSelectPaymentMethod: (method: string) => void;
  receiptDataUrl: string;
  onReceiptChange: (dataUrl: string, filename: string) => void;
}

const EASYPAISA_NUMBER = "03485838593";
const EASYPAISA_TITLE = "Muhammad Ikram";

export default function EasyPaisaPaymentSection({
  paymentMethod,
  onSelectPaymentMethod,
  receiptDataUrl,
  onReceiptChange,
}: EasyPaisaPaymentSectionProps) {
  const [copied, setCopied] = useState(false);
  const [fileName, setFileName] = useState("");

  const handleCopyNumber = () => {
    navigator.clipboard.writeText(EASYPAISA_NUMBER);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        alert("Please upload a valid image file (PNG, JPG, WEBP).");
        return;
      }
      setFileName(file.name);
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") {
          onReceiptChange(reader.result, file.name);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveReceipt = () => {
    setFileName("");
    onReceiptChange("", "");
  };

  return (
    <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
          <CreditCard className="h-4 w-4 text-emerald-600" />
          Select Payment Option *
        </label>
        <span className="text-[11px] text-slate-500 flex items-center gap-1">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
          100% Safe & Secure
        </span>
      </div>

      {/* Payment Option Buttons */}
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => onSelectPaymentMethod("Cash After Work Done")}
          className={`flex flex-col items-center gap-1.5 rounded-2xl p-3 text-center transition-all border ${
            paymentMethod === "Cash After Work Done"
              ? "bg-white border-emerald-600 text-emerald-800 shadow-md shadow-emerald-600/15"
              : "bg-white/60 border-slate-200 text-slate-600 hover:border-slate-300"
          }`}
        >
          <Banknote className="h-6 w-6 text-emerald-600" />
          <span className="text-xs font-bold">Cash After Work</span>
          <span className="text-[10px] text-slate-400">Pay cash upon completion</span>
        </button>

        <button
          type="button"
          onClick={() => onSelectPaymentMethod("Easypaisa")}
          className={`flex flex-col items-center gap-1.5 rounded-2xl p-3 text-center transition-all border ${
            paymentMethod === "Easypaisa" || paymentMethod === "Easypaisa After Work Done"
              ? "bg-white border-emerald-600 text-emerald-800 shadow-md shadow-emerald-600/15"
              : "bg-white/60 border-slate-200 text-slate-600 hover:border-slate-300"
          }`}
        >
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-white font-black text-[10px]">
            EP
          </div>
          <span className="text-xs font-bold">EasyPaisa Payment</span>
          <span className="text-[10px] text-slate-400">Pay via EasyPaisa</span>
        </button>
      </div>

      {/* EasyPaisa Details & Receipt Upload */}
      {(paymentMethod === "Easypaisa" || paymentMethod === "Easypaisa After Work Done") && (
        <div className="space-y-3 pt-2 border-t border-slate-200/80 animate-in fade-in duration-200">
          {/* EasyPaisa Account Card */}
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-900">EasyPaisa Account Details</span>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                Active
              </span>
            </div>

            <div className="flex items-center justify-between bg-white rounded-lg p-2.5 border border-emerald-100">
              <div>
                <p className="text-[10px] font-semibold text-slate-400 uppercase">Account Title</p>
                <p className="text-xs font-bold text-slate-800">{EASYPAISA_TITLE}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-semibold text-slate-400 uppercase">Account Number</p>
                <p className="text-sm font-black text-emerald-700 tracking-wider">
                  {EASYPAISA_NUMBER}
                </p>
              </div>
            </div>

            {/* Copy Button */}
            <button
              type="button"
              onClick={handleCopyNumber}
              className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-emerald-600 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 transition"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5" />
                  Account Number Copied!
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  Copy Account Number ({EASYPAISA_NUMBER})
                </>
              )}
            </button>
          </div>

          {/* Receipt Upload Dropzone */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Upload Payment Receipt Screenshot (Optional)
            </label>

            {receiptDataUrl ? (
              <div className="flex items-center justify-between rounded-xl border border-emerald-300 bg-white p-3 shadow-sm">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
                    <ImageIcon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-800 truncate">
                      {fileName || "Payment Receipt Screenshot"}
                    </p>
                    <p className="text-[10px] font-semibold text-emerald-600">Receipt attached & ready</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleRemoveReceipt}
                  className="rounded-full p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500 transition"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-white p-4 text-center hover:border-emerald-500 hover:bg-emerald-50/20 transition">
                <Upload className="h-6 w-6 text-slate-400 mb-1" />
                <span className="text-xs font-bold text-slate-700">
                  Click to upload payment receipt screenshot
                </span>
                <span className="text-[10px] text-slate-400 mt-0.5">
                  PNG, JPG or WEBP image up to 5MB
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
