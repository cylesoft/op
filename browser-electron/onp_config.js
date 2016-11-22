const ipcRenderer = require('electron').ipcRenderer;
const onp_config_input = document.getElementById('onp-server-list');
const ip_regex = /^\d+\.\d+\.\d+\.\d+$/i;

function getCurrentWinsConfig() {
    let current_list_raw = onp_config_input.value;
    current_list_raw = current_list_raw.replace('\r\n', '\n');
    current_list_raw = current_list_raw.replace('\r', '\n');
    let current_list = current_list_raw.split('\n');

    let final_list = [];
    for (var i in current_list) {
        let current_item = current_list[i].trim().replace(',', '');
        if (current_item === '') {
            continue;
        }
        if (!ip_regex.test(current_item)) {
            continue;
        }
        final_list.push(current_item);
    }

    return final_list;
}

ipcRenderer.on('get-onp-list', (event, arg) => {
    console.log('being asked for the list of onp servers to use');
    event.sender.send('update-onp-list', getCurrentWinsConfig());
});
