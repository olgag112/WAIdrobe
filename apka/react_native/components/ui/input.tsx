// app/components/ui/input.tsx
import React from "react";
import { TextInput, StyleSheet, TextInputProps } from "react-native";

export const Input: React.FC<TextInputProps> = (props) => {
  return <TextInput style={styles.input} {...props} />;
};

const styles = StyleSheet.create({
  input: {
    width: "100%",           // similar to w-full
    borderWidth: 1,          // border
    borderColor: "#D1D5DB",  // Tailwind gray-300
    borderRadius: 6,         // rounded
    paddingHorizontal: 8,    // px-2
    paddingVertical: 4,      // py-1
  },
});
