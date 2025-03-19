const express = require('express');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());

const jobs = []; // {Id, Payload, Response, FailedTasks, Status}
const delay = ms => new Promise(res => setTimeout(res, ms));
app.post('/start_job', async (req, res) => {
    const payload = req.body;
    const jobId = jobs.length + 1;
    jobs.push({ Id: jobId, Payload: payload, Status: "RUNNING", FailedTasks: [] });
    const jobsRunResponse = await Promise.allSettled(payload.map(async (job) => {
        console.log(`Running the Job for Task ${job.country}`);
        for (const state of job.states) {
            console.log(`Running Individual job for Job Id ${jobId} and state of ${state}`)
            await delay(1000);
            const randomState = Math.random() * 100;
            if (randomState < 40) {
                for (let i = 0; i < 3; i++) {
                    await delay(1000);
                    console.log(`Retrying for Job Id ${jobId} and state of ${state}`);
                }
                const randomFailState = Math.random() * 100;
                if (randomFailState < 40) {
                    console.log(`FAILED for Job Id ${jobId} and state of ${state}`);
                    jobs[jobs.findIndex(j => j.Id === jobId)].Status = "FAILED";
                    if (jobs[jobs.findIndex(j => j.Id === jobId)].FailedTasks) {
                        jobs[jobs.findIndex(j => j.Id === jobId)].FailedTasks.push(job)
                    }
                    return { Task: job.country, SubTask: state, Status: "FAILED" };
                }
            }
        }
        return { Task: job.country, Status: jobs[jobs.findIndex(j => j.Id === jobId)].Status !== "FAILED" ? "SUCCESS" : "FAILED" };
    }));
    // run through jobsRunResponse and see if any task failed and update the job status as failed if failed else success
    jobs[jobs.findIndex(j => j.Id === jobId)].Status = jobs[jobs.findIndex(j => j.Id === jobId)].Status !=="FAILED" ? "SUCCESS" : "FAILED";
    jobs[jobs.findIndex(j => j.Id === jobId)].Response = jobsRunResponse;
    res.status(201).json({Id: jobId, Status: jobs[jobs.findIndex(j => j.Id === jobId)].Status});
});

app.get('/jobs/:jobId', (req, res) => {
    const jobId = req.params.jobId;
    const job = jobs.find(j => j.Id === parseInt(jobId));
    if (!job) return res.status(404).json({ message: "Job not found." });
    res.status(200).json(job);
});

app.get('/retry/:JobId', async (req, res) => {
    // retry only the failed jobs again
    const jobId = req.params.JobId;
    const job = jobs.find(j => j.Id === parseInt(jobId));
    if (job.Status == 'SUCCESS' || job.Status == 'RUNNING') {
        return res.status(400).json(job);
    }
    if (!job) return res.status(404).json({ message: "Job not found." });
    const failedTasks = job.FailedTasks;
    jobs[jobs.findIndex(j => j.Id === jobId)] = {
        Id: job.Id,
        Payload: job.Payload,
        Status: "FAILED",
        Response: job.Response,
        FailedTasks: [],
    };
    const jobsRunResponse = await Promise.allSettled(job.FailedTasks.map(async (job) => {
        console.log(`Running the Job for Task ${job.country}`);
        for (const state of job.states) {
            await delay(1000);
            console.log(`Running Individual job for Job Id ${jobId} and state of ${state}`);
            const randomState = Math.random() * 100;
            if (randomState < 40) {
                for (let i = 0; i < 3; i++) {
                    await delay(1000);
                    console.log(`Retrying for Job Id ${jobId} and state of ${state}`);
                }
                const randomFailState = Math.random() * 100;
                if (randomFailState < 40) {
                    console.log(`FAILED for Job Id ${jobId} and state of ${state}`);
                    if (jobs[jobs.findIndex(j => j.Id === jobId)].FailedTasks) {
                        jobs[jobs.findIndex(j => j.Id === jobId)].FailedTasks = jobs[jobs.findIndex(j => j.Id === jobId)].FailedTasks.push(job)
                    }
                    jobs[jobs.findIndex(j => j.Id === jobId)].Status = "FAILED";
                    return { Task: job.country, SubTask: state, Status: "FAILED" };
                }
            }
        }
        return { Task: job.country, Status: jobs[jobs.findIndex(j => j.Id === jobId)].Status !== "FAILED" ? "SUCCESS" : "FAILED" };
    }));

    jobs[jobs.findIndex(j => j.Id === jobId)].Status = jobs[jobs.findIndex(j => j.Id === jobId)].Status !=="FAILED" ? "SUCCESS" : "FAILED";
    jobs[jobs.findIndex(j => j.Id === jobId)].Response = jobsRunResponse;
    res.status(201).json(jobs[jobs.findIndex(j => j.Id === jobId)]);
});

// Start Server
const PORT = 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));