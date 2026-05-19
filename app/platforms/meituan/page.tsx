import { PlatformWorkbench } from "@/components/platform-workbench";
import { platformWorkbenches } from "@/lib/platform-workbench";

export default function MeituanPlatformPage() {
  return <PlatformWorkbench data={platformWorkbenches.meituan} />;
}
