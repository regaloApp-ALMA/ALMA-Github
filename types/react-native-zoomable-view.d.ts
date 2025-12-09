declare module '@openspacelabs/react-native-zoomable-view' {
  import { Component } from 'react';
  import { ViewStyle } from 'react-native';

  export interface ReactNativeZoomableViewProps {
    maxZoom?: number;
    minZoom?: number;
    zoomStep?: number;
    initialZoom?: number;
    bindToBorders?: boolean;
    style?: ViewStyle;
    contentWidth?: number;
    contentHeight?: number;
    initialOffsetX?: number;
    initialOffsetY?: number;
    children?: React.ReactNode;
  }

  export class ReactNativeZoomableView extends Component<ReactNativeZoomableViewProps> {}
}

