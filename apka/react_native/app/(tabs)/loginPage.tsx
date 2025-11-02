import { Image } from 'expo-image';
import { StyleSheet, Button, View, Text, TextInput} from 'react-native';
import React, { useState } from 'react';
import { ThemedView } from '@/components/themed-view';
import { useAppContext } from "../appContext";
import {BACKEND_API} from '../../constants/ip';

export default function TabTwoScreen() {

  const { user, setUser, wardrobe, setWardrobe } = useAppContext();
  const [ tempUser, setTempUser] = useState('');
  const [ password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [name, setName] = useState('');
  const [surname, setSurname] = useState('');
  const [registration, setRegistration] = useState(false);
  
  const dudu = () => {
    setRegistration(prev => !prev);
  };

  const handleLogin = async () => {
    // kiedy nie ma numeru wpisanego
    if (!tempUser) return alert("Please enter a user ID");

    try {
      let response = await fetch(`${BACKEND_API}/users/${tempUser}`)
      if (!response.ok) {
        setError(`User ${tempUser} does not exist`)
        throw new Error(`User ${tempUser} does not exist`);
      }
      const user_db = await response.json();
      if (user_db.password !== password) {
        setError("Wrong password!")
        throw new Error(`Wrong password!`);
      }
      setUser(user_db);
      alert(`You are successfully logged in`);

      // dane z tabeli wardrobe dla usera z danym user_id
      response = await fetch(`${BACKEND_API}/wardrobe?user_id=${tempUser}`);
      if (!response.ok){
        setError("Failed to fetch wardrobe")
        throw new Error("Failed to fetch wardrobe");
      }

      const data = await response.json();
      setWardrobe(data.items);
    } catch (err) {
      console.error("Error loading wardrobe:", err);
      alert(error);
    }
  };

  const addUser = async () => {
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
    console.log("User added:", data);

    alert(`User created successfully!\n [!!!] YOUR USER ID: ${data.user_id}`);
    setUser(data)
    setTempUser(data.user_id)
    dudu()
  } catch (err) {
    console.error("Error adding user:", err);
    alert("Failed to add user.");
  }
};

  return (
    <ThemedView style={styles.titleContainer}>
      <Image
        source={require('@/assets/images/login_image.png')}
        style={styles.loginImage}
      />
      <View style={styles.container}>
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
              accessibilityLabel="Learn more about this purple button"
            />
          </View>
          <View style={styles.buttonContainer}>
            <Button
              onPress={dudu}
              title="Create new user"
              color="#605139ff"
              accessibilityLabel="Learn more about this purple button"
            />
          </View>
        </>
        ):(
          <>
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
          <View style={styles.buttonContainer}>
            <Button
              onPress={addUser}
              title="Submit"
              color="#605139ff"
              accessibilityLabel="Learn more about this purple button"
            />
          </View>
          <View style={styles.buttonContainer}>
            <Button
              onPress={dudu}
              title="Go back to log in"
              color="#605139ff"
              accessibilityLabel="Learn more about this purple button"
            />
          </View>
          </>
        )}
        
        
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flex: 1,
    flexDirection: 'column', // stack everything vertically
    justifyContent: 'center', // center vertically
    alignItems: 'center', // center horizontally
    backgroundColor: '#b9988aff', // light background
    padding: 20,
  },
  loginImage: {
    width: 300,
    height: 300,
    borderRadius: 20,
    marginBottom: 10,
    marginTop: 5,
    opacity: 0.9, // slightly soft look
  },
  container: {
    width: '100%', // make inputs fit nicely
    alignItems: 'center',
    flexDirection: 'column',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.7)', // translucent white box
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
  output: {
    marginTop: 10,
    fontSize: 14,
    color: '#333',
  },
  buttonContainer: {
    width: '90%',
    borderRadius: 10,
    overflow: 'hidden',
    marginTop: 15,
  },
});
