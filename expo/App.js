import { useEffect, useRef, useState } from "react";
import { StyleSheet, View, Text, ActivityIndicator } from "react-native";
import { WebView } from "react-native-webview";
import { StatusBar } from "expo-status-bar";
import AsyncStorage from "@react-native-async-storage/async-storage";

const PWA_URL = process.env.EXPO_PUBLIC_PWA_URL || "https://waveyy.vercel.app";
const HAS_LOADED_KEY = "@waveyy_has_loaded";

export default function App() {
  const webRef = useRef(null);
  const [showSplash, setShowSplash] = useState(true);
  const [isFirstLoad, setIsFirstLoad] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(HAS_LOADED_KEY).then((val) => {
      if (val === "true") {
        setIsFirstLoad(false);
        setShowSplash(false);
      }
    });
  }, []);

  const handleLoaded = () => {
    setShowSplash(false);
    if (isFirstLoad) {
      AsyncStorage.setItem(HAS_LOADED_KEY, "true");
      setIsFirstLoad(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      {showSplash && (
        <View style={styles.splash}>
          <Text style={styles.logo}>Waveyy</Text>
          <ActivityIndicator size="large" color="#1DB954" />
          <Text style={styles.sub}>Sound like real waves.</Text>
        </View>
      )}
      <WebView
        ref={webRef}
        source={{ uri: PWA_URL }}
        style={styles.webview}
        onLoadEnd={handleLoaded}
        javaScriptEnabled
        domStorageEnabled
        startInLoadingState
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
        sharedCookiesEnabled
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  webview: {
    flex: 1,
    backgroundColor: "transparent",
  },
  splash: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
    zIndex: 10,
  },
  logo: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "700",
    letterSpacing: -0.5,
  },
  sub: {
    color: "#666",
    fontSize: 14,
  },
});
