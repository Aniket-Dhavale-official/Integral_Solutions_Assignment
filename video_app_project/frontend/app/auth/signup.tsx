import { useState } from 'react';
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
    ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { API_BASE_URL } from '../../constants/api';

export default function SignupScreen() {
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<{
        full_name?: string;
        email?: string;
        password?: string;
        confirm_password?: string;
    }>({});

    const validateForm = () => {
        const newErrors: typeof errors = {};

        if (!fullName.trim()) newErrors.full_name = 'Full name is required';
        if (!email.trim()) newErrors.email = 'Email is required';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
            newErrors.email = 'Invalid email';

        if (!password) newErrors.password = 'Password is required';
        else if (password.length < 8)
            newErrors.password = 'Password must be at least 8 characters';

        if (confirmPassword !== password)
            newErrors.confirm_password = 'Passwords do not match';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSignup = async () => {
        if (!validateForm()) return;

        setLoading(true);

        try {
            const res = await fetch(`${API_BASE_URL}/auth/signup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    full_name: fullName.trim(),
                    email: email.toLowerCase().trim(),
                    password,
                    confirm_password: confirmPassword,
                }),
            });

            const data = await res.json();

            if (!data.success) {
                if (data.errors) {
                    setErrors(data.errors);
                    return;
                }
                throw new Error(data.error || 'Signup failed');
            }

            Alert.alert('Success', 'Account created successfully', [
                { text: 'OK', onPress: () => router.replace('/auth/login') },
            ]);

        } catch (err: any) {
            Alert.alert('Error', err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.formContainer}>
                    <Text style={styles.title}>Create Account</Text>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Full Name</Text>
                        <TextInput
                            style={[styles.input, errors.full_name && styles.inputError]}
                            placeholder="Enter your full name"
                            placeholderTextColor="#999"
                            value={fullName}
                            onChangeText={setFullName}
                            editable={!loading}
                        />
                        {errors.full_name && <Text style={styles.errorText}>{errors.full_name}</Text>}
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Email</Text>
                        <TextInput
                            style={[styles.input, errors.email && styles.inputError]}
                            placeholder="Enter your email"
                            placeholderTextColor="#999"
                            autoCapitalize="none"
                            keyboardType="email-address"
                            value={email}
                            onChangeText={setEmail}
                            editable={!loading}
                        />
                        {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Password</Text>
                        <View style={styles.passwordContainer}>
                            <TextInput
                                style={[styles.passwordInput, errors.password && styles.inputError]}
                                placeholder="Enter your password"
                                placeholderTextColor="#999"
                                secureTextEntry={!showPassword}
                                value={password}
                                onChangeText={setPassword}
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
                        {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Confirm Password</Text>
                        <View style={styles.passwordContainer}>
                            <TextInput
                                style={[styles.passwordInput, errors.confirm_password && styles.inputError]}
                                placeholder="Confirm your password"
                                placeholderTextColor="#999"
                                secureTextEntry={!showConfirmPassword}
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                                editable={!loading}
                            />
                            <TouchableOpacity
                                style={styles.eyeIcon}
                                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                            >
                                <Text style={styles.eyeText}>
                                    {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                        {errors.confirm_password && (
                            <Text style={styles.errorText}>{errors.confirm_password}</Text>
                        )}
                    </View>

                    <TouchableOpacity
                        style={[styles.button, loading && styles.buttonDisabled]}
                        onPress={handleSignup}
                        disabled={loading}
                    >
                        {loading ? <ActivityIndicator color="#fff" /> : (
                            <Text style={styles.buttonText}>Sign Up</Text>
                        )}
                    </TouchableOpacity>

                    <View style={styles.footer}>
                        <Text style={styles.footerText}>Already have an account? </Text>
                        <TouchableOpacity 
                            onPress={() => router.replace('/auth/login')} 
                            disabled={loading}
                        >
                            <Text style={styles.signupLink}>Login</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        paddingHorizontal: 20,
        paddingVertical: 40,
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
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#1a1a1a',
        marginBottom: 24,
        textAlign: 'center',
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