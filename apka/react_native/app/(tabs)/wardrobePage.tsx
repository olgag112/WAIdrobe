import { StyleSheet, View, Text, ScrollView, Button, TouchableOpacity, Platform} from 'react-native';
import React, { useState } from 'react';
import { Fonts } from '@/constants/theme';
import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Ionicons } from '@expo/vector-icons';
import DropdownComponent from '../../components/ui/dropdown';
import { Stack } from 'expo-router'

import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker'
import axios from "axios";

import * as DROPDOWN from '../../constants/dropdowns';
import * as TYPES from '../../constants/clothing_types';
import {BACKEND_API, IP} from '../../constants/ip';

import { useAppContext } from "../appContext";

// == PAGE THAT MANAGE USER'S WARDROBE ==
// Functions:
// - display clothes (divided into 3 categories: top, bottom, outer clothing category)
// - add new items to your wardrobe
// - remove existing items from the wardrobe
export default function WardrobePage() {

  // global variables
  const { 
    image, setImage, 
    wardrobe, setWardrobe, 
    newItem, setNewItem, 
    user 
  } = useAppContext();

  // bool value that is used to display interface to add a new item
  const [addingItem, setAddingItem] = useState(false)

  const MAX_FILE_SIZE_MB = 5;
  const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
  const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/heic"];

  // function to turn on/off interface to add a new item to the wardrobe
  const switcher = () => {
    if (!user.user_id) {
      return alert("You can't use this functionality, unless you're logged in");
    }
    setAddingItem(prev => !prev);
  };

  // function to allow user to upload an image
  const pickImage = async () => {
    // Ask for permission
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      return alert("Permission to access camera roll is required!");
    }

    // assign image to variable and format it
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [8, 3],
      quality: 0.4,
    });

    if (!result.canceled) {
      const asset = result.assets[0];

      if (!asset.mimeType || !ALLOWED_MIME_TYPES.includes(asset.mimeType)) {
        return alert("Selected file type is not supported.");
      }
      if (asset.fileSize && asset.fileSize > MAX_FILE_SIZE_BYTES) {
        return alert("The file size is too big (it can't exceed 5Mb)");
      }
      setImage(result.assets[0].uri);
    }
  };

  // function to add an item (to the backend db along with an image)
  const addItem = async () => {
    // assign category to the item based on its type
    let category = null;
    if (TYPES.top.includes(newItem.type)) category = 'top';
    else if (TYPES.bottom.includes(newItem.type)) category = 'bottom';
    else if (TYPES.outer.includes(newItem.type)) category = 'outer';
    const itemToAdd = { ...newItem, category };
  
    try {

      // get an image (if the user upload one)
      const formData = new FormData();
      let imageUrl = null;
      if (image) {
        // assign it to the form data to later send it to backend
        // for websites 
        if (Platform.OS === "web") {
          const blob = await fetch(image).then(r => r.blob());
          formData.append("file", new File([blob], "photo.jpg", { type: blob.type }));
        } 
        // for phones
        else {
          const uriParts = image.split(".");
          const fileType = uriParts[uriParts.length - 1];

          formData.append("file", {
            uri: image,
            name: `photo.${fileType}`,
            type: `image/${fileType}`,
          } as any);
        }

        // send it to the backend
        try {
          const response = await axios.post(`${BACKEND_API}/upload_image`, formData, {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          });
          alert("Upload success!");
          imageUrl = response.data.url;
        } catch (error) {
          console.error("Upload failed:", error);
          alert("Upload failed!");
        }
      }
      // add image_url to the item
      let finalItem = { ...itemToAdd, image_url: imageUrl}

      // send a request to the backend to add a new item to the user's wardrobe
      const response = await fetch(`${BACKEND_API}/add_item?user_id=${user.user_id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(finalItem),
      }); 
      if (!response.ok) throw new Error("Failed to save item");
      const data = await response.json();

      // update wardrobe and turn off interface for adding an item
      finalItem = {...finalItem, id: data.item_id};
      setWardrobe([...wardrobe, finalItem]);
      switcher()
      alert("Item added successfully!");
    } catch (err) {
      console.error("Error adding item:", err);
      alert("Failed to add item.");
    }
  };

  // function to remove an item (from the database along with an image)
  const removeItem = async (id: string | null) => {
    // send request to the backend to delete an item
    try {
      const response = await fetch(`${BACKEND_API}/delete_item/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete item");
      }

      // Remove from the front end
      setWardrobe(wardrobe.filter(item => item.id !== id));
      alert(`Item ${id} deleted`);
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
      <View className="col-span-1 sm:col-span-2 lg:col-span-4">
      {wardrobe.length === 0 ? (
        <Text>You haven&apos;t added anything to your digital wardrobe</Text>
      ) : (
        <View>
        {/* View for displaying top clothing items */}
        <ThemedText
          type="title"
          style={{ fontFamily: Fonts.rounded, fontSize: 15}}>
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
        {/* View for displaying bottom clothing items */}
        <ThemedText
          type="title"
          style={{ fontFamily: Fonts.rounded, fontSize: 15}}>
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
        {/* View for displaying outer clothing items */}
        <ThemedText
          type="title"
          style={{fontFamily: Fonts.rounded,fontSize: 15}}>
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
    {/* Interface for adding new items to the wardrobe */}
    <Button
        onPress={switcher}
        title="Add new item"
        color="#6c503eff"
      />
      {addingItem ? (
        <View>
          <View style={{ padding: 20 }}>
            <Stack.Screen options ={{title: 'Wardrobe'}}/>
            {/* View to add an image */}
            <View style={styles.container}>
              <Text style={styles.title}>Item Image</Text>
              <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
                {image ? (
                <><Image source={{ uri: image }} style={styles.previewImage}/></>
                ):(
                  <View style={styles.placeholderContainer}>
                    <Ionicons name="image-outline" size={40} color={'#393E46'}/>
                    <Text style={styles.placeholderText}>Select an image</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
            {/* Dropdowns to add tags to the new clothing item */}
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
            {/* Button to add a new item */}
            <Button
              onPress={addItem}
              title="Add new item"
              color="#6c503eff"
              accessibilityLabel="Learn more about this purple button"
            />
          </View>
        </View>
      ) : null}
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
    height: 250,
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