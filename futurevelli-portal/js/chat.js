// Chat state management
const chatState = {
    currentStep: 0,
    complaintType: null,
    address: null,
    details: {},
    isAnonymous: true,
    currentDate: null
};

// Store for all complaints and permits
const complaintStore = {
    complaints: [],
    initialized: false,
    
    // Initialize the store
    init() {
        if (this.initialized) return;
        
        try {
            this.loadComplaints();
            this.setupEventListeners();
            this.initialized = true;
            logDebug('Complaint store initialized successfully');
        } catch (error) {
            logDebug('Failed to initialize complaint store:', error);
            this.showError();
        }
    },

    // Add new complaint/permit
    addComplaint(type, refNumber, details) {
        try {
            const complaint = {
                id: refNumber,
                type: type,
                isPermit: refNumber.startsWith('PMT'),
                address: details.address,
                description: details.description,
                status: 'Submitted',
                dateSubmitted: new Date().toISOString(),
                isAnonymous: details.isAnonymous,
                contactInfo: details.contactInfo || null,
                updates: [{
                    date: new Date().toISOString(),
                    status: 'Submitted',
                    message: 'Complaint registered successfully'
                }]
            };
            
            this.complaints.push(complaint);
            this.saveComplaints();
            this.updateComplaintsList();
            this.hideError();
            
            logDebug(`Added new ${complaint.isPermit ? 'permit request' : 'complaint'}: ${refNumber}`);
        } catch (error) {
            logDebug('Failed to add complaint:', error);
            this.showError();
        }
    },

    // Update complaint status
    updateStatus(refNumber, newStatus, message) {
        const complaint = this.complaints.find(c => c.id === refNumber);
        if (complaint) {
            complaint.status = newStatus;
            complaint.updates.push({
                date: new Date().toISOString(),
                status: newStatus,
                message: message
            });
            this.saveComplaints();
            this.updateComplaintsList();
        }
    },

    // Save to localStorage
    saveComplaints() {
        try {
            localStorage.setItem('cityComplaints', JSON.stringify(this.complaints));
            logDebug('Complaints saved successfully');
            this.hideError();
        } catch (error) {
            logDebug('Failed to save complaints:', error);
            this.showError();
        }
    },

    // Load from localStorage
    loadComplaints() {
        try {
            const saved = localStorage.getItem('cityComplaints');
            if (saved) {
                this.complaints = JSON.parse(saved);
                this.updateComplaintsList();
                this.hideError();
                logDebug(`Loaded ${this.complaints.length} complaints`);
            } else {
                this.complaints = [];
                this.updateComplaintsList();
                logDebug('No saved complaints found');
            }
        } catch (error) {
            logDebug('Failed to load complaints:', error);
            this.showError();
        }
    },

    // Setup event listeners for filters and refresh
    setupEventListeners() {
        const typeFilter = document.getElementById('complaintTypeFilter');
        const statusFilter = document.getElementById('statusFilter');
        const refreshBtn = document.getElementById('refreshComplaints');

        if (typeFilter) {
            typeFilter.addEventListener('change', () => this.updateComplaintsList());
        }
        if (statusFilter) {
            statusFilter.addEventListener('change', () => this.updateComplaintsList());
        }
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.loadComplaints());
        }
    },

    // Show error message
    showError() {
        const errorDiv = document.getElementById('complaintsError');
        if (errorDiv) {
            errorDiv.style.display = 'flex';
        }
    },

    // Hide error message
    hideError() {
        const errorDiv = document.getElementById('complaintsError');
        if (errorDiv) {
            errorDiv.style.display = 'none';
        }
    },

    // Filter complaints based on current filter settings
    getFilteredComplaints() {
        const typeFilter = document.getElementById('complaintTypeFilter');
        const statusFilter = document.getElementById('statusFilter');
        
        return this.complaints.filter(complaint => {
            const typeMatch = typeFilter.value === 'all' ||
                (typeFilter.value === 'complaints' && !complaint.isPermit) ||
                (typeFilter.value === 'permits' && complaint.isPermit);
                
            const statusMatch = statusFilter.value === 'all' ||
                complaint.status.toLowerCase().replace(' ', '-') === statusFilter.value;
                
            return typeMatch && statusMatch;
        });
    },

    // Update the My Complaints section
    updateComplaintsList() {
        const complaintsList = document.getElementById('complaintsList');
        if (!complaintsList) return;

        const filteredComplaints = this.getFilteredComplaints();

        if (filteredComplaints.length === 0) {
            complaintsList.innerHTML = '<p class="placeholder-text">No complaints found matching your filters. Try adjusting the filters or start a new chat.</p>';
            return;
        }

        complaintsList.innerHTML = filteredComplaints.map(complaint => `
            <div class="complaint-card ${complaint.status.toLowerCase().replace(' ', '-')}">
                <div class="complaint-header">
                    <span class="complaint-id">${complaint.id}</span>
                    <span class="complaint-status ${complaint.status.toLowerCase().replace(' ', '-')}">
                        ${complaint.status}
                    </span>
                </div>
                <div class="complaint-details">
                    <p><strong>Type:</strong> ${complaint.isPermit ? 'Permit Request' : 'Complaint'}</p>
                    <p><strong>Category:</strong> ${complaintTypes[complaint.type] || permitTypes[complaint.type]}</p>
                    <p><strong>Address:</strong> ${complaint.address}</p>
                    <p><strong>Submitted:</strong> ${new Date(complaint.dateSubmitted).toLocaleDateString()}</p>
                </div>
                <div class="complaint-updates">
                    ${complaint.updates.map(update => `
                        <div class="update-item">
                            <span class="update-date">${new Date(update.date).toLocaleDateString()}</span>
                            <span class="update-status">${update.status}</span>
                            <p class="update-message">${update.message}</p>
                        </div>
                    `).join('')}
                </div>
            </div>
        `).join('');
    }
};

// Complaint type prefixes and their descriptions
const complaintTypes = {
    'HWG': 'High Weeds/Grass',
    'JNK': 'Junk Vehicle',
    'CON': 'Construction (Unpermitted)',
    'NSE': 'Noise (After-Hours)',
    'SUB': 'Substandard Housing',
    'DMP': 'Illegal Dumping',
    'SGN': 'Signage/Fence Violation'
};

const permitTypes = {
    'FNC': 'Fence',
    'GAR': 'Garage Sale',
    'SPE': 'Special Event',
    'HOM': 'Home Improvement',
    'TRE': 'Tree Removal'
};

// Passport information and requirements
const passportInfo = {
    types: {
        'NORMAL': 'Normal Passport (36 pages)',
        'JUMBO': 'Jumbo Passport (60 pages)',
        'MINOR': 'Minor Passport (Below 18 years)',
        'TATKAL': 'Tatkal Passport (Urgent)'
    },
    documents: {
        general: [
            'Proof of Identity (Aadhar Card/PAN Card/Voter ID)',
            'Proof of Address (Utility Bills/Bank Statements)',
            'Birth Certificate or proof of DOB',
            'Recent passport size photographs (4)',
            'Previous passport (if renewal)'
        ],
        additional: {
            MINOR: [
                'Parents\' passport copies',
                'School ID/Bonafide certificate',
                'Parents\' consent form'
            ],
            TATKAL: [
                'Verification certificate from specified officials',
                'Additional proof of urgency'
            ]
        }
    },
    fees: {
        NORMAL: '1500 INR',
        JUMBO: '2000 INR',
        MINOR: '1000 INR',
        TATKAL: '3500 INR'
    },
    processingTime: {
        NORMAL: '30-45 days',
        JUMBO: '30-45 days',
        MINOR: '30-45 days',
        TATKAL: '1-3 working days'
    }
};

// Counter for daily complaints/permits
let dailyCounter = 1;

function handlePassportQuery(query) {
    if (query.includes('apply') || query.includes('how to get')) {
        addMessage("Here's how to apply for a passport:\n\n" +
            "1. Visit the official passport portal at passportindia.gov.in\n" +
            "2. Register/Login to the Passport Seva Portal\n" +
            "3. Fill the online application form\n" +
            "4. Schedule an appointment at your nearest Passport Seva Kendra\n" +
            "5. Pay the required fees online\n" +
            "6. Visit the Passport Seva Kendra on your appointment date\n\n" +
            "Would you like to know about:\n" +
            "- Required documents\n" +
            "- Types of passports\n" +
            "- Fees and processing time\n" +
            "Just ask about any of these topics!");
        return;
    }

    if (query.includes('document') || query.includes('required')) {
        let response = "Required Documents for Passport:\n\n";
        passportInfo.documents.general.forEach(doc => {
            response += "• " + doc + "\n";
        });
        response += "\nAdditional documents may be required for:\n" +
            "• Minors (under 18)\n" +
            "• Tatkal (urgent) passports\n" +
            "• Name change cases\n\n" +
            "Would you like specific details for any category?";
        addMessage(response);
        return;
    }

    if (query.includes('type') || query.includes('kind')) {
        let response = "Available Passport Types:\n\n";
        Object.entries(passportInfo.types).forEach(([key, value]) => {
            response += "• " + value + "\n";
            response += "  - Fee: " + passportInfo.fees[key] + "\n";
            response += "  - Processing Time: " + passportInfo.processingTime[key] + "\n\n";
        });
        addMessage(response);
        return;
    }

    if (query.includes('fee') || query.includes('cost') || query.includes('charge')) {
        let response = "Passport Fees:\n\n";
        Object.entries(passportInfo.fees).forEach(([key, value]) => {
            response += "• " + passportInfo.types[key] + ": " + value + "\n";
        });
        response += "\nNote: Additional charges may apply for verification and processing.";
        addMessage(response);
        return;
    }

    if (query.includes('time') || query.includes('duration') || query.includes('how long')) {
        let response = "Processing Times:\n\n";
        Object.entries(passportInfo.processingTime).forEach(([key, value]) => {
            response += "• " + passportInfo.types[key] + ": " + value + "\n";
        });
        response += "\nNote: Actual processing time may vary based on verification and document completeness.";
        addMessage(response);
        return;
    }

    if (query.includes('minor') || query.includes('child')) {
        let response = "Minor Passport Requirements:\n\n";
        passportInfo.documents.additional.MINOR.forEach(doc => {
            response += "• " + doc + "\n";
        });
        response += "\nAdditional Notes:\n" +
            "• Both parents must be present during the appointment\n" +
            "• Birth certificate is mandatory\n" +
            "• Processing time: " + passportInfo.processingTime.MINOR + "\n" +
            "• Fee: " + passportInfo.fees.MINOR;
        addMessage(response);
        return;
    }

    if (query.includes('tatkal') || query.includes('urgent') || query.includes('emergency')) {
        let response = "Tatkal (Urgent) Passport Information:\n\n";
        response += "• Processing Time: " + passportInfo.processingTime.TATKAL + "\n";
        response += "• Fee: " + passportInfo.fees.TATKAL + "\n\n";
        response += "Additional Requirements:\n";
        passportInfo.documents.additional.TATKAL.forEach(doc => {
            response += "• " + doc + "\n";
        });
        addMessage(response);
        return;
    }

    // Default response for passport queries
    addMessage("I can help you with passport-related information. Please ask about:\n" +
        "• How to apply for a passport\n" +
        "• Required documents\n" +
        "• Types of passports\n" +
        "• Fees and charges\n" +
        "• Processing time\n" +
        "• Minor passport requirements\n" +
        "• Tatkal/Urgent passport");
}

// Debug function to log important events
function logDebug(message) {
    console.log(`[Chat Debug] ${message}`);
}

document.addEventListener('DOMContentLoaded', function() {
    logDebug('Initializing chat system...');
    
    // Initialize complaints store
    complaintStore.init();
    
    // Initialize elements
    const chatPopup = document.getElementById('chatPopup');
    const chatButton = document.getElementById('chatButton');
    const closeChat = document.getElementById('closeChat');
    const chatInput = document.getElementById('chatInput');
    const chatSendBtn = document.getElementById('chatSendBtn');
    const chatBody = document.getElementById('chatBody');
    const anonymousCheckbox = document.getElementById('anonymousComplaint');

    // Verify all elements are found
    if (!chatPopup || !chatButton || !closeChat || !chatInput || 
        !chatSendBtn || !chatBody || !anonymousCheckbox) {
        console.error('Chat elements not found! Missing:', {
            chatPopup: !chatPopup,
            chatButton: !chatButton,
            closeChat: !closeChat,
            chatInput: !chatInput,
            chatSendBtn: !chatSendBtn,
            chatBody: !chatBody,
            anonymousCheckbox: !anonymousCheckbox
        });
        return;
    }

    logDebug('All chat elements found successfully');

    // Event listeners with debug logging
    chatButton.addEventListener('click', () => {
        logDebug('Chat button clicked');
        chatPopup.classList.add('show');
        resetChat();
        // Add initial welcome message
        addMessage("Hello! How can I assist you today?");
    });

    closeChat.addEventListener('click', () => {
        logDebug('Close chat clicked');
        chatPopup.classList.remove('show');
    });

    chatSendBtn.addEventListener('click', async () => {
        logDebug('Send button clicked');
        const message = chatInput.value.trim();
        if (!message) return;
        
        const isAnonymous = document.getElementById('anonymousComplaint').checked;
        
        // Add user message to chat
        addMessage(message, true);
        chatInput.value = '';
        
        const typingIndicator = showTypingIndicator();
        
        try {
            // Send message to backend
            const response = await window.apiUtils.chat.sendMessage(message, isAnonymous);
            typingIndicator.remove();
            
            if (response.error) {
                addMessage('Sorry, there was an error processing your request. Please try again.', false);
            } else {
                addMessage(response.message, false);
            }
        } catch (error) {
            typingIndicator.remove();
            addMessage('Sorry, there was an error connecting to the server. Please try again.', false);
        }
    });
    
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            logDebug('Enter key pressed in chat input');
            e.preventDefault();
            handleUserInput();
        }
    });

    anonymousCheckbox.addEventListener('change', (e) => {
        logDebug(`Anonymous checkbox changed: ${e.target.checked}`);
        chatState.isAnonymous = e.target.checked;
    });
});

function getCurrentDate() {
    const now = new Date();
    const yy = now.getFullYear().toString().slice(-2);
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    return `${yy}${mm}${dd}`;
}

function generateReferenceNumber(type, isPermit = false) {
    const prefix = isPermit ? 'PMT' : 'CC';
    const date = getCurrentDate();
    const sequenceNum = String(dailyCounter++).padStart(3, '0');
    return `${prefix}-${type}-${date}-${sequenceNum}`;
}

function addMessage(message, isUser = false) {
    const chatBody = document.getElementById('chatBody');
    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message ${isUser ? 'user-message' : 'bot-message'}`;
    messageDiv.textContent = message;
    chatBody.appendChild(messageDiv);
    chatBody.scrollTop = chatBody.scrollHeight;
}

function showTypingIndicator() {
    const chatBody = document.getElementById('chatBody');
    const typingDiv = document.createElement('div');
    typingDiv.className = 'typing-indicator';
    for (let i = 0; i < 3; i++) {
        const dot = document.createElement('div');
        dot.className = 'typing-dot';
        typingDiv.appendChild(dot);
    }
    chatBody.appendChild(typingDiv);
    chatBody.scrollTop = chatBody.scrollHeight;
    return typingDiv;
}

function handleUserInput() {
    const chatInput = document.getElementById('chatInput');
    const userMessage = chatInput.value.trim();
    
    if (!userMessage) return;
    
    logDebug(`Processing user input: "${userMessage}"`);
    logDebug(`Current chat state: Step ${chatState.currentStep}, Type: ${chatState.complaintType || chatState.permitType}`);
    
    addMessage(userMessage, true);
    chatInput.value = '';

    const typingIndicator = showTypingIndicator();

    // Simulate processing time
    setTimeout(() => {
        typingIndicator.remove();
        processUserInput(userMessage);
        
        // Log the state after processing
        logDebug(`After processing - Step: ${chatState.currentStep}, ` +
                 `Type: ${chatState.complaintType || chatState.permitType}, ` +
                 `Address: ${chatState.address || 'not set'}`);
    }, 1000);
}

function processUserInput(message) {
    const lowerMsg = message.toLowerCase();

    // Respond to greetings
    if (lowerMsg === 'hi' || lowerMsg === 'hello' || lowerMsg === 'hey') {
        addMessage("Hello! How can I assist you today?");
        return;
    }

    // Handle passport-related queries
    if (lowerMsg.includes('passport')) {
        handlePassportQuery(lowerMsg);
        return;
    }

    // Check if it's a reference number query
    if (lowerMsg.includes('status') && (lowerMsg.includes('cc-') || lowerMsg.includes('pmt-'))) {
        handleStatusCheck(message);
        return;
    }

    // Initial inquiry classification
    if (chatState.currentStep === 0) {
        classifyInitialInquiry(lowerMsg);
        return;
    }

    // Handle address collection
    if (chatState.currentStep === 1) {
        chatState.address = message;
        
        if (chatState.complaintType) {
            let response = "Thank you. ";
            
            // Ask about anonymity for complaints (except housing issues)
            if (chatState.complaintType !== 'SUB') {
                response += "Would you like to remain anonymous for this complaint? ";
                chatState.currentStep = 1.5;
            } else {
                response += "For housing violations, we'll need your contact information to follow up. Could you provide your name and phone number?";
                chatState.currentStep = 1.5;
            }
            
            addMessage(response);
        } else {
            // For permits, move directly to collecting details
            let response = "Thank you. ";
            if (chatState.permitType === 'FNC') {
                response += "Could you describe the type of fence you'd like to install (height, material)?";
            } else if (chatState.permitType === 'GAR') {
                response += "What dates are you planning to hold the garage sale?";
            } else if (chatState.permitType === 'SPE') {
                response += "Please provide the planned date, time, and estimated number of attendees for your event.";
            } else if (chatState.permitType === 'TRE') {
                response += "Could you describe the condition of the tree and why you believe it needs to be removed?";
            } else {
                response += "Please describe the scope of work you're planning.";
            }
            chatState.currentStep = 2;
            addMessage(response);
        }
        return;
    }

    // Handle anonymity preference
    if (chatState.currentStep === 1.5) {
        if (chatState.complaintType === 'SUB') {
            chatState.isAnonymous = false;
            chatState.contactInfo = message;
            addMessage("Thank you. Please describe the specific housing issues you're experiencing.");
        } else {
            chatState.isAnonymous = lowerMsg.includes('yes') || lowerMsg.includes('anonymous');
            addMessage("Thank you. Please provide any additional details about the issue that would help our inspector.");
        }
        chatState.currentStep = 2;
        return;
    }

    // Handle details collection
    if (chatState.currentStep === 2) {
        chatState.details.description = message;
        finalizeReport();
    }
}

function classifyInitialInquiry(message) {
    const lowerMsg = message.toLowerCase();
    let response = '';

    // High Weeds/Grass
    if (lowerMsg.includes('weed') || lowerMsg.includes('grass') || lowerMsg.includes('lawn')) {
        chatState.complaintType = 'HWG';
        response = "Yes, overgrown grass exceeding the city's height limit is a violation. Could you please provide the exact address where you've observed this issue?";
    } 
    // Junk Vehicle
    else if (lowerMsg.includes('junk') || lowerMsg.includes('abandoned') || lowerMsg.includes('vehicle')) {
        chatState.complaintType = 'JNK';
        response = "Thank you for reporting this. Inoperable vehicles parked on public streets can be a violation. Could you provide the exact location and, if possible, briefly describe the vehicle (make/model/color)?";
    } 
    // Construction Without Permit
    else if (lowerMsg.includes('construction') && !lowerMsg.includes('permit')) {
        chatState.complaintType = 'CON';
        response = "I can help you file a report about potential unpermitted construction. Could you provide the address where this construction is taking place?";
    } 
    // Noise Complaint
    else if (lowerMsg.includes('noise')) {
        chatState.complaintType = 'NSE';
        response = "I understand you're reporting a noise violation. City ordinances restrict certain noise levels and construction hours. Could you provide the address where this is occurring?";
    } 
    // Substandard Housing
    else if (lowerMsg.includes('housing') || lowerMsg.includes('apartment') || lowerMsg.includes('heat') || 
             lowerMsg.includes('living condition')) {
        chatState.complaintType = 'SUB';
        response = "I understand you're reporting a potential housing violation. This is a high-priority issue. Could you provide the complete address, including any apartment number?";
    } 
    // Illegal Dumping
    else if (lowerMsg.includes('dump') || (lowerMsg.includes('trash') && !lowerMsg.includes('can'))) {
        chatState.complaintType = 'DMP';
        response = "Illegal dumping is harmful to our environment and community. Could you provide the specific location where you observed this? Any details about vehicles or individuals involved would be helpful.";
    } 
    // Sign/Fence Violation
    else if (lowerMsg.includes('sign') || (lowerMsg.includes('fence') && !lowerMsg.includes('permit'))) {
        chatState.complaintType = 'SGN';
        response = "Thank you for bringing this to our attention. City ordinances regulate signs and fences. Could you provide the address where you've noticed this potential violation?";
    }
    // Permit Requests
    else if (lowerMsg.includes('permit')) {
        chatState.complaintType = null;
        if (lowerMsg.includes('fence')) {
            chatState.permitType = 'FNC';
            response = "Installing a new fence requires a permit. I can help you with the process. First, could you provide the address where you plan to install the fence?";
        } else if (lowerMsg.includes('garage sale')) {
            chatState.permitType = 'GAR';
            response = "Yes, the city requires a permit for garage sales. I can help process your request. Could you provide your address and the planned dates for the sale?";
        } else if (lowerMsg.includes('event') || lowerMsg.includes('party')) {
            chatState.permitType = 'SPE';
            response = "Special events, especially those involving street closures, require a permit. Could you provide the location and planned date/time for your event?";
        } else if (lowerMsg.includes('tree')) {
            chatState.permitType = 'TRE';
            response = "Removing certain trees requires a permit to protect our city's tree canopy. Could you provide your address and some details about the tree in question?";
        } else {
            chatState.permitType = 'HOM';
            response = "Many home improvement projects require permits to ensure safety and code compliance. Could you provide your address and describe the planned work?";
        }
    }
    // General Inquiries
    else {
        response = "I can help you with code compliance issues, permits, or general information about city regulations. What specific information are you looking for?";
        chatState.currentStep = 0;
        return addMessage(response);
    }

    addMessage(response);
    chatState.currentStep = 1;
}

function finalizeReport() {
    const refNumber = chatState.complaintType ? 
        generateReferenceNumber(chatState.complaintType) : 
        generateReferenceNumber(chatState.permitType, true);
    
    // Store the complaint/permit
    complaintStore.addComplaint(
        chatState.complaintType || chatState.permitType,
        refNumber,
        {
            address: chatState.address,
            description: chatState.details.description,
            isAnonymous: chatState.isAnonymous,
            contactInfo: chatState.contactInfo
        }
    );

    let response = '';
    
    if (chatState.complaintType) {
        // Complaint responses
        switch(chatState.complaintType) {
            case 'HWG':
                response = `Thank you. The complaint regarding high weeds/grass at ${chatState.address} has been lodged ${chatState.isAnonymous ? 'anonymously' : 'with your contact information'}.\n\n` +
                          `Reference Number: ${refNumber}\n\n` +
                          `An inspection will be scheduled, and the property owner will be notified if a violation is confirmed.`;
                break;
            case 'JNK':
                response = `Thank you. The complaint for the inoperable vehicle at ${chatState.address} has been filed ${chatState.isAnonymous ? 'anonymously' : 'with your contact information'}.\n\n` +
                          `Reference Number: ${refNumber}\n\n` +
                          `We will investigate and take appropriate action, such as notifying the owner or tagging the vehicle.`;
                break;
            case 'CON':
                response = `The report for suspected unpermitted construction at ${chatState.address} has been filed ${chatState.isAnonymous ? 'anonymously' : 'with your contact information'}.\n\n` +
                          `Reference Number: ${refNumber}\n\n` +
                          `An inspector will visit the site to determine if permits are required and if work is proceeding accordingly.`;
                break;
            case 'NSE':
                response = `Complaint recorded ${chatState.isAnonymous ? 'anonymously' : 'with your contact information'} for noise violation at ${chatState.address}.\n\n` +
                          `Reference Number: ${refNumber}\n\n` +
                          `We will alert the appropriate enforcement team for investigation.`;
                break;
            case 'SUB':
                response = `A high-priority complaint has been filed regarding housing conditions at ${chatState.address}.\n\n` +
                          `Reference Number: ${refNumber}\n\n` +
                          `An inspector will be scheduled to visit within 1-2 business days due to the nature of the complaint. They will contact you using the provided information.`;
                break;
            case 'DMP':
                response = `Report filed for illegal dumping at ${chatState.address}.\n\n` +
                          `Reference Number: ${refNumber}\n\n` +
                          `I will notify both the sanitation department and code enforcement for cleanup and investigation.`;
                break;
            case 'SGN':
                response = `Complaint filed ${chatState.isAnonymous ? 'anonymously' : 'with your contact information'} regarding potentially non-compliant signage/fencing at ${chatState.address}.\n\n` +
                          `Reference Number: ${refNumber}\n\n` +
                          `An inspector will check the situation against our ordinances.`;
                break;
        }
    } else {
        // Permit responses
        switch(chatState.permitType) {
            case 'FNC':
                response = `I've started your fence permit application for ${chatState.address}.\n\n` +
                          `Reference Number: ${refNumber}\n\n` +
                          `You will need to submit:\n` +
                          `- Completed application form\n` +
                          `- Simple site plan showing fence location\n` +
                          `- Fence specifications (height, material)\n\n` +
                          `Would you like me to email you the full application package?`;
                break;
            case 'GAR':
                response = `Your garage sale permit for ${chatState.address} has been processed.\n\n` +
                          `Reference Number: ${refNumber}\n\n` +
                          `Please remember:\n` +
                          `- Signs must be on private property only\n` +
                          `- Remove all signs after the sale\n` +
                          `- Sales limited to 3 days maximum`;
                break;
            case 'SPE':
                response = `Special event permit application started for ${chatState.address}.\n\n` +
                          `Reference Number: ${refNumber}\n\n` +
                          `You will need to provide:\n` +
                          `- Detailed site plan\n` +
                          `- Traffic control plan\n` +
                          `- Neighbor notifications\n` +
                          `Would you like the full application package emailed to you?`;
                break;
            case 'HOM':
                response = `Home improvement permit application initiated for ${chatState.address}.\n\n` +
                          `Reference Number: ${refNumber}\n\n` +
                          `Based on your description, you'll need to submit:\n` +
                          `- Detailed plans\n` +
                          `- Contractor information\n` +
                          `- Specific scope of work\n\n` +
                          `Would you like me to email you the application package?`;
                break;
            case 'TRE':
                response = `Tree removal permit application started for ${chatState.address}.\n\n` +
                          `Reference Number: ${refNumber}\n\n` +
                          `Next steps:\n` +
                          `- City arborist will need to inspect the tree\n` +
                          `- Photos of the tree's condition are helpful\n` +
                          `- Replacement tree may be required\n\n` +
                          `Would you like the full application package emailed to you?`;
                break;
        }
    }

    response += `\n\nYou can check the status anytime by providing your reference number. Is there anything else I can help you with today?`;

    addMessage(response);
    resetChat();
}

function determinePermitType(description) {
    const desc = description.toLowerCase();
    if (desc.includes('fence')) return 'FNC';
    if (desc.includes('garage sale')) return 'GAR';
    if (desc.includes('event')) return 'SPE';
    if (desc.includes('home') || desc.includes('remodel')) return 'HOM';
    if (desc.includes('tree')) return 'TRE';
    return 'HOM'; // Default to home improvement
}

function handleStatusCheck(message) {
    // Extract reference number using regex
    const refMatch = message.match(/(CC|PMT)-[A-Z]+-\d{6}-\d{3}/);
    if (refMatch) {
        const refNumber = refMatch[0];
        // In a real application, this would query a database
        addMessage(`Status for ${refNumber}:\nSubmitted on: ${refNumber.split('-')[2]}\nStatus: In Progress\n\nA city inspector will be assigned to your case within 2-3 business days.`);
    } else {
        addMessage("Please provide a valid reference number in the format CC-XXX-YYMMDD-NNN or PMT-XXX-YYMMDD-NNN");
    }
}

function resetChat() {
    chatState.currentStep = 0;
    chatState.complaintType = null;
    chatState.address = null;
    chatState.details = {};
}
