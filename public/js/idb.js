//  Script tag for this: <script src="./js/idb.js"></script>


// create variable to hold db connection
let db;
// establish a connection to IndexedDB database called 'pizza_hunt' and set it to version 1
const request = indexedDB.open('pwa', 1);

// this event will emit if the database version changes (nonexistant to version 1, v1 to v2, etc.)
request.onupgradeneeded = function (event) {
    const db = event.target.result;
    db.createObjectStore('new_pwa', { autoIncrement: true });
};

// upon a successful 
request.onsuccess = function (event) {
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
    // open a new transaction with the database with read and write permissions 
    const transaction = db.transaction(['new_pwa'], 'readwrite');

    // access the object store for `new_pwa`
    const pwaObjectStore = transaction.objectStore('new_pwa');

    // add record to your store with add method
    pwaObjectStore.add(record);
}

function uploadTransaction() {
    // open a transaction on your db
    const transaction = db.transaction(['new_pwa'], 'readwrite');

    // access your object store
    const pwaObjectStore = transaction.objectStore('new_pwa');

    // get all records from store and set to a variable
    const getAll = pwaObjectStore.getAll();

    // upon a successful .getAll() execution, run this function
    getAll.onsuccess = function () {
        // if there was data in indexedDb's store, let's send it to the api server
        if (getAll.result.length > 0) {
            fetch('/api/transaction', {
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
                    // open one more transaction
                    const transaction = db.transaction(['new_pwa'], 'readwrite');
                    // access the new_pizza object store
                    const pwaObjectStore = transaction.objectStore('new_pwa');
                    // clear all items in your store
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