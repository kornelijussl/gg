import React from 'react';
import {StyleSheet, View} from 'react-native';

type THeaderProps = {
  children: React.ReactNode;
};

export default function Header({children}: THeaderProps) {
  return <View style={styles.header}>{children}</View>;
}
const styles = StyleSheet.create({
  header: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
