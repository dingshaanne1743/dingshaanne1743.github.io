let introIndex = 0;
let score = 0;
let typing = false;
let c1Mode = "intro";
let c2Mode = "intro";
let c3Mode = "intro";

let buzzTimer1;
let buzzTimer2;
let c3Correct = false;

/* ================= AUDIO & TIMER ENGINE ================= */
let currentBGM = null;
let fadeOutInterval = null;
let fadeInInterval = null;
let started = false;

let timerInterval;

const bgmVolumes = {
    'startBGM': 0.32, 
    'introBGM': 0.40, 
    'room1BGM': 0.32, 
    'room2BGM': 0.15, 
    'room3BGM': 0.36, 
    'failBGM': 0.35, 
    'endBGM': 0.28    
};

const sfxVolumes = {
    'correctSFX': 0.6, 
    'wrongSFX': 0.6,
    'boopSFX': 0.5     
};

document.addEventListener('click', () => {
    if(!started) { started = true; playBGM('startBGM'); }
}, { once: true });

function fadeOutCurrentBGM() {
    if (currentBGM) {
        const oldBGM = currentBGM;
        clearInterval(fadeInInterval);
        clearInterval(fadeOutInterval);
        fadeOutInterval = setInterval(() => {
            if (oldBGM.volume > 0.05) { oldBGM.volume -= 0.05; } 
            else { oldBGM.volume = 0; oldBGM.pause(); oldBGM.currentTime = 0; clearInterval(fadeOutInterval); }
        }, 50);
    }
}

function playBGM(id) {
    const nextBGM = document.getElementById(id);
    if (currentBGM === nextBGM) return;
    fadeOutCurrentBGM(); 
    if (nextBGM) {
        nextBGM.loop = true; nextBGM.volume = 0;
        nextBGM.play().catch(e => console.log("BGM blocked:", e));
        const targetVol = bgmVolumes[id] || 0.4;
        clearInterval(fadeInInterval);
        fadeInInterval = setInterval(() => {
            if (nextBGM.volume < targetVol - 0.05) { nextBGM.volume += 0.05; } 
            else { nextBGM.volume = targetVol; clearInterval(fadeInInterval); } 
        }, 50);
        currentBGM = nextBGM;
    } else {
        currentBGM = null;
    }
}

function playSFX(id){
    const sound = document.getElementById(id);
    if (!sound) return;
    const clone = sound.cloneNode();
    clone.volume = sfxVolumes[id] !== undefined ? sfxVolumes[id] : 1.0; 
    clone.play().catch(e => console.log("SFX blocked:", e));
}

function playBeep(vol) {
    const beep = document.getElementById("beepSFX");
    if (!beep) return;
    const clone = beep.cloneNode();
    clone.volume = Math.max(0, Math.min(1, vol)); 
    clone.play().catch(e => console.log("Beep blocked:", e));
}

// === NEW TIMER FUNCTIONS ===
function startTimer(seconds, timeoutCallback) {
    const container = document.getElementById("timer-container");
    const bar = document.getElementById("timer-bar");
    const text = document.getElementById("timer-text");
    
    container.classList.remove("hidden");
    let timeLeft = seconds;
    
    updateTimerVisuals(timeLeft, seconds, bar, text);
    
    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        timeLeft--;
        updateTimerVisuals(timeLeft, seconds, bar, text);
        
        if (timeLeft > 0) {
            let vol = 1 - (timeLeft / seconds);
            playBeep(vol);
        }
        
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            timeoutCallback();
        }
    }, 1000);
}

function updateTimerVisuals(timeLeft, total, bar, text) {
    text.innerText = timeLeft + "s";
    const percent = (timeLeft / total) * 100;
    bar.style.width = percent + "%";
    
    let color = "cyan";
    if (percent <= 50 && percent > 20) {
        color = "yellow";
    } else if (percent <= 20) {
        color = "red";
    }
    
    bar.style.backgroundColor = color;
    bar.style.boxShadow = `0 0 15px ${color}`;
}

function stopTimer() {
    clearInterval(timerInterval);
    document.getElementById("timer-container").classList.add("hidden");
}

function handleTimeout(challengeNum) {
    stopTimer();
    const overlay = document.getElementById("overlay");
    playSFX('wrongSFX');
    overlay.style.background = "rgba(255,0,0,0.3)";

    if(challengeNum === 1) {
        if(c1Mode !== "gameplay") return;
        c1Mode = "result";
        updateOldMan('c1Dialogue', 'om_stern');
        document.getElementById("c1Dialogue").classList.remove("hidden");
        document.getElementById("c1Btn").disabled = true;
        typeText("c1Text", "Uh oh, time's up! This image is authentic. When vetting AI content, focus on the details: inspect skin textures, finger counts, and eye reflections. Ask yourself: Is the composition too abstract? Does the subject’s behavior align with reality?", () => enableC1Btn("Next", wrongC1Step2));
    } 
    else if(challengeNum === 2) {
        if(c2Mode !== "gameplay") return;
        c2Mode = "result";
        ['realAudio', 'fakeAudio'].forEach(id => { const a = document.getElementById(id); a.pause(); a.currentTime = 0; });
        document.querySelectorAll('.visualizer-screen').forEach(v => v.classList.remove('playing'));
        updateOldMan('c2Dialogue', 'om_stern');
        document.getElementById("c2Dialogue").classList.remove("hidden");
        document.getElementById("c2Btn").disabled = true;
        typeText("c2Text", "Uh oh, time's up! This audio is authentic. To detect AI synthesis, scrutinize the delivery: is the tone unnaturally monotonous? Evaluate the pronunciation - does the accent and cadence feel human?", () => enableC2Btn("Next", wrongC2Step2));
    } 
    else if(challengeNum === 3) {
        if(c3Mode !== "gameplay") return;
        c3Mode = "result";
        c3Correct = false;
        clearTimeout(buzzTimer1); clearTimeout(buzzTimer2);
        updateOldMan('c3Dialogue', 'om_stern');
        document.getElementById("c3Dialogue").classList.remove("hidden");
        document.getElementById("c3Btn").disabled = true;
        typeText("c3Text", "Uh oh, time's up! This message is real. Scam messages generated by AI often use urgency, fear, or pressure to force quick decisions. They also ask for sensitive information such as passwords, bank details, or identification numbers.", () => enableC3Btn("Next", wrongC3Step2));
    }
}
// ==========================================

function typeText(elementId, text, callback){
    typing = true;
    let i = 0;
    const el = document.getElementById(elementId);
    el.innerHTML = ""; 

    const textAudio = document.getElementById("textSFX");
    textAudio.volume = 1.0; textAudio.loop = true; textAudio.play().catch(()=>{});

    const interval = setInterval(()=>{
        if(text.charAt(i) === '<') {
            i = text.indexOf('>', i);
        }
        
        el.innerHTML = text.slice(0, i + 1);
        i++;
        
        if(i >= text.length){
            clearInterval(interval);
            typing = false;
            textAudio.pause(); textAudio.currentTime = 0; 
            if(callback) callback();
        }
    }, 20);
}

/* ================= DYNAMIC CHARACTER SYSTEM ================= */
function updateOldMan(wrapperId, imageName) {
    const img = document.querySelector(`#${wrapperId} .oldman`);
    if(!img) return;
    img.classList.remove('pop-anim');
    void img.offsetWidth; 
    img.src = `assets/${imageName}.png`;
    img.classList.add('pop-anim');
}

/* ================= UNIFIED VIDEO ENGINE ================= */
let activeVideo = null;

function initVideo(src){
    if(activeVideo) { activeVideo.pause(); activeVideo.remove(); }
    activeVideo = document.createElement("video");
    activeVideo.src = src;
    activeVideo.muted = true; activeVideo.playsInline = true; activeVideo.preload = "auto";
    activeVideo.style.position = "fixed"; activeVideo.style.inset = "0";
    activeVideo.style.width = "960px"; activeVideo.style.height = "540px";
    activeVideo.style.objectFit = "cover"; activeVideo.style.zIndex = "0";
    document.body.appendChild(activeVideo);
    activeVideo.addEventListener("loadeddata", ()=>{ activeVideo.currentTime = 0; activeVideo.pause(); });
}

function playActiveBriefFreeze(){
    if(!activeVideo) return;
    activeVideo.play().catch(()=>{});
    setTimeout(()=>{ activeVideo.pause(); }, 650);
}

function playActiveFullThenTransition(nextRoomFunc, nextVideoSrc){
    if(!activeVideo) return;
    activeVideo.play();
    playSFX('unlockSFX'); 
    
    setTimeout(()=>{
        fadeOutCurrentBGM();
        const fade = document.getElementById("fade");
        fade.style.opacity = 1;
        setTimeout(()=>{
            if(nextVideoSrc) { initVideo(nextVideoSrc); } 
            else { activeVideo.pause(); activeVideo.remove(); activeVideo = null; }
            nextRoomFunc(); 
            setTimeout(() => { fade.style.opacity = 0; }, 50);
        }, 1500);
    }, 2700);
}

function transitionWithoutVideo(nextRoomFunc){
    playSFX('goSFX');
    fadeOutCurrentBGM(); 
    const fade = document.getElementById("fade");
    fade.style.opacity = 1;
    setTimeout(()=>{
        nextRoomFunc(); 
        setTimeout(() => { fade.style.opacity = 0; }, 50);
    }, 600);
}

/* ---------------- SCRIPT DATA & IMAGE MAPPING ---------------- */
const introLines = [
"Hello there student. I am Doctor Alex, your principal of the School of Artificial Intelligence Defense, where we train students like you to be prepared for the world and dangers of Artificial Intelligence(AI).",
"AI has reshaped our world, bringing new challenges to every field. To graduate, you must demonstrate the skills necessary to understand and stand against AI's influence.",
"Final testing begins now. Clear all three rooms successfully to prove your competency and qualify for graduation. Monitor your score in the top right. Good luck."
];
const introImages = ["hologram", "om_stern", "om_finger"];

const c1IntroLines = [
"Misinformation is weaponising AI-generated media. From deepfakes to fabricated evidence, generative tools are now primary instruments for manipulation and propaganda.",
"It is crucial to be able to differentiate real from AI images. Click on the picture that is AI-generated to complete this challenge. You have <b>30 seconds</b>, good luck."
];
const c1IntroImages = ["om_talking", "hologram"];

const c2IntroLines = [
"Your next challenge. Turn on your volume. You will need your ears for this one. Two audio samples are presented to you. One is real and one is AI-generated.",
"AI-generated audio is often used to impersonate voices in fraudulent calls, fooling people into believing they’re speaking with a loved one, a colleague, or an executive.",
"You will need to know how to discern between real and fake. You have <b>40 seconds</b> to analyze the samples and select the AI-generated audio to complete the challenge. Listen carefully."
];
const c2IntroImages = ["hologram", "om_talking", "om_finger"];

const c3IntroLines = [
"Your last challenge. Be alert. AI can infiltrate your text messages too, impersonating someone you trust.",
"These AI-generated messages are used for scams - pretending to be a parent, a boss, or even government officials. Their goal: to steal your personal information or trick you into dangerous actions.",
"Two messages are shown before you. One is real, harmless, and written by a human. The other is an AI-generated scam designed to deceive. You have <b>50 seconds</b> to choose the device that is the AI-generated scam. Choose wisely."
];
const c3IntroImages = ["om_stern", "om_finger", "hologram"];

/* ---------------- UTIL ---------------- */
function showScreen(id){
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
}
function updateScore(){
    document.getElementById('score').innerText = score;
}

/* ---------------- SYSTEM TRANSITION HANDLER ---------------- */
function triggerCyberTransition(callback) {
    const trans = document.getElementById('cyberTransition');
    const textAudio = document.getElementById("textSFX");
    
    trans.classList.remove('active-boot');
    void trans.offsetWidth; 
    trans.classList.add('active-boot');
    trans.classList.remove('hidden');
    
    textAudio.volume = 1.0; textAudio.loop = true; textAudio.play().catch(()=>{});

    setTimeout(() => {
        textAudio.pause(); textAudio.currentTime = 0;
        callback();
        trans.style.transition = "opacity 0.3s ease";
        trans.style.opacity = 0;
        setTimeout(() => {
            trans.classList.add('hidden');
            trans.style.opacity = 1; 
            trans.style.transition = "";
        }, 300);
    }, 1500); 
}

/* ---------------- START GAME ---------------- */
function startGame(){
    playSFX('goSFX');
    fadeOutCurrentBGM();
    
    triggerCyberTransition(() => {
        playBGM('introBGM'); 
        score = 0; updateScore(); introIndex = 0;
        showScreen('intro');
        updateOldMan('intro', introImages[introIndex]);
        
        const btn = document.getElementById("introBtn");
        btn.disabled = true; btn.onclick = nextIntro;
        typeText("introText", introLines[introIndex], ()=>btn.disabled=false);
    });
}
function nextIntro(){
    if(typing) return;
    introIndex++; playSFX('boopSFX'); 
    const btn = document.getElementById("introBtn");
    
    if(introIndex < introLines.length - 1){
        btn.disabled = true;
        updateOldMan('intro', introImages[introIndex]);
        typeText("introText", introLines[introIndex], ()=>btn.disabled=false);
    } else {
        btn.innerText = "Let's go!";
        btn.onclick = startFadeToRoom1; btn.disabled = true;
        updateOldMan('intro', introImages[introIndex]);
        typeText("introText", introLines[introIndex], ()=>btn.disabled=false);
    }
}
function startFadeToRoom1(){
    playSFX('goSFX'); fadeOutCurrentBGM();
    const fade = document.getElementById("fade"); fade.style.opacity = 1;
    setTimeout(()=>{
        showScreen('c1'); document.getElementById("hud").classList.remove("hidden");
        initVideo('assets/room1.mp4');
        playBGM('room1BGM'); startC1Intro();
        setTimeout(() => { fade.style.opacity = 0; }, 50);
    }, 600);
}

/* ---------------- CHALLENGE 1 ---------------- */
let c1Step = 0;
function startC1Intro(){
    c1Mode = "intro"; c1Step = 0;
    document.getElementById("overlay").style.background = "rgba(0,0,0,0.6)";
    const panel = document.getElementById("c1Dialogue"); panel.classList.remove("hidden");
    const btn = document.getElementById("c1Btn"); btn.innerText = "Next"; btn.disabled = true;
    
    updateOldMan('c1Dialogue', c1IntroImages[0]);
    typeText("c1Text", c1IntroLines[0], ()=>enableC1Btn("Next", nextC1Intro));
}
function nextC1Intro(){
    if(typing) return;
    playSFX('boopSFX'); c1Step++;
    const btn = document.getElementById("c1Btn");
    if(c1Step === 1){
        btn.innerText = "Let's go!"; btn.disabled = true;
        updateOldMan('c1Dialogue', c1IntroImages[1]);
        typeText("c1Text", c1IntroLines[1], ()=>enableC1Btn("Let's go!", startC1Game));
    }
}
function startC1Game(){
    playSFX('goSFX'); c1Mode = "gameplay";
    const panel = document.getElementById("c1Dialogue");
    const overlay = document.getElementById("overlay");
    const images = document.getElementById("c1Images");
    panel.style.animation = "slideDown 0.5s ease forwards";
    setTimeout(()=>{
        panel.classList.add("hidden"); panel.style.animation = "slideUp 0.5s ease"; 
        overlay.style.background = "transparent"; 
        images.classList.remove("hidden");
        document.getElementById("c1Instruction").classList.remove("hidden"); 
        
        startTimer(30, () => handleTimeout(1));
    },500);
}
function answerC1(correct){
    if(c1Mode !== "gameplay") return;
    c1Mode = "result";
    stopTimer(); 
    
    const overlay = document.getElementById("overlay");
    const panel = document.getElementById("c1Dialogue"); panel.classList.remove("hidden");
    const btn = document.getElementById("c1Btn"); btn.innerText = "Next"; btn.disabled = true;

    if(correct){
        playSFX('correctSFX'); playActiveBriefFreeze(); score++; updateScore();
        overlay.style.background = "rgba(0,255,0,0.3)";
        updateOldMan('c1Dialogue', 'om_finger');
        typeText("c1Text", "Correct! This image is AI-generated. When vetting AI content, focus on the details: inspect skin textures, finger counts, and eye reflections. Ask yourself: Is the composition too abstract? Does the subject’s behavior align with reality?", ()=>enableC1Btn("Next", correctC1Step2));
    } else {
        playSFX('wrongSFX');
        overlay.style.background = "rgba(255,0,0,0.3)";
        updateOldMan('c1Dialogue', 'om_stern');
        typeText("c1Text", "Wrong! This image is authentic. When vetting AI content, focus on the details: inspect skin textures, finger counts, and eye reflections. Ask yourself: Is the composition too abstract? Does the subject’s behavior align with reality?", ()=>enableC1Btn("Next", wrongC1Step2));
    }
}
function correctC1Step2(){
    playSFX('boopSFX'); const btn = document.getElementById("c1Btn");
    btn.innerText = "Next challenge"; btn.disabled = true;
    updateOldMan('c1Dialogue', 'om_talking');
    typeText("c1Text", "You paid close attention to such details and identified AI correctly. Good job!", ()=>enableC1Btn("Next challenge", unlockRoom1));
}
function wrongC1Step2(){
    playSFX('boopSFX'); const btn = document.getElementById("c1Btn");
    btn.innerText = "Next challenge"; btn.disabled = true;
    updateOldMan('c1Dialogue', 'om_finger');
    typeText("c1Text", "To avoid being compromised, you must look closer. Attention to detail is the difference between spotting a scam and falling for one.", ()=>enableC1Btn("Next challenge", wrongUnlockRoom1));
}
function unlockRoom1(){
    playSFX('goSFX');
    const panel = document.getElementById("c1Dialogue"); const images = document.getElementById("c1Images"); const overlay = document.getElementById("overlay");
    panel.style.animation = "slideDown 0.5s ease forwards"; images.classList.add("fade-out"); overlay.style.background = "transparent";
    document.getElementById("c1Instruction").classList.add("hidden");
    setTimeout(()=>{
        panel.classList.add("hidden"); images.style.display = "none";
        playActiveFullThenTransition(()=>{
            showScreen('c2'); playBGM('room2BGM'); startC2Intro();
        }, 'assets/room2.mp4');
    },500);
}
function wrongUnlockRoom1(){
    const panel = document.getElementById("c1Dialogue"); const images = document.getElementById("c1Images"); const overlay = document.getElementById("overlay");
    panel.style.animation = "slideDown 0.5s ease forwards"; images.classList.add("fade-out"); overlay.style.background = "transparent";
    document.getElementById("c1Instruction").classList.add("hidden");
    setTimeout(()=>{
        panel.classList.add("hidden"); images.style.display = "none";
        transitionWithoutVideo(()=>{
            showScreen('c2'); playBGM('room2BGM'); startC2Intro();
        });
    },500);
}

/* ---------------- CHALLENGE 2 ---------------- */
let c2Step = 0;
function startC2Intro(){
    c2Mode = "intro"; c2Step = 0;
    document.getElementById("overlay").style.background = "rgba(0,0,0,0.6)";
    const panel = document.getElementById("c2Dialogue"); panel.style.animation = "slideUp 0.5s ease"; panel.classList.remove("hidden");
    const btn = document.getElementById("c2Btn"); btn.innerText = "Next"; btn.disabled = true;
    
    updateOldMan('c2Dialogue', c2IntroImages[0]);
    typeText("c2Text", c2IntroLines[0], ()=>enableC2Btn("Next", nextC2Intro));
}
function nextC2Intro(){
    if(typing) return;
    playSFX('boopSFX'); c2Step++;
    const btn = document.getElementById("c2Btn");
    if(c2Step === 1){
        btn.innerText = "Next"; btn.disabled = true;
        updateOldMan('c2Dialogue', c2IntroImages[1]);
        typeText("c2Text", c2IntroLines[1], ()=>enableC2Btn("Next", nextC2Intro));
    } else if(c2Step === 2){
        btn.innerText = "Let's go!"; btn.disabled = true;
        updateOldMan('c2Dialogue', c2IntroImages[2]);
        typeText("c2Text", c2IntroLines[2], ()=>enableC2Btn("Let's go!", startC2Game));
    }
}
function startC2Game(){
    playSFX('goSFX'); c2Mode = "gameplay";
    const panel = document.getElementById("c2Dialogue"); const overlay = document.getElementById("overlay");
    panel.style.animation = "slideDown 0.5s ease forwards";
    setTimeout(()=>{
        panel.classList.add("hidden"); panel.style.animation = "slideUp 0.5s ease"; 
        overlay.style.background = "transparent"; 
        document.getElementById("c2AudioBoxes").classList.remove("hidden");
        document.getElementById("c2Instruction").classList.remove("hidden"); 
        
        startTimer(40, () => handleTimeout(2));
    },500);
}
function playAudioClip(audioId, visualizerId) {
    if (currentBGM) {
        clearInterval(fadeInInterval); clearInterval(fadeOutInterval);
        fadeOutInterval = setInterval(() => {
            if(currentBGM.volume > 0.05) currentBGM.volume -= 0.05;
            else { currentBGM.volume = 0; clearInterval(fadeOutInterval); }
        }, 50);
    }
    ['realAudio', 'fakeAudio'].forEach(id => { const a = document.getElementById(id); a.pause(); a.currentTime = 0; });
    document.querySelectorAll('.visualizer-screen').forEach(v => v.classList.remove('playing'));
    
    const audio = document.getElementById(audioId); audio.play().catch(e => console.log(e));
    if(visualizerId) {
        const vis = document.getElementById(visualizerId); vis.classList.add('playing');
        audio.onended = () => {
            vis.classList.remove('playing');
            if (currentBGM) {
                const targetVol = bgmVolumes[currentBGM.id] || 0.4;
                clearInterval(fadeOutInterval);
                fadeInInterval = setInterval(() => {
                    if(currentBGM.volume < targetVol - 0.05) currentBGM.volume += 0.05;
                    else { currentBGM.volume = targetVol; clearInterval(fadeInInterval); }
                }, 50);
            }
        };
    }
}
function answerC2(isAI) {
    if (c2Mode !== "gameplay") return;
    c2Mode = "result";
    stopTimer(); 
    
    if (currentBGM && currentBGM.volume < (bgmVolumes[currentBGM.id] || 0.4)) {
        const targetVol = bgmVolumes[currentBGM.id] || 0.4;
        clearInterval(fadeOutInterval);
        fadeInInterval = setInterval(() => {
            if(currentBGM.volume < targetVol - 0.05) currentBGM.volume += 0.05;
            else { currentBGM.volume = targetVol; clearInterval(fadeInInterval); }
        }, 50);
    }
    ['realAudio', 'fakeAudio'].forEach(id => { const a = document.getElementById(id); a.pause(); a.currentTime = 0; });
    document.querySelectorAll('.visualizer-screen').forEach(v => v.classList.remove('playing'));

    const panel = document.getElementById("c2Dialogue"); panel.classList.remove("hidden");
    const overlay = document.getElementById("overlay");
    const btn = document.getElementById("c2Btn"); btn.innerText = "Next"; btn.disabled = true;

    if (isAI) {
        playSFX('correctSFX'); playActiveBriefFreeze(); score++; updateScore(); 
        overlay.style.background = "rgba(0,255,0,0.3)";
        updateOldMan('c2Dialogue', 'om_talking');
        typeText("c2Text", "Correct! This audio is AI-generated. To detect AI synthesis, scrutinize the delivery: is the tone unnaturally monotonous? Evaluate the pronunciation - does the accent and cadence feel human?", () => enableC2Btn("Next", correctC2Step2));
    } else {
        playSFX('wrongSFX');
        overlay.style.background = "rgba(255,0,0,0.3)";
        updateOldMan('c2Dialogue', 'om_stern');
        typeText("c2Text", "Incorrect. This audio is authentic. To detect AI synthesis, scrutinize the delivery: is the tone unnaturally monotonous? Evaluate the pronunciation - does the accent and cadence feel human?", () => enableC2Btn("Next", wrongC2Step2));
    }
}
function correctC2Step2(){
    playSFX('boopSFX'); const btn = document.getElementById("c2Btn");
    btn.innerText = "Next challenge"; btn.disabled = true;
    updateOldMan('c2Dialogue', 'hologram');
    typeText("c2Text", "You listened close to such details to make sure you are not deceived. Good job!", ()=>enableC2Btn("Next challenge", unlockRoom2));
}
function wrongC2Step2(){
    playSFX('boopSFX'); const btn = document.getElementById("c2Btn");
    btn.innerText = "Next challenge"; btn.disabled = true;
    updateOldMan('c2Dialogue', 'om_finger');
    typeText("c2Text", "You need to listen close to such details to make sure you are not deceived.", ()=>enableC2Btn("Next challenge", wrongUnlockRoom2));
}
function unlockRoom2(){
    playSFX('goSFX');
    const panel = document.getElementById("c2Dialogue"); const boxes = document.getElementById("c2AudioBoxes"); const overlay = document.getElementById("overlay");
    panel.style.animation = "slideDown 0.5s ease forwards"; boxes.classList.add("fade-out"); overlay.style.background = "transparent";
    document.getElementById("c2Instruction").classList.add("hidden");
    setTimeout(()=>{
        panel.classList.add("hidden"); boxes.style.display = "none";
        playActiveFullThenTransition(()=>{
            showScreen('c3'); document.getElementById("overlay").style.background = "rgba(0,0,0,0.6)"; playBGM('room3BGM'); startC3();
        }, 'assets/room3.mp4');
    }, 500);
}
function wrongUnlockRoom2(){
    const panel = document.getElementById("c2Dialogue"); const boxes = document.getElementById("c2AudioBoxes"); const overlay = document.getElementById("overlay");
    panel.style.animation = "slideDown 0.5s ease forwards"; boxes.classList.add("fade-out"); overlay.style.background = "transparent";
    document.getElementById("c2Instruction").classList.add("hidden");
    setTimeout(()=>{
        panel.classList.add("hidden"); boxes.style.display = "none";
        transitionWithoutVideo(()=>{
            showScreen('c3'); document.getElementById("overlay").style.background = "rgba(0,0,0,0.6)"; playBGM('room3BGM'); startC3();
        });
    }, 500);
}

/* ---------------- CHALLENGE 3 ---------------- */
let c3Step = 0;
function startC3() {
    c3Mode = "intro"; c3Step = 0; c3Correct = false;
    const panel = document.getElementById("c3Dialogue"); panel.style.animation = "slideUp 0.5s ease"; panel.classList.remove("hidden");
    const btn = document.getElementById("c3Btn"); btn.innerText = "Next"; btn.disabled = true;
    
    updateOldMan('c3Dialogue', c3IntroImages[0]);
    typeText("c3Text", c3IntroLines[0], () => enableC3Btn("Next", nextC3Intro));
}
function nextC3Intro() {
    if(typing) return;
    playSFX('boopSFX'); c3Step++;
    const btn = document.getElementById("c3Btn");
    if(c3Step === 1) {
        btn.innerText = "Next"; btn.disabled = true;
        updateOldMan('c3Dialogue', c3IntroImages[1]);
        typeText("c3Text", c3IntroLines[1], () => enableC3Btn("Next", nextC3Intro));
    } else if (c3Step === 2) {
        btn.innerText = "Let's go!"; btn.disabled = true;
        updateOldMan('c3Dialogue', c3IntroImages[2]);
        typeText("c3Text", c3IntroLines[2], () => enableC3Btn("Let's go!", startC3Game));
    }
}
function startC3Game() {
    playSFX('goSFX'); c3Mode = "gameplay";
    const panel = document.getElementById("c3Dialogue"); const overlay = document.getElementById("overlay");
    panel.style.animation = "slideDown 0.5s ease forwards";
    setTimeout(() => {
        panel.classList.add("hidden"); panel.style.animation = "slideUp 0.5s ease"; 
        overlay.style.background = "transparent";
        document.getElementById("c3Instruction").classList.remove("hidden"); document.getElementById("c3Tablets").classList.remove("hidden");
        buzzTimer1 = setTimeout(() => playSFX('buzzSFX'), 1000); 
        buzzTimer2 = setTimeout(() => playSFX('buzzSFX'), 6000); 
        
        startTimer(50, () => handleTimeout(3));
    }, 500);
}
function answerC3(isAI) {
    if (c3Mode !== "gameplay") return;
    c3Mode = "result";
    c3Correct = isAI; 
    stopTimer(); 
    clearTimeout(buzzTimer1); clearTimeout(buzzTimer2);

    const panel = document.getElementById("c3Dialogue"); panel.classList.remove("hidden");
    const overlay = document.getElementById("overlay");
    const btn = document.getElementById("c3Btn"); btn.innerText = "Next"; btn.disabled = true;

    if (isAI) {
        playSFX('correctSFX'); playActiveBriefFreeze(); score++; updateScore(); 
        overlay.style.background = "rgba(0,255,0,0.3)";
        updateOldMan('c3Dialogue', 'om_talking');
        typeText("c3Text", "Correct! This message is AI-generated. Scam messages generated by AI often use urgency, fear, or pressure to force quick decisions. They also ask for sensitive information such as passwords, bank details, or identification numbers.", () => enableC3Btn("Next", c3Step2));
    } else {
        playSFX('wrongSFX');
        overlay.style.background = "rgba(255,0,0,0.3)";
        updateOldMan('c3Dialogue', 'om_stern');
        typeText("c3Text", "Wrong! This message is real. Scam messages generated by AI often use urgency, fear, or pressure to force quick decisions. They also ask for sensitive information such as passwords, bank details, or identification numbers.", () => enableC3Btn("Next", wrongC3Step2));
    }
}
function c3Step2() {
    playSFX('boopSFX'); const btn = document.getElementById("c3Btn");
    btn.innerText = "Finish"; btn.disabled = true;
    updateOldMan('c3Dialogue', 'hologram');
    typeText("c3Text", "Always check if the tone feels unnatural, too formal, or unusually urgent. Never give private information without verifying the sender.", () => enableC3Btn("Finish", unlockRoom3));
}
function wrongC3Step2(){
    playSFX('boopSFX'); const btn = document.getElementById("c3Btn");
    btn.innerText = "Finish"; btn.disabled = true;
    updateOldMan('c3Dialogue', 'om_finger');
    typeText("c3Text", "Always check if the tone feels unnatural, too formal, or unusually urgent. Never give private information without verifying the sender.", () => enableC3Btn("Finish", wrongUnlockRoom3));
}
function unlockRoom3() {
    playSFX('goSFX');
    const panel = document.getElementById("c3Dialogue"); const tablets = document.getElementById("c3Tablets"); const overlay = document.getElementById("overlay");
    panel.style.animation = "slideDown 0.5s ease forwards"; tablets.classList.add("fade-out"); document.getElementById("c3Instruction").classList.add("hidden"); overlay.style.background = "transparent";
    setTimeout(()=>{
        panel.classList.add("hidden"); tablets.style.display = "none";
        playActiveFullThenTransition(()=>{
            showEnd();
        }, null); 
    }, 500);
}
function wrongUnlockRoom3(){
    const panel = document.getElementById("c3Dialogue"); const tablets = document.getElementById("c3Tablets"); const overlay = document.getElementById("overlay");
    panel.style.animation = "slideDown 0.5s ease forwards"; tablets.classList.add("fade-out"); document.getElementById("c3Instruction").classList.add("hidden"); overlay.style.background = "transparent";
    setTimeout(()=>{
        panel.classList.add("hidden"); tablets.style.display = "none";
        transitionWithoutVideo(()=>{
            showEnd();
        });
    }, 500);
}

/* ---------------- END SCREEN & RESTART LOGIC ---------------- */
function showEnd() {
    const endScreen = document.getElementById('end');
    const panel = document.getElementById("endDialogue");
    const isWin = (score === 3);
    
    if (isWin) { playBGM('endBGM'); } 
    else { playBGM('failBGM'); } 
    
    document.querySelectorAll('.screen').forEach(s => { if(s.id !== 'end') s.classList.remove('active'); });
    endScreen.classList.add('active');
    
    document.getElementById("hud").classList.add("hidden");
    document.getElementById("overlay").style.background = "transparent";
    document.getElementById("finalResultsCard").classList.add("hidden");

    if (isWin) {
        if(activeVideo) { activeVideo.pause(); activeVideo.remove(); activeVideo = null; }
        endScreen.style.background = ""; 
        endScreen.className = 'screen active bg-graduation';
        panel.className = 'dialogue-panel hidden'; 
        panel.style.animation = "slideUp 0.5s ease forwards";
        updateOldMan('endDialogue', 'om_clapping');
    } else {
        if (c3Correct) {
            if(activeVideo) { activeVideo.pause(); activeVideo.remove(); activeVideo = null; }
            endScreen.style.background = ""; 
            endScreen.className = 'screen active bg-intro';
        } else {
            endScreen.className = 'screen active'; 
            endScreen.style.background = 'transparent';
        }

        panel.className = 'dialogue-panel failed-closing hidden'; 
        panel.style.animation = "none";
        panel.style.opacity = "0";
        setTimeout(() => panel.style.opacity = "1", 50); 
        panel.style.transition = "opacity 0.5s ease";
        updateOldMan('endDialogue', 'hologram');
    }
    
    panel.classList.remove("hidden");
    const btn = document.getElementById("endBtn");
    btn.innerText = "Next"; btn.disabled = true;

    const endMsg = isWin 
        ? "Congratulations! You have completed all the challenges successfully. You have proved your knowledge and competency in the world of Artificial Intelligence. You are now a graduate of the School of Artificial Intelligence Defense."
        : "Unfortunately, you have failed the final test, and will not be graduating from the School of Artificial Intelligence Defence. But fret not! You have learnt a great deal from your mistakes, and you can try again!";

    typeText("endText", endMsg, () => {
        btn.disabled = false;
        btn.onclick = showFinalResults;
    });
}

function showFinalResults() {
    playSFX('boopSFX');
    const panel = document.getElementById("endDialogue");
    const resultsCard = document.getElementById("finalResultsCard");
    
    panel.style.transition = "opacity 0.5s ease";
    panel.style.opacity = "0";
    
    setTimeout(() => {
        panel.classList.add("hidden");
        panel.style.opacity = "1";
        panel.style.transition = ""; 
        
        resultsCard.classList.remove("hidden");
        document.getElementById("finalScore").innerText = `Final Score: ${score}/3`;
        
        let evalText = "";
        if(score === 3) evalText = "Exemplary! You are a Guardian of Truth. AI cannot easily deceive you.";
        else if(score >= 1) evalText = "Passable. You have a foundation, but you must remain vigilant. AI is evolving faster than we are.";
        else evalText = "Failed. You were easily manipulated by the machine. Return to the academy and study the signs of synthetic media.";
        
        document.getElementById("evaluation").innerText = evalText;
    }, 500);
}

function restartGame(skipToIntro) {
    playSFX('goSFX');
    fadeOutCurrentBGM(); 
    stopTimer(); 
    if(activeVideo) { activeVideo.pause(); activeVideo.remove(); activeVideo = null; }
    
    // --- FULL DOM RESET SO ELEMENTS RETURN ---
    ['c1Images', 'c2AudioBoxes', 'c3Tablets'].forEach(id => {
        const el = document.getElementById(id);
        if(el) { el.style.display = ""; el.classList.remove("fade-out"); el.classList.add("hidden"); }
    });
    ['c1Instruction', 'c2Instruction', 'c3Instruction'].forEach(id => {
        const el = document.getElementById(id);
        if(el) { el.classList.add("hidden"); }
    });
    ['c1Dialogue', 'c2Dialogue', 'c3Dialogue', 'endDialogue'].forEach(id => {
        const el = document.getElementById(id);
        if(el) { el.style.animation = "none"; el.classList.add("hidden"); }
    });
    
    if (skipToIntro) {
        triggerCyberTransition(() => {
            playBGM('introBGM'); 
            score = 0; updateScore(); introIndex = 1;
            showScreen('intro');
            document.getElementById("hud").classList.add("hidden"); 
            updateOldMan('intro', introImages[introIndex]);
            
            const btn = document.getElementById("introBtn");
            btn.disabled = true; btn.innerText = "Next"; btn.onclick = nextIntro;
            typeText("introText", introLines[introIndex], () => btn.disabled = false);
        });
    } else {
        const fade = document.getElementById("fade");
        fade.style.opacity = 1;
        setTimeout(() => {
            playBGM('startBGM'); 
            showScreen('start');
            setTimeout(() => { fade.style.opacity = 0; }, 50);
        }, 600);
    }
}

function enableC1Btn(text, action){ const btn = document.getElementById("c1Btn"); btn.innerText = text; btn.disabled = false; btn.onclick = action; }
function enableC2Btn(text, action){ const btn = document.getElementById("c2Btn"); btn.innerText = text; btn.disabled = false; btn.onclick = action; }
function enableC3Btn(text, action){ const btn = document.getElementById("c3Btn"); btn.innerText = text; btn.disabled = false; btn.onclick = action; }