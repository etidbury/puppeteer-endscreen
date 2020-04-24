
import Axios from 'axios'
import * as urljoin from 'url-join'

//const BASE_API_URL = 'http://localhost:3000/'
const BASE_API_URL = 'https://wmg-youtube-playlist-api.now.sh'

export const getTopsifyAssignedPlaylistId = async (targetYouTubeVideoId: string) => {

    return Axios.get(
        urljoin(BASE_API_URL, `/manual_video_list/assigned_playlist?id=${encodeURIComponent(targetYouTubeVideoId)}`)
    ).then((r) => {

        if (r.status < 300 && r.status >= 200) {
            return r
        } else {
            throw new Error(`getTopsifyAssignedPlaylistId(): Request error status code: ${r.status}`)
        }
    }).then(({ data }) => {

        return data.assignedTopsifyPlaylistId

    })

}