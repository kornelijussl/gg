import { Button, ScrollView, StyleSheet } from "react-native";
import React from "react";

import { FirebaseAuthTypes } from "@react-native-firebase/auth";

// HOOKS
import useAuth from "../hooks/useAuth";

// NAVIGATOR TYPES
import {
  TRootDrawerParamList,
  TRootStackParamList,
} from "../navigation/navigation";

// NAVGIATION SCREEN PROP TYPES
import type { CompositeScreenProps } from "@react-navigation/native";
import { DrawerScreenProps } from "@react-navigation/drawer";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import useGeoLocation from "../hooks/useGeolocation";
import MatchQueueService from "../services/firebase/realtimeDatabase/matchQueue/matchQueueService";

// END OF THE IMPORTS -----------------------------------------------------------------------------------

type LobbyScreenProps = CompositeScreenProps<
  DrawerScreenProps<TRootDrawerParamList, "Lobby">,
  NativeStackScreenProps<TRootStackParamList>
>;

export default function LobbyScreen({ navigation }: LobbyScreenProps) {
  // HOOKS 🪝

  const { user } = useAuth();
  const usersLatLng = useGeoLocation();

  // HOOKS ENDS 🪝

  // HANDLERS ✋

  const handleStartMatchMaking = async (
    numberOfPlayers: number,
    radius: number,
    betAmount: number,
  ) => {
    if (usersLatLng) {
      console.log(`Trying to finding pending match..`);

      const pendingMatchID =
        await MatchQueueService.findPendingMatchIdByConditions({
          usersLatLng,
          options: { numberOfPlayers, radius, betAmount },
        });

      // IF THERE IS NO PENDING MATCHES CREATE NEW MATCH AND JOIN IT
      if (!pendingMatchID) {
        console.log(`No pending match found..`);
        console.log(`Trying to create new match..`);
        const matchID = await MatchQueueService.createMatch(
          numberOfPlayers,
          radius,
          betAmount,
        );

        if (matchID) {
          console.log(`Match created, trying to join..`);
          await MatchQueueService.joinMatch(
            user as FirebaseAuthTypes.User,
            matchID,
            usersLatLng,
          );
          console.log(`Match joined..`);
          console.log(`Navigating to QueueScreen..`);
          navigation.navigate("Queue", {
            goingToMatchID: matchID,
            numberOfPlayers,
          });
        }
      }
      // IF THERE IS A PENDING MATCHES JOIN ANY
      else {
        console.log(`Pending match found: ${pendingMatchID}`);
        await MatchQueueService.joinMatch(
          user as FirebaseAuthTypes.User,
          pendingMatchID,
          usersLatLng,
        );
        navigation.navigate("Queue", {
          goingToMatchID: pendingMatchID,
          numberOfPlayers,
        });
      }
    }
  };

  // HANDLERS ENDS ✋

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Button
        onPress={() => handleStartMatchMaking(2, 1000, 10)}
        title="2 Players 1 km Radius"
        color="#841584"
        accessibilityLabel="Learn more about this purple button"
      />
      <Button
        onPress={() => handleStartMatchMaking(3, 5000, 20)}
        title="3 Players 5 km Radius"
        color="#841584"
        accessibilityLabel="Learn more about this purple button"
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "space-evenly",
    alignContent: "center",
  },
});
