document.addEventListener("DOMContentLoaded", function () {
    const pollId = getPollIdFromUrl();
    if (pollId) {
        loadPoll(pollId);
        setupWebSocket(pollId);
    } else {
        renderCreatePollForm();
    }
});

function getPollIdFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('poll');
}
