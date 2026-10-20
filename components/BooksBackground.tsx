import { Image, StyleSheet, View } from 'react-native';

export default function BooksBackground() {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Image
        source={require('../assets/images/bookshelf-background.jpg')}
        style={StyleSheet.absoluteFill}
        resizeMode="stretch"
      />
      <View style={styles.wash} />
    </View>
  );
}

const styles = StyleSheet.create({
  wash: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(255, 249, 233, 0.68)',
  },
});
