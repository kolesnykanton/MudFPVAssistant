// leaflet-measure has no types package — minimal declaration for control.measure()
import 'leaflet';
declare module 'leaflet' {
  namespace control {
    function measure(options?: {
      position?: string;
      primaryLengthUnit?: string;
      secondaryLengthUnit?: string;
      primaryAreaUnit?: string;
      secondaryAreaUnit?: string;
      activeColor?: string;
      completedColor?: string;
    }): Control;
  }
}

interface Window {
  lottie: any;
}
