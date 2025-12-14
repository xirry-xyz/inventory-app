/** @type {import('tailwindcss').Config} */
module.exports = {
	darkMode: ["class"],
	content: [
		"./index.html",
		"./src/**/*.{js,ts,jsx,tsx}",
	],
	theme: {
		extend: {
			screens: {
				xs: '375px'
			},
			borderRadius: {
				xl: '1rem',
				'2xl': '1.5rem',
				'3xl': '2rem',
				'4xl': '2.5rem',
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			colors: {
				primary: {
					light: '#6366F1',
					DEFAULT: 'hsl(var(--primary))',
					dark: '#4338CA',
					foreground: 'hsl(var(--primary-foreground))'
				},
				secondary: {
					light: '#EC4899',
					DEFAULT: 'hsl(var(--secondary))',
					dark: '#BE185D',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				accent: {
					green: '#34D399',
					yellow: '#FBBF24',
					red: '#EF4444',
					blue: '#60A5FA',
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				gray: {
					'50': '#F9FAFB',
					'100': '#F3F4F6',
					'200': '#E5E7EB',
					'300': '#D1D5DB',
					'400': '#9CA3AF',
					'500': '#6B7280',
					'600': '#4B5563',
					'700': '#374151',
					'800': '#1F2937',
					'900': '#111827'
				},
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				chart: {
					'1': 'hsl(var(--chart-1))',
					'2': 'hsl(var(--chart-2))',
					'3': 'hsl(var(--chart-3))',
					'4': 'hsl(var(--chart-4))',
					'5': 'hsl(var(--chart-5))'
				}
			},
			fontFamily: {
				sans: ['DM Sans', 'sans-serif'],
			},
			backgroundImage: {
				'gradient-primary': 'linear-gradient(to right, #6366F1, #4F46E5)',
				'gradient-secondary': 'linear-gradient(to right, #EC4899, #DB2777)',
				'gradient-green-light': 'linear-gradient(to bottom right, #D1FAE5, #A7F3D0)',
				'gradient-yellow-light': 'linear-gradient(to bottom right, #FDE68A, #FCD34D)',
				'gradient-red-light': 'linear-gradient(to bottom right, #FECACA, #FCA5A5)',
				'gradient-blue-light': 'linear-gradient(to bottom right, #BFDBFE, #93C5FD)'
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
}