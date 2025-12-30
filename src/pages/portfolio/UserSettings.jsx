import React from "react";
// import { useTheme } from "../../context/ThemeContext";

// --- SETTINGS COMPONENTS ONLY ---
import LiquidGlassUserSettings from "../../templates/liquid_glass/LiquidGlassUserSettings";
import MinimalistUserSettings from "../../templates/minimalist/MinimalistUserSettings";
import CyberpunkUserSettings from "../../templates/cyberpunk/CyberpunkUserSettings";
import PaperSketchUserSettings from "../../templates/paper_sketch/PaperSketchUserSettings";
import SkeuomorphismUserSettings from "../../templates/skeuomorphism/SkeuomorphismUserSettings";

const UserSettings = () => {
  // const { theme } = useTheme();
  const theme = "liquid_glass"; // This must match the Layout theme

  switch (theme) {
    case "minimalist":
      return <MinimalistUserSettings />;
    case "cyberpunk":
      return <CyberpunkUserSettings />;
    case "paper_sketch":
      return <PaperSketchUserSettings />;
    case "skeuomorphism":
      return <SkeuomorphismUserSettings />;
    case "liquid_glass":
    default:
      return <LiquidGlassUserSettings />;
  }
};

export default UserSettings;
