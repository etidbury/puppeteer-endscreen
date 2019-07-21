export const EDITABLE_ELEMENT_SELECTOR = '.editable-element'
export const INPUT_VIDEO_URL_SELECTOR = 'input[name=\'video_url\']'
export const LOGIN_EMAIL_SELECTOR = 'input[type=email]'
export const LOGIN_PASSWORD_SELECTOR = 'input[type=password]'
export const SLACK_POST_MESSAGE_WEBHOOK_URL = 'https://hooks.slack.com/services/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'

export const MAX_LOG_ENTRY_TRANSPORT = 20



if (!process.env.GOOGLE_USERNAME || !process.env.GOOGLE_USERNAME.length) {
    throw new TypeError('process.env.GOOGLE_USERNAME invalid')
}

if (!process.env.GOOGLE_PASSWORD || !process.env.GOOGLE_PASSWORD.length) {
    throw new TypeError('process.env.GOOGLE_PASSWORD invalid')
}

export const GOOGLE_USERNAME = process.env.GOOGLE_USERNAME
export const GOOGLE_PASSWORD = process.env.GOOGLE_PASSWORD
// export const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID
// export const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET
// export const GOOGLE_SPREADSHEET_API_KEY = process.env.GOOGLE_SPREADSHEET_API_KEY
//export const GOOGLE_TOKEN_URL = 'https://www.googleapis.com/oauth2/v3/token'

//export const VIDEO_LIST_SPREADSHEET_ID = process.env.VIDEO_LIST_SPREADSHEET_ID

export const BTN_SAVE_SELECTOR = '#endscreen-editor-save'

export const ENDCARD_SAFE_AREA_SELECTOR = '.playergrid-safe-area'

export const MIN_ENDCARD_SAFEAREA_WIDTH = 390
/**
 * Whether to repeat list of video entries. 
 * (e.g. video list is 100, REPEAT_VIDEO_ENTRIES = 5 means video list will be 500)
 * 
 * Set to zero will not repeat video list
 */
//export const REPEAT_VIDEO_ENTRIES = process.env.REPEAT_VIDEO_ENTRIES

// todo: add docs
//export const VIDEO_LIST_CHUNK_SIZE = 10


// export const BOT_NAME = process.env.BOT_NAME

// if (!BOT_NAME || !BOT_NAME.length) throw new TypeError('Invalid env variable: BOT_NAME')

// export const {
//     END_CARD_LINK_URL
// } = process.env

// if (!END_CARD_LINK_URL || !END_CARD_LINK_URL.length) throw new TypeError('Invalid env variable: END_CARD_LINK_URL')

//export const STATUS_HEADER_TITLE = 'status'

//export const USER_REFRESH_TOKEN = '1/tEkXAOqI0q_pTmzf9bLJlpwjHKlBVp7-D9FoXJ6HmuZsCuoj5r1HodoQG_ehrh4s'

export const BOT_MANAGER_GQL_URL = process.env.BOT_MANAGER_GQL_URL

export const ENDSCREEN_BOT_GQL_URL = process.env.ENDSCREEN_BOT_GQL_URL



// module.exports = {
//     EDITABLE_ELEMENT_SELECTOR
//     , INPUT_VIDEO_URL_SELECTOR
//     , LOGIN_EMAIL_SELECTOR
//     , LOGIN_PASSWORD_SELECTOR
//     , GOOGLE_USERNAME
//     , GOOGLE_PASSWORD
//     , END_CARD_LINK_URL
//     , BTN_SAVE_SELECTOR
//     , BOT_NAME
//     , MAX_LOG_ENTRY_TRANSPORT
//     , SLACK_POST_MESSAGE_WEBHOOK_URL
//     , REPEAT_VIDEO_ENTRIES
//     , VIDEO_LIST_CHUNK_SIZE
//     , ENDCARD_SAFE_AREA_SELECTOR
//     , MIN_ENDCARD_SAFEAREA_WIDTH
//     , STATUS_HEADER_TITLE
//     , USER_REFRESH_TOKEN
//     , GOOGLE_CLIENT_ID
//     , GOOGLE_CLIENT_SECRET
//     , GOOGLE_SPREADSHEET_API_KEY
//     , VIDEO_LIST_SPREADSHEET_ID
//     , GOOGLE_TOKEN_URL
// }