import { StyleSheet, Dimensions } from 'react-native';
import colors from '@/constants/colors';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const TREE_WIDTH = screenWidth;
const TREE_HEIGHT = screenHeight * 0.75;

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    position: 'relative',
    paddingTop: 20,
    backgroundColor: colors.white, // Clean white background as in the image
  },
  containerDark: {
    backgroundColor: '#121212',
  },
  zoomControls: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 10,
  },
  zoomButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    elevation: 6,
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  zoomButtonDark: {
    backgroundColor: '#333',
  },
  zoomButtonText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.primary,
  },
  zoomButtonTextDark: {
    color: colors.white,
  },
  treeContainer: {
    width: TREE_WIDTH,
    height: TREE_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  leaf: {
    width: 30,
    height: 20,
    backgroundColor: '#A5D6A7', // Light green for leaves
    position: 'absolute',
    borderRadius: 10,
    opacity: 0.8,
    zIndex: 1,
  },
  trunk: {
    width: 30,
    height: 100,
    backgroundColor: '#8B4513', // Brown trunk
    position: 'absolute',
    borderRadius: 0,
    zIndex: 2,
  },
  trunkDark: {
    backgroundColor: '#6B3000',
  },
  branchLine: {
    position: 'absolute',
    transformOrigin: 'left center',
    borderRadius: 0,
    zIndex: 2,
    height: 2, // Thinner lines as in the image
  },
  fruitStem: {
    position: 'absolute',
    backgroundColor: '#8B4513', // Brown stem
    transformOrigin: 'left center',
    borderRadius: 1,
    zIndex: 2,
  },
  branchContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 3,
  },
  branchFruit: {
    width: 70,
    height: 70,
    borderRadius: 35,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  branchText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  centralNode: {
    position: 'absolute',
    zIndex: 3,
  },
  centralNodeButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
  },
  centralNodeText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  fruitContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 3,
  },
  fruit: {
    width: 20,
    height: 20,
    borderRadius: 10,
    elevation: 4,
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  roots: {
    position: 'absolute',
    width: TREE_WIDTH,
    height: 250,
    zIndex: 2,
  },
  rootLine: {
    height: 2,
    backgroundColor: '#8B4513', // Brown root
    position: 'absolute',
    transformOrigin: 'left center',
    borderRadius: 0,
    zIndex: 2,
  },
  rootLineDark: {
    backgroundColor: '#6B3000',
  },
  root: {
    width: 0, // We don't need visible root circles in this design
    height: 0,
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rootDark: {
    backgroundColor: '#333',
  },
  rootText: {
    fontSize: 12,
    color: colors.white,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  rootTextDark: {
    color: colors.white,
  },
  titleContainer: {
    position: 'absolute',
    top: 40, // Moved down slightly
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    zIndex: 5,
  },
  titleText: {
    fontSize: 22, // Smaller to match image
    fontWeight: 'bold',
    color: '#2C3E50',
    textAlign: 'center',
  },
});