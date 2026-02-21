"use client";

import StepDocuments from "@/components/StepDocuments";
import StepModel from "@/components/StepModel";
import StepSearch from "@/components/StepSearch";
import StepTerms from "@/components/StepTerms";
import { Step, useLab } from "@/context/LabContext";

export default function Home() {
  const { currentStep, setStep, model } = useLab();

  // Dynamically determine the steps sequence based on the selected model
  const steps: Step[] =
    model === "VECTOR"
      ? ["MODEL", "DOCUMENTS", "SEARCH"]
      : ["MODEL", "TERMS", "DOCUMENTS", "SEARCH"];
  const currentIndex = Math.max(steps.indexOf(currentStep), 0);

  return (
    <div className="space-y-8">
      {/* Progress Bar */}
      <div className="flex justify-between items-center mb-8 relative">
        <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-200 -z-10"></div>
        {steps.map((stepName, index) => {
          const stepIndex = steps.indexOf(stepName);
          const canNavigate = stepIndex <= currentIndex;

          return (
            <StepIndicator
              key={stepName}
              step={stepName}
              current={currentStep}
              label={`${index + 1}. ${
                stepName.charAt(0) + stepName.slice(1).toLowerCase()
              }`}
              allSteps={steps}
              disabled={!canNavigate}
              onClick={() => {
                if (canNavigate) setStep(stepName);
              }}
            />
          );
        })}
      </div>

      {/* Conditional Rendering of Steps */}
      <div className="transition-all duration-300">
        {currentStep === "MODEL" && <StepModel />}
        {currentStep === "TERMS" && <StepTerms />}
        {currentStep === "DOCUMENTS" && <StepDocuments />}
        {currentStep === "SEARCH" && <StepSearch />}
      </div>
    </div>
  );
}

function StepIndicator({
  step,
  current,
  label,
  allSteps,
  disabled,
  onClick,
}: {
  step: string;
  current: string;
  label: string;
  allSteps: string[];
  disabled: boolean;
  onClick: () => void;
}) {
  const stepIndex = allSteps.indexOf(step);
  const currentIndex = allSteps.indexOf(current);

  const isActive = step === current;
  const isCompleted = stepIndex < currentIndex;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-current={isActive ? "step" : undefined}
      className={`flex flex-col items-center bg-slate-50 px-4 ${
        disabled ? "cursor-not-allowed opacity-70" : "cursor-pointer"
      }`}
    >
      <div
        className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm mb-2 transition-colors duration-300
        ${isActive ? "bg-blue-600 text-white ring-4 ring-blue-100" : ""}
        ${isCompleted ? "bg-green-500 text-white" : ""}
        ${!isActive && !isCompleted ? "bg-slate-200 text-slate-500" : ""}
        `}
      >
        {isCompleted ? "\u2713" : stepIndex + 1}
      </div>
      <span
        className={`text-sm font-medium ${
          isActive ? "text-blue-600" : "text-slate-500"
        }`}
      >
        {label}
      </span>
    </button>
  );
}
