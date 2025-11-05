import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
} from "react";
import { StyleSheet } from "react-native";
import type { BottomSheetBackdropProps } from "@gorhom/bottom-sheet";
import { useTheme } from "@react-navigation/native";
import { useThemeColor } from "heroui-native";

interface CustomBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  snapPoints?: string[];
}

export const CustomBottomSheet = forwardRef<
  BottomSheet,
  CustomBottomSheetProps
>(({ isOpen, onClose, children, snapPoints = ["65%"] }, ref) => {
  // const { colors } = useTheme();
  const background = useThemeColor("background");
  const border = useThemeColor("border");

  const bottomSheetRef = useRef<BottomSheet>(null);

  // Expose the ref methods to parent
  useImperativeHandle(ref, () => bottomSheetRef.current as BottomSheet);

  useEffect(() => {
    if (isOpen) {
      bottomSheetRef.current?.expand();
    } else {
      bottomSheetRef.current?.close();
    }
  }, [isOpen]);

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.5}
        pressBehavior="close"
      />
    ),
    []
  );

  const handleSheetChanges = useCallback(
    (index: number) => {
      if (index === -1) {
        onClose();
      }
    },
    [onClose]
  );

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={-1}
      snapPoints={snapPoints}
      enablePanDownToClose
      backdropComponent={renderBackdrop}
      onChange={handleSheetChanges}
      backgroundStyle={{
        backgroundColor: background,
      }}
      handleIndicatorStyle={{
        backgroundColor: border,
        width: 40,
        height: 4,
      }}
      enableDynamicSizing={false}
    >
      <BottomSheetView style={styles.contentContainer}>
        {children}
      </BottomSheetView>
    </BottomSheet>
  );
});

CustomBottomSheet.displayName = "CustomBottomSheet";

const styles = StyleSheet.create({
  contentContainer: {
    flex: 1,
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
});
