# Set up a terminal client

## ✅ Terminal Setup & Reflection

### 1. Which Terminal Client Did You Choose? Why?

I selected **Windows Terminal** as my terminal environment together with **PowerShell**.

- The Windows Terminal offers users a contemporary fast interface that enables full customization of command-line tools.
- The interface allows users to work with tabs and split panes while running PowerShell and WSL and Command Prompt shells from a unified interface.
- The tool integrates well with developer workflows while supporting Unicode and emoji rendering and GPU acceleration for rendering.

### 2. What Customizations (if any) Did You Make?

- I selected the **"One Half Dark"** theme because it provided better readability and a clean appearance.
- I integrated Git functionality into PowerShell through **Oh-My-Posh** to display the active Git branch and status information along with enhanced prompts.
- I added several helpful aliases to my PowerShell profile.

```powershell
Set-Alias gs git status
Set-Alias gc git commit
Set-Alias ll Get-ChildItem

```

### 3. What Was the Most Useful Command You Learned Today?

The most useful command I learned was:

```bash
grep

```

- During my time with WSL (Ubuntu) I discovered that `grep` serves as an extremely effective tool for locating text patterns both within files and output data.

Example:

```bash
cat log.txt | grep "Error"

```

- The command allowed me to locate error lines in log files at a faster rate than manual scanning.

Another helpful PowerShell command:

```powershell
Get-Process | Sort-Object CPU -Descending | Select-Object -First 5

```

- This lists the top 5 CPU-consuming processes—very useful for diagnosing slowdowns.