import { Browser, Page } from "puppeteer";

export interface ScriptArgs {
    browser: Browser,
    page: Page
}
export interface EndScreenItem {
    id: string
    youtubeVideoId: string
    failedAttempts: number | undefined
}