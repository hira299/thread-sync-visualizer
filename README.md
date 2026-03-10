# ThreadSync Visualizer — OS Synchronization in Action

**ThreadSync Visualizer** is an interactive web-based simulation of the **Producer–Consumer (Bounded Buffer) problem** designed to visually demonstrate **thread synchronization concepts in Operating Systems**.

The project helps students understand how synchronization primitives such as **semaphores and mutex locks** coordinate concurrent processes accessing shared memory.

---

# Overview

Concurrency and synchronization are fundamental topics in operating systems, but they are often difficult to visualize.

ThreadSync Visualizer provides a **real-time graphical simulation** showing how producers and consumers interact with a shared buffer while synchronization mechanisms prevent race conditions and memory conflicts.

The tool simulates kernel-style behavior and provides visual feedback for each synchronization event.

---

# Key Concepts Demonstrated

The simulator models core OS synchronization mechanisms including:

• **Counting Semaphores** (Empty & Full)
• **Mutex Locks** for mutual exclusion
• **Critical Section Management**
• **Race Condition Prevention**
• **Buffer Overflow & Underflow Protection**
• **FIFO-based Shared Buffer Management**

These mechanisms ensure safe concurrent access to shared resources.

---

# Features

### Real-Time Thread Visualization

Observe producers and consumers interacting with the shared buffer in real time.

### Interactive Shared Buffer

The bounded buffer visually updates as items are produced and consumed.

### Kernel-Style Event Logs

Live logs display synchronization events such as:

* Semaphore wait / signal
* Mutex lock / unlock
* Buffer push / pop

### Configurable Workloads

Adjust the number and behavior of producers and consumers to explore different concurrency scenarios.

---

## Screenshots

![1](https://github.com/user-attachments/assets/8679fd8e-766b-48b5-bc36-6c2b822a2565)

![2](https://github.com/user-attachments/assets/dde6e541-485e-4349-98bc-62769500261d)

![4](https://github.com/user-attachments/assets/aff159dc-fc8a-4bd9-8ab5-3fac70f536d2)

![3](https://github.com/user-attachments/assets/955f054c-0b28-43ba-8afa-4d4ee105223a)


---
# Tech Stack

Frontend technologies used:

* **React**
* **TypeScript**
* **Vite**
* **Tailwind CSS**

These tools enable a responsive and fast interactive UI suitable for real-time simulations.

---

# Installation

Clone the repository:

```bash
git clone https://github.com/hira299/thread-sync-visualizer.git
```

Navigate to the project directory:

```bash
cd thread-sync-visualizer
```

Install dependencies:

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

Open the application in your browser.

---

# Learning Purpose

This project was built as an educational tool to help students and developers better understand:

* Operating System synchronization
* Multithreading behavior
* Concurrency control
* Shared memory coordination

---

# Topics

Operating Systems
Concurrency
Semaphores
Mutex
Producer–Consumer Problem
Systems Programming
React
TypeScript

---

If you want, I can also improve this README to **make it look like a top-tier GitHub project** by adding:

* Architecture diagram
* How synchronization works step-by-step
* Screenshots section
* GIF demo
* System design explanation

That can **boost your portfolio a lot.**
