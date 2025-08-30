# FinSight - Multi-Persona Fintech AI Platform

A unified, intelligent platform that provides AI-powered tools for three distinct financial personas: Investment Institutions, Banks, and retail Customers.

## Features

### 🏠 **Landing Page**
- Professional hero section with compelling headline
- Three distinct feature sections for each persona
- Trust & security section with compliance badges
- Responsive design with modern gradients

### 🔐 **Authentication System**
- **Dynamic Signup**: Role-based form fields that adapt based on selected persona
- **Customer Onboarding**: 3-step wizard for first-time customer users
- **Secure Login**: Clean, professional login interface

### 📊 **Multi-Persona Dashboards**

#### Investment Institution Dashboard
- **AI Investment Co-Pilot**: Interactive chat interface with source citations
- **Portfolio Overview**: Real-time performance charts using Recharts
- **Market News Feed**: Curated financial news and updates
- **Key Metrics**: Portfolio value, active investments, returns, and risk scoring

#### Bank Dashboard  
- **Loan Document Analyzer**: AI-powered PDF analysis with drag & drop
- **Compliance Checker**: Automated regulatory requirement validation
- **Fraud Detection**: Real-time suspicious transaction alerts
- **Processing Metrics**: Application volumes and processing times

#### Customer Dashboard
- **Credit Score Gauge**: Interactive circular progress indicator
- **AI Credit Coach**: Personalized financial advice with actionable tips
- **Investment Recommendations**: Curated investment opportunities with risk levels
- **Financial Goals**: Progress tracking for savings and investment targets

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Styling**: Tailwind CSS v4
- **Icons**: Lucide React
- **Charts**: Recharts
- **Animations**: Framer Motion
- **Language**: TypeScript

## Getting Started

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Run Development Server**
   ```bash
   npm run dev
   ```

3. **Open Application**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Demo Features

- **Persona Switcher**: Bottom-right widget to test different user roles
- **Simulated AI Responses**: Pre-programmed responses for demo purposes
- **Interactive Components**: Functional file uploads, chat interfaces, and form validations

## Project Structure

```
src/
├── app/
│   ├── page.tsx              # Landing page
│   ├── login/page.tsx        # Login page
│   ├── signup/page.tsx       # Dynamic signup page
│   ├── onboarding/page.tsx   # Customer onboarding wizard
│   └── dashboard/page.tsx    # Main dashboard router
├── components/
│   ├── DashboardLayout.tsx   # Universal app shell
│   ├── PersonaSwitcher.tsx   # Demo persona switcher
│   └── dashboards/
│       ├── InvestmentDashboard.tsx
│       ├── BankDashboard.tsx
│       └── CustomerDashboard.tsx
└── globals.css               # Custom styles and animations
```

## Design System

### Colors
- **Primary**: Deep Blue (#0A2540) and White (#FFFFFF)
- **Accent**: Professional Green (#00D09C)
- **Greys**: Light to medium greys (#F6F9FC, #E6EBF1, #8898AA)

### Typography
- Clean sans-serif fonts (system fonts)
- Clear visual hierarchy
- Highly legible body text

### Layout
- Spacious design with clear visual hierarchy
- Data-rich visualizations
- Mobile-responsive components

## Key Features Implemented

✅ **Landing Page** with hero section and feature showcase  
✅ **Dynamic Signup** with role-based form fields  
✅ **Customer Onboarding** 3-step wizard  
✅ **Universal Dashboard Layout** with collapsible sidebar  
✅ **Investment Dashboard** with AI chat and portfolio charts  
✅ **Bank Dashboard** with document analyzer and fraud alerts  
✅ **Customer Dashboard** with credit score gauge and AI coach  
✅ **Responsive Design** across all screen sizes  
✅ **Interactive Components** with real-time updates  
✅ **Professional UI/UX** with modern design patterns

## Demo Instructions

1. Start on the landing page to see the professional design
2. Try the signup flow and select different personas to see dynamic forms
3. Use the login page to access the dashboard
4. Use the persona switcher (bottom-right) to test different user experiences
5. Interact with AI chat interfaces, upload areas, and interactive charts

---

Built with modern web technologies for a professional fintech experience. The platform demonstrates enterprise-grade UI/UX design patterns suitable for financial services applications.
