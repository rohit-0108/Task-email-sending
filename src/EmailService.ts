import { MockEmailProvider } from "./MockEmailProvider";

export class EmailService {
    private provider1: MockEmailProvider;
    private provider2: MockEmailProvider;
    private sentEmails: Set<string>;
    private maxRetries: number;
    private rateLimit: number;
    private rateLimitWindow: number;
    private emailQueue: string[];
    private sending: boolean;
    private log: string[];

    constructor() {
        this.provider1 = new MockEmailProvider("Provider1");
        this.provider2 = new MockEmailProvider("Provider2");
        this.sentEmails = new Set();
        this.maxRetries = 3;
        this.rateLimit = 5; // max emails per window
        this.rateLimitWindow = 60000; // 1 minute
        this.emailQueue = [];
        this.sending = false;
        this.log = [];
    }

    private async retryWithBackoff(attempt: number, email: string, content: string): Promise<boolean> {
        const delay = (2 ** attempt) * 1000;
        return new Promise(resolve => setTimeout(async () => {
            resolve(await this.sendEmail(email, content, attempt + 1));
        }, delay));
    }

    private async sendWithFallback(email: string, content: string): Promise<boolean> {
        let success = await this.provider1.sendEmail(email, content);
        if (!success) {
            success = await this.provider2.sendEmail(email, content);
        }
        return success;
    }

    private async sendEmailInternal(email: string, content: string, attempt: number): Promise<boolean> {
        const success = await this.sendWithFallback(email, content);
        if (success) {
            this.sentEmails.add(email);
            this.log.push(`Success: Email sent to ${email}`);
            console.log(`Email successfully sent to ${email}`);
            return true;
        } else {
            this.log.push(`Failed: Retrying email to ${email}`);
            return await this.retryWithBackoff(attempt, email, content);
        }
    }

    async sendEmail(email: string, content: string, attempt = 1): Promise<boolean> {
        if (this.sentEmails.has(email)) {
            console.log(`Email to ${email} has already been sent (idempotent).`);
            return true;
        }

        if (attempt > this.maxRetries) {
            console.log(`Max retries reached for ${email}.`);
            return false;
        }

        return await this.sendEmailInternal(email, content, attempt);
    }

    private async processQueue(): Promise<void> {
        if (this.sending) return;
        this.sending = true;

        let emailsSentInWindow = 0;
        const windowStartTime = Date.now();

        while (this.emailQueue.length > 0 && emailsSentInWindow < this.rateLimit) {
            const email = this.emailQueue.shift();
            if (email) {
                const success = await this.sendEmail(email, "Hello!");
                if (success) {
                    emailsSentInWindow++;
                }
            }

            if (Date.now() - windowStartTime >= this.rateLimitWindow) {
                emailsSentInWindow = 0;
            }
        }

        this.sending = false;
    }

    enqueueEmail(email: string) {
        this.emailQueue.push(email);
        this.processQueue();
    }

    getLog(): string[] {
        return this.log;
    }
}
