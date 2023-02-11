import {useEffect, useState} from 'react';
import MatchQueueService from '../services/firebase/realtimeDatabase/matchQueue/matchQueueService';

interface IUseMatchQueueProps {
  matchID: string;
}

export default function useMatchQueue({matchID}: IUseMatchQueueProps) {
  const [numberOfPlayersInTheQueue, setNumberOfPlayersInTheQueue] = useState(0);

  useEffect(() => {
    const subscriptionCallBack =
      MatchQueueService.subscribeToPlayersDataChangeInMatchQueue(
        matchID,
        (numberOfPlayersInMatchQueue: number) => {
          setNumberOfPlayersInTheQueue(numberOfPlayersInMatchQueue);
        },
      );

    return MatchQueueService.unsubscribeToPlayersDataChangeInMatchQueue(
      matchID,
      subscriptionCallBack,
    );
  }, [matchID]);

  return numberOfPlayersInTheQueue;
}
