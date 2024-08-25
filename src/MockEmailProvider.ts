export class MockEmailProvider {
    private name: string;

    constructor(name: string) {
        this.name = name;
    }

    async sendEmail(email: string, content: string): Promise<boolean> {
        console.log(`Sending email via ${this.name}`);
        // Simulate random success/failure
        return Math.random() > 0.5;
    }
}
