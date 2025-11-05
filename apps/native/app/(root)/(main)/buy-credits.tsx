import { Button, Spinner, useThemeColor } from "heroui-native";
import { useState } from "react";
import { ScrollView, Text, View, Pressable } from "react-native";
import { Coins, Check } from "lucide-react-native";
import { usePurchases } from "@/contexts/purchases-context";
import { useRouter } from "expo-router";
import Purchases, { PurchasesStoreProduct } from "react-native-purchases";

const CREDIT_OPTIONS = [
  { amount: 1000, popular: false },
  { amount: 2000, popular: true },
  { amount: 3000, popular: false },
];

/**
 * 
 * @returns 
 * [
  {
    "identifier": "credits_5000",
    "description": "",
    "discounts": [],
    "priceString": "$39.00",
    "introPrice": null,
    "currencyCode": "INR",
    "price": 39,
    "productCategory": "NON_SUBSCRIPTION",
    "productType": "CONSUMABLE",
    "subscriptionPeriod": null,
    "title": "5000 Credits"
  },
  {
    "identifier": "credits_2500",
    "title": "2500 Credits",
    "discounts": [],
    "productCategory": "NON_SUBSCRIPTION",
    "productType": "CONSUMABLE",
    "introPrice": null,
    "description": "",
    "price": 19,
    "priceString": "$19.00",
    "subscriptionPeriod": null,
    "currencyCode": "INR"
  },
  {
    "currencyCode": "INR",
    "introPrice": null,
    "price": 9,
    "productCategory": "NON_SUBSCRIPTION",
    "discounts": [],
    "description": "",
    "productType": "CONSUMABLE",
    "subscriptionPeriod": null,
    "identifier": "credits_1000",
    "title": "1000 Credits",
    "priceString": "$9.00"
  }
]

 */

export default function BuyCreditsScreen() {
  //   const { colors } = useTheme();
  const accentColor = useThemeColor("accent");
  const surfaceColor = useThemeColor("surface");
  const foregroundColor = useThemeColor("foreground");
  const mutedColor = useThemeColor("muted");

  const router = useRouter();
  const { creditPackages, purchasePackage, isLoading } = usePurchases();
  const [selectedProduct, setSelectedProduct] =
    useState<PurchasesStoreProduct>();
  const [isPurchasing, setIsPurchasing] = useState(false);

  const handlePurchase = async () => {
    if (!selectedProduct) return;

    try {
      setIsPurchasing(true);

      const { customerInfo } =
        await Purchases.purchaseStoreProduct(selectedProduct);
      router.back();
    } catch (error) {
      console.log("Purchase error:", error);
    } finally {
      setIsPurchasing(false);
    }
  };

  //   const getPackageForAmount = (amount: number) => {
  //     return creditPackages.find((pkg) =>
  //       pkg.product.identifier.includes(`credits_${amount}`)
  //     );
  //   };

  return (
    <View className="flex-1 bg-background">
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 24 }}
      >
        <View className="gap-6">
          <View className="items-center gap-3">
            <View
              className="w-20 h-20 rounded-full items-center justify-center"
              style={{ backgroundColor: accentColor }}
            >
              <Coins size={40} color={accentColor} />
            </View>
            <Text className="text-3xl font-bold text-foreground">
              Buy Credits
            </Text>
            <Text className="text-center text-muted-foreground text-base">
              Choose a credit package to continue
            </Text>
          </View>

          {isLoading ? (
            <View className="py-8 items-center">
              <Spinner />
            </View>
          ) : (
            <View className="gap-4">
              {creditPackages.map((option) => {
                // const pkg = getPackageForAmount(option.amount);
                const isSelected = selectedProduct?.price === option.price;

                return (
                  <Pressable
                    key={option.identifier}
                    onPress={() => setSelectedProduct(option)}
                    // disabled={!option}
                  >
                    <View
                      className="p-5 rounded-2xl border-2 relative"
                      style={{
                        backgroundColor: isSelected
                          ? accentColor
                          : surfaceColor,
                        // borderColor: isSelected ? accentColor : colors.border,
                      }}
                    >
                      {/* {option.popular && (
                        <View
                          className="absolute -top-3 right-4 px-3 py-1 rounded-full"
                          style={{ backgroundColor: accentColor }}
                        >
                          <Text className="text-xs font-bold text-accent-foreground">
                            POPULAR
                          </Text>
                        </View>
                      )} */}

                      <View className="flex-row items-center justify-between">
                        <View className="gap-2 flex-1">
                          <Text
                            className="text-2xl font-bold"
                            style={{
                              color: isSelected
                                ? foregroundColor
                                : foregroundColor,
                            }}
                          >
                            {option.title}
                          </Text>
                          {option && (
                            <Text
                              className="text-base font-semibold"
                              style={{
                                color: isSelected ? accentColor : mutedColor,
                              }}
                            >
                              {option.priceString}
                            </Text>
                          )}
                        </View>

                        <View
                          className="w-8 h-8 rounded-full border-2 items-center justify-center"
                          style={{
                            // borderColor: isSelected
                            //   ? accentColor
                            //   : colors.border,
                            backgroundColor: isSelected
                              ? accentColor
                              : "transparent",
                          }}
                        >
                          {isSelected && (
                            <Check
                              size={18}
                              color={accentColor}
                              strokeWidth={3}
                            />
                          )}
                        </View>
                      </View>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          )}

          <View className="gap-3 mt-4">
            <Button
              variant="primary"
              size="lg"
              onPress={handlePurchase}
              isDisabled={!selectedProduct || isPurchasing}
              className="w-full"
            >
              {isPurchasing ? (
                <View className="flex-row items-center gap-2">
                  <Spinner size="sm" color={accentColor} />
                  <Text className="text-accent-foreground font-semibold text-base">
                    Processing...
                  </Text>
                </View>
              ) : (
                <Text className="text-accent-foreground font-semibold text-base">
                  {selectedProduct
                    ? `Buy ${selectedProduct.title}`
                    : "Select a Package"}
                </Text>
              )}
            </Button>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
