"use client";

import StepDocuments from "@/components/StepDocuments";
import StepSearch from "@/components/StepSearch";
import StepTerms from "@/components/StepTerms";
import { useLab } from "@/context/LabContext";

export default function Home() {
  const { currentStep } = useLab();

  return (
    <div className="space-y-8">
      {/* Progress Bar */}
      <div className="flex justify-between items-center mb-8 relative">
        <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-200 -z-10"></div>

        <StepIndicator step="TERMS" current={currentStep} label="1. Terms" />
        <StepIndicator
          step="DOCUMENTS"
          current={currentStep}
          label="2. Documents"
        />
        <StepIndicator step="SEARCH" current={currentStep} label="3. Search" />
      </div>

      {/* Conditional Rendering of Steps */}
      <div className="transition-all duration-300">
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
}: {
  step: string;
  current: string;
  label: string;
}) {
  const steps = ["TERMS", "DOCUMENTS", "SEARCH"];
  const stepIndex = steps.indexOf(step);
  const currentIndex = steps.indexOf(current);

  const isActive = step === current;
  const isCompleted = stepIndex < currentIndex;

  return (
    <div className={`flex flex-col items-center bg-slate-50 px-4`}>
      <div
        className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm mb-2 transition-colors duration-300
        ${isActive ? "bg-blue-600 text-white ring-4 ring-blue-100" : ""}
        ${isCompleted ? "bg-green-500 text-white" : ""}
        ${!isActive && !isCompleted ? "bg-slate-200 text-slate-500" : ""}
        `}
      >
        {isCompleted ? "✓" : stepIndex + 1}
      </div>
      <span
        className={`text-sm font-medium ${isActive ? "text-blue-600" : "text-slate-500"}`}
      >
        {label}
      </span>
    </div>
  );
}
