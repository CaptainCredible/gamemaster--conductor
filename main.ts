//added radiosend for mum (d) and cat (c)
let playTones = false
let displayNoteNumber = 0
let thisData = ""
let stringyArray: string[] = []
let solo = false
let mute = false
let clearTimer = 0
let inData = ""
let hasCleared = false
basic.showLeds(`
    # . . . #
    . . # . .
    # . # . #
    . . # . .
    # . . . #
    `)
hasCleared = false
basic.forever(function () {
    updateMuteAndSoloLeds()
})

serial.onDataReceived(serial.delimiters(Delimiters.NewLine), function () {
    //inData = serial.readString()
    inData = serial.readUntil(serial.delimiters(Delimiters.NewLine))
    handleMessages()
    //
    //handleConductorMessages(serial.readUntil(serial.delimiters(Delimiters.NewLine)))
})

OrchestraMusician.onButtonABHeldFor(1000, function () {
    led.toggle(2, 0)
    OrchestraMusician.gameMaster("RESET")
})

let wasGameMsg = false;

function handleMessages() {
    //first check for game messages
    if (inData[0] == "X") {
        OrchestraMusician.gameMaster("A")
        OrchestraMusician.gameMaster("B")
        if(playTones){
            music.ringTone(349)
        }
        led.plot(0, 1)
        led.plot(0, 2)
        led.plot(0, 3)
        led.plot(0, 4)
        led.plot(4, 1)
        led.plot(4, 2)
        led.plot(4, 3)
        led.plot(4, 4)
        clearTimer = input.runningTime()
        hasCleared = false
    } else if (inData[0] == "A") {
        OrchestraMusician.gameMaster("A")
        radio.setGroup(83);
        radio.sendValue("MumP", 0b00000001)
        radio.setGroup(84);
        if(playTones){
            music.ringTone(249)
        }
        
        led.plot(0, 1)
        led.plot(0, 2)
        led.plot(0, 3)
        led.plot(0, 4)
        clearTimer = input.runningTime()
        hasCleared = false
    } else if (inData[0] == "B") {
        OrchestraMusician.gameMaster("B")
        radio.setGroup(83);
        radio.sendValue("MumP", 0b00000100)
        radio.setGroup(84);
        if(playTones){
            music.ringTone(649)
        }
        
        led.plot(4, 1)
        led.plot(4, 2)
        led.plot(4, 3)
        led.plot(4, 4)
        clearTimer = input.runningTime()
        hasCleared = false
    } else {
        handleConductorMessages(inData)
    }
}

function updateMuteAndSoloLeds() {
    if (input.runningTime() > clearTimer + 30) {
        if (!(hasCleared)) {
            hasCleared = true
            basic.clearScreen()
            music.stopAllSounds()
            led.plot(2, 2)
            if (mute) {
                led.plot(2, 0)
            }
            if (solo) {
                led.plot(2, 4)
            }
        }
    }
}

function handleConductorMessages(stringy: string) {
    // remove last char which is newline i think
    stringy = stringy.slice(0, -1)
    // make an array
    stringyArray = stringy.split("#")
    for (let i = 0; i <= stringyArray.length - 1; i++) {
        thisData = stringyArray[i]
        switch (thisData[0]) {
            case "n":
                let noteBits = 0b0000000000000000
                for (let j = 1; j < thisData.length; j++) {
                    let thisNote = parseInt(thisData[j])
                    let thisBit = 0b0000000000000001 << thisNote
                    noteBits = thisBit | noteBits // add bit to noteBits
                    triggerDisplayNote(thisNote)
                }
                radio.setGroup(83)
                radio.sendValue("RabP", noteBits)
                break
            case "d":
                let mumNoteBits = 0b0000000000000000
                for (let j = 1; j < thisData.length; j++) {
                    let thisNote = parseInt(thisData[j])
                    let thisBit = 0b0000000000000001 << thisNote
                    noteBits = thisBit | noteBits // add bit to noteBits
                    triggerDisplayNote(thisNote)
                }
                radio.setGroup(83)
                radio.sendValue("MumP", noteBits)
                break
            case "c":
                let catNoteBits = 0b0000000000000000
                for (let j = 1; j < thisData.length; j++) {
                    let thisNote = parseInt(thisData[j])
                    let thisBit = 0b0000000000000001 << thisNote
                    noteBits = thisBit | noteBits // add bit to noteBits
                    triggerDisplayNote(thisNote)
                }
                radio.setGroup(83)
                radio.sendValue("CatP", noteBits)
                break
            case "M":
                //MUTE ON
                radio.setGroup(83)
                radio.sendValue("m", 0b100000000) // mute thumpers
                mute = true
                break
            case "m":
                //MUTE Off
                radio.setGroup(83)
                radio.sendValue("m", 0b000000000) // unmute thumpers
                mute = false
                break
            case "S":
                // SOLO ON
                solo = true
                let soloMusicianNumber = parseInt("" + thisData[1] + thisData[2])
                radio.setGroup(84)
                radio.sendValue("ms", soloMusicianNumber) // unmute musicians
                //console.log("solo musician " + soloMusicianNumber)
                break
            case "s":
                // SOLO OFF
                solo = false
                //basic.showIcon(IconNames.Heart,0)
                clearTimer = input.runningTime()
                radio.setGroup(84)
                radio.sendValue("uma", 0) // unmute musicians
                break
            case "t":
                let stepNumber = parseInt("" + thisData[1] + thisData[2])
                radio.setGroup(84)
                radio.sendValue("t", stepNumber)

                clearTimer = input.runningTime()
                hasCleared = false;
                let displayStepNumber = stepNumber % 4
                if (displayStepNumber < 2) {
                    led.plot(displayStepNumber, 0)//basic.showNumber(stepNumber, 1)
                } else {
                    led.plot(displayStepNumber + 1, 0)//basic.showNumber(stepNumber, 1)
                }

                break
            default:
                basic.showIcon(IconNames.Confused)
                break
        }
    }
}

function triggerDisplayNote(thisNote: number) {
    displayNoteNumber = thisNote % 4
    clearTimer = input.runningTime()
    hasCleared = false;
    if (playTones) {
        music.ringTone(440 + (displayNoteNumber * 100))
    }
    
    if (displayNoteNumber < 2) {
        led.plot(displayNoteNumber, 4)
    } else {
        led.plot(displayNoteNumber + 1, 4)
    }
}