import { PlatformWorkbench } from "@/components/platform-workbench";
import { platformWorkbenches } from "@/lib/platform-workbench";

export default function AmapPlatformPage() {
  return <PlatformWorkbench data={platformWorkbenches.amap} />;
}
