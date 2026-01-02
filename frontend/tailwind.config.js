/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#203B71',
        },
        danger: {
          DEFAULT: '#EF3237',
        },
        success: {
          DEFAULT: '#28A745',
        },
        warning: {
          DEFAULT: '#FFC107',
        },
        info: {
          DEFAULT: '#0D6EFD',
        },
        text: {
          primary: '#1A1A1A',
          secondary: '#6B7280',
        },
        border: {
          DEFAULT: '#D6D6D6',
        },
        background: {
          DEFAULT: '#F4F6F9',
        },
        card: {
          DEFAULT: '#FFFFFF',
        },
        // Dark mode colors
        dark: {
          background: '#0F172A',
          surface: '#111827',
          text: '#F9FAFB',
          border: '#1F2933',
          primary: '#4F6EF7',
          success: '#4ADE80',
          danger: '#F87171',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'title': ['36px', { lineHeight: '1.2', fontWeight: '700' }],
        'section': ['24px', { lineHeight: '1.3', fontWeight: '600' }],
        'card-title': ['18px', { lineHeight: '1.4', fontWeight: '500' }],
        'body': ['14px', { lineHeight: '1.5', fontWeight: '400' }],
        'helper': ['12px', { lineHeight: '1.4', fontWeight: '400' }],
      },
      maxWidth: {
        'content': '1280px',
      },
      transitionDuration: {
        'default': '200ms',
        'slow': '300ms',
      },
    },
  },
  plugins: [],
}

