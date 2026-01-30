class BlogView {
    constructor() {
        this.postsContainer = null;
        this.formContainer = null;
        this.loadingIndicator = null;
        this.errorContainer = null;
        this.currentEditId = null;
        this.observers = [];
        this.editModal = null;
        this.editFormContainer = null;

        // Bind methods to maintain context
        this.renderPosts = this.renderPosts.bind(this);
        this.renderPostForm = this.renderPostForm.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
        this.handleEdit = this.handleEdit.bind(this);
        this.handleDelete = this.handleDelete.bind(this);
        this.showLoading = this.showLoading.bind(this);
        this.hideLoading = this.hideLoading.bind(this);
        this.showError = this.showError.bind(this);
        this.hideError = this.hideError.bind(this);
        this.showEditModal = this.showEditModal.bind(this);
        this.hideEditModal = this.hideEditModal.bind(this);
        this.renderEditForm = this.renderEditForm.bind(this);
    }

    // Observer pattern implementation
    addObserver(observer) {
        this.observers.push(observer);
    }

    removeObserver(observer) {
        this.observers = this.observers.filter((obs) => obs !== observer);
    }

    notifyObservers(event, data) {
        this.observers.forEach((observer) => {
            if (observer[event]) {
                observer[event](data);
            }
        });
    }

    // Initialization
    initialize() {
        this.setupDOMElements();
        this.renderPostForm();
        this.notifyObservers('onViewInitialized');
    }

    setupDOMElements() {
        this.postsContainer = document.getElementById('posts-container');
        this.formContainer = document.getElementById('form-container');
        this.loadingIndicator = document.getElementById('loading-indicator');
        this.errorContainer = document.getElementById('error-container');
        this.editModal = document.getElementById('edit-modal');
        this.editFormContainer = document.getElementById('edit-form-container');

        if (
            !this.postsContainer ||
            !this.formContainer ||
            !this.loadingIndicator ||
            !this.errorContainer
        ) {
            throw new Error('Required DOM elements not found. Check HTML structure.');
        }
    }

    // Rendering methods
    renderPosts(posts) {
        if (!posts || posts.length === 0) {
            this.postsContainer.innerHTML = `
        <div class="no-posts">
          <h3>No blog posts yet</h3>
          <p>Be the first to create a blog post!</p>
        </div>
      `;
            return;
        }

        this.postsContainer.innerHTML = posts
            .map((post) => this.renderPostCard(post))
            .join('');
        this.attachPostEventListeners();
    }

    renderPostCard(post) {
        const formattedDate = this.formatDate(post.createdAt);
        const isEditing = this.currentEditId === post.id;

        return `
      <article class="post-card" data-post-id="${post.id}">
        <div class="post-header">
          <h2 class="post-title">${this.escapeHtml(post.title)}</h2>
          <div class="post-meta">
            <span class="post-date">${formattedDate}</span>
            ${
            post.updatedAt !== post.createdAt
                ? '<span class="post-updated">Updated</span>'
                : ''
        }
          </div>
        </div>
        <div class="post-content">
          ${this.renderPostContent(post.content)}
        </div>
        <div class="post-actions">
          <button class="btn btn-edit" data-action="edit" data-post-id="${
            post.id
        }">
            <span class="icon">✏️</span> Edit
          </button>
          <button class="btn btn-delete" data-action="delete" data-post-id="${
            post.id
        }">
            <span class="icon">🗑️</span> Delete
          </button>
        </div>
      </article>
    `;
    }

    // renderPostContent(content) {}
    renderPostContent(content) {
        if (!content) return '';

        // Wrap in paragraph tags for better formatting
        return content
            .split('\n')
            .filter(line => line.trim() !== '') // Remove empty lines
            .map(line => `<p>${this.escapeHtml(line)}</p>`)
            .join('');
    }

    // renderPostForm {}
    renderPostForm() {
        this.formContainer.innerHTML = `
      <form id="post-form" class="blog-form">
        <div class="form-group">
          <label for="title">Title</label>
          <input type="text" id="title" name="title" placeholder="Enter post title" required>
          <div id="title-error" class="error-message" style="display: none"></div>
        </div>
        
        <div class="form-group">
          <label for="content">Content</label>
          <textarea id="content" name="content" rows="4" placeholder="Write your content here..." required></textarea>
          <div id="content-error" class="error-message" style="display: none"></div>
        </div>
        
        <div class="form-actions">
          <button type="submit" class="btn btn-primary">
            <span class="icon">🚀</span> Publish Post
          </button>
        </div>
      </form>
    `;

        // Attach listener immediately after rendering
        const form = document.getElementById('post-form');
        if (form) {
            form.addEventListener('submit', this.handleSubmit);
        }
    }

    // Event handling
    attachPostEventListeners() {
        this.postsContainer.addEventListener('click', (e) => {
            const action = e.target.closest('[data-action]');
            if (!action) return;

            // Ensure postId is a number to match model's numeric IDs
            const postId = Number(action.dataset.postId);
            const actionType = action.dataset.action;

            switch (actionType) {
                case 'edit':
                    this.handleEdit(postId);
                    break;
                case 'delete':
                    this.handleDelete(postId);
                    break;
            }
        });
    }

    attachFormEventListeners() {
        const form = document.getElementById('post-form');
        const cancelEdit = document.getElementById('cancel-edit');

        if (form) {
            form.addEventListener('submit', this.handleSubmit);
        }

        if (cancelEdit) {
            cancelEdit.addEventListener('click', () => this.cancelEdit());
        }
    }

    handleSubmit(e) {
        e.preventDefault();

        const formData = new FormData(e.target);
        const postData = {
            title: formData.get('title').trim(),
            content: formData.get('content').trim(),
        };

        // Clear previous errors
        this.clearFormErrors();

        // Validate form
        const errors = this.validateForm(postData);
        if (errors.length > 0) {
            this.displayFormErrors(errors);
            return;
        }

        if (this.currentEditId) {
            this.notifyObservers('onPostUpdate', {
                id: this.currentEditId,
                ...postData,
            });
        } else {
            this.notifyObservers('onPostCreate', postData);
        }
    }

    handleEdit(postId) {
        const post = this.notifyObservers('onPostEdit', postId);
        // The controller should handle the edit logic and call showEditModal
    }

    //   showEditModal(postData) {}
    showEditModal(postData) {
        this.currentEditId = postData.id;
        this.renderEditForm(postData);

        if (this.editModal) {
            this.editModal.style.display = 'block';
        }

        this.attachEditFormEventListeners();
    }

    //   hideEditModal() {}
    hideEditModal() {
        if (this.editModal) {
            this.editModal.style.display = 'none';
        }
        this.currentEditId = null;
        this.editFormContainer.innerHTML = ''; // Empty the modal container every time we close it
    }


    //  renderEditForm(postData) {}
    renderEditForm(postData) {
        // Same Ui but IDs handles propely to prevent conflict
        this.editFormContainer.innerHTML = `
      <form id="edit-post-form" class="blog-form">
        <div class="form-group">
          <label for="edit-title">Title</label>
          <input type="text" id="edit-title" name="title" value="${this.escapeHtml(postData.title)}" required>
          <div id="edit-title-error" class="error-message" style="display: none"></div>
        </div>
        
        <div class="form-group">
          <label for="edit-content">Content</label>
          <textarea id="edit-content" name="content" rows="6" required>${this.escapeHtml(postData.content)}</textarea>
          <div id="edit-content-error" class="error-message" style="display: none"></div>
        </div>
        
        <div class="form-actions">
          <button type="button" id="cancel-edit-btn" class="btn btn-secondary">Cancel</button>
          <button type="submit" class="btn btn-primary">Save Changes</button>
        </div>
      </form>
    `;
    }


    //   attachEditFormEventListeners() {}
    attachEditFormEventListeners() {
        const form = document.getElementById('edit-post-form');
        const cancelBtn = document.getElementById('cancel-edit-btn');
        const closeXBtn = document.getElementById('close-edit-modal'); // From your HTML

        // Edit Submit
        if (form) {
            form.addEventListener('submit', this.handleEditSubmit.bind(this));
        }

        // Cancel Button
        if (cancelBtn) {
            cancelBtn.addEventListener('click', this.hideEditModal.bind(this));
        }

        // X Button
        if (closeXBtn) {
            closeXBtn.addEventListener('click', this.hideEditModal.bind(this));
        }

        // Outside the modal
        window.onclick = (event) => {
            if (event.target === this.editModal) {
                this.hideEditModal();
            }
        };
    }


    // async handleEditSubmit(e) {}
    async handleEditSubmit(e) {
        e.preventDefault();

        const formData = new FormData(e.target);
        const postData = {
            title: formData.get('title').trim(),
            content: formData.get('content').trim(),
        };

        this.clearEditFormErrors();

        // Validate
        const errors = this.validateForm(postData); // We reuse the validation logic
        if (errors.length > 0) {
            this.displayEditFormErrors(errors);
            return;
        }

        this.notifyObservers('onPostUpdate', {
            id: this.currentEditId,
            ...postData
        });
    }


    //   clearEditFormErrors() {}
    clearEditFormErrors() {
        if (!this.editFormContainer) return;

        const errorElements = this.editFormContainer.querySelectorAll('.error-message');
        const inputElements = this.editFormContainer.querySelectorAll('.error');

        errorElements.forEach(el => el.style.display = 'none');
        inputElements.forEach(el => el.classList.remove('error'));
    }


    //  displayEditFormErrors(errors) {}
    displayEditFormErrors(errors) {
        errors.forEach((error) => {
            const errorElement = document.getElementById(`edit-${error.field}-error`);
            const inputElement = document.getElementById(`edit-${error.field}`);

            if (errorElement) {
                errorElement.textContent = error.message;
                errorElement.style.display = 'block';
            }

            if (inputElement) {
                inputElement.classList.add('error');
            }
        });
    }


    //  handleDelete(postId) {}

    // Form utilities
    populateForm(postData) {
        const titleInput = document.getElementById('title');
        const contentInput = document.getElementById('content');

        if (titleInput && contentInput) {
            titleInput.value = postData.title;
            contentInput.value = postData.content;
            this.currentEditId = postData.id;
            this.renderPostForm(); // Re-render form to show editing state
        }
    }

    clearForm() {
        const form = document.getElementById('post-form');
        if (form) {
            form.reset();
        }
        this.currentEditId = null;
        this.clearFormErrors();
        this.renderPostForm(); // Re-render form to show create state
    }

    cancelEdit() {
        this.clearForm();
    }

    validateForm(postData) {
        const errors = [];

        if (!postData.title || postData.title.length < 3) {
            errors.push({
                field: 'title',
                message: 'Title must be at least 3 characters long',
            });
        }

        if (!postData.content || postData.content.length < 10) {
            errors.push({
                field: 'content',
                message: 'Content must be at least 10 characters long',
            });
        }

        return errors;
    }

    displayFormErrors(errors) {
        errors.forEach((error) => {
            const errorElement = document.getElementById(`${error.field}-error`);
            const inputElement = document.getElementById(error.field);

            if (errorElement) {
                errorElement.textContent = error.message;
                errorElement.style.display = 'block'; // Show error messages
            }

            if (inputElement) {
                inputElement.classList.add('error');
            }
        });
    }

    clearFormErrors() {
        const errorElements = document.querySelectorAll('.error-message');
        const inputElements = document.querySelectorAll('.error');

        errorElements.forEach((element) => {
            element.textContent = '';
            element.style.display = 'none'; // Hide error messages
        });
        inputElements.forEach((element) => element.classList.remove('error'));
    }

    // UI state management
    showLoading() {
        this.loadingIndicator.style.display = 'block';
        this.hideError();
    }

    hideLoading() {
        this.loadingIndicator.style.display = 'none';
    }

    showError(message) {
        this.errorContainer.innerHTML = `
      <div class="error-message">
        <span class="error-icon">⚠️</span>
        <span class="error-text">${this.escapeHtml(message)}</span>
        <button class="error-close" onclick="this.parentElement.parentElement.style.display='none'">×</button>
      </div>
    `;
        this.errorContainer.style.display = 'block';
    }

    hideError() {
        this.errorContainer.style.display = 'none';
    }

    showSuccess(message) {
        // Simple success notification (could be enhanced with better UI)
        const successDiv = document.createElement('div');
        successDiv.className = 'success-message';
        successDiv.innerHTML = `
      <span class="success-icon">✅</span>
      <span class="success-text">${this.escapeHtml(message)}</span>
    `;

        document.body.appendChild(successDiv);

        setTimeout(() => {
            successDiv.remove();
        }, 3000);
    }

    // Utility methods
    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

window.viewExplanation = viewExplanation;
window.BlogView = BlogView;
