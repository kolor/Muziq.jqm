String.prototype.lc = String.prototype.toLowerCase;
String.prototype.enc = function(){return encodeURIComponent(this)};

function defined(obj) {
	if (typeof obj === "undefined")
		return false;
	if (obj === null)
		return false;
	return true;
}

function error(msg) {
    $('#error p').text(msg);
    $('#error').popup().popup('open');
}

function empty(obj) {
	if (obj === "") {
		return true;
	}
	if (obj.length === 0) {
		return true;
	}
	return false;
}

function cleanName(str) {   
    str = cleanU(str);
    var hex = /&#(.+);/.exec(str);
    if (hex != null) str = unescape(str.replace(/&#(.+);/,"%"+dechex(hex[1])));
    str = str.replace(/\[.*\]/g,""); //trim content of square brackets
    str = str.replace(/('|`|’)s/gi,'s').replace(/('|`|’)t/gi,''); // replace don't with dont 
    str = str.replace(/(\(|\)|\[|\]|\{|\}|@|:|_|,|'|`|’|\+|\|)+/g,' '); // replace with space
    str = str.replace(/(!|#|%|\^|\*|"|\\|\/|\?|<|>|\.)+/g,''); // remove
    return trim(str);
}


function cleanU(str) {
    str = str.replace(/[\u0000-\u001f]/g,'').replace(/[\u007f-\u00bf]/g,'');
    str = str.replace(/[\u00c0-\u00c6\u00e0-\u00e6]/g,'a').replace(/[\u00c8-\u00cb\u00e8-\u00eb]/g,'e');
    return str;
}

function in_array (needle, haystack) {
    for (key in haystack) {
        if (haystack.hasOwnProperty(key))
        if ((lc(haystack[key]).indexOf(lc(needle)) != -1) || (lc(needle).indexOf(lc(haystack[key])) != -1))
            return true; 
        }
  return false;
}

function lc(q) {
    return q.toLowerCase();
}

function cap(str) {
  return str.replace( /(^|\s|\.)(.)/g , function(m,p1,p2){ return p1+p2.toUpperCase(); } );
};

// trim whitespaces
function trim(q) {
    return q.replace(/^\s*/g, "").replace(/\s*$/, "").replace(/(\s)+/g," ");
}

// trim numbers
function tnum(q) {
    return q.replace(/\d+/g,'');
}

function trimBrackets(q) {
    return q.replace(/(\(|\[).*(\)|\])?/gi,'');
}

function cleanUni(str) {
    str = str.replace(/[\u0000-\u001f]/g,'').replace(/[\u007f-\u00bf]/g,'');
    str = str.replace(/[\u00c0-\u00c6\u00e0-\u00e6]/g,'a').replace(/[\u00c8-\u00cb\u00e8-\u00eb]/g,'e');
    return str;
}

function mkTime(dur) {
    var m = parseInt(dur/60);
    var s = dur % 60;
    var duration = (m > 9 ? m : '0'+m) +':'+ (s > 9 ? s : "0"+s);
    return duration;
}