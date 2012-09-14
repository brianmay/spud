InitDragDrop();

if (next_photo_thumb_url != "None") {
    var next_image = new Image()
    next_image.src = next_photo_thumb_url
}

if (prev_photo_thumb_url != "None") {
    var prev_image = new Image()
    prev_image.src = prev_photo_thumb_url
}

function resize_photo(img, width, height) {
    width = width || img.naturalWidth
    height = height || img.naturalHeight
    var aspect = width/height

    var subWidth = 80
    if (window.innerWidth <= 700) {
        subWidth = 0
    }
    if (width > window.innerWidth-subWidth) {
        width = window.innerWidth-subWidth
        height = width / aspect
    }

    if (height > window.innerHeight) {
        height = window.innerHeight
        width = height * aspect
    }

    if (window.innerWidth <= 700) {
        img.style.marginLeft = ((window.innerWidth-width)/2) + "px"
    } else {
        img.style.marginLeft = "0px"
    }

    img.width = width
    img.height = height
}

window.onresize = function(e) { resize_photo(document.getElementById("photo")) }

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
    document.onmousedown = OnDown;
    document.ontouchstart = OnDown;
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

function hide_details(visible)
{
        var list = getElementsByClassName("photo_detail_photo_detail")
        list = list.concat(getElementsByClassName("photo_detail_camera_detail"))
        list = list.concat(getElementsByClassName("photo_detail_comments"))
        list = list.concat(getElementsByClassName("photo_detail_add_comment"))
        list = list.concat(getElementsByClassName("photo_detail_summary"))
        for (x in list) {
            list[x].style.visibility = visible?"visible":"hidden"
        }
}

var _loading = false;
var _ignore = false;
function OnDown(e)
{
// IE is retarded and doesn't pass the event object
    if (e == null) e = window.event;

    var startPageX = 0;            // mouse starting positions
    var startPageY = 0;
    var startClientX = 0;            // mouse starting positions
    var startClientY = 0;
    var scrollX = 0;
    var scrollY = 0;
    var offsetX = 0;           // current element offset
    var offsetY = 0;
    var parentElement;
    var dragElement;
    var fixedElement;
    var gotoPhoto = null;
    var mouseMoved = false;

    var OnMove = function(e)
    {
        // IE is retarded and doesn't pass the event object
        if (e == null) e = window.event;
        if( e.targetTouches )
        {
            pageX = e.targetTouches[0].pageX;
            pageY = e.targetTouches[0].pageY;
            clientX = e.targetTouches[0].clientX;
            clientY = e.targetTouches[0].clientY;
        }
        else {
            pageX = e.pageX
            pageY = e.pageY
            clientX = e.clientX
            clientY = e.clientY
        }

        mouseMoved = true;

        var moveClientX = clientX - startClientX
        var moveClientY = clientY - startClientY

//        window.scrollTo(scrollX, scrollY - moveClientY)

        var movedPageX = pageX - startPageX
        var movedPageY = pageY - startPageY

//        console.log(moveClientX +","+ moveClientY +" "+ movedPageX+","+movedPageY)

        if (dragElement != null)
        {
            var visible = true;

            // this is the actual "drag code"
            dragElement.style.left = (offsetX + movedPageX) + 'px';
            dragElement.style.top = (offsetY + movedPageY) + 'px';

            if (movedPageX > 20 && prev_photo_url!="None") {
                fixedElement.src = prev_photo_thumb_url
                gotoPhoto = "prev"
                visible = false;
            } else if (movedPageX < -20 && next_photo_url!="None") {
                fixedElement.src = next_photo_thumb_url
                gotoPhoto = "next"
                visible = false;
            } else {
                fixedElement.src = this_photo_thumb_url
                gotoPhoto = null
            }
            fixedElement.onload = function(e) { resize_photo(fixedElement); }

            hide_details(visible)
        }
    }

    var OnUp = function(e)
    {
        // IE is retarded and doesn't pass the event object
        if (e == null) e = window.event;

        if (!mouseMoved) {
            _ignore = true
        }

        if (dragElement != null)
        {
            // we're done with these events until the next OnDown
            document.onmousemove = null;
            document.ontouchmove = null;
            document.onselectstart = null;
            document.onmouseup = null;
            document.ontouchend = null;
            document.ontouchcancel = null;
            dragElement.ondragstart = null;

            parentElement.removeChild(dragElement);

            // this is how we know we're not dragging      
            dragElement = null;

            if (gotoPhoto == "prev") {
                _loading = true
                parent.location = prev_photo_url;
            } else if (gotoPhoto == "next") {
                _loading = true
                parent.location = next_photo_url;
            }
        }
    }

    var OnCancel = function(e)
    {
        // IE is retarded and doesn't pass the event object
        if (e == null) e = window.event;

        if (dragElement != null)
        {
            // we're done with these events until the next OnDown
            document.onmousemove = null;
            document.ontouchmove = null;
            document.onselectstart = null;
            document.onmouseup = null;
            document.ontouchend = null;
            document.ontouchcancel = null;
            dragElement.ondragstart = null;

            parentElement.removeChild(dragElement);

            // this is how we know we're not dragging      
            dragElement = null;

            // Reset page back the way it was
            fixedElement.src = this_photo_thumb_url
            hide_details(false)
        }
    }

    if( e.targetTouches )
    {
        pageX = e.targetTouches[0].pageX;
        pageY = e.targetTouches[0].pageY;
        clientX = e.targetTouches[0].clientX;
        clientY = e.targetTouches[0].clientY;
    }
    else {
        pageX = e.pageX
        pageY = e.pageY
        clientX = e.clientX
        clientY = e.clientY
    }

    // IE uses srcElement, others use target
    var target = e.target != null ? e.target : e.srcElement;

    // for IE, left click == 1
    // for Firefox, left click == 0
    if (target.id != "photo") {
        return true;
    }

    if (_loading) {
        return true;
    }

    if (_ignore) {
        _ignore = false;
        return true;
    }

    if (e.button == 1 && window.event != null || e.button == 0 || e.type == "touchstart")
    {
//        e.preventDefault();
//        e.stopPropagation();

        // grab the mouse position
        startPageX = pageX
        startPageY = pageY
        startClientX = clientX
        startClientY = clientY

        // grab the scroll position
        scrollX = window.scrollX
        scrollY = window.scrollY

        // grab the clicked element's position
        var pos = findPos(target)
        offsetX = pos[0]
        offsetY = pos[1]

        // we need to access the element in OnMove
        fixedElement = target;

        dragElement = document.createElement('img')
        dragElement.src = fixedElement.src
        dragElement.style.width = fixedElement.offsetWidth + 'px'
        dragElement.style.position = "absolute"
        dragElement.style.left = (offsetX + pageX - startPageX) + 'px'
        dragElement.style.top = (offsetY + pageY - startPageY) + 'px'

        parentElement = target.parentElement;
        parentElement.appendChild(dragElement);

        // bring the clicked element to the front while it is being dragged
        dragElement.style.zIndex = 10000

        // tell our code to start moving the element with the mouse
        document.onmousemove = OnMove
        document.ontouchmove = OnMove
        document.onmouseup = OnUp
        document.ontouchend = OnUp
        document.ontouchcancel = OnCancel

        // cancel out any text selections
        document.body.focus()

        // prevent text selection in IE
        document.onselectstart = function () { return false; }
        // prevent IE from trying to drag an image
        target.ondragstart = function() { return false; }

        // prevent text selection (except IE)
        return false
    }
}

