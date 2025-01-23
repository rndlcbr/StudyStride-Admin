// Import Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import { getFirestore, collection, doc, getDocs, updateDoc, deleteDoc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";
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


// Initialize Flatpickr for the date input
flatpickr("#eventDate", {
    dateFormat: "d-m-Y", // Set the format to DD-MM-YYYY
    onChange: function(selectedDates, dateStr, instance) {
        document.getElementById('eventDate').value = dateStr; // Update the input field with the selected date
    }
});

async function fetchDocuments() {
    try {
        const querySnapshot = await getDocs(collection(db, "eventsAdmin"));
        const tableBody = document.getElementById('tableBody');
        const eventList = document.getElementById('eventList'); // List for hyperlinks in the comments section

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

        // Sort events by date (DD-MM-YYYY format)
        events.sort((a, b) => {
            const [dayA, monthA, yearA] = a.date.split('-').map(Number);
            const [dayB, monthB, yearB] = b.date.split('-').map(Number);
            const dateA = new Date(yearA, monthA - 1, dayA);
            const dateB = new Date(yearB, monthB - 1, dayB);
            return dateA - dateB; // Ascending order
        });

        // Render sorted events in the table
        events.forEach((event) => {
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
                        ? `<a href="${event.backgroundImageUrl}" target="_blank">View</a>
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

            // Also add the event link to the comments section
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

        // Display the events table
        document.getElementById('documentTable').style.display = 'block';

        // Add event listeners dynamically
        addEditButtonListeners(); // For edit functionality in the table
        addImageButtonListeners(); // For image upload/delete functionality
        addCommentLinkListeners(); // For linking to the comments section
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
            document.getElementById('eventTitle').value = title;
            document.getElementById('eventDate').value = date;
            document.getElementById('eventDateTime').value = dateTime;
            document.getElementById('eventDescription').value = description;
            document.getElementById('eventID').value = eventId; // Set the event ID for updating

            // Change the button text to "Update"
            document.getElementById('addEventBtn').innerText = 'Update Event';
            document.getElementById('addEventBtn').setAttribute('data-id', eventId); // Set the data-id attribute
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
                    <td>${data.fName || "Anonymous"}</td>
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
                            <a href="${url}" target="_blank" class="photoLink">Photo ${index + 1}</a>
                            <button class="deletePhotoBtn" data-id="${doc.id}" data-url="${url}">(x)</button>
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

// Add or Update Event Functionality
document.getElementById('addEventBtn').addEventListener('click', async () => {
    const eventTitle = document.getElementById('eventTitle').value;
    const eventDate = document.getElementById('eventDate').value;
    const eventDateTime = document.getElementById('eventDateTime').value;
    const eventDescription = document.getElementById('eventDescription').value;
    const eventID = document.getElementById('eventID').value;
    const docId = document.getElementById('addEventBtn').getAttribute('data-id');

    if (!eventTitle || !eventDate || !eventDateTime || !eventDescription || !eventID) {
        alert("All fields are required!");
        return;
    }

    try {
        if (docId) {
            // Update existing document
            const docRef = doc(db, "eventsAdmin", docId);
            await updateDoc(docRef, {
                eventID: eventID,
                title: eventTitle,
                date: eventDate,
                dateTime: eventDateTime,
                description: eventDescription,
            });
            alert("Event updated successfully.");
        } else {
            // Add new document
            const newDocRef = doc(db, "eventsAdmin", eventID);
            await setDoc(newDocRef, {
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
        document.getElementById('eventID').value = '';
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


// Section Navigation
document.querySelectorAll('.drawer a').forEach((link) => {
    link.addEventListener('click', (event) => {
        const targetSection = event.target.getAttribute('data-section');
        document.querySelectorAll('.section').forEach((section) => {
            section.classList.remove('active');
        });
        document.getElementById(targetSection).classList.add('active');
    });
});

// Show the default section (Events)
document.getElementById('events').classList.add('active');
