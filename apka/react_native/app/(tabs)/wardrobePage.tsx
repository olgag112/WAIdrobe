import { Image } from 'expo-image';
import { Stack } from 'expo-router'
import { StyleSheet, View, Text, ScrollView, Button, TouchableOpacity, Alert} from 'react-native';
import React, { useState } from 'react';
import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Fonts } from '@/constants/theme';
import DropdownComponent from '../../components/ui/dropdown';
import * as DROPDOWN from '../../constants/dropdowns';

import { Ionicons } from '@expo/vector-icons';
import { useAppContext } from "../appContext";
import * as ImagePicker from 'expo-image-picker'
import axios from "axios";
import {BACKEND_API, IP} from '../../constants/ip';

  


export default function TabTwoScreen() {

  const topTypes = ["Sweater", "Shirt", "T-shirt","Sweatshirt","Blazer", "Dress"];
  const bottomTypes = ["Skirt", "Trousers", "Shorts"];
  const outerTypes = ["Coat","Jacket"]

  const { image, setImage, wardrobe, setWardrobe, newItem, setNewItem, user } = useAppContext();
  const [addingItem, setAddingItem] = useState(false)

  const dudu = () => {
    setAddingItem(prev => !prev);
  };

  const pickImage = async () => {
    // Ask for permission
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      Alert.alert("Permission to access camera roll is required!");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [3, 4],
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const addItem = async () => {
  let category = 'other';
  if (topTypes.includes(newItem.type)) category = 'top';
  else if (bottomTypes.includes(newItem.type)) category = 'bottom';
  else if (outerTypes.includes(newItem.type)) category = 'outer';
  const itemToAdd = { ...newItem, category };
 
  try {
    // 1️⃣ Upload image first (if file selected)
    let imageUrl = null;
    
    if (image) {
      const uriParts = image.split(".");
      const fileType = uriParts[uriParts.length - 1];

      // Create FormData
      const formData = new FormData();
      formData.append("file", {
        uri: image,
        name: `photo.${fileType}`,
        type: `image/${fileType}`,
      } as any);

      try {
        const response = await axios.post(`${BACKEND_API}/upload_image`, formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
        console.log("Upload success:", response.data);
        Alert.alert("Upload success!");
        imageUrl = response.data.url;
      } catch (error) {
        console.error("Upload failed:", error);
        Alert.alert("Upload failed!");
      }
    }
    let finalItem = { ...itemToAdd, image_url: imageUrl}

    // 3️⃣ Save item to DB
    const response = await fetch(`${BACKEND_API}/add_item?user_id=${user.user_id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(finalItem),
    }); 

    if (!response.ok) throw new Error("Failed to save item");

    const data = await response.json();
    console.log("✅ Item saved:", data);

    finalItem = {...finalItem, id: data.item_id};
    setWardrobe([...wardrobe, finalItem]);
    dudu()

    alert("Item added successfully!");
  } catch (err) {
    console.error("Error adding item:", err);
    alert("Failed to add item.");
  }
};

const removeItem = async (id: string | null) => {
  try {
    const response = await fetch(`${BACKEND_API}/delete_item/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      throw new Error("Failed to delete item");
    }

    // Remove from local state
    setWardrobe(wardrobe.filter(item => item.id !== id));
    console.log(`Item ${id} deleted`);
  } catch (err) {
    console.error("Error deleting item:", err);
  }
};


  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#a48f8fff', dark: '#353636' }}
      headerImage={
        <Image
          source={require('../../assets/images/w.png')}
          style={{ width: '100%', height: 250, resizeMode: 'cover' }}
        />
      }>
      <ThemedView style={styles.titleContainer}>
        <ThemedText
          type="title"
          style={{
            fontFamily: Fonts.rounded,
          }}>
          Your Digital Wardrobe
        </ThemedText>
      </ThemedView>
      {/* <ThemedText>This app includes example code to help you get started.</ThemedText> */}
      <View className="col-span-1 sm:col-span-2 lg:col-span-4">
      {wardrobe.length === 0 ? (
  <Text>Brak dodanych elementów.</Text>
) : (
  <View>
  <ThemedText
          type="title"
          style={{
            fontFamily: Fonts.rounded,
            fontSize: 15
          }}>
          Top items
        </ThemedText>
  <ScrollView
    horizontal={true}
    showsHorizontalScrollIndicator={false}
    style={{ marginVertical: 10 }}>
    {wardrobe.filter(item => item.category === "top").map((item) => (
      <View key={item.id} style={styles.card}>
        {item.image_url && (
          <>
          <Image source={{ uri: item.image_url.replace("localhost", IP) }} style={styles.cardImage} />
          </>
        )}
        <Text style={styles.cardText}>
          <Text style={{ fontWeight: 'bold' }}>
            {item.type}
          </Text>{'\n'}
          {item.color}, {item.material}, {item.size}, {item.season}, {item.style}{'\n'}
          ulubione: {item.favorite ? 'Tak' : 'Nie'}
          {item.special_property ? `, ${item.special_property}` : ''}
        </Text>
        <View style={styles.buttonItem}>
          <Button title="Usuń" color="#776153ff" onPress={() => removeItem(item.id)} />
        </View>
      </View>
    ))}
  </ScrollView>
  <ThemedText
    type="title"
    style={{
      fontFamily: Fonts.rounded,
      fontSize: 15
    }}>
    Bottom items
  </ThemedText>
  <ScrollView
    horizontal={true}
    showsHorizontalScrollIndicator={false}
    style={{ marginVertical: 10 }}>
    {wardrobe.filter(item => item.category === "bottom").map((item) => (
      <View key={item.id} style={styles.card}>
        {item.image_url && (
          <Image source={{ uri: item.image_url.replace("localhost", IP) }} style={styles.cardImage} />
        )}
        <Text style={styles.cardText}>
          <Text style={{ fontWeight: 'bold', color: "#000000ff" }}>
            {item.type}
          </Text>{
          '\n'}
          <Text style={{color: "#646464ff"}}>
            {item.color}, {item.material}, {item.size}, {item.season}, {item.style}{'\n'}
            ulubione: {item.favorite ? 'Tak' : 'Nie'}
            {item.special_property ? `, ${item.special_property}` : ''}
          </Text>
        </Text>
        <View style={styles.buttonItem}>
          <Button title="Usuń" color="#776153ff" onPress={() => removeItem(item.id)} />
        </View>
      </View>
    ))}
  </ScrollView>
  <ThemedText
    type="title"
    style={{
      fontFamily: Fonts.rounded,
      fontSize: 15
    }}>
    Outer items
  </ThemedText>
  <ScrollView
    horizontal={true}
    showsHorizontalScrollIndicator={false}
    style={{ marginVertical: 10 }}>
    {wardrobe.filter(item => item.category === "outer").map((item) => (
      <View key={item.id} style={styles.card}>
        {item.image_url && (
          <>
          <Image source={{ uri: item.image_url.replace("localhost", IP) }} style={styles.cardImage} />
          </>
        )}
        <Text style={styles.cardText}>
          <Text style={{ fontWeight: 'bold', color: "#000000ff" }}>
            {item.type}
          </Text>{
          '\n'}
          <Text style={{color: "#646464ff"}}>
            {item.color}, {item.material}, {item.size}, {item.season}, {item.style}{'\n'}
            ulubione: {item.favorite ? 'Tak' : 'Nie'}
            {item.special_property ? `, ${item.special_property}` : ''}
          </Text>
        </Text>
        <View style={styles.buttonItem}>
          <Button title="Usuń" color="#776153ff" onPress={() => removeItem(item.id)} />
        </View>
      </View>
    ))}
  </ScrollView>
  </View>
)}
    </View>
    <Button
        onPress={dudu}
        title="Add new item"
        color="#6c503eff"
      />
      {addingItem ?
      (
        <View>
          <View style={{ padding: 20 }}>
            <Stack.Screen options ={{title: 'Wardrobe'}}/>
            <View style={styles.container}>
              <Text style={styles.title}>Item Image</Text>
              {image?<Text>{image.uri}</Text>:null}
              <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
                {image ? (
                <>
                  <Image source={{ uri: image }} style={styles.previewImage} />
                </>
                ):(
                  <View style={styles.placeholderContainer}>
                    <Ionicons name="image-outline" size={40} color={'#393E46'}/>
                    <Text style={styles.placeholderText}>Select an image</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
            <DropdownComponent
              data={DROPDOWN.CLOTHING_ITEMS}
              label="Type"
              placeholder="Choose one"
              value={newItem.type}
              onChange={(val) => setNewItem((prev) => ({...prev, type: val}))}
            />
            <DropdownComponent
              data={DROPDOWN.COLORS}
              label="Color"
              placeholder="Choose one"
              value={newItem.color}
              onChange={(val) => setNewItem((prev) => ({...prev, color: val}))}
            />
            <DropdownComponent
              data={DROPDOWN.MATERIALS}
              label="Material"
              placeholder="Choose one"
              value={newItem.material}
              onChange={(val) => setNewItem((prev) => ({...prev, material: val}))}
            />
            <DropdownComponent
              data={DROPDOWN.SIZES}
              label="Size"
              placeholder="Choose one"
              value={newItem.size}
              onChange={(val) => setNewItem((prev) => ({...prev, size: val}))}
            />
            <DropdownComponent
              data={DROPDOWN.SEASONS}
              label="Season"
              placeholder="Choose one"
              value={newItem.season}
              onChange={(val) => setNewItem((prev) => ({...prev, season: val}))}
            />
            <DropdownComponent
              data={DROPDOWN.STYLES}
              label="Style"
              placeholder="Choose one"
              value={newItem.style}
              onChange={(val) => setNewItem((prev) => ({...prev, style: val}))}
            />
            <DropdownComponent
              data={DROPDOWN.IS_FAVOURITE}
              label="Is it favourite?"
              placeholder="Choose one"
              value={String(newItem.favorite)}
              onChange={(val) => setNewItem((prev) => ({...prev, favorite: parseInt(val,10)}))}
            />
            <DropdownComponent
              data={DROPDOWN.SPECIAL_FEATURES}
              label="Special Feature"
              placeholder="Choose one"
              value={newItem.special_property}
              onChange={(val) => setNewItem((prev) => ({...prev, special_property: val}))}
            />
            <Button
              onPress={addItem}
              title="Add new item"
              color="#6c503eff"
              accessibilityLabel="Learn more about this purple button"
            />
          </View>
        </View>
      ):null}
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  headerImage: {
    color: '#808080',
    bottom: -90,
    left: -35,
    position: 'absolute',
  },
  titleContainer: {
    flexDirection: 'row',
    gap: 8,
    borderTopColor: "#000000ff",
    borderBottomWidth: 1
  },
  container: {
    flex: 1,
    padding: 20
  },
  title : {
    fontSize: 18,
    fontWeight: "600",
    color: '#333',
    marginBottom: 8,
  },
  imagePicker: {
    width: "100%",
    height: 200,
    backgroundColor: "#eee9dfff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#705e47ff",
    overflow: "hidden"
  },

  placeholderContainer: {
    width: "100%",
    height: "100%",
    justifyContent: "center", // wyrownaj pionowa
    alignItems: "center"      // wyrownaj poziomo
  },
  placeholderText: {
    color: "#393E46",
    marginTop: 8,
  },
  previewImage: {
    width: "100%",
    height: "100%"
  },
  itemImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
    resizeMode: 'cover',
  },
  card: {
    width: 250,               // square/rectangular width
    height: 350,              // square/rectangular height
    marginRight: 10,
    marginBottom:5,          // space between cards
    padding: 10,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#f8f7f4ff',
    backgroundColor: '#ffffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    justifyContent: 'space-between', // space between image/text/button
    alignItems: 'center',
  },
  cardImage: {
    height: 200,
    aspectRatio: 1,
    borderRadius: 8,
    resizeMode: 'cover',
    marginBottom: 5,
  },
  cardText: {
    flexShrink: 1,
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 5,
  },
  buttonItem: {
    borderRadius: 20,
    padding: 0,
    margin: 0
  }
});