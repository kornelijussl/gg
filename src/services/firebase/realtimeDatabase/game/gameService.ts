import {firebase} from '@react-native-firebase/database';

import uuid from 'react-native-uuid';

import {FirebaseAuthTypes} from '@react-native-firebase/auth';
import {getCenterOfBounds} from 'geolib';

// END OF THE IMPORTS -----------------------------------------------------------------------------------

export const emulatorGamesDatabaseURL =
  'http://10.0.2.2:9000/?ns=georacer-f3502-games';
export const cloudGamesDatabaseURL =
  'https://georacer-f3502-games.europe-west1.firebasedatabase.app/';

export type {ILatLng, IPlayer, IPlayers, IGame, IGames};

interface ILatLng {
  latitude: Number;
  longitude: Number;
}

interface IPlayer {
  [playerID: string]: {
    coordinates: {
      latitude: number;
      longitude: number;
    };
  };
}

interface IPlayers {
  [playerID: string]: IPlayer;
}

interface IGame {
  matchID: string;
  players: {
    [playerUID: string]: {
      coordinates: {
        longitude: string;
        latitude: string;
      };
    };
  };
}

interface IGames {
  [gameID: string]: IGame;
}

export default class GameService {
  static getRewardLocation = async (gameID: string) => {
    const rewardLocationDataSnapshot = await firebase
      .app()
      .database(emulatorGamesDatabaseURL)
      .ref(`/${gameID}/gameData/rewardLocation`)
      .once('value');
    if (rewardLocationDataSnapshot.exists()) {
      const rewardLocationData = rewardLocationDataSnapshot.val();

      return rewardLocationData;
    }
    return null;
  };

  static setRewardLocation = async (
    gameID: string,
    rewardLocation: ILatLng,
  ) => {
    await firebase
      .app()
      .database(emulatorGamesDatabaseURL)
      .ref(`/${gameID}/gameData`)
      .set({
        rewardLocation,
      });
  };

  // static setGameLeaver = async (gameID: string, rewardLocation: ILatLng) => {
  //   await firebase
  //     .app()
  //     .database(emulatorGamesDatabaseURL)
  //     .ref(`/${gameID}/gameData`)
  //     .set({
  //       rewardLocation,
  //     });
  // };

  static leaveGame = async (user: FirebaseAuthTypes.User, gameID: string) => {
    const gamePlayersDataSnapshot = await firebase
      .app()
      .database(emulatorGamesDatabaseURL)
      .ref(`/${gameID}/players`)
      .once('value');

    if (gamePlayersDataSnapshot.exists()) {
      const gamePlayersData: IPlayer = gamePlayersDataSnapshot.val();

      const filteredPlayers = Object.fromEntries(
        Object.entries(gamePlayersData).filter(
          ([playerUID]) => !playerUID.includes(user.uid),
        ),
      );

      await firebase
        .app()
        .database(emulatorGamesDatabaseURL)
        .ref(`/${gameID}`)
        .update({
          players: filteredPlayers,
        });
    } else {
      throw 'match does not exist';
    }
  };

  static createGame = async (matchID: string) => {
    const gameID = uuid.v4() as string;
    await firebase
      .app()
      .database(emulatorGamesDatabaseURL)
      .ref(`/${gameID}`)
      .set({
        matchID,
        status: {
          started: false,
          ended: false,
        },
        gameData: {
          rewardLocation: null,
        },
      });

    return gameID;
  };

  static joinGame = async (
    user: FirebaseAuthTypes.User,
    gameID: string,
    usersLatitudeLongitude: ILatLng,
  ) => {
    const joiningPlayer = {
      [user.uid]: {
        coordinates: {
          latitude: usersLatitudeLongitude.latitude,
          longitude: usersLatitudeLongitude.longitude,
        },
      },
    };

    const existingPlayers = await this.getPlayersFromGame(gameID);

    await firebase
      .app()
      .database(emulatorGamesDatabaseURL)
      .ref(`/${gameID}`)
      .update({
        players:
          (existingPlayers && {...existingPlayers, ...joiningPlayer}) ||
          joiningPlayer,
      });
  };

  static getPlayersFromGame = async (gameID: string) => {
    const gameDatasnapshot = await firebase
      .app()
      .database(emulatorGamesDatabaseURL)
      .ref(`/${gameID}`)
      .once('value');

    if (gameDatasnapshot.exists()) {
      const gameData = gameDatasnapshot.val();
      if (gameData.players) {
        const gamePlayers: IPlayers = gameData.players;

        return gamePlayers;
      }
      return null;
    } else {
      throw 'game does not exist';
    }
  };

  static updateGameStartedStatus = async (gameID: string, started: boolean) => {
    await firebase
      .app()
      .database(emulatorGamesDatabaseURL)
      .ref(`/${gameID}/status`)
      .update({
        started,
      });
  };

  static getGameStatus = async (gameID: string) => {
    const gameStatusDatasnapshot = await firebase
      .app()
      .database(emulatorGamesDatabaseURL)
      .ref(`/${gameID}/status`)
      .once('value');

    if (gameStatusDatasnapshot.exists()) {
      const gameStatusData = gameStatusDatasnapshot.val();
      return gameStatusData;
    }
    return null;
  };

  static calculateRewardLocation = async (
    currentlyRunningGameID: string,
  ): Promise<ILatLng | null> => {
    const gameData = await GameService.getGameByGameID(currentlyRunningGameID);

    if (gameData?.players) {
      const players = gameData.players;
      const preparedCoordinates = [];

      for (const playerUID in players) {
        if (
          Number(players[playerUID].coordinates.latitude) !== 0 &&
          Number(players[playerUID].coordinates.longitude) !== 0
        ) {
          preparedCoordinates.push({
            latitude: players[playerUID].coordinates.latitude,
            longitude: players[playerUID].coordinates.longitude,
          });
        }
      }

      return getCenterOfBounds(preparedCoordinates);
    }
    return null;
  };

  static getGameByGameID = async (gameID: string): Promise<IGame | null> => {
    const gameDatasnapshot = await firebase
      .app()
      .database(emulatorGamesDatabaseURL)
      .ref(`/${gameID}`)
      .once('value');

    if (gameDatasnapshot.exists()) {
      const gameData = gameDatasnapshot.val();

      return gameData;
    }
    return null;
  };

  static updateGamePlayerCoordinates = async (
    user: FirebaseAuthTypes.User,
    gameID: string,
    coordinates: ILatLng,
  ) => {
    const gameDatasnapshot = await firebase
      .app()
      .database(emulatorGamesDatabaseURL)
      .ref(`/${gameID}`)
      .once('value');

    if (gameDatasnapshot.exists()) {
      const gameData = gameDatasnapshot.val();
      const {players} = gameData;

      players[user.uid] = {
        coordinates: {
          longitude: coordinates.longitude,
          latitude: coordinates.latitude,
        },
      };

      await firebase
        .app()
        .database(emulatorGamesDatabaseURL)
        .ref(`/${gameID}`)
        .update({
          players,
        });
    } else {
      throw 'game does not exist';
    }
  };

  static subscribeToPlayersDataChangeInGame = (
    gameID: string,
    callBack: (players: IPlayer) => void,
  ) => {
    const subscriptionCallBack = firebase
      .app()
      .database(emulatorGamesDatabaseURL)
      .ref(`/${gameID}/players`)
      .on('value', snapshot => {
        if (snapshot.exists()) {
          const players: IPlayer = snapshot.val();

          callBack(players);
        }
      });

    return subscriptionCallBack;
  };

  static unsubscribeToPlayersDataChangeInMatchQueue = (
    gameID: string,
    subscriptionCallBack: any,
  ) => {
    return () =>
      firebase
        .app()
        .database(emulatorGamesDatabaseURL)
        .ref(`/${gameID}/players`)
        .off('value', subscriptionCallBack);
  };

  static getGameIDByMatchID = async (
    matchID: string,
  ): Promise<string | null> => {
    const gamesDataSnapshot = await firebase
      .app()
      .database(emulatorGamesDatabaseURL)
      .ref('/')
      .once('value');

    if (gamesDataSnapshot.exists()) {
      const gamesData: IGames = gamesDataSnapshot.val();

      const filteredGames = Object.entries(gamesData).filter(
        ([_, game]: [string, IGame]) => game.matchID === matchID,
      );

      if (filteredGames.length > 0) {
        return filteredGames[0][0];
      }
      return null;
    }
    return null;
  };
}
