const axios = require("axios");
const db = require("quick.db");
const _ = require("lodash");

//key: instagramProfileId
const stalks = {
    "mansurbaskan": 2316687378
}

const sleep = (waitTimeInMs) => new Promise(resolve => setTimeout(resolve, waitTimeInMs));

const checkFollow = async ({ id, username, followingUsers }) => {
    let dbFollowings = db.get("followings."+username);
    const currentFollowingUsersArray = followingUsers;
    let currentFollowingUsers = [];
    currentFollowingUsersArray.map((d) => {
        currentFollowingUsers.push(d.username)
    })
    await sleep(3000);
    const checkDbFollowings = _.difference(dbFollowings, currentFollowingUsers);
    if(checkDbFollowings.length >= 1) {
        console.log("[INF][checkFollow]["+username+"] Checking followings from database")
        checkDbFollowings.map((d) => {
            db.push("deletedFollowings."+username, d)
            console.log("[SUC][checkFollow]["+username+"] Deleting "+d+" from followings")
        })
    } else {
        console.log("[INF][checkFollow]["+username+"] No diff found from Database")
    }
    await sleep(3000);
    const checkCurrentFollowings = _.difference(currentFollowingUsers, dbFollowings);
    if(checkCurrentFollowings.length >= 1) {
        console.log("[INF][checkFollow]["+username+"] Checking followings from Instagram")
        checkCurrentFollowings.map((d) => {
            db.push("followings."+username, d)
            console.log("[SUC][checkFollow]["+username+"] Pushing "+d+" to followings")
        })
    } else {
        console.log("[INF][checkFollow]["+username+"] No diff found from Instagram")
    }
    await sleep(3000);
    db.delete("followings."+username);
    console.log("[INF][checkFollow]["+username+"] Updating data")
    await sleep(3000);
    currentFollowingUsers.map((d) => {
        db.push("followings."+username, d)
    })
    console.log("[INF][checkFollow]["+username+"] Profile successfully updated")
}

const stalkProfile = async ({ id, username }) => {
    console.log("[SUC][stalkProfile]["+username+"] Fetching followings..")
    const request = await axios.get("https://i.instagram.com/api/v1/friendships/"+id+"/following/?count=5000&max_id=QVFDRGYtclR4c3pfclhRa21GSXJYb3lzZUlMZERiZWZfMkEwQ2FVQUlCSXhsY1BmTUtxRVZ1ZTJoV2l2TDVaSXFYLTB6NUl3N0JGa3J4U3hSZExXWWhiQg%3D%3D&search_surface=following_list_page", {
        headers : {
            "accept": "*/*",
            "accept-language": "tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7",
            "cache-control": "no-cache",
            "pragma": "no-cache",
            "sec-ch-ua": "\" Not;A Brand\";v=\"99\", \"Opera GX\";v=\"79\", \"Chromium\";v=\"93\"",
            "sec-ch-ua-mobile": "?0",
            "sec-ch-ua-platform": "\"Windows\"",
            "sec-fetch-dest": "empty",
            "sec-fetch-mode": "cors",
            "sec-fetch-site": "same-site",
            "x-asbd-id": "198387",
            "x-ig-app-id": "936619743392459",
            "x-ig-www-claim": "your_hmac",
            "cookie": "your_cookies",
            "referrer": "https://www.instagram.com/",
            "referrerPolicy": "strict-origin-when-cross-origin"
        }
    })

    if(request) {
        if(Object.keys(request.data.users).length >= 1) {
            await checkFollow({
                id: id,
                username: username,
                followingUsers: request.data.users
            })
        } else {
            console.log("[ERR][stalkProfile]["+username+"] No following found.")
        }
    } else {
        console.log("[ERR][stalkProfile]["+username+"] Request failed.")
    }
}

(async () => {
    Object.keys(stalks).forEach(async (k, v) => {
        await stalkProfile({
            id: stalks[k],
            username: k
        })
        await sleep(30000);
        setInterval(async () => {
            await stalkProfile({
                id: stalks[k],
                username: k
            })
        }, 3 * 60 * 60 * 1000)
    })
})();
