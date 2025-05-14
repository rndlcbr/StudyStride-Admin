// Import Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, sendPasswordResetEmail} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import {  getFirestore, collection, doc, getDocs, updateDoc, deleteDoc, getDoc, setDoc, deleteField  } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-storage.js";

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyCSBfpQwIpjUjw-PKPKT3CDF2H80ssnwSI",
    authDomain: "studystride-register-and-login.firebaseapp.com",
    projectId: "studystride-register-and-login",
    storageBucket: "studystride-register-and-login.appspot.com",
    messagingSenderId: "666017132973",
    appId: "1:666017132973:web:23f35327e825f13b42b124",
    measurementId: "G-69QJ9W87QW"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

 // Toggle Password Visibility
 const togglePassword = document.getElementById('togglePassword');
 const passwordInput = document.getElementById('password');

 togglePassword.addEventListener('click', function() {
     // Toggle the type attribute
     const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
     passwordInput.setAttribute('type', type);
     // Toggle the eye icon
     this.querySelector('i').classList.toggle('fa-eye');
     this.querySelector('i').classList.toggle('fa-eye-slash');
 });

 // Login functionality
document.getElementById("loginBtn").addEventListener("click", async () => {
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();

    // Check if the email ends with @gmail.com
    if (!email.endsWith('@gmail.com')) {
        alert("Only Gmail accounts are allowed. Please use an email ending with @gmail.com.");
        return; // Exit the function if the email is not valid
    }

    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        console.log("Login successful:", userCredential);

        // Show the admin panel
        document.getElementById("adminPanel").style.display = "block";
        // Hide the login card
        document.querySelector(".card").style.display = "none";

        // Fetch documents to display events and photos
        fetchDocuments(); 
        fetchPhotos(); 
        document.getElementById('adminPanel').style.display = 'block';
        document.body.classList.add('no-background'); // Hides the background image
    } catch (error) {
        console.error("Login error:", error);
        alert("Login failed. Please check your credentials.");
    }
});

 // Logout functionality
document.getElementById("logoutBtn").addEventListener("click", async () => {
    try {
        await auth.signOut(); // Sign out from Firebase
        alert("Logged out successfully.");
        
        // Hide the admin panel and show the login card again
        document.getElementById("adminPanel").style.display = "none";
        document.querySelector(".card").style.display = "block";
        document.body.classList.remove('no-background'); // Show the background image again
    } catch (error) {
        console.error("Logout error:", error);
        alert("Logout failed. Please try again.");
    }
});


// Initialize Flatpickr for the date input with restriction on past dates
flatpickr("#eventDate", {
    dateFormat: "d-m-Y", // Set the format to DD-MM-YYYY
    minDate: "today", // Restrict to future dates only
    onChange: function(selectedDates, dateStr, instance) {
        document.getElementById('eventDate').value = dateStr; // Update the input field with the selected date
    }
});

async function fetchDocuments() {
    try {
        const querySnapshot = await getDocs(collection(db, "eventsAdmin"));
        const tableBody = document.getElementById('tableBody');
        const eventList = document.getElementById('eventList');

        if (tableBody) {
            tableBody.innerHTML = ""; // Clear existing rows
        } else {
            console.error("Table body not found");
        }

        if (eventList) {
            eventList.innerHTML = ""; // Clear existing events in the comments section
        } else {
            console.error("Event list not found");
        }

        const events = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            events.push({
                id: doc.id,
                ...data,
            });
        });

        // Sort events by date
        events.sort((a, b) => {
            const [dayA, monthA, yearA] = a.date.split('-').map(Number);
            const [dayB, monthB, yearB] = b.date.split('-').map(Number);
            const dateA = new Date(yearA, monthA - 1, dayA);
            const dateB = new Date(yearB, monthB - 1, dayB);
            return dateA - dateB; // Ascending order
        });

        // Render sorted events in the table and event boxes
        events.forEach((event) => {
            // Table rendering
            const row = document.createElement('tr');
            const hasImage = event.backgroundImageUrl ? true : false;

            row.innerHTML = `
                <td>${event.title}</td>
                <td>${event.eventID}</td>
                <td>${event.date}</td>
                <td>${event.dateTime || "N/A"}</td>
                <td>${event.description || "No description"}</td>
                <td>
                    ${hasImage 
                        ? `<a href="${event.backgroundImageUrl}" class="bold-text" target="_blank">Click to view Uploaded Photo</a>
                        <button class="editImageBtn" data-id="${event.id}">Edit</button>
                        <button class="deleteImageBtn" data-id="${event.id}">Delete</button>` 
                        : `<button class="uploadImageBtn" data-id="${event.id}">Upload</button>`}
                </td>
                <td>
                    <button class="editBtn" data-id="${event.id}" data-title="${event.title}" data-event-id="${event.eventID}" data-date="${event.date}" data-dateTime="${event.dateTime}" data-description="${event.description}">Edit</button>
                    <button class="deleteBtn" data-id="${event.id}">Delete</button>
                </td>
            `;
            tableBody.appendChild(row);

            // Delete image button listener
            const deleteImageBtn = row.querySelector('.deleteImageBtn');
            if (deleteImageBtn) {
                deleteImageBtn.addEventListener('click', async (e) => {
                    const eventId = e.target.getAttribute('data-id');
                    const confirmDelete = confirm("Are you sure you want to delete this?");
                    if (confirmDelete) {
                        try {
                            // Deletion code...
                        } catch (error) {
                            console.error("Error deleting image: ", error);
                        }
                    }
                });
            }

            // Create event box for the event section
            const eventContainer = document.getElementById('eventContainer');
            if (eventContainer) {
                eventContainer.innerHTML += `
                    <div class="event-box" style="background-image: url('${event.backgroundImageUrl}');" data-id="${event.id}" data-title="${event.title}">
                        <h3>${event.title}</h3>
                        <p>${event.date}</p>
                    </div>
                `;
            }

            // Add event listener for the event box
            const eventBoxes = document.querySelectorAll('.event-box');
            eventBoxes.forEach(box => {
                box.addEventListener('click', async (e) => {
                    const eventId = box.getAttribute('data-id');
                    const eventTitle = box.getAttribute('data-title');
                    document.getElementById('selectedEventName').textContent = eventTitle;
                    fetchComments(eventId);
                
                    // Automatically scroll to the comments table/section
                    const commentsSection = document.getElementById('commentsTable'); // <-- Update with your actual ID
                    if (commentsSection) {
                        commentsSection.scrollIntoView({ behavior: 'smooth' });
                    }
                });
                
            });

            // Event list for comments section
            if (eventList) {
                eventList.innerHTML += `
                    <li>
                        <a href="#" class="eventLink" data-id="${event.id}" data-title="${event.title}">
                            ${event.title}
                        </a>
                    </li>
                `;
            }
        });

        document.getElementById('documentTable').style.display = 'block';

        // Add event listeners for buttons
        addEditButtonListeners();
        addImageButtonListeners();
        addCommentLinkListeners(); 
    } catch (error) {
        console.error("Error fetching documents: ", error);
    }
}



// Function to add event listeners for edit buttons
function addEditButtonListeners() {
    document.querySelectorAll('.editBtn').forEach((btn) => {
        btn.addEventListener('click', (e) => {
            const eventId = e.target.getAttribute('data-id');
            const title = e.target.getAttribute('data-title');
            const date = e.target.getAttribute('data-date');
            const dateTime = e.target.getAttribute('data-dateTime');
            const description = e.target.getAttribute('data-description');

            // Populate the input fields with the event data
            const eventTitleInput = document.getElementById('eventTitle');
            const eventDateInput = document.getElementById('eventDate');
            const eventDateTimeInput = document.getElementById('eventDateTime');
            const eventDescriptionInput = document.getElementById('eventDescription');
            const eventIDInput = document.getElementById('eventID');
            const addEventBtn = document.getElementById('addEventBtn');
            const eventCard = document.querySelector('.event-card');
            const documentTable = document.getElementById('documentTable');

            if (eventTitleInput) eventTitleInput.value = title;
            if (eventDateInput) eventDateInput.value = date;
            if (eventDateTimeInput) eventDateTimeInput.value = dateTime;
            if (eventDescriptionInput) eventDescriptionInput.value = description;
            if (eventIDInput) eventIDInput.value = eventId; // Set the event ID for updating

            // Change the button text to "Update"
            if (addEventBtn) {
                addEventBtn.innerText = 'Update Event';
                addEventBtn.setAttribute('data-id', eventId); // Set the data-id attribute
            }

            // Show the event card and hide the document table
            if (eventCard) eventCard.style.display = 'block'; // Show the event card
            if (documentTable) documentTable.style.display = 'none'; // Hide the document table

            // Scroll to the top of the page
            window.scrollTo({
                top: 0,
                behavior: 'smooth' // Smooth scroll
            });

            // Use setTimeout to ensure the focus is set after the card is displayed
            setTimeout(() => {
                if (eventTitleInput) eventTitleInput.focus(); // Focus on the title input
            }, 100); // Adjust the delay as needed
        });
    });
}

// Function to add event listeners for comment links
function addCommentLinkListeners() {
    document.querySelectorAll('.eventLink').forEach((link) => {
        link.addEventListener('click', async (e) => {
            e.preventDefault();
            const eventId = link.getAttribute('data-id');
            const eventTitle = link.getAttribute('data-title');
            document.getElementById('selectedEventName').textContent = eventTitle;
            fetchComments(eventId);
        });
    });
}

// Fetch comments for a specific event
async function fetchComments(eventId) {
    const commentsTableBody = document.getElementById('commentsTableBody');
    commentsTableBody.innerHTML = ""; // Clear existing rows

    try {
        const commentsSnapshot = await getDocs(collection(db, `eventsAdmin/${eventId}/comments`));
        console.log("Fetched comments for eventId:", eventId, commentsSnapshot.docs); // Log fetched comments

        if (commentsSnapshot.empty) {
            commentsTableBody.innerHTML = `
                <tr>
                    <td colspan="5" style="text-align:center;">No comments</td>
                </tr>
            `;
        } else {
            commentsSnapshot.forEach((doc) => {
                const data = doc.data();
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${data.commentText}</td>
                   <td>${data.fname || data.fName || "Anonymous"}</td>
                    <td>${new Date(data.timestamp).toLocaleString()}</td>
                    <td>${data.userId || "N/A"}</td>
                    <td><button class="deleteCommentBtn" data-id="${doc.id}" data-event-id="${eventId}">Delete</button></td>
                `;
                commentsTableBody.appendChild(row);
            });

            // Add event listeners to delete buttons
            addCommentDeleteListeners(eventId); // Attach listeners to delete buttons
        }
    } catch (error) {
        console.error("Error fetching comments:", error);
    }
}

// Attach event listeners to delete buttons in the comments table
function addCommentDeleteListeners(eventId) {
    const deleteButtons = document.querySelectorAll(".deleteCommentBtn");
    deleteButtons.forEach((btn) => {
        btn.addEventListener("click", async (e) => {
            const commentId = btn.getAttribute("data-id");
            if (confirm("Are you sure you want to delete this comment?")) {
                try {
                    await deleteDoc(doc(db, `eventsAdmin/${eventId}/comments`, commentId));
                    alert("Comment deleted successfully.");
                    fetchComments(eventId); // Refresh comments
                } catch (error) {
                    console.error("Error deleting comment:", error);
                }
            }
        });
    });
}

// Function to add event listeners for image buttons
function addImageButtonListeners() {
    document.querySelectorAll('.uploadImageBtn').forEach((btn) => {
        btn.addEventListener('click', (e) => uploadImage(e.target.getAttribute('data-id')));
    });

    document.querySelectorAll('.editImageBtn').forEach((btn) => {
        btn.addEventListener('click', (e) => uploadImage(e.target.getAttribute('data-id')));
    });

    document.querySelectorAll('.deleteImageBtn').forEach((btn) => {
        btn.addEventListener('click', async (e) => {
            const eventId = e.target.getAttribute('data-id');
            try {
                const eventRef = doc(db, "eventsAdmin", eventId);
                const eventDoc = await getDoc(eventRef);
                if (eventDoc.data().backgroundImageUrl) {
                    const imageRef = ref(storage, eventDoc.data().backgroundImageUrl);
                    await deleteObject(imageRef); // Delete from storage
                    await updateDoc(eventRef, { backgroundImageUrl: "" }); // Remove URL from Firestore
                }
                alert("Image deleted successfully.");
                fetchDocuments(); // Refresh table
            } catch (error) {
                console.error("Error deleting image: ", error);
                alert("Failed to delete image. Please try again.");
            }
        });
    });
}

// Function to fetch photos and render them in the photo table
async function fetchPhotos() {
    const photoTableBody = document.getElementById('photoTableBody');
    photoTableBody.innerHTML = ""; // Clear existing rows

    const querySnapshot = await getDocs(collection(db, "eventsAdmin"));
    console.log("Fetched photos:", querySnapshot.docs); // Log fetched documents

    querySnapshot.forEach((doc) => {
        const data = doc.data();
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${data.title}</td>
            <td>
                <input type="file" class="uploadBtn" data-id="${doc.id}" accept="image/*" multiple>
                ${
                    data.uploadedPhoto?.length
                        ? data.uploadedPhoto.map((url, index) => `
                            <div style="display: inline-block; position: relative; margin: 5px;">
                                <img src="${url}" alt="Photo ${index + 1}" style="height: 250px; width: auto; border: 1px solid #ccc;"/>
                                <button class="deletePhotoBtn" data-id="${doc.id}" data-url="${url}" style="position: absolute; top: 0; right: 0; background: rgba(255, 0, 0, 0.7); color: white; border: 1px solid black; border-radius: 50%; cursor: pointer; font-size: 16px; padding: 2px 5px; width: 25px; height: 25px; display: flex; align-items: center; justify-content: center;">(x)</button>
                            </div>
                        `).join("")
                        : "No photos uploaded"
                }
            </td>
        `;
        photoTableBody.appendChild(row);
    });

    // Add event listeners for upload and delete photo buttons
    document.querySelectorAll('.uploadBtn').forEach((input) => {
        input.addEventListener('change', async (e) => {
            const eventId = e.target.getAttribute('data-id');
            const files = e.target.files;
            if (files.length > 0) {
                for (const file of files) {
                    await uploadPhoto(eventId, file);
                }
                fetchPhotos(); // Refresh table
            }
        });
    });

    document.querySelectorAll('.deletePhotoBtn').forEach((btn) => {
        btn.addEventListener('click', async (e) => {
            const eventId = e.target.getAttribute('data-id');
            const url = e.target.getAttribute('data-url');
            const confirmDelete = confirm("Are you sure you want to delete this photo?");
            if (confirmDelete) {
                await deletePhoto(eventId, url);
                fetchPhotos(); // Refresh table
            }
        });
    });
}



// Function to upload a photo
async function uploadPhoto(eventId, file) {
    const storageRef = ref(storage, `eventsAdmin/${eventId}/${file.name}`);
    await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(storageRef);

    const eventRef = doc(db, "eventsAdmin", eventId);
    const eventDoc = await getDoc(eventRef);
    const uploadedPhotos = eventDoc.data().uploadedPhoto || [];
    uploadedPhotos.push(downloadURL);

    await updateDoc(eventRef, { uploadedPhoto: uploadedPhotos });
}

// Function to delete a photo
async function deletePhoto(eventId, url) {
    const storageRef = ref(storage, url);
    await deleteObject(storageRef);

    const eventRef = doc(db, "eventsAdmin", eventId);
    const eventDoc = await getDoc(eventRef);
    const uploadedPhotos = eventDoc.data().uploadedPhoto || [];
    const updatedPhotos = uploadedPhotos.filter((photo) => photo !== url);

    await updateDoc(eventRef, { uploadedPhoto: updatedPhotos });
}

// Function to upload an image
async function uploadImage(eventId) {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.click();

    fileInput.onchange = async () => {
        const file = fileInput.files[0];
        if (file) {
            try {
                const storageRef = ref(storage, `eventsAdmin/${eventId}/${file.name}`);
                await uploadBytes(storageRef, file);
                const downloadURL = await getDownloadURL(storageRef);
                await updateDoc(doc(db, "eventsAdmin", eventId), { backgroundImageUrl: downloadURL });
                alert("Image uploaded successfully.");
                fetchDocuments(); // Refresh table
            } catch (error) {
                console.error("Error uploading image: ", error);
                alert("Failed to upload image. Please try again.");
            }
        }
    };
}

// Add this event listener to automatically set eventID to the title
const eventTitleInput = document.getElementById('eventTitle');
const eventIDInput = document.getElementById('eventID');

if (eventTitleInput && eventIDInput) {
    eventTitleInput.addEventListener('input', function() {
        const title = this.value.trim();
        eventIDInput.value = title; // Automatically set eventID to title
    });
} else {
    if (!eventTitleInput) {
        console.error('Element with ID eventTitle not found');
    }
    if (!eventIDInput) {
        console.error('Element with ID eventID not found');
    }
}
// Modify the Add or Update Event Functionality
document.getElementById('addEventBtn').addEventListener('click', async () => {
    const eventTitle = document.getElementById('eventTitle').value;
    const eventDate = document.getElementById('eventDate').value;
    const eventDateTime = document.getElementById('eventDateTime').value;
    const eventDescription = document.getElementById('eventDescription').value;
    const eventID = eventTitle.trim(); // Use title as eventID

    if (!eventTitle || !eventDate || !eventDateTime || !eventDescription) {
        alert("All fields are required!");
        return;
    }

    try {
        const docRef = doc(db, "eventsAdmin", eventID);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            // Update existing document
            await updateDoc(docRef, {
                title: eventTitle,
                date: eventDate,
                dateTime: eventDateTime,
                description: eventDescription,
            });
            alert("Event updated successfully.");
        } else {
            // Add new document
            await setDoc(docRef, {
                eventID: eventID,
                title: eventTitle,
                date: eventDate,
                dateTime: eventDateTime,
                description: eventDescription,
            });
            alert("Event added successfully.");
        }

        // Reset fields
        document.getElementById('eventTitle').value = '';
        document.getElementById('eventDate').value = '';
        document.getElementById('eventDateTime').value = '';
        document.getElementById('eventDescription').value = '';
        document.getElementById('addEventBtn').innerText = 'Add Event';
        document.getElementById('addEventBtn').removeAttribute('data-id');

        fetchDocuments(); // Refresh table
    } catch (error) {
        console.error("Error adding/updating event: ", error);
        alert("Failed to add/update event. Please try again.");
    }
});

// Delete Event Functionality
document.getElementById('tableBody').addEventListener('click', async (event) => {
    if (event.target.classList.contains('deleteBtn')) {
        const docId = event.target.getAttribute('data-id');
        const confirmDelete = confirm("Are you sure you want to delete this event?");

        if (confirmDelete) {
            try {
                // Delete the associated image from storage (if exists)
                const eventRef = doc(db, "eventsAdmin", docId);
                const eventDoc = await getDoc(eventRef);
                const imageUrl = eventDoc.data().backgroundImageUrl;
                
                if (imageUrl) {
                    const imageRef = ref(storage, imageUrl);
                    await deleteObject(imageRef); // Delete image from storage
                }

                // Delete the event document
                await deleteDoc(eventRef);
                alert("Event deleted successfully.");
                fetchDocuments(); // Refresh table
            } catch (error) {
                console.error("Error deleting event: ", error);
                alert("Failed to delete event. Please try again.");
            }
        }
    }
});


// Function to fetch important event photos
async function fetchImportantPhotos() {
    const importantPhotosTableBody = document.getElementById('importantPhotosTableBody');
    importantPhotosTableBody.innerHTML = ""; // Clear existing rows

    try {
        const docRef = doc(db, "FILES", "image");
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const data = docSnap.data();
            const images = Object.keys(data) // Get all keys in the document
                .filter(key => key.startsWith('image')) // Filter keys that start with 'image'
                .map(key => data[key]); // Map to their corresponding URLs

            images.forEach((imageUrl, index) => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td style="text-align: center;">${imageUrl ? `<img src="${imageUrl}" alt="Image ${index + 1}" style="width: 500px; height: auto; object-fit: contain;">` : "No photo uploaded"}</td>
                    <td>
                        <button class="${imageUrl ? 'editImportantPhotoBtn' : 'uploadImportantPhotoBtn'}" data-index="${index}">${imageUrl ? 'Edit' : 'Upload'}</button>
                        ${imageUrl ? `<button class="deleteImportantPhotoBtn" data-index="${index}">Delete</button>` : ''}
                    </td>
                `;
                importantPhotosTableBody.appendChild(row);
            });

            addImportantPhotoButtonListeners();
        } else {
            console.log("No such document!");
        }
    } catch (error) {
        console.error("Error fetching important photos: ", error);
    }
}

// Function to handle the upload button click
document.getElementById('uploadPhotoBtn').addEventListener('click', () => {
    // Create a file input element
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.click();

    fileInput.onchange = async () => {
        const file = fileInput.files[0];
        console.log(`File selected: ${file ? file.name : 'No file selected'}`);
        if (file) {
            const user = auth.currentUser ;
            if (!user) {
                alert("You must be logged in to upload files.");
                return;
            }

            try {
                // Create a reference to the storage location for the image
                const storageRef = ref(storage, `importantEvents/image${Date.now()}`); // Use a unique name

                // Upload the new file
                await uploadBytes(storageRef, file);
                const downloadURL = await getDownloadURL(storageRef);

                // Update the Firestore document with the new image URL
                const docRef = doc(db, "FILES", "image");
                await updateDoc(docRef, { [`image${Date.now()}`]: downloadURL }); // Use a unique key

                alert("Image uploaded successfully.");
                fetchImportantPhotos(); // Refresh table
            } catch (error) {
                console.error("Error uploading important photo: ", error.message);
                alert("Failed to upload image. Please try again.");
            }
        } else {
            alert("No file selected. Please choose a file to upload.");
        }
    };
});



// Function to add event listeners for important photo buttons
function addImportantPhotoButtonListeners() {
    document.querySelectorAll('.uploadImportantPhotoBtn, .editImportantPhotoBtn').forEach((btn) => {
        btn.addEventListener('click', (e) => uploadImportantPhoto(e.target.getAttribute('data-index')));
    });

    document.querySelectorAll('.deleteImportantPhotoBtn').forEach((btn) => {
        btn.addEventListener('click', (e) => deleteImportantPhoto(e.target.getAttribute('data-index')));
    });
}

async function uploadImportantPhoto(index) {
    console.log(`Attempting to upload photo for index: ${index}`);
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.click();

    fileInput.onchange = async () => {
        const file = fileInput.files[0];
        console.log(`File selected: ${file ? file.name : 'No file selected'}`);
        if (file) {
            const user = auth.currentUser ;
            if (!user) {
                alert("You must be logged in to upload files.");
                return;
            }

            try {
                // Create a reference to the storage location for the image
                const storageRef = ref(storage, `importantEvents/image${index + 1}`);
                
                // Upload the new file, this will overwrite the existing file at the same path
                await uploadBytes(storageRef, file);
                const downloadURL = await getDownloadURL(storageRef);

                // Update the Firestore document with the new image URL
                const docRef = doc(db, "FILES", "image");
                await updateDoc(docRef, { [`image${index + 1}`]: downloadURL });

                alert("Image uploaded successfully.");
                fetchImportantPhotos(); // Refresh table
            } catch (error) {
                console.error("Error uploading important photo: ", error.message);
                alert("Failed to upload image. Please try again.");
            }
        } else {
            alert("No file selected. Please choose a file to upload.");
        }
    };
}




async function deleteImportantPhoto(index) {
    const confirmDelete = confirm("Are you sure you want to delete this photo?");
    if (confirmDelete) {
        try {
            const docRef = doc(db, "FILES", "image");
            const docSnap = await getDoc(docRef);

            // Log the document data to see its structure
            console.log("Document data:", docSnap.data());

            // Check if the document exists
            if (!docSnap.exists()) {
                alert("Document does not exist.");
                return;
            }

            const imageUrl = docSnap.data()[`image${index + 1}`];

            if (imageUrl) {
                // Remove the image from Firebase Storage
                const storageRef = ref(storage, `importantEvents/image${index + 1}`);
                await deleteObject(storageRef);
                console.log(`Successfully deleted storage object: ${storageRef}`);

                // Clear the field in Firestore
                await updateDoc(docRef, { [`image${index + 1}`]: deleteField() });
                console.log(`Successfully cleared Firestore value for image${index + 1}`);

                alert("Image deleted successfully.");
                fetchImportantPhotos(); // Refresh table
            } else {
                alert("Image does not exist.");
            }
        } catch (error) {
            console.error("Error deleting important photo: ", error);
            alert("Failed to delete image. Please try again.");
        }
    }
}




// Call fetchImportantPhotos when the section is loaded
document.querySelector('[data-section="important-events-photos"]').addEventListener('click', fetchImportantPhotos);



async function fetchUsers() {
    console.log('Fetching users...');
    const usersTableBody = document.getElementById('usersTableBody');
    usersTableBody.innerHTML = ""; // Clear existing rows

    try {
        const response = await fetch('http://localhost:3000/api/users');
        const users = await response.json();
        console.log('Users fetched:', users);

        // Store users in a global variable for searching
        window.allUsers = users;

        // Display all users initially
        displayUsers(users);
    } catch (error) {
        console.error("Error fetching users:", error);
    }
}

document.getElementById('searchButton').addEventListener('click', performSearch);

document.getElementById('searchInput').addEventListener('keydown', function(event) {
    if (event.key === 'Enter') {
        performSearch(); // Trigger search on Enter key press
    }
});

function performSearch() {
    const searchInput = document.getElementById('searchInput').value.toLowerCase();
    const filteredUsers = window.allUsers.filter(user => user.email.toLowerCase().includes(searchInput));
    displayUsers(filteredUsers);
}

function displayUsers(users) {
    const usersTableBody = document.getElementById('usersTableBody');
    usersTableBody.innerHTML = ""; // Clear existing rows

    if (users.length === 0) {
        // If no users found, display a message
        const row = document.createElement('tr');
        row.innerHTML = `<td colspan="2" style="text-align: center;">No users found.</td>`;
        usersTableBody.appendChild(row);
    } else {
        users.forEach((user) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${user.email}</td>
                <td>
                    <button class="resetPasswordBtn" data-email="${user.email}">Reset Password</button>
                    <button class="deleteUserBtn" data-uid="${user.uid}">Delete Account</button>
                </td>
            `;
            usersTableBody.appendChild(row);
        });
    }

    // Add event listeners for reset password and delete account buttons
    attachEventListeners();
}



document.getElementById('searchButton').addEventListener('click', () => {
    const searchInput = document.getElementById('searchInput').value.toLowerCase();
    const filteredUsers = window.allUsers.filter(user => user.email.toLowerCase().includes(searchInput));
    displayUsers(filteredUsers);
});

// Attach event listeners for reset password and delete account buttons
function attachEventListeners() {
    // Reset Password buttons
    document.querySelectorAll('.resetPasswordBtn').forEach((btn) => {
        btn.removeEventListener('click', resetPasswordHandler); // Remove existing listener
        btn.addEventListener('click', resetPasswordHandler);
    });

    // Delete User buttons
    document.querySelectorAll('.deleteUser Btn').forEach((btn) => {
        btn.removeEventListener('click', deleteUserHandler); // Remove existing listener
        btn.addEventListener('click', deleteUserHandler);
    });
}




async function resetPasswordHandler(e) {
    const email = e.target.getAttribute('data-email');
    const confirmReset = confirm("Are you sure you want to reset the user's password?");
    
    if (confirmReset) {
        try {
            await sendPasswordResetEmail(auth, email);
            alert(`Password reset email sent to ${email}.`);
        } catch (error) {
            console.error("Error sending password reset email:", error);
        }
    } else {
        console.log("Password reset canceled.");
    }
}

async function deleteUserHandler(e) {
    const uid = e.target.getAttribute('data-uid');
    const confirmDelete = confirm("Are you sure you want to delete this account?");
    
    if (confirmDelete) {
        try {
            // Make a DELETE request to your server to delete the user
            await fetch(`http://localhost:3000/api/deleteUser /${uid}`, { method: 'DELETE' });
            alert("User  account deleted successfully.");
            fetchUsers(); // Refresh users list
        } catch (error) {
            console.error("Error deleting user:", error);
        }
    } else {
        console.log("User  deletion canceled.");
    }
}

// Section Navigation
document.querySelectorAll('.drawer a').forEach((link) => {
    link.addEventListener('click', async (event) => {
        const targetSection = event.target.getAttribute('data-section');

        document.querySelectorAll('.section').forEach((section) => {
            section.classList.remove('active');
        });

        const selectedSection = document.getElementById(targetSection);
        selectedSection.classList.add('active');

        if (targetSection === 'events') {
            fetchDocuments();
        } else if (targetSection === 'photos') {
            fetchPhotos();
        } else if (targetSection === 'comments') {
            const defaultEventId = 'someDefaultEventId'; // Replace with actual default event ID
            fetchComments(defaultEventId);
        } else if (targetSection === 'users') {
            fetchUsers();
        }

        // Close the drawer after clicking a link
        drawer.classList.remove('open');
        mainContent.classList.remove('shifted');
    });


document.addEventListener('DOMContentLoaded', () => {
    // Show the default section (Events)
    document.getElementById('events').classList.add('active');

    const hamburger = document.getElementById('hamburger');
    const drawer = document.getElementById('drawer');
    const mainContent = document.getElementById('mainContent');

    hamburger.addEventListener('click', () => {
        drawer.classList.toggle('open');
        mainContent.classList.toggle('shifted');
    });

    // Close the drawer when the mouse leaves the drawer area
    drawer.addEventListener('mouseleave', () => {
        drawer.classList.remove('open');
        mainContent.classList.remove('shifted');
    });

    // Keep the drawer open when the mouse enters the drawer area
    drawer.addEventListener('mouseenter', () => {
        drawer.classList.add('open');
        mainContent.classList.add('shifted');
    });

    
});
});
