"use client";

import { cn } from "@/lib/utils";

type Phase = "initialization" | "ideation" | "foundation" | "structure";

interface PhaseAnimationProps {
  currentStep: string;
  bookTitle?: string;
  className?: string;
}

const phaseConfig: Record<Phase, { title: string; subtitle: string }> = {
  initialization: {
    title: "Getting Started",
    subtitle: "Preparing your creative workspace...",
  },
  ideation: {
    title: "Discovery Phase",
    subtitle: "Exploring ideas and possibilities...",
  },
  foundation: {
    title: "Building Foundation",
    subtitle: "Crafting the core elements of your story...",
  },
  structure: {
    title: "Designing Structure",
    subtitle: "Organizing chapters and flow...",
  },
};

function getPhaseFromStep(step: string): Phase {
  if (step === "initialization") return "initialization";
  if (step === "ideation") return "ideation";
  if (step === "foundation") return "foundation";
  if (step === "structure") return "structure";
  return "initialization";
}

// Animated lightbulb for ideation phase
function IdeationAnimation() {
  return (
    <svg
      viewBox="0 0 200 200"
      className="w-48 h-48 text-primary"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Glowing background */}
      <circle cx="100" cy="80" r="60" className="fill-primary/20">
        <animate
          attributeName="r"
          values="55;65;55"
          dur="2s"
          repeatCount="indefinite"
        />
        <animate
          attributeName="opacity"
          values="0.2;0.4;0.2"
          dur="2s"
          repeatCount="indefinite"
        />
      </circle>

      {/* Lightbulb outline */}
      <path
        d="M100 30 C65 30 45 55 45 85 C45 105 55 120 70 130 L70 150 L130 150 L130 130 C145 120 155 105 155 85 C155 55 135 30 100 30Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
      />

      {/* Lightbulb base */}
      <g className="text-muted-foreground">
        <rect x="70" y="150" width="60" height="8" rx="2" fill="currentColor" />
        <rect x="75" y="162" width="50" height="6" rx="2" fill="currentColor" />
        <path
          d="M85 170 Q100 180 115 170"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
        />
      </g>

      {/* Sparkles */}
      {[
        { cx: 40, cy: 50, delay: 0 },
        { cx: 160, cy: 60, delay: 0.5 },
        { cx: 30, cy: 100, delay: 1 },
        { cx: 170, cy: 90, delay: 1.5 },
      ].map((spark, i) => (
        <circle
          key={i}
          cx={spark.cx}
          cy={spark.cy}
          r="3"
          className="fill-primary"
          opacity="0"
        >
          <animate
            attributeName="opacity"
            values="0;1;0"
            dur="2s"
            begin={`${spark.delay}s`}
            repeatCount="indefinite"
          />
          <animate
            attributeName="r"
            values="2;4;2"
            dur="2s"
            begin={`${spark.delay}s`}
            repeatCount="indefinite"
          />
        </circle>
      ))}
    </svg>
  );
}

// Animated building blocks for foundation phase
function FoundationAnimation() {
  return (
    <svg
      viewBox="0 0 200 200"
      className="w-48 h-48 text-primary"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Bottom layer */}
      <rect
        x="30"
        y="140"
        width="140"
        height="30"
        rx="4"
        className="fill-primary/80"
      />

      {/* Middle layer - animates in */}
      <rect
        x="50"
        y="105"
        width="100"
        height="30"
        rx="4"
        className="fill-primary/60"
      >
        <animate
          attributeName="y"
          values="80;105;105"
          dur="2s"
          repeatCount="indefinite"
        />
        <animate
          attributeName="opacity"
          values="0;1;1"
          dur="2s"
          repeatCount="indefinite"
        />
      </rect>

      {/* Top layer - animates in */}
      <rect
        x="70"
        y="70"
        width="60"
        height="30"
        rx="4"
        className="fill-primary/40"
      >
        <animate
          attributeName="y"
          values="40;70;70"
          dur="2s"
          begin="0.5s"
          repeatCount="indefinite"
        />
        <animate
          attributeName="opacity"
          values="0;1;1"
          dur="2s"
          begin="0.5s"
          repeatCount="indefinite"
        />
      </rect>

      {/* Connection lines */}
      <g className="stroke-muted-foreground" strokeWidth="1">
        <line x1="100" y1="70" x2="100" y2="50" opacity="0">
          <animate
            attributeName="opacity"
            values="0;0.5;0"
            dur="3s"
            repeatCount="indefinite"
          />
        </line>
        <line x1="85" y1="55" x2="115" y2="55" opacity="0">
          <animate
            attributeName="opacity"
            values="0;0.5;0"
            dur="3s"
            repeatCount="indefinite"
          />
        </line>
      </g>
    </svg>
  );
}

// Animated structure/outline for structure phase
function StructureAnimation() {
  return (
    <svg
      viewBox="0 0 200 200"
      className="w-48 h-48 text-primary"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Book outline - pages */}
      <path d="M40 30 L100 40 L100 170 L40 160 Z" className="fill-primary/20" />
      <path
        d="M160 30 L100 40 L100 170 L160 160 Z"
        className="fill-primary/20"
      />

      {/* Book spine and top */}
      <path
        d="M40 30 L100 40 L160 30"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
      <line
        x1="100"
        y1="40"
        x2="100"
        y2="170"
        stroke="currentColor"
        strokeWidth="2"
      />

      {/* Chapter lines - left page */}
      {[50, 70, 90, 110, 130].map((y, i) => (
        <line
          key={`left-${i}`}
          x1="50"
          y1={y}
          x2="90"
          y2={y + 2}
          className="stroke-muted-foreground"
          strokeWidth="2"
          strokeLinecap="round"
          opacity="0"
        >
          <animate
            attributeName="opacity"
            values="0;0.6;0.6"
            dur="0.5s"
            begin={`${i * 0.2}s`}
            fill="freeze"
            repeatCount="indefinite"
          />
        </line>
      ))}

      {/* Chapter lines - right page */}
      {[50, 70, 90, 110, 130].map((y, i) => (
        <line
          key={`right-${i}`}
          x1="110"
          y1={y + 2}
          x2="150"
          y2={y}
          className="stroke-muted-foreground"
          strokeWidth="2"
          strokeLinecap="round"
          opacity="0"
        >
          <animate
            attributeName="opacity"
            values="0;0.6;0.6"
            dur="0.5s"
            begin={`${i * 0.2 + 0.1}s`}
            fill="freeze"
            repeatCount="indefinite"
          />
        </line>
      ))}

      {/* Pen drawing animation */}
      <path d="M165 20 L175 30 L150 55 L140 45 Z" className="fill-primary/80">
        <animateTransform
          attributeName="transform"
          type="translate"
          values="0,0; -30,30; -30,30; 0,0"
          dur="3s"
          repeatCount="indefinite"
        />
      </path>
    </svg>
  );
}

// Animated starting/initialization
function InitializationAnimation() {
  return (
    <svg
      viewBox="0 0 200 200"
      className="w-48 h-48 text-primary"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Pulsing center */}
      <circle cx="100" cy="100" r="20" className="fill-primary">
        <animate
          attributeName="r"
          values="15;25;15"
          dur="1.5s"
          repeatCount="indefinite"
        />
        <animate
          attributeName="opacity"
          values="0.6;1;0.6"
          dur="1.5s"
          repeatCount="indefinite"
        />
      </circle>

      {/* Expanding rings */}
      {[0, 1, 2].map((i) => (
        <circle
          key={i}
          cx="100"
          cy="100"
          r="30"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          opacity="0"
        >
          <animate
            attributeName="r"
            values="20;70;70"
            dur="2s"
            begin={`${i * 0.6}s`}
            repeatCount="indefinite"
          />
          <animate
            attributeName="opacity"
            values="0.8;0;0"
            dur="2s"
            begin={`${i * 0.6}s`}
            repeatCount="indefinite"
          />
        </circle>
      ))}

      {/* Orbiting dots */}
      {[0, 1, 2, 3].map((i) => (
        <circle key={`orbit-${i}`} r="5" className="fill-primary/60">
          <animateMotion
            dur="3s"
            repeatCount="indefinite"
            begin={`${i * 0.75}s`}
            path="M100,100 m-50,0 a50,50 0 1,1 100,0 a50,50 0 1,1 -100,0"
          />
        </circle>
      ))}
    </svg>
  );
}

export function PhaseAnimation({
  currentStep,
  bookTitle,
  className,
}: PhaseAnimationProps) {
  const phase = getPhaseFromStep(currentStep);
  const config = phaseConfig[phase];

  const renderAnimation = () => {
    switch (phase) {
      case "ideation":
        return <IdeationAnimation />;
      case "foundation":
        return <FoundationAnimation />;
      case "structure":
        return <StructureAnimation />;
      default:
        return <InitializationAnimation />;
    }
  };

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center h-full min-h-[500px] space-y-8 px-8",
        className
      )}
    >
      {/* Animation */}
      <div className="relative">{renderAnimation()}</div>

      {/* Phase info */}
      <div className="text-center space-y-3 max-w-md">
        <h2 className="text-2xl font-semibold text-foreground">
          {config.title}
        </h2>
        <p className="text-muted-foreground">{config.subtitle}</p>
        {bookTitle && (
          <p className="text-sm text-muted-foreground/70 italic">
            "{bookTitle}"
          </p>
        )}
      </div>

      {/* Progress indicator */}
      <div className="flex items-center gap-2 mt-4">
        {(
          ["initialization", "ideation", "foundation", "structure"] as Phase[]
        ).map((p, i) => (
          <div
            key={p}
            className={cn(
              "w-2 h-2 rounded-full transition-all duration-300",
              phase === p
                ? "w-8 bg-primary"
                : phaseConfig[phase] &&
                    Object.keys(phaseConfig).indexOf(phase) >= i
                  ? "bg-primary/50"
                  : "bg-muted"
            )}
          />
        ))}
      </div>
    </div>
  );
}
