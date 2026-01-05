function renameServer(serverId, newName) {
    fetch("/api/servers/rename", {
        method: "POST",
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ serverName: newName, serverId: serverId })
    })
    .then(x => {
        if (x.status == 500) {
            alert('no worked');
        }
    })
    .catch(err => console.error(err))
}

function renameServerButton() {
    let serverId = prompt('ServerId');
    let serverName = prompt('New Name')
    let isConfirm = confirm('are u sure?');

    if (isConfirm) {
        renameServer(serverId, serverName);
    }
}