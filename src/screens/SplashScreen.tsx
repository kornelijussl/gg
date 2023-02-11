import {StyleSheet, View, Animated} from 'react-native';
import React, {useEffect, useRef} from 'react';

// END OF THE IMPORTS -----------------------------------------------------------------------------------

export default function SplashScreen() {
  const widthAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(widthAnimation, {
      toValue: 300,
      duration: 1500,
      useNativeDriver: false,
    }).start();
  }, [widthAnimation]);

  return (
    <View style={styles.container}>
      <Animated.Image
        resizeMode="contain"
        style={[styles.logo, {width: widthAnimation}]}
        source={require('../assets/logo.png')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'steelblue',
  },
  logo: {
    width: '100%',
  },
});
