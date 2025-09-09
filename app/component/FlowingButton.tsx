"use client";

import { motion } from "framer-motion";

/**
 * FlowingButton组件 - 流动扫描按钮
 * 具有细边框和流动扫描线效果的按钮组件
 */
const FlowingButton = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 0 }}
      animate={{ opacity: 1, y: 30}}
      transition={{ duration: 0.8, delay: 0.5 }}
      className="flex justify-center mt-8"
    >
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="scanning-button relative overflow-hidden group bg-gradient-to-br from-gray-900 to-black border border-cyan-300/20 rounded-lg px-8 py-4"
      >
        {/* 按钮内容 */}
        <div className="relative z-10">
          <span className="text-cyan-300 text-xl font-mono tracking-wider font-medium">
            AUGMENT CLI - AUGGIE 现已推出！
          </span>
        </div>

        {/* 流动扫描线效果 - 顶部 */}
        <motion.div
          className="absolute top-0 left-0 h-0.5 bg-cyan-400"
          style={{
            width: "30%",
            filter: "drop-shadow(0 0 6px #00ffff) drop-shadow(0 0 12px #00ffff)",
          }}
          animate={{
            x: ["-30%", "130%"],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "linear",
          }}
        />

        {/* 流动扫描线效果 - 底部 */}
        <motion.div
          className="absolute bottom-0 left-0 h-0.5 bg-cyan-400"
          style={{
            width: "30%",
            filter: "drop-shadow(0 0 6px #00ffff) drop-shadow(0 0 12px #00ffff)",
          }}
          animate={{
            x: ["130%", "-30%"],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "linear",
            delay: 1,
          }}
        />

        {/* 流动扫描线效果 - 左侧 */}
        <motion.div
          className="absolute top-0 left-0 w-0.5 bg-cyan-400"
          style={{
            height: "30%",
            filter: "drop-shadow(0 0 6px #00ffff) drop-shadow(0 0 12px #00ffff)",
          }}
          animate={{
            y: ["-30%", "130%"],
          }}
          transition={{
            duration: 2.5,
            repeat: Infinity,
            ease: "linear",
            delay: 0.5,
          }}
        />

        {/* 流动扫描线效果 - 右侧 */}
        <motion.div
          className="absolute top-0 right-0 w-0.5 bg-cyan-400"
          style={{
            height: "30%",
            filter: "drop-shadow(0 0 6px #00ffff) drop-shadow(0 0 12px #00ffff)",
          }}
          animate={{
            y: ["130%", "-30%"],
          }}
          transition={{
            duration: 2.5,
            repeat: Infinity,
            ease: "linear",
            delay: 1.5,
          }}
        />

        {/* 背景光晕效果 */}
        <div className="absolute inset-0 bg-cyan-500/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
      </motion.button>
    </motion.div>
  );
};

export default FlowingButton;