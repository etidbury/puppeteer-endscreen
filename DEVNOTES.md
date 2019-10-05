Ed Sheeran SOTB - ANGLO - p3 - rest

https://www.youtube.com/playlist?list=PLeDakahyfrO8gTGT3WjkQXbFQGAy5tkD3


mutation updateRetryFailed {
  updateManyEndScreenCampaignItems(where:{
    campaign:{
      id:"ck1c91ezqjczi0a26mi41zt89"
    }
    failedAttempts:2
  } data:{
    failedAttempts:1
  }) {
    count
  }
}



# re-queue campaign
mutation upd{
  updateEndScreenCampaign(where:{
    id:"ck1cp8whmlx6m0a26km8x6qru"
  },data:{
    isQueued:true
    isProcessing:false
  }){
    id
  }
}