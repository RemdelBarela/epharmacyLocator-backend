import React, { useState, useContext, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons'; // For the back icon
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useRouter } from 'expo-router';
import AuthGlobal from '@/context/AuthGlobal';
import baseURL from "../../../../assets/common/baseurl";
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from "axios";
import Spinner from "../../../../assets/common/spinner";

const ChangePasswordScreen = () => {
  const [userId, setUserId] = useState(null);
  const router = useRouter();
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState({});
  const [loading, setLoading] = useState(false);
  const { dispatch } = useContext(AuthGlobal);
  const [showPassword, setShowPassword] = useState(false); // New state for password visibility
  const [showPassword1, setShowPassword1] = useState(false); // New state for password visibility
  const [showPassword2, setShowPassword2] = useState(false); // New state for password visibility

  useEffect(() => {
    const fetchUserId = async () => {
      try {
        const storedUserId = await AsyncStorage.getItem('userId');
        setUserId(storedUserId); // Set userId from AsyncStorage
      } catch (error) {
        console.error('Error fetching user ID:', error);
      }
    };
    fetchUserId();
  }, []);

  const validate = () => {
    let errorMessages = {};
    if (!newPassword) errorMessages.newPassword = "New password is required";
    if (!confirmPassword) errorMessages.confirmPassword = "Confirm password is required";
    if (!oldPassword) errorMessages.oldPassword = "Old password is required";
    if (newPassword && confirmPassword && newPassword !== confirmPassword) {
      errorMessages.confirmPassword = "Passwords do not match";
    }
  
    return errorMessages;
  };

  const handleUpdatePassword = async () => {
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setError(validationErrors);
      return;
    }

    setError('');
    setLoading(true);

    try {
      const response = await fetch(`${baseURL}users/changePassword`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, oldPassword, newPassword, confirmPassword }),
      });

      const data = await response.json();

      if (response.status === 200) {
        alert('Password successfully updated. Please login.');
        try {
          router.push('/screens/Auth/LoginScreen');
          await AsyncStorage.removeItem('jwt');
          dispatch({ type: 'LOGOUT_USER' });
          
        } catch (error) {
          console.error('Error during logout:', error);
        }
      } else {
        setError(data.message);
      }
    } catch (error) {
      if (error.response) {
        // Handle specific error messages
        const { message } = error.response.data;
  
        if (message === 'NOT_MATCH') {
          Toast.show({
            type: "error",
            text1: "OLD PASSWORD IS INCORRECT!",
          });
        } else {
          // Handle generic errors
          Toast.show({
            type: "error",
            text1: "UPDATING PASSWORD FAILED!",
            text2: "PLEASE TRY AGAIN LATER",
          });
        }
      } else {
        Toast.show({
          type: "error",
          text1: "NETWORK ERROR!",
          text2: "PLEASE CHECK YOU INTERNAT CONNECTION AND TRY AGAIN",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
       {loading ? (
        <Spinner /> // Show the custom spinner component when loading
      ) : (
        <>
      {/* Back Button and Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerText}>Change Password</Text>
      </View>

      {/* Input Fields Section */}
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Old Password *</Text>
        <View style={styles.passwordContainer}>
          <TextInput
            style={styles.input}
            placeholder="Old Password"
            secureTextEntry={!showPassword} // Conditionally secure the password
            value={oldPassword}
            onChangeText={setOldPassword}
          />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
            <Icon
              name={showPassword ? "eye-off" : "eye"}
              size={24}
              color="#AAB4C1"
            />
          </TouchableOpacity>
        </View>
        {error.oldPassword && <Text style={styles.errorText}>{error.oldPassword}</Text>}
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>New Password *</Text>
        <View style={styles.passwordContainer}>
          <TextInput
            style={styles.input}
            placeholder="New Password"
            secureTextEntry={!showPassword1} // Conditionally secure the password
            value={newPassword}
            onChangeText={setNewPassword}
          />
          <TouchableOpacity onPress={() => setShowPassword1(!showPassword1)} style={styles.eyeIcon}>
            <Icon
              name={showPassword1 ? "eye-off" : "eye"}
              size={24}
              color="#AAB4C1"
            />
          </TouchableOpacity>
        </View>
        {error.newPassword && <Text style={styles.errorText}>{error.newPassword}</Text>}
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Re-type Password *</Text>
        <View style={styles.passwordContainer}>
          <TextInput
            style={styles.input}
            placeholder="Re-type Password"
            secureTextEntry={!showPassword2}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />
          <TouchableOpacity onPress={() => setShowPassword2(!showPassword2)} style={styles.eyeIcon}>
            <Icon
              name={showPassword2 ? "eye-off" : "eye"}
              size={24}
              color="#AAB4C1"
            />
          </TouchableOpacity>
        </View>
        {error.confirmPassword && <Text style={styles.errorText}>{error.confirmPassword}</Text>}
      </View>

      {/* Error Message */}
      {error && <Text style={styles.errorText}>{error.message}</Text>}

      {/* Update Password Button */}
      <TouchableOpacity style={styles.updateButton} onPress={handleUpdatePassword} disabled={loading}>
        <Text style={styles.updateButtonText}>
          {loading ? 'Updating...' : 'Update Password'}
        </Text>
      </TouchableOpacity>
      </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F4F4',
  },
  header: {
    backgroundColor: '#0B607E',
    paddingTop: 80,
    paddingBottom: 20,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
  },
  headerText: {
    fontSize: 20,
    color: 'white',
    fontWeight: 'bold',
  },
  inputContainer: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    marginHorizontal: 20,
    marginVertical: 20,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  eyeIcon: {
    padding: 9,
    paddingRight: 5,
  },
  label: {
    color: '#666',
    marginBottom: 5,
    fontSize: 16,
  },
  input: {
    backgroundColor: '#F4F4F4',
    borderRadius: 5,
    paddingHorizontal: 10,
    paddingVertical: 10,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    width: 310,
  },
  errorText: {
    color: 'red',
    fontSize: 12,
    marginTop: 3,
    textAlign: 'center',
  },
  updateButton: {
    backgroundColor: '#0B607E',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginHorizontal: 20,
    marginTop: 20,
  },
  updateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ChangePasswordScreen;