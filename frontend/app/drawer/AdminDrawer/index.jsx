import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function Sidebar() {
  const router = useRouter();
  const [isDropdownVisible, setDropdownVisible] = useState(false); // State to toggle dropdown

  const toggleDropdown = () => {
    setDropdownVisible(!isDropdownVisible);
  };

  return (
    <View style={styles.container}>
      {/* Back Button */}
      <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
        <Ionicons name="arrow-back" size={24} color="white" />
      </TouchableOpacity>

      {/* Profile Section */}
      <View style={styles.profileSection}>
        <Image
          source={require('@/assets/images/sample.jpg')} // Replace with actual image
          style={styles.profileImage}
        />
        <Text style={styles.profileName}>Shanai Meg G. Honrado</Text>
      </View>

      {/* Admin Menu Section */}
      <View style={styles.menuSection}>
      <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/screens/Admin/Profile/EditProfileScreen')}>
          <FontAwesome5 name="user-edit" size={25} color="#5A5A5A" />
          <Text style={styles.menuText}>Edit Profile</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/screens/Admin/Users/ListUsers')}>
          <FontAwesome5 name="users" size={25} color="#5A5A5A" />
          <Text style={styles.menuText}>Manage Users</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/screens/Admin/Pharmacies/ListPharmacies')}>
          <FontAwesome5 name="clinic-medical" size={25} color="#5A5A5A" />
          <Text style={styles.menuText}>Manage Pharmacies</Text>
        </TouchableOpacity>

        {/* View Charts Dropdown */}
        <TouchableOpacity style={styles.menuItem} onPress={toggleDropdown}>
          <FontAwesome5 name="chart-bar" size={25} color="#5A5A5A" />
          <Text style={styles.menuText}>View Charts</Text>
          <Ionicons 
            name={isDropdownVisible ? "chevron-up-outline" : "chevron-down-outline"} 
            size={20} 
            color="#5A5A5A" 
            style={styles.dropdownIcon}
          />
        </TouchableOpacity>

        {/* Dropdown Chart Options */}
        {isDropdownVisible && (
          <View style={styles.dropdownContainer}>
            <TouchableOpacity style={styles.dropdownItem} onPress={() => router.push('/screens/Admin/Charts/PharmaciesPerBarangay')}>
              <Text style={styles.dropdownText}>Pharmacies Per Barangay</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.dropdownItem} onPress={() => router.push('/screens/Admin/Charts/MostScannedMedication')}>
              <Text style={styles.dropdownText}>Most Scanned Medication</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.dropdownItem} onPress={() => router.push('/screens/Admin/Charts/MonthlyPharmacyRegistration')}>
              <Text style={styles.dropdownText}>Monthly Pharmacy Registration</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/screens/Admin/Settings')}>
          <FontAwesome5 name="cog" size={25} color="#5A5A5A" />
          <Text style={styles.menuText}>Admin Settings</Text>
        </TouchableOpacity> */}

        <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/(tabs)/account')}>
          <FontAwesome5 name="sign-out-alt" size={25} color="#5A5A5A" />
          <Text style={styles.menuText}>Log out</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
  },
  container: {
    flex: 1,
    backgroundColor: '#0B607E',
    paddingTop: 100,
  },
  profileSection: {
    alignItems: 'center',
    marginBottom: 30,
  },
  profileImage: {
    width: 150,
    height: 150,
    borderRadius: 75,
    marginBottom: 10,
  },
  profileName: {
    color: 'white',
    fontSize: 25,
    fontWeight: 'bold',
  },
  menuSection: {
    marginTop: 20,
    backgroundColor: 'white',
    paddingHorizontal: 20,
    flex: 1,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  menuText: {
    fontSize: 18,
    marginLeft: 15,
    color: '#5A5A5A',
  },
  dropdownIcon: {
    marginLeft: 'auto',
  },
  dropdownContainer: {
    backgroundColor: '#f9f9f9',
    paddingHorizontal: 15,
    paddingTop: 5,
  },
  dropdownItem: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  dropdownText: {
    fontSize: 16,
    color: '#5A5A5A',
  },
});