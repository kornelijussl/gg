import { useEffect, useState } from "react";
import PlayerService from "../services/firebase/realtimeDatabase/player/playerService";
import useAuth from "./useAuth";

// END OF THE IMPORTS -----------------------------------------------------------------------------------

export default function usePlayer() {
  const [player, setPlayer] = useState<any | null>(null);

  const { user } = useAuth();

  useEffect(() => {
    (async () => {
      if (user) {
        const playerData = await PlayerService.getPlayer(user.uid);
        console.log(playerData, "playerData");

        if (playerData) {
          setPlayer(playerData);
        }
      }
    })();
  }, [user]);

  return { player };
}
