import { AlertTriangle } from "lucide-react";

export function Disclaimer() {
  return (
    <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
      <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
      <p>
        <strong>Ethical Use Notice:</strong> Do not use this tool to
        impersonate people without their explicit consent. Voice cloning
        technology should be used responsibly and ethically.
      </p>
    </div>
  );
}
