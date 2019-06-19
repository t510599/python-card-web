var socket; // create object

function init(host="wss://api.stoneapp.tech/ElegyOfDisaster"){
    socket = new WebSocket(host);
    console.log("Initializing connection...");

    socket.onopen = function() {
        wsOnOpen(this.readyState);
    }

    socket.onclose = function() {
        wsOnClose();
    }

    socket.onmessage = function(msg) {
        var dataJson;
        try {
            dataJson = JSON.parse(msg.data);
        } catch(except) {
            console.log(msg.data);
            return null;
        }
        wsHandler(dataJson);
    }

    socket.onerror = function(except) {
        wsOnError(except);
    }
}

function quit() {
    if(socket != null){
        socket.close();
        socket = null;
    }
}

function send(msg) {
    try { 
        socket.send(msg);
	} catch(ex) { 
		console.log(ex); 
	}
}