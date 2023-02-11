import Geolocation from '@react-native-community/geolocation';
import {useEffect, useState} from 'react';
import {Alert} from 'react-native';

import {ILatLng} from '../services/firebase/realtimeDatabase/game/gameService';

export default function useLocation() {
  const [usersLatLng, setUsersLatLng] = useState<ILatLng | null>(null);

  // TODO: IMPLEMENT LOGIC TO NOT ALLOW MOCKED LOCATIONS
  // TODO: IF USER IS CURRENTLY MOVING LATEST POSTION SHOULD REFLECT ALONG THE APP LOGIC
  useEffect(() => {
    Geolocation.getCurrentPosition(
      position => {
        const coords = position.coords;
        setUsersLatLng({
          latitude: coords.latitude,
          longitude: coords.longitude,
        });
      },
      error => Alert.alert('Error', JSON.stringify(error)),
      {enableHighAccuracy: true, timeout: 20000, maximumAge: 1000},
    );
  }, []);

  return usersLatLng;
}
