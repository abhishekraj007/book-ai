import React, { createContext, useContext, useEffect, useState } from "react";
import Purchases, {
  CustomerInfo,
  PurchasesPackage,
  PurchasesStoreProduct,
} from "react-native-purchases";
import RevenueCatUI, { PAYWALL_RESULT } from "react-native-purchases-ui";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { api } from "@convex-starter/backend";
import { getAPIKey } from "@/utils/payment";

interface PurchasesContextType {
  customerInfo: CustomerInfo | null;
  packages: PurchasesPackage[];
  subscriptionPackages: PurchasesPackage[];
  creditPackages: PurchasesStoreProduct[];
  isLoading: boolean;
  purchasePackage: (pkg: PurchasesPackage) => Promise<boolean>;
  restorePurchases: () => Promise<void>;
  presentPaywall: () => Promise<void>;
}

const PurchasesContext = createContext<PurchasesContextType | undefined>(
  undefined
);

export function PurchasesProvider({ children }: { children: React.ReactNode }) {
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [packages, setPackages] = useState<PurchasesPackage[]>([]);
  const [subscriptionPackages, setSubscriptionPackages] = useState<
    PurchasesPackage[]
  >([]);
  const [creditPackages, setCreditPackages] = useState<PurchasesStoreProduct[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  const { isAuthenticated } = useConvexAuth();
  const userAndProfile = useQuery(
    api.user.fetchUserAndProfile,
    isAuthenticated ? {} : "skip"
  );

  const addCredits = useMutation(api.purchases.addCredits);
  const upgradeToPremium = useMutation(api.purchases.upgradeToPremium);

  useEffect(() => {
    // console.log("customerInfo changed:", JSON.stringify(customerInfo, null, 2));
  }, [customerInfo]);

  // Initialize RevenueCat once on mount (anonymously)
  useEffect(() => {
    if (!isInitialized) {
      initializePurchases();
    }
  }, [isInitialized]);

  // Log in to RevenueCat when user authenticates
  useEffect(() => {
    const loginToRevenueCat = async () => {
      if (
        isAuthenticated &&
        userAndProfile?.userMetadata?._id &&
        isInitialized
      ) {
        try {
          const userId = userAndProfile.userMetadata._id;
          console.log("revenuecat-> Logging in user:", userId);

          const { customerInfo: info } = await Purchases.logIn(userId);
          setCustomerInfo(info);

          console.log("revenuecat-> User logged in successfully");
        } catch (error) {
          console.error("Error logging in to RevenueCat:", error);
        }
      }
    };

    loginToRevenueCat();
    getSubscriptions();

    getProducts();
  }, [isAuthenticated, userAndProfile, isInitialized]);

  const initializePurchases = async () => {
    try {
      const apiKey = getAPIKey();

      console.log("revenuecat-> Configuring SDK anonymously");

      // Configure RevenueCat without a user ID (creates anonymous ID)
      await Purchases.configure({ apiKey });

      const info = await Purchases.getCustomerInfo();
      setCustomerInfo(info);

      setIsInitialized(true);
      console.log("revenuecat-> Initialized successfully with anonymous ID");
    } catch (error) {
      console.error("Error initializing purchases:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getSubscriptions = async () => {
    const offerings = await Purchases.getOfferings();

    // console.log(
    //   "revenuecat-> Fetched offerings:",
    //   JSON.stringify(offerings, null, 2)
    // );

    if (offerings.current) {
      const allPackages = offerings.current.availablePackages;
      setPackages(allPackages);

      // Separate subscription packages from consumable (credit) packages
      const subscriptions = allPackages.filter(
        (pkg) =>
          pkg.product.productType === "AUTO_RENEWABLE_SUBSCRIPTION" ||
          pkg.product.productCategory === "SUBSCRIPTION"
      );

      setSubscriptionPackages(subscriptions);
    }
  };

  const getProducts = async () => {
    console.log("fetching revenue products...");
    const CREDIT_OPTIONS = [
      { id: "credits_1000", amount: 1000, popular: false },
      { id: "credits_2500", amount: 2500, popular: true },
      { id: "credits_5000", amount: 5000, popular: false },
    ];

    const products = await Purchases.getProducts(
      CREDIT_OPTIONS.map((option) => option.id),
      Purchases.PRODUCT_CATEGORY.NON_SUBSCRIPTION
    );

    setCreditPackages(products);

    console.log(
      "revenuecat-> Fetched products:",
      JSON.stringify(products, null, 2)
    );

    return products;
  };

  const purchasePackage = async (pkg: PurchasesPackage): Promise<boolean> => {
    try {
      const { customerInfo: info } = await Purchases.purchasePackage(pkg);
      setCustomerInfo(info);

      // Handle different product types
      const productId = pkg.product.identifier;

      if (productId.includes("premium")) {
        // Premium subscription
        const expiresAt = info.entitlements.active["premium"]?.expirationDate;
        await upgradeToPremium({
          expiresAt: expiresAt ? new Date(expiresAt).getTime() : undefined,
        });
      } else if (productId.includes("credits")) {
        // Credits purchase
        const creditsAmount = parseInt(productId.match(/\d+/)?.[0] || "0", 10);
        await addCredits({ amount: creditsAmount });
      }

      return true;
    } catch (error) {
      console.error("Error purchasing package:", error);
      return false;
    }
  };

  const restorePurchases = async () => {
    try {
      const info = await Purchases.restorePurchases();
      setCustomerInfo(info);

      // Check if user has active premium subscription
      if (info.entitlements.active["premium"]) {
        const expiresAt = info.entitlements.active["premium"].expirationDate;
        await upgradeToPremium({
          expiresAt: expiresAt ? new Date(expiresAt).getTime() : undefined,
        });
      }
    } catch (error) {
      console.error("Error restoring purchases:", error);
    }
  };

  const presentPaywall = async () => {
    try {
      console.log("[RevenueCat] Presenting paywall...");

      // Present RevenueCat's native paywall UI
      const paywallResult: PAYWALL_RESULT = await RevenueCatUI.presentPaywall();

      console.log("[RevenueCat] Paywall result:", paywallResult);

      switch (paywallResult) {
        case PAYWALL_RESULT.PURCHASED:
        case PAYWALL_RESULT.RESTORED:
          console.log(
            "[RevenueCat] Purchase successful, refreshing customer info..."
          );
          // Refresh customer info after successful purchase
          const info = await Purchases.getCustomerInfo();
          setCustomerInfo(info);
          console.log("[RevenueCat] Customer info:", {
            activeEntitlements: Object.keys(info.entitlements.active),
            allEntitlements: Object.keys(info.entitlements.all),
          });

          // Check if user now has premium
          if (info.entitlements.active["premium"]) {
            const expiresAt =
              info.entitlements.active["premium"].expirationDate;
            console.log(
              "[RevenueCat] Premium entitlement found, syncing with backend..."
            );
            await upgradeToPremium({
              expiresAt: expiresAt ? new Date(expiresAt).getTime() : undefined,
            });
            console.log("[RevenueCat] Backend sync complete");
          } else {
            console.warn(
              "[RevenueCat] No premium entitlement found after purchase"
            );
          }
          break;

        case PAYWALL_RESULT.CANCELLED:
          console.log("[RevenueCat] User cancelled the paywall");
          break;

        case PAYWALL_RESULT.NOT_PRESENTED:
          console.warn(
            "[RevenueCat] Paywall was not presented - user may already have access"
          );
          break;

        case PAYWALL_RESULT.ERROR:
          console.error("[RevenueCat] Error presenting paywall");
          break;

        default:
          console.warn("[RevenueCat] Unknown paywall result:", paywallResult);
      }
    } catch (error) {
      console.error("[RevenueCat] Error presenting paywall:", error);
      if (error instanceof Error) {
        console.error("[RevenueCat] Error details:", {
          message: error.message,
          name: error.name,
          stack: error.stack,
        });
      }
    }
  };

  return (
    <PurchasesContext.Provider
      value={{
        customerInfo,
        packages,
        subscriptionPackages,
        creditPackages,
        isLoading,
        purchasePackage,
        restorePurchases,
        presentPaywall,
      }}
    >
      {children}
    </PurchasesContext.Provider>
  );
}

export function usePurchases() {
  const context = useContext(PurchasesContext);
  if (!context) {
    throw new Error("usePurchases must be used within PurchasesProvider");
  }
  return context;
}
