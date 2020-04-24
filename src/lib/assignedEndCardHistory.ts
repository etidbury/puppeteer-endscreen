
import Axios from 'axios'
import * as urljoin from 'url-join'

//const BASE_API_URL = 'http://localhost:3000/'
const BASE_API_URL = 'https://wmg-youtube-playlist-api.now.sh'

export const recordAssignedEndCardHistory = async (assignedEndCardHistory: {
    targetYouTubeVideoId: string,
    endCardLayoutApplied: string,
    playlistCardYouTubePlaylistId: string,
    videoCardYouTubeVideoId: string,
    endscreenCampaignIdReference: string,
    assignedAt: string
}) => {

    return Axios.post(
        urljoin(BASE_API_URL, `/endcards/assigned/create`),
        assignedEndCardHistory
    ).then((r) => {

        if (r.status < 300 && r.status >= 200) {
            return r
        } else {
            throw new Error(`recordAssignedEndCardHistory(): Request error status code: ${r.status}`)
        }
    }).then(({ data }) => {

        return data

    })

}