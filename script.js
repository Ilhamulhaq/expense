class ExpenseTracker {
    constructor() {
        this.expenses = JSON.parse(localStorage.getItem('expenses')) || [];
        this.recognition = null;
        this.isRecording = false;
        this.lastDeletedExpense = null;
        this.setupVoiceRecognition();
        this.setupEventListeners();
        this.updateExpensesList();
        this.updateTotal();
    }

    setupVoiceRecognition() {
        if ('webkitSpeechRecognition' in window) {
            this.recognition = new webkitSpeechRecognition();
            this.recognition.continuous = false;
            this.recognition.interimResults = false;
            this.recognition.lang = 'en-US';

            this.recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript.toLowerCase();
                this.processVoiceCommand(transcript);
            };

            this.recognition.onend = () => {
                this.stopRecording();
            };

            this.recognition.onerror = (event) => {
                console.error('Speech recognition error:', event.error);
                this.stopRecording();
            };
        } else {
            alert('Speech recognition is not supported in your browser. Please use Chrome.');
        }
    }

    setupEventListeners() {
        const startButton = document.getElementById('startRecording');
        const clearButton = document.getElementById('clearExpenses');
        const undoButton = document.getElementById('undoDelete');
        
        startButton.addEventListener('click', () => this.toggleRecording());
        clearButton.addEventListener('click', () => this.clearExpenses());
        undoButton.addEventListener('click', () => this.undoLastDelete());
    }

    toggleRecording() {
        if (!this.isRecording) {
            this.startRecording();
        } else {
            this.stopRecording();
        }
    }

    startRecording() {
        if (this.recognition) {
            this.recognition.start();
            this.isRecording = true;
            document.getElementById('startRecording').classList.add('recording');
            document.getElementById('recordingStatus').textContent = 'Listening...';
        }
    }

    stopRecording() {
        if (this.recognition) {
            this.recognition.stop();
            this.isRecording = false;
            document.getElementById('startRecording').classList.remove('recording');
            document.getElementById('recordingStatus').textContent = '';
        }
    }

    processVoiceCommand(transcript) {
        console.log('Transcript:', transcript);
        
        // Extract amount using regex
        const amountMatch = transcript.match(/\$?(\d+(?:\.\d{1,2})?)/);
        const amount = amountMatch ? parseFloat(amountMatch[1]) : null;

        // Extract category
        const categories = ['food', 'transport', 'utilities', 'entertainment', 'other'];
        const category = categories.find(cat => transcript.includes(cat)) || 'other';

        // Extract description (remove amount and category from transcript)
        let description = transcript
            .replace(/\$?\d+(?:\.\d{1,2})?/, '')
            .replace(category, '')
            .trim();

        if (amount) {
            // Automatically add the expense when voice command is processed
            const expense = {
                id: Date.now(),
                description: description || 'Voice expense',
                amount,
                category,
                date: new Date().toISOString()
            };

            this.expenses.push(expense);
            this.saveExpenses();
            this.updateExpensesList();
            this.updateTotal();
            
            // Show confirmation message
            document.getElementById('recordingStatus').textContent = `Added: $${amount} for ${category}`;
            setTimeout(() => {
                document.getElementById('recordingStatus').textContent = '';
            }, 2000);
        } else {
            document.getElementById('recordingStatus').textContent = 'Could not detect amount. Please try again.';
        }
    }

    clearExpenses() {
        if (confirm('Are you sure you want to clear all expenses?')) {
            this.expenses = [];
            this.saveExpenses();
            this.updateExpensesList();
            this.updateTotal();
            document.getElementById('recordingStatus').textContent = 'All expenses cleared';
            setTimeout(() => {
                document.getElementById('recordingStatus').textContent = '';
            }, 2000);
        }
    }

    updateExpensesList() {
        const expensesList = document.getElementById('expensesList');
        expensesList.innerHTML = '';

        this.expenses.sort((a, b) => new Date(b.date) - new Date(a.date)).forEach(expense => {
            const expenseElement = document.createElement('div');
            expenseElement.className = 'expense-item';
            
            // Create expense content
            const expenseContent = document.createElement('div');
            expenseContent.className = 'expense-content';
            expenseContent.innerHTML = `
                <div class="description">${expense.description}</div>
                <div class="category">${expense.category}</div>
                <div class="amount">$${expense.amount.toFixed(2)}</div>
            `;
            
            // Create delete button
            const deleteButton = document.createElement('button');
            deleteButton.className = 'delete-btn';
            deleteButton.innerHTML = '🗑️';
            deleteButton.title = 'Delete expense';
            deleteButton.onclick = () => {
                if (confirm('Are you sure you want to delete this expense?')) {
                    // Store the expense before deleting
                    this.lastDeletedExpense = expense;
                    // Remove from expenses array
                    const index = this.expenses.findIndex(e => e.id === expense.id);
                    if (index !== -1) {
                        this.expenses.splice(index, 1);
                        // Update localStorage
                        this.saveExpenses();
                        // Remove from DOM
                        expenseElement.remove();
                        // Update total
                        this.updateTotal();
                        // Enable undo button
                        document.getElementById('undoDelete').disabled = false;
                    }
                }
            };
            
            expenseElement.appendChild(expenseContent);
            expenseElement.appendChild(deleteButton);
            expensesList.appendChild(expenseElement);
        });
    }

    updateTotal() {
        const total = this.expenses.reduce((sum, expense) => sum + expense.amount, 0);
        document.getElementById('totalExpenses').textContent = `Total: $${total.toFixed(2)}`;
    }

    saveExpenses() {
        localStorage.setItem('expenses', JSON.stringify(this.expenses));
    }

    undoLastDelete() {
        if (this.lastDeletedExpense) {
            // Add the last deleted expense back to the array
            this.expenses.push(this.lastDeletedExpense);
            // Update localStorage
            this.saveExpenses();
            // Update the UI
            this.updateExpensesList();
            this.updateTotal();
            // Clear the last deleted expense
            this.lastDeletedExpense = null;
            // Disable undo button
            document.getElementById('undoDelete').disabled = true;
        }
    }
}

// Initialize the expense tracker when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new ExpenseTracker();
});
