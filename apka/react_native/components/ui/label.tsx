// app/components/ui/label.tsx
import React from "react";
import { Text, StyleSheet } from "react-native";

interface LabelProps {
  children: React.ReactNode;
}

export const Label: React.FC<LabelProps> = ({ children }) => {
  return <Text style={styles.label}>{children}</Text>;
};

const styles = StyleSheet.create({
  label: {
    fontSize: 14,         // similar to text-sm
    fontWeight: "500",    // similar to font-medium
    marginBottom: 4,      // similar to mb-1
  },
});
