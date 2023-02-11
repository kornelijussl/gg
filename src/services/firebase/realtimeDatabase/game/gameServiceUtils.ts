import {FirebaseAuthTypes} from '@react-native-firebase/auth';
import {IPlayer} from './gameService';

export default class GameServiceUtils {
  static findOpponents = (
    user: FirebaseAuthTypes.User,
    players: IPlayer,
  ): IPlayer | null => {
    const mutablePlayers = Object.assign({}, players);

    for (const playerUID in mutablePlayers) {
      if (playerUID === user.uid) {
        delete mutablePlayers[playerUID];
      }
    }

    if (Object.keys(players).length > 0) {
      return mutablePlayers;
    }

    return null;
  };
}
