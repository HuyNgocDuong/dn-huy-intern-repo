# Merge Conflicts & Conflict Resolution

## 🔍 What Causes Merge Conflicts in Git?

A **merge conflict** in Git occurs when Git tries to automatically combine changes from different branches but cannot determine which version to keep. This usually happens when:

1. **Two branches edit the same line in a file** – Git doesn’t know which version to use.
2. **One branch deletes a file while another edits it** – Git doesn’t know whether to delete or keep the changes.
3. **Two branches edit nearby lines**, and the changes are close enough that Git can’t auto-resolve the merge.

These conflicts are **normal and expected** when working in teams or with multiple branches. Git flags them so the developer can resolve the conflict manually.

---

## ✅ My Merge Conflict Example

### Step 1: Create a Branch and Edit a File

I created a new branch called `feature-branch`.

In this branch, I opened `example.txt` and edited the first line to say:

> This is the change from the feature branch
> 

I saved the file and committed the change.

---

### Step 2: Switch to Main and Make a Conflicting Edit

I then switched back to the `main` branch.

I opened the same file (`example.txt`) and edited the **same line** to:

> This is the change from the main branch
> 

I committed this change as well.

---

### Step 3: Merge Feature Branch into Main

While on `main`, I tried to merge `feature-branch` using **GitHub Desktop**.

Git could not complete the merge automatically and showed a conflict warning:

> ⚠️ “Resolve conflicts before merge”
> 

It pointed out that `example.txt` had a conflict.

---

### Step 4: Resolving the Conflict

I opened the file in VS Code. Git inserted **conflict markers** like this:

```
<<<<<<< HEAD
This is the change from the main branch
=======
This is the change from the feature branch
>>>>>>> feature-branch

```

I decided to **keep the main branch’s version**, so I deleted the markers and saved the file like this:

> This is the change from the main branch
> 

Back in GitHub Desktop, I clicked **“Mark as resolved”**, then **“Continue merge”**, and committed the resolution.

---

## 📄 Final Result

After resolving the conflict and completing the merge:

- The `main` branch now contains the line:
    
    > This is the change from the main branch
    > 
- The changes from `feature-branch` were **not included**, because I chose to keep the `main` branch's version during the conflict resolution.
- I pushed the changes to GitHub successfully using **“Push origin”** in GitHub Desktop.

---

## 🧠 What I Learned

- **Merge conflicts are common** when two branches modify the same line.
- Git can’t make assumptions — **it relies on the developer to resolve conflicts manually**.
- Conflict markers (`<<<<<<<`, `=======`, `>>>>>>>`) clearly show the differences between branches.
- Tools like **GitHub Desktop** and **VS Code** make resolving conflicts easier without needing terminal commands.
- It’s important to carefully choose which version to keep (or combine both) depending on the situation.
- I now feel confident handling simple merge conflicts and pushing merged changes to GitHub.