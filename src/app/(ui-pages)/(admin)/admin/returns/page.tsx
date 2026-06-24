/*
 * Returns management is disabled for the current phase.
 * The return service, actions, and DB schema are preserved for future use.
 * Re-enable by restoring the full component from git history when ready.
 */
import { RotateCcw } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function ReturnsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <RotateCcw className="w-7 h-7 text-muted-foreground" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Returns</h1>
          <p className="text-sm text-muted-foreground">Return requests management</p>
        </div>
      </div>

      <Card>
        <CardContent className="py-16 text-center space-y-3">
          <RotateCcw className="w-12 h-12 text-muted-foreground mx-auto" />
          <h2 className="text-lg font-semibold">Returns not yet active</h2>
          <p className="text-muted-foreground text-sm max-w-sm mx-auto">
            The returns and refunds module is currently disabled. It will be enabled in a future release once the fulfilment workflow is fully established.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
