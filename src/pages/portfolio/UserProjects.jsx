import React, { Suspense, lazy } from "react";
import { Loader2 } from "lucide-react";

// --- OPTIMIZATION: Lazy Load Templates ---
// Only the code for the active theme will be loaded into memory.
const LiquidGlassUserProjects = lazy(() =>
  import("../../templates/liquid_glass/LiquidGlassUserProjects")
);
const MinimalistUserProjects = lazy(() =>
  import("../../templates/minimalist/MinimalistUserProjects")
);
const CyberpunkUserProjects = lazy(() =>
  import("../../templates/cyberpunk/CyberpunkUserProjects")
);
const PaperSketchUserProjects = lazy(() =>
  import("../../templates/paper_sketch/PaperSketchUserProjects")
);
const SkeuomorphismUserProjects = lazy(() =>
  import("../../templates/skeuomorphism/SkeuomorphismUserProjects")
);

const UserProjects = () => {
  const theme = "liquid_glass"; // Ideally this comes from props or context

  const renderTheme = () => {
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

  return (
    <Suspense
      fallback={
        <div className="w-full h-96 flex items-center justify-center">
          <Loader2 className="animate-spin text-orange-500" size={32} />
        </div>
      }
    >
      {renderTheme()}
    </Suspense>
  );
};

export default UserProjects;
