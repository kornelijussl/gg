import React, {useEffect} from 'react';

import {createNativeStackNavigator} from '@react-navigation/native-stack';

// SCREENS
import LoginScreen from '../screens/LoginScreen';
import SplashScreen from '../screens/SplashScreen';
import RegisterScreen from '../screens/RegisterScreen';

// HOOKS
import useAuth from '../hooks/useAuth';
import DrawerNavigation from './DrawerNavigation';
import QueueScreen from '../screens/QueueScreen';
import GameScreen from '../screens/GameScreen';
import {TRootStackParamList} from './navigation';

import AsyncStorage from '@react-native-async-storage/async-storage';
import {useNavigation} from '@react-navigation/native';

// END OF THE IMPORTS -----------------------------------------------------------------------------------

const Stack = createNativeStackNavigator<TRootStackParamList>();

export default function Navigation() {
  const navigation = useNavigation();

  const {user, isAuthLoading} = useAuth();

  const isSignedIn = user !== null;

  const cleanAsyncStorage = async () => {
    const keys = [
      'currentlyRunningGameRouteParams',
      'currentlyRunningGameState',
    ];
    try {
      await AsyncStorage.multiRemove(keys);
    } catch (e) {
      // remove error
    }
  };

  useEffect(() => {
    (async () => {
      try {
        let currentlyRunningGameRouteParams = {};

        const currentlyRunningGameRouteParamsItem = await AsyncStorage.getItem(
          'currentlyRunningGameRouteParams',
        );
        if (currentlyRunningGameRouteParamsItem !== null) {
          currentlyRunningGameRouteParams = JSON.parse(
            currentlyRunningGameRouteParamsItem,
          );
          console.log(`restoring route params`);

          navigation.navigate('Game', {...currentlyRunningGameRouteParams});
        }
      } catch (e) {
        console.error(e);
      }
    })();
  }, [navigation]);

  if (isAuthLoading) {
    return <SplashScreen />;
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}>
      {isSignedIn ? (
        <>
          <Stack.Screen name="DrawerNavigation" component={DrawerNavigation} />
          <Stack.Screen name="Queue" component={QueueScreen} />
          <Stack.Screen name="Game" component={GameScreen} />
        </>
      ) : (
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}
