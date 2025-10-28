// hooks/useNavigationOptions.ts
import type { NativeStackNavigationOptions } from "@react-navigation/native-stack";
import { useTheme } from "heroui-native";
import { useMemo } from "react";
import { Platform } from "react-native";

export const useNavigationOptions = () => {
	const { colors } = useTheme();
	return useMemo(() => {
		/**
		 * NOTE
		 * root is needed for base stack navigator
		 * if only defined in the child a white space
		 * will be shown when navigating between screens
		 * when in dark mode
		 */
		const root: NativeStackNavigationOptions = {
			contentStyle: {
				backgroundColor: colors.background,
			},
		};
		/**
		 * these are styles that you want on almost every screen
		 * i know modals may need different styling sometimes
		 * so sometimes you may need to remove something here or add to
		 * route!
		 *
		 * i love this setup!
		 */
		const base: NativeStackNavigationOptions = {
			headerTintColor: colors.foreground,
			headerTitleAlign: "center",
			headerLargeTitleShadowVisible: false,
			headerLargeTitleStyle: {
				color: colors.foreground,
			},

			headerShadowVisible: false,
			contentStyle: { backgroundColor: colors.background },
		};

		return {
			root,
			standard: {
				...base,
				headerStyle: {
					/**
					 * if on liquid glass, trust me use transparent for
					 * header style background color
					 */
					backgroundColor:
						Platform.OS === "ios" ? "transparent" : colors.background,
				},
				headerTransparent: Platform.OS === "ios",
			},
			modal: {
				/**
				 * if you use header
				 */
				...base,
				headerStyle: {
					// backgroundColor: colors.background,
					backgroundColor:
						Platform.OS === "ios" ? "transparent" : colors.background,
				},
			},
		};
	}, [colors]);
};
