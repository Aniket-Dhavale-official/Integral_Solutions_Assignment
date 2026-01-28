import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SettingsScreen = ({ navigation }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [loggingOut, setLoggingOut] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchUserProfile();
    }, []);

    const fetchUserProfile = async () => {
        try {
            setError(null);
            const token = await AsyncStorage.getItem('authToken');

            if (!token) {
                navigation.replace('Login');
                return;
            }

            const response = await fetch('http://localhost:5000/auth/me', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (response.status === 401) {
                await AsyncStorage.removeItem('authToken');
                navigation.replace('Login');
                return;
            }

            const data = await response.json();

            if (response.ok) {
                setUser(data.user || data);
            } else {
                setError(data.message || 'Failed to load user profile');
            }
        } catch (err) {
            setError('Network error. Please check your connection and try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        Alert.alert(
            'Logout',
            'Are you sure you want to logout?',
            [
                {
                    text: 'Cancel',
                    onPress: () => { },
                    style: 'cancel',
                },
                {
                    text: 'Logout',
                    onPress: performLogout,
                    style: 'destructive',
                },
            ]
        );
    };

    const performLogout = async () => {
        setLoggingOut(true);
        try {
            const token = await AsyncStorage.getItem('authToken');

            // Call logout endpoint
            const response = await fetch('http://localhost:5000/auth/logout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            });

            // Clear storage regardless of response
            await AsyncStorage.removeItem('authToken');
            await AsyncStorage.removeItem('user');

            if (response.ok) {
                Alert.alert('Success', 'Logged out successfully');
            }

            // Navigate to login
            navigation.replace('Login');
        } catch (err) {
            // Clear storage and navigate even if request fails
            await AsyncStorage.removeItem('authToken');
            await AsyncStorage.removeItem('user');
            Alert.alert('Logout Complete', 'You have been logged out');
            navigation.replace('Login');
        } finally {
            setLoggingOut(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#007AFF" />
                <Text style={styles.loadingText}>Loading profile...</Text>
            </View>
        );
    }

    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Settings</Text>
            </View>

            {error ? (
                <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>{error}</Text>
                    <TouchableOpacity
                        style={styles.retryButton}
                        onPress={fetchUserProfile}
                    >
                        <Text style={styles.retryButtonText}>Try Again</Text>
                    </TouchableOpacity>
                </View>
            ) : user ? (
                <>
                    {/* Profile Section */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Profile Information</Text>

                        {/* Full Name */}
                        <View style={styles.profileCard}>
                            <View style={styles.profileItem}>
                                <Text style={styles.label}>Full Name</Text>
                                <Text style={styles.value}>
                                    {user.fullName || user.name || 'N/A'}
                                </Text>
                            </View>
                        </View>

                        {/* Email */}
                        <View style={styles.profileCard}>
                            <View style={styles.profileItem}>
                                <Text style={styles.label}>Email</Text>
                                <Text style={styles.value}>{user.email || 'N/A'}</Text>
                            </View>
                        </View>
                    </View>

                    {/* Account Actions */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Account</Text>

                        {/* Logout Button */}
                        <TouchableOpacity
                            style={[
                                styles.logoutButton,
                                loggingOut && styles.logoutButtonDisabled,
                            ]}
                            onPress={handleLogout}
                            disabled={loggingOut}
                        >
                            {loggingOut ? (
                                <ActivityIndicator color="#d32f2f" size="small" />
                            ) : (
                                <Text style={styles.logoutButtonText}>Logout</Text>
                            )}
                        </TouchableOpacity>
                    </View>

                    {/* App Info */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>About</Text>
                        <View style={styles.infoCard}>
                            <Text style={styles.infoText}>App Version: 1.0.0</Text>
                        </View>
                    </View>
                </>
            ) : (
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>No user data available</Text>
                </View>
            )}
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    header: {
        backgroundColor: '#fff',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#000',
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 16,
        color: '#666',
    },
    errorContainer: {
        marginHorizontal: 15,
        marginTop: 20,
        padding: 16,
        backgroundColor: '#ffebee',
        borderLeftWidth: 4,
        borderLeftColor: '#d32f2f',
        borderRadius: 8,
    },
    errorText: {
        fontSize: 14,
        color: '#d32f2f',
        marginBottom: 12,
    },
    retryButton: {
        paddingVertical: 10,
        paddingHorizontal: 16,
        backgroundColor: '#d32f2f',
        borderRadius: 6,
        alignSelf: 'flex-start',
    },
    retryButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 40,
    },
    emptyText: {
        fontSize: 16,
        color: '#999',
    },
    section: {
        marginHorizontal: 15,
        marginTop: 20,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#666',
        marginBottom: 12,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    profileCard: {
        backgroundColor: '#fff',
        borderRadius: 8,
        marginBottom: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    profileItem: {
        padding: 16,
    },
    label: {
        fontSize: 12,
        color: '#999',
        fontWeight: '600',
        marginBottom: 6,
        textTransform: 'uppercase',
        letterSpacing: 0.3,
    },
    value: {
        fontSize: 16,
        color: '#000',
        fontWeight: '500',
    },
    logoutButton: {
        backgroundColor: '#fff',
        borderWidth: 2,
        borderColor: '#d32f2f',
        paddingVertical: 14,
        paddingHorizontal: 20,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    logoutButtonDisabled: {
        opacity: 0.6,
    },
    logoutButtonText: {
        color: '#d32f2f',
        fontSize: 16,
        fontWeight: 'bold',
    },
    infoCard: {
        backgroundColor: '#fff',
        borderRadius: 8,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    infoText: {
        fontSize: 14,
        color: '#666',
    },
});

export default SettingsScreen;
