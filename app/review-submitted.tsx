import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ReviewSubmittedScreen() {
    return (
        <View style={styles.container}>
            <SafeAreaView edges={['top']} style={styles.headerArea}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn} hitSlop={12}>
                        <Ionicons name="arrow-back" size={24} color="#000" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Review submitted</Text>
                    <View style={styles.headerSpacer} />
                </View>
            </SafeAreaView>

            <View style={styles.content}>
                <View style={styles.iconContainer}>
                    <View style={styles.iconWrap}>
                        <Ionicons name="checkmark-circle-outline" size={48} color="#000" />
                    </View>
                </View>

                <Text style={styles.title}>
                    Thank you, your review{'\n'}has been successfully{'\n'}submitted
                </Text>

                <Text style={styles.message}>
                    Your review is valuable in helping others make informed decisions when seeking new job opportunities.
                </Text>
            </View>

            <View style={styles.footer}>
                <TouchableOpacity
                    style={styles.button}
                    onPress={() => router.back()}
                    activeOpacity={0.85}
                >
                    <Text style={styles.buttonText}>Ok, great!</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    headerArea: {
        backgroundColor: '#FFFFFF',
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
        fontFamily: 'Kanit',
        fontSize: 18,
        fontWeight: '700',
        color: '#000',
    },
    headerSpacer: {
        width: 40,
    },
    content: {
        flex: 1,
        paddingHorizontal: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    iconContainer: {
        marginBottom: 40,
    },
    iconWrap: {
        width: 80,
        height: 80,
        borderRadius: 12,
        backgroundColor: '#72A4BF',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#1E4154',
    },
    title: {
        fontFamily: 'Kanit',
        fontWeight: '700',
        fontSize: 28,
        textAlign: 'center',
        color: '#000',
        marginBottom: 20,
        lineHeight: 34,
    },
    message: {
        fontFamily: 'Kanit',
        fontWeight: '300',
        fontSize: 16,
        textAlign: 'center',
        color: '#000',
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
        fontFamily: 'Kanit',
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
    },
});
