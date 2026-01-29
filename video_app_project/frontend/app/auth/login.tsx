import { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { router } from 'expo-router';
import { StorageService } from '../../utils/storage';
import { API_BASE_URL } from '../../constants/api';

export default function LoginScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        const token = await StorageService.getToken();
        if (token) {
            router.replace('/(tabs)');
        }
    };

    const validateForm = () => {
        const newErrors: typeof errors = {};

        if (!email.trim()) {
            newErrors.email = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            newErrors.email = 'Please enter a valid email';
        }

        if (!password) {
            newErrors.password = 'Password is required';
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
            const response = await fetch(`${API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: email.toLowerCase().trim(),
                    password,
                }),
            });

            const data = await response.json();

            if (response.ok && data.success) {
                await StorageService.saveToken(data.token);
                router.replace('/(tabs)');
            } else {
                Alert.alert('Login Failed', data.error || 'Invalid credentials');
            }
        } catch (error: any) {
            console.error('Login error:', error);
            Alert.alert(
                'Connection Error',
                'Cannot reach server. Please make sure the backend is running.'
            );
        } finally {
            setLoading(false);
        }
    };

    const handleSignupNav = () => {
        router.push('/auth/signup');
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <View style={styles.contentContainer}>
                <Text style={styles.title}>Welcome Back</Text>
                <Text style={styles.subtitle}>Sign in to your account</Text>

                <View style={styles.formContainer}>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Email</Text>
                        <TextInput
                            style={[styles.input, errors.email ? styles.inputError : null]}
                            placeholder="Enter your email"
                            placeholderTextColor="#999"
                            value={email}
                            onChangeText={(text) => {
                                setEmail(text);
                                if (errors.email) {
                                    setErrors({ ...errors, email: undefined });
                                }
                            }}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            editable={!loading}
                        />
                        {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Password</Text>
                        <View style={styles.passwordContainer}>
                            <TextInput
                                style={[
                                    styles.passwordInput,
                                    errors.password ? styles.inputError : null
                                ]}
                                placeholder="Enter your password"
                                placeholderTextColor="#999"
                                value={password}
                                onChangeText={(text) => {
                                    setPassword(text);
                                    if (errors.password) {
                                        setErrors({ ...errors, password: undefined });
                                    }
                                }}
                                secureTextEntry={!showPassword}
                                editable={!loading}
                            />
                            <TouchableOpacity
                                style={styles.eyeIcon}
                                onPress={() => setShowPassword(!showPassword)}
                            >
                                <Text style={styles.eyeText}>
                                    {showPassword ? '👁️' : '👁️‍🗨️'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                        {errors.password && (
                            <Text style={styles.errorText}>{errors.password}</Text>
                        )}
                    </View>

                    <TouchableOpacity
                        style={[styles.button, loading && styles.buttonDisabled]}
                        onPress={handleLogin}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.buttonText}>Login</Text>
                        )}
                    </TouchableOpacity>

                    <View style={styles.footer}>
                        <Text style={styles.footerText}>Don't have an account? </Text>
                        <TouchableOpacity onPress={handleSignupNav} disabled={loading}>
                            <Text style={styles.signupLink}>Sign up</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    contentContainer: {
        flex: 1,
        justifyContent: 'center',
        paddingHorizontal: 20,
        paddingVertical: 40,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#1a1a1a',
        marginBottom: 8,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 14,
        color: '#666',
        marginBottom: 32,
        textAlign: 'center',
    },
    formContainer: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1a1a1a',
        marginBottom: 8,
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 16,
        color: '#1a1a1a',
        backgroundColor: '#f9f9f9',
    },
    passwordContainer: {
        position: 'relative',
        flexDirection: 'row',
        alignItems: 'center',
    },
    passwordInput: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        paddingHorizontal: 16,
        paddingVertical: 12,
        paddingRight: 50,
        fontSize: 16,
        color: '#1a1a1a',
        backgroundColor: '#f9f9f9',
    },
    eyeIcon: {
        position: 'absolute',
        right: 12,
        padding: 8,
    },
    eyeText: {
        fontSize: 20,
    },
    inputError: {
        borderColor: '#ff4444',
        backgroundColor: '#fff5f5',
    },
    errorText: {
        color: '#ff4444',
        fontSize: 12,
        marginTop: 6,
    },
    button: {
        backgroundColor: '#007AFF',
        paddingVertical: 14,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 8,
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 20,
    },
    footerText: {
        color: '#666',
        fontSize: 14,
    },
    signupLink: {
        color: '#007AFF',
        fontSize: 14,
        fontWeight: '600',
    },
});