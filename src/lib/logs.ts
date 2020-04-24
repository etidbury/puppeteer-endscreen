// let _logs: string[] = []

import logger from './dataDogLogHelper'

export const logEndScreenAction = (msg, shouldForwardToSlack?: boolean, forceForwardToSlack?: boolean, onComplete?: () => void | null) => {
    console.debug('logEndScreenAction()', msg)

    // logger.info(`Test: ${msg}`, __filename)

    if (onComplete)
        onComplete()
}
// const logEndScreenAction = (msg, shouldForwardToSlack, forceForwardToSlack, onComplete) => {
//     const now = new Date()

//     console.log(BOT_NAME, now, msg)

//     if (!shouldForwardToSlack) return

//     _logs.push(`${BOT_NAME} ${now.toString()} ${msg}`)

//     if (_logs.length >= MAX_LOG_ENTRY_TRANSPORT || forceForwardToSlack) {

//         console.log(`Posting ${_logs.length} logs to Slack...`)

//         axios.post(SLACK_POST_MESSAGE_WEBHOOK_URL, JSON.stringify(
//             {
//                 text: _logs.join('\n')
//             }
//         ), {
//                 headers: {
//                     'Content-Type': 'application/json',
//                 }
//             }).then(() => {
//                 console.log('Successfully posted logs to Slack')

//                 if (onComplete)
//                     onComplete()
//                 _logs = []
//             }).catch(() => {
//                 console.error('Failed to post logs to Slack')
//                 _logs = [] // warning: this results in logs being missing in Slack
//                 if (onComplete)
//                     onComplete()
//             })

//     }
// }
