/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        forti: {
          // Sidebar / navigation
          sidebar: '#1e2a3a',
          'sidebar-hover': '#2a3a4e',
          'sidebar-active': '#344c66',
          // Header
          header: '#0f1923',
          // Content area
          bg: '#f2f3f5',
          card: '#ffffff',
          // Table
          'table-header': '#e8edf2',
          'table-row-alt': '#f8f9fb',
          'table-border': '#dee2e8',
          // Status / action colors
          accept: '#22c55e',
          deny: '#ef4444',
          enable: '#22c55e',
          disable: '#9ca3af',
          warning: '#f59e0b',
          // Text
          'text-primary': '#1e293b',
          'text-secondary': '#64748b',
          'text-sidebar': '#c8d6e5',
          'text-sidebar-active': '#ffffff',
          // Accent (FortiGate green)
          accent: '#2f8a46',
          'accent-hover': '#256e37',
          'accent-soft': '#e7f3ec',
          // Section band background
          band: '#eaeef1',
        },
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
