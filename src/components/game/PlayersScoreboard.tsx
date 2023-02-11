import {View, Text, StyleSheet} from 'react-native';
import React from 'react';

interface IPlayersScoreboardProps {
  gameOptions: {
    numberOfPlayers: number;
  };
  numberOfJoinedPlayersInGame: number;
}

export default function PlayersScoreboard({
  gameOptions,
  numberOfJoinedPlayersInGame,
}: IPlayersScoreboardProps) {
  return (
    <View style={styles.container}>
      <Text
        style={
          styles.numberOfJoinedPlayersInGameText
        }>{`${numberOfJoinedPlayersInGame} / ${gameOptions?.numberOfPlayers} players in game...`}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {position: 'absolute', top: 10, left: 10},
  numberOfJoinedPlayersInGameText: {
    fontWeight: 'bold',
  },
});
