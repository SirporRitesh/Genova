# Mobile ChatGPT Clone

A mobile-optimized AI chat application built with Next.js, showcasing modern web development practices and AI integration.

## 🚀 Tech Stack

- **Framework**: Next.js 15 with App Router
- **UI**: Bootstrap 5 (mobile-first responsive design)
- **Language**: TypeScript
- **RPC Layer**: tRPC (planned)
- **Database**: Supabase (planned)
- **Authentication**: Auth0 (planned)
- **AI Models**: Google Gemini APIs (planned)
- **Deployment**: Vercel (planned)

## 🎯 Features

- [x] **ChatGPT-style landing page** with dark mode design
- [x] **Mobile-first interface** (max-width: 480px)
- [x] **Interactive messaging** with real-time UI updates
- [x] **Auto-scroll** to latest messages
- [x] **Fixed header and input bar** with scrollable chat area
- [x] **ChatGPT-inspired design** with proper message bubbles
- [x] **Bootstrap 5 responsive** components
- [x] **TypeScript support** for better development
- [ ] Real-time AI chat with Google Gemini
- [ ] Image generation capabilities
- [ ] User authentication with Auth0
- [ ] Chat history persistence with Supabase
- [ ] tRPC for type-safe API calls

## 🛠️ Getting Started

First, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the mobile chat interface.

## 📱 Mobile-First Design

The application now features a **ChatGPT-style landing page** and replicates ChatGPT's mobile interface with:

**Landing Page:**

- **Dark mode design** with professional appearance
- **Fixed header** with hamburger menu, "Get Plus" button, and profile icon
- **Centered "Ready when you are."** text
- **Floating input bar** with plus, microphone, and AI send icons

**Chat Interface:**

- **Max width of 480px** for optimal mobile viewing
- **Fixed header** with back button and chat title
- **Scrollable chat area** with smooth scrolling
- **Message bubbles**: User (right, blue) and AI (left, gray)
- **Fixed input bar** at bottom with send button
- **Touch-friendly** interface elements
- **Proper spacing** optimized for thumb access

## 🏗️ Project Structure

```typescript
src/
├── app/
│   ├── layout.tsx          # Root layout with Bootstrap integration
│   ├── page.tsx            # Main chat interface
│   └── globals.css         # Custom styles
└── components/
    └── BootstrapClient.js  # Client-side Bootstrap JS loader
```

## 📋 Development Progress

### ✅ Step 1: Base Setup (Completed)

- [x] Next.js with App Router
- [x] TypeScript configuration  
- [x] Bootstrap 5 integration
- [x] Mobile-responsive chat UI
- [x] Development environment

### 🔄 Next Steps

- Step 2: Auth0 authentication
- Step 3: tRPC integration
- Step 4: Google Gemini API integration
- Step 5: Supabase database setup
- Step 6: Vercel deployment
- Step 7: Jest testing framework

## 🚀 Learn More

To learn more about the technologies used:

- [Next.js Documentation](https://nextjs.org/docs)
- [Bootstrap Documentation](https://getbootstrap.com/docs/5.3/)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)

## 📝 License

This project is for educational purposes as part of an internship assignment.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
