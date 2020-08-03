var apiHandle = null;
var currProgress = "0";
var listCountslide = Reveal.getSlides().length; //slidecount 
var sus_val = "";
var sus_cnt = 0;
var sus_comp = '';
var sus_value = 0;
var finalstring = "";
var sus_val2 = "0";
var sumresul = 0;
var slideSeen = 0;
var slideSeenFrmDb = 0;
var slidemovedbybookmark = false;
var api = getAPIHandle();


function getAPIHandle() {
    if (apiHandle == null) {
        apiHandle = getAPI();
    }
    return apiHandle;
}

function getAPI() {
    var theAPI = findAPI(window);

    if ((theAPI == null) && (window.opener != null) && (typeof (window.opener) != "undefined")) {
        theAPI = findAPI(window.opener);
    }

    if (theAPI == null) {
        message("Unable to find an API adapter");
    }
    return theAPI
}

function findAPI(win) {
    var findAPITries = 0;
    while ((win.API == null) && (win.parent != null) && (win.parent != win)) {
        findAPITries++;
        // Note: 7 is an arbitrary number, but should be more than sufficient

        if (findAPITries > 7) {
            message("Error finding API -- too deeply nested.");
            return null;
        }
        win = win.parent;
    }
    return win.API;
}

//Function to set a value in the LMS

function SetValue(name, value) {
    return api.LMSSetValue(name, value);
}

//Function to retrieve a value from the lms

function Getvalue(name) {
    return api.LMSGetValue(name);
}

function bookmark() {
    debugger
    $(".bookmarkbg, .bookmark").css("display", "block");

    $("#yes").click(function () {
        $(".bookmarkbg, .bookmark").css("display", "none");
        slidemovedbybookmark = true;
        Reveal.slide(slideSeenFrmDb); //to move to last seen slide
    });

    $("#no").click(function () {
        slidemovedbybookmark = false;
        $(".bookmarkbg, .bookmark").css("display", "none");
        //Go to that specific slide
        slideSeen = 0;
        sus_cnt = 0;
        console.log("Final String " + finalstring);
        sus_val2 = '{"lang":"en","a11y":false,"slideSeen":"' + slideSeen + '","sus_cnt":"' + sus_cnt + '","completion":"' + finalstring + '","questions":"","_isCourseComplete":false,"_isAssessmentPassed":false}';
        console.log("next slide sus_val2 " + sus_val2);
        api.LMSSetValue("cmi.suspend_data", sus_val2);
    });
}

function enterValuesInDb(slideSeen, sus_cnt, sus_value, slidemovedbybookmark) {
    debugger
    if (sus_value.length <= listCountslide) {
        sus_value[sus_cnt] = 1;
        sumresul[sus_cnt] = 1;
        finalstring = sus_value.toString();
        if (finalstring.length == (listCountslide + (listCountslide - 1))) { //values should not go more than 55
            finalstring = finalstring.replace(/[,-]/g, function (m) {
                return m === ',' ? '-' : ',';
            });
            console.log("Final String " + finalstring);
            if (!slidemovedbybookmark) {
                sus_cnt++;
            }
            slidemovedbybookmark = false;
            console.log("next slide slideseen " + slideSeen);
            sus_val2 = '{"lang":"en","a11y":false,"slideSeen":"' + slideSeen + '","sus_cnt":"' + sus_cnt + '","completion":"' + finalstring + '","questions":"","_isCourseComplete":false,"_isAssessmentPassed":false}';
            console.log("next slide sus_val2 " + sus_val2);
            api.LMSSetValue("cmi.suspend_data", sus_val2);
        }
    }
    return sus_cnt;
}

Reveal.on('ready', event => {
    debugger
    api.LMSInitialize("");
    api.LMSGetValue("cmi.core.student_name");
    var sus_datafrmdb = api.LMSGetValue("cmi.suspend_data");//get tracking value from database
    while (sus_val2.length == listCountslide) { sus_val2 = "0" + sus_val2; }
    currProgress = Reveal.getProgress();
    if (sus_datafrmdb == "") {
        for (var i = 1; i <= listCountslide; i++) {
            sus_val += "0";
        }
        sus_cnt = 0;
        sus_value = Array.from(sus_val);
        sumresul = Array.from(sus_val);
    } else {
        sus_val = JSON.parse(sus_datafrmdb);
        console.log(sus_val);
        slideSeenFrmDb = sus_val.slideSeen;
        sus_cnt = sus_val.sus_cnt; //left off data
        sus_val = sus_val.completion; //completion data
        sus_val = sus_val.replace(/[^a-zA-Z0-9]/g, '');
        sus_value = Array.from(sus_val);
        sumresul = Array.from(sus_val);
    }

    if (sus_cnt > 0) {
        if (sus_val != sus_val2) {
            bookmark();
        }
    }

    window.onunload = window.onbeforeunload = function handleBrowserCloseButton(event) {
        //Call method by Ajax call
        var total = 0;
        for (var i in sumresul) {
            total += parseInt(sumresul[i]);
        }
        if (total == listCountslide) {
            api.LMSSetValue("cmi.core.lesson_status", "completed");
        } else {
            api.LMSSetValue("cmi.core.lesson_status", "incomplete");
        }
        api.LMSFinish("");
    }
});


Reveal.on('slidechanged', event => {
    debugger
    if (slideSeenFrmDb != 0 && slidemovedbybookmark) {
        sus_cnt = enterValuesInDb(slideSeenFrmDb, sus_cnt, sus_value, slidemovedbybookmark);
    }
    else {
        slidemovedbybookmark = false;
        slideSeen = Reveal.getSlidePastCount();
        if (Reveal.getProgress() > currProgress) { //next slide clicked
            currProgress = Reveal.getProgress();
            sus_cnt = enterValuesInDb(slideSeen, sus_cnt, sus_value, slidemovedbybookmark);
        }
        else {  //prev slide clicked
            currProgress = Reveal.getProgress();
            if (sus_value.length <= (listCountslide + 1)) {
                // finalstring[listCountslide] = finalstring.replace(/[,-]/g, function (m) {
                //     return m === ',' ? '-' : ',';
                // });
                finalstring = finalstring.replace(/[,-]/g, function (m) {
                    return m === ',' ? '-' : ',';
                });
            }

            if (sus_cnt > 0) {
                sus_cnt--;
            }
            sus_val2 = '{"lang":"en","a11y":false,"slideSeen":"' + slideSeen + '","sus_cnt":"' + sus_cnt + '","completion":"' + finalstring + '","questions":"","_isCourseComplete":false,"_isAssessmentPassed":false}';
            api.LMSSetValue("cmi.suspend_data", sus_val2);
        }

    }

    if (Reveal.isLastSlide()) {
        sus_value[sus_cnt] = 1;
        finalstring = sus_value.toString();
        if (finalstring.length == (listCountslide + (listCountslide - 1))) { //values should not go more than 55
            finalstring = finalstring.replace(/[,-]/g, function (m) {
                return m === ',' ? '-' : ',';
            });
            sumresul[sus_cnt] = 1;
            sus_val2 = '{"lang":"en","a11y":false,"slideSeen":"' + slideSeen + '","sus_cnt":"' + sus_cnt + '","completion":"' + finalstring + '","questions":"","_isCourseComplete":false,"_isAssessmentPassed":false}';
            api.LMSSetValue("cmi.suspend_data", sus_val2);
        }
    }
});