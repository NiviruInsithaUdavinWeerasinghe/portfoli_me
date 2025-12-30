import React from "react";
// import { useTheme } from "../../context/ThemeContext";

// --- PROJECT COMPONENTS ONLY ---
import LiquidGlassUserProjects from "../../templates/liquid_glass/LiquidGlassUserProjects";
import MinimalistUserProjects from "../../templates/minimalist/MinimalistUserProjects";
import CyberpunkUserProjects from "../../templates/cyberpunk/CyberpunkUserProjects";
import PaperSketchUserProjects from "../../templates/paper_sketch/PaperSketchUserProjects";
import SkeuomorphismUserProjects from "../../templates/skeuomorphism/SkeuomorphismUserProjects";

const UserProjects = () => {
  const theme = "liquid_glass";

  switch (theme) {
    case "minimalist":
      return <MinimalistUserProjects />;
    case "cyberpunk":
      return <CyberpunkUserProjects />;
    case "paper_sketch":
      return <PaperSketchUserProjects />;
    case "skeuomorphism":
      return <SkeuomorphismUserProjects />;
    case "liquid_glass":
    default:
      return <LiquidGlassUserProjects />;
  }
};

export default UserProjects;
