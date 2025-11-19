# Book AI - Project Documentation

**Last Updated:** November 11, 2025

## Table of Contents
1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [Features Implemented](#features-implemented)
4. [Technology Stack](#technology-stack)
5. [Database Schema](#database-schema)
6. [Book Generation Workflow](#book-generation-workflow)
7. [Authentication & Authorization](#authentication--authorization)
8. [Monetization](#monetization)
9. [Project Structure](#project-structure)
10. [Next Steps & Roadmap](#next-steps--roadmap)

---

## Project Overview

**Book AI** is a full-stack AI-powered book generation platform that enables users to create complete books through an interactive, conversational interface. The platform supports both web and mobile applications with a unified backend.

### Key Capabilities
- **AI-Powered Book Generation**: Multi-phase workflow from ideation to complete chapters
- **Real-Time Streaming**: v0.app-style word-by-word text streaming
- **Multi-Platform**: Web (Next.js) and Native Mobile (React Native/Expo)
- **Subscription Management**: Polar (web) and RevenueCat (mobile)
- **Credit System**: Pay-per-use model with bonus credits for subscribers
- **Export Formats**: Markdown, HTML, Plain Text, PDF, EPUB

---

## Architecture

### Monorepo Structure
```
book-ai/
├── apps/
│   ├── web/           # Next.js 16 web application
│   └── native/        # React Native/Expo mobile app
└── packages/
    └── backend/       # Convex backend (shared by web & mobile)
```

### Technology Choices

**Frontend (Web)**
- Next.js 16 with React 19
- TailwindCSS 4 for styling
- shadcn/ui + ai-elements for UI components
- Convex Agent React hooks for real-time streaming

**Frontend (Mobile)**
- React Native 0.81 with Expo 54
- NativeWind for styling
- heroui-native for UI components
- RevenueCat for in-app purchases

**Backend**
- Convex (Backend-as-a-Service)
- Better Auth for authentication
- Convex Agent Component for AI conversations
- AI SDK (Vercel) with multiple LLM providers

**AI/LLM**
- OpenAI GPT-4o (primary)
- Anthropic Claude (fallback)
- Google Gemini (fallback)
- AI Gateway for provider abstraction

---

## Features Implemented

### 1. Book Generation System ✅

#### Multi-Phase Workflow
The book generation follows a structured 4-phase approach:

**Phase 1: Ideation (Optional)**
- Triggered only for vague prompts (< 10 words)
- Asks 3 core questions via visual cards:
  1. Book category (Fiction, Non-Fiction, Children's, etc.)
  2. Target audience (adaptive based on category)
  3. Book length (adaptive based on category)
- Smart question flows defined in `questionFlows.ts`

**Phase 2: Foundation Gathering**
- Conversational data collection based on book type
- **Fiction**: Synopsis, themes, characters, setting, conflict, tone
- **Non-Fiction**: Synopsis, target reader, core arguments, approach
- **Children's**: Theme, moral lesson, character concepts, age-appropriate style
- **Educational**: Learning objectives, knowledge progression, exercises
- Agent presents complete foundation for approval
- Saved via `saveFoundation` tool

**Phase 3: Structure Design**
- Professional book structure design:
  - Prologue/Epilogue requirements
  - Chapter count and titles
  - Parts/sections (if needed)
  - Estimated words per chapter
- User approval required before proceeding
- Saved via `saveStructure` tool

**Phase 4: Chapter Generation**
- Two modes:
  - **Auto Mode**: Continuous generation of all chapters
  - **Manual Mode**: Step-by-step with user feedback
- Chapters auto-approved and appear in preview panel
- Real-time streaming as content is generated
- Saved via `saveChapter` tool

#### AI Agent Implementation
- **Primary Agent**: `bookAgent.ts` using Convex Agent Component
- **Fallback Agent**: `agent.ts` using ToolLoopAgent (200-300 tool calls)
- Automatic message persistence in threads
- Context injection with completed chapter summaries
- Tool calling for database operations

#### Real-Time Streaming
- Websocket-based streaming (not HTTP SSE)
- Word-by-word text appearance
- 100ms debouncing for optimal performance
- `useSmoothText` hook for text animation
- Blinking cursor indicator during streaming
- Multi-client support (multiple users can watch same generation)

### 2. Chapter Management ✅

**Version Control**
- Full version history for each chapter
- Undo/redo functionality
- Track changes by user or AI
- Change descriptions for each version

**Editing**
- In-place chapter editing in preview panel
- Markdown support
- Auto-save functionality
- Word count tracking

**Draft System**
- Temporary storage for generated chapters
- Pending review status
- Approve/reject workflow

### 3. Export System ✅

Implemented in `export.ts`:
- **Markdown** (.md): Native format with metadata
- **HTML** (.html): Styled with CSS
- **Plain Text** (.txt): Clean text output
- **PDF** (.pdf): Via HTML conversion (jspdf)
- **EPUB** (.epub): Structured e-book format (epub-gen-memory)

### 4. Authentication ✅

**Providers**
- Google OAuth (web & mobile)
- Apple Sign-In (iOS)
- Email/Password (optional)

**Implementation**
- Better Auth for authentication
- Convex Better Auth integration
- Session management
- Protected routes

**Setup Documentation**
- Complete guide in `auth-setup.md`
- OAuth configuration steps
- Environment variable setup
- Testing instructions

### 5. Monetization ✅

#### Credit System
- Pay-per-use model
- Credits deducted for:
  - Book outline generation
  - Chapter generation
  - AI revisions
- Credit purchase via one-time payments

#### Subscription System
**Unified Schema** (`subscriptions` table)
- Single source of truth for both platforms
- Tracks Polar (web) and RevenueCat (mobile) subscriptions
- Status: active, canceled, expired, past_due, trialing

**Premium Benefits**
- Unlimited book generation
- Priority AI processing
- Advanced export formats
- Bonus credits (1000 on subscription/renewal)

**Platform-Specific Integration**
- **Web (Polar)**: Next.js webhook → Convex mutations
- **Mobile (RevenueCat)**: Convex HTTP action webhook

**Premium Management**
- Manual premium grants (admin)
- Subscription-based premium
- Lifetime access option
- Automatic sync from subscription status

### 6. User Interface ✅

**Web Components**
- Chat panel with streaming messages
- Preview panel with chapter navigation
- Sidebar with book list
- Question cards for guided input
- Export menu with format selection
- Version history viewer
- Credits modal
- Pricing plans page

**Mobile Screens**
- Authentication screens
- Book dashboard
- Book creation flow
- Chapter viewer
- Settings

**Shared UI Patterns**
- Dark/light mode support
- Responsive design
- Loading states
- Error handling
- Toast notifications

---

## Technology Stack

### Frontend Dependencies

**Web (apps/web)**
```json
{
  "@ai-sdk/react": "3.0.0-beta.94",
  "@convex-dev/agent": "^0.2.12",
  "next": "16.0.0",
  "react": "19.1.0",
  "tailwindcss": "^4.1.10",
  "shadcn/ui": "latest",
  "lucide-react": "^0.546.0",
  "better-auth": "catalog",
  "@polar-sh/nextjs": "^0.7.0"
}
```

**Mobile (apps/native)**
```json
{
  "expo": "^54.0.1",
  "react-native": "0.81.5",
  "heroui-native": "1.0.0-beta.1",
  "nativewind": "^4.2.1",
  "@better-auth/expo": "1.3.27",
  "react-native-purchases": "^9.6.1"
}
```

### Backend Dependencies

**Convex (packages/backend)**
```json
{
  "convex": "catalog",
  "@convex-dev/agent": "^0.2.12",
  "@convex-dev/better-auth": "catalog",
  "@convex-dev/polar": "^0.6.4",
  "ai": "6.0.0-beta.94",
  "@ai-sdk/openai": "3.0.0-beta.55",
  "@ai-sdk/anthropic": "3.0.0-beta.50",
  "@ai-sdk/google": "3.0.0-beta.40",
  "@ai-sdk/gateway": "^2.0.7",
  "better-auth": "catalog",
  "epub-gen-memory": "^1.1.2",
  "jspdf": "^3.0.3",
  "marked": "^17.0.0"
}
```

---

## Database Schema

### Core Tables

**profile**
- User profile information
- Credit balance
- Premium status and metadata
- Index: `by_auth_user_id`

**subscriptions**
- Unified subscription data (Polar + RevenueCat)
- Platform-specific IDs
- Status tracking
- Period dates
- Indexes: `by_user`, `by_user_platform`, `by_user_status`, `by_platform_subscription_id`

**orders**
- One-time purchase tracking
- Credit pack purchases
- Status: paid, pending, failed, refunded
- Indexes: `by_platform_order_id`, `by_user`, `by_user_platform`

**books**
- Book metadata
- Generation status and current step
- Thread ID for conversation continuity
- Foundation (synopsis, themes, characters, etc.)
- Structure (chapters, prologue/epilogue)
- Story ideas (ideation phase)
- Generation mode (auto/manual)
- Indexes: `by_user`, `by_user_status`

**chapters**
- Chapter content (current version)
- Status: pending, generating, approved, needs_revision
- Word count
- Version tracking
- Indexes: `by_book`, `by_book_chapter`

**chapterVersions**
- Full version history
- Content snapshots
- Change metadata
- Indexes: `by_chapter`, `by_chapter_version`

**draftChapters**
- Temporary chapter storage
- Pending review
- Status: generating, pending_review, approved, rejected
- Indexes: `by_book`, `by_book_chapter`, `by_book_status`

**generationSessions**
- AI conversation state
- Message history
- Checkpoints for resume
- Retry tracking
- Indexes: `by_book`, `by_book_status`

---

## Book Generation Workflow

### Flow Diagram
```
User Input → Ideation (if vague) → Foundation → Structure → Generation → Export
                ↓                      ↓           ↓            ↓
           3 Questions          Conversational  Design    Auto/Manual
           (visual cards)        Gathering      Approval   Mode Choice
```

### Detailed Steps

1. **Book Creation**
   - User provides title/description
   - System creates book record
   - Initiates conversation thread

2. **Ideation Phase** (conditional)
   - Triggered if prompt is vague
   - Presents 3 question cards
   - Collects: category, audience, length
   - Saves to `storyIdeas` field

3. **Foundation Phase**
   - Agent asks genre-specific questions
   - Gathers essential book elements
   - Presents complete foundation
   - User approves → saves via `saveFoundation`

4. **Structure Phase**
   - Agent designs book structure
   - Proposes chapter count and titles
   - Suggests prologue/epilogue
   - User approves → saves via `saveStructure`

5. **Generation Mode Selection**
   - User chooses Auto or Manual
   - Saved via `setGenerationMode`

6. **Chapter Generation**
   - Agent generates chapters sequentially
   - Real-time streaming to UI
   - Auto-approved (no blocking)
   - Appears in preview panel
   - Manual mode: waits for feedback

7. **Review & Edit**
   - User can edit any chapter
   - Version history maintained
   - Request AI revisions

8. **Export**
   - Choose format (MD, HTML, TXT, PDF, EPUB)
   - Download complete book

---

## Authentication & Authorization

### Setup
- Configured via Better Auth
- OAuth providers: Google, Apple
- Session-based authentication
- Secure token storage

### User Flow
1. User clicks "Sign in with Google/Apple"
2. OAuth redirect to provider
3. Provider authenticates user
4. Redirect back with auth code
5. Better Auth creates session
6. Profile created in Convex
7. User redirected to dashboard

### Protected Routes
- `/dashboard` - User dashboard
- `/books/*` - Book management
- `/settings` - User settings
- `/portal` - Customer portal

### Public Routes
- `/` - Landing page
- `/pricing` - Pricing information
- `/auth/*` - Authentication pages

---

## Monetization

### Credit System
**Pricing** (example)
- 100 credits: $5
- 500 credits: $20
- 1000 credits: $35

**Usage**
- Book outline: 50 credits
- Chapter generation: 100 credits
- AI revision: 25 credits

**Implementation**
- `credits` mutations for add/deduct
- Transaction tracking
- Balance checks before operations

### Subscription Plans
**Monthly Plan**
- Unlimited book generation
- 1000 bonus credits
- Priority processing
- Advanced exports

**Yearly Plan**
- All monthly features
- 2 months free
- 12,000 bonus credits
- Early access to features

### Webhook Integration

**Polar (Web)**
- Next.js API route: `/api/webhook/polar`
- Events: subscription.*, checkout.updated
- Calls Convex public mutations
- Documentation: `POLAR_WEBHOOK_SETUP.md`

**RevenueCat (Mobile)**
- Convex HTTP action: `/revenuecat/webhooks`
- Events: INITIAL_PURCHASE, RENEWAL, CANCELLATION, etc.
- Direct internal mutations
- Automatic premium sync

---

## Project Structure

### Web App (`apps/web/src`)
```
app/
├── api/              # API routes (webhooks, etc.)
├── auth/             # Authentication pages
├── books/            # Book management
│   ├── [id]/        # Individual book page
│   └── create/      # Book creation
├── dashboard/        # User dashboard
├── pricing/          # Pricing page
└── settings/         # User settings

components/
├── ai-elements/      # AI-specific UI components
├── books/            # Book-related components
│   ├── app-sidebar.tsx
│   ├── book-header.tsx
│   ├── chat-panel.tsx
│   ├── preview-panel.tsx
│   └── question-card.tsx
└── ui/               # shadcn/ui components

hooks/
└── use-book-generation.ts  # Main generation hook

lib/
└── utils.ts          # Utility functions
```

### Mobile App (`apps/native/app`)
```
(root)/
├── (auth)/           # Authentication screens
└── (main)/           # Main app screens
    ├── (tabs)/      # Tab navigation
    ├── books/       # Book screens
    └── settings/    # Settings screens
```

### Backend (`packages/backend/convex`)
```
features/
├── books/
│   ├── actions.ts          # AI generation actions
│   ├── agent.ts            # ToolLoopAgent (fallback)
│   ├── bookAgent.ts        # Convex Agent (primary)
│   ├── export.ts           # Export functionality
│   ├── index.ts            # Public API
│   ├── mutations.ts        # Database mutations
│   ├── queries.ts          # Database queries
│   └── questionFlows.ts    # Question configurations
├── credits/
│   ├── mutations.ts        # Credit operations
│   └── queries.ts          # Credit balance
├── premium/
│   ├── admin.ts            # Admin operations
│   ├── guards.ts           # Authorization checks
│   ├── mutations.ts        # Premium management
│   └── queries.ts          # Premium status
└── subscriptions/
    ├── actions.ts          # Webhook handlers
    ├── mutations.ts        # Subscription CRUD
    └── queries.ts          # Subscription data

lib/
├── aiConfig.ts             # AI provider configuration
├── betterAuth.ts           # Auth setup
└── revenuecatWebhooks.ts   # RevenueCat integration

schema.ts                   # Database schema
http.ts                     # HTTP routes
```

---

## Next Steps & Roadmap

### High Priority

1. **Complete Mobile App**
   - Implement book generation screens
   - Add chapter viewer
   - Integrate RevenueCat purchases
   - Test on iOS/Android devices

2. **Testing & QA**
   - Unit tests for critical functions
   - Integration tests for workflows
   - E2E tests for user journeys
   - Load testing for AI generation

3. **Performance Optimization**
   - Optimize streaming performance
   - Reduce initial load time
   - Implement caching strategies
   - Database query optimization

4. **Production Deployment**
   - Set up CI/CD pipeline
   - Configure production environment
   - Set up monitoring and logging
   - Implement error tracking (Sentry)

### Medium Priority

5. **Enhanced Features**
   - Collaborative book editing
   - Book templates library
   - AI-powered cover art generation
   - Voice input for prompts
   - Multi-language support

6. **User Experience**
   - Onboarding tutorial
   - Interactive help system
   - Keyboard shortcuts
   - Accessibility improvements

7. **Analytics & Insights**
   - User behavior tracking
   - Generation success metrics
   - Conversion funnel analysis
   - A/B testing framework

### Low Priority

8. **Advanced Capabilities**
   - Thread branching (fork conversations)
   - Message reactions
   - Book sharing and publishing
   - Community features
   - Marketplace for templates

9. **Integrations**
   - Publishing platforms (Amazon KDP, etc.)
   - Social media sharing
   - Email notifications
   - Calendar integration

10. **Admin Dashboard**
    - User management
    - Content moderation
    - Analytics dashboard
    - Manual premium grants
    - Credit adjustments

---

## Known Issues & Limitations

### TypeScript Errors (Non-blocking)
- Agent generic type errors in `actions.ts`
- Cosmetic only, doesn't affect runtime
- Will be fixed in next @convex-dev/agent release

### Mobile App Status
- UI components implemented
- Generation flow needs integration
- RevenueCat webhook tested but not fully integrated
- Needs device testing

### Performance Considerations
- Large books (50+ chapters) may have slower load times
- Streaming can be bandwidth-intensive
- Consider pagination for very long conversations

---

## Development Commands

### Root Level
```bash
pnpm install          # Install all dependencies
pnpm dev              # Start all apps in dev mode
pnpm build            # Build all apps
pnpm check-types      # Type check all apps
```

### Web App
```bash
pnpm dev:web          # Start web app only
cd apps/web && pnpm dev
```

### Mobile App
```bash
pnpm dev:native       # Start mobile app only
cd apps/native && pnpm dev
```

### Backend
```bash
pnpm dev:server       # Start Convex dev server
pnpm dev:setup        # Setup Convex project
cd packages/backend && pnpm dev
```

---

## Environment Variables

### Required for Web
```env
NEXT_PUBLIC_CONVEX_URL=
CONVEX_DEPLOYMENT_KEY=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
POLAR_WEBHOOK_SECRET=
```

### Required for Mobile
```env
EXPO_PUBLIC_CONVEX_URL=
EXPO_PUBLIC_CONVEX_SITE_URL=
```

### Required for Backend
```env
SITE_URL=
NATIVE_APP_URL=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
GOOGLE_AI_API_KEY=
```

---

## Documentation Files

- `README.md` - Project overview and setup
- `AGENTS.md` - Development guidelines
- `auth-setup.md` - Authentication configuration
- `POLAR_WEBHOOK_SETUP.md` - Polar integration guide
- `STREAMING_IMPLEMENTATION.md` - Real-time streaming details
- `PROJECT_DOCUMENTATION.md` - This file

---

## Support & Resources

- [Convex Documentation](https://docs.convex.dev)
- [Next.js Documentation](https://nextjs.org/docs)
- [Expo Documentation](https://docs.expo.dev)
- [Better Auth Documentation](https://www.better-auth.com/docs)
- [AI SDK Documentation](https://sdk.vercel.ai/docs)
- [Polar Documentation](https://docs.polar.sh)
- [RevenueCat Documentation](https://docs.revenuecat.com)

---

**Project Status:** Active Development
**Version:** 0.1.0
**Last Major Update:** Real-time streaming implementation (Nov 2025)
