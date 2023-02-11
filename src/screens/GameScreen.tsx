import {Alert, AppState, Button, StyleSheet, Text, View} from 'react-native';
import React, {useEffect, useRef, useState} from 'react';

import Geolocation from '@react-native-community/geolocation';

import MapView, {Marker, PROVIDER_GOOGLE} from 'react-native-maps';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {TRootStackParamList} from '../navigation/navigation';
import GameService, {
  ILatLng,
  IPlayer,
} from '../services/firebase/realtimeDatabase/game/gameService';
import useAuth from '../hooks/useAuth';
import {FirebaseAuthTypes} from '@react-native-firebase/auth';
import GameServiceUtils from '../services/firebase/realtimeDatabase/game/gameServiceUtils';
import MatchQueueService from '../services/firebase/realtimeDatabase/matchQueue/matchQueueService';
import {CountdownCircleTimer} from 'react-native-countdown-circle-timer';
import useMatchQueue from '../hooks/useMatchQueue';
import PlayersScoreboard from '../components/game/PlayersScoreboard';
import AsyncStorage from '@react-native-async-storage/async-storage';

// END OF THE IMPORTS -----------------------------------------------------------------------------------

type GameScreenProps = NativeStackScreenProps<TRootStackParamList, 'Game'>;

interface IRegion {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

interface ICurrentlyRunningGameState {
  numberOfJoinedPlayersInGame: number;
  opponents: IPlayer | null;
  allPlayersJoinedGame: boolean;
  matchStarted: boolean;
  initialRegion: IRegion;
  rewardLocation: ILatLng | null;
}

interface ICurrentlyRunningGameParams {
  matchID: string;
  gameID: string;
  gameOptions: {
    numberOfPlayers: number;
  };
  matchQueueData: {
    numberOfPlayersInTheQueue: number;
  };
}

interface IPlayerMarkers {
  [index: number]: {
    src: any;
  };
}

export default function GameScreen({navigation, route}: GameScreenProps) {
  // ROUTE PARAMS 🛤️

  const {matchID, gameOptions} = route.params;

  // HOOKS 🪝

  const [currentlyRunningGameID, setCurrentlyRunningGameID] = useState<
    string | null
  >(null);
  const [numberOfJoinedPlayersInGame, setNumberOfJoinedPlayersInGame] =
    useState(0);
  const [opponents, setOpponents] = useState<IPlayer | null>(null);
  const [allPlayersJoinedGame, setAllPlayersJoinedGame] = useState(false);
  const [matchStarted, setMatchStarted] = useState(false);
  const [initialRegion, setIntialRegion] = useState<IRegion>({
    latitude: 0,
    longitude: 0,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });
  const [rewardLocation, setRewardLocation] = useState<ILatLng | null>(null);

  const mapViewRef = useRef<MapView>(null);

  const {user} = useAuth();
  const numberOfPlayersInTheQueue = useMatchQueue({matchID});
  const appState = useRef(AppState.currentState);

  // HOOKS ENDS 🪝

  // LIFECYCLE ♻️

  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        (async () => {
          try {
            await AsyncStorage.removeItem('currentlyRunningGameID');
          } catch (e) {
            // remove error
          }
        })();
      }

      appState.current = nextAppState;
      console.log('AppState', appState.current);

      if (appState.current === 'background' && currentlyRunningGameID) {
        (async () => {
          try {
            const currentlyRunningGameRouteParams = {
              matchID,
              gameID: currentlyRunningGameID,
              gameOptions,
              matchQueueData: {
                numberOfPlayersInTheQueue,
              },
            };

            console.log(
              `saving route params ${currentlyRunningGameRouteParams}`,
            );

            await AsyncStorage.setItem(
              'currentlyRunningGameRouteParams',
              JSON.stringify(currentlyRunningGameRouteParams),
            );
          } catch (e) {
            console.error(e);
          }
        })();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [currentlyRunningGameID, gameOptions, matchID, numberOfPlayersInTheQueue]);

  React.useEffect(
    () =>
      navigation.addListener('beforeRemove', e => {
        // Prevent default behavior of leaving the screen
        e.preventDefault();

        // Prompt the user before leaving the screen
        Alert.alert(
          'Discard changes?',
          'You have unsaved changes. Are you sure to discard them and leave the screen?',
          [
            {text: "Don't leave", style: 'cancel', onPress: () => {}},
            {
              text: 'Discard',
              style: 'destructive',
              // If the user confirmed, then we dispatch the action we blocked earlier
              // This will continue the action that had triggered the removal of the screen
              onPress: () => navigation.dispatch(e.data.action),
            },
          ],
        );
      }),
    [navigation],
  );

  useEffect(() => {
    (async () => {
      if (currentlyRunningGameID) {
        const gameStatus = await GameService.getGameStatus(
          currentlyRunningGameID,
        );

        setMatchStarted(gameStatus.started);
      }
    })();
  }, [currentlyRunningGameID]);

  useEffect(() => {
    (async () => {
      if (currentlyRunningGameID && matchStarted) {
        const existingRewardLocation = await GameService.getRewardLocation(
          currentlyRunningGameID,
        );

        if (existingRewardLocation) {
          setRewardLocation(existingRewardLocation);
          return;
        }

        const calculatedRewardLocation =
          await GameService.calculateRewardLocation(
            currentlyRunningGameID as string,
          );
        if (!rewardLocation && calculatedRewardLocation) {
          setRewardLocation(calculatedRewardLocation);
          await GameService.setRewardLocation(
            currentlyRunningGameID,
            calculatedRewardLocation,
          );
        }
      }
    })();
  }, [currentlyRunningGameID, matchStarted, rewardLocation]);

  useEffect(() => {
    (async () => {
      const gameID = await GameService.getGameIDByMatchID(matchID);
      setCurrentlyRunningGameID(gameID);
    })();
  }, [matchID]);

  useEffect(() => {
    if (currentlyRunningGameID) {
      const subscriptionCallBack =
        GameService.subscribeToPlayersDataChangeInGame(
          currentlyRunningGameID,
          players => {
            const numberOfPlayersInGame = Object.keys(players).length;

            setNumberOfJoinedPlayersInGame(numberOfPlayersInGame);

            setOpponents(
              GameServiceUtils.findOpponents(
                user as FirebaseAuthTypes.User,
                players,
              ),
            );

            if (numberOfPlayersInGame === gameOptions?.numberOfPlayers) {
              setTimeout(() => {
                setAllPlayersJoinedGame(true);
              }, 0);
            }
          },
        );

      return GameService.unsubscribeToPlayersDataChangeInMatchQueue(
        currentlyRunningGameID,
        subscriptionCallBack,
      );
    }
  }, [currentlyRunningGameID, gameOptions?.numberOfPlayers, user]);

  React.useEffect(() => {
    const watchID = Geolocation.watchPosition(async position => {
      const {longitude, latitude} = position.coords;
      if (currentlyRunningGameID) {
        await GameService.updateGamePlayerCoordinates(
          user as FirebaseAuthTypes.User,
          currentlyRunningGameID as string,
          {
            longitude,
            latitude,
          },
        );
      }
    });

    return () => Geolocation.clearWatch(watchID);
  }, [currentlyRunningGameID, user]);

  useEffect(() => {
    (async () => {
      if (user) {
        const initialPlayerCoordinates =
          await MatchQueueService.getMatchQueuePlayerCoordinates(
            user.uid,
            matchID,
          );
        if (initialPlayerCoordinates) {
          setIntialRegion({
            latitude: initialPlayerCoordinates.latitude,
            longitude: initialPlayerCoordinates.longitude,
            latitudeDelta: 0.0922,
            longitudeDelta: 0.0421,
          });
        }
      }
    })();
  }, [matchID, user]);

  // LIFECYCLE ENDS ♻️

  // EVENT HANDLERS ✋

  const handleLeaveGame = async () => {
    navigation.replace('DrawerNavigation');
    if (currentlyRunningGameID) {
      await GameService.leaveGame(
        user as FirebaseAuthTypes.User,
        currentlyRunningGameID,
      );

      await AsyncStorage.removeItem('currentlyRunningGameID');
    }
  };

  // EVENT HANDLERS ENDS ✋

  // MISC 🎩

  const playerMarkers: IPlayerMarkers = {
    0: {
      src: require('../assets/gameMapMarkers/bluePlayerMarker.png'),
    },
    1: {
      src: require('../assets/gameMapMarkers/blackPlayerMarker.png'),
    },
    2: {
      src: require('../assets/gameMapMarkers/redPlayerMarker.png'),
    },
  };

  // MISC ENDS 🎩

  return (
    <View style={styles.container}>
      <MapView
        ref={mapViewRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        region={initialRegion}
        showsUserLocation={true}
        showsMyLocationButton={true}
        followsUserLocation={true}
        userLocationUpdateInterval={1}
        userLocationFastestInterval={1}>
        {opponents &&
          Object.keys(opponents).map((opponentUID: string, index: number) => {
            return (
              <Marker
                image={playerMarkers[index].src}
                key={index}
                coordinate={{
                  latitude: opponents[opponentUID].coordinates.latitude,
                  longitude: opponents[opponentUID].coordinates.longitude,
                }}
                title={opponentUID}
                description={opponentUID}
              />
            );
          })}
        {rewardLocation && (
          <Marker
            image={require('../assets/gameMapMarkers/rewardChest.png')}
            coordinate={{
              latitude: rewardLocation?.latitude as number,
              longitude: rewardLocation?.longitude as number,
            }}
            title={'reward'}
            description={'reward'}
          />
        )}
      </MapView>
      <PlayersScoreboard
        gameOptions={gameOptions}
        numberOfJoinedPlayersInGame={numberOfJoinedPlayersInGame}
      />
      <Text>{`${numberOfPlayersInTheQueue} / ${gameOptions?.numberOfPlayers} players in the queue...`}</Text>
      {matchStarted && (
        <Button
          onPress={handleLeaveGame}
          title="Leave Game!"
          color="#841584"
          accessibilityLabel="Learn more about this purple button"
        />
      )}

      {allPlayersJoinedGame && !matchStarted && (
        <CountdownCircleTimer
          onComplete={() => {
            setMatchStarted(true);
            (async () => {
              if (currentlyRunningGameID) {
                GameService.updateGameStartedStatus(
                  currentlyRunningGameID,
                  true,
                );
              }
            })();
          }}
          isPlaying
          duration={10}
          colors={['#004777', '#F7B801', '#A30000', '#A30000']}
          colorsTime={[7, 5, 2, 0]}>
          {({remainingTime}) => <Text>{remainingTime}</Text>}
        </CountdownCircleTimer>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    height: 400,
    width: '100%',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
});
