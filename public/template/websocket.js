function setupWebSocket(pollId) {
    const ws = new WebSocket(`ws://https://pollshare-1gww.onrender.com/ws/polls/${pollId}`);
    
    ws.onopen = () => console.log('WebSocket connection established');
    
    ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'voteUpdated') {
            renderPoll(data.poll);
        }
    };
    
    ws.onerror = (error) => console.error('WebSocket error:', error);
    
    ws.onclose = () => console.log('WebSocket connection closed');
}
