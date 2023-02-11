import React from 'react';
import {StyleSheet, View} from 'react-native';

type TFooterProps = {
  children: React.ReactNode;
};

export default function Footer({children}: TFooterProps) {
  return <View style={styles.buttonContainer}>{children}</View>;
}
const styles = StyleSheet.create({
  buttonContainer: {
    flex: 1,
    justifyContent: 'space-evenly',
    alignItems: 'center',
  },
});
