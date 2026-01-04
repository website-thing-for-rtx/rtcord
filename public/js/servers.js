const ul = document.querySelector(".server-list");
const servers = document.querySelector(".servers");

function makeServerElement(server) {
    const li = document.createElement("li");
    const div = document.createElement("div");
    const image = document.createElement("img");
    const name = document.createElement("span");
    const a = document.createElement("a");

    div.appendChild(image);
    //div.appendChild(name);

    image.alt = 'i too lazy rn';
    name.innerHTML = server[0].name;
    a.href = '/chat/' + server[0].id + '/1'
    a.appendChild(name);
    div.appendChild(a);

    li.appendChild(div);
    return li;
}

fetch('/api/users/servers')
.then(x => x.text())
.then(data => {
    console.log(data);
    if (data !== 'Not logged in') {
        
    } else {
        servers.innerHTML = "";
        return;
    }
    data = JSON.parse(data);
    data.forEach(server => {
        ul.appendChild(makeServerElement(server));
        console.log(server);
    });

    console.log(data);
})
.catch(err => console.error(err))