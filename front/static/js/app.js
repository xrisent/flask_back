class App {
  constructor() {
    this.init();
  }

  async init() {
    if (auth.isAuthenticated()) {
      await this.loadHomePage();
    } else {
      await this.loadLoginPage();
    }
  }

  async loadLoginPage() {
    const response = await fetch("templates/login.html");
    const html = await response.text();
    document.getElementById("app").innerHTML = html;

    this.setupLoginForm();
  }

  async loadRegisterPage() {
    const response = await fetch("templates/register.html");
    const html = await response.text();
    document.getElementById("app").innerHTML = html;

    this.setupRegisterForm();
  }

  async loadHomePage() {
    document.getElementById("profile").innerHTML = `
            <h1>Welcome, ${auth.currentUser.name}!</h1>
            <p>Email: ${auth.currentUser.email}</p>
            <p>Role: ${
              auth.currentUser.is_librarian ? "Librarian" : "Regular User"
            }</p>
            <button id="logout-btn">Logout</button>
        `;
    if (auth.isLibrarian()) {
      await this.loadRequestsPage();
    } else {
      await this.loadBooksPage();
    }
  }

  async loadBooksPage() {
    const [booksResponse, categoriesResponse] = await Promise.all([
      fetch("templates/books.html"),
      api.getCategories(),
    ]);

    const booksHtml = await booksResponse.text();
    document.getElementById("app").innerHTML = booksHtml;

    const books = await api.getBooks();
    this.renderBooks(books);

    this.setupBookEvents();
  }

  async loadRequestsPage() {
    const [requestsResponse, requests] = await Promise.all([
      fetch("templates/requests.html"),
      api.getBorrowRequests(),
    ]);

    const requestsHtml = await requestsResponse.text();
    document.getElementById("app").innerHTML = requestsHtml;

    this.renderRequests(requests);

    this.setupRequestEvents();
  }

  renderBooks(books) {
    const booksContainer = document.getElementById("books-container");
    if (!booksContainer) return;
    console.log(books);

    booksContainer.innerHTML = books
      .map(
        (book) => `
            <div class="book" data-id="${book.id}">
                <h3>${book.name}</h3>
                <p>Author: ${book.author}</p>
                <p>Category: ${book.category}</p>
                <p>Rating: ${book.rating.toFixed(1)}</p>
                <p>Status: ${book.available ? "Available" : "Borrowed"}</p>
                ${
                  book.available
                    ? `<button class="request-btn">Request Borrow</button>`
                    : `<button class="return-btn" ${
                        book.current_borrowers[0].id === auth.currentUser.id
                          ? ""
                          : "disabled"
                      }>Return</button>`
                }
                <div class="reviews">
                    ${book.reviews
                      .map(
                        (review) => `
                        <div class="review">
                            <p>${review.text}</p>
                            <p>Rating: ${review.rating}/5</p>
                        </div>
                    `
                      )
                      .join("")}
                </div>
            </div>
        `
      )
      .join("");
  }

  renderRequests(requests) {
    const requestsContainer = document.getElementById("requests-container");
    if (!requestsContainer) return;

    requestsContainer.innerHTML = requests
      .map(
        (request) => `
            <div class="request" data-id="${request.id}">
                <h3>Book: ${request.book_name}</h3>
                <p>Requested by: ${request.user_name}</p>
                <button class="approve-btn">Approve</button>
            </div>
        `
      )
      .join("");
  }

  setupBookEvents() {
    document.querySelectorAll(".request-btn").forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        const bookId = e.target.closest(".book").dataset.id;
        try {
          await api.requestBorrow(bookId);
          alert("Borrow request submitted successfully!");
          this.loadBooksPage();
        } catch (error) {
          alert(error.message);
        }
      });
    });

    document.querySelectorAll(".return-btn").forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        const bookId = e.target.closest(".book").dataset.id;
        try {
          await api.returnBook(bookId);
          alert("Book returned successfully!");
          this.loadBooksPage();
        } catch (error) {
          alert(error.message);
        }
      });
    });
  }

  setupRequestEvents() {
    document.querySelectorAll(".approve-btn").forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        const requestId = e.target.closest(".request").dataset.id;
        try {
          await api.approveBorrowRequest(requestId);
          alert("Request approved successfully!");
          this.loadRequestsPage();
        } catch (error) {
          alert(error.message);
        }
      });
    });
  }

  setupLoginForm() {
    const form = document.getElementById("login-form");
    if (!form) return;

    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const email = document.getElementById("email").value;
      const password = document.getElementById("password").value;

      try {
        const response = await api.login(email, password);
        auth.setUser(response.user);
        await this.loadHomePage();
      } catch (error) {
        alert(error.message);
      }
    });

    const registerLink = document.getElementById("register-link");
    if (registerLink) {
      registerLink.addEventListener("click", (e) => {
        e.preventDefault();
        this.loadRegisterPage();
      });
    }
  }

  setupRegisterForm() {
    const form = document.getElementById("register-form");
    if (!form) return;

    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const name = document.getElementById("name").value;
      const email = document.getElementById("email").value;
      const password = document.getElementById("password").value;
      const isLibrarian = document.getElementById("is-librarian").checked;

      try {
        await api.register(name, email, password, isLibrarian);
        alert("Registration successful! Please login.");
        this.loadLoginPage();
      } catch (error) {
        alert(error.message);
      }
    });

    const loginLink = document.getElementById("login-link");
    if (loginLink) {
      loginLink.addEventListener("click", (e) => {
        e.preventDefault();
        this.loadLoginPage();
      });
    }
  }
}

document.addEventListener("DOMContentLoaded", () => {
  new App();
});
