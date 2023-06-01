import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer } from '@react-navigation/native';
import axios from 'axios';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Home from './components/Home';
import Record from './components/Record';
import Rave from './components/Rave';
import { Provider } from 'react-redux'
import store from "./store"

export default function App() {

  const Stack = createNativeStackNavigator();


  return (
    <Provider store={store}>
      <NavigationContainer>
        <Stack.Navigator>
          <Stack.Screen
            name='Home'
            component={Home}
          />
          <Stack.Screen
            name='Record'
            component={Record}
          />
          <Stack.Screen
            name='Rave'
            component={Rave}
          />
        </Stack.Navigator>
        <StatusBar style="auto" />
      </NavigationContainer>
    </Provider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
