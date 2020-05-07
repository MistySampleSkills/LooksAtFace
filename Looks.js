/**********************************************************************
    Copyright 2020 Misty Robotics
    Licensed under the Apache License, Version 2.0 (the "License");
    you may not use this file except in compliance with the License.
    You may obtain a copy of the License at
        http://www.apache.org/licenses/LICENSE-2.0
    Unless required by applicable law or agreed to in writing, software
    distributed under the License is distributed on an "AS IS" BASIS,
    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
    See the License for the specific language governing permissions and
    limitations under the License.

    **WARRANTY DISCLAIMER.**

    * General. TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, MISTY
    ROBOTICS PROVIDES THIS SAMPLE SOFTWARE "AS-IS" AND DISCLAIMS ALL
    WARRANTIES AND CONDITIONS, WHETHER EXPRESS, IMPLIED, OR STATUTORY,
    INCLUDING THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR
    PURPOSE, TITLE, QUIET ENJOYMENT, ACCURACY, AND NON-INFRINGEMENT OF
    THIRD-PARTY RIGHTS. MISTY ROBOTICS DOES NOT GUARANTEE ANY SPECIFIC
    RESULTS FROM THE USE OF THIS SAMPLE SOFTWARE. MISTY ROBOTICS MAKES NO
    WARRANTY THAT THIS SAMPLE SOFTWARE WILL BE UNINTERRUPTED, FREE OF VIRUSES
    OR OTHER HARMFUL CODE, TIMELY, SECURE, OR ERROR-FREE.
    * Use at Your Own Risk. YOU USE THIS SAMPLE SOFTWARE AND THE PRODUCT AT
    YOUR OWN DISCRETION AND RISK. YOU WILL BE SOLELY RESPONSIBLE FOR (AND MISTY
    ROBOTICS DISCLAIMS) ANY AND ALL LOSS, LIABILITY, OR DAMAGES, INCLUDING TO
    ANY HOME, PERSONAL ITEMS, PRODUCT, OTHER PERIPHERALS CONNECTED TO THE PRODUCT,
    COMPUTER, AND MOBILE DEVICE, RESULTING FROM YOUR USE OF THIS SAMPLE SOFTWARE
    OR PRODUCT.

    Please refer to the Misty Robotics End User License Agreement for further
    information and full details:
        https://www.mistyrobotics.com/legal/end-user-license-agreement/
**********************************************************************/

misty.Debug("Starting Looks !!");

misty.Set("pitch", 0.0);
misty.Set("yaw", 0.0);
misty.Set("roll", 0.0);
misty.MoveArm("left", 0, 45);
misty.MoveArm("right", 0, 45);

misty.Set("faceDetectedAt", (new Date()).toUTCString());
misty.Set("pastElevation", 0.0);
misty.Set("pastBearing", 0.0);
misty.Set("lookAround", true);
misty.Set("lookStartTime",(new Date()).toUTCString());
misty.Set("timeInLook",6.0);
misty.Set("touchAt", (new Date()).toUTCString());
misty.Set("inTouch",false);

misty.Debug("Centering Head");
misty.MoveHead(0, 0, 0, 100);
misty.Pause(3000);

// Used for LED gradient changes
misty.Set("pastState", "skillStarted");
//misty.Set("loop1", true);
misty.ChangeLED(0,0,0); //Purple

//misty.StartFaceRecognition();
misty.StartFaceDetection();
registerFaceFollow();
registerCaptouch();

misty.Set("red", 148);
misty.Set("green", 0);
misty.Set("blue", 211);
misty.ChangeLED(148, 0, 211);


// -----------------------------Cap Touch--------------------------------------------------------

misty.Set("touchTimeout", 3);

function _Touched(data) {

	if (!misty.Get("inTouch")){
		misty.Set("inTouch", true);
		misty.UnregisterEvent("FaceFollow");
		misty.Set("touchAt", (new Date()).toUTCString());

		var sensor = data.AdditionalResults[0];
		misty.Debug(sensor);

		switch(sensor) {
			case "CapTouch_Chin":
				blue_up();
				misty.PlayAudio("chin_amp.wav");
				misty.Set("eyeMemory", "Happy.png");
				misty.DisplayImage("Happy.png");
				misty.Set("blinkStartTime",(new Date()).toUTCString());
				misty.Set("timeBetweenBlink",3);
				blink_now();
				misty.Set("touchTimeout", 6);
misty.MoveHead(null, -4.5,null);
			 	break;
			case "CapTouch_HeadLeft":
				blue_up();
				misty.PlayAudio("head_amp.wav");
				misty.Set("eyeMemory", "Wonder.png");
				misty.DisplayImage("Wonder.png");
				misty.Set("blinkStartTime",(new Date()).toUTCString());
				misty.Set("timeBetweenBlink",3);
				blink_now();
				misty.Set("touchTimeout", 6);
misty.MoveHead(null, 4.5,null);
			 	break;
			default:
				red_up();
				misty.PlayAudio("043-Bbbaaah.wav");
				misty.DisplayImage("Angry.png");
				misty.Set("eyeMemory", "Angry.png");
				misty.Set("blinkStartTime",(new Date()).toUTCString());
				misty.Set("timeBetweenBlink",3);
				misty.Set("touchTimeout", 3);

			  // code block
		  }

	}
 //    CapTouch_Scruff
 //    CapTouch_HeadTop
 //    CapTouch_HeadBack
 //    CapTouch_HeadFront
 //    CapTouch_ChinLeft
 //    CapTouch_ChinRight
}

// -----------------------------Face Follow--------------------------------------------------------

//misty.Set("yawPtimeout", (new Date()).toUTCString());
//misty.Set("yawNtimeout", (new Date()).toUTCString());

misty.Set("setPitch", 0.0);
misty.Set("setYaw", 0.0);

function _FaceFollow(data){
    
    try{
		// TODO Turn off Look Around
		misty.Set("lookAround", false);
		if (misty.Get("pastState") != "faceFollow"){
			misty.Set("pastState", "faceFollow");
			green_up();
		}

        var bearing = data.PropertyTestResults[0].PropertyParent.Bearing * 0.25 * 0.1;
		var elevation = data.PropertyTestResults[0].PropertyParent.Elevation * 0.3 * 0.1;
		
		bearing = min_increment(bearing);
		elevation = min_increment(elevation);

		var to_pitch = misty.Get("pitch"); 
		var to_yaw = misty.Get("yaw"); 
		misty.Debug("Current settings pitch: " + to_pitch + " yaw: " + to_yaw)
		to_pitch = set_in_range(to_pitch + elevation);
		to_yaw = set_in_range(to_yaw + bearing);

		// Avoiding Oscillations - the next two IFs ______ THIS IS WRONG

		var pastBearing = misty.Get("pastBearing");
		var pastElevation = misty.Get("pastElevation");
		if (Math.sign(pastBearing) == Math.sign(bearing) && Math.abs(misty.Get("setYaw")-to_yaw)>=0.1){ //0.2
			/** I had to adjust the to_yaw value to make up for the new API calls (misty.MoveHead())
			 *  There is probably a better solution to this but I did not want to modify the above code.
			 *  For some reason the value stored in Misty is from range (-5,5) but the new misty.MoveHead() function does not
			 *  use that range.
			 *  11/4/2019 Brandon Geraci
			 */
			misty.MoveHead(null,null, (to_yaw * 16.2),100);
			misty.MoveHead(null, 0,null,100);
			misty.Set("setYaw", to_yaw);

		}
		if (Math.sign(pastElevation) == Math.sign(elevation) && Math.abs(misty.Get("setPitch")-to_pitch)>=0.1){ //0.2 much better
			/** I had to adjust the to_pitch value to make up for the new API calls
			 *  There is probably a better solution to this but I did not want to modify the above code.
			 *  11/4/2019 Brandon Geraci
			 */
			misty.MoveHead( (to_pitch * 6.6),null,null,100);
			misty.MoveHead(null, 0,null,100);
			misty.Set("setPitch", to_pitch);
		}
		
		misty.Debug(to_yaw+" , "+to_pitch);
		misty.Set("pastElevation", elevation);
		misty.Set("pastBearing", bearing);       
		//misty.Debug(to_yaw+" , "+to_pitch);
        //misty.MoveHead(to_pitch, 0, to_yaw, 100);
        misty.Set("pitch", to_pitch);
		misty.Set("yaw", to_yaw);
		
		misty.Set("faceDetectedAt", (new Date()).toUTCString());

    } catch (err) {
        misty.Debug("Some Error");
    }
}

function set_in_range(value){
	return Math.min((Math.max(value,-5.0)),5.0);
}

function min_increment(value){

	if (Math.abs(value) <= 0.1) { //0.1 much better
		
		return 0.0;

	} else if (Math.abs(value) > 0.1){
		
		return 0.3*Math.sign(value); //0.15  //0.2 was good
	}
	
}

//-------------------------Blink--------------------------------------------------------
misty.Set("eyeMemory", "Homeostasis.png");
misty.Set("blinkStartTime",(new Date()).toUTCString());
misty.Set("timeBetweenBlink",5);

function blink_now(){
    misty.Set("blinkStartTime",(new Date()).toUTCString());
    misty.Set("timeBetweenBlink",getRandomInt(2, 8));
    misty.DisplayImage("blinkMisty.png");
    misty.Pause(200);
    misty.DisplayImage(misty.Get("eyeMemory"));
}

//-------------------------Random Hand Movement--------------------------------------------
misty.Set("handsStartTime",(new Date()).toUTCString());
misty.Set("timeBetweenHandMotion",5);

function move_hands(){
    misty.Set("handsStartTime",(new Date()).toUTCString());
	misty.Set("timeBetweenHandMotion",getRandomInt(5, 10));
	misty.MoveArm("left", getRandomInt(0, 7), getRandomInt(50, 100));
	misty.MoveArm("right", getRandomInt(0, 7), getRandomInt(50, 100));
}

//-------------------------Look Around-----------------------------------------------------

function look_around(){
	if (misty.Get("pastState") != "lookAround"){
		misty.Set("pastState", "lookAround");
		purple_up();
	}
	misty.Debug("LOOKING AROUND");
    misty.Set("lookStartTime",(new Date()).toUTCString());
	misty.Set("timeInLook",getRandomInt(5, 10));
	/** This had to be updated because of the new api call.  */
    misty.MoveHead(gaussianRandom(-40,26), gaussianRandom(-40,40), gaussianRandom(-81,81), 100);
}

//--------------------------LED Gradients----------------------------------------------------

function green_up(){
	var red = misty.Get("red")/10.0;
    var green = misty.Get("green")/10.0;
    var blue = misty.Get("blue")/10.0;
    for (var i = 10; i >=0 ; i=i-1) { 
        misty.ChangeLED(Math.floor(i*red),Math.floor(i*green),Math.floor(i*blue));
        misty.Pause(50);
    }
    for (var i =0; i <=10 ; i=i+1) { 
		misty.ChangeLED(0,Math.floor(i*20),0);
		misty.Pause(50);
    }
    misty.Set("red", 0);
    misty.Set("green", 200);
    misty.Set("blue", 0);
}

function purple_up(){
	var red = misty.Get("red")/10.0;
    var green = misty.Get("green")/10.0;
    var blue = misty.Get("blue")/10.0;
    for (var i = 10; i >=0 ; i=i-1) { 
        misty.ChangeLED(Math.floor(i*red),Math.floor(i*green),Math.floor(i*blue));
        misty.Pause(50);
    }
    for (var i =0; i <=10 ; i=i+1) { 
		misty.ChangeLED(Math.floor(i*14.8),0,Math.floor(i*21.1));
		misty.Pause(50);
    }
    misty.Set("red", 148);
    misty.Set("green", 0);
    misty.Set("blue", 211);
}

function red_up(){
    var red = misty.Get("red")/10.0;
    var green = misty.Get("green")/10.0;
    var blue = misty.Get("blue")/10.0;
    for (var i = 10; i >=0 ; i=i-1) { 
        misty.ChangeLED(Math.floor(i*red),Math.floor(i*green),Math.floor(i*blue));
        misty.Pause(50);
    }
    for (var i =0; i <=10 ; i=i+1) { 
		misty.ChangeLED(Math.floor(i*20),0,0);
		misty.Pause(50);
    }
    misty.Set("red", 200);
    misty.Set("green", 0);
    misty.Set("blue", 0);
}

function blue_up(){
    var red = misty.Get("red")/10.0;
    var green = misty.Get("green")/10.0;
    var blue = misty.Get("blue")/10.0;
    for (var i = 10; i >=0 ; i=i-1) { 
        misty.ChangeLED(Math.floor(i*red),Math.floor(i*green),Math.floor(i*blue));
        misty.Pause(50);
    }
    for (var i =0; i <=10 ; i=i+1) { 
		misty.ChangeLED(0,0,Math.floor(i*20));
		misty.Pause(50);
    }
    misty.Set("red", 0);
    misty.Set("green", 0);
    misty.Set("blue", 200);
}
 
// ------------------------Loop----------------------------------------------------------

while (true) {
	misty.Pause(100);

    if (secondsPast(misty.Get("blinkStartTime")) > misty.Get("timeBetweenBlink")){
        blink_now();
	}

	//misty.Set("handsStartTime",(new Date()).toUTCString());
	//misty.Set("timeBetweenHandMotion",5);
	if (secondsPast(misty.Get("handsStartTime")) > misty.Get("timeBetweenHandMotion")){
        move_hands();
	}

	if (!misty.Get("lookAround") && secondsPast(misty.Get("faceDetectedAt")) > 10.0){
		misty.Set("lookAround", true);
	}

	if (misty.Get("lookAround") && !misty.Get("inTouch")){
		if (secondsPast(misty.Get("lookStartTime")) > misty.Get("timeInLook")){
			look_around();
		}
	}

	if (misty.Get("inTouch") && secondsPast(misty.Get("touchAt")) > misty.Get("touchTimeout")){
		misty.Set("inTouch", false);
		misty.Set("eyeMemory", "Homeostasis.png");
misty.MoveHead(null, 0,null);
		if (misty.Get("lookAround")){
			purple_up();
		} else {
			green_up();
		}
		registerFaceFollow();
	}
	
}

// -----------------------Support Functions------------------------------------------------

function secondsPast(value){
	var timeElapsed = new Date() - new Date(value);
    timeElapsed /= 1000;
    return Math.round(timeElapsed); // seconds
}

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function gaussianRand() {
    var u = 0.0, v = 0.0;
    while(u === 0) u = Math.random(); //Converting [0,1) to (0,1)
    while(v === 0) v = Math.random() ; //(max - min + 1)) + min
    let num = Math.sqrt( -2.0 * Math.log( u ) ) * Math.cos( 2.0 * Math.PI * v );
    num = num / 10.0 + 0.5; // Translate to 0 -> 1
    if (num > 1 || num < 0) return randn_bm(); // resample between 0 and 1
    return num;
}

function gaussianRandom(start, end) {
    return Math.floor(start + gaussianRand() * (end - start + 1));
}

function map (num, in_min, in_max, out_min, out_max) {
	return (num - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
}

function registerFaceFollow(){
	misty.AddPropertyTest("FaceFollow", "PersonName", "exists", "", "string");
	misty.RegisterEvent("FaceFollow", "FaceRecognition", 400, true);
}

function registerCaptouch(){
	misty.AddReturnProperty("Touched", "sensorName");
	misty.RegisterEvent("Touched", "TouchSensor", 250 ,true);
}
