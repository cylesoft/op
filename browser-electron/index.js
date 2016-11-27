const electron = require('electron');
const ipcRenderer = electron.ipcRenderer;

const verb_input = document.getElementById('otp-verb');
const address_input = document.getElementById('address-bar');
const content_area = document.getElementById('page-content');

// address_input.value = remote.getGlobal('current_url');

address_input.addEventListener('keyup', browse_keyup);
verb_input.addEventListener('keyup', browse_keyup);

function browse_keyup(event) {
    if (event.keyCode == 13) { // ENTER key
        browse();
    }
}

function browse() {
    var url = address_input.value.trim();
    var verb = verb_input.value.trim();
    if (url === '' || verb === '') {
        return;
    }
    ipcRenderer.send('browse', {
        verb: verb,
        url: url,
    });
}

function show(what) {
    // console.log('showing: ');
    // console.log(what);
    content_area.innerHTML = what;
}

ipcRenderer.on('show', (event, what) => {
    show(what);
});
