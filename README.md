# SalaryMan 💰

**Modern Personal Finance Management Platform**

SalaryMan is a comprehensive, full-stack expense management application designed to help users take complete control of their personal finances through intelligent tracking, proactive alerts, and advanced analytics.

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Next.js](https://img.shields.io/badge/Next.js-15.4.6-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)

## 🎯 Project Vision

Transform personal finance management from reactive tracking to proactive financial health optimization. SalaryMan empowers users with comprehensive visibility into their financial activities while providing intelligent automation that prevents costly mistakes and helps achieve financial goals.

## ✨ Key Features

### 🏦 Multi-Account Management
- **Bank Accounts**: Track checking, savings, investment accounts with real-time balances
- **Credit Cards**: Monitor spending limits, utilization rates, and payment due dates
- **Custom Organization**: Personalized account names and categorization

### 📊 Smart Transaction Tracking
- **Intelligent Categorization**: Custom categories with smart suggestions
- **Bulk Operations**: Import and manage multiple transactions efficiently
- **Receipt Management**: Photo attachments for expense documentation
- **Recurring Payments**: Automatic detection and management of subscriptions

### 🚨 Proactive Financial Alerts
- **Credit Card Monitoring**: Automated alerts at 30%, 50%, 70%, and 90% utilization
- **Bill Reminders**: Customizable notifications for payment due dates
- **Spending Anomalies**: Detection of unusual spending patterns
- **Cash Flow Warnings**: Alerts for potential insufficient funds scenarios

### 📈 Advanced Analytics & Insights
- **Financial Dashboard**: Comprehensive overview with key metrics and trends
- **Category Analysis**: Detailed spending breakdowns with visual charts
- **Goal Tracking**: Set and monitor progress toward savings objectives
- **Predictive Analytics**: Cash flow forecasting and financial health scores

### 🔒 Enterprise-Grade Security
- **Multi-Factor Authentication**: Secure login with Clerk integration
- **Data Encryption**: AES-256 encryption for all financial data
- **Privacy-First**: GDPR compliant with comprehensive data protection

## 🛠️ Technology Stack

### Frontend
- **Next.js 15.4.6** - Latest App Router with React Server Components
- **React 19** - Modern React with concurrent features
- **TypeScript 5.x** - Type-safe development throughout
- **Shadcn UI** - Accessible component library built on Radix UI
- **Tailwind CSS v4** - Utility-first styling with latest architecture

### Backend & Database
- **Next.js API Routes** - Serverless backend with integrated deployment
- **NeonDB PostgreSQL** - Serverless database with ACID compliance
- **Drizzle ORM** - Type-safe database operations with migrations
- **Vercel Edge Functions** - Global serverless compute

### Authentication & Security
- **Clerk** - Modern authentication with session management
- **Zod** - Runtime schema validation for data integrity
- **Environment-based Security** - Secure configuration management

### DevOps & Monitoring
- **Vercel Platform** - Integrated CI/CD with global edge deployment
- **Vercel Analytics** - Real user monitoring and performance metrics
- **Vitest + Playwright** - Comprehensive testing strategy

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm/yarn/pnpm/bun
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/M0hammedHaris/salary_man.git
   cd salary_man
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.local.example .env.local
   # Configure your environment variables
   ```

4. **Database Setup**
   ```bash
   npm run db:generate
   npm run db:migrate
   npm run db:seed
   ```

5. **Start Development Server**
   ```bash
   npm run dev
   ```

6. **Open Application**
   Navigate to [http://localhost:3000](http://localhost:3000)

### Environment Variables

```env
# Database
DATABASE_URL=your_neondb_connection_string

# Authentication (Clerk)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key

# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 📁 Project Structure

```
salary_man/
├── src/
│   ├── app/                 # Next.js App Router pages
│   ├── components/          # Reusable UI components
│   ├── lib/                # Utilities and configurations
│   └── __tests__/          # Test files
├── docs/                   # Project documentation
│   ├── architecture/       # Technical architecture
│   ├── prd/               # Product requirements
│   └── stories/           # User stories
├── drizzle/               # Database migrations
└── public/                # Static assets
```

## 🎯 Development Roadmap

### Epic 1: Foundation & Core Infrastructure ✅
- [x] Project setup with Next.js 15 and TypeScript
- [x] Authentication system with Clerk
- [x] Database schema and migrations
- [x] Basic dashboard framework

### Epic 2: Account & Transaction Management 🚧
- [ ] Bank account creation and management
- [ ] Credit card setup with limits and due dates
- [ ] Transaction entry and balance tracking
- [ ] Account dashboard integration

### Epic 3: Financial Tracking & Categorization
- [ ] Custom category management system
- [ ] Enhanced transaction entry with categorization
- [ ] Advanced transaction history and search
- [ ] Category-based financial insights

### Epic 4: Smart Alerts & Automation
- [ ] Credit card usage alerts
- [ ] Bill payment reminders
- [ ] Recurring payment management
- [ ] Notification center

### Epic 5: Analytics & Reporting Dashboard
- [ ] Advanced financial analytics
- [ ] Savings goals and financial planning
- [ ] Financial reports and data export
- [ ] Predictive insights and recommendations

## 🧪 Testing

```bash
# Unit and Integration Tests
npm run test

# E2E Tests
npm run test:e2e

# Test Coverage
npm run test:coverage

# Database Tests
npm run test:db
```

## 📚 Documentation

- [Technical Architecture](./docs/architecture/architecture_complete.md)
- [Product Requirements](./docs/prd/prd.md)
- [API Documentation](./docs/api/) *(Coming Soon)*
- [User Stories](./docs/stories/)

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](./CONTRIBUTING.md) for details.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📋 Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run type-check` | Run TypeScript checks |
| `npm run db:generate` | Generate database migrations |
| `npm run db:migrate` | Run database migrations |
| `npm run db:studio` | Open Drizzle Studio |

## 🏗️ Architecture Highlights

- **Jamstack Architecture**: Optimal performance with serverless scalability
- **Type-Safe Full Stack**: Shared TypeScript types between frontend and backend
- **Progressive Enhancement**: Works without JavaScript, enhanced with React
- **Edge-First Deployment**: Global distribution via Vercel's edge network
- **Financial-Grade Security**: Enterprise security patterns for sensitive data

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

## 👨‍💻 Author

**Mohammed Haris**
- GitHub: [@M0hammedHaris](https://github.com/M0hammedHaris)

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- UI components from [Shadcn/UI](https://ui.shadcn.com/)
- Database powered by [NeonDB](https://neon.tech/)
- Authentication by [Clerk](https://clerk.com/)
- Deployed on [Vercel](https://vercel.com/)

---

**SalaryMan** - *Take control of your financial future* 🚀
