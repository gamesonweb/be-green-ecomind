function CreatePointSFX(scene){
    const sound = new BABYLON.Sound("PointSFX", "data/sounds/Point-SFX.mp3", scene,null,{
        volume: 0.2,
    });
    return sound;
}

function CreateCountDownSFX(scene){
    const sound = new BABYLON.Sound("CountDownSFX", "data/sounds/CountDown-SFX.mp3", scene,null,{
        volume: 0.2,
    });
    return sound;
}

function CreateGameBGMusic(scene){
    const sound = new BABYLON.Sound("BGMusic", "data/sounds/Game-Music.mp3", scene, null, {
        loop: true,
        autoplay: true,
        volume : 0.1
    });

    return sound;
}

function createLobbyBGMusic(scene){
    const sound = new BABYLON.Sound("BGMusic", "data/sounds/Lobby-Music.mp3", scene, null, {
        loop: true,
        autoplay: true,
        volume : 0.1
    });

    return sound
}

function CreateGameOverSFX(scene){
    const sound = new BABYLON.Sound("GameOverSFX", "data/sounds/Game-Over.mp3", scene,null,{
        volume: 0.1,
    });
    return sound;
}

function CreateWinnerSFX(scene){
    const sound = new BABYLON.Sound("WinnerSFX", "data/sounds/Winner.mp3", scene,null,{
        volume: 0.1,
    });
    return sound;
}