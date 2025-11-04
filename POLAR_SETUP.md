# Polar Payment Integration with Better-Auth

This project uses the Polar Better-Auth adapter for handling payments, subscriptions, and credit purchases on the web platform.

## Features

- **Automatic Customer Creation**: Users are automatically created as Polar customers when they sign up
- **Subscription Management**: Users can subscribe to Pro Monthly or Pro Yearly plans
- **One-Time Purchases**: Users can purchase credit packages without subscribing
- **Customer Portal**: Users can manage their subscriptions and billing through Polar's customer portal
- **Webhook Processing**: Automatic sync of subscription status and credits to user profiles
- **Usage-Based Billing**: Support for tracking usage metrics (optional)

## Setup Instructions

### 1. Configure Polar

1. Create a Polar organization at [polar.sh](https://polar.sh)
2. Create your products in the Polar Dashboard:
   - Pro Monthly subscription
   - Pro Yearly subscription
   - 1000 Credits (one-time purchase)
   - 2500 Credits (one-time purchase)
   - 5000 Credits (one-time purchase)

3. Create an Access Token:
   - Go to Organization Settings > Access Tokens
   - Create a new token with appropriate permissions
   - Copy the token (starts with `polar_at_`)

4. Configure Webhook Endpoint:
   - Go to Organization Settings > Webhooks
   - Add endpoint: `https://yourdomain.com/api/auth/polar/webhooks`
   - Select events: `order.paid`, `subscription.created`, `subscription.updated`
   - Copy the webhook secret (starts with `polar_wh_`)

### 2. Environment Variables

Add these to your `.env` file (or Convex environment):

```bash
# Polar Configuration
POLAR_ACCESS_TOKEN=polar_at_xxxxx
POLAR_SERVER=sandbox  # or "production"
POLAR_WEBHOOK_SECRET=polar_wh_xxxxx

# Product IDs from Polar Dashboard
POLAR_PRODUCT_PRO_MONTHLY=prod_xxxxx
POLAR_PRODUCT_PRO_YEARLY=prod_xxxxx
POLAR_PRODUCT_CREDITS_1000=prod_xxxxx
POLAR_PRODUCT_CREDITS_2500=prod_xxxxx
POLAR_PRODUCT_CREDITS_5000=prod_xxxxx

# Site URLs
SITE_URL=http://localhost:3004  # Change to production URL
```

### 3. Architecture

#### Better-Auth Configuration

The Polar plugin is configured in `packages/backend/convex/lib/betterAuth/createAuth.ts`:

- **Checkout Plugin**: Handles product checkouts with friendly slugs
- **Portal Plugin**: Enables customer portal access
- **Usage Plugin**: Tracks usage metrics
- **Webhooks Plugin**: Processes Polar webhooks with these handlers:
  - `onOrderPaid`: Grants credits for one-time purchases
  - `onSubscriptionCreated`: Creates subscription and grants premium
  - `onSubscriptionUpdated`: Updates subscription status and premium
  - `onCustomerStateChanged`: Tracks customer state changes

#### Data Flow

1. **User Signs Up** → Polar customer created automatically
2. **User Clicks Subscribe** → `authClient.checkout({ slug })` called
3. **User Completes Payment** → Redirected to `/success?checkout_id={CHECKOUT_ID}`
4. **Webhook Received** → Polar sends webhook to `/api/auth/polar/webhooks`
5. **Webhook Processed** → Subscription/credits added to database
6. **Premium Status Synced** → User profile updated with premium status

#### Database Schema

**Subscriptions Table**:

```typescript
{
  userId: Id<"user">,
  platform: "polar" | "revenuecat",
  platformSubscriptionId: string,
  platformProductId: string,
  status: "active" | "canceled" | "expired" | "past_due" | "trialing",
  productKey: "proMonthly" | "proYearly",
  currentPeriodEnd: number,
  // ... other fields
}
```

**Profile Table**:

```typescript
{
  authUserId: string,
  credits: number,
  isPremium: boolean,
  premiumGrantedBy: "manual" | "subscription" | "lifetime",
  // ... other fields
}
```

**Orders Table**:

```typescript
{
  userId: Id<"user">,
  platform: "polar" | "revenuecat",
  platformOrderId: string,
  platformProductId: string,
  amount: number,  // Credits purchased
  status: "paid" | "pending" | "failed" | "refunded",
  // ... other fields
}
```

### 4. Frontend Integration

#### Checkout Flow

```typescript
import { authClient } from "@/lib/auth-client";

// Start checkout
await authClient.checkout({
  slug: "pro-monthly", // or "pro-yearly", "credits-1000", etc.
});
```

#### Customer Portal

```typescript
// Open customer portal
await authClient.customer.portal();

// Get customer state
const { data } = await authClient.customer.state();
```

#### Check User Status

```typescript
import { useUserProfile } from "@/hooks/use-user-profile";

const { isPremium, credits, loading } = useUserProfile();
```

### 5. Webhook Events

The following webhooks are handled:

| Event                    | Action                                   |
| ------------------------ | ---------------------------------------- |
| `order.paid`             | Grant credits for one-time purchases     |
| `subscription.created`   | Create subscription, grant premium       |
| `subscription.updated`   | Update subscription status, sync premium |
| `customer.state.changed` | Log customer state changes               |

### 6. Testing

#### Local Development

1. Start Convex dev:

   ```bash
   cd packages/backend
   npx convex dev
   ```

2. Start web app:

   ```bash
   cd apps/web
   pnpm dev
   ```

3. Use ngrok to expose webhooks:

   ```bash
   ngrok http 3004
   ```

4. Update Polar webhook URL to: `https://your-ngrok-url.ngrok.io/api/auth/polar/webhooks`

#### Testing Webhooks

Use Polar's sandbox environment:

- Set `POLAR_SERVER=sandbox`
- Use test mode products
- Polar provides webhook testing tools in the dashboard

### 7. Production Deployment

1. Set `POLAR_SERVER=production`
2. Use production product IDs
3. Update `SITE_URL` to production domain
4. Configure webhook endpoint in Polar to production URL
5. Ensure all environment variables are set in Convex dashboard

### 8. Security

- Webhook signatures are automatically verified by the Polar plugin
- Customer deletion syncs with Polar when users are deleted
- All checkout sessions require authentication (`authenticatedUsersOnly: true`)

## Common Issues

### Webhook Not Receiving Events

- Verify webhook URL is publicly accessible
- Check webhook secret matches `.env` file
- Look at Convex logs for errors
- Verify webhook is enabled in Polar dashboard

### Customer Already Exists Error

- This is expected on repeat signups
- Polar plugin handles this automatically
- Customer is associated via `externalId` (user ID)

### Credits Not Added

- Check webhook logs in Convex
- Verify product ID matches environment variable
- Ensure `onOrderPaid` webhook is configured
- Check orders table for processed orders

## Resources

- [Polar Better-Auth Docs](https://polar.sh/docs/integrate/sdk/adapters/better-auth)
- [Better-Auth Documentation](https://www.better-auth.com/)
- [Convex Documentation](https://docs.convex.dev/)
