import React from "react";
// You will eventually use a hook like: import { useTheme } from "../../context/ThemeContext";

// --- LAYOUTS ONLY ---
import LiquidGlassPortfolioLayout from "../../templates/liquid_glass/LiquidGlassPortfolioLayout";
import MinimalistPortfolioLayout from "../../templates/minimalist/MinimalistPortfolioLayout";
import CyberpunkPortfolioLayout from "../../templates/cyberpunk/CyberpunkPortfolioLayout";
import PaperSketchPortfolioLayout from "../../templates/paper_sketch/PaperSketchPortfolioLayout";
import SkeuomorphismPortfolioLayout from "../../templates/skeuomorphism/SkeuomorphismPortfolioLayout";

const PortfolioLayout = () => {
  // const { theme } = useTheme();
  // For now, hardcoding the test theme:
  const theme = "liquid_glass";
  // const theme = "minimalist";
  // const theme = "cyberpunk";
  // const theme = "paper_sketch";
  // const theme = "skeuomorphism";

  switch (theme) {
    case "minimalist":
      return <MinimalistPortfolioLayout />;
    case "cyberpunk":
      return <CyberpunkPortfolioLayout />;
    case "paper_sketch":
      return <PaperSketchPortfolioLayout />;
    case "skeuomorphism":
      return <SkeuomorphismPortfolioLayout />;
    case "liquid_glass":
    default:
      return <LiquidGlassPortfolioLayout />;
  }
};

export default PortfolioLayout;
