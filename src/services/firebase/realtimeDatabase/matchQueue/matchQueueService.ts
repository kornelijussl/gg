import { FirebaseAuthTypes } from "@react-native-firebase/auth";
import { firebase } from "@react-native-firebase/database";

import uuid from "react-native-uuid";
import { ILatLng, IPlayer, IPlayers } from "../game/gameService";
import MatchQueueServiceUtils from "./matchQueueServiceUtils";

// END OF THE IMPORTS -----------------------------------------------------------------------------------

export type { IMatch, IMatches, IMatchMakingOptions };

export const emulatorMatchesQueueDatabaseURL =
  "http://10.0.2.2:9000/?ns=georacer-f3502-match-queue";
export const cloudDatabaseURL =
  "https://georacer-f3502-match-queue.europe-west1.firebasedatabase.app/";

interface IMatch {
  creationTime: Date;
  fulfilled: boolean;
  numberOfPlayers: number;
  radius: number;
  players?: object;
  betAmount: number;
}

interface IMatches {
  [key: string]: IMatch;
}

interface IMatchMakingOptions {
  numberOfPlayers: number;
  radius: number;
  betAmount: number;
}

export default class MatchQueueService {
  static getAllMatches = async (): Promise<IMatches | null> => {
    const matchesDataSnapshot = await firebase
      .app()
      .database(emulatorMatchesQueueDatabaseURL)
      .ref("/")
      .once("value");

    if (matchesDataSnapshot.exists()) {
      return matchesDataSnapshot.val();
    }
    return null;
  };

  static leaveMatchMaking = async (
    user: FirebaseAuthTypes.User,
    matchID: string,
  ) => {
    // TODO: REFERENCE COULD BE PLAYERS
    const matchPlayersDataSnapshot = await firebase
      .app()
      .database(emulatorMatchesQueueDatabaseURL)
      .ref(`/${matchID}/players`)
      .once("value");

    if (matchPlayersDataSnapshot.exists()) {
      const matchPlayersData: IPlayer = matchPlayersDataSnapshot.val();

      const filteredPlayers = Object.fromEntries(
        Object.entries(matchPlayersData).filter(
          ([playerUID]) => !playerUID.includes(user.uid),
        ),
      );

      await firebase
        .app()
        .database(emulatorMatchesQueueDatabaseURL)
        .ref(`/${matchID}`)
        .update({
          players: filteredPlayers,
        });
    } else {
      throw "match does not exist";
    }
  };

  static subscribeToFulfilledDataChangeInMatchQueue = (
    matchID: string,
    callBack: (fulfilled: boolean) => void,
  ) => {
    const subscriptionCallBack = firebase
      .app()
      .database(emulatorMatchesQueueDatabaseURL)
      .ref(`/${matchID}/fulfilled`)
      .on("value", (snapshot) => {
        if (snapshot.exists()) {
          const fulfiled: boolean = snapshot.val();

          callBack(fulfiled);
        }
      });

    return subscriptionCallBack;
  };

  static unsubscribeToFulfilledDataChangeInMatchQueue = (
    matchID: string,
    subscriptionCallBack: any,
  ) => {
    return () =>
      firebase
        .app()
        .database(emulatorMatchesQueueDatabaseURL)
        .ref(`/${matchID}/fulfilled`)
        .off("value", subscriptionCallBack);
  };

  static subscribeToPlayersDataChangeInMatchQueue = (
    matchID: string,
    callBack: (numberOfPlayersInMatchQueue: number) => void,
  ) => {
    const subscriptionCallBack = firebase
      .app()
      .database(emulatorMatchesQueueDatabaseURL)
      .ref(`/${matchID}/players`)
      .on("value", (snapshot) => {
        if (snapshot.exists()) {
          const players: IPlayer = snapshot.val();

          const numberOfPlayersInMatchQueue = Object.keys(players).length;
          callBack(numberOfPlayersInMatchQueue);
        }
      });

    return subscriptionCallBack;
  };

  static unsubscribeToPlayersDataChangeInMatchQueue = (
    matchID: string,
    subscriptionCallBack: any,
  ) => {
    return () =>
      firebase
        .app()
        .database(emulatorMatchesQueueDatabaseURL)
        .ref(`/${matchID}/players`)
        .off("value", subscriptionCallBack);
  };

  static deleteMatch = async (matchId: any) => {
    await firebase
      .app()
      .database(emulatorMatchesQueueDatabaseURL)
      .ref(`/${matchId}`)
      .remove();
  };

  static createMatch = async (
    numberOfPlayers: number,
    radius: number,
    betAmount: number,
  ) => {
    const matchId = uuid.v4() as string;
    await firebase
      .app()
      .database(emulatorMatchesQueueDatabaseURL)
      .ref(`/${matchId}`)
      .set({
        numberOfPlayers,
        creationTime: new Date().toISOString(),
        radius,
        fulfilled: false,
        betAmount,
        players: {
          stub: {
            coordinates: {
              latitude: 0,
              longitude: 0,
            },
          },
        },
      });

    return matchId;
  };

  static fulfillMatchInMatchQueue = async (matchID: string) => {
    await firebase
      .app()
      .database(emulatorMatchesQueueDatabaseURL)
      .ref(`/${matchID}`)
      .update({
        fulfilled: true,
      });
  };

  static unfulfillMatchInMatchQueue = async (matchId: string) => {
    await firebase
      .app()
      .database(emulatorMatchesQueueDatabaseURL)
      .ref(`/${matchId}`)
      .update({
        fulfilled: false,
      });
  };

  static joinMatch = async (
    user: FirebaseAuthTypes.User,
    matchID: string,
    usersLatitudeLongitude: ILatLng,
  ) => {
    const existingPlayers = await this.getPlayersFromMatchQueue(matchID);
    const newPlayer = {
      [user.uid]: {
        coordinates: {
          latitude: usersLatitudeLongitude.latitude,
          longitude: usersLatitudeLongitude.longitude,
        },
      },
    };

    if (existingPlayers) {
      await firebase
        .app()
        .database(emulatorMatchesQueueDatabaseURL)
        .ref(`/${matchID}`)
        .update({
          players: {
            ...existingPlayers,
            ...newPlayer,
          },
        });
    }

    await firebase
      .app()
      .database(emulatorMatchesQueueDatabaseURL)
      .ref(`/${matchID}`)
      .update({
        players: {
          ...newPlayer,
        },
      });
  };

  static findPendingMatchIdByConditions = async ({
    options,
    usersLatLng,
  }: {
    options: IMatchMakingOptions;
    usersLatLng: ILatLng;
  }) => {
    try {
      const allMatches = await this.getAllMatches();
      if (allMatches) {
        const unfulfilledMatches: {
          matchID: string;
          match: IMatch;
        }[] = MatchQueueServiceUtils.filterUnfulfilledMatches(
          allMatches,
          options,
        );

        const matchesThatFitsIntoPlayerRadiusBoundaries =
          MatchQueueServiceUtils.filterMatchesBasedOnPlayerRadiusBoundaries(
            unfulfilledMatches,
            usersLatLng,
            options,
          );

        // TODO: IMPLEMENT LOGIC THAT WOULD RETURN OLDEST MATCH IN MATCH QUEUE BASED ON DATE CREATED
        return matchesThatFitsIntoPlayerRadiusBoundaries[0].matchID;
      }
    } catch (error) {
      console.log(error);
    }
  };

  static getPlayerFromMatchQueue = async (userUID: string, matchID: string) => {
    const matchDatasnapshot = await firebase
      .app()
      .database(emulatorMatchesQueueDatabaseURL)
      .ref(`/${matchID}`)
      .once("value");

    if (matchDatasnapshot.exists()) {
      const matchData = matchDatasnapshot.val();
      if (matchData.players) {
        const matchPlayers: IPlayers = matchData.players;

        const player = Object.fromEntries(
          Object.entries(matchPlayers).filter(([playerUID]) =>
            playerUID.includes(userUID),
          ),
        );

        return player;
      }
      return null;
    } else {
      throw "match does not exist";
    }
  };

  static getPlayersFromMatchQueue = async (matchID: string) => {
    const matchDatasnapshot = await firebase
      .app()
      .database(emulatorMatchesQueueDatabaseURL)
      .ref(`/${matchID}`)
      .once("value");

    if (matchDatasnapshot.exists()) {
      const matchData = matchDatasnapshot.val();
      if (matchData.players) {
        const matchPlayers: IPlayers = matchData.players;

        return matchPlayers;
      }
      return null;
    } else {
      throw "match does not exist";
    }
  };

  static getMatchQueuePlayerCoordinates = async (
    userUID: string,
    matchID: string,
  ) => {
    const matchDatasnapshot = await firebase
      .app()
      .database(emulatorMatchesQueueDatabaseURL)
      .ref(`/${matchID}`)
      .once("value");

    if (matchDatasnapshot.exists()) {
      const matchData = matchDatasnapshot.val();
      if (matchData.players) {
        const matchPlayers: IPlayer = matchData.players;

        const player = Object.fromEntries(
          Object.entries(matchPlayers).filter(([playerUID]) =>
            playerUID.includes(userUID),
          ),
        );

        return player[userUID].coordinates;
      } else {
        return null;
      }
    } else {
      throw "match does not exist";
    }
  };
}
