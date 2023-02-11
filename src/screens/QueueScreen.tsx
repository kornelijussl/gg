import {
  Button,
  StyleSheet,
  ActivityIndicator,
  View,
  Text,
  ImageBackground,
} from 'react-native';
import React, {useEffect, useState} from 'react';
import useAuth from '../hooks/useAuth';
import MatchQueueService from '../services/firebase/realtimeDatabase/matchQueue/matchQueueService';
import {FirebaseAuthTypes} from '@react-native-firebase/auth';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {TRootStackParamList} from '../navigation/navigation';
import useGeoLocation from '../hooks/useGeolocation';
import GameService from '../services/firebase/realtimeDatabase/game/gameService';
import useMatchQueue from '../hooks/useMatchQueue';

// END OF THE IMPORTS -----------------------------------------------------------------------------------

type QueueScreenProps = NativeStackScreenProps<TRootStackParamList, 'Queue'>;

export default function QueueScreen({navigation, route}: QueueScreenProps) {
  // ROUTE PARAMS 🛤️

  const {goingToMatchID, numberOfPlayers} = route.params;

  // HOOKS 🪝

  const [matchIsFulfilled, setIsMatchFulfilled] = useState(false);
  const {user} = useAuth();
  const usersLatLng = useGeoLocation();
  const numberOfPlayersInTheQueue = useMatchQueue({matchID: goingToMatchID});

  // HOOKS ENDS 🪝

  // LIFECYCLE ♻️

  useEffect(() => {
    const subscriptionCallBack =
      MatchQueueService.subscribeToFulfilledDataChangeInMatchQueue(
        goingToMatchID,
        (fulfilled: boolean) => {
          setIsMatchFulfilled(fulfilled);
        },
      );

    return MatchQueueService.unsubscribeToFulfilledDataChangeInMatchQueue(
      goingToMatchID,
      subscriptionCallBack,
    );
  }, [goingToMatchID, navigation, user]);

  useEffect(() => {
    (async () => {
      if (numberOfPlayersInTheQueue === numberOfPlayers) {
        await MatchQueueService.fulfillMatchInMatchQueue(goingToMatchID);
      }
    })();
  }, [goingToMatchID, numberOfPlayers, numberOfPlayersInTheQueue]);

  useEffect(() => {
    (async () => {
      if (matchIsFulfilled && numberOfPlayersInTheQueue !== numberOfPlayers) {
        await MatchQueueService.unfulfillMatchInMatchQueue(goingToMatchID);
      }
    })();
  }, [
    goingToMatchID,
    matchIsFulfilled,
    numberOfPlayers,
    numberOfPlayersInTheQueue,
  ]);

  // LIFECYCLE ENDS ♻️

  // HANDLERS ✋

  const handleLeaveMatchMaking = async () => {
    await MatchQueueService.leaveMatchMaking(
      user as FirebaseAuthTypes.User,
      goingToMatchID,
    );
    navigation.goBack();
  };

  const handleReadyToPlay = async () => {
    if (matchIsFulfilled && usersLatLng) {
      const pendingGameID = await GameService.getGameIDByMatchID(
        goingToMatchID,
      );
      if (!pendingGameID) {
        const gameID = await GameService.createGame(goingToMatchID);
        await GameService.joinGame(
          user as FirebaseAuthTypes.User,
          gameID,
          usersLatLng,
        );
        navigation.navigate('Game', {
          matchID: goingToMatchID,
          gameID,
          gameOptions: {
            numberOfPlayers,
          },
          matchQueueData: {
            numberOfPlayersInTheQueue,
          },
        });
      } else {
        await GameService.joinGame(
          user as FirebaseAuthTypes.User,
          pendingGameID,
          usersLatLng,
        );
        navigation.navigate('Game', {
          matchID: goingToMatchID,
          gameID: pendingGameID,
          gameOptions: {
            numberOfPlayers,
          },
          matchQueueData: {
            numberOfPlayersInTheQueue,
          },
        });
      }
    }
  };

  // HANDLERS ENDS ✋

  return (
    <View style={styles.container}>
      <ImageBackground
        style={styles.imageBackground}
        resizeMode="cover"
        source={require('../assets/queueLoadingBackground.jpg')}>
        <View style={styles.tmp}>
          <Text>{`${numberOfPlayersInTheQueue} / ${numberOfPlayers} players in the queue...`}</Text>
          <ActivityIndicator size="large" />
          <Button
            disabled={!matchIsFulfilled}
            onPress={handleReadyToPlay}
            title="Ready"
            color="#841584"
            accessibilityLabel="Learn more about this purple button"
          />
          <Button
            onPress={handleLeaveMatchMaking}
            title="Cancel"
            color="#841584"
            accessibilityLabel="Learn more about this purple button"
          />
        </View>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
  },
  imageBackground: {
    flex: 1,
    justifyContent: 'center',
  },
  tmp: {
    alignItems: 'center',
  },
});
