/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      boxShadow: {
        xs: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
        sm: "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
        md: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
        lg: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
        xl: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
        "premium": "0 10px 30px -5px rgba(0, 0, 0, 0.05), 0 8px 15px -5px rgba(0, 0, 0, 0.03)",
        "premium-hover": "0 20px 40px -5px rgba(0, 0, 0, 0.1), 0 10px 20px -5px rgba(0, 0, 0, 0.05)",
        "hover-md": "0 6px 12px -2px rgb(0 0 0 / 0.12), 0 4px 6px -3px rgb(0 0 0 / 0.1)",
        "hover-lg": "0 12px 20px -4px rgb(0 0 0 / 0.12), 0 6px 8px -4px rgb(0 0 0 / 0.1)",
      },
      transitionTimingFunction: {
        "silk": "cubic-bezier(0.4, 0, 0.2, 1)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        shake: {
          "0%, 100%": { transform: "translateX(0)" },
          "10%, 30%, 50%, 70%, 90%": { transform: "translateX(-4px)" },
          "20%, 40%, 60%, 80%": { transform: "translateX(4px)" },
        },
        breathing: {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%": { opacity: "0.5", transform: "scale(1.2)" },
        },
        "fade-in-up": {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "scale-in": {
          "0%": { opacity: "0", transform: "scale(0.95)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "gradient-border-chase": {
          "0%": { background: "conic-gradient(from 0deg, #FF8C00, #FF6600, #FF8C00, transparent 50%, transparent)" },
          "5%": { background: "conic-gradient(from 18deg, #FF8C00, #FF6600, #FF8C00, transparent 50%, transparent)" },
          "10%": { background: "conic-gradient(from 36deg, #FF8C00, #FF6600, #FF8C00, transparent 50%, transparent)" },
          "15%": { background: "conic-gradient(from 54deg, #FF8C00, #FF6600, #FF8C00, transparent 50%, transparent)" },
          "20%": { background: "conic-gradient(from 72deg, #FF8C00, #FF6600, #FF8C00, transparent 50%, transparent)" },
          "25%": { background: "conic-gradient(from 90deg, #FF8C00, #FF6600, #FF8C00, transparent 50%, transparent)" },
          "30%": { background: "conic-gradient(from 108deg, #FF8C00, #FF6600, #FF8C00, transparent 50%, transparent)" },
          "35%": { background: "conic-gradient(from 126deg, #FF8C00, #FF6600, #FF8C00, transparent 50%, transparent)" },
          "40%": { background: "conic-gradient(from 144deg, #FF8C00, #FF6600, #FF8C00, transparent 50%, transparent)" },
          "45%": { background: "conic-gradient(from 162deg, #FF8C00, #FF6600, #FF8C00, transparent 50%, transparent)" },
          "50%": { background: "conic-gradient(from 180deg, #FF8C00, #FF6600, #FF8C00, transparent 50%, transparent)" },
          "55%": { background: "conic-gradient(from 198deg, #FF8C00, #FF6600, #FF8C00, transparent 50%, transparent)" },
          "60%": { background: "conic-gradient(from 216deg, #FF8C00, #FF6600, #FF8C00, transparent 50%, transparent)" },
          "65%": { background: "conic-gradient(from 234deg, #FF8C00, #FF6600, #FF8C00, transparent 50%, transparent)" },
          "70%": { background: "conic-gradient(from 252deg, #FF8C00, #FF6600, #FF8C00, transparent 50%, transparent)" },
          "75%": { background: "conic-gradient(from 270deg, #FF8C00, #FF6600, #FF8C00, transparent 50%, transparent)" },
          "80%": { background: "conic-gradient(from 288deg, #FF8C00, #FF6600, #FF8C00, transparent 50%, transparent)" },
          "85%": { background: "conic-gradient(from 306deg, #FF8C00, #FF6600, #FF8C00, transparent 50%, transparent)" },
          "90%": { background: "conic-gradient(from 324deg, #FF8C00, #FF6600, #FF8C00, transparent 50%, transparent)" },
          "95%": { background: "conic-gradient(from 342deg, #FF8C00, #FF6600, #FF8C00, transparent 50%, transparent)" },
          "100%": { background: "conic-gradient(from 360deg, #FF8C00, #FF6600, #FF8C00, transparent 50%, transparent)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        shake: "shake 0.5s ease-in-out",
        breathing: "breathing 2s ease-in-out infinite",
        "fade-in-up": "fade-in-up 0.3s ease-out",
        "scale-in": "scale-in 0.3s ease-out",
        shimmer: "shimmer 1.5s ease-in-out infinite",
        "gradient-border-chase": "gradient-border-chase 3s linear infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}

