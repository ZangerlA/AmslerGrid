import translationDE from "../translations/translationDE.json"
import translationEN from "../translations/translationEN.json"

declare module "i18next" {
	interface CustomTypeOptions {
		resources: {
			en: typeof translationEN
			de: typeof translationDE
		}
	}
}