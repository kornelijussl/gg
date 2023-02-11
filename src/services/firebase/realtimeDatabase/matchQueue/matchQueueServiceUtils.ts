import {getPreciseDistance} from 'geolib';
import {ILatLng} from '../game/gameService';
import {IMatch, IMatches, IMatchMakingOptions} from './matchQueueService';

export default class MatchQueueServiceUtils {
  public static filterUnfulfilledMatches = (
    allMatches: IMatches,
    options: IMatchMakingOptions,
  ): {
    matchID: string;
    match: IMatch;
  }[] => {
    const unfulfilledMatches: {
      matchID: string;
      match: IMatch;
    }[] = [];

    Object.entries(allMatches).forEach(([matchID, match]: [string, IMatch]) => {
      if (
        !match.fulfilled &&
        match.numberOfPlayers === options.numberOfPlayers &&
        match.radius === options.radius &&
        match.betAmount === options.betAmount
      ) {
        unfulfilledMatches.push({
          matchID,
          match,
        });
      }
    });

    return unfulfilledMatches;
  };

  public static filterMatchesBasedOnPlayerRadiusBoundaries = (
    unfulfilledMatches: {
      matchID: string;
      match: IMatch;
    }[],
    usersLatLng: ILatLng,
    options: IMatchMakingOptions,
  ): {
    matchID: string;
    match: IMatch;
  }[] => {
    const filteredMatchesBasedOnPlayerRadiusBoundaries: {
      matchID: string;
      match: IMatch;
    }[] = [];

    unfulfilledMatches.forEach(
      ({matchID, match}: {matchID: string; match: IMatch}) => {
        if (match.players) {
          const flagsOfDistance: boolean[] = [];
          Object.entries(match.players).forEach(([_, playerInMatchQueue]) => {
            const distanceFromPlayerInTheQueue = getPreciseDistance(
              {
                latitude: Number(usersLatLng.latitude),
                longitude: Number(usersLatLng.longitude),
              },
              {
                latitude: Number(playerInMatchQueue.coordinates.latitude),
                longitude: Number(playerInMatchQueue.coordinates.longitude),
              },
              1,
            );
            if (distanceFromPlayerInTheQueue < options.radius) {
              flagsOfDistance.push(true);
            } else {
              flagsOfDistance.push(false);
            }
          });

          const isAllMatchPlayersInRadius = flagsOfDistance.every(
            flag => flag === true,
          );

          if (isAllMatchPlayersInRadius) {
            filteredMatchesBasedOnPlayerRadiusBoundaries.push({matchID, match});
          }
        } else {
          filteredMatchesBasedOnPlayerRadiusBoundaries.push({matchID, match});
        }
      },
    );

    return filteredMatchesBasedOnPlayerRadiusBoundaries;
  };
}
