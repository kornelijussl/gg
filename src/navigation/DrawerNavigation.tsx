import React from 'react';

import LobbyScreen from '../screens/LobbyScreen';

import {
  createDrawerNavigator,
  DrawerContentScrollView,
  DrawerItemList,
  DrawerItem,
  // DrawerScreenProps,
} from '@react-navigation/drawer';
import useAuth from '../hooks/useAuth';
import { TRootDrawerParamList } from './navigation';
import { Text } from 'react-native';
import usePlayer from '../hooks/usePlayer';

// END OF THE IMPORTS -----------------------------------------------------------------------------------

const Drawer = createDrawerNavigator<TRootDrawerParamList>();

function CustomDrawerContent(props: any) {
  const { user, signOut } = useAuth();
  const { player } = usePlayer();

  return (
    <DrawerContentScrollView {...props}>
      <Text>{user?.email}</Text>
      <Text>{user?.uid}</Text>
      <Text>Coins: {player?.coins}</Text>
      <DrawerItemList {...props} />
      <DrawerItem label="Atsijungti" onPress={signOut} />
    </DrawerContentScrollView>
  );
}

export default function DrawerNavigation(): JSX.Element {
  return (
    <Drawer.Navigator
      // eslint-disable-next-line react/no-unstable-nested-components
      drawerContent={(props) => <CustomDrawerContent {...props} />}
    >
      <Drawer.Screen name="Lobby" component={LobbyScreen} />
    </Drawer.Navigator>
  );
}
