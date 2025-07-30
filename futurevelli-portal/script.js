document.addEventListener('DOMContentLoaded', () => {
    // --- Slideshow Functionality ---
    const slides = document.querySelectorAll('.slide');
    let currentSlide = 0;

    function showSlide(index) {
        slides.forEach(slide => slide.classList.remove('active'));
        slides[index].classList.add('active');
    }

    function nextSlide() {
        currentSlide = (currentSlide + 1) % slides.length;
        showSlide(currentSlide);
    }

    // Initialize slideshow
    showSlide(0);
    setInterval(nextSlide, 4000); // Change slide every 4 seconds

    // --- Global State Variables (for Frontend Simulation) ---
    let isAuthenticated = false;
    let currentUserId = null; // In a real app, this would be a JWT token or user ID
    let currentUserName = "Guest"; // Placeholder

    // --- DOM Element References ---
    const profileIcon = document.getElementById('profileIcon');
    const profileDropdown = document.getElementById('profileDropdown');
    const authOptions = document.getElementById('authOptions');
    const loggedInUserDiv = document.getElementById('loggedInUser');
    const userNameDisplay = document.getElementById('userNameDisplay');
    const loginBtn = document.getElementById('loginBtn');
    const signupBtn = document.getElementById('signupBtn');
    const signOutBtn = document.getElementById('signOutBtn');

    const chatButton = document.getElementById('chatButton');
    const myComplaintsButton = document.getElementById('myComplaintsButton');
    const helpDeskButton = document.getElementById('helpDeskButton');

    const homeSection = document.getElementById('homeSection');
    const myComplaintsSection = document.getElementById('myComplaintsSection');
    const helpDeskSection = document.getElementById('helpDeskSection');

    const currentLocationSpan = document.getElementById('currentLocation');
    const heroSlideshow = document.getElementById('heroSlideshow');

    const chatPopup = document.getElementById('chatPopup');
    const closeChatButton = document.getElementById('closeChat');
    const chatBody = document.getElementById('chatBody');
    const chatInput = document.getElementById('chatInput');
    const chatSendBtn = document.getElementById('chatSendBtn');
    const anonymousComplaintCheckbox = document.getElementById('anonymousComplaint');

    const authModal = document.getElementById('authModal');
    const closeAuthModal = document.getElementById('closeAuthModal');
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');
    const switchToSignupBtn = document.getElementById('switchToSignup');
    const switchToLoginBtn = document.getElementById('switchToLogin');
    const viewProfileBtn = document.getElementById('viewProfileBtn'); // Placeholder for now

    // --- Helper Functions ---

    // Function to switch active content section
    const showSection = (sectionId) => {
        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.remove('active-section');
        });
        document.getElementById(sectionId).classList.add('active-section');
    };

    // Update profile dropdown based on auth state
    const updateProfileDropdownUI = () => {
        if (isAuthenticated) {
            authOptions.style.display = 'none';
            loggedInUserDiv.style.display = 'block';
            userNameDisplay.textContent = `Hi, ${currentUserName}`;
        } else {
            authOptions.style.display = 'block';
            loggedInUserDiv.style.display = 'none';
        }
    };

    // Add a message to the chatbox
    const addChatMessage = (message, sender) => {
        const msgDiv = document.createElement('div');
        msgDiv.classList.add('chat-message', sender === 'user' ? 'user-message' : 'bot-message');
        msgDiv.textContent = message;
        chatBody.appendChild(msgDiv);
        chatBody.scrollTop = chatBody.scrollHeight; // Scroll to bottom
    };

    // --- Event Listeners ---

    // Navbar Profile Dropdown Toggle
    profileIcon.addEventListener('click', (event) => {
        profileDropdown.classList.toggle('show');
        event.stopPropagation(); // Prevent document click from immediately closing
    });

    document.addEventListener('click', (event) => {
        if (!profileDropdown.contains(event.target) && event.target !== profileIcon) {
            profileDropdown.classList.remove('show');
        }
    });

    // Login/Signup Button in dropdown
    loginBtn.addEventListener('click', () => {
        authModal.style.display = 'flex';
        loginForm.classList.add('active-form');
        signupForm.classList.remove('active-form');
        profileDropdown.classList.remove('show');
    });

    signupBtn.addEventListener('click', () => {
        authModal.style.display = 'flex';
        signupForm.classList.add('active-form');
        loginForm.classList.remove('active-form');
        profileDropdown.classList.remove('show');
    });

    // Simulate Sign Out
    signOutBtn.addEventListener('click', () => {
        isAuthenticated = false;
        currentUserId = null;
        currentUserName = "Guest";
        updateProfileDropdownUI();
        showSection('homeSection'); // Go back to home on sign out
        profileDropdown.classList.remove('show');
        alert('You have been signed out.');
    });

    // Placeholder for View Profile
    viewProfileBtn.addEventListener('click', () => {
        alert('This would navigate to your detailed profile page!');
        profileDropdown.classList.remove('show');
    });


    // --- Auth Modal Logic ---
    closeAuthModal.addEventListener('click', () => {
        authModal.style.display = 'none';
    });

    switchToSignupBtn.addEventListener('click', () => {
        loginForm.classList.remove('active-form');
        signupForm.classList.add('active-form');
    });

    switchToLoginBtn.addEventListener('click', () => {
        signupForm.classList.remove('active-form');
        loginForm.classList.add('active-form');
    });

    // Handle Login Form Submission (Frontend Simulation)
    loginForm.querySelector('form').addEventListener('submit', async (event) => {
        event.preventDefault();
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;

        console.log('Login attempt:', { email, password });
        // --- REAL IMPLEMENTATION: Send to backend for authentication ---
        try {
            const response = await fetch('http://localhost:3000/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            const data = await response.json();

            if (response.ok) {
                isAuthenticated = true;
                currentUserId = data.userId;
                currentUserName = data.userName || email.split('@')[0];
                localStorage.setItem('jwtToken', data.token);
                localStorage.setItem('userName', currentUserName);
                localStorage.setItem('userId', currentUserId);
                
                // Update UI
                updateProfileDropdownUI();
                
                // Close the auth modal
                authModal.style.display = 'none';
                
                // Clear the form
                document.getElementById('loginEmail').value = '';
                document.getElementById('loginPassword').value = '';
                
                // Show success message
                alert('Login successful! Welcome back, ' + currentUserName);
                
                // Redirect to home section
                document.querySelectorAll('.content-section').forEach(section => {
                    section.classList.remove('active-section');
                });
                homeSection.classList.add('active-section');
                
                // Fetch user complaints if needed
                if (myComplaintsSection.classList.contains('active-section')) {
                    fetchUserComplaints(currentUserId);
                }
            } else {
                alert(`Login failed: ${data.message || 'Invalid credentials'}`);
            }
        } catch (error) {
            console.error('Login error:', error);
            alert('An error occurred during login. Please try again.');
        }
    });

    // Handle Signup Form Submission (Frontend Simulation)
    signupForm.querySelector('form').addEventListener('submit', async (event) => {
        event.preventDefault();

        try {
            // Get form values
            const name = document.getElementById('signupName').value.trim();
            const mobile = document.getElementById('signupMobile').value.trim();
            const email = document.getElementById('signupEmail').value.trim();
            const address = document.getElementById('signupAddress').value.trim();
            const password = document.getElementById('signupPassword').value;

            // Validate form data
            if (!name || !mobile || !email || !address || !password) {
                alert('Please fill in all required fields.');
                return;
            }

            // Validate email format
            if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
                alert('Please enter a valid email address.');
                return;
            }

            // Validate mobile number (assuming Indian format)
            if (!mobile.match(/^[6-9]\d{9}$/)) {
                alert('Please enter a valid 10-digit mobile number.');
                return;
            }

            // Show loading state
            const submitButton = signupForm.querySelector('.auth-submit-btn');
            const originalButtonText = submitButton.textContent;
            submitButton.textContent = 'Signing up...';
            submitButton.disabled = true;

            // Create request body
            const signupData = new FormData();
            signupData.append('name', name);
            signupData.append('mobile', mobile);
            signupData.append('email', email);
            signupData.append('address', address);
            signupData.append('password', password);

            console.log('Attempting signup with:', { name, email, mobile });

            // Make API request
            const response = await fetch('http://localhost:3000/api/auth/signup', {
                method: 'POST',
                body: signupData
            });
            
            try {
                const data = await response.json();
                
                // Reset button state
                submitButton.textContent = originalButtonText;
                submitButton.disabled = false;

                if (response.ok) {
                    // Clear the signup form
                    document.getElementById('signupName').value = '';
                    document.getElementById('signupMobile').value = '';
                    document.getElementById('signupEmail').value = '';
                    document.getElementById('signupAddress').value = '';
                    document.getElementById('signupPassword').value = '';

                    // Show success message
                    alert('Signup successful! You can now log in with your credentials.');

                    // Auto-fill login form with email for convenience
                    document.getElementById('loginEmail').value = email;
                    
                    // Switch to login form
                    signupForm.classList.remove('active-form');
                    loginForm.classList.add('active-form');

                    // Make sure home section is visible
                    document.querySelectorAll('.content-section').forEach(section => {
                        section.classList.remove('active-section');
                    });
                    homeSection.classList.add('active-section');
                } else {
                    // Handle specific error cases
                    if (data.error === 'EMAIL_EXISTS') {
                        alert('This email is already registered. Please login or use a different email.');
                    } else if (data.error === 'INVALID_DATA') {
                        alert('Please check your details and try again.');
                    } else {
                        alert(data.message || 'Signup failed. Please try again.');
                    }
                }
            } catch (error) {
                console.error('Error parsing server response:', error);
                submitButton.textContent = originalButtonText;
                submitButton.disabled = false;
                alert('The server is currently unavailable. Please try again later.');
            }
        } catch (error) {
            console.error('Signup error:', error);
            const submitButton = signupForm.querySelector('.auth-submit-btn');
            submitButton.textContent = originalButtonText;
            submitButton.disabled = false;
            
            if (!window.navigator.onLine) {
                alert('Please check your internet connection and try again.');
            } else if (error.message.includes('Failed to fetch')) {
                alert('Unable to connect to the server. Please make sure the server is running and try again.');
            } else {
                alert('An error occurred during signup. Please try again later.');
            }
        }
    });


    // --- Section Navigation ---
    myComplaintsButton.addEventListener('click', () => {
        showSection('myComplaintsSection');
        if (isAuthenticated) {
            fetchUserComplaints(currentUserId); // Fetch complaints only if logged in
        } else {
            document.getElementById('complaintsList').innerHTML = `<p class="placeholder-text">Please log in to view your complaints.</p>`;
        }
    });

    helpDeskButton.addEventListener('click', () => {
        showSection('helpDeskSection');
    });

    // Assuming home is default, but if you had a "Home" button:
    // document.getElementById('homeButton').addEventListener('click', () => {
    //     showSection('homeSection');
    // });


    // --- Geolocation Logic ---
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const lat = position.coords.latitude;
                const lon = position.coords.longitude;
                // Use a reverse geocoding service (e.g., OpenStreetMap Nominatim for client-side demo)
                fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`)
                    .then(response => response.json())
                    .then(data => {
                        const city = data.address.city || data.address.town || data.address.village || 'Unknown City';
                        const country = data.address.country || 'Unknown Country';
                        currentLocationSpan.textContent = `${city}, ${country}`;
                    })
                    .catch(error => {
                        console.error('Error fetching location data:', error);
                        currentLocationSpan.textContent = 'Location (API Error)';
                    });
            },
            (error) => {
                console.error('Geolocation error:', error);
                switch(error.code) {
                    case error.PERMISSION_DENIED:
                        currentLocationSpan.textContent = 'Location (Permission Denied)';
                        break;
                    case error.POSITION_UNAVAILABLE:
                        currentLocationSpan.textContent = 'Location (Unavailable)';
                        break;
                    case error.TIMEOUT:
                        currentLocationSpan.textContent = 'Location (Timeout)';
                        break;
                    default:
                        currentLocationSpan.textContent = 'Location (Error)';
                }
            }
        );
    } else {
        currentLocationSpan.textContent = 'Geolocation Not Supported';
    }

    // --- Hero Section Image Slideshow ---
    const heroImages = [
        'images/city-1.jpg', // Place your images in an 'images' folder
        'images/city-2.jpg',
        'images/city-3.jpg',
        'images/city-4.jpg'
    ];
    let currentImageIndex = 0;

    const updateSlideshowBackground = () => {
        heroSlideshow.style.backgroundImage = `url('${heroImages[currentImageIndex]}')`;
        currentImageIndex = (currentImageIndex + 1) % heroImages.length;
    };

    updateSlideshowBackground(); // Set initial image
    setInterval(updateSlideshowBackground, 4000); // Change image every 4 seconds


    // --- Chat Popup Logic ---
    chatButton.addEventListener('click', () => {
        chatPopup.classList.add('show');
    });

    closeChatButton.addEventListener('click', () => {
        chatPopup.classList.remove('show');
    });

    chatSendBtn.addEventListener('click', () => {
        sendMessage();
    });

    chatInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            sendMessage();
        }
    });

    async function sendMessage() {
        const message = chatInput.value.trim();
        if (message === '') return;

        addChatMessage(message, 'user');
        chatInput.value = ''; // Clear input

        const isAnonymous = anonymousComplaintCheckbox.checked;
        const token = localStorage.getItem('jwtToken');

        try {
            const response = await fetch('http://localhost:3000/api/chat', { // Replace with your backend URL
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': token ? `Bearer ${token}` : ''
                },
                body: JSON.stringify({
                    query: message,
                    userId: isAuthenticated ? currentUserId : null,
                    anonymous: isAnonymous
                })
            });
            const data = await response.json();
            addChatMessage(data.response, 'bot');
            // If it's a complaint, refresh My Complaints section if visible
            if (data.complaintId && myComplaintsSection.classList.contains('active-section')) {
                fetchUserComplaints(currentUserId);
            }
        } catch (error) {
            console.error('Error sending message to AI:', error);
            addChatMessage('Sorry, I am currently unable to connect to the AI. Please try again later.', 'bot');
        }
    }

    // --- My Complaints Section Logic (Frontend rendering only, backend will provide data) ---
    async function fetchUserComplaints(userId) {
        if (!userId) {
            document.getElementById('complaintsList').innerHTML = `<p class="placeholder-text">Please log in to view your complaints.</p>`;
            return;
        }
        const token = localStorage.getItem('jwtToken');
        try {
            const response = await fetch(`http://localhost:3000/api/complaints/${userId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const complaints = await response.json();

            const complaintsListDiv = document.getElementById('complaintsList');
            complaintsListDiv.innerHTML = ''; // Clear existing list

            if (complaints.length === 0) {
                complaintsListDiv.innerHTML = `<p class="placeholder-text">No complaints found. Start by chatting with our AI assistant!</p>`;
                return;
            }

            complaints.forEach(complaint => {
                const complaintDiv = document.createElement('div');
                complaintDiv.classList.add('complaint-item');
                let statusClass = '';
                switch (complaint.status.toLowerCase()) {
                    case 'pending': statusClass = 'status-pending'; break;
                    case 'in review': statusClass = 'status-in-review'; break;
                    case 'resolved': statusClass = 'status-resolved'; break;
                    default: statusClass = 'status-pending';
                }

                complaintDiv.innerHTML = `
                    <p><strong>ID:</strong> ${complaint.complaintId}</p>
                    <p><strong>Status:</strong> <span class="status-badge ${statusClass}">${complaint.status}</span></p>
                    <p><strong>Type:</strong> ${complaint.type || 'General'}</p>
                    <p><strong>Date:</strong> ${new Date(complaint.timestamp).toLocaleDateString()}</p>
                    <p style="flex-basis: 100%;"><strong>Description:</strong> ${complaint.description}</p>
                    ${complaint.response ? `<p style="flex-basis: 100%;"><strong>Response:</strong> ${complaint.response}</p>` : ''}
                `;
                complaintsListDiv.appendChild(complaintDiv);
            });
        } catch (error) {
            console.error('Error fetching complaints:', error);
            document.getElementById('complaintsList').innerHTML = `<p class="placeholder-text">Failed to load complaints. Please try again later.</p>`;
        }
    }

    // --- Help Desk FAQ Toggle ---
    document.querySelectorAll('.faq-question').forEach(button => {
        button.addEventListener('click', () => {
            const answer = button.nextElementSibling;
            button.classList.toggle('active');

            if (button.classList.contains('active')) {
                answer.style.maxHeight = answer.scrollHeight + "px";
            } else {
                answer.style.maxHeight = "0";
            }
        });
    });

    // Initial check for authentication token in localStorage
    const token = localStorage.getItem('jwtToken');
    if (token) {
        // In a real app, you'd validate this token with your backend
        // For this demo, we'll just assume it's valid and set user as logged in
        isAuthenticated = true;
        // You'd typically decode the JWT to get userId and userName
        // For now, simulating
        currentUserId = 'demoUserId123'; // Replace with actual ID from token decode
        currentUserName = 'Demo Citizen'; // Replace with actual name from token decode
        updateProfileDropdownUI();
    }
});