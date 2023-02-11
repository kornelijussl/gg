// REACT & NATIVE
import {StyleSheet, Text, View} from 'react-native';
import React, {useState} from 'react';

// REACT NATIVE ELEMENTS
import {Input, Button} from '@rneui/themed';

// YUP
import * as Yup from 'yup';

// HOOKS
import {useNavigation} from '@react-navigation/native';
import useAuth from '../../hooks/useAuth';

// FORMIK
import {Formik} from 'formik';

// COMPONENTS
import Footer from './Footer';
import Header from './Header';

// END OF THE IMPORTS -----------------------------------------------------------------------------------

export default function LoginForm() {
  const [isLoading, setIsLoading] = useState(false);

  const {signInWithPassword} = useAuth();

  const navigation = useNavigation();

  const LoginSchema = Yup.object().shape({
    email: Yup.string()
      .email('Laukas privalo būti el.pašto adresas')
      .required('Laukas yra privalomas'),
    password: Yup.string().required('Laukas yra privalomas'),
  });

  return (
    <>
      <Header>
        <Text>Sveiki sugrįžę!</Text>
        <Text>Prisijunkite į savo paskyrą.</Text>
      </Header>
      <Formik
        validationSchema={LoginSchema}
        initialValues={{
          email: 'test@test.com',
          password: 'Adminas123!',
        }}
        onSubmit={async ({email, password}) => {
          setIsLoading(true);

          const userCredentials = {
            email,
            password,
          };

          signInWithPassword(userCredentials);

          setIsLoading(false);
        }}>
        {({handleChange, handleBlur, handleSubmit, values, errors}) => (
          <View style={styles.container}>
            <Input
              leftIcon={{type: 'material', name: 'email'}}
              placeholder="El.pašto adresas"
              value={values.email}
              onChangeText={handleChange('email')}
              onBlur={handleBlur('email')}
              errorMessage={errors.email}
            />
            <Input
              leftIcon={{type: 'material', name: 'lock'}}
              placeholder="Slaptažodis"
              onChangeText={handleChange('password')}
              value={values.password}
              errorMessage={errors.password}
              secureTextEntry
            />

            <Text
              onPress={() =>
                navigation.navigate({name: 'ForgotPage'} as never)
              }>
              Užmiršote slaptažodį?
            </Text>
            <Footer>
              <Button
                loading={isLoading}
                onPress={handleSubmit}
                title="Prisijungti"
              />
              <Text>Ar turite registracijos raktą?</Text>
              <Text
                onPress={() =>
                  navigation.navigate({name: 'Register'} as never)
                }>
                Registruotis
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
    alignItems: 'center',
  },
});
