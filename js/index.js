
window.onload = initInterface;

// Array of missions
const data = [
    {
        image: "data/images/logo.png",
        name: "Mission 1",
        access: checkMissionAccessed(0),
        action: function () {
            if(checkMissionAccessed(0))
                redirectToGame(1);
        }
    },
    {
        image: "data/images/logo.png",
        name: "Mission 2",
        access: checkMissionAccessed(1),
        action: function () {
            if(checkMissionAccessed(1))
                redirectToGame(2);
        }
    },
    {
        image: "data/images/logo.png",
        name: "Mission 3",
        access: checkMissionAccessed(2),
        action: function () {
            if(checkMissionAccessed(2))
                redirectToGame(3);
        }
    },
    {
        image: "data/images/logo.png",
        name: "Mission 4",
        access: checkMissionAccessed(3),
        action: function () {
            if(checkMissionAccessed(3))
                redirectToGame(4);
        }
    },
    {
        image: "data/images/logo.png",
        name: "Mission 5",
        access: checkMissionAccessed(4),
        action: function () {
            if(checkMissionAccessed(4))
                redirectToGame(5);
        }
    },
    {
        image: "data/images/logo.png",
        name: "Mission 6",
        access: checkMissionAccessed(5),
        action: function () {
            if(checkMissionAccessed(5))
                redirectToGame(6);
        }
    }
];

function checkMissionAccessed(levelID){
    if(levelID === 0)
        return  parseInt(sessionStorage.getItem("mission_completed")) >= 0 || !sessionStorage.getItem("mission_completed");
    else
        return parseInt(sessionStorage.getItem("mission_completed")) >= levelID;
}

let items  = sessionStorage.getItem("user_items");
if(!items)
    items = [];

//array of prizes
const prizes = [
    {
        image: "data/images/prizes/mask.png",
        name: "Recycled Mask",
        description : "Mission 1: The mask enhance your underwater visibility, allowing you to navigate through the ocean depths with clarity.",
        locked : items.includes('Mask'),
    },
    {
        image: "data/images/prizes/snorkel.png",
        name: "Recycled Snorkel",
        description : "Mission 2: The snorkel, extend your underwater time by conserving precious oxygen.",
        locked : items.includes('Snorkel'),
    },
    {
        image: "data/images/prizes/fin.png",
        name: "Fins",
        description : "Mission 3: The fins increase your swimming speed and agility.",
        locked : items.includes('Fin'),
    },
    {
        image: "data/images/prizes/awareness.png",
        name: "Environmental Awareness Badge",
        description : "Mission 4: This badge serves as a reminder of your role in raising awareness about the environmental challenges we face.",
        locked : items.includes('Environmental-Badge'),
    },
    {
        image: "data/images/prizes/marine_badge.png",
        name: "Marine Conservation Certificate",
        description : "Mission 5: This certificate recognizes your contributions towards a cleaner and healthier ocean ecosystem.",
        locked : items.includes('Marine-Certificate'),
    },
    {
        image: "data/images/prizes/trophy.png",
        name: "EcoMind Completion Trophy",
        description : "Mission 6: With the EcoMind Certificate, you possess the tools and inspiration to create a sustainable future for our planet.",
        locked : items.includes('EcoMind-Certificate'),
    },
];

let homeBox;
let missionsBox;
let prizesBox;
let scene;
let HomeTextBox ;
let guiLayer;
let WoodFrameBox;

function initInterface(){
    const canvas = document.querySelector("#indexCanvas");
    const container = document.getElementById('canvas-container');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const engine = new BABYLON.Engine(canvas, true);
    engine.displayLoadingUI();
    scene = new BABYLON.Scene(engine);

    // Promise to track the loading process
    var loadingPromise = new Promise(async (resolve, reject) => {
        try {
            // Call all the functions asynchronously using await
            await createBGScene(scene, canvas);
            await createLobbyBGMusic(scene);
            await createMainLobbyBox();
            await createHomeBox();
            await createMissionsBox();
            await createPrizesBox();
            await createScoreBox();
            await createBottomBar();

            // All functions have completed execution
            resolve();
        } catch (error) {
            // Handle any errors that occurred during execution
            reject(error);
        }
    });

    // After all mesehs are loaded remove loader
    loadingPromise.then(() => {
        //once all models are loaded we remove loading UI
        // Loader minimum time
        var minimumLoaderDuration = 1000; //milliseconds
        //first add class to fade
        setTimeout(function (){
            document.getElementById("gameLoader").classList.add('fade');
        },minimumLoaderDuration);

        //then remove it from body
        setTimeout(function (){
            engine.hideLoadingUI();
            typeWrite();
        },minimumLoaderDuration + 500);
    });

    // Run the engine
    engine.runRenderLoop(function () {
        scene.render();
    });

    // Resize the engine on window resize
    window.addEventListener("resize", function () {
        engine.resize();
    });

}

async function createBGScene(scene , canvas){

    // var camera = new BABYLON.ArcRotateCamera("Camera", 3 * Math.PI / 2, Math.PI / 4, 100, BABYLON.Vector3.Zero(), scene);
    var camera = new BABYLON.FreeCamera("Camera",new BABYLON.Vector3(0,4,10), scene);
    // camera.rotation.y = -3.15;
    // camera.attachControl(canvas, true);

    camera.inputs.clear(); // Disables all camera inputs

    var light = new BABYLON.HemisphericLight("light1", new BABYLON.Vector3(0, 4, 0), scene);

   // Skybox
    var skybox = BABYLON.Mesh.CreateBox("skyBox", 5000.0, scene);
    var skyboxMaterial = new BABYLON.StandardMaterial("skyBox", scene);
    skyboxMaterial.backFaceCulling = false;
    skyboxMaterial.reflectionTexture =  BABYLON.CubeTexture.CreateFromPrefilteredData("./data/textures/lobby/environment.env",scene);
    skyboxMaterial.reflectionTexture.coordinatesMode = BABYLON.Texture.SKYBOX_MODE;
    skyboxMaterial.disableLighting = true;
    skybox.material = skyboxMaterial;
    skybox.rotation.y = 1;

    // Water material
    var waterMesh = BABYLON.Mesh.CreateGround("waterMesh",512, 512, 32, scene, false);
    var waterMaterial = new BABYLON.WaterMaterial("waterMaterial", scene, new BABYLON.Vector2(512, 512));
    waterMaterial.bumpTexture = new BABYLON.Texture("./data/textures/lobby/waterbump.png", scene);
    waterMaterial.backFaceCulling = true;
    waterMaterial.windForce = -5; // Represents the wind force applied on the water surface
    waterMaterial.waveHeight = 0.5; // Represents the height of the waves
    waterMaterial.bumpHeight = 0.1; // According to the bump map, represents the pertubation of reflection and refraction
    waterMaterial.windDirection = new BABYLON.Vector2(0, 1); // The wind direction on the water surface (on width and height)
    waterMaterial.waveLength = 0.1; // The length of waves. With smaller values, more waves are generated
    waterMaterial.colorBlendFactor = 0; // Factor to determine how the water color is blended with the reflected and refracted world
    waterMesh.material = waterMaterial;

    // Ground
    var ground = BABYLON.Mesh.CreateGround("ground", 1000, 1000, 100, scene, false);
    ground.position = new BABYLON.Vector3(0,-2,0);

    var groundTexture = new BABYLON.Texture("./data/textures/lobby/sand.jpg", scene);
    groundTexture.vScale = groundTexture.uScale = 20.0;

    var groundMaterial = new BABYLON.StandardMaterial("groundMaterial", scene);
    groundMaterial.diffuseTexture = groundTexture;

    ground.material = groundMaterial;

    // Configure water material
    waterMaterial.addToRenderList(ground);
    waterMaterial.addToRenderList(skybox);

    // moving life_buoy
    const {meshes} = await BABYLON.SceneLoader.ImportMeshAsync("","./data/models/lobby/","life_buoy_right.glb");
    const life_buoy1 = meshes[0];
    life_buoy1.position = new BABYLON.Vector3(10,2.4,30);
    life_buoy1.scaling.scaleInPlace(0.5);
    waterMaterial.addToRenderList(life_buoy1);

    const life_buoy2_glb = await BABYLON.SceneLoader.ImportMeshAsync("","./data/models/lobby/","life_buoy.glb",scene);
    const life_buoy2 = life_buoy2_glb.meshes[0];
    life_buoy2.position = new BABYLON.Vector3(-5,2.3,20);
    life_buoy2.scaling.scaleInPlace(0.5);

}

function createMainLobbyBox(){
    // Create the GUI layer
    guiLayer = new BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("pauseUI" , true , scene);

    //This logo image is common for 3 boxes
    const logoImage = new BABYLON.GUI.Image("logoImage", "./data/images/logo.png");
    logoImage.width = "700px";
    logoImage.height = "170px";
    logoImage.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
    logoImage.zIndex = '1';
    logoImage.top = '5%';
    guiLayer.addControl(logoImage);

    // Create the Outer Invisible box
    OuterBox = new BABYLON.GUI.Rectangle();
    OuterBox.width = "60%";
    OuterBox.height = "85%";
    OuterBox.thickness = 0;
    guiLayer.addControl(OuterBox);

    // Create the Inner box where data
    WoodFrameBox = new BABYLON.GUI.Rectangle();
    WoodFrameBox.width = "100%";
    WoodFrameBox.height = "95%";
    WoodFrameBox.cornerRadius = 10;
    WoodFrameBox.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_BOTTOM;
    WoodFrameBox.thickness = 0;
    OuterBox.addControl(WoodFrameBox);

    // Set the wood frame image
    // const backgroundImage = new BABYLON.GUI.Image("backgroundImage", "./data/images/lobby/wood-frame.png");
    // backgroundImage.stretch = BABYLON.GUI.Image.STRETCH_UNIFORM; // Set stretch mode to uniform
    // backgroundImage.width = "60%";
    // backgroundImage.height = "100%";
    // WoodFrameBox.addControl(backgroundImage);
}

function createHomeBox(){
    // Create the Home box
    homeBox = new BABYLON.GUI.Rectangle();
    homeBox.width = "100%";
    homeBox.height = "100%";
    homeBox.thickness = 0;
    guiLayer.addControl(homeBox);

    HomeTextBox = new BABYLON.GUI.TextBlock();
    HomeTextBox.text = ""; // Initialize the text as an empty string  because I want a typewriting style
    HomeTextBox.top = "-50px";
    HomeTextBox.width = '55%';
    HomeTextBox.fontFamily = 'Bluetea'
    HomeTextBox.fontSize = '28px';
    HomeTextBox.lineSpacing = '10px';
    // HomeTextBox.shadowColor = "#c29f55"; // The shadow color
    // // HomeTextBox.shadowBlur = 4; // The shadow blur radius
    // HomeTextBox.shadowOffsetX = 2; // The shadow offset along the x-axis
    // HomeTextBox.shadowOffsetY = 2; // The shadow offset along the y-axis
    HomeTextBox.color = '#2F4858';
    homeBox.addControl(HomeTextBox);

    const playButton = BABYLON.GUI.Button.CreateSimpleButton("playButton", "");
    playButton.width = "150px";
    playButton.height = "76px";
    playButton.thickness = 0;
    playButton.top = '150px';
    playButton.hoverCursor = 'pointer';

    // Create the background image for the button
    const backgroundImageBTN = new BABYLON.GUI.Image("backgroundImage", "./data/images/buttons/play.png");
    backgroundImageBTN.stretch = BABYLON.GUI.Image.STRETCH_UNIFORM; // Set stretch mode to uniform
    backgroundImageBTN.width = "100%";
    backgroundImageBTN.height = "100%";
    playButton.addControl(backgroundImageBTN);

    homeBox.addControl(playButton);

    // Apply hover effect using Babylon.js GUI properties
    playButton.pointerEnterAnimation = () => {
        playButton.scaleX = 1.05
        playButton.scaleY = 1.05
    };
    playButton.pointerOutAnimation = () => {
        playButton.scaleX = 1
        playButton.scaleY = 1
    };

    // Event handler
    playButton.onPointerUpObservable.add(function () {
        redirectToGame();
    });
}

function typeWrite(){
    // Configure typewriting effect
    const text = "Welcome to EcoMind,  \n " +
        " an underwater adventure \n " +
        "that inspire environmental consciousness. \n" +
        "Complete all the missions \n" +
        "and earn the EcoMind Trophy.";
    const typingDelay = 80; // Delay between each character typing
    let charIndex = 0;

    function typeWriter() {
        if (charIndex < text.length) {
            HomeTextBox.text += text.charAt(charIndex);
            charIndex++;
            setTimeout(typeWriter, typingDelay);
        }
    }

    // Start the typewriting effect
    typeWriter();
}

function createMissionsBox(){
    // Create the Missions box
    missionsBox = new BABYLON.GUI.Rectangle();
    missionsBox.width = "40%";
    missionsBox.height = "100%";
    missionsBox.thickness = 0;
    missionsBox.isVisible = false;
    guiLayer.addControl(missionsBox);

    //GUI for Missions
    const missionsStackPanel = new BABYLON.GUI.StackPanel();
    missionsStackPanel.width = "100%";
    missionsBox.addControl(missionsStackPanel);

    const missionsLine1 = new BABYLON.GUI.StackPanel();
    missionsLine1.width = "500px";
    missionsLine1.height = "80px";
    missionsLine1.isVertical = false;
    missionsLine1.paddingLeft = "50px";
    missionsStackPanel.addControl(missionsLine1);

    const missionsLine2 = new BABYLON.GUI.StackPanel();
    missionsLine2.width = "500px";
    missionsLine2.height = '80px'
    missionsLine2.isVertical = false;
    missionsLine2.paddingLeft = "50px";
    missionsStackPanel.addControl(missionsLine2);

    const missionsLine3 = new BABYLON.GUI.StackPanel();
    missionsLine3.width = "500px";
    missionsLine3.height = '80px'
    missionsLine3.isVertical = false;
    missionsLine3.paddingLeft = "50px";
    missionsStackPanel.addControl(missionsLine3);

    // Loop through the data array and create controls for each object
    data.forEach(function (item, index) {
        const panel = new BABYLON.GUI.StackPanel();
        panel.width = "250px";
        panel.isVertical = false;
        panel.horizontalAlignment  = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;

        if(index < 2){
            missionsLine1.addControl(panel);
        }else if(index >= 2 && index < 4){
            missionsLine2.addControl(panel);
        }else{
            missionsLine3.addControl(panel);
        }

        const button = BABYLON.GUI.Button.CreateSimpleButton("button" + index , '');
        button.width = "150px";
        button.height = "63px";
        button.thickness = 0;
        button.onPointerUpObservable.add(item.action);
        button.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
        panel.addControl(button);


        // Set the background image for Home
        const btn_index = index + 1;
        const backgroundImageHome = new BABYLON.GUI.Image("backgroundImage", "./data/images/buttons/mission-"+btn_index+".png");
        backgroundImageHome.stretch = BABYLON.GUI.Image.STRETCH_UNIFORM; // Set stretch mode to uniform
        backgroundImageHome.width = "100%";
        backgroundImageHome.height = "100%";
        button.addControl(backgroundImageHome);

        if(item.access){
            button.hoverCursor = 'pointer';
            // Apply hover effect using Babylon.js GUI properties
            button.pointerEnterAnimation = () => {
                button.scaleX = 1.05
                button.scaleY = 1.05
            };
            button.pointerOutAnimation = () => {
                button.scaleX = 1
                button.scaleY = 1
            };
        }else{
            // Remove Hover effect
            button.pointerEnterAnimation = () => {
            };
            button.pointerOutAnimation = () => {
            };


            var imageWrapper = new BABYLON.GUI.Rectangle();
            imageWrapper.width = "40px";
            imageWrapper.height = "30px";
            imageWrapper.paddingLeft = "10px";
            imageWrapper.thickness = 0;

            // Add Lock Icon
            const lockIcon = new BABYLON.GUI.Image("lockIcon", "./data/images/lock.png");
            lockIcon.width = "30px";
            lockIcon.height = "30px";
            imageWrapper.addControl(lockIcon);

            panel.addControl(imageWrapper);
        }
    });

}

function createScoreBox(){
    // Create the Missions box
    scoreBox = new BABYLON.GUI.Rectangle();
    scoreBox.width = "40%";
    scoreBox.height = "100%";
    scoreBox.thickness = 0;
    scoreBox.isVisible = false;
    guiLayer.addControl(scoreBox);

    //GUI for Missions
    const scoreStackPanel = new BABYLON.GUI.StackPanel();
    scoreStackPanel.width = "100%";
    scoreBox.addControl(scoreStackPanel);

    const Line1 = new BABYLON.GUI.StackPanel();
    Line1.width = "600px";
    Line1.height = "80px";
    Line1.isVertical = false;
    Line1.paddingLeft = "50px";
    scoreStackPanel.addControl(Line1);

    const Line2 = new BABYLON.GUI.StackPanel();
    Line2.width = "600px";
    Line2.height = '80px'
    Line2.isVertical = false;
    Line2.paddingLeft = "50px";
    scoreStackPanel.addControl(Line2);

    const Line3 = new BABYLON.GUI.StackPanel();
    Line3.width = "600px";
    Line3.height = '80px'
    Line3.isVertical = false;
    Line3.paddingLeft = "50px";
    scoreStackPanel.addControl(Line3);

    // Loop through the data array and create controls for each object
    data.forEach(function (item, index) {
        const panel = new BABYLON.GUI.StackPanel();
        panel.width = "300px";
        panel.isVertical = false;
        panel.horizontalAlignment  = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;

        if(index < 2){
            Line1.addControl(panel);
        }else if(index >= 2 && index < 4){
            Line2.addControl(panel);
        }else{
            Line3.addControl(panel);
        }

        const missionPanel = new BABYLON.GUI.StackPanel();
        missionPanel.width = "300px";
        missionPanel.isVertical = false;
        panel.addControl(missionPanel);

        // Set the background image for Home
        const btn_index = index + 1;
        const mission_nb = new BABYLON.GUI.Image("backgroundImage", "./data/images/buttons/mission-"+btn_index+".png");
        mission_nb.stretch = BABYLON.GUI.Image.STRETCH_UNIFORM; // Set stretch mode to uniform
        mission_nb.width = "150px";
        mission_nb.height = "63px";
        missionPanel.addControl(mission_nb);

        let high_scores = sessionStorage.getItem("high_scores");
        if (!high_scores) {
            high_scores = {};
        } else {
            high_scores = JSON.parse(high_scores);
        }

        const scoreText = new BABYLON.GUI.TextBlock();
        scoreText.text = high_scores[btn_index] ? high_scores[btn_index] : '0';
        scoreText.fontSize = 40;
        scoreText.fontFamily = 'Beachday';
        scoreText.color = '#c29f55';
        scoreText.shadowColor = "#2F4858";
        scoreText.shadowOffsetX = 2;
        scoreText.left = "50px";
        scoreText.width = "70px";
        missionPanel.addControl(scoreText);

    });

}

function createPrizesBox(){

    // Create the Missions box
    prizesBox = new BABYLON.GUI.Rectangle();
    prizesBox.width = "100%";
    prizesBox.height = "95%";
    prizesBox.thickness = 0;
    prizesBox.isVisible = false;
    OuterBox.addControl(prizesBox);

    //GUI for Prizes : Main one includes the prizes buttons and the tetx box
    const prizesMainPanel = new BABYLON.GUI.StackPanel();
    prizesMainPanel.width = "100%";
    prizesMainPanel.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
    prizesMainPanel.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_CENTER;
    prizesBox.addControl(prizesMainPanel);

    //GUI for Prizes
    const prizesStackPanel = new BABYLON.GUI.StackPanel();
    prizesStackPanel.height = "100px";
    prizesStackPanel.isVertical = false;
    prizesStackPanel.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_CENTER;
    prizesMainPanel.addControl(prizesStackPanel);

    //Rectangles that is going to contain info
    const infoRectangle = new BABYLON.GUI.Rectangle();
    infoRectangle.width = "80%";
    infoRectangle.height = "250px";
    infoRectangle.paddingTop = "15px";
    infoRectangle.thickness = 0;
    prizesMainPanel.addControl(infoRectangle);

    var infoPanels = [];


    // Loop through the prizes array and create prizes description
    prizes.forEach(function (item, index) {

        const panel = new BABYLON.GUI.StackPanel();
        panel.height = '100px';
        panel.isVertical = false;

        //Adding to the stack  panel
        prizesStackPanel.addControl(panel);

        // For each prize create button and add background image
        const prizesButton = BABYLON.GUI.Button.CreateSimpleButton("prizesButton", "");
        prizesButton.width = "120px";
        prizesButton.height = "100px";
        prizesButton.thickness = 0;
        prizesButton.paddingLeft = "10px";
        prizesButton.paddingRight = "10px";
        prizesButton.hoverCursor = 'pointer';
        panel.addControl(prizesButton);

        // Set the background image
        const backgroundImage = new BABYLON.GUI.Image("backgroundImage",item.image);
        backgroundImage.stretch = BABYLON.GUI.Image.STRETCH_UNIFORM; // Set stretch mode to uniform
        backgroundImage.width = "100%";
        backgroundImage.height = "100%";
        prizesButton.addControl(backgroundImage);


        // Creating text information for each prize. when user click on each prize he will get info
        const infoPanel = new BABYLON.GUI.StackPanel();
        infoPanel.name = "infoPanel" + index; // Specific for each prize
        infoPanel.width = "100%";
        infoPanel.height = '100%';
        infoPanel.isVertical = true;
        infoRectangle.addControl(infoPanel);

        infoPanel.isVisible = index === 0;
        // Add the infoPanel to the array
        infoPanels.push(infoPanel);

        const name = new BABYLON.GUI.TextBlock();
        name.text = item.name;
        name.fontSize = 35;
        name.paddingLeft = "20px"; // Set left padding
        name.paddingRight = "20px"; // Set right padding
        name.paddingBottom = "130px"; // Set right padding
        name.fontFamily = 'Beachday';
        name.color = '#402E32';

        infoPanel.addControl(name);

        const description = new BABYLON.GUI.TextBlock();
        description.text = item.description;
        description.fontFamily = 'Bluetea';
        description.fontSize = 20;
        description.textWrapping = true; // Enable text wrapping
        description.paddingLeft = "20px"; // Set left padding
        description.paddingRight = "20px"; // Set right padding
        description.color = "#2F4858";
        infoPanel.addControl(description);

        const status = new BABYLON.GUI.TextBlock();
        status.text = item.locked ? 'Unlocked' : 'Locked';
        status.width = "90px";
        status.paddingTop = "125px";
        status.fontFamily = 'Beachday';
        status.fontSize = 22;
        status.shadowColor = "#2F4858";
        status.shadowOffsetX = 2;
        status.shadowOffsetY = 2;
        status.color = '#c29f55';
        infoPanel.addControl(status);

        // Handle on click to show info Wrapper
        prizesButton.onPointerUpObservable.add(function () {

            // Set all other infoPanels visibility to false
            for (var i = 0; i < infoPanels.length; i++) {
                if (infoPanels[i].name !== infoPanel.name) {
                    infoPanels[i].isVisible = false;
                }
            }

            // Set the clicked infoPanel's visibility to true
            infoPanel.isVisible = true;
        });

    });

}

function createBottomBar(){
    // Create the bottom bar with Prizes and Missions buttons
    const bottomBar = new BABYLON.GUI.Rectangle();
    bottomBar.width = "700px";
    bottomBar.height = "220px";
    bottomBar.thickness = 0;
    bottomBar.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_BOTTOM;
    guiLayer.addControl(bottomBar);

    const prizesButton = BABYLON.GUI.Button.CreateSimpleButton("prizesButton", "");
    prizesButton.width = "150px";
    prizesButton.height = "103px";
    prizesButton.thickness = 0;
    // prizesButton.left = "-200px";
    prizesButton.top = "20px";
    prizesButton.hoverCursor = 'pointer';
    bottomBar.addControl(prizesButton);

    // Set the background image
    const backgroundImage = new BABYLON.GUI.Image("backgroundImage", "./data/images/buttons/prizes.png");
    backgroundImage.stretch = BABYLON.GUI.Image.STRETCH_UNIFORM; // Set stretch mode to uniform
    backgroundImage.width = "100%";
    backgroundImage.height = "100%";
    prizesButton.addControl(backgroundImage);

    const missionsButton = BABYLON.GUI.Button.CreateSimpleButton("missionsButton", "");
    missionsButton.width = "200px";
    missionsButton.height = "60px";
    missionsButton.left = "220px";
    missionsButton.thickness = 0;
    missionsButton.top = '20px';
    missionsButton.hoverCursor = 'pointer';
    bottomBar.addControl(missionsButton);

    // Set the background image for missions
    const backgroundImageMissions = new BABYLON.GUI.Image("backgroundImage", "./data/images/buttons/missions.png");
    backgroundImageMissions.stretch = BABYLON.GUI.Image.STRETCH_UNIFORM; // Set stretch mode to uniform
    backgroundImageMissions.width = "100%";
    backgroundImageMissions.height = "100%";
    missionsButton.addControl(backgroundImageMissions);

    // Score Board Buttons
    const scoreBoardButton = BABYLON.GUI.Button.CreateSimpleButton("scoreBoardButton", "");
    scoreBoardButton.width = "200px";
    scoreBoardButton.height = "60px";
    scoreBoardButton.left = "-220px";
    scoreBoardButton.thickness = 0;
    scoreBoardButton.top = '20px';
    scoreBoardButton.hoverCursor = 'pointer';
    bottomBar.addControl(scoreBoardButton);

    // Set the background image for missions
    const backgroundImageScore = new BABYLON.GUI.Image("backgroundImageScore", "./data/images/buttons/scoreboard.png");
    backgroundImageScore.stretch = BABYLON.GUI.Image.STRETCH_UNIFORM; // Set stretch mode to uniform
    backgroundImageScore.width = "100%";
    backgroundImageScore.height = "100%";
    scoreBoardButton.addControl(backgroundImageScore);

    // Create the home button for the middle box
    const homeButton = BABYLON.GUI.Button.CreateSimpleButton("homeButton", "");
    homeButton.width = "140px";
    homeButton.height = "70px";
    homeButton.thickness = 0;
    // homeButton.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
    homeButton.isVisible = false; // Hide the home button initially
    homeButton.hoverCursor = 'pointer';
    homeButton.top = '-70px';
    bottomBar.addControl(homeButton);

    // Set the background image for Home
    const backgroundImageHome = new BABYLON.GUI.Image("backgroundImage", "./data/images/buttons/home.png");
    backgroundImageHome.stretch = BABYLON.GUI.Image.STRETCH_UNIFORM; // Set stretch mode to uniform
    backgroundImageHome.width = "100%";
    backgroundImageHome.height = "100%";
    homeButton.addControl(backgroundImageHome);


    // Handle prizes button click
    prizesButton.onPointerUpObservable.add(function () {
        homeButton.isVisible = true;
        homeBox.isVisible = false;
        missionsBox.isVisible = false;
        scoreBox.isVisible = false;
        prizesBox.isVisible = true;
        WoodFrameBox.isVisible  = false;
    });

    // Apply hover effect using Babylon.js GUI properties
    prizesButton.pointerEnterAnimation = () => {
        prizesButton.scaleX = 1.05
        prizesButton.scaleY = 1.05
    };
    prizesButton.pointerOutAnimation = () => {
        prizesButton.scaleX = 1
        prizesButton.scaleY = 1
    };

    // Handle missions button click
    missionsButton.onPointerUpObservable.add(function () {
        homeButton.isVisible = true;
        homeBox.isVisible = false;
        missionsBox.isVisible = true;
        scoreBox.isVisible = false;
        prizesBox.isVisible = false;
        WoodFrameBox.isVisible  = true;

    });

    // Apply hover effect using Babylon.js GUI properties
    missionsButton.pointerEnterAnimation = () => {
        missionsButton.scaleX = 1.05
        missionsButton.scaleY = 1.05
    };
    missionsButton.pointerOutAnimation = () => {
        missionsButton.scaleX = 1
        missionsButton.scaleY = 1
    };

    // Handle home button click
    homeButton.onPointerUpObservable.add(function () {
        homeButton.isVisible = false;
        homeBox.isVisible = true;
        missionsBox.isVisible = false;
        prizesBox.isVisible = false;
        WoodFrameBox.isVisible  = true;
        scoreBox.isVisible = false;
    });

    // Apply hover effect using Babylon.js GUI properties
    scoreBoardButton.pointerEnterAnimation = () => {
        scoreBoardButton.scaleX = 1.05
        scoreBoardButton.scaleY = 1.05
    };
    scoreBoardButton.pointerOutAnimation = () => {
        scoreBoardButton.scaleX = 1
        scoreBoardButton.scaleY = 1
    };

    // Handle home button click
    scoreBoardButton.onPointerUpObservable.add(function () {
        homeButton.isVisible = true;
        homeBox.isVisible = false;
        missionsBox.isVisible = false;
        prizesBox.isVisible = false;
        scoreBox.isVisible = true;
    });

    // Apply hover effect using Babylon.js GUI properties
    homeButton.pointerEnterAnimation = () => {
        homeButton.scaleX = 1.05
        homeButton.scaleY = 1.05
    };
    homeButton.pointerOutAnimation = () => {
        homeButton.scaleX = 1
        homeButton.scaleY = 1
    };
}

function redirectToGame(missionId = null){

    if(missionId !== null){
        sessionStorage.setItem("current_mission", missionId.toString());
    }else{
        sessionStorage.removeItem('current_mission');
    }

    window.location.href = '/game.html';
}