import { PlatformWorkbench } from "@/components/platform-workbench";
import { platformWorkbenches } from "@/lib/platform-workbench";

export default function DouyinPlatformPage() {
  return <PlatformWorkbench data={platformWorkbenches.douyin} />;
}
