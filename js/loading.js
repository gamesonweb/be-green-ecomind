BABYLON.DefaultLoadingScreen.prototype.displayLoadingUI = function () {
    //check if there is a loading screen already
    if (document.getElementById("gameLoader")) {
        document.getElementById("gameLoader").style.display = "initial";
        return;
    }

    this._loadingDiv = document.createElement("div");
    this._loadingDiv.id = "gameLoader";
    this._loadingDiv.innerHTML = `
        <div class="loader-animation">
            <img id="eco-mind-logo" src='./data/images/high-res-logo.png' class="animate" />
            <img id="loading-text" src='./data/images/is-loading-txt.png' />
        </div>
    `;
    var gameLoaderCss = document.createElement('style');
    gameLoaderCss.innerHTML = `
    #gameLoader{
        background-color : #2b9ea6;
        display: flex;
        align-items : center;
        justify-content : center;
        width : 100% !important;
        height:100% !important;
        transition: all 0.3s ease-in-out;
    }
    
    .fade{
         animation: fadeOutAnimation 2s ease forwards;
    }
    
    @keyframes fadeOutAnimation {
        from{
            opacity: 1;
        }
        to{
            opacity: 0;
        }
    }  
     
        .loader-animation {
            width : 60%;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
        }
        
        #eco-mind-logo{
            transform : translateY(25%);
            width:100%;
        }
        
        #loading-text{
            transform : translateY(-65%);
            width:50%;
        }

        .loader-animation .animate {
            animation: upDownAnimation 2s infinite ease-in-out;
        }

        @keyframes upDownAnimation {
            0% {
                transform: translateY(25%);
            }
            50% {
                transform: translateY(30%);
            }
            100% {
                transform: translateY(25%);
            }
        }
    
    
    `;
    document.getElementsByTagName('head')[0].appendChild(gameLoaderCss);
    this._resizeLoadingUI();
    window.addEventListener("resize", this._resizeLoadingUI);
    document.body.appendChild(this._loadingDiv);
};

BABYLON.DefaultLoadingScreen.prototype.hideLoadingUI = function(){
    document.getElementById("gameLoader").style.display = "none";
}