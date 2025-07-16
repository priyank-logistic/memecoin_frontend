// Config Imports
import { i18n } from "@configs/i18n"

export const fallbackLng = i18n?.defaultLocale
export const languages = i18n?.locales
export const defaultNS = "translation"
export const cookieName = "i18next"

export function getOptions(lng = fallbackLng, ns = defaultNS) {
    return {
        // debug: true,
        supportedLngs: languages,

        // preload: languages,
        fallbackLng,
        lng,

        // lang: lng,
        fallbackNS: defaultNS,
        defaultNS,
        ns
    }
}
