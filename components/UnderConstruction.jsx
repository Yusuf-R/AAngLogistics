import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Animated,
    Easing,
    Dimensions,
    Button
} from 'react-native';
import {LinearGradient} from 'expo-linear-gradient';
import {Ionicons, MaterialIcons} from '@expo/vector-icons';
import {useRouter} from "expo-router";

const {width, height} = Dimensions.get('window');


function UnderConstruction({ onRefresh, title="Chat Feature", description="We're building something amazing!" }) {
    const router = useRouter();
    const spinValue = React.useRef(new Animated.Value(0)).current;
    const floatValue = React.useRef(new Animated.Value(0)).current;

    const back = ()=> {router.back()};

    React.useEffect(() => {
        Animated.loop(
            Animated.timing(spinValue, {
                toValue: 1,
                duration: 2000,
                easing: Easing.linear,
                useNativeDriver: true,
            })
        ).start();

        // Floating animation
        Animated.loop(
            Animated.sequence([
                Animated.timing(floatValue, {
                    toValue: 1,
                    duration: 1500,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
                Animated.timing(floatValue, {
                    toValue: 0,
                    duration: 1500,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, []);

    const spin = spinValue.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });

    const translateY = floatValue.interpolate({
        inputRange: [0, 1],
        outputRange: [0, -10],
    });

    return (
        <>
            <View style={styles.container}>
                <LinearGradient
                    colors={['#667eea', '#764ba2']}
                    style={styles.gradientBackground}
                >
                    {/* Animated Construction Elements */}
                    <View style={styles.animationContainer}>
                        <Animated.View style={[styles.hammerContainer, { transform: [{ translateY }] }]}>
                            <Animated.View style={[styles.hammer, { transform: [{ rotate: spin }] }]}>
                                <MaterialIcons name="handyman" size={60} color="#FFD700" />
                            </Animated.View>
                        </Animated.View>

                        <View style={styles.toolsRow}>
                            <Ionicons name="hammer" size={30} color="#FF6B6B" style={styles.toolIcon} />
                            <Ionicons name="construct" size={35} color="#4ECDC4" style={styles.toolIcon} />
                            <Ionicons name="cog" size={32} color="#FFD166" style={styles.toolIcon} />
                        </View>
                    </View>

                    {/* Content */}
                    <View style={styles.content}>
                        <Text style={styles.title}>🚧 {title.toUpperCase()} 🚧</Text>
                        <Text style={styles.description}>{description}</Text>
                        <Text style={styles.subDescription}>
                            Our team is working hard to bring you an incredible chat experience
                        </Text>

                        {/* Progress Indicator */}
                        <View style={styles.progressContainer}>
                            <View style={styles.progressBar}>
                                <View style={styles.progressFill} />
                            </View>
                            <Text style={styles.progressText}>Building in progress... 65%</Text>
                        </View>

                        {/* Features Preview */}
                        <View style={styles.featuresContainer}>
                            <View style={styles.featureItem}>
                                <Ionicons name="chatbubbles" size={20} color="#4ECDC4" />
                                <Text style={styles.featureText}>Real-time messaging</Text>
                            </View>
                            <View style={styles.featureItem}>
                                <Ionicons name="notifications" size={20} color="#FFD166" />
                                <Text style={styles.featureText}>Push notifications</Text>
                            </View>
                            <View style={styles.featureItem}>
                                <Ionicons name="people" size={20} color="#FF6B6B" />
                                <Text style={styles.featureText}>Group chats</Text>
                            </View>
                        </View>

                        {/* Estimated Completion */}
                        <View style={styles.etaContainer}>
                            <Ionicons name="time" size={16} color="rgba(255,255,255,0.7)" />
                            <Text style={styles.etaText}>Estimated completion: 2 weeks</Text>
                        </View>
                    </View>

                    {/* Construction Barrier */}
                    <TouchableOpacity
                        style={styles.refreshButton}
                        onPress={back}
                    >
                        <LinearGradient
                            colors={['#FF6B6B', '#191654']}
                            style={styles.buttonGradient}
                        >
                            <Text style={styles.buttonText}>🚧 GO BACK 🚧</Text>
                        </LinearGradient>
                    </TouchableOpacity>

                </LinearGradient>
            </View>
        </>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    gradientBackground: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    animationContainer: {
        alignItems: 'center',
        marginBottom: 40,
    },
    hammerContainer: {
        marginBottom: 30,
    },
    hammer: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    toolsRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 20,
    },
    toolIcon: {
        marginHorizontal: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 4,
    },
    content: {
        alignItems: 'center',
        width: '100%',
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: 'white',
        textAlign: 'center',
        marginBottom: 10,
        textShadowColor: 'rgba(0, 0, 0, 0.3)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 3,
    },
    description: {
        fontSize: 18,
        color: 'white',
        textAlign: 'center',
        marginBottom: 8,
        fontWeight: '600',
    },
    subDescription: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.8)',
        textAlign: 'center',
        marginBottom: 30,
        lineHeight: 20,
    },
    progressContainer: {
        width: '80%',
        marginBottom: 30,
    },
    progressBar: {
        height: 8,
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
        borderRadius: 4,
        overflow: 'hidden',
        marginBottom: 10,
    },
    progressFill: {
        height: '100%',
        width: '65%',
        backgroundColor: '#4ECDC4',
        borderRadius: 4,
    },
    progressText: {
        color: 'white',
        textAlign: 'center',
        fontSize: 12,
        opacity: 0.8,
    },
    featuresContainer: {
        width: '100%',
        marginBottom: 30,
    },
    featureItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        padding: 12,
        borderRadius: 10,
        marginHorizontal: 20,
    },
    featureText: {
        color: 'white',
        marginLeft: 10,
        fontSize: 14,
        fontWeight: '500',
    },
    refreshButton: {
        width: '70%',
        borderRadius: 25,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
        marginBottom: 20,
    },
    buttonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 15,
        paddingHorizontal: 30,
    },
    buttonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
        marginLeft: 8,
    },
    etaContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    etaText: {
        color: 'rgba(255, 255, 255, 0.7)',
        fontSize: 12,
        marginLeft: 5,
    },
    barrier: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(255, 107, 107, 0.9)',
        paddingVertical: 12,
        alignItems: 'center',
    },
    barrierText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 14,
        letterSpacing: 1,
    },
});


export default UnderConstruction