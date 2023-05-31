let scene ;
let engine;
let camera;
let character;
let points;
let points_entries = [];
let score;
let remainingTime;
let pause;
let bounder;
let frontVector;
let cameraDirection = null;
let mission;
let loader = [];
let new_high_score = false;

//Underwater scene
let light;
let volumetricEmitter;

//sound effects
let pointSFX;
let countDownSFX;
let backgroundMusic;
let gameOverSFX;
let winnerSFX;

//Mission ID on Session
let MissionID = sessionStorage.getItem("mission_completed") ? sessionStorage.getItem("mission_completed") : 0;

//Case : sometime user want to replay another mission, so we should always check if the mission we are playing is # than mission_completed
let currentMissionID = sessionStorage.getItem("current_mission") ? sessionStorage.getItem("current_mission") : parseInt(MissionID) + 1;

//This is to find the settings of the game
const gameSettings = [
    {
        key: 1,
        time : 25,
        collected_points : 10,
        speed : 1.1,
        fogStart : 2,
    },
    {
        key: 2,
        time : 25,
        collected_points : 13,
        speed : 1.2
    },
    {
        key: 3,
        time : 40,
        collected_points : 25,
        speed : 1.2
    },
    {
        key: 4,
        time : 40,
        collected_points : 30,
        speed : 1.7
    },
    {
        key: 5,
        time : 50,
        collected_points : 35,
        speed : 1.7
    },
    {
        key: 6,
        time : 50,
        collected_points : 40,
        speed : 1.8
    }
];

function getObjectByKey(key) {
    return gameSettings.find(obj => obj.key === key);
}

//Init
window.onload = loadGame;


async  function loadGame(){
    if(currentMissionID > 6)
        currentMissionID = 6;


    mission = getObjectByKey(parseInt(currentMissionID));

    //Setting time according to each mission and target score
    document.getElementById('remaining-time').innerHTML = mission.time;
    document.getElementById('target-score-number').innerHTML = mission.collected_points;

    canvas = document.querySelector("#gameCanvas");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    engine = new BABYLON.Engine(canvas, true);

    engine.displayLoadingUI();

    frontVector = new BABYLON.Vector3(0, 1, 0); // used to init place of character, bounding box, and camera
    if(mission.key > 3)
        frontVector = new BABYLON.Vector3(0, 2, 0); // used to init place of character, bounding box, and camera

    scene = CreateScene();
    character = await CreateCharacter();
    bounder = CreateBoundingBox();
    camera =  CreateCamera();

    // Promise to track the loading process
    var loadingPromise = new Promise(async (resolve, reject) => {
        try {
            // Call all the functions asynchronously using await
            await CreateUnderwaterScene();
            cameraDirection = null;

            //Linking character to bounding box
            character.parent = bounder;
            character.position = new BABYLON.Vector3(bounder.position.x, bounder.position.y - 2, bounder.position.z);

            points = await CreateMeshes();
            score = 0;
            remainingTime = mission.time; // Set the remaining time to 60 seconds
            pause = false;

            //Sounds
            pointSFX = await CreatePointSFX(scene);
            countDownSFX =  await CreateCountDownSFX(scene);
            backgroundMusic =  await CreateGameBGMusic(scene);
            gameOverSFX =  await CreateGameOverSFX(scene);
            winnerSFX =  await CreateWinnerSFX(scene);

            await CreatePauseMenu(scene);

            // All functions have completed execution
            resolve();
        } catch (error) {
            // Handle any errors that occurred during execution
            reject(error);
        }
    });

    window.addEventListener('resize', () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        engine.resize();
    });

    // After all meshes are loaded remove loader
    loadingPromise.then(() => {
        //once all models are loaded we remove loading UI
        // Loader minimum time
        var minimumLoaderDuration = 1000; //milliseconds
        //added this because sometimes on the first mission is takes time for the sand to load. so to make sure the laoder doesn't appear before.
        if(mission.key === 1 && !sessionStorage.getItem('mission_completed'))
            minimumLoaderDuration = 5000;
        //first add class to fade
        setTimeout(function (){
            document.getElementById("gameLoader").classList.add('fade');
        },minimumLoaderDuration);

        //then remove it from body and init the counter to start the game
        setTimeout(function (){
            engine.hideLoadingUI();
            initCounter();
        },minimumLoaderDuration + 500);
    });

    // Added this because the collision detection with points is being called multiple times for the same collision.
    const collidedPoints = [];

    //check running the engine and redering the scene
    engine.runRenderLoop(()=>{
        //render scene here like animation or something that is moving.
        scene.render();

        //For each entry point run animation on loop
        for (const entries of points_entries){
            entries.animationGroups[0].play();
        }

        // Check for collisions with points
        for (const point of points) {
            if (point.intersectsMesh(bounder, false) && !collidedPoints.includes(point.uniqueId)) {
                // If collision detected and point hasn't been collided before, remove point from array and increment score
                points.splice(points.indexOf(point), 1);
                point.dispose();
                collidedPoints.push(point.uniqueId);
                updateScore();
            }
        }

    })

}

function startGame(){

    moveBounding();

    setInterval(() => {
        if (pause) {
            backgroundMusic.pause();
            return;
        }

        if (backgroundMusic.isPaused) {
            // If the sound is paused, play it
            backgroundMusic.play();
        }

        remainingTime--;
        const timeElem = document.getElementById('remaining-time');
        if(timeElem){
            timeElem.innerHTML = remainingTime.toString();
        }

        if(remainingTime < 10 && remainingTime >= 0){
            countDownSFX.play();
        }

        if(remainingTime <= 0 ){
            updateHighScore();
            if(score < mission.collected_points){
                pause = true;
                gameOverSFX.play();
                GameOver(scene);
            }else{
                pause = true;
                winnerSFX.play();

                //Show interface and save the item won in session storage
                YouWonInterface(currentMissionID, scene);

                //Level up Phase
                if(parseInt(currentMissionID) === parseInt(MissionID) + 1){
                    sessionStorage.setItem("mission_completed", currentMissionID);
                }

            }
        }
    }, 1000);
}

function initCounter(){
    // Initialize the counter variable
    let counter = 3;

    // Create the GUI layer
    const guiLayer = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("Counter" , true , scene);

    // Create the text block for displaying the countdown
    const countdownText = new BABYLON.GUI.TextBlock();
    countdownText.text = counter.toString();
    countdownText.fontSize = 100;
    countdownText.fontFamily = 'Beachday';
    countdownText.color = "#c29f55";
    countdownText.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
    countdownText.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_CENTER;
    guiLayer.addControl(countdownText);

    // Start the countdown
    const countdownInterval = setInterval(() => {

        countDownSFX.play();
        counter--;
        countdownText.text = counter.toString();

        // Check if the countdown has reached zero
        if (counter === 0) {
            countdownText.isVisible = false;

            // Clear the interval
            clearInterval(countdownInterval);

            // Start the game or perform any other action
            startGame();
        }
    }, 1000);

}

function updateScore(){
    score++;

    //add sound
    pointSFX.play();

    const scoreElem = document.getElementById('score');
    if(scoreElem){
        scoreElem.innerHTML = score.toString();
    }

    // Update the progress bar width based on the current score. When score is higher then target set to 100%
    let percentage = (score / mission.collected_points) * 100;
    if(score >= mission.collected_points)
        percentage = 100;

    const progressElement = document.getElementById('progress');
    progressElement.style.width = percentage + '%';
}

function updateHighScore(){

    // This function to create or update the high score according to previous games
    let high_scores = sessionStorage.getItem("high_scores");
    if (!high_scores) {
        high_scores = {};
    } else {
        high_scores = JSON.parse(high_scores);
    }

    if (high_scores[mission.key]) {
        const previous_high_score = high_scores[mission.key];

        if (parseInt(score) > parseInt(previous_high_score)) {
            high_scores[mission.key] = score;
            new_high_score = true;
        }
    } else {
        high_scores[mission.key] = score;
    }

    sessionStorage.setItem('high_scores', JSON.stringify(high_scores));
}


//Scene

function CreateScene(){
    const  scene  = new BABYLON.Scene(engine);
    return  scene
}

function CreateUnderwaterScene(){
    return new Promise((resolve) => {
        let fogStart = 20;
        //in First mission the fog should be more, so that is why I have this option here
        if(mission.fogStart)
            fogStart = mission.fogStart;

        // setup fog in the scene
        scene.fogMode = BABYLON.Scene.FOGMODE_LINEAR;
        scene.fogStart = fogStart;
        scene.fogEnd = 50;
        scene.fogColor = new BABYLON.Color3(0.16, 0.62, 0.65);
        scene.fogDensity = 0.1;

        // Add lights to the scene
        var mainLight = new BABYLON.HemisphericLight("mainLight", new BABYLON.Vector3(0, 10, 0), scene);
        mainLight.intensity = 0.3;

        // create a background cube
        let backgroundCube = BABYLON.MeshBuilder.CreateBox("background", { size: 1000, sideOrientation: 2 }, scene);

        //Create camera for the textures
        var textureCamera = new BABYLON.ArcRotateCamera("textureCamera", 0, 0, 190, BABYLON.Vector3.Zero(), scene);
        textureCamera.layerMask = 2;
        textureCamera.mode = 1;
        textureCamera.orthoBottom = -7;
        textureCamera.orthoLeft = -7;
        textureCamera.orthoRight = 7;
        textureCamera.orthoTop = 7;

        //Ground
        var waterPlane = new BABYLON.Mesh.CreateGround("waterPlane", 1000, 1000, 400);
        waterPlane.layerMask = 2;

        //Setting the Caustic Shadows
        var waterShader = BABYLON.NodeMaterial.ParseFromSnippetAsync("7X2PUH", scene).then(nodeMaterial => {
            nodeMaterial.name = "causticMaterial";
            waterPlane.material = nodeMaterial;
        });
        // QHB2ME#4 : personal caustic shadows created

        //now we project to the main camera what the texture camera is seeing
        var renderTarget = new BABYLON.RenderTargetTexture("RTT", 1024, scene);
        renderTarget.activeCamera = textureCamera;
        scene.customRenderTargets.push(renderTarget);
        renderTarget.renderList.push(waterPlane);

        // Add lights to the scene
        light = new BABYLON.SpotLight("spotLight", new BABYLON.Vector3(0, 100, 0), BABYLON.Vector3.Down(), BABYLON.Tools.ToRadians(45), 1, scene);
        light.intensity = 1;
        light.projectionTexture = renderTarget;

        var blurAmount = 20;
        var standardPipeline = new BABYLON.PostProcessRenderPipeline(engine, "standardPipeline");
        var horizontalBlur = new BABYLON.BlurPostProcess("horizontalBlur", new BABYLON.Vector2(1, 0), blurAmount, 1, null, null, engine, false);
        var verticalBlur = new BABYLON.BlurPostProcess("verticalBlur", new BABYLON.Vector2(0, 1), blurAmount, 1, null, null, engine, false);
        var blackAndWhiteThenBlur = new BABYLON.PostProcessRenderEffect(engine, "blackAndWhiteThenBlur", function(){return [horizontalBlur, verticalBlur]});
        standardPipeline.addEffect(blackAndWhiteThenBlur);
        scene.postProcessRenderPipelineManager.addPipeline(standardPipeline);
        scene.postProcessRenderPipelineManager.attachCamerasToRenderPipeline("standardPipeline", textureCamera);

        // Create underwater ground
        const ground = BABYLON.MeshBuilder.CreateGround('underwaterGround', { width: 1000, height: 1000 }, scene);
        ground.checkCollisions = true;
        ground.layerMask = 1;
        BABYLON.NodeMaterial.ParseFromSnippetAsync("XWTJA2", scene).then(nodeMaterial => {
            nodeMaterial.name = "groundMaterial";
            ground.material = nodeMaterial;
        });

        resolve();
    });
}

//Main Components
function CreateCamera(){
    // Create camera and place it before bounder
    const freeCamPosition = new BABYLON.Vector3(bounder.position.x, bounder.position.y + 3, bounder.position.z - 10);
    const camera = new BABYLON.FreeCamera("freeCamera", freeCamPosition, scene);
    camera.layerMask = 1;

    // prevent camera to cross ground
    camera.checkCollisions = true;
    // avoid flying with the camera
    camera.applyGravity = true;

    // set the cam position on top of the bounding box + 0.2, also add ground height
    const bboxHeight = getBoundingBoxHeightScaled();
    camera.position.y = bboxHeight + 0.5;

    return camera
}

async function CreateCharacter(){
    let main_character_name = "character.glb"; //With mask and snorkel and fin
    let mission_one_character_name = "character-m1.glb"; // Without mask, snorkel and fin
    let mission_two_character_name = "character-m2.glb"; // With Mask, without snorkel and fin
    let mission_three_character_name = "character-m3.glb"; // With mask and snorkel , without fin

    let current_character = main_character_name;
    if(mission.key === 1)
        current_character = mission_one_character_name;
    else if(mission.key === 2)
        current_character = mission_two_character_name;
    else if(mission.key === 3)
        current_character = mission_three_character_name;


    return new Promise(async (resolve) => {
        const {meshes} = await BABYLON.SceneLoader.ImportMeshAsync("","./data/models/game/",current_character);
        const character = meshes[0];
        character.position = frontVector;
        character.layerMask = 1;

        resolve(character);
    });

}


async function CreateMeshes() {
    return new Promise((resolve) => {
        const bottleNumber = 100;
        const canNumber = 100;

        const meshes = [];

        var duplicate = function(container , scale = 0.5) {
            let entries = container.instantiateModelsToScene(undefined, false, { doNotInstantiate: true });

            for (var node of entries.rootNodes) {
                node.scaling = new BABYLON.Vector3(scale, scale, scale); // Scale down the model

                //Create Variety
                node.rotation = new BABYLON.Vector3(
                    Math.random() * Math.PI * 2,   // x rotation
                    Math.random() * Math.PI * 2,   // y rotation
                    Math.random() * Math.PI * 2    // z rotation
                );

                node.position.set(
                    Math.random() * 200 - 100 , // x position
                    2 + Math.random() * 5,   // y position
                    Math.random() * 200 - 100  // z position
                );

                // entries.animationGroups[0].play();
                meshes.push(node);
            }

            points_entries.push(entries);
            // meshes.push(entries.rootNodes[0]);
        }

        //Add Plastic Bottle Trashes
        BABYLON.SceneLoader.LoadAssetContainer("./data/models/game/","bottle.glb", scene, function (result) {
            //Create multiple object
            for(var i = 0; i<bottleNumber; i++){
                duplicate(result , 0.8);
            }

        });

        //Add Can Trash
        BABYLON.SceneLoader.LoadAssetContainer("./data/models/game/","can.glb", scene, function (result) {
            // Create multiple object
            for(var i = 0; i< canNumber; i++){
                duplicate(result , 0.2);
            }
        });

        resolve(meshes);
    });
}

function CreateBoundingBox() {
    // Create a bounding box for the character
    let depth = 7;
    let height = 2.5;
    if(mission.key === 1)
        depth = 6.2;

    if (mission.key >3)
        height = 4
    const bounder = BABYLON.MeshBuilder.CreateBox("bounderbox", { width: 3, height: height, depth: depth }, scene);
    bounder.checkCollisions = true;
    bounder.isVisible = false;

    // Adjust the bounding box to match the character's scaling
    const boundingBoxSize = new BABYLON.Vector3(character.scaling.x, character.scaling.y, character.scaling.z);
    bounder.scaling = boundingBoxSize;
    bounder.position = character.position.clone();
    bounder.rotation = new BABYLON.Vector3(-0.2, 0, 0);

    return bounder;
}

//Main Function for movements

function moveBounding(){
    // Add an event listener for the mousemove event on the canvas
    let targetRotationY = 0;
    let targetRotationX = 0;
    const sensitivity = 0.01; // Adjust the sensitivity as needed

    canvas.addEventListener("mousemove", (event) => {
        // Calculate the mouse movement
        const mouseX = event.clientX;
        const mouseY = event.clientY;

        // Convert mouse coordinates to target rotation angles
        targetRotationY = (mouseX - canvas.width / 2) * sensitivity;
        targetRotationX = (mouseY - canvas.height / 2) * sensitivity;
    });


    scene.onBeforeRenderObservable.add(() => {
        if(!pause) {
            // Smoothly interpolate the camera rotation towards the target rotation
            const smoothingFactor = 0.1; // Adjust the smoothing factor as needed
            const smoothedRotationY = lerp(camera.rotation.y, targetRotationY, smoothingFactor);
            const smoothedRotationX = lerp(camera.rotation.x, targetRotationX, smoothingFactor);

            // Set the smoothed rotation angles for the camera
            camera.rotation.y = smoothedRotationY;
            camera.rotation.x = smoothedRotationX;

            // update the character position every frame and always check collision for ground
            moveCharacter();
        }
    });
}

function lerp(start, end, t){
    return start + t * (end - start);
}

function getBoundingBoxHeightScaled() {
    const boundingInfo = bounder.getBoundingInfo();
    const extendSize = boundingInfo.boundingBox.extendSize;
    const scaling = bounder.scaling.y;
    const scaledHeight = extendSize.y * scaling;

    return scaledHeight;
}

function moveCharacter(){
    // 1 - let's compute the vector going from camera position to camera target
    const cameraFront = camera.getTarget().subtract(camera.position);
    cameraFront.normalize();
    frontVector = cameraFront;

    // 2 - compute rotation angles
    const dir = frontVector;
    const alpha = Math.atan2(dir.x, dir.z); // rotation around the Y-axis
    const beta = Math.asin(dir.y / dir.length()); // rotation around the X-axis

    // Set the rotation angles for the bounding box
    bounder.rotation.y = alpha;
    bounder.rotation.x =  - beta;

    // Update bounding box positions based on camera target
    const targetDirection = frontVector.scaleInPlace(0.1);

    // Compute the target position for the bounding box
    const targetPosition = bounder.position.add(targetDirection);

    // Move the bounding box with collisions
    bounder.moveWithCollisions(targetPosition.subtract(bounder.position).scale(mission.speed));

    // Adjust the camera position to be farther behind the bounding box and slightly up
    const cameraOffset = frontVector.scale(-100); // Increase the magnitude for a greater distance
    const cameraUpOffset = new BABYLON.Vector3(0, 1, 0); // Adjust the vertical offset as desired
    camera.position = bounder.position.add(cameraOffset).add(cameraUpOffset);

    // Update spotlight position but to only move on the xz plane
    light.position = new BABYLON.Vector3(bounder.position.x, light.position.y, bounder.position.z);

}

//Interfaces
const prizes = [
    {
        image: "data/images/prizes/mask.png",
        key: 1,
        value: "Mask" ,
        name: "Recycled Mask",
        description : "Mission 1: The mask enhance your underwater visibility, allowing you to navigate through the ocean depths with clarity.",
    },
    {
        image: "data/images/prizes/snorkel.png",
        key: 2,
        value: "Snorkel",
        name: "Recycled Snorkel",
        description : "Mission 2: The snorkel, extend your underwater time by conserving precious oxygen.",
    },
    {
        image: "data/images/prizes/fin.png",
        key: 3,
        value: "Fin",
        name: "Fins",
        description : "Mission 3: The fins increase your swimming speed and agility.",
    },
    {
        image: "data/images/prizes/awareness.png",
        key: 4,
        value: "Environmental-Badge",
        name: "Environmental Awareness Badge",
        description : "Mission 4: This badge serves as a reminder of your role in raising awareness about the environmental challenges we face.",
    },
    {
        image: "data/images/prizes/marine_badge.png",
        key: 5,
        value: "Marine-Certificate" ,
        name: "Marine Conservation Certificate",
        description : "Mission 5: This certificate recognizes your contributions towards a cleaner and healthier ocean ecosystem.",
    },
    {
        image: "data/images/prizes/trophy.png",
        key: 6,
        value: "EcoMind-Certificate",
        name: "EcoMind Completion Certificate",
        description : "Mission 6: With the EcoMind Certificate, you possess the tools and inspiration to create a sustainable future for our planet.",
    }
];

// Function to access the object using a key
function getObjectByKeyPrizes(key) {
    return prizes.find(obj => obj.key === parseInt(key));
}

function CreatePauseMenu(scene){
    // Create full-screen GUI layer
    const guiLayer = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("pauseUI" , true , scene);
    const pauseButton = document.getElementById('pause-button');


    // Create pause menu
    const pauseMenu = new BABYLON.GUI.Rectangle();
    pauseMenu.width = "600px";
    pauseMenu.height = "500px";
    pauseMenu.thickness = 0;
    pauseMenu.isVisible = false;
    guiLayer.addControl(pauseMenu);

    const backgroundImage = new BABYLON.GUI.Image("backgroundImage", "./data/images/game/background.png");
    backgroundImage.stretch = BABYLON.GUI.Image.STRETCH_UNIFORM;
    backgroundImage.width = "100%";
    backgroundImage.height = "100%";
    pauseMenu.addControl(backgroundImage);

    // Create restart button
    const restartButton = BABYLON.GUI.Button.CreateSimpleButton("restartButton", "");
    restartButton.width = "150px";
    restartButton.height = "40px";
    restartButton.top = "-70px";
    restartButton.hoverCursor = "pointer";
    restartButton.thickness = 0;

    const restartImage = new BABYLON.GUI.Image("backgroundImage", "./data/images/game/restart.png");
    restartImage.width = "100%";
    restartImage.height = "100%";
    restartButton.addControl(restartImage);

    pauseMenu.addControl(restartButton);

    // Create continue button
    const continueButton = BABYLON.GUI.Button.CreateSimpleButton("continueButton", "");
    continueButton.width = "150px";
    continueButton.height = "40px";
    continueButton.thickness = 0;
    continueButton.hoverCursor = 'pointer';
    pauseMenu.addControl(continueButton);

    const continueImage = new BABYLON.GUI.Image("backgroundImage", "./data/images/game/continue.png");
    continueImage.width = "100%";
    continueImage.height = "100%";
    continueButton.addControl(continueImage);

    // Create home button
    const homeButton = BABYLON.GUI.Button.CreateSimpleButton("homeButton", "");
    homeButton.width = "150px";
    homeButton.height = "40px";
    homeButton.top = "70px";
    homeButton.thickness = 0;
    homeButton.hoverCursor = 'pointer';
    pauseMenu.addControl(homeButton);

    const homeImage = new BABYLON.GUI.Image("backgroundImage", "./data/images/game/home.png");
    homeImage.width = "100%";
    homeImage.height = "100%";
    homeButton.addControl(homeImage);

    const showPauseMenu = () =>{
        pauseMenu.isVisible = true;
        //and set pause button to resume
        pauseButton.classList.add('active');

    }

    const hidePauseMenu = () => {
        pauseMenu.isVisible = false;
        //and resset pause button icons
        pauseButton.classList.remove('active');
    };

    const getCameraPosition = () => {
        if (cameraDirection) {
            // Restore camera direction
            const cameraPosition = bounder.position.subtract(cameraDirection);
            camera.setTarget(bounder.position);
            camera.position = cameraPosition;
            cameraDirection = null;
        }
    };


    // Add event listeners to buttons
    pauseButton.addEventListener('click', function() {
        // if pause menu is visible we want to do the resume behavior
        if(pauseMenu.isVisible){
            // Continue game
            pause = false;
            hidePauseMenu();
            getCameraPosition();
        }else{
            pause = true;
            cameraDirection = camera.getTarget().subtract(camera.position); // store the camera direction
            showPauseMenu();
        }
    });

    // Add event listener for the "Esc" key press
    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
            pause = true;
            cameraDirection = camera.getTarget().subtract(camera.position); // store the camera direction
            showPauseMenu();
        }
    });

    restartButton.onPointerDownObservable.add(function() {
        // Restart game
        window.location.reload();
    });

    continueButton.onPointerDownObservable.add(() => {
        // Continue game
        pause = false;
        hidePauseMenu();
        getCameraPosition();

    });

    homeButton.onPointerDownObservable.add(function() {
        // Go back to home screen
        window.location.href = '/';
    });
}

function AnimateCamera(){
    //Move Camera
    // const targetCameraPosition = character.position.clone();
    // const cameraAnimation = new BABYLON.Animation(
    //     "cameraAnimation",
    //     "position",
    //     30,
    //     BABYLON.Animation.ANIMATIONTYPE_VECTOR3,
    //     BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
    // );
    // const keys = [
    //     { frame: 0, value: camera.position },
    //     { frame: 90, value: targetCameraPosition }
    // ];
    // cameraAnimation.setKeys(keys);
    //
    // scene.beginDirectAnimation(camera, [cameraAnimation], 0, 90, false);

}

function GameOver(scene){
    AnimateCamera();

    // Create full-screen GUI layer
    const guiLayer = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("gameOverUI" , true , scene);

    // Create pause menu
    const gameOverMenu = new BABYLON.GUI.Rectangle();
    gameOverMenu.width = "600px";
    gameOverMenu.height = "500px";
    gameOverMenu.thickness = 0;
    gameOverMenu.isVisible = true;
    guiLayer.addControl(gameOverMenu);

    const backgroundImage = new BABYLON.GUI.Image("backgroundImage", "./data/images/game/background.png");
    backgroundImage.stretch = BABYLON.GUI.Image.STRETCH_UNIFORM;
    backgroundImage.width = "100%";
    backgroundImage.height = "100%";
    gameOverMenu.addControl(backgroundImage);


    const gameOverText = new BABYLON.GUI.Image("backgroundImage", "./data/images/game/game_over.png");
    gameOverText.width = "300px";
    gameOverText.height = "100px";
    gameOverText.top = "-100px";
    gameOverMenu.addControl(gameOverText);


    // Create restart button
    const restartButton = BABYLON.GUI.Button.CreateSimpleButton("restartButton", "");
    restartButton.width = "150px";
    restartButton.height = "40px";
    restartButton.thickness = 0;
    restartButton.top = "20px";
    restartButton.hoverCursor = 'pointer';
    gameOverMenu.addControl(restartButton);

    const restartImage = new BABYLON.GUI.Image("backgroundImage", "./data/images/game/restart.png");
    restartImage.width = "100%";
    restartImage.height = "100%";
    restartButton.addControl(restartImage);

    // Create home button
    const homeButton = BABYLON.GUI.Button.CreateSimpleButton("homeButton", "");
    homeButton.width = "150px";
    homeButton.height = "40px";
    homeButton.color = "white";
    homeButton.top = "80px";
    homeButton.thickness = 0;
    homeButton.hoverCursor = 'pointer';
    gameOverMenu.addControl(homeButton);

    const homeImage = new BABYLON.GUI.Image("backgroundImage", "./data/images/game/home.png");
    homeImage.width = "100%";
    homeImage.height = "100%";
    homeButton.addControl(homeImage);


    restartButton.onPointerDownObservable.add(function() {
        // Restart game
        window.location.reload();
    });

    homeButton.onPointerDownObservable.add(function() {
        // Go back to home screen
        window.location.href = '/';
    });
}

function YouWonInterface(levelID , scene){
    AnimateCamera();

    //set variables according to level
    let path = '';
    const obj = getObjectByKeyPrizes(levelID);
    path = obj.image;


    //save in local storage the items
    let items =  sessionStorage.getItem("user_items");
    items = JSON.parse(items);
    if (!items) {
        items = [];
    }

    // Check if the array already contains the item
    if (!items.includes(obj.value)) {
        // Add the new string to the array
        items.push(obj.value);
    }

    sessionStorage.setItem("user_items", JSON.stringify(items));


    // Create full-screen GUI layer
    const guiLayer = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("gameWonUI" , true , scene);

    // Create pause menu
    const gameWonMenu = new BABYLON.GUI.Rectangle();
    gameWonMenu.width = "600px";
    gameWonMenu.height = "500px";
    gameWonMenu.thickness = 0;
    gameWonMenu.isVisible = true;
    guiLayer.addControl(gameWonMenu);

    const backgroundImage = new BABYLON.GUI.Image("backgroundImage", "./data/images/game/background.png");
    backgroundImage.stretch = BABYLON.GUI.Image.STRETCH_UNIFORM;
    backgroundImage.width = "100%";
    backgroundImage.height = "100%";
    gameWonMenu.addControl(backgroundImage);

    const gameWonText = new BABYLON.GUI.Image("backgroundImage", "./data/images/game/you_wonz.png");
    gameWonText.width = "300px";
    gameWonText.height = "100px";
    gameWonText.top = "-170px";
    gameWonMenu.addControl(gameWonText);

    // If the user updated his high score show new high score
    if(new_high_score){
        // New High score text block
        const highScoreText = new BABYLON.GUI.TextBlock();
        highScoreText.text = 'New HighScore: ' + score.toString() +" !!";
        highScoreText.fontSize = 30;
        highScoreText.fontFamily = 'Beachday';
        highScoreText.shadowColor = "#2F4858";
        highScoreText.shadowOffsetX = 2;
        highScoreText.shadowOffsetY = 2;
        highScoreText.color = '#c29f55';
        highScoreText.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
        highScoreText.top = "-115px";
        gameWonMenu.addControl(highScoreText);
    }


    //Add object image:
    // Add image on left
    const image = new BABYLON.GUI.Image("image", path);
    image.width = "130px";
    image.height = "130px";
    // image.stretch = BABYLON.GUI.Image.STRETCH_UNIFORM;
    image.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
    image.top = "-20px";
    gameWonMenu.addControl(image);

    // Add buttons on right
    const buttonsContainer = new BABYLON.GUI.Rectangle();
    buttonsContainer.height = "100%";
    buttonsContainer.thickness = 0;
    buttonsContainer.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
    gameWonMenu.addControl(buttonsContainer);

    // Create continue button
    const continueButton = BABYLON.GUI.Button.CreateSimpleButton("continueButton", "");
    continueButton.width = "150px";
    continueButton.height = "40px";
    continueButton.thickness = 0;
    continueButton.hoverCursor = 'pointer';
    continueButton.top = '90px';
    buttonsContainer.addControl(continueButton);

    const continueImage = new BABYLON.GUI.Image("backgroundImage", "./data/images/game/continue.png");
    continueImage.width = "100%";
    continueImage.height = "100%";
    continueButton.addControl(continueImage);

    // In case user is in last mission
    if(mission.key === 6)
        continueButton.isVisible = false;

    // Create home button
    const homeButton = BABYLON.GUI.Button.CreateSimpleButton("homeButton", "");
    homeButton.width = "150px";
    homeButton.height = "40px";
    homeButton.top = "150px";
    homeButton.thickness = 0;
    homeButton.hoverCursor = 'pointer';
    buttonsContainer.addControl(homeButton);

    const homeImage = new BABYLON.GUI.Image("backgroundImage", "./data/images/game/home.png");
    homeImage.width = "100%";
    homeImage.height = "100%";
    homeButton.addControl(homeImage);

    continueButton.onPointerDownObservable.add(function() {
        // Continue game depending on last mission

        let next_mission = parseInt(currentMissionID) + 1;
        if(next_mission > 6 )
            next_mission = 6;
        sessionStorage.setItem("current_mission", next_mission);

        window.location.reload();
    });

    homeButton.onPointerDownObservable.add(function() {
        // Go back to home screen
        window.location.href = '/';
    });

}
