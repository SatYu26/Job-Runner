const express = require('express');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());

const jobs = []; // Stores job details
const delay = (ms) => new Promise((res) => setTimeout(res, ms));

// Start a new job
app.post('/start_job', async (req, res) => {
    const payload = req.body;
    const jobId = jobs.length + 1;
    
    const job = {
        Id: jobId,
        Payload: payload,
        Status: "RUNNING",
        FailedTasks: [],
        Response: []
    };
    jobs.push(job);

    const jobResults = await processJob(jobId, payload);
    
    job.FailedTasks = jobResults.filter(result => result.Status === "FAILED").map(result => ({ country: result.Task, states: result.FailedStates }));
    job.Status = job.FailedTasks.length > 0 ? "FAILED" : "SUCCESS";
    job.Response = jobResults;
    
    res.status(201).json({ Id: jobId, Status: job.Status });
});

async function processJob(jobId, payload) {
    return Promise.all(payload.map(async (task) => {
        console.log(`Processing job for country: ${task.country}`);
        return await processTask(jobId, task);
    }));
}

async function processTask(jobId, task) {
    let taskStatus = "SUCCESS";
    let failedStates = [];
    
    for (const state of task.states) {
        console.log(`Processing state: ${state} for Job ID: ${jobId}`);
        const success = await processSubtask(jobId, task.country, state);
        if (!success) {
            taskStatus = "FAILED";
            failedStates.push(state);
        }
    }
    return { Task: task.country, Status: taskStatus, FailedStates: failedStates };
}

async function processSubtask(jobId, country, state) {
    for (let attempt = 0; attempt < 3; attempt++) {
        await delay(1000);
        if (Math.random() * 100 >= 40) return true;
        console.log(`Retrying state: ${state} for Job ID: ${jobId}, attempt ${attempt + 1}`);
    }
    console.log(`FAILED state: ${state} for Job ID: ${jobId}`);
    return false;
}

// Get job status
app.get('/jobs/:jobId', (req, res) => {
    const job = jobs.find(j => j.Id === parseInt(req.params.jobId));
    if (!job) return res.status(404).json({ message: "Job not found." });
    res.status(200).json(job);
});

// Retry failed tasks
app.post('/retry/:jobId', async (req, res) => {
    const jobId = parseInt(req.params.jobId);
    const job = jobs.find(j => j.Id === jobId);
    if (!job) return res.status(404).json({ message: "Job not found." });
    if (job.Status === "SUCCESS" || job.Status === "RUNNING") {
        return res.status(400).json({ message: "Job is already running or completed successfully." });
    }
    if (job.FailedTasks.length === 0) {
        return res.status(400).json({ message: "No failed tasks to retry." });
    }

    const retryResults = await processJob(jobId, job.FailedTasks);
    job.FailedTasks = retryResults.filter(result => result.Status === "FAILED").map(result => ({ country: result.Task, states: result.FailedStates }));
    job.Status = job.FailedTasks.length > 0 ? "FAILED" : "SUCCESS";
    job.Response = retryResults;
    
    res.status(201).json(job);
});

// Start Server
const PORT = 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));