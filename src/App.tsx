/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, {useEffect} from 'react';
import 'react-native-gesture-handler';

import {NavigationContainer} from '@react-navigation/native';

import Navigation from './navigation/StackNavigation';

import {requestLocationPermission} from './helpers/reactNativePermissions';

// END OF THE IMPORTS -----------------------------------------------------------------------------------

function App() {
  useEffect(() => {
    requestLocationPermission();
  }, []);

  const isHermes = () => !!global.HermesInternal;
  console.log('>>>>>>>>>>>>>', isHermes());

  return (
    <NavigationContainer>
      <Navigation />
    </NavigationContainer>
  );
}

export default App;
