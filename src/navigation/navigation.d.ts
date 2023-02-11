import {NavigatorScreenParams} from '@react-navigation/native';

export type TRootDrawerParamList = {
  Lobby: NavigatorScreenParams<TRootStackParamList>;
};
export type TRootStackParamList = {
  DrawerNavigation: undefined;
  Queue: {goingToMatchID: string; numberOfPlayers: number};
  Game: {
    matchID: string;
    gameID: string;
    gameOptions: {
      numberOfPlayers: number;
    };
    matchQueueData: {
      numberOfPlayersInTheQueue: number;
    };
  };
  Login: undefined;
  Register: undefined;
};
