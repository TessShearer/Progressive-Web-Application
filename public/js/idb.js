//  Script tag for this: <script src="./js/idb.js"></script>


let db;
const request = indexedDB.open('pwa', 1);

request.onupgradeneeded = (event) => {
    const db = event.target.result;
    db.createObjectStore('new_pwa', { autoIncrement: true });
};

// upon a successful 
request.onsuccess = (event) => {
    db = event.target.result;
    if (navigator.onLine) {
        uploadTransaction();
    }
};

request.onerror = function (event) {
    console.log(event.target.errorCode);
};

//function for submitting with no connection
function saveRecord(record) {
    const transaction = db.transaction(['new_pwa'], 'readwrite');
    const pwaObjectStore = transaction.objectStore('new_pwa');
    pwaObjectStore.add(record);
};

function uploadTransaction() {
    const transaction = db.transaction(['new_pwa'], 'readwrite');

    const pwaObjectStore = transaction.objectStore('new_pwa');

    const getAll = pwaObjectStore.getAll();

    getAll.onsuccess = function () {
        // if there was data in indexedDb's store, send to the api server
        if (getAll.result.length > 0) {
            fetch('/api/transaction/bulk', {
                method: 'POST',
                body: JSON.stringify(getAll.result),
                headers: {
                    Accept: 'application/json, text/plain, */*',
                    'Content-Type': 'application/json'
                }
            })
                .then(response => response.json())
                .then(serverResponse => {
                    if (serverResponse.message) {
                        throw new Error(serverResponse);
                    }
                    const transaction = db.transaction(['new_pwa'], 'readwrite');
                    const pwaObjectStore = transaction.objectStore('new_pwa');
                    pwaObjectStore.clear();

                    alert('All saved transactions have been submitted');
                })
                .catch(err => {
                    console.log(err);
                });
        }
    };
};

window.addEventListener('online', uploadTransaction);