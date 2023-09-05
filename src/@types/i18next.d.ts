import translationEN from "../translations/translationEN.json"
import translationDE from "../translations/translationDE.json"

declare module "i18next" {
    interface CustomTypeOptions {
        resources: {
            en: typeof translationEN
            de: typeof translationDE
        }
    }
}