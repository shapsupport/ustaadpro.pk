"use client";

import { motion } from "framer-motion";
import {
  Zap,
  Wrench,
  Home,
  Paintbrush,
  Shield,
  Wifi,
} from "lucide-react";

const floatingIcons = [
  { Icon: Zap, x: "10%", y: "20%", size: 24, delay: 0 },
  { Icon: Wrench, x: "85%", y: "15%", size: 20, delay: 1 },
  { Icon: Home, x: "75%", y: "70%", size: 28, delay: 2 },
  { Icon: Paintbrush, x: "15%", y: "75%", size: 22, delay: 0.5 },
  { Icon: Shield, x: "90%", y: "45%", size: 18, delay: 1.5 },
  { Icon: Wifi, x: "5%", y: "50%", size: 20, delay: 2.5 },
];

export function FloatingElements() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {floatingIcons.map(({ Icon, x, y, size, delay }, i) => (
        <motion.div
          key={i}
          className="absolute"
          style={{ left: x, top: y }}
          animate={{
            y: [-10, 10, -10],
            rotate: [-5, 5, -5],
            opacity: [0.15, 0.25, 0.15],
          }}
          transition={{
            duration: 6,
            delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <Icon size={size} className="text-lime-400" />
        </motion.div>
      ))}

      {/* Gradient orbs */}
      <motion.div
        className="absolute left-1/4 top-1/3 h-64 w-64 rounded-full bg-lime-200/20 blur-3xl"
        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute right-1/4 bottom-1/4 h-48 w-48 rounded-full bg-green-200/20 blur-3xl"
        animate={{ scale: [1.2, 1, 1.2], opacity: [0.2, 0.4, 0.2] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
      />
    </div>
  );
}
