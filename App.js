import React, {useState, useRef, useEffect} from 'react';
import {
  View,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Text,
  Image,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Animated,
  StatusBar,
  Modal,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import SplashScreen from 'react-native-splash-screen';

const ChatScreen = () => {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isInputEnabled, setInputEnabled] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);
  const [lightModeEnabled, setLightModeEnabled] = useState(true);
  const [showAlert, setShowAlert] = useState(false);

  const bulbImage = lightModeEnabled
    ? require('./android/Images/lightlamp.png')
    : require('./android/Images/goldLamp.png');
  const imageOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const id = AsyncStorage.getItem('id');
    SplashScreen.hide();
    if (id === null) {
      setShowAlert(true);
    }
  }, []);

  const AlertModal = () => {
    return (
      <Modal visible={showAlert} transparent>
        <View style={styles.modalContainer}>
          <View style={styles.alertContainer}>
            <Text style={styles.alertTitle}>Color Modes</Text>
            <Text style={styles.alertMessage}>
              You can switch between light and dark mode by tapping on the bulb
            </Text>
            <TouchableOpacity
              style={styles.alertButton}
              onPress={() => {
                AsyncStorage.setItem('id', 'done');
                setShowAlert(false);
              }}>
              <Text style={styles.alertButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

  const handleSendMessage = async () => {
    if (inputText.trim() !== '') {
      setInputEnabled(false);

      const newMessage = {
        id: messages.length + 1,
        text: inputText,
        timestamp: new Date().getTime(),
      };

      try {
        const response = await fetch(
          'https://api-inference.huggingface.co/models/runwayml/stable-diffusion-v1-5',
          {
            method: 'POST',
            headers: {
              Authorization: 'Bearer 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',
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({inputs: inputText}),
          },
        );
        if (response.ok) {
          const responseBlob = await response.blob();
          const reader = new FileReader();

          reader.onloadend = () => {
            const imageData = reader.result;
            newMessage.imageData = imageData;
            setMessages(prevMessages => [...prevMessages, newMessage]);
            setInputEnabled(true);
            animateImage(); // Animate the image when it is displayed
          };

          reader.readAsDataURL(responseBlob);
        } else {
          setInputEnabled(true);
          console.error('Image generation failed');
        }
      } catch (error) {
        setInputEnabled(true);
        console.error('Image generation failed', error);
      }

      setInputText('');
    } else {
      Alert.alert('', 'Enter the Text First');
    }
  };

  const animateImage = () => {
    Animated.timing(imageOpacity, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  };

  const renderMessageItem = ({item}) => (
    <View style={styles.messageContainer}>
      <View style={styles.messageBubble}>
        <Text style={styles.messageText}>{item.text}</Text>
        {item.imageData && (
          <TouchableOpacity onPress={() => setSelectedImage(item.imageData)}>
            <Animated.Image
              style={[styles.messageImage, {opacity: imageOpacity}]}
              source={{uri: item.imageData}}
            />
          </TouchableOpacity>
        )}
        <Text style={styles.messageTimestamp}>
          {formatTimestamp(item.timestamp)}
        </Text>
      </View>
    </View>
  );

  const formatTimestamp = timestamp => {
    // Format the timestamp as per your requirements
    // e.g., return formatted timestamp string
  };

  const handleSaveToDevice = () => {
    if (selectedImage) {
      setSelectedImage(null);
      console.log('Work In Progress');
    }
  };

  const toggleLightMode = () => {
    setLightModeEnabled(!lightModeEnabled);
  };

  return (
    <SafeAreaView
      style={lightModeEnabled ? styles.container : styles.lightcontainer}>
      <View style={styles.header}>
        <StatusBar backgroundColor={lightModeEnabled? "#36454F": "lightgrey"}></StatusBar>
        <Text
          style={lightModeEnabled ? styles.headerText : styles.headerTextlight}>
          AskGuide
        </Text>

        <TouchableOpacity onPress={toggleLightMode}>
          <Image
            style={lightModeEnabled ? styles.headerImage2 : styles.headerImage}
            source={bulbImage}
          />
        </TouchableOpacity>
      </View>
      <Text
        style={lightModeEnabled ? styles.headerText2 : styles.headerTextlight2}>
        Transform Your Words into Visuals
      </Text>
      <FlatList
        data={messages}
        renderItem={renderMessageItem}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={styles.messageList}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={
          lightModeEnabled ? styles.inputContainer : styles.inputContainerlight
        }>
        <TextInput
          style={lightModeEnabled ? styles.input : styles.inputlight}
          placeholder="Type a message..."
          placeholderTextColor={lightModeEnabled ? '#D0CBCA' : 'black'}
          value={inputText}
          onChangeText={setInputText}
          onSubmitEditing={handleSendMessage}
          multiline={true}
          editable={isInputEnabled}
        />

        <TouchableOpacity
          onPress={handleSendMessage}
          disabled={!isInputEnabled}>
          <Image
            style={[
              styles.sendButton,
              !isInputEnabled && styles.disabledSendButton,
            ]}
            source={require('./android/Images/send.png')}
          />
        </TouchableOpacity>
      </KeyboardAvoidingView>

      {selectedImage && (
        <TouchableOpacity
          style={styles.fullImageContainer}
          onPress={() => setSelectedImage(null)}>
          <Image
            style={styles.fullImage}
            source={{uri: selectedImage}}
            resizeMode="contain"
          />
          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSaveToDevice}>
            <Text style={styles.saveButtonText}>Save to Device</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      )}
      <AlertModal />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#36454F',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
  },
  headerText: {
    color: 'white',
    fontSize: 22,
    fontWeight: 'bold',
    marginRight: 8,
  },
  headerText2: {
    color: 'white',
    fontSize: 16,
    marginLeft: 40,
    marginTop: -20,
    marginBottom: 40,
  },
  headerImage: {
    height: 80,
    width: 60,
  },

  headerImage2: {
    height: 60,
    width: 40,
  },

  messageList: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  messageContainer: {
    marginBottom: 12,
  },
  messageBubble: {
    backgroundColor: 'black',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  messageText: {
    color: 'white',
    fontSize: 16,
  },
  messageTimestamp: {
    color: 'black',
    fontSize: 12,
    marginTop: 4,
    textAlign: 'right',
  },
  messageImage: {
    width: 200,
    height: 200,
    marginTop: 8,
  },

  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: 'white',
    backgroundColor: 'black',
    borderColor: 'white',
  },
  input: {
    flex: 1,
    height: 55,
    borderWidth: 1,
    borderColor: 'black',
    borderRadius: 10,
    paddingHorizontal: 16,
    marginRight: 12,
    borderColor: 'white',
    color: 'white',
    fontSize: 18,
  },
  sendButton: {
    height: 50,
    width: 50,
    backgroundColor:"white"
  },
  disabledSendButton: {
    opacity: 0.5,
  },

  // LighModeColors
  lightcontainer: {
    flex: 1,
    backgroundColor: 'white',
  },

  messageTexlight: {
    color: 'black',
    fontSize: 16,
  },
  inputContainerlight: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: 'black',
    backgroundColor: 'white',
    borderColor: 'black',
  },

  headerTextlight: {
    color: 'black',
    fontSize: 22,
    fontWeight: 'bold',
    marginRight: 8,
  },
  headerTextlight2: {
    color: 'black',
    fontSize: 16,
    marginLeft: 40,
    marginTop: -25,
    marginBottom: 40,
  },
  inputlight: {
    flex: 1,
    height: 55,
    borderWidth: 1,

    borderRadius: 10,
    paddingHorizontal: 16,
    marginRight: 12,
    borderColor: 'black',
    color: 'black',
    fontSize: 18,
  },

  fullImageContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
  },
  fullImage: {
    width: '90%',
    height: '90%',
  },
  saveButton: {
    position: 'absolute',
    bottom: 20,
    alignSelf: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  alertContainer: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginHorizontal: 40,
    alignItems: 'center',
  },
  alertTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  alertMessage: {
    textAlign: 'center',
    marginBottom: 16,
  },
  alertButton: {
    backgroundColor: 'black',
    borderRadius: 8,
    paddingHorizontal: 18,
    paddingVertical: 6,
  },
  alertButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
});
export default ChatScreen;
