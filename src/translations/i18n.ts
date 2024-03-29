import i18next from "i18next"
import LanguageDetector from "i18next-browser-languagedetector"
import { initReactI18next } from "react-i18next"
import translationDE from "../translations/translationDE.json"
import translationEN from "../translations/translationEN.json"

i18next
	.use(LanguageDetector)
	.use(initReactI18next)
	.init({
		debug: true,
		fallbackLng: "en",
		interpolation: {
			escapeValue: false,
		},
		resources: {
			en: { translation: translationEN },
			de: { translation: translationDE },
		},
	})
