// notification.js - real time notifications with WebSockets

//Connects to the supplied server at ws://localhost:300
// Server to client: { type: "info" | "alert" | "training", text, department, time }
// Client to server: { type: "subscribe", department: "Finance" }

// EVerything is inside a function so nothing here becomes a global
(function () {
    // The address of the supplied WebSocket server.
    const SERVER_URL = "ws:localhost:3000";

    // Only the newest notifictions are kept on the page
    const MAX_NOTIFICATIONS = 30;

    // The parts of the notifications are kept on the page
    const statusElement = document.getElementById("notification-status");
    const departmentSelect = document.getElementById("department-subscribe");
    const disconnectButton = document.getElementById("disconnect-button");
    const reconnectButton = document.getElementById("reconnect-button");
    const notificationList = document.getElementById("notification-list");

    // Stop quietly if this page does not have the panel
    if (!statusElement || !departmentSelect || !disconnectButton || !reconnectButton || !notificationList) {
        return;
    }

    // The current connection (null until the first connect)
    let socket = null;

    // True when the user pressed Disconnect, so onclose can tell why it closed
    let userDisconnected = false;

    // Showing things on the page

    // Updates the status badge. The CSS class decides the colour
    function setStatus(text, stateClass) {
        statusElement.textContent = text;
        statusElement.className = "notification-status " + stateClass;
    }

    // Disconnect works while connecting or connected. Reconnect works only when closed
    function updateButtons(isActive) {
        disconnectButton.disabled = !isActive;
        reconnectButton.disabled = isActive;
    }

    // Adds one notification to the top of list. textContent is used, so a message from the server can never
    // add HTML to the page
    function showNotification(cssClass, label, text, department, time) {
        const item = document.createElement("li");
        item.className = "notification " + cssClass;

        const header = document.createElement("div");
        header.className = "notification-header";

        // The label shows the type in words, so it is not shown by colour alone
        const typeTag = document.createElement("span");
        typeTag.className = "notification-type";
        typeTag.textContent = label;
        
        const timeTag = document.createElement("span");
        timeTag.className = "notification-time";
        const when = time ? new Date(time) : new Date();
        timeTag.textContent = (isNaN(when.getTime()) ? new Date() : when).toLocaleTimeString();

        header.appendChild(typeTag);
        header.appendChild(timeTag);
        item.appendChild(header);

        const body = document.createElement("p");
        body.className = "notification-text";
        body.textContent = text;
        item.appendChild(body);

        // The department name is shown on every notification
        if (department) {
            const meta = document.createElement("p");
            meta.className = "notification-meta";
            meta.textContent = "Department: " + department;
            item.appendChild(meta);
        }

        notificationList.prepend(item); // newest first

        // Remove the oldest ones when there are too many.
        while (notificationList.children.length > MAX_NOTIFICATIONS) {
            notificationList.lastElementChild.remove();
        }
    }

    // A message from this page itself (not from the server)
    function showSystemMessage(text) {
        showNotification("notification-system", "System", text, "", null);
    }

    // Decide how each type of message looks
    function handleMessage(message) {
        let cssClass;
        let label;

        // A switch picks the style that goes with the message type
        switch (message.type) {
            case "info":
                cssClass = "notification-info";
                label = "Info";
                break;
            case "alert":
                cssClass = "notification-alert";
                label = "Alert";
                break;
            case "training":
                cssClass = "notification-training";
                label = "Training";
                break;
            default:
                // A type we do not know: still show it, in the nuetral style
                cssClass = "notification-system";
                label = "Message";
        }

        showNotification(cssClass, label, message.text, message.department, message.time);
    }

    // tell the server which department to send
    function sendSubscription(department) {
        // JSON.stringify turns the object into text, which is what send() needs
        socket.send(JSON.stringify({ type: "subscribe", department: department }));
    }

    // The connection and its four events
    function connect() {
        userDisconnected = false;
        setStatus("Connecting...", "is-connecting");
        updateButtons(true);

        // Create the connection
        socket = new WebSocket(SERVER_URL);

        // onopen runs when the connection is ready
        socket.onopen = function () {
            setStatus("Connected", "is-connected"); // green badge

            // After a Reconnect, ask for the department that is stilled selected
            if (departmentSelect.value !== "All") {
                sendSubscription(departmentSelect.value);
            }
        };

        // onmessage runs every time the server sends something
        socket.onmessage = function (event) {
            let message;

            try {
                message = JSON.parse(event.data); // text to JavaScript
            } catch (error) {
                showSystemMessage("A message arrived that could not be read.");
                return;
            }
            handleMessage(message);
        };

        // onerror runs when something goes wrong with the connection
        socket.onerror = function () {
            showSystemMessage(
                "Connection problem: the notification server could not be reached. " + "Check that the server is running."
            );
        };

        // onclose runs when the connection ends, for any reason
        socket.onclose = function (event) {
            setStatus("Disconnected", "is-disconnected"); //red badge
            updateButtons(false);

            if (userDisconnected) {
                showSystemMessage("You disconnected from live notifications. Select Reconnect to start again.");
            } else {
                showSystemMessage(
                    "The connection to the notification server was closed (code " + event.code + "). " +
                    "Select Reconnect to try again."
                );
            }
        };
    }

    // Page events

    // choosing a department sends a subscribe message
    departmentSelect.addEventListener("change", function () {
        if (socket && socket.readyState === WebSocket.OPEN) {
            sendSubscription(departmentSelect.value);
        } else {
            showSystemMessage(
                "You are not connected. " + departmentSelect.value +
                " will be used when you reconnect."
            );
        }
    });

    // The Disconnect button closes the connection
    disconnectButton.addEventListener("click", function () {
        // readyState 0 = connecting, 1 = open. Anything higher is already closing or closed.
        if (socket && socket.readyState <= WebSocket.OPEN) {
            userDisconnected = true;
            socket.close(1000, "The user chose to disconnect"); // 1000 means a normal close
        }
    });

    // Start a new connection after the old one has closed.
    reconnectButton.addEventListener("click", connect);

    // Connect as soon as the page loads
    connect();
})();