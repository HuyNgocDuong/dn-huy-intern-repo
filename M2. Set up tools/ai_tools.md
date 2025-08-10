# Set Up AI Tools for Development

### ✅ Choose AI tools for assistant

 **Which AI tools did you try?**

- GitHub Copilot (VS Code Extension)
- ChatGPT (via web interface)

---

### 🧪 **Experiment with Using AI for Development**

### **Artificial Intelligence testing can provide a basis for development**

**Use this 1 to create code snippets and determine the usefulness**

**Prompt Given to ChatGPT:**

The Node.js Express middleware system logs HTTP method requests as well as their request paths.

**Code Snippet Returned:**

```jsx
function loggerMiddleware(req, res, next) {
  console.log(`${req.method} ${req.path}`);
  next();
}

app.use(loggerMiddleware);

```

**Usefulness Analysis:**

- This approach provides fast solutions for common operations such as logging and validation and response transformation.
- I utilized this feature to find basic syntax while working on small tasks and save time from writing code blocks.
- The code requires manual editing before it becomes useful for more complex middleware functions which need to process authentication tokens and log headers.

---

### **The second part demonstrates the use of artificial intelligence for debugging a basic issue.**

**Problem:**

I encountered a CORS error from my Vue component while it tried to fetch data from the backend API.

**I asked ChatGPT this question:**

> “Why am I getting a CORS error when calling an API from Vue frontend?”
> 

**Response Summary:**

- ChatGPT explained that:
    - Access-Control-Allow-Origin headers were missing in the backend server.
    - The suggested solution involved the use of Express middleware for CORS implementation with `cors`.

```jsx
const cors = require('cors');
app.use(cors());

```

**Outcome:**

- The implementation of the cors middleware happened in my Express backend.
- The frontend responded successfully after fewer than five minutes which resolved the issue.
- The additional explanation from ChatGPT explained both the reason behind CORS existence and its repair methods.

---

### **The third activity involves seeking explanations from AI regarding novel concepts.**

**Concept:**

The Repository Pattern in C# (used in ASP.NET Core)

**The user asked ChatGPT to explain C# Repository Pattern with an example.**

**Summary Response:**

- The Repository Pattern functions as an interface between business logic and data access systems in the application.
- A basic interface along with implementation followed the response.

```csharp
public interface IProductRepository {
    IEnumerable<Product> GetAll();
    Product GetById(int id);
    void Add(Product product);
}

```

- The constructor of the ProductRepository class receives an AppDbContext object through which it accesses the context.
- The AppDbContext `_context` field inside the ProductRepository class stores a reference to the context.

```csharp
public ProductRepository(AppDbContext context) {
    _context = context;
}

```

- The `GetAll` method retrieves all products from the database through the `_context.Products.ToList()` method.
- The `GetById` method returns the product with the specified ID from the database by using `_context.Products.Find(id)`.
- The `Add` method adds new products to the database by using `_context.Products.Add(product)`.

---

**Usefulness:**

- The explanation provided by this source explained the concept of the Repository Pattern clearly with a simple approach.
- I started my ASP.NET project by utilizing the code provided in this response.
- The code required modification for asynchronous operations and additional validation features.

---

### ✅ AI Reflection

**1. What worked well?**

**GitHub Copilot:**

- The tool provided quick and context-based boilerplate code completion for loops and conditionals and standard function patterns.
- The tool assisted in creating tests and completing implementation code after users provided function names and comments.
- The tool decreased my time needed to write repetitive code as well as syntax-heavy code.

**ChatGPT:**

- The tool provided valuable assistance during debugging sessions when I shared error messages or broken code. The system effectively detected problems in the code and generated solutions with step-by-step explanations.
- The platform provided effective learning opportunities through its explanations of Express middleware operations and C# Repository Pattern fundamentals.
- The tool provided clear line-by-line explanations of complex code through plain language when I needed additional understanding.

---

**2. What didn’t work well?**

**GitHub Copilot:**

- The tool occasionally produced incorrect code logic while adding extra lines when the comment was not specific.
- The system required manual intervention to fix complex and business-specific logic including validation rules and edge cases.
- The system failed to understand the context beyond the current file.

**ChatGPT:**

- The explanations provided by the platform were sometimes too general or lengthy unless I asked specific questions.
- The system failed to perfectly replicate code execution especially when using framework-specific tools like NestJS or working with server configurations.
- The system sometimes recommended outdated syntax or practices so users must always verify the suggestions.

---

**3. When is AI most useful for coding?**

- When generating boilerplate or repetitive code (e.g., CRUD operations, tests, or common utilities).
- The user becomes stuck with a syntax error or debugging issue and requires immediate assistance from a second opinion.
- The user needs help understanding a new concept or reading code from documentation pages.
- The user wants to find different methods to write a function or learn optimal practices for specific patterns including async handling and API structure.