import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LoginScreen = ({ navigation }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);

    const validateForm = () => {
        const newErrors = {};

        if (!email.trim()) {
            newErrors.email = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            newErrors.email = 'Please enter a valid email address';
        }

        if (!password) {
            newErrors.password = 'Password is required';
        } else if (password.length < 6) {
            newErrors.password = 'Password must be at least 6 characters';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleLogin = async () => {
        if (!validateForm()) {
            return;
        }

        setLoading(true);
        try {
            const response = await fetch('http://localhost:5000/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: email.trim(),
                    password,
                }),
            });

            const data = await response.json();

            if (response.ok && data.token) {
                // Store JWT securely using AsyncStorage
                await AsyncStorage.setItem('authToken', data.token);
                if (data.user) {
                    await AsyncStorage.setItem('user', JSON.stringify(data.user));
                }

                Alert.alert('Success', 'Logged in successfully!');
                navigation.replace('Dashboard');
            } else {
                setErrors({
                    submit: data.message || 'Login failed. Please check your credentials.',
                });
            }
        } catch (error) {
            setErrors({
                submit: 'Network error. Please check your connection and try again.',
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <ScrollView
                contentContainerStyle={styles.scrollContainer}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.header}>
                    <Text style={styles.title}>Welcome Back</Text>
                    <Text style={styles.subtitle}>Login to your account</Text>
                </View>

                {errors.submit && (
                    <View style={styles.errorContainer}>
                        <Text style={styles.errorText}>{errors.submit}</Text>
                    </View>
                )}

                <View style={styles.form}>
                    {/* Email Input */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Email</Text>
                        <TextInput
                            style={[styles.input, errors.email && styles.inputError]}
                            placeholder="Enter your email"
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            editable={!loading}
                            placeholderTextColor="#999"
                        />
                        {errors.email && (
                            <Text style={styles.fieldError}>{errors.email}</Text>
                        )}
                    </View>

                    {/* Password Input */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Password</Text>
                        <TextInput
                            style={[styles.input, errors.password && styles.inputError]}
                            placeholder="Enter your password"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                            editable={!loading}
                            placeholderTextColor="#999"
                        />
                        {errors.password && (
                            <Text style={styles.fieldError}>{errors.password}</Text>
                        )}
                    </View>
                </View>

                {/* Submit Button */}
                <TouchableOpacity
                    style={[styles.loginButton, loading && styles.loginButtonDisabled]}
                    onPress={handleLogin}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#fff" size="small" />
                    ) : (
                        <Text style={styles.loginButtonText}>Login</Text>
                    )}
                </TouchableOpacity>

                {/* Signup Link */}
                <View style={styles.signupLink}>
                    <Text style={styles.signupLinkText}>Don't have an account? </Text>
                    <TouchableOpacity
                        onPress={() => navigation.navigate('Signup')}
                        disabled={loading}
                    >
                        <Text style={styles.signupLinkButton}>Sign Up</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    scrollContainer: {
        flexGrow: 1,
        paddingHorizontal: 20,
        paddingVertical: 30,
        justifyContent: 'center',
    },
    header: {
        marginBottom: 30,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#000',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 14,
        color: '#666',
    },
    errorContainer: {
        backgroundColor: '#ffebee',
        borderLeftWidth: 4,
        borderLeftColor: '#d32f2f',
        padding: 12,
        marginBottom: 20,
        borderRadius: 4,
    },
    errorText: {
        color: '#d32f2f',
        fontSize: 14,
        fontWeight: '500',
    },
    form: {
        marginBottom: 20,
    },
    inputGroup: {
        marginBottom: 16,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 12,
        fontSize: 14,
        backgroundColor: '#fff',
        color: '#000',
    },
    inputError: {
        borderColor: '#d32f2f',
        backgroundColor: '#fff5f5',
    },
    fieldError: {
        color: '#d32f2f',
        fontSize: 12,
        marginTop: 6,
        fontWeight: '500',
    },
    loginButton: {
        backgroundColor: '#007AFF',
        paddingVertical: 14,
        paddingHorizontal: 20,
        borderRadius: 8,
        alignItems: 'center',
        marginBottom: 16,
    },
    loginButtonDisabled: {
        backgroundColor: '#ccc',
        opacity: 0.6,
    },
    loginButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    signupLink: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    signupLinkText: {
        fontSize: 14,
        color: '#666',
    },
    signupLinkButton: {
        fontSize: 14,
        color: '#007AFF',
        fontWeight: 'bold',
    },
});

export default LoginScreen;
