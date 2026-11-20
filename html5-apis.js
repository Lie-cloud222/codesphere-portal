
// Loaded on register.html, training.html and departments.html.
// Each feature only starts if its elements exist on the current page.
// Drag-and-drop is in employees.js because it works with the cards.
//
// Everything is wrapped in a function so nothing here can clash with
// the variable names used in other scripts.
(function () {

    // Shows a message in a paragraph. Errors get an extra class so they
    // can be styled red.
    function showMessage(element, text, isError) {
        element.textContent = text;
        element.className = isError ? "feedback feedback-error" : "feedback";
    }

    // Feature 1: file access - employee photo preview 
    const photoInput = document.getElementById("photo");
    const photoPreview = document.getElementById("photo-preview");
    const photoMessage = document.getElementById("photo-message");

    // Only these file types are accepted, and only up to 2 MB.
    const ALLOWED_PHOTO_TYPES = ["image/jpeg", "image/png"];
    const MAX_PHOTO_SIZE = 2 * 1024 * 1024; // 2 MB written in bytes

    function clearPhotoPreview() {
        photoPreview.removeAttribute("src");
        photoPreview.hidden = true;
    }

    if (photoInput && photoPreview && photoMessage) {
        photoInput.addEventListener("change", function () {
            clearPhotoPreview();
            photoMessage.textContent = "";

            // files[0] is the file the user chose (undefined if they cancelled).
            const file = photoInput.files[0];
            if (!file) {
                return;
            }

            // check the file TYPE before showing anything.
            if (!ALLOWED_PHOTO_TYPES.includes(file.type)) {
                showMessage(photoMessage,
                    "Invalid file type (" + (file.type || "unknown") + "). Please choose a JPG or PNG image.", true);
                photoInput.value = ""; // forget the rejected file
                return;
            }

            // check the file SIZE (file.size is in bytes).
            if (file.size > MAX_PHOTO_SIZE) {
                const sizeInMb = (file.size / (1024 * 1024)).toFixed(1);
                showMessage(photoMessage,
                    "That photo is " + sizeInMb + " MB. The maximum size is 2 MB.", true);
                photoInput.value = "";
                return;
            }

            // FileReader reads the file in the browser, then we show it.
            const reader = new FileReader();

            reader.addEventListener("load", function () {
                photoPreview.src = reader.result; // a data: URL holding the image
                photoPreview.hidden = false;
                showMessage(photoMessage, "Photo ready: " + file.name, false);
            });

            reader.addEventListener("error", function () {
                showMessage(photoMessage, "The photo could not be read. Please try another file.", true);
            });

            reader.readAsDataURL(file);
        });

        // When the registration form is reset after a successful submit, clear the preview too.
        if (photoInput.form) {
            photoInput.form.addEventListener("reset", function () {
                clearPhotoPreview();
                photoMessage.textContent = "";
            });
        }
    }

    // Feature 2: multimedia - video with Play and Pause buttons 
    const trainingVideo = document.getElementById("training-video");
    const playButton = document.getElementById("play-button");
    const pauseButton = document.getElementById("pause-button");
    const videoMessage = document.getElementById("video-message");

    if (trainingVideo && playButton && pauseButton && videoMessage) {
        // the Play button calls the video's play() method.
        playButton.addEventListener("click", function () {
            // play() returns a promise, which is rejected if the browser blocks playback.
            const playPromise = trainingVideo.play();

            if (playPromise !== undefined) {
                playPromise.catch(function (error) {
                    showMessage(videoMessage, "The video could not be played: " + error.message, true);
                });
            }
        });

        // the Pause button calls pause().
        pauseButton.addEventListener("click", function () {
            trainingVideo.pause();
        });

        // Keep the message in step with the video, whichever control was used.
        trainingVideo.addEventListener("play", function () {
            showMessage(videoMessage, "Video playing.", false);
        });
        trainingVideo.addEventListener("pause", function () {
            showMessage(videoMessage, "Video paused.", false);
        });
        trainingVideo.addEventListener("ended", function () {
            showMessage(videoMessage, "Video finished.", false);
        });

        // If the LAST <source> fails, none of the files worked.
        const videoSources = trainingVideo.querySelectorAll("source");
        if (videoSources.length > 0) {
            videoSources[videoSources.length - 1].addEventListener("error", function () {
                showMessage(videoMessage,
                    "The video could not be loaded. Check the file name and format.", true);
            });
        }
    }

    // Feature 3: geolocation 
    const locationButton = document.getElementById("location-button");
    const locationResult = document.getElementById("location-result");

    // Runs if the browser found the position (10.9: show latitude and longitude).
    function onLocationFound(position) {
        const latitude = position.coords.latitude.toFixed(5);
        const longitude = position.coords.longitude.toFixed(5);
        const accuracy = Math.round(position.coords.accuracy);

        showMessage(locationResult,
            "Latitude: " + latitude + ", Longitude: " + longitude +
            " (accurate to about " + accuracy + " m)", false);
    }

    // runs if something went wrong. error.code says what.
    function onLocationError(error) {
        let text;

        switch (error.code) {
            case error.PERMISSION_DENIED:
                text = "Location permission was denied. Allow location access for this site in your browser settings, then try again.";
                break;
            case error.POSITION_UNAVAILABLE:
                text = "Your location could not be determined. Check your connection or GPS and try again.";
                break;
            case error.TIMEOUT:
                text = "Finding your location took too long. Please try again.";
                break;
            default:
                text = "Something went wrong while finding your location.";
        }

        showMessage(locationResult, text, true);
    }

    if (locationButton && locationResult) {
        // getCurrentPosition is called from a button click.
        locationButton.addEventListener("click", function () {
            // feature detection. Is geolocation available at all?
            if (!navigator.geolocation) {
                showMessage(locationResult, "Geolocation is not available in this browser.", true);
                return;
            }

            // Geolocation only works on https or http://localhost.
            if (window.isSecureContext === false) {
                showMessage(locationResult, "Geolocation only works on https or http://localhost.", true);
                return;
            }

            showMessage(locationResult, "Finding your location...", false);

            navigator.geolocation.getCurrentPosition(onLocationFound, onLocationError, {
                enableHighAccuracy: false,
                timeout: 10000,   // give up after 10 seconds
                maximumAge: 60000 // an answer up to a minute old is fine
            });
        });
    }

})();