class Player {
    constructor() {
        this.id
        this.name
        this.height
        this.width
        this.direction
        this.color
        this.x
        this.y
        this.coins = 0
    }

}

function randomFromArray(array) {
    return array[Math.floor(Math.random() * array.length)]
}

function randomInt(max) {
    return Math.floor(Math.random() * max) + 1
}

(function () {

    const canvas = document.getElementById("theCanvas")
    const c = canvas.getContext('2d')
    const xMax = 16
    const yMax = 10
    const colors = ['blue', 'green', 'red', 'orange', 'gray']

    canvas.width = 800
    canvas.height = 500

    c.fillRect(0, 0, canvas.width, canvas.height)

    let playerId
    let playerRef
    let players = {}

    function initGame() {
        const allPlayersRef = firebase.database().ref(`players`)
        const allCoinsRef = firebase.database().ref(`coins`)

        allPlayersRef.on("value", (snapshot) => {
            //Fires anytime a change occurs

        })
        allPlayersRef.on("child_added", (snapshot) => {
            //Fires when a new node is added to tree (new player)
            const addedPlayer = snapshot.val()
            
            const otherPlayer = new Player()
            if (addedPlayer.id === playerId) {
                //You are the player that was added - maybe to show an arrow.
            }
            players[addedPlayer.id] = otherPlayer

            c.fillStyle = addedPlayer.color
            c.fillRect((addedPlayer.x - 1) * 50, (addedPlayer.y - 1) * 50, addedPlayer.width, addedPlayer.height)

        })
    }


    firebase.auth().onAuthStateChanged((user) => {
        console.log(user)
        if (user) {
            playerId = user.uid
            playerRef = firebase.database().ref(`players/${playerId}`)

            playerRef.set({
                id: playerId,
                name: "Billy",
                height: 50,
                width: 50,
                direction: "right",
                color: randomFromArray(colors),
                x: randomInt(xMax),
                y: randomInt(yMax),
                coins: 0
            })

            //Remove me from Firebase on disconnect
            playerRef.onDisconnect().remove()

            //Begin game now that we're logged in
            initGame()

        } else {

        }
    })

    firebase.auth().signInAnonymously().catch((error) => {
        var errorCode = error.code
        var errorMessage = error.errorMessage
        console.error(errorCode, errorMessage)
    })

})()

