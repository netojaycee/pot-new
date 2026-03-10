"use client";

import { CheckCircle2, Clock, AlertCircle } from "lucide-react";

interface StatusStep {
  label: string;
  status: "completed" | "pending" | "failed";
  timestamp?: Date;
  description?: string;
}

interface OrderTimelineProps {
  steps: StatusStep[];
}

export function OrderTimeline({ steps }: OrderTimelineProps) {
  return (
    <div className="space-y-4">
      {steps.map((step, index) => {
        const isCompleted = step.status === "completed";
        const isFailed = step.status === "failed";
        const isPending = step.status === "pending";

        const IconComponent = isCompleted
          ? CheckCircle2
          : isFailed
            ? AlertCircle
            : Clock;

        const iconColor = isCompleted
          ? "text-green-500"
          : isFailed
            ? "text-red-500"
            : "text-gray-300";

        return (
          <div key={index} className="flex gap-4">
            {/* Timeline Icon */}
            <div className="flex flex-col items-center">
              <IconComponent className={`w-6 h-6 ${iconColor}`} />
              {index < steps.length - 1 && (
                <div
                  className={`w-0.5 h-12 mt-2 ${
                    isCompleted || isFailed ? "bg-gray-300" : "bg-gray-200"
                  }`}
                />
              )}
            </div>

            {/* Timeline Content */}
            <div className="flex-1 pb-4">
              <div className="flex items-baseline justify-between gap-3">
                <h4
                  className={`font-semibold ${
                    isCompleted || isFailed
                      ? "text-gray-900"
                      : "text-gray-500"
                  }`}
                >
                  {step.label}
                </h4>
              {step.timestamp && (
                  <span className="text-sm text-gray-500 whitespace-nowrap">
                    {new Date(step.timestamp).toLocaleTimeString("en-GB", {
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: true,
                    })} • {new Date(step.timestamp).toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                    })}
                  </span>
                )}
              </div>
              {step.description && (
                <p className="text-sm text-gray-600 mt-1">
                  {step.description}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
