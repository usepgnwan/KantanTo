declare module 'echarts-for-react' {
  import { Component } from 'react';
  import * as echarts from 'echarts';

  interface ReactEChartsProps {
    option: echarts.EChartsOption;
    style?: React.CSSProperties;
    className?: string;
    theme?: string | object;
    onChartReady?: (chart: echarts.ECharts) => void;
    onEvents?: Record<string, Function>;
    opts?: {
      devicePixelRatio?: number;
      renderer?: 'canvas' | 'svg';
      width?: number | null | undefined | 'auto';
      height?: number | null | undefined | 'auto';
    };
    notMerge?: boolean;
    lazyUpdate?: boolean;
    showLoading?: boolean;
    loadingOption?: object;
  }

  class ReactECharts extends Component<ReactEChartsProps> {}
  export default ReactECharts;
}

declare module 'echarts';
