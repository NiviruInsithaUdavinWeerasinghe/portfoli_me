import React from "react";
// import { useTheme } from "../../context/ThemeContext";

// --- HOME COMPONENTS ONLY ---
import LiquidGlassUserHome from "../../templates/liquid_glass/LiquidGlassUserHome";
import MinimalistUserHome from "../../templates/minimalist/MinimalistUserHome";
import CyberpunkUserHome from "../../templates/cyberpunk/CyberpunkUserHome";
import PaperSketchUserHome from "../../templates/paper_sketch/PaperSketchUserHome";
import SkeuomorphismUserHome from "../../templates/skeuomorphism/SkeuomorphismUserHome";

const UserHome = () => {
  // const { theme } = useTheme();
  const theme = "liquid_glass"; // This must match the Layout theme

  switch (theme) {
    case "minimalist":
      return <MinimalistUserHome />;
    case "cyberpunk":
      return <CyberpunkUserHome />;
    case "paper_sketch":
      return <PaperSketchUserHome />;
    case "skeuomorphism":
      return <SkeuomorphismUserHome />;
    case "liquid_glass":
    default:
      return <LiquidGlassUserHome />;
  }
};

export default UserHome;
