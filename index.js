const canvas = document.getElementById("theCanvas")
const c = canvas.getContext('2d')
const xMax = 16
const yMax = 10
const pixelsPerGrid = 50
const colors = ['blue', 'pink', 'red', 'orange', 'gray']
const keys = {
    a: {
        pressed: false
    },
    w: {
        pressed: false
    },
    s: {
        pressed: false
    },
    d: {
        pressed: false
    }    
}

canvas.width = 800
canvas.height = 500

c.fillRect(0, 0, canvas.width, canvas.height)

class Coin {
    constructor({
        x,
        y
    }) {
        this.x = x
        this.y = y
    }
    draw() {
        c.fillStyle = 'gold'
        c.fillRect((this.x - 1) * pixelsPerGrid + 20, (this.y - 1) * pixelsPerGrid + 20, 10, 10)
    }

    undraw() {
        c.fillStyle = 'black'
        c.fillRect((this.x - 1) * pixelsPerGrid + 19, (this.y - 1) * pixelsPerGrid + 19, 12, 12)
    }

}

class Player {
    constructor({
        id,
        isMe,
        name,
        height,
        width,
        direction,
        color,
        x,
        y,
        coins = 0
    }) {
        this.id = id
        this.isMe = isMe
        this.name = name
        this.height = height
        this.width = width
        this.direction = direction
        this.color = color
        this.x = x
        this.y = y
        this.coins = coins
    }

    draw() {
        c.fillStyle = this.color
        c.fillRect((this.x - 1) * pixelsPerGrid, (this.y - 1) * pixelsPerGrid, this.width, this.height)
        if (this.isMe) {
            c.fillStyle = 'green'
            c.fillRect((this.x - 1) * pixelsPerGrid, (this.y - 1) * pixelsPerGrid, 10, 10)
        }
    }

    undraw() {
        c.fillStyle = 'black'
        c.fillRect((this.x - 1) * pixelsPerGrid - 1, (this.y - 1) * pixelsPerGrid - 1, this.width + 2, this.height + 2)
    }
}

function randomFromArray(array) {
    return array[Math.floor(Math.random() * array.length)]
}

function randomInt(max) {
    return Math.floor(Math.random() * max) + 1
}

function getKeyString(x, y) {
    return `${x}x${y}`
}


(function () {

    let playerId
    let playerRef
    let players = {}
    let playerInstances = {}
    let coins = {}

    window.addEventListener('keydown', (event) => {
        switch (event.key) {
            case 'd':
                handleArrowPress(1, 0)
                keys.d.pressed = true
                break
            case 'a':
                handleArrowPress(-1, 0)
                keys.a.pressed = true
                break
            case 'w':
                handleArrowPress(0, -1)
                keys.w.pressed = true
                break
            case 's':
                handleArrowPress(0, 1)
                keys.s.pressed = true
                break
        }
    })
    
    window.addEventListener('keyup', (event) => {
    
        switch (event.key) {
            case 'd':
                keys.d.pressed = false
                break
            case 'a':
                keys.a.pressed = false
                break
            case 'w':
                keys.w.pressed = false
                break
            case 's':
                keys.s.pressed = false
                break
        }
    })

    function placeCoin() {
        console.log('im recursive')
        const x = randomInt(xMax)
        const y = randomInt(yMax)
        const coinRef = firebase.database().ref(`coins/${getKeyString(x, y)}`)
        coinRef.set({
            x,
            y
        })
        setTimeout (() => {
            placeCoin()
        }, 4000)
    }

    function handleArrowPress(xChange, yChange) {
        let newX = players[playerId].x + xChange
        let newY = players[playerId].y + yChange
        //check canvas boundries
        if (newX < 1) {
            newX = 1
        }
        if (newX > xMax) {
            newX = xMax
        }
        if (newY < 1) {
            newY = 1
        }
        if (newY > yMax) {
            newY = yMax
        }
            //move to the next space
            players[playerId].x = newX
            players[playerId].y = newY
            if (xChange === 1) {
                players[playerId].direction = "right"
            }
            if (xChange === -1) {
                players[playerId].direction = "left"
            }
            if (yChange === 1) {
                players[playerId].direction = "down"
            }
            if (yChange === -1) {
                players[playerId].direction = "up"
            }
            //update player in firebase
            playerRef.set(players[playerId])
        
    }


    function initGame() {

        const allPlayersRef = firebase.database().ref(`players`)
        const allGameAssetsRef = firebase.database().ref(`gameAssets`)
        const allCoinsRef = firebase.database().ref(`coins`)

        //preset game assets
        allGameAssetsRef.set({
            timer: {
                duration: 60,
                placement: "bottom"
            },
            spirit: 0,
            sobriety: {
                duration: 720,
                units: "hours"
            },
            luxury: 0,
            poise: true
        })


        allPlayersRef.on("value", (snapshot) => {
            //Fires anytime a change occurs
            players = snapshot.val() || {}
            Object.keys(players).forEach((key) => {
                const characterState = players[key]
                let instance = playerInstances[key]
                //console.log(playerInstances[key])

                //check to see if new coordinates are out of bounds
                let targetX = characterState.x
                let targetY = characterState.y
                
                //update the canvas
                //instance.color = characterState.color
                instance.undraw()
                instance.x = targetX
                instance.y = targetY
                instance.draw()

            })

        })
        allPlayersRef.on("child_added", (snapshot) => {
            //Fires when a new node is added to tree (new player)
            const addedPlayer = snapshot.val()

            if (addedPlayer.id === playerId) {
                //You are the player that was added - maybe to show an arrow.
                playerRef.update({
                    isMe: true
                })
            }

            players[addedPlayer.id] = new Player({
                id: addedPlayer.id,
                isMe: addedPlayer.id === playerId,
                name: addedPlayer.name,
                height: addedPlayer.height,
                width: addedPlayer.width,
                direction: addedPlayer.direction,
                color: addedPlayer.color,
                x: addedPlayer.x,
                y: addedPlayer.y
            })

            playerInstances[addedPlayer.id] = players[addedPlayer.id]
            console.log(addedPlayer.id)
            players[addedPlayer.id].draw()

        })

        allPlayersRef.on("child_removed", (snapshot) => {
            const removedKey = snapshot.val().id
            
            //hacky workaround to undraw() removed player
            const remX = snapshot.val().x
            const remY = snapshot.val().y
            const semX = snapshot.val().width
            const semY = snapshot.val().height
            c.fillStyle = 'black'
            c.fillRect((remX - 1) * pixelsPerGrid, (remY - 1) * pixelsPerGrid, semX, semY)

            //removedPlayer = players[removedKey]
            //console.log(removedPlayer)
            //removedPlayer.undraw()
            delete players[removedKey]
            delete playerInstances[removedKey]
        })

        allCoinsRef.on("child_added", (snapshot) => {
            const coin = snapshot.val()
            const key = getKeyString(coin.x, coin.y)
            coins[key] = new Coin({x: coin.x, y: coin.y})
            console.log(coins[key], key)
            coins[key].draw()
        })

        allCoinsRef.on("child_removed", (snapshot) => {
            const {x,y} = snapshot.val()
            const keyToRemove = getKeyString(x,y)
            coins[keyToRemove].undraw()
            delete coins[keyToRemove]
        })

        placeCoin()
    }
    //end of initGame function


    firebase.auth().onAuthStateChanged((user) => {
        //Hanle a new user coming online: console.log(user)
        if (user) {
            playerId = user.uid
            playerRef = firebase.database().ref(`players/${playerId}`)

            playerRef.set({
                id: playerId,
                isMe: false,
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


