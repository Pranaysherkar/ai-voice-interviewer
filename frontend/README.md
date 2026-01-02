# AI Voice Interviewer - Frontend

Enterprise-grade admin dashboard for managing AI voice interviews.

## Features

- ✅ Fully responsive design (mobile-first)
- ✅ Dark and light mode support
- ✅ Left-side navigation sidebar
- ✅ Theme toggle in top-right corner
- ✅ Follows Enterprise UI Design System
- ✅ Clean, maintainable code structure

## Tech Stack

- **React 19** - UI library
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **React Router** - Navigation
- **Lucide React** - Icons

## Getting Started

### Install Dependencies

```bash
npm install
```

### Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### Build for Production

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## Project Structure

```
frontend/
├── src/
│   ├── components/      # Reusable UI components
│   │   ├── Layout.jsx
│   │   ├── Sidebar.jsx
│   │   ├── ThemeToggle.jsx
│   │   ├── PageHeader.jsx
│   │   └── StatCard.jsx
│   ├── contexts/        # React contexts
│   │   └── ThemeContext.jsx
│   ├── pages/           # Page components
│   │   ├── Dashboard.jsx
│   │   ├── Candidates.jsx
│   │   ├── JobDescriptions.jsx
│   │   ├── QuestionBanks.jsx
│   │   ├── Interviews.jsx
│   │   └── Feedback.jsx
│   ├── App.jsx          # Main app component
│   ├── main.jsx          # Entry point
│   └── style.css         # Global styles
├── public/               # Static assets
├── index.html           # HTML template
├── tailwind.config.js    # Tailwind configuration
├── vite.config.js        # Vite configuration
└── package.json
```

## Design System

### Colors (Light Mode)
- Primary: `#203B71`
- Danger: `#EF3237`
- Success: `#28A745`
- Warning: `#FFC107`
- Info: `#0D6EFD`
- Text Primary: `#1A1A1A`
- Text Secondary: `#6B7280`
- Border: `#D6D6D6`
- Background: `#F4F6F9`
- Card: `#FFFFFF`

### Colors (Dark Mode)
- Background: `#0F172A`
- Surface: `#111827`
- Text: `#F9FAFB`
- Border: `#1F2933`
- Primary: `#4F6EF7`
- Success: `#4ADE80`
- Danger: `#F87171`

### Typography
- Font Family: Inter, system-ui, sans-serif
- Titles: 36-40px
- Sections: 24-28px
- Card Titles: 18-20px
- Body: 14-16px
- Helper: 12-13px

## Pages

1. **Dashboard** (`/`) - Overview with stats and recent activity
2. **Candidates** (`/candidates`) - Manage candidates
3. **Job Descriptions** (`/job-descriptions`) - Manage job descriptions
4. **Question Banks** (`/question-banks`) - Manage question banks
5. **Interviews** (`/interviews`) - View and manage interviews
6. **Feedback** (`/feedback/:id?`) - View interview feedback

## Responsive Breakpoints

- Mobile: < 768px
- Tablet: 768px - 1024px
- Desktop: > 1024px

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License

ISC

