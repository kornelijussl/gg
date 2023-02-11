// REACT & NATIVE
import { StyleSheet, Text, View } from "react-native";
import React, { useState } from "react";

// REACT NATIVE ELEMENTS
import { Input, Button } from "@rneui/themed";

// YUP
import * as Yup from "yup";

// HOOKS
import { useNavigation } from "@react-navigation/native";
import useAuth from "../../hooks/useAuth";

// FORMIK
import { Formik } from "formik";

// COMPONENTS
import Footer from "./Footer";
import Header from "./Header";
import PlayerService from "../../services/firebase/realtimeDatabase/player/playerService";

// END OF THE IMPORTS -----------------------------------------------------------------------------------

export default function RegisterForm() {
  const [isLoading, setIsLoading] = useState(false);

  const navigation = useNavigation();

  const { registerWithPassword } = useAuth();

  const RegisterSchema = Yup.object().shape({
    email: Yup.string()
      .email("Laukas privalo būti el.pašto adresas")
      .required("Laukas yra privalomas"),
    password: Yup.string().required("Laukas yra privalomas"),
  });

  return (
    <>
      <Header>
        <Text>Registracija</Text>
      </Header>
      <Formik
        validationSchema={RegisterSchema}
        initialValues={{
          email: "test@test.com",
          password: "Adminas123!",
        }}
        onSubmit={async ({ email, password }) => {
          setIsLoading(true);

          const userCredentials = {
            email,
            password,
          };

          const credentials = await registerWithPassword(userCredentials);
          if (credentials) {
            console.log("setting player");
            await PlayerService.setPlayer(credentials.user.uid, 100);
            setIsLoading(false);
          }
        }}
      >
        {({ handleChange, handleBlur, handleSubmit, values, errors }) => (
          <View style={styles.container}>
            <Input
              leftIcon={{ type: "material", name: "email" }}
              placeholder="El.pašto adresas"
              value={values.email}
              onChangeText={handleChange("email")}
              onBlur={handleBlur("email")}
              errorMessage={errors.email}
            />
            <Input
              leftIcon={{ type: "material", name: "lock" }}
              placeholder="Slaptažodis"
              onChangeText={handleChange("password")}
              value={values.password}
              errorMessage={errors.password}
              secureTextEntry
            />

            <Footer>
              <Button
                loading={isLoading}
                onPress={handleSubmit}
                title="Registruotis"
              />
              <Text
                onPress={() => navigation.navigate({ name: "Login" } as never)}
              >
                Prisijungti
              </Text>
            </Footer>
          </View>
        )}
      </Formik>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 2,
    alignItems: "center",
  },
});
