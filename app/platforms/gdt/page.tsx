import { PlatformWorkbench } from "@/components/platform-workbench";
import { platformWorkbenches } from "@/lib/platform-workbench";

export default function GdtPlatformPage() {
  return <PlatformWorkbench data={platformWorkbenches.gdt} />;
}
