import { UiUtils } from "../ui/UiUtils";

export class TestUiUtils {
	static readonly loadScript = UiUtils.loadScript;

	public static atob(s: string): string {
		return window.atob(s);
	}
}
