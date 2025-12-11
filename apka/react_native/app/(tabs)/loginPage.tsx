import { Image } from 'expo-image';
import { StyleSheet, Button, View, Text, TextInput, KeyboardAvoidingView, Platform, ScrollView} from 'react-native';
import React, { useState } from 'react';
import { ThemedView } from '@/components/themed-view';
import { useAppContext } from "../appContext";
import {BACKEND_API} from '../../constants/ip';

// == PAGE THAT ALLOWS USERS TO LOG IN OR CREATE NEW ACCOUNT ==
// Functions:
// - log in to the account (checking credentials with backend datababse)
// - create new account
export default function LoginPage() {

  // global variables
  const {setUser, setWardrobe, setRecommendations } = useAppContext();

  // local variables
  const [tempUser, setTempUser] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [surname, setSurname] = useState('');
  const [registration, setRegistration] = useState(false);
  const containerWidth = Platform.OS === 'web' ? '60%' : '100%';
  
  // switch interface between logging in and creating new account
  const switcher = () => {
    setRegistration(prev => !prev);
  };

  // handle logging user to his account
  const handleLogin = async () => {
    // case: when either userID or password is empty
    if (!tempUser) return alert("Please enter a user ID");
    if (!password) return alert("Please enter your password");

    // verify if login and password (typed by user) is correct with our db
    try {
      let response = await fetch(`${BACKEND_API}/users/${tempUser}`)
      if (!response.ok) {
        return alert("User with this ID doesn't exist");
      }
      const user_db = await response.json();
      if (user_db.password !== password) {
        return alert("You're password is not correct!!!");
      }

      setUser(user_db);
      alert(`You are successfully logged in`);

      // get all the clothing items that belong to the user from db
      response = await fetch(`${BACKEND_API}/wardrobe?user_id=${tempUser}`);
      if (!response.ok){
        throw new Error("Failed to fetch wardrobe");
      }

      const data = await response.json();
      setWardrobe(data.items);
      setRecommendations([])
    } catch (err) {
      return alert("Can't load your wardrobe");
    }
  };

  // handle creating an user account
  const addUser = async () => {
    // send request to create new user to the backend
    try {
      const response = await fetch(`${BACKEND_API}/add_user`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name,
          surname: surname,
          password: password,
        }),
      });

      if (!response.ok) throw new Error("Failed to add user");

      const data = await response.json();

      // notify that account was created successfully
      console.log("User added:", data);
      alert(`User created successfully!\n [!!!] YOUR USER ID: ${data.user_id}`);

      // set variables to the logged in user
      setUser(data)
      setTempUser(data.user_id)

      // switch interface from registering new account to logging in
      switcher()
    } catch (err) {
      console.error("Error adding user:", err);
      alert("Failed to add user.");
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <ThemedView style={styles.titleContainer}>
          <Image
            source={require('@/assets/images/login_image.png')}
            style={styles.loginImage}
          />
          {/* Interface to log in */}
          <View style={[styles.container, {width: containerWidth}]}>
            { !registration ? (
              <>
              <Text style={styles.label}>User ID:</Text>
              <TextInput
                style={styles.input}
                placeholder="Type your User ID"
                value={tempUser}
                onChangeText={setTempUser}
                autoCapitalize="none"
                keyboardType="default"
              />
              <Text style={styles.label}>Password:</Text>
              <TextInput
                style={styles.input}
                secureTextEntry={true}
                placeholder="Type your password"
                value={password}
                onChangeText={setPassword}
                autoCapitalize="none"
                keyboardType="default"
              />
              <View style={styles.buttonContainer}>
                <Button
                  onPress={handleLogin}
                  title="Log in"
                  color="#605139ff"
                />
              </View>
              <View style={styles.buttonContainer}>
                <Button
                  onPress={switcher}
                  title="Create new user"
                  color="#605139ff"
                />
              </View>
            </>
            ):( // Interface to register an account
              <>
              {/* Inputs for name, surname and password */}
              <Text style={styles.label}>Your name:</Text>
              <TextInput
                style={styles.input}
                placeholder="Type your name"
                value={name}
                onChangeText={setName}
                autoCapitalize="none"
                keyboardType="default"
              />
              <Text style={styles.label}>Your surname:</Text>
              <TextInput
                style={styles.input}
                placeholder="Type your surname"
                value={surname}
                onChangeText={setSurname}
                autoCapitalize="none"
                keyboardType="default"
              />
              <Text style={styles.label}>Your new password:</Text>
              <TextInput
                style={styles.input}
                secureTextEntry={true}
                placeholder="Type your new password"
                value={password}
                onChangeText={setPassword}
                autoCapitalize="none"
                keyboardType="default"
              />
              {/* button to register a new account */}
              <View style={styles.buttonContainer}>
                <Button
                  onPress={addUser}
                  title="Submit"
                  color="#605139ff"
                />
              </View>
              {/* button to go back to log in interface */}
              <View style={styles.buttonContainer}>
                <Button
                  onPress={switcher}
                  title="Go back to log in"
                  color="#605139ff"
                />
              </View>
              </>
            )}
            
            
          </View>
        </ThemedView>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flex: 1,
    flexDirection: 'column', 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: '#b9988aff',
    padding: 20,
  },
  loginImage: {
    width: 300,
    height: 300,
    borderRadius: 20,
    marginBottom: 10,
    marginTop: 5,
    opacity: 0.9,
  },
  container: {
    alignItems: 'center',
    flexDirection: 'column',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 15,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  label: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 20,
    marginBottom: 5,
  },
  input: {
    width: '90%',
    height: 45,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    paddingHorizontal: 15,
    backgroundColor: '#fff',
    fontSize: 16,
  },
  buttonContainer: {
    width: '90%',
    borderRadius: 10,
    overflow: 'hidden',
    marginTop: 15,
  },
});
