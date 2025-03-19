# Building a Job Runner

## Overview
You are tasked with building a **Job Runner System** that can handle **queuing, running, and returning the status of jobs**. Each job consists of a set of **parallel tasks**, and each task contains **serially executed subtasks**. The system should also handle **retries for failed subtasks** and provide **status updates** for each job.

---

## Terminology
- **Job** → End-to-end execution for a list of **countries** and **states**.
- **Task** → Execution for a **single country**.
- **Subtasks** → Execution for a **single state**.

### Job Statuses
- **SUCCESS** → All tasks have successfully completed.
- **RUNNING** → At least one task is currently running.
- **FAILED** → At least one task has failed, and others may have completed.

---

## Requirements

### **1. Input Format**
The input to the job runner is a **list of dictionaries** representing **countries and their respective states**. Each **country task** runs in **parallel**, while each **state subtask** runs **serially**.

#### **Example Input:**
```json
[
  {  
    "country": "India",
    "states": ["AP", "UP", "Bihar"]
  },
  { 
    "country": "US",
    "states": ["California", "Washington", "New York"]
  }
]
```

### **2. Error Handling**
- If any **state subtask fails**, it should be **retried up to 3 times**.
- If it still fails after 3 retries, the **entire country task should be paused**.
- Failure of **subtasks in one country should not impact other countries**.
- If **all tasks fail**, the **job should be marked as FAILED**.

### **3. Retry Logic**
- If a **job is retried**:
  - If the job was **successful**, return **success**.
  - If the job is **still running**, do **not execute a new job**, the **original job continues running**.
  - If the job **failed**, **only incomplete subtasks should be rerun**.

### **4. APIs**
The system should expose the following **API endpoints**:

#### **Start a Job**
- **Endpoint**: `POST /start_job`
- **Request Payload**:
  ```json
  {
    "countries": [
      {
        "country": "India",
        "states": ["AP", "UP", "Bihar"]
      },
      {
        "country": "US",
        "states": ["California", "Washington", "New York"]
      }
    ]
  }
  ```
- **Response**:
  ```json
  {
    "run_id": "123456"
  }
  ```
  - The job **should run in the background**.

#### **Retry a Job**
- **Endpoint**: `POST /retry_job/{run_id}`
- **Request**: `run_id` of the job to be retried.
- **Response**:
  ```json
  {
    "status": "retrying"
  }
  ```

#### **Get Job Status**
- **Endpoint**: `GET /get_job_status/{run_id}`
- **Request**: `run_id` of the job.
- **Response Example**:
  ```json
  {
    "status": "RUNNING",
    "progress": 75,
    "completed_tasks": 3,
    "failed_tasks": 1
  }
  ```

---

## Tasks to Complete
- **Design the data structures** and **algorithms** required for the **job runner system**.
- **Implement the logic** for starting a job with the given payload.
- **Implement the logic** for retrieving the status of a job using its **run_id**.
- **Ensure the system follows the specified requirements**, including **error handling** and **retry logic**.

---

## Summary
The job runner system is responsible for managing **parallel country-level tasks** and **serial state-level subtasks**, ensuring **error handling, retry mechanisms, and job status tracking**. This system should be implemented in a **scalable, efficient, and fault-tolerant manner**.
