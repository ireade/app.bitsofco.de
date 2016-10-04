function Toast(type, message) {
    this.toastContainerEl = document.querySelector('.toast-container');
    this.toastEl = document.querySelector('.toast');
    this._open(type, message);
}

Toast.prototype._close = function() {
    this.toastContainerEl.classList.remove('open');   
}

Toast.prototype._open = function(type, message) {
    this.toastEl.classList.remove('success', 'warning', 'danger'); 
    this.toastEl.classList.add(type);
    this.toastContainerEl.classList.add('open');   
    this.toastEl.innerHTML = `
        <p>${message}</p>
        <button type="button" aria-label="Close Message" class="close-toast btn-bare"> Close </button>
    `;
    this._addEventListeners();
}

Toast.prototype._addEventListeners = function() {
    document.querySelector('.close-toast').addEventListener('click', () => {
        this._close();
    })
}