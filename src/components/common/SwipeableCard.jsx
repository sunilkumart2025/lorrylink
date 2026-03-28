import React from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import RateCard from './RateCard';

export default function SwipeableCard({ data, onSwipeRight, onSwipeLeft }) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-25, 25]);
  const opacity = useTransform(x, [-200, -150, 0, 150, 200], [0, 1, 1, 1, 0]);

  const handleDragEnd = (event, info) => {
    if (info.offset.x > 100) {
      onSwipeRight(data.id);
    } else if (info.offset.x < -100) {
      onSwipeLeft(data.id);
    }
  };

  return (
    <motion.div
      style={{ x, rotate, opacity, cursor: 'grab' }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      onDragEnd={handleDragEnd}
      whileTap={{ scale: 0.95 }}
    >
      <RateCard data={data} />
    </motion.div>
  );
}
