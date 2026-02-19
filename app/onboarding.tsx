import { APP_COLORS } from '@/constants/appTheme';
import { storage } from '@/lib/storage';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const ONBOARDING_BG_TOP = '#E8F4FC';
const SLIDE_WIDTH = SCREEN_WIDTH;
const IMAGE_HORIZONTAL_MARGIN = 32;
const IMAGE_MAX_WIDTH = SCREEN_WIDTH - IMAGE_HORIZONTAL_MARGIN * 2;
const HIGHLIGHT_BLUE = '#2563EB';
const ACCENT_TEAL = '#84afc6'; // "Trusted" and "Opportunities" color

// Color palette
const COLORS = {
  primary: '#1E4154',
  secondary: '#8692A6',
  text: '#031019',
  border: '#E6E6E6',
  white: '#FFFFFF',
  lightGray: '#F9FAFB',
};

// Typography
const TYPOGRAPHY = {
  titleFamily: 'Kanit',
  bodyFamily: 'Kanit',
  headingSize: 29,
  headingWeight: '500',
  headingLineHeight: 40,
  bodySize: 15,
  bodyLineHeight: 25,
};

type SlideItem = {
  key: string;
  title: string;
  boldPart: string;
  /** Optional: extra parts to highlight with accent color #84afc6 (e.g. "Trusted", "Opportunities") */
  accentParts?: string[];
  body: string;
  illustration: string;
  bannerImage?: number;
};

const SLIDES: SlideItem[] = [
  {
    key: '1',
    title: 'Discover Trusted Job Opportunities Near You',
    boldPart: 'Trusted Job',
    accentParts: ['Trusted', 'Opportunities'],
    body: 'Explore real job openings from verified employers across Venezuela. Find opportunities that match your skills, location, and experience — all in one secure platform.',
    illustration: 'grid',
    bannerImage: require('@/assets/images/onboarding-1.png'),
  },
  {
    key: '2',
    title: 'Apply to Jobs Faster With Just One Tap',
    boldPart: 'One Tap',
    accentParts: ['Faster', 'One Tap'],
    body: 'Create your professional profile once and use it to apply for multiple jobs instantly. No repeated forms or CV uploads — everything is saved securely for you.',
    illustration: 'phone',
    bannerImage: require('@/assets/images/onboarding-2.png'),
  },
  {
    key: '3',
    title: 'Secure Chat With Employers After Approval',
    boldPart: 'Employers After Approval',
    accentParts: ['Employers', 'Approval'],
    body: 'Communicate safely with employers only after your application is approved. All conversations stay inside the app to protect you from scams and misuse.',
    illustration: 'chat',
    bannerImage: require('@/assets/images/onboarding-3.png'),
  },
];

function renderTitle(title: string, boldPart: string, accentParts?: string[]) {
  // If accentParts provided (e.g. "Trusted", "Opportunities"), color those with #84afc6
  if (accentParts && accentParts.length > 0) {
    let remaining = title;
    const segments: React.ReactNode[] = [];
    accentParts.forEach((accent, i) => {
      const idx = remaining.indexOf(accent);
      if (idx > 0) {
        segments.push(remaining.slice(0, idx));
        remaining = remaining.slice(idx);
      }
      if (remaining.startsWith(accent)) {
        segments.push(<Text key={`accent-${i}`} style={styles.headingAccent}>{accent}</Text>);
        remaining = remaining.slice(accent.length);
      }
    });
    if (remaining) {
      segments.push(remaining);
    }
    return (
      <Text style={styles.heading}>
        {segments}
      </Text>
    );
  }
  const parts = title.split(boldPart);
  return (
    <Text style={styles.heading}>
      {parts[0]}
      <Text style={styles.headingBold}>{boldPart}</Text>
      {parts[1]}
    </Text>
  );
}

function IllustrationGrid() {
  const icons: (keyof typeof Ionicons.glyphMap)[] = [
    'medkit-outline',
    'leaf-outline',
    'flame-outline',
    'construct-outline',
    'shield-checkmark-outline',
    'restaurant-outline',
  ];
  return (
    <View style={styles.illustrationTop}>
      <View style={styles.gridRow}>
        {icons.slice(0, 3).map((name, i) => (
          <View key={i} style={styles.gridCircle}>
            <Ionicons name={name} size={36} color={APP_COLORS.primary} />
          </View>
        ))}
      </View>
      <View style={styles.gridRow}>
        {icons.slice(3, 6).map((name, i) => (
          <View key={i} style={styles.gridCircle}>
            <Ionicons name={name} size={36} color={APP_COLORS.primary} />
          </View>
        ))}
      </View>
    </View>
  );
}

function IllustrationPhone() {
  return (
    <View style={styles.illustrationTop}>
      <View style={styles.phoneRow}>
        <View style={styles.personStick}>
          <View style={styles.personHead} />
          <View style={styles.personBody} />
        </View>
        <View style={styles.phoneMock}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={22} color={APP_COLORS.textMuted} />
          </View>
        </View>
      </View>
      <View style={styles.cloudRow}>
        <View style={styles.cloud} />
        <View style={[styles.cloud, styles.cloudSmall]} />
        <View style={[styles.cloud, styles.cloudTiny]} />
      </View>
    </View>
  );
}

function IllustrationChat() {
  return (
    <View style={styles.illustrationTop}>
      <View style={styles.chatRow}>
        <View style={styles.personStick}>
          <View style={styles.personHead} />
          <View style={styles.personBody} />
        </View>
        <View style={styles.bubblesWrap}>
          <View style={[styles.bubble, styles.bubble1]} />
          <View style={[styles.bubble, styles.bubble2]} />
          <View style={[styles.bubble, styles.bubble3]} />
          <View style={[styles.bubble, styles.bubble4]} />
        </View>
      </View>
      <View style={styles.plantPlaceholder}>
        <Ionicons name="leaf" size={28} color={APP_COLORS.success} />
      </View>
    </View>
  );
}

function SlideIllustration(
  type: string,
  bannerImage?: number
) {
  if (bannerImage != null) {
    return (
      <Image
        source={bannerImage}
        style={styles.bannerImage}
        resizeMode="contain"
      />
    );
  }
  if (type === 'grid') return <IllustrationGrid />;
  if (type === 'phone') return <IllustrationPhone />;
  return <IllustrationChat />;
}

export default function OnboardingScreen() {
  const [index, setIndex] = useState(0);
  const listRef = useRef<FlatList>(null);
  const isLast = index === SLIDES.length - 1;

  const goToLogin = () => {
    setTimeout(() => {
      router.replace('/login');
    }, 100);
  };

  const handleNext = async () => {
    if (isLast) {
      await storage.setOnboardingSeen();
      goToLogin();
      return;
    }
    listRef.current?.scrollToOffset({ offset: (index + 1) * SLIDE_WIDTH, animated: true });
    setIndex(index + 1);
  };

  const handleSkip = async () => {
    await storage.setOnboardingSeen();
    goToLogin();
  };

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <FlatList
        ref={listRef}
        data={SLIDES}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => setIndex(Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH))}
        renderItem={({ item }) => (
          <View style={styles.slide}>
            <View style={styles.topSection}>
              <View style={styles.imageContainer}>
                {SlideIllustration(item.illustration, item.bannerImage)}
              </View>
            </View>
            <View style={styles.bottomSection}>
              <ScrollView
                contentContainerStyle={styles.bottomContent}
                showsVerticalScrollIndicator={false}
              >
                {renderTitle(item.title, item.boldPart, item.accentParts)}
                <Text style={styles.body}>{item.body}</Text>
              </ScrollView>
            </View>
          </View>
        )}
        keyExtractor={(item) => item.key}
      />
      <View style={styles.footer}>
        <View style={styles.dots}>
          {SLIDES.map((_, i) => (
            <View
              key={i}
              style={[styles.dot, i === index && styles.dotActive]}
            />
          ))}
        </View>
        <View style={styles.dividerLineWrapper}>
          <View style={styles.dividerLine} />
        </View>
        <View style={styles.buttons}>
          {!isLast && (
            <TouchableOpacity style={styles.skipBtn} onPress={handleSkip} activeOpacity={0.8}>
              <Text style={styles.skipText}>Skip</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.nextBtn, isLast && styles.nextBtnFull]}
            onPress={handleNext}
            activeOpacity={0.85}
          >
            <Text style={styles.nextText}>{isLast ? "Let's Get Started" : 'Next →'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  slide: {
    width: SLIDE_WIDTH,
    flex: 1,
  },
  topSection: {
    height: '50%',
    backgroundColor: ONBOARDING_BG_TOP,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  imageContainer: {
    width: '100%',
    paddingHorizontal: IMAGE_HORIZONTAL_MARGIN,
    maxWidth: SCREEN_WIDTH,
    backgroundColor: ONBOARDING_BG_TOP,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  bannerImage: {
    width: '100%',
    height: '100%',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  bottomSection: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 28,
    paddingTop: 12,
    paddingBottom: 8,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  bottomContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8,
  },
  heading: {
    fontSize: TYPOGRAPHY.headingSize,
    fontWeight: TYPOGRAPHY.headingWeight,
    fontFamily: TYPOGRAPHY.titleFamily,
    color: COLORS.text,
    lineHeight: TYPOGRAPHY.headingLineHeight,
    marginBottom: 16,
    textAlign: 'center',
    letterSpacing: 0,
  },
  headingBold: {
    fontWeight: TYPOGRAPHY.headingWeight,
    fontFamily: TYPOGRAPHY.titleFamily,
    color: COLORS.primary,
  },
  headingAccent: {
    fontWeight: TYPOGRAPHY.headingWeight,
    fontFamily: TYPOGRAPHY.titleFamily,
    color: ACCENT_TEAL,
  },
  body: {
    fontSize: TYPOGRAPHY.bodySize,
    fontFamily: TYPOGRAPHY.bodyFamily,
    color: COLORS.text,
    lineHeight: TYPOGRAPHY.bodyLineHeight,
    textAlign: 'center',
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 32,
    paddingTop: 12,
    backgroundColor: '#F9FAFB',
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  dot: {
    width: 24,
    height: 4,
    borderRadius: 16,
    backgroundColor: COLORS.border,
    opacity: 1,
  },
  dotActive: {
    width: 40,
    height: 4,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    opacity: 1,
  },
  dividerLineWrapper: {
    width: SCREEN_WIDTH,
    marginHorizontal: -24,
    marginBottom: 12,
  },
  dividerLine: {
    width: '100%',
    height: 1,
    backgroundColor: COLORS.secondary,
    opacity: 0.3,
  },
  buttons: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 12,
    width: '100%',
  },
  skipBtn: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#E6E6E6',
    borderRadius: 56,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 0,
  },
  skipText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: TYPOGRAPHY.bodyFamily,
    color: COLORS.text,
  },
  nextBtn: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 56,
    backgroundColor: COLORS.primary,
    borderWidth: 1,
    borderColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 0,
  },
  nextBtnFull: {
    flex: 1,
  },
  nextText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: TYPOGRAPHY.bodyFamily,
    color: COLORS.white,
  },
  illustrationTop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  gridRow: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 16,
  },
  gridCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
  },
  personStick: {
    alignItems: 'center',
  },
  personHead: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: APP_COLORS.primary,
    opacity: 0.9,
    marginBottom: 8,
  },
  personBody: {
    width: 56,
    height: 70,
    borderRadius: 12,
    backgroundColor: APP_COLORS.primary,
    opacity: 0.8,
  },
  phoneMock: {
    width: 140,
    height: 180,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    padding: 16,
    alignItems: 'center',
    justifyContent: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  searchBar: {
    width: '100%',
    height: 44,
    borderRadius: 22,
    backgroundColor: APP_COLORS.surfaceGray,
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingRight: 16,
  },
  cloudRow: {
    position: 'absolute',
    bottom: 20,
    flexDirection: 'row',
    gap: 12,
  },
  cloud: {
    width: 40,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(30, 74, 111, 0.15)',
  },
  cloudSmall: { width: 28, height: 18 },
  cloudTiny: { width: 20, height: 14 },
  chatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  bubblesWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: 140,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  bubble: {
    backgroundColor: APP_COLORS.primary,
    opacity: 0.85,
  },
  bubble1: { width: 56, height: 48, borderRadius: 16 },
  bubble2: { width: 48, height: 40, borderRadius: 14 },
  bubble3: { width: 44, height: 36, borderRadius: 12 },
  bubble4: { width: 52, height: 44, borderRadius: 14 },
  plantPlaceholder: {
    position: 'absolute',
    bottom: 24,
    left: '20%',
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
