import { StatusBar } from "expo-status-bar";
import { StyleSheet, Text, View } from "react-native";

export default function Health() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Worksie</Text>
      <Text style={styles.subtitle}>Phase 1 scaffold · ok: true</Text>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    padding: 24
  },
  title: {
    fontSize: 28,
    fontWeight: "600"
  },
  subtitle: {
    marginTop: 8,
    fontSize: 14,
    opacity: 0.7
  }
});
