import { APP_COLORS } from '@/constants/appTheme';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function PasswordChangedScreen() {
    return (
        <View style={styles.container}>
            <SafeAreaView edges={['top']} style={styles.headerArea}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn} hitSlop={12}>
                        <Ionicons name="arrow-back" size={24} color={APP_COLORS.textPrimary} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Password Changed</Text>
                    <View style={styles.headerSpacer} />
                </View>
            </SafeAreaView>

            <View style={styles.content}>
                <View style={styles.iconContainer}>
                    <View style={styles.iconWrap}>
                        <Ionicons name="checkmark-circle-outline" size={48} color={APP_COLORS.textPrimary} />
                    </View>
                </View>

                <Text style={styles.title}>
                    Password Changed{'\n'}Successfully
                </Text>

                <Text style={styles.message}>
                    Your password has been updated successfully. Please use your new password for future logins.
                </Text>
            </View>

            <View style={styles.footer}>
                <TouchableOpacity
                    style={styles.button}
                    onPress={() => router.dismissAll()}
                    activeOpacity={0.85}
                >
                    <Text style={styles.buttonText}>Ok, Great!</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: APP_COLORS.background,
    },
    headerArea: {
        backgroundColor: APP_COLORS.background,
    },
    header: {
        height: 56,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
    },
    headerBtn: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: APP_COLORS.textPrimary,
    },
    headerSpacer: {
        width: 40,
    },
    content: {
        flex: 1,
        paddingHorizontal: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: -50, // Visual adjustment to center content better
    },
    iconContainer: {
        marginBottom: 40,
    },
    iconWrap: {
        width: 80,
        height: 80,
        borderRadius: 12,
        backgroundColor: '#72A4BF', // Using the same color as the reference
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#1E4154',
    },
    title: {
        fontWeight: '700',
        fontSize: 28,
        textAlign: 'center',
        color: APP_COLORS.textPrimary,
        marginBottom: 20,
        lineHeight: 34,
    },
    message: {
        fontWeight: '300',
        fontSize: 16,
        textAlign: 'center',
        color: APP_COLORS.textPrimary,
        lineHeight: 22,
        paddingHorizontal: 10,
    },
    footer: {
        paddingHorizontal: 24,
        paddingBottom: 30,
        paddingTop: 12,
    },
    button: {
        width: '100%',
        height: 56,
        backgroundColor: '#1E4154',
        borderRadius: 56,
        alignItems: 'center',
        justifyContent: 'center',
    },
    buttonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
    },
});
