# Grraphic - AI-Powered Design Analysis Tool

<div align="center">

![Grraphic Logo](https://via.placeholder.com/150x150?text=Grraphic)

**Get instant, professional feedback on your graphic designs powered by AI**

[Quick Start](#quick-start) • [Features](#features) • [Documentation](#documentation) • [Demo](#demo)

</div>

## Overview

Grraphic is a modern web application that provides AI-powered analysis and feedback for graphic designs. Upload your designs and receive comprehensive critiques on composition, color theory, typography, visual hierarchy, and more.

Built with React, TypeScript, Supabase, and Google's Gemini AI.

## Key Features

- **AI-Powered Analysis**: Instant feedback using Google's Gemini AI
- **User Authentication**: Email/password and Google OAuth support
- **Design History**: Save and manage your analysis history
- **Public Sharing**: Share specific analyses via unique URLs
- **Pro Subscriptions**: Unlimited analyses and larger file uploads
- **Admin Panel**: User and subscription management
- **Dark Mode**: Beautiful light and dark themes
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Secure**: Row-level security, encrypted data, HTTPS

## Tech Stack

### Frontend
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Vite** - Build tool
- **Lucide React** - Icons

### Backend
- **Supabase** - Database, auth, storage
- **PostgreSQL** - Database
- **Edge Functions** - Serverless functions

### AI & Payments
- **Google Gemini AI** - Design analysis
- **Stripe** - Payment processing

## Quick Start

### Prerequisites

- Node.js 18+
- Supabase account
- Gemini API key

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/grraphic.git
cd grraphic

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your credentials

# Run database migrations
# See QUICKSTART.md for detailed instructions

# Start development server
npm run dev
```

Visit `http://localhost:5173` to see the app.

For detailed setup instructions, see [QUICKSTART.md](QUICKSTART.md).

## Documentation

- [Quick Start Guide](QUICKSTART.md) - Get up and running in minutes
- [Deployment Guide](DEPLOYMENT.md) - Deploy to production
- [Features Documentation](FEATURES.md) - Complete feature list

## Features

### For Designers

- Upload designs (JPG, PNG, GIF, WebP)
- AI analysis of composition, colors, typography
- Save and organize analysis history
- Share analyses publicly
- Dark mode for late-night sessions

### For Teams

- Admin panel for user management
- Custom subscription durations
- Usage analytics
- Centralized control

### For Developers

- Clean, type-safe codebase
- Comprehensive RLS policies
- Edge functions for serverless logic
- Easy to customize and extend

## Environment Variables

```env
# Supabase (Required)
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key

# Gemini AI (Required)
VITE_GEMINI_API_KEY=your_gemini_key

# Stripe (Optional)
VITE_STRIPE_PUBLISHABLE_KEY=your_stripe_key
```

## Project Structure

```
grraphic/
├── src/
│   ├── components/       # React components
│   │   ├── AdminPanel.tsx
│   │   ├── AuthModal.tsx
│   │   ├── FileUpload.tsx
│   │   └── ...
│   ├── hooks/           # Custom React hooks
│   │   ├── useAuth.ts
│   │   ├── useCredits.ts
│   │   └── ...
│   ├── services/        # API services
│   │   └── geminiService.ts
│   ├── utils/           # Utility functions
│   ├── types/           # TypeScript types
│   └── App.tsx          # Main component
├── supabase/
│   ├── migrations/      # Database migrations
│   └── functions/       # Edge functions
├── public/              # Static assets
└── package.json
```

## Development

```bash
# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linter
npm run lint

# Type check
npx tsc --noEmit
```

## Deployment

Grraphic can be deployed to any static hosting service:

- **Vercel** (Recommended)
- **Netlify**
- **AWS S3 + CloudFront**
- **Azure Static Web Apps**
- **GitHub Pages**

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed instructions.

## Security

- **Row Level Security (RLS)**: All database tables protected
- **Environment Variables**: Sensitive data never committed
- **Data Encryption**: Sensitive fields hashed
- **HTTPS Only**: Enforced secure connections
- **CORS Protection**: Proper headers on all endpoints
- **JWT Validation**: Secure authentication tokens

## Database Schema

### Main Tables

- `users` - User profiles and subscription data
- `design_analyses` - Design analysis history
- `admins` - Admin user management
- `stripe_customers` - Stripe customer records
- `stripe_subscriptions` - Subscription management
- `stripe_orders` - Order history

All tables have comprehensive RLS policies ensuring data security.

## API Integration

### Gemini AI
- Model: `gemini-2.5-flash`
- JSON structured output
- Image analysis capabilities
- Rate limiting support

### Supabase
- PostgreSQL database
- Real-time subscriptions
- Authentication (email, OAuth)
- Edge functions
- File storage (optional)

### Stripe
- Checkout sessions
- Subscription management
- Webhook handling
- Customer portal

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+
- Mobile browsers

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Google Gemini AI for powerful design analysis
- Supabase for the complete backend infrastructure
- Stripe for payment processing
- The React and TypeScript communities

## Support

For issues and questions:
- Check the [Quick Start Guide](QUICKSTART.md)
- Review [Documentation](FEATURES.md)
- Check existing GitHub issues
- Create a new issue if needed

## Roadmap

- [ ] AI-powered autofix suggestions
- [ ] Team collaboration features
- [ ] Figma/Sketch integrations
- [ ] PDF export reports
- [ ] Custom design guidelines
- [ ] Batch analysis
- [ ] API access

## Demo

Visit [grraphic.com](https://grraphic.com) to see it in action!

---

<div align="center">

Made with ❤️ by designers, for designers

[Website](https://grraphic.com) • [Documentation](FEATURES.md) • [Report Bug](https://github.com/yourusername/grraphic/issues)

</div>
