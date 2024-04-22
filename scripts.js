var formMode;
var indexItem;

const utils = {

    formatCurrency(value) {
        return Number(value).toLocaleString("en-IN", {
            style: "currency",
            currency: "INR"
        });
    },

    formatDescription(description) {
        return description.charAt(0).toUpperCase() + description.slice(1);
    },

    formatAmount(value) {
        return Number(value);
    },

    formatDate(date) {
        const splittedDate = date.split("-");
        return splittedDate.reverse().join("/");
    },

    unformatAmount(value) {
        return Number(value);
    },

    unformatDate(date) {
        const splittedDate = date.split("/");
        return splittedDate.reverse().join("-");
    },

    unformatCurrency(value) {
        return Number(value.replace(/[^\d.-]/g, ""));
    }

};

const Modal = {
    toggleState(mode) {
        formMode = mode;
        Form.clearFields();
        document.querySelector('.modal-overlay').classList.toggle('active');
    },

    toggleScreen(index, confirm) {
        document.querySelector('.modal-overlay-confirm').classList.toggle('active');
        if (confirm == 'yes') Transaction.remove(index);
    },

    eventListener(eventStatus = false) {
        document.querySelector('.modal').addEventListener("click", () => eventStatus = true);
        document.querySelector('.modal-overlay').addEventListener("click", () => {
            if (!eventStatus) Modal.toggleState();
            else eventStatus = false;
        });
    }
};

const Storage = {
    get() {
        return JSON.parse(localStorage.getItem('hide.finances:transactions')) || [];
    },
    set(transactions) {
        localStorage.setItem("hide.finances:transactions", JSON.stringify(transactions));
    }
};

const Transaction = {
    all: Storage.get(),

    add(transaction) {

        if (formMode == 'new') Transaction.all.push(transaction);
        else if (formMode == 'edit') {
            Transaction.all.splice(indexItem, 1);
            Transaction.all.push(transaction);
        }

        App.reload();
    },

    remove(index) {
        Transaction.all.splice(index, 1);

        App.reload();
    },

    edit(index) {
        Modal.toggleState('edit');
        DOM.editTransaction(index);
    },

    incomes() {
        let incomes = [0];
        Transaction.all.map(transactions => {
            if (transactions.amount > 0) incomes.push(transactions.amount);
        });

        let totalIncomes = incomes.reduce((total, value) => total + value, 0);
        return totalIncomes;
    },

    expenses() {
        let expenses = [0];
        Transaction.all.map(transactions => {
            if (transactions.amount < 0) expenses.push(transactions.amount);
        });

        let totalExpenses = expenses.reduce((total, value) => total + value, 0);
        return totalExpenses;
    },

    total() {
        let totalAmount = Transaction.incomes() + Transaction.expenses();
        return totalAmount;
    },

};

const DOM = {
    transactionsContainer: document.querySelector('#data-table tbody'),

    updateBalance() {
        const incomes = Transaction.incomes();
        const expenses = Transaction.expenses();
        const totalAmount = Transaction.total();

        document.getElementById('incomes-display').innerHTML = utils.formatCurrency(incomes);
        document.getElementById('expenses-display').innerHTML = utils.formatCurrency(expenses);
        document.getElementById('total-amount-display').innerHTML = utils.formatCurrency(totalAmount);
    },

    addTransaction(transactions, index) {

        const tr = document.createElement('tr');
        tr.innerHTML = DOM.innerHTMLTransaction(transactions, index);
        DOM.transactionsContainer.appendChild(tr);

        document.querySelector('#form h2').innerHTML = `New Transaction`;

    },

    editTransaction(index) {
        document.querySelector('#description').value = Transaction.all[index].description;
        document.querySelector('#amount').value = utils.unformatAmount(Transaction.all[index].amount);
        document.querySelector('#date').value = utils.unformatDate(Transaction.all[index].date);

        document.querySelector('#form h2').innerHTML = `Edit Transaction`;
        indexItem = index;
    },

    innerHTMLTransaction(transactions, index) {

        const formattedAmount = utils.formatCurrency(transactions.amount);
        const CSSClass = transactions.amount > 0 ? "income" : "expense";

        const html = `
        <td class="description">${transactions.description}</td>
        <td class="${CSSClass}">${formattedAmount}</td>
        <td class="date">${transactions.date}</td>
        <td class="icons-field">
            <img class="edit-icon" weight=25px height=25px onclick="Transaction.edit(${index})" src="./edit.svg" alt="logo edit transaction"/>
            <img class="remove-icon" onclick="Modal.toggleScreen(${index})" src="./minus.svg" alt="logo remove transaction"/>
        </td>
        `;
        return html;

    },

    clearTransactions() {
        DOM.transactionsContainer.innerHTML = "";
        document.querySelector('#form h2').innerHTML = `New Transaction`;
    }
};

const Form = {
    description: document.querySelector('input#description'),
    amount: document.querySelector('input#amount'),
    date: document.querySelector('input#date'),

    getValues() {
        return {
            description: Form.description.value,
            amount: Form.amount.value,
            date: Form.date.value
        };
    },

    validateFields() {
        const { description, amount, date } = Form.getValues();

        if (description.trim() === "" ||
            amount.trim() === "" ||
            date.trim() === "") throw new Error("Please fill in all fields!");
    },

    formatValues() {
        let { description, amount, date } = Form.getValues();
        description = utils.formatDescription(description);
        amount = utils.formatAmount(amount);
        date = utils.formatDate(date);

        return {
            description,
            amount,
            date
        };
    },

    saveTransaction(transaction) {
        Transaction.add(transaction);
    },

    submit(event) {
        event.preventDefault();
        try {
            Form.validateFields();
            const transaction = Form.formatValues();
            Form.saveTransaction(transaction);
            Modal.toggleState('new');
            Form.clearFields();
        }
        catch (error) {
            alert(error.message);
        }
    },

    clearFields() {
        Form.description.value = "";
        Form.amount.value = "";
        Form.date.value = "";
    }
};

const App = {

    init() {
        Transaction.all.forEach((transactions, index) => DOM.addTransaction(transactions, index));

        DOM.updateBalance();

        Storage.set(Transaction.all);

        Modal.eventListener();
    },

    reload() {
        DOM.clearTransactions();
        App.init();
    }
};

App.init();