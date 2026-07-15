"use client";

export function WhatsAppBot() {
  const whatsappNumber = "923719201273";
  const message = encodeURIComponent("Hi Ustaad Pro, I want to book a service.");
  const url = `https://wa.me/${whatsappNumber}?text=${message}`;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-[80] flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-[0_12px_35px_rgba(37,211,102,0.35)] transition-all duration-300 hover:scale-110 hover:shadow-[0_16px_45px_rgba(18,140,126,0.4)] active:scale-95 group sm:h-16 sm:w-16"
      aria-label="Book a service on WhatsApp"
    >
      <span className="pointer-events-none absolute inline-flex h-full w-full rounded-full bg-[#25D366] opacity-25 animate-ping" />

      <svg
        className="relative h-7 w-7 sm:h-8 sm:w-8"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
        fill="currentColor"
      >
        <path d="M12.031 6.992c-3.31 0-5.993 2.683-5.993 5.993 0 1.053.273 2.087.79 2.993l-1.165 3.8 3.918-1.154a6.002 6.002 0 0 0 2.449.504c3.31 0 5.993-2.683 5.993-5.993 0-3.31-2.683-5.993-5.993-5.993zm0 10.93a4.94 4.94 0 0 1-2.542-.686l-.178-.106-2.324.684.694-2.27-.115-.184a4.94 4.94 0 0 1-.69-2.54c0-2.73 2.214-4.944 4.944-4.944 2.73 0 4.944 2.214 4.944 4.944 0 2.73-2.214 4.944-4.944 4.944zm2.73-3.705c-.149-.074-.882-.435-1.018-.484-.136-.049-.236-.074-.336.074-.1.149-.387.484-.474.584-.087.1-.174.112-.323.037-.874-.437-1.447-1.001-1.857-1.855-.14-.244-.014-.375.214-.496.088-.044.165-.074.248-.111.083-.037.174-.074.261-.149.087-.074.116-.149.174-.248.058-.099.029-.186-.015-.26-.044-.074-.993-2.398-1.36-3.279-.367-.882-.741-.763-.993-.763h-.852c-.149 0-.392.055-.598.27-.206.214-.788.768-.788 1.873s.807 2.17 1.03 2.32c.223.149 1.76 2.685 4.27 3.76.596.257 1.06.41 1.423.525.597.19 1.141.163 1.572.099.48-.072 1.476-.603 1.685-1.186.208-.583.208-1.083.146-1.186-.062-.103-.223-.163-.372-.237z" />
      </svg>

      <span className="pointer-events-none absolute right-20 whitespace-nowrap rounded-xl bg-slate-900 px-3 py-2 text-xs font-bold text-white opacity-0 translate-x-2 shadow-md transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100">
        Book a service on WhatsApp
      </span>
    </a>
  );
}
