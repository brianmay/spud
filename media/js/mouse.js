var _startX = 0;            // mouse starting positions
var _startY = 0;
var _offsetX = 0;           // current element offset
var _offsetY = 0;
var _dragElement;
var _fixedElement;
var _goto = null;

InitDragDrop();

var next_image = new Image()
next_image.src = next_photo_thumb_url

var prev_image = new Image()
prev_image.src = prev_photo_thumb_url

function getElementsByClassName(className)
{
    var hasClassName = new RegExp("(?:^|\\s)" + className + "(?:$|\\s)");
    var allElements = document.getElementsByTagName("*");
    var results = [];

    var element;
    for (var i = 0; (element = allElements[i]) != null; i++) {
        var elementClass = element.className;
        if (elementClass && elementClass.indexOf(className) != -1 && hasClassName.test(elementClass))
            results.push(element);
    }

    return results;
}

function InitDragDrop()
{
    document.onmousedown = OnMouseDown;
    document.onmouseup = OnMouseUp;
}

function findPos(obj) {
    var curleft = curtop = 0;
    if (obj.offsetParent) {
        do {
            curleft += obj.offsetLeft;
            curtop += obj.offsetTop;
        } while (obj = obj.offsetParent);
    }
    return [curleft,curtop];
}

function OnMouseDown(e)
{
    // IE is retarded and doesn't pass the event object
    if (e == null) 
        e = window.event; 

    // IE uses srcElement, others use target
    var target = e.target != null ? e.target : e.srcElement;

    // for IE, left click == 1
    // for Firefox, left click == 0
    if (target.id == "photo" && (e.button == 1 && window.event != null || 
        e.button == 0))
    {
        // grab the mouse position
        _startX = e.clientX;
        _startY = e.clientY;

        // grab the clicked element's position
        var pos = findPos(target)
        _offsetX = pos[0]
        _offsetY = pos[1]

        // we need to access the element in OnMouseMove
        _fixedElement = target;
        _dragElement = document.createElement('img');
        _dragElement.src = _fixedElement.src
        _dragElement.style.position = "absolute";
        _dragElement.style.left = (_offsetX + e.clientX - _startX) + 'px';
        _dragElement.style.top = (_offsetY + e.clientY - _startY) + 'px';
        document.getElementById("content").appendChild(_dragElement);

        // bring the clicked element to the front while it is being dragged
        _dragElement.style.zIndex = 10000;

        // tell our code to start moving the element with the mouse
        document.onmousemove = OnMouseMove;

        // cancel out any text selections
        document.body.focus();

        // prevent text selection in IE
        document.onselectstart = function () { return false; };
        // prevent IE from trying to drag an image
        target.ondragstart = function() { return false; };

        // prevent text selection (except IE)
        return false;
    }
}

function OnMouseMove(e)
{
    var visibility = "visible";

    if (e == null) 
        var e = window.event;

    // this is the actual "drag code"
    _dragElement.style.left = (_offsetX + e.clientX - _startX) + 'px';
    _dragElement.style.top = (_offsetY + e.clientY - _startY) + 'px';

    var movedX = (e.clientX - _startX);
    if (movedX > 20 && prev_photo_url!="None") {
        _fixedElement.src = prev_photo_thumb_url
        _goto = "prev"
        visibility = "hidden";
    } else if (movedX < -20 && next_photo_url!="None") {
        _fixedElement.src = next_photo_thumb_url
        _goto = "next"
        visibility = "hidden";
    } else {
        _fixedElement.src = _dragElement.src
        _goto = null
    }

    var list = getElementsByClassName("photo_detail_block")
    list = list.concat(getElementsByClassName("photo_detail_summary"))
    for (x in list) {
        list[x].style.visibility = visibility
    }
}

function OnMouseUp(e)
{
    if (_dragElement != null)
    {
        // we're done with these events until the next OnMouseDown
        document.onmousemove = null;
        document.onselectstart = null;
        _dragElement.ondragstart = null;

        document.getElementById("content").removeChild(_dragElement);

        // this is how we know we're not dragging      
        _dragElement = null;

        if (_goto == "prev") {
            parent.location = prev_photo_url;
        } else if (_goto == "next") {
            parent.location = next_photo_url;
        }
    }
}
