import {firebase} from '@react-native-firebase/database';

// END OF THE IMPORTS -----------------------------------------------------------------------------------

export const emulatorPlayersDatabaseURL =
  'http://10.0.2.2:9000/?ns=georacer-f3502-players';
export const cloudDatabaseURL =
  'https://georacer-f3502-players.europe-west1.firebasedatabase.app/';

export type {IPlayerData};

interface IPlayerData {
  coins: number;
}

export default class PlayerService {
  static setPlayer = async (playerUID: string, startCoins: number) => {
    await firebase
      .app()
      .database(emulatorPlayersDatabaseURL)
      .ref(`/${playerUID}`)
      .set({
        coins: startCoins,
      });
  };

  static getPlayer = async (userUID: string) => {
    const playerDatasnapshot = await firebase
      .app()
      .database(emulatorPlayersDatabaseURL)
      .ref(`/${userUID}`)
      .once('value');

    if (playerDatasnapshot.exists()) {
      const playerData: IPlayerData = playerDatasnapshot.val();

      return playerData;
    }

    return null;
  };
}
