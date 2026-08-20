import React, { useEffect, useRef } from 'react';
import lottie, { AnimationItem } from 'lottie-web';

interface LottiePlayerProps {
  animationData: any;
  loop?: boolean;
  autoplay?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

const LottiePlayer: React.FC<LottiePlayerProps> = ({
  animationData,
  loop = true,
  autoplay = true,
  className = '',
  style,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<AnimationItem | null>(null);

  useEffect(() => {
    if (!containerRef.current || !animationData) return;

    if (animRef.current) {
      animRef.current.destroy();
    }

    animRef.current = lottie.loadAnimation({
      container: containerRef.current,
      renderer: 'svg',
      loop,
      autoplay,
      animationData,
    });

    return () => {
      if (animRef.current) {
        animRef.current.destroy();
        animRef.current = null;
      }
    };
  }, [animationData, loop, autoplay]);

  return <div ref={containerRef} className={className} style={style} />;
};

export default LottiePlayer;
