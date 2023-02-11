import {useEffect, useState} from 'react';

import auth, {FirebaseAuthTypes} from '@react-native-firebase/auth';

import useEmulator from '@react-native-firebase/auth';

// END OF THE IMPORTS -----------------------------------------------------------------------------------

interface IUserCredentials {
  email: string;
  password: string;
}

export default function useAuth() {
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [user, setUser] = useState<FirebaseAuthTypes.User | null>(null);

  useEffect(() => {
    auth().onAuthStateChanged(userState => {
      setUser(userState);
      setIsAuthLoading(false);
    });
  }, []);

  const signInAnonymously = async () => {
    try {
      await auth().signInAnonymously();
    } catch (error) {
      console.error(error);
    }
  };

  const signInWithPassword = async ({email, password}: IUserCredentials) => {
    try {
      await auth().signInWithEmailAndPassword(email, password);
    } catch (error) {
      console.error(error);
    }
  };

  const registerWithPassword = async ({email, password}: IUserCredentials) => {
    try {
      const userCredentials = await auth().createUserWithEmailAndPassword(
        email,
        password,
      );

      return userCredentials;
    } catch (error) {
      console.error(error);
    }
  };

  const signOut = async () => {
    try {
      await auth().signOut();
    } catch (error) {
      console.error(error);
    }
  };

  return {
    user,
    signInAnonymously,
    signOut,
    isAuthLoading,
    signInWithPassword,
    registerWithPassword,
  };
}
